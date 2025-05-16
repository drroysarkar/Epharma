import { ConnectMSSQL, sql } from '../config/db.js';

export const addPurchase = async (req, res) => {
  const {
    DistributorName, BillDate, DueDate, PaidAmount, PendingAmount,
    CreatedBy, PaymentType, PayName, TsNum, Status, PurchaseItems
  } = req.body;

  try {
    const pool = await ConnectMSSQL();

    // Start transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Generate bill number
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const lastBill = await new sql.Request(transaction)
        .query(`SELECT TOP 1 BillNumber 
                FROM PurchaseDetails 
                WHERE BillNumber LIKE '${datePart}%'
                ORDER BY BillNumber DESC`);
      
      let sequence = 1;
      if (lastBill.recordset.length > 0) {
        const lastSequence = parseInt(lastBill.recordset[0].BillNumber.split('-')[1]);
        sequence = lastSequence + 1;
      }
      const billNumber = `${datePart}-${sequence.toString().padStart(4, '0')}`;

      // Insert into PurchaseDetails
      const purchaseRequest = new sql.Request(transaction);
      purchaseRequest.input('DistributorName', sql.NVarChar, DistributorName);
      purchaseRequest.input('BillNumber', sql.NVarChar, billNumber);
      purchaseRequest.input('BillDate', sql.Date, BillDate);
      purchaseRequest.input('DueDate', sql.Date, DueDate);
      purchaseRequest.input('PaidAmount', sql.Decimal(10, 2), PaidAmount || 0);
      purchaseRequest.input('PendingAmount', sql.Decimal(10, 2), PendingAmount);
      purchaseRequest.input('CreatedBy', sql.NVarChar, CreatedBy);
      purchaseRequest.input('PaymentType', sql.NVarChar, PaymentType);
      purchaseRequest.input('PayName', sql.NVarChar, PayName || null);
      purchaseRequest.input('TsNum', sql.NVarChar, TsNum || null);
      purchaseRequest.input('Status', sql.NVarChar, Status);

      const result = await purchaseRequest.query(`
        INSERT INTO PurchaseDetails (
          DistributorName, BillNumber, BillDate, DueDate, PaidAmount, PendingAmount,
          CreatedBy, PaymentType, PayName, TsNum, Status, CreatedAt
        ) OUTPUT INSERTED.PurchaseID, INSERTED.BillNumber
        VALUES (
          @DistributorName, @BillNumber, @BillDate, @DueDate, @PaidAmount, @PendingAmount,
          @CreatedBy, @PaymentType, @PayName, @TsNum, @Status, GETDATE()
        )
      `);

      const purchaseID = result.recordset[0].PurchaseID;
      const savedBillNumber = result.recordset[0].BillNumber;

      // Insert into PurchaseItems and update Pharma_Medicines
      for (const item of PurchaseItems) {
        // Insert into PurchaseItems
        const itemRequest = new sql.Request(transaction);
        itemRequest.input('PurchaseID', sql.Int, purchaseID);
        itemRequest.input('MedId', sql.Int, item.medicineId); // Add MedId
        itemRequest.input('ItemName', sql.NVarChar, item.ItemName);
        itemRequest.input('ItemLocation', sql.NVarChar, item.ItemLocation);
        itemRequest.input('HSNCode', sql.NVarChar, item.HSNCode);
        itemRequest.input('Pack', sql.NVarChar, item.Pack);
        itemRequest.input('Batch', sql.NVarChar, item.Batch);
        itemRequest.input('Expiry', sql.NVarChar, item.Expiry);
        itemRequest.input('MRP', sql.Decimal(18, 2), item.MRP);
        itemRequest.input('PTR', sql.Decimal(18, 2), item.PTR);
        itemRequest.input('Quantity', sql.Int, item.Quantity);
        itemRequest.input('Free', sql.Int, item.Free);
        itemRequest.input('SchAmt', sql.Decimal(18, 2), item.SchAmt);
        itemRequest.input('Discount', sql.Decimal(18, 2), item.Discount);
        itemRequest.input('Is_DiscLocked', sql.Bit, item.Is_DiscLocked);
        itemRequest.input('Base', sql.Decimal(18, 2), item.Base);
        itemRequest.input('GST', sql.Decimal(18, 2), item.GST);
        itemRequest.input('NetAmount', sql.Decimal(18, 2), item.NetAmount);

        await itemRequest.query(`
          INSERT INTO PurchaseItems (
            PurchaseID, MedId, ItemName, ItemLocation, HSNCode, Pack, Batch, Expiry,
            MRP, PTR, Quantity, Free, SchAmt, Discount, Is_DiscLocked,
            Base, GST, NetAmount, CreatedAt
          ) VALUES (
            @PurchaseID, @MedId, @ItemName, @ItemLocation, @HSNCode, @Pack, @Batch, @Expiry,
            @MRP, @PTR, @Quantity, @Free, @SchAmt, @Discount, @Is_DiscLocked,
            @Base, @GST, @NetAmount, GETDATE()
          )
        `);

        // Update Pharma_Medicines for the matching medicineId
        const medicineUpdateRequest = new sql.Request(transaction);
        medicineUpdateRequest.input('MedicineID', sql.Int, item.medicineId);
        medicineUpdateRequest.input('Batch', sql.NVarChar, item.Batch);
        medicineUpdateRequest.input('Quantity', sql.Int, item.Quantity);
        medicineUpdateRequest.input('Expiry', sql.NVarChar, item.Expiry || null);

        await medicineUpdateRequest.query(`
          UPDATE Pharma_Medicines
          SET 
            Batch = @Batch,
            Quantity = ISNULL(Quantity, 0) + @Quantity,
            Expiry = @Expiry
          WHERE id = @MedicineID
        `);
      }

      await transaction.commit();
      res.status(201).json({ 
        message: 'Purchase and items saved successfully, medicines updated',
        purchaseID: purchaseID,
        billNumber: savedBillNumber
      });
    } catch (err) {
      await transaction.rollback();
      console.error('Transaction error:', err);
      res.status(500).json({ error: 'Transaction failed', details: err.message });
    }
  } catch (err) {
    console.error('Connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
};

export const getAllPurchases = async (req, res) => {
    try {
        const pool = await ConnectMSSQL();
        const request = new sql.Request(pool);
        const result = await request.query(`
            SELECT [PurchaseID], [DistributorName], [BillNumber], [BillDate], [DueDate], 
                   [PendingAmount], [PaidAmount], [CreatedBy], [PaymentType], [PaymentStatus],[PayName],[TsNum], [Status], [CreatedAt], [UpdatedAt], [IsDeleted]
            FROM [ReactDB].[dbo].[PurchaseDetails]
            WHERE IsDeleted = 0
            ORDER BY CreatedAt DESC
        `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error fetching purchases:', err);
        res.status(500).json({ error: 'Database error', details: err });
    }
};

// New endpoint: Soft delete a purchase
export const deletePurchase = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await ConnectMSSQL();
        const request = new sql.Request(pool);

        // Update PurchaseDetails
        await request
            .input('PurchaseID', sql.Int, id)
            .query(`
                UPDATE [ReactDB].[dbo].[PurchaseDetails]
                SET IsDeleted = 1, UpdatedAt = GETDATE()
                WHERE PurchaseID = @PurchaseID AND IsDeleted = 0
            `);

        // Update PurchaseItems
        await request.query(`
            UPDATE [ReactDB].[dbo].[PurchaseItems]
            SET IsDeleted = 1, UpdatedAt = GETDATE()
            WHERE PurchaseID = @PurchaseID AND IsDeleted = 0
        `);

        res.status(200).json({ message: 'Purchase deleted successfully' });
    } catch (err) {
        console.error('Error deleting purchase:', err);
        res.status(500).json({ error: 'Database error', details: err });
    }
};


  export const getPurchaseByID = async (req, res) => {
    const { purchaseID } = req.params;
  
    try {
      const pool = await ConnectMSSQL();
  
      // Fetch Purchase Details
      const purchaseDetailsRequest = new sql.Request(pool);
      purchaseDetailsRequest.input('PurchaseID', sql.Int, purchaseID);
      const purchaseDetails = await purchaseDetailsRequest.query(`
        SELECT * FROM PurchaseDetails WHERE PurchaseID = @PurchaseID AND IsDeleted = 0
      `);
  
      // Fetch Purchase Items
      const purchaseItemsRequest = new sql.Request(pool);
      purchaseItemsRequest.input('PurchaseID', sql.Int, purchaseID);
      const purchaseItems = await purchaseItemsRequest.query(`
        SELECT * FROM PurchaseItems WHERE PurchaseID = @PurchaseID AND IsDeleted = 0
      `);
  
      if (purchaseDetails.recordset.length > 0) {
        res.status(200).json({
          purchaseDetails: purchaseDetails.recordset[0],
          purchaseItems: purchaseItems.recordset
        });
      } else {
        res.status(404).json({ message: 'Purchase not found' });
      }
    } catch (err) {
      console.error('Error fetching purchase data:', err);
      res.status(500).json({ error: 'Database error', details: err });
    }
  };
  



  export const updatePurchaseItems = async (req, res) => {
    const { purchaseID } = req.params;
    const { PurchaseItems } = req.body;

    try {
        const pool = await ConnectMSSQL();
        const transaction = new sql.Transaction(pool);
        
        await transaction.begin();
        
        try {
            // Update each purchase item
            for (const item of PurchaseItems) {
                const updateRequest = new sql.Request(transaction);
                
                updateRequest.input('PurchaseID', sql.Int, purchaseID);
                updateRequest.input('ItemID', sql.Int, item.ItemID);
                updateRequest.input('ItemLocation', sql.NVarChar, item.ItemLocation);
                updateRequest.input('HSNCode', sql.Int, item.HSNCode);
                updateRequest.input('MRP', sql.Decimal(18, 2), item.MRP);
                updateRequest.input('PTR', sql.Decimal(18, 2), item.PTR);
                updateRequest.input('Quantity', sql.Int, item.Quantity);
                updateRequest.input('Discount', sql.Decimal(5, 2), item.Discount);
                updateRequest.input('Is_DiscLocked', sql.Bit, item.Is_DiscLocked);
                updateRequest.input('NetAmount', sql.Decimal(18, 2), item.NetAmount);
                updateRequest.input('Margin', sql.Decimal(5, 2), item.Margin);
                updateRequest.input('MinQty', sql.Int, item.MinQty);
                updateRequest.input('MaxQty', sql.Int, item.MaxQty);

                await updateRequest.query(`
                    UPDATE PurchaseItems SET
                        ItemLocation = @ItemLocation,
                        HSNCode = @HSNCode,
                        MRP = @MRP,
                        PTR = @PTR,
                        Quantity = @Quantity,
                        Discount = @Discount,
                        Is_DiscLocked = @Is_DiscLocked,
                        NetAmount = @NetAmount,
                        Margin = @Margin,
                        MinQty = @MinQty,
                        MaxQty = @MaxQty,
                        UpdatedAt = GETDATE()
                    WHERE PurchaseID = @PurchaseID AND ItemID = @ItemID
                `);
            }

            await transaction.commit();
            res.status(200).json({ message: 'Purchase items updated successfully' });
        } catch (err) {
            await transaction.rollback();
            console.error('Transaction error:', err);
            res.status(500).json({ error: 'Transaction failed', details: err });
        }
    } catch (err) {
        console.error('Connection error:', err);
        res.status(500).json({ error: 'Database connection failed' });
    }
};



