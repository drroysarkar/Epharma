import { ConnectMSSQL, sql } from '../config/db.js';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import bwipjs from 'bwip-js';


export const addSale = async (req, res) => {
    const {
        CustomerName,
        CustomerNumber, // Added CustomerNumber
        DoctorName,
        BillDate,
        TotalAmount,
        PaidAmount, // Added PaidAmount
        CreatedBy,
        PaymentType,
        Status,
        PayAppName,
        TsNum,
        SaleItems
    } = req.body;

    // Validate SaleItems
    if (!Array.isArray(SaleItems) || SaleItems.length === 0) {
        return res.status(400).json({
            error: 'SaleItems must be a non-empty array',
            received: SaleItems
        });
    }

    try {
        const pool = await ConnectMSSQL();
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            // Generate unique BillNumber (format: YYYYMMDD-XXXX)
            const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const lastBill = await new sql.Request(transaction)
                .query(`SELECT TOP 1 BillNumber 
                        FROM SaleDetails 
                        WHERE BillNumber LIKE '${datePart}%'
                        ORDER BY BillNumber DESC`);

            let sequence = 1;
            if (lastBill.recordset.length > 0) {
                const lastSequence = parseInt(lastBill.recordset[0].BillNumber.split('-')[1]);
                sequence = lastSequence + 1;
            }
            const billNumber = `${datePart}-${sequence.toString().padStart(4, '0')}`;

            // Calculate PendingAmount
            const totalAmount = parseFloat(TotalAmount);
            const paidAmount = parseFloat(PaidAmount) || 0;
            const pendingAmount = totalAmount - paidAmount;

            // Insert or update PharmaCustomers
            const customerRequest = new sql.Request(transaction);
            const existingCustomer = await customerRequest
                .input('Mobile', sql.NVarChar, CustomerNumber)
                .query(`
                    SELECT PendingAmount
                    FROM PharmaCustomers
                    WHERE Mobile = @Mobile AND IsDeleted = 0
                `);

            if (existingCustomer.recordset.length > 0) {
                // Update existing customer
                const currentPending = parseFloat(existingCustomer.recordset[0].PendingAmount) || 0;
                const newPendingAmount = currentPending + pendingAmount;
                await customerRequest
                    .input('PendingAmount', sql.Decimal(18, 2), newPendingAmount)
                    .query(`
                        UPDATE PharmaCustomers
                        SET PendingAmount = @PendingAmount,
                            UpdatedAt = GETDATE()
                        WHERE Mobile = @Mobile AND IsDeleted = 0
                    `);
            } else {
                // Insert new customer
                await customerRequest
                    .input('CustomerName', sql.NVarChar, CustomerName)
                    .input('PendingAmount', sql.Decimal(18, 2), pendingAmount)
                    .query(`
                        INSERT INTO PharmaCustomers (
                            CustomerName, Mobile, PendingAmount, CreatedAt, IsDeleted
                        )
                        VALUES (
                            @CustomerName, @Mobile, @PendingAmount, GETDATE(), 0
                        )
                    `);
            }

            // Insert sale header with BillNumber, PaidAmount, and PendingAmount
            const saleRequest = new sql.Request(transaction);
            const saleResult = await saleRequest
                .input('CustomerName', sql.NVarChar, CustomerName)
                .input('DoctorName', sql.NVarChar, DoctorName)
                .input('BillDate', sql.Date, BillDate)
                .input('TotalAmount', sql.Decimal(18, 2), TotalAmount)
                .input('PaidAmount', sql.Decimal(18, 2), paidAmount) // Added PaidAmount
                .input('PendingAmount', sql.Decimal(18, 2), pendingAmount) // Added PendingAmount
                .input('CreatedBy', sql.NVarChar, CreatedBy)
                .input('PaymentType', sql.NVarChar, PaymentType)
                .input('Status', sql.NVarChar, Status)
                .input('BillNumber', sql.NVarChar, billNumber)
                .input('PayAppName', sql.NVarChar, PayAppName)
                .input('TsNum', sql.NVarChar, TsNum)
                .query(`
                    INSERT INTO SaleDetails (
                        CustomerName, DoctorName, BillDate, TotalAmount,
                        PaidAmount, CreatedBy, PaymentType, Status, BillNumber,
                        PayAppName, TsNum, CreatedAt, IsDeleted
                    ) 
                    OUTPUT INSERTED.SaleID
                    VALUES (
                        @CustomerName, @DoctorName, @BillDate, @TotalAmount,
                        @PaidAmount, @CreatedBy, @PaymentType, @Status, @BillNumber,
                        @PayAppName, @TsNum, GETDATE(), 0
                    )
                `);

            const saleID = saleResult.recordset[0].SaleID;

            // Insert sale items and update Pharma_Medicines
            for (const item of SaleItems) {
                // Insert into SaleItems
                await new sql.Request(transaction)
                    .input('SaleID', sql.Int, saleID)
                    .input('ItemId', sql.Int, item.MedicineId)
                    .input('ItemName', sql.NVarChar, item.ItemName)
                    .input('BatchNumber', sql.NVarChar, item.BatchNumber)
                    .input('Expiry', sql.NVarChar, item.Expiry)
                    .input('MRP', sql.Decimal(18, 2), item.MRP)
                    .input('Quantity', sql.Int, item.Quantity)
                    .input('Discount', sql.Decimal(18, 2), item.Discount)
                    .input('GST', sql.Decimal(18, 2), item.GST)
                    .input('NetAmount', sql.Decimal(18, 2), item.NetAmount)
                    .input('IsLoose', sql.Bit, item.SaleType === "Loose" ? 1 : 0)
                    .input('Pack', sql.NVarChar, item.Pack)
                    .query(`
                        INSERT INTO SaleItems (
                            SaleID, ItemId, ItemName, Batch, Expiry, MRP, Quantity, 
                            Discount, GST, NetAmount, Is_Loose, CreatedAt, Pack
                        ) 
                        VALUES (
                            @SaleID, @ItemId, @ItemName, @BatchNumber, @Expiry, @MRP, @Quantity, 
                            @Discount, @GST, @NetAmount, @IsLoose, GETDATE(), @Pack
                        )
                    `);

                // Update Pharma_Medicines
                if (item.IsStrip && item.SaleType === "Full strip") {
                    await new sql.Request(transaction)
                        .input('MedicineId', sql.Int, item.MedicineId)
                        .input('Quantity', sql.Int, item.Quantity)
                        .query(`
                            UPDATE Pharma_Medicines
                            SET Quantity = Quantity - @Quantity
                            WHERE id = @MedicineId
                        `);
                } else if (item.IsStrip && item.SaleType === "Loose") {
                    const stockResult = await new sql.Request(transaction)
                        .input('MedicineId', sql.Int, item.MedicineId)
                        .query(`
                            SELECT QtyInLoose, Quantity
                            FROM Pharma_Medicines
                            WHERE id = @MedicineId
                        `);

                    const { QtyInLoose, Quantity } = stockResult.recordset[0];
                    let qtyToSell = item.Quantity;
                    let newQtyInLoose = QtyInLoose || 0;
                    let stripsUsed = 0;

                    if (newQtyInLoose > 0 && qtyToSell > 0) {
                        const looseUsed = Math.min(qtyToSell, newQtyInLoose);
                        newQtyInLoose -= looseUsed;
                        qtyToSell -= looseUsed;
                    }

                    if (qtyToSell > 0) {
                        stripsUsed = 1;
                        newQtyInLoose = item.StripSize - qtyToSell;
                    }

                    await new sql.Request(transaction)
                        .input('MedicineId', sql.Int, item.MedicineId)
                        .input('StripsUsed', sql.Int, stripsUsed)
                        .input('QtyInLoose', sql.Int, newQtyInLoose)
                        .query(`
                            UPDATE Pharma_Medicines 
                            SET Quantity = Quantity - @StripsUsed,
                                QtyInLoose = @QtyInLoose
                            WHERE id = @MedicineId
                        `);
                } else {
                    await new sql.Request(transaction)
                        .input('MedicineId', sql.Int, item.MedicineId)
                        .input('Quantity', sql.Int, item.Quantity)
                        .query(`
                            UPDATE Pharma_Medicines
                            SET Quantity = Quantity - @Quantity
                            WHERE id = @MedicineId
                        `);
                }
            }

            await transaction.commit();
            return res.status(201).json({
                success: true,
                saleID: saleID,
                billNumber: billNumber,
                message: 'Sale saved successfully'
            });

        } catch (err) {
            await transaction.rollback();
            console.error('Transaction Error:', err);
            return res.status(500).json({
                error: 'Transaction failed',
                details: err.message
            });
        }
    } catch (err) {
        console.error('Connection Error:', err);
        return res.status(500).json({
            error: 'Database connection failed',
            details: err.message
        });
    }
};

export const getAllSales = async (req, res) => {
    try {
        const pool = await ConnectMSSQL();
        const request = new sql.Request(pool);
        const result = await request.query(`
        SELECT TOP (1000) [SaleID], [CustomerName], [BillNumber], [BillPath], [BillDate], 
               [TotalAmount], [PaidAmount], [CreatedBy], [PaymentType],[PayAppName] ,[TsNum] ,[Status], [CreatedAt], 
               [ModifiedAt], [IsDeleted]
        FROM [ReactDB].[dbo].[SaleDetails] WHERE IsDeleted = 0
        ORDER BY CreatedAt DESC
      `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error fetching sales:', err);
        res.status(500).json({ error: 'Database error', details: err });
    }
};

export const deleteSale = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await ConnectMSSQL();
        const request = new sql.Request(pool);

        // Update SaleDetails
        await request
            .input('SaleID', sql.Int, id)
            .query(`
                UPDATE [ReactDB].[dbo].[SaleDetails]
                SET IsDeleted = 1, ModifiedAt = GETDATE()
                WHERE SaleID = @SaleID AND IsDeleted = 0
            `);

        // Update SaleItems
        await request.query(`
            UPDATE [ReactDB].[dbo].[SaleItems]
            SET IsDeleted = 1, ModifiedAt = GETDATE()
            WHERE SaleID = @SaleID AND IsDeleted = 0
        `);

        res.status(200).json({ message: 'Sale deleted successfully' });
    } catch (err) {
        console.error('Error deleting sale:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};


export const getSaleForReturn = async (req, res) => {
    const { saleID } = req.params;

    try {
        const pool = await ConnectMSSQL();

        // Fetch sale details by SaleID or BillNumber
        const saleDetailsRequest = new sql.Request(pool);
        saleDetailsRequest.input('SearchTerm', sql.VarChar, saleID);
        const saleDetailsResult = await saleDetailsRequest.query(`
            SELECT * FROM SaleDetails 
            WHERE SaleID = @SearchTerm OR BillNumber = @SearchTerm
        `);
        const saleDetails = saleDetailsResult.recordset[0];

        if (!saleDetails) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        // Fetch sale items
        const saleItemsRequest = new sql.Request(pool);
        saleItemsRequest.input('SaleID', sql.Int, saleDetails.SaleID);
        const saleItemsResult = await saleItemsRequest.query(`
            SELECT * 
            FROM SaleItems 
            WHERE 
                SaleID = @SaleID
                AND (
                    Is_Returned = 0
                    OR (Is_Returned = 1 AND Quantity > 0)
                )
        `);
        const saleItems = saleItemsResult.recordset;

        // Format the response
        const response = {
            saleDetails: {
                SaleID: saleDetails.SaleID,
                CustomerName: saleDetails.CustomerName,
                BillNumber: saleDetails.BillNumber,
                BillDate: saleDetails.BillDate,
                TotalAmount: parseFloat(saleDetails.TotalAmount),
                CreatedBy: saleDetails.CreatedBy,
                PaymentType: saleDetails.PaymentType,
                Status: saleDetails.Status,
            },
            saleItems: saleItems.map(item => ({
                SaleItemID: item.SaleItemID,
                ItemName: item.ItemName,
                Batch: item.Batch,
                Expiry: item.Expiry,
                MRP: parseFloat(item.MRP),
                Quantity: item.Quantity,
                Discount: parseFloat(item.Discount),
                GST: parseFloat(item.GST),
                NetAmount: parseFloat(item.NetAmount),
                Is_Loose: item.Is_Loose || false,
            })),
        };

        res.status(200).json(response);
    } catch (err) {
        console.error('Error fetching sale for return:', err);
        res.status(500).json({ error: 'Database error', message: err.message });
    }
};

export const processSaleReturn = async (req, res) => {
    const { saleID } = req.params;
    const { ReturnItems, CreatedBy, TotalReturnAmount } = req.body;

    try {
        const pool = await ConnectMSSQL();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Fetch current sale details
            const saleDetailsRequest = new sql.Request(transaction);
            saleDetailsRequest.input('SaleID', sql.Int, saleID);
            const saleDetailsResult = await saleDetailsRequest.query(`
                SELECT * FROM SaleDetails WHERE SaleID = @SaleID
            `);
            const saleDetails = saleDetailsResult.recordset[0];

            if (!saleDetails) {
                throw new Error('Sale not found');
            }

            // Fetch sale items to calculate return amount and get Is_Loose and ItemId
            const saleItemsRequest = new sql.Request(transaction);
            saleItemsRequest.input('SaleID', sql.Int, saleID);
            const saleItemsResult = await saleItemsRequest.query(`
                SELECT SaleItemID, Quantity, NetAmount, Is_Loose, ItemId 
                FROM SaleItems 
                WHERE SaleID = @SaleID
            `);
            const saleItems = saleItemsResult.recordset;

            let calculatedTotalReturnAmount = 0;

            for (const item of ReturnItems) {
                const saleItem = saleItems.find(i => i.SaleItemID === item.SaleItemID);
                if (!saleItem) {
                    throw new Error(`SaleItemID ${item.SaleItemID} not found`);
                }

                const itemRequest = new sql.Request(transaction);
                itemRequest.input('SaleID', sql.Int, saleID);
                itemRequest.input('SaleItemID', sql.Int, item.SaleItemID);
                itemRequest.input('ReturnQuantity', sql.Int, item.ReturnQuantity);

                // Check available quantity
                const checkQty = await itemRequest.query(`
                    SELECT Quantity, NetAmount 
                    FROM SaleItems 
                    WHERE SaleID = @SaleID AND SaleItemID = @SaleItemID
                `);
                const currentQuantity = checkQty.recordset[0]?.Quantity || 0;
                const currentNetAmount = checkQty.recordset[0]?.NetAmount || 0;

                if (currentQuantity < item.ReturnQuantity) {
                    throw new Error(`Insufficient quantity for SaleItemID ${item.SaleItemID}`);
                }

                // Calculate proportional net amount reduction
                const unitNetAmount = currentNetAmount / currentQuantity;
                const returnNetAmount = unitNetAmount * item.ReturnQuantity;
                calculatedTotalReturnAmount += returnNetAmount;

                // Update SaleItems (quantity, net amount, and Is_Returned)
                itemRequest.input('NewNetAmount', sql.Decimal(18, 2), currentNetAmount - returnNetAmount);
                await itemRequest.query(`
                    UPDATE SaleItems 
                    SET Quantity = Quantity - @ReturnQuantity,
                        NetAmount = @NewNetAmount,
                        Is_Returned = 1,
                        ModifiedAt = GETDATE()
                    WHERE SaleID = @SaleID AND SaleItemID = @SaleItemID
                `);

                // Update Pharma_Medicines based on Is_Loose
                itemRequest.input('ItemId', sql.Int, saleItem.ItemId);
                if (saleItem.Is_Loose) {
                    // Increment QtyInLoose for loose items
                    await itemRequest.query(`
                        UPDATE Pharma_Medicines
                        SET QtyInLoose = QtyInLoose + @ReturnQuantity
                        WHERE id = @ItemId
                    `);
                } else {
                    // Increment Quantity for non-loose items
                    await itemRequest.query(`
                        UPDATE Pharma_Medicines
                        SET Quantity = Quantity + @ReturnQuantity
                        WHERE id = @ItemId
                    `);
                }

                // Insert return record
                itemRequest.input('CreatedBy', sql.NVarChar, CreatedBy);
                itemRequest.input('TotalReturnAmount', sql.Decimal(18, 2), returnNetAmount);
                await itemRequest.query(`
                    INSERT INTO SaleReturns (SaleID, SaleItemID, ReturnQuantity, CreatedBy, TotalReturnAmount, CreatedAt)
                    VALUES (@SaleID, @SaleItemID, @ReturnQuantity, @CreatedBy, @TotalReturnAmount, GETDATE())
                `);
            }

            // Update TotalAmount in SaleDetails
            const updateSaleRequest = new sql.Request(transaction);
            updateSaleRequest.input('SaleID', sql.Int, saleID);
            updateSaleRequest.input('NewTotalAmount', sql.Decimal(18, 2), saleDetails.TotalAmount - calculatedTotalReturnAmount);
            await updateSaleRequest.query(`
                UPDATE SaleDetails 
                SET TotalAmount = @NewTotalAmount,
                    ModifiedAt = GETDATE()
                WHERE SaleID = @SaleID
            `);

            await transaction.commit();
            res.status(200).json({ message: 'Sale return processed successfully' });
        } catch (err) {
            await transaction.rollback();
            console.error('Transaction error:', err);
            res.status(400).json({ error: 'Return failed', message: err.message });
        }
    } catch (err) {
        console.error('Connection error:', err);
        res.status(500).json({ error: 'Database connection failed' });
    }
};

export const saveSalePDF = async (req, res) => {
    const { saleID } = req.params;
    const { userId } = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
        const pool = await ConnectMSSQL();

        // Fetch sale details
        const saleDetailsRequest = new sql.Request(pool);
        saleDetailsRequest.input('SaleID', sql.Int, saleID);
        const saleDetailsResult = await saleDetailsRequest.query(`
            SELECT * FROM SaleDetails WHERE SaleID = @SaleID
        `);
        const saleDetails = saleDetailsResult.recordset[0];

        if (!saleDetails) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        // Fetch sale items
        const saleItemsRequest = new sql.Request(pool);
        saleItemsRequest.input('SaleID', sql.Int, saleID);
        const saleItemsResult = await saleItemsRequest.query(`
            SELECT * FROM SaleItems WHERE SaleID = @SaleID
        `);
        const saleItems = saleItemsResult.recordset;

        // Fetch profile data
        const profileRequest = new sql.Request(pool);
        profileRequest.input('UserID', sql.NVarChar, userId);
        const profileResult = await profileRequest.query(`
            SELECT * FROM pharmacy_profile WHERE id = @UserID
        `);
        const profileData = profileResult.recordset[0] || {};

        // Generate PDF file name and path
        const billsDir = path.join(process.cwd(), 'Uploads', 'bills');
        if (!fs.existsSync(billsDir)) {
            fs.mkdirSync(billsDir, { recursive: true });
        }
        const pdfFileName = `invoice_${saleID}_${saleDetails.BillNumber}.pdf`;
        const billPath = `Uploads/bills/${pdfFileName}`;

        // Generate QR code with the correct bill path
        const qrData = JSON.stringify({
            billNumber: saleDetails.BillNumber,
            customerName: saleDetails.CustomerName,
            billDate: saleDetails.BillDate,
            invoiceDownloadUrl: `http://localhost:5010/${billPath}`
        });

        // Generate QR code as base64
        const qrCodeBase64 = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            width: 80,
            margin: 1,
            scale: 8
        });

        // Generate barcode as base64
        const barcodeBuffer = await new Promise((resolve, reject) => {
            bwipjs.toBuffer({
                bcid: 'code128',
                text: saleDetails.BillNumber,
                scale: 2,
                height: 10,
                includetext: false
            }, (err, buffer) => {
                if (err) reject(err);
                else resolve(buffer);
            });
        });
        const barcodeBase64 = `data:image/png;base64,${barcodeBuffer.toString('base64')}`;

        // Format date
        const formattedDate = new Date(saleDetails.BillDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        // Generate HTML for the invoice
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 10pt;
                        margin: 0;
                        padding: 0;
                    }
                    .invoice {
                        width: 210mm;
                        height: 297mm;
                        box-sizing: border-box;
                        padding: 8mm;
                        margin: 0;
                        background: white;
                        border: 1px solid #000;
                    }
                    .text-center {
                        text-align: center;
                    }
                    .text-right {
                        text-align: right;
                    }
                    .text-xs {
                        font-size: 10pt;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        padding-bottom: 8px;
                        border-bottom: 1px solid #000;
                    }
                    .header div {
                        flex: 1;
                    }
                    .header .left {
                        display: flex;
                        flex-direction: column;
                    }
                    .header .center {
                        display: flex;
                        justify-content: center;
                        align-items: flex-start;
                    }
                    .header .right {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-end;
                    }
                    .pharmacy-name {
                        font-size: 24pt;
                        font-weight: bold;
                        margin-bottom: 16px;
                    }
                    .qr-code {
                        width: 80px;
                        height: 80px;
                        margin-top: 20px;
                        margin-left: 16px;
                        image-rendering: pixelated;
                    }
                    .barcode img {
                        width: 100px;
                        height: 40px;
                    }
                    .title-section {
                        padding: 8px 0;
                    }
                    .title {
                        font-size: 24pt;
                        font-weight: bold;
                        font-family: 'Georgia', serif;
                        letter-spacing: 1px;
                    }
                    .customer {
                        margin-top: 8px;
                        padding-top: 4px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 8px;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 2px;
                    }
                    th {
                        text-align: left;
                        font-weight: bold;
                    }
                    .totals {
                        display: flex;
                        justify-content: space-between;
                        border-top: 1px solid #000;
                        padding-top: 4px;
                        margin-top: 8px;
                    }
                    .footer {
                        border-top: 1px solid #000;
                        padding-top: 4px;
                        margin-top: 8px;
                    }
                    p {
                        margin: 2px 0;
                    }
                </style>
            </head>
            <body>
                <div class="invoice">
                    <div class="title-section text-center">
                        <h2 class="title">TAX INVOICE</h2>
                    </div>
                    <div class="header text-xs">
                        <div class="left">
                            <h1 class="pharmacy-name">${profileData.pharmacy_name || 'TARUN MEDICOS'}</h1>
                            <p>${profileData.address || '1st Floor, Family Medical Store, U.P. Sanjay Nagar'}${profileData.address2 ? `, ${profileData.address2}` : ''}</p>
                            <p>${profileData.city || 'Lucknow'}, ${profileData.state || 'U.P.'} ${profileData.pincode || '226016'}</p>
                            <p>Phone: ${profileData.mobile || '0522-1234567, Mob: 1234567890'}</p>
                            <p>GSTIN: 09AAECT1234F1Z6</p>
                            <p>DL No: UP3212024, UP3212025</p>
                        </div>
                        <div class="center">
                            <img src="${qrCodeBase64}" class="qr-code" alt="QR Code" />
                        </div>
                        <div class="right">
                            <div class="barcode">
                                <img src="${barcodeBase64}" alt="Barcode" />
                            </div>
                            <p><strong>INV NO:</strong> ${saleDetails.BillNumber}</p>
                            <p><strong>DATE:</strong> ${formattedDate}</p>
                            <p><strong>ROUTE:</strong> ${profileData.state || 'U.P.'}</p>
                            <p><strong>PAN NO:</strong> AAECT1234F</p>
                        </div>
                    </div>
                    <div class="customer text-xs">
                        <p><strong>CUSTOMER NAME:</strong> ${saleDetails.CustomerName}</p>
                    </div>
                    <table class="text-xs">
                        <thead>
                            <tr>
                                <th>HSN Code</th>
                                <th>Item Description</th>
                                <th class="text-center">Batch No</th>
                                <th class="text-center">Exp Date</th>
                                <th class="text-center">Qty</th>
                                <th class="text-right">Rate</th>
                                <th class="text-right">Disc%</th>
                                <th class="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${saleItems.length > 0 ? saleItems.map(item => `
                                <tr>
                                    <td>30049099</td>
                                    <td>${item.ItemName}</td>
                                    <td class="text-center">${item.Batch}</td>
                                    <td class="text-center">${item.Expiry}</td>
                                    <td class="text-center">${item.Quantity}</td>
                                    <td class="text-right">${item.MRP}</td>
                                    <td class="text-right">${item.Discount}</td>
                                    <td class="text-right">${item.NetAmount}</td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="8" class="text-center">No items found</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                    <div class="totals text-xs">
                        <div>
                            <p><strong>Total Items:</strong> ${saleItems.length}</p>
                            <p><strong>Payment Mode:</strong> ${saleDetails.PaymentType}</p>
                        </div>
                        <div class="text-right">
                            <p><strong>Net Amount:</strong> ₹${saleDetails.TotalAmount}</p>
                            <p><strong>SGST 9%:</strong> ₹0.00</p>
                            <p><strong>CGST 9%:</strong> ₹0.00</p>
                            <p><strong>Grand Total:</strong> ₹${saleDetails.TotalAmount}</p>
                        </div>
                    </div>
                    <div class="footer text-xs">
                        <p><strong>Terms & Conditions:</strong> Goods once sold will not be taken back or exchanged.</p>
                        <p class="text-center">Thank you for your business!</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Generate PDF using puppeteer
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfPath = path.join(billsDir, pdfFileName);
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            margin: { top: '2mm', right: '2mm', bottom: '2mm', left: '2mm' },
            printBackground: true,
            preferCSSPageSize: true
        });
        await browser.close();

        // Update SaleDetails with BillPath
        const updateBillPathRequest = new sql.Request(pool);
        updateBillPathRequest.input('SaleID', sql.Int, saleID);
        updateBillPathRequest.input('BillPath', sql.NVarChar, billPath);
        await updateBillPathRequest.query(`
            UPDATE SaleDetails 
            SET BillPath = @BillPath, ModifiedAt = GETDATE()
            WHERE SaleID = @SaleID
        `);

        res.status(200).json({ message: 'PDF saved successfully', pdfPath: `uploads/bills/${pdfFileName}` });
    } catch (err) {
        console.error('Error saving PDF:', err);
        res.status(500).json({ error: 'Failed to save PDF', message: err.message });
    }
};