export const processPurchaseReturn = async (req, res) => {
  const { purchaseID } = req.params;
  const { ReturnItems, CreatedBy, TotalReturnAmount } = req.body;

  try {
    const pool = await ConnectMSSQL();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Fetch current purchase details
      const purchaseDetailsRequest = new sql.Request(transaction);
      purchaseDetailsRequest.input('PurchaseID', sql.Int, purchaseID);
      const purchaseDetailsResult = await purchaseDetailsRequest.query(`
        SELECT * FROM PurchaseDetails WHERE PurchaseID = @PurchaseID
      `);
      const purchaseDetails = purchaseDetailsResult.recordset[0];

      if (!purchaseDetails) {
        throw new Error('Purchase not found');
      }

      // Fetch purchase items to get necessary fields
      const purchaseItemsRequest = new sql.Request(transaction);
      purchaseItemsRequest.input('PurchaseID', sql.Int, purchaseID);
      const purchaseItemsResult = await purchaseItemsRequest.query(`
        SELECT ItemID, MedId, Quantity, NetAmount FROM PurchaseItems WHERE PurchaseID = @PurchaseID
      `);
      const purchaseItems = purchaseItemsResult.recordset;

      // Calculate and validate individual return amounts
      let calculatedTotalReturn = 0;
      const itemReturnAmounts = [];

      for (const item of ReturnItems) {
        const itemRequest = new sql.Request(transaction);
        itemRequest.input('PurchaseID', sql.Int, purchaseID);
        itemRequest.input('ItemID', sql.Int, item.ItemID);
        itemRequest.input('ReturnQuantity', sql.Int, item.ReturnQuantity);
        itemRequest.input('TotalReturnAmount', sql.Decimal(18, 2), TotalReturnAmount);
        itemRequest.input('CreatedBy', sql.NVarChar(50), CreatedBy);

        // Check available quantity and fetch item details
        const checkQty = await itemRequest.query(`
          SELECT Quantity, NetAmount, MedId FROM PurchaseItems 
          WHERE PurchaseID = @PurchaseID AND ItemID = @ItemID
        `);
        const itemDetails = checkQty.recordset[0];

        if (!itemDetails) {
          throw new Error(`Item ${item.ItemID} not found`);
        }

        if (itemDetails.Quantity < item.ReturnQuantity) {
          throw new Error(`Insufficient quantity for ItemID ${item.ItemID}`);
        }

        // Calculate return amount for this item
        const unitPrice = itemDetails.Quantity > 0 ? itemDetails.NetAmount / itemDetails.Quantity : 0;
        const returnAmount = item.ReturnQuantity * unitPrice;
        const newNetAmount = itemDetails.NetAmount - returnAmount;

        // Store for validation
        calculatedTotalReturn += returnAmount;
        itemReturnAmounts.push({ ItemID: item.ItemID, returnAmount, newNetAmount });

        // Update PurchaseItems (quantity and net amount)
        itemRequest.input('NewNetAmount', sql.Decimal(18, 2), newNetAmount);
        await itemRequest.query(`
          UPDATE PurchaseItems 
          SET Quantity = Quantity - @ReturnQuantity,
              NetAmount = @NewNetAmount,
              UpdatedAt = GETDATE()
          WHERE PurchaseID = @PurchaseID AND ItemID = @ItemID
        `);

        // Update Pharma_Medicines
        const medRequest = new sql.Request(transaction);
        medRequest.input('MedId', sql.Int, itemDetails.MedId);
        medRequest.input('ReturnQuantity', sql.Int, item.ReturnQuantity);
        await medRequest.query(`
          UPDATE Pharma_Medicines
          SET Quantity = Quantity - @ReturnQuantity,
              UpdatedAt = GETDATE()
          WHERE id = @MedId
        `);

        // Insert return record with provided TotalReturnAmount
        await itemRequest.query(`
          INSERT INTO PurchaseReturns (PurchaseID, ItemID, ReturnQuantity, TotalReturnAmount, CreatedBy, CreatedAt)
          VALUES (@PurchaseID, @ItemID, @ReturnQuantity, @TotalReturnAmount, @CreatedBy, GETDATE())
        `);
      }

      // Validate calculated total against provided TotalReturnAmount
      if (Math.abs(calculatedTotalReturn - TotalReturnAmount) > 0.01) {
        throw new Error('Total return amount mismatch');
      }

      // Update PendingAmount in PurchaseDetails
      const updatePurchaseRequest = new sql.Request(transaction);
      updatePurchaseRequest.input('PurchaseID', sql.Int, purchaseID);
      updatePurchaseRequest.input('NewPendingAmount', sql.Decimal(18, 2), purchaseDetails.ReturnAmount + TotalReturnAmount);
      await updatePurchaseRequest.query(`
        UPDATE PurchaseDetails 
        SET ReturnAmount = @NewPendingAmount,
            UpdatedAt = GETDATE()
        WHERE PurchaseID = @PurchaseID
      `);

      await transaction.commit();
      res.status(200).json({ message: 'Purchase return processed successfully' });
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