import { ConnectMSSQL, sql } from '../config/db.js';

export const addPurchase = async (req, res) => {
    const {
      DistributorName, BillNumber, BillDate, DueDate, PendingAmount,
      CreatedBy, PaymentType, Status, PurchaseItems
    } = req.body;
  
    try {
      const pool = await ConnectMSSQL();
  
      // Start transaction
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
  
      try {
        const purchaseRequest = new sql.Request(transaction);
        purchaseRequest.input('DistributorName', sql.NVarChar, DistributorName);
        purchaseRequest.input('BillNumber', sql.NVarChar, BillNumber);
        purchaseRequest.input('BillDate', sql.Date, BillDate);
        purchaseRequest.input('DueDate', sql.Date, DueDate);
        purchaseRequest.input('PendingAmount', sql.Decimal(18, 2), PendingAmount);
        purchaseRequest.input('CreatedBy', sql.NVarChar, CreatedBy);
        purchaseRequest.input('PaymentType', sql.NVarChar, PaymentType);
        purchaseRequest.input('Status', sql.NVarChar, Status);
  
        const result = await purchaseRequest.query(`
          INSERT INTO PurchaseDetails (
            DistributorName, BillNumber, BillDate, DueDate, PendingAmount,
            CreatedBy, PaymentType, Status, CreatedAt
          ) OUTPUT INSERTED.PurchaseID
          VALUES (
            @DistributorName, @BillNumber, @BillDate, @DueDate, @PendingAmount,
            @CreatedBy, @PaymentType, @Status, GETDATE()
          )
        `);
  
        const purchaseID = result.recordset[0].PurchaseID;
  
        for (const item of PurchaseItems) {
          const itemRequest = new sql.Request(transaction);
          itemRequest.input('PurchaseID', sql.Int, purchaseID);
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
              PurchaseID, ItemName, ItemLocation, HSNCode, Pack, Batch, Expiry,
              MRP, PTR, Quantity, Free, SchAmt, Discount,
              Base, GST, NetAmount, CreatedAt
            ) VALUES (
              @PurchaseID, @ItemName, @ItemLocation, @HSNCode, @Pack, @Batch, @Expiry,
              @MRP, @PTR, @Quantity, @Free, @SchAmt, @Discount,
              @Base, @GST, @NetAmount, GETDATE()
            )
          `);
        }
  
        await transaction.commit();
        res.status(201).json({ 
          message: 'Purchase and items saved successfully',
          purchaseID: purchaseID
        });
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

  export const getAllPurchases = async (req, res) => {
    try {
      const pool = await ConnectMSSQL();
      const request = new sql.Request(pool);
      const result = await request.query(`
        SELECT TOP (1000) [PurchaseID], [DistributorName], [BillNumber], [BillDate], [DueDate], 
               [PendingAmount], [CreatedBy], [PaymentType], [PaymentStatus], [Status], [CreatedAt], [UpdatedAt], [IsDeleted]
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


  export const getPurchaseByID = async (req, res) => {
    const { purchaseID } = req.params;
  
    try {
      const pool = await ConnectMSSQL();
  
      // Fetch Purchase Details
      const purchaseDetailsRequest = new sql.Request(pool);
      purchaseDetailsRequest.input('PurchaseID', sql.Int, purchaseID);
      const purchaseDetails = await purchaseDetailsRequest.query(`
        SELECT * FROM PurchaseDetails WHERE PurchaseID = @PurchaseID
      `);
  
      // Fetch Purchase Items
      const purchaseItemsRequest = new sql.Request(pool);
      purchaseItemsRequest.input('PurchaseID', sql.Int, purchaseID);
      const purchaseItems = await purchaseItemsRequest.query(`
        SELECT * FROM PurchaseItems WHERE PurchaseID = @PurchaseID
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
  const { ReturnItems } = req.body;

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

      // Fetch purchase items to calculate return amount
      const purchaseItemsRequest = new sql.Request(transaction);
      purchaseItemsRequest.input('PurchaseID', sql.Int, purchaseID);
      const purchaseItemsResult = await purchaseItemsRequest.query(`
        SELECT * FROM PurchaseItems WHERE PurchaseID = @PurchaseID
      `);
      const purchaseItems = purchaseItemsResult.recordset;

      for (const item of ReturnItems) {
        const itemRequest = new sql.Request(transaction);
        itemRequest.input('PurchaseID', sql.Int, purchaseID);
        itemRequest.input('ItemID', sql.Int, item.ItemID);
        itemRequest.input('ReturnQuantity', sql.Int, item.ReturnQuantity);

        // Check available quantity
        const checkQty = await itemRequest.query(`
          SELECT Quantity FROM PurchaseItems 
          WHERE PurchaseID = @PurchaseID AND ItemID = @ItemID
        `);
        const currentQuantity = checkQty.recordset[0]?.Quantity || 0;

        if (currentQuantity < item.ReturnQuantity) {
          throw new Error(`Insufficient quantity for ItemID ${item.ItemID}`);
        }

        // Update quantity in PurchaseItems
        await itemRequest.query(`
          UPDATE PurchaseItems 
          SET Quantity = Quantity - @ReturnQuantity,
              UpdatedAt = GETDATE()
          WHERE PurchaseID = @PurchaseID AND ItemID = @ItemID
        `);

        // Insert return record
        await itemRequest.query(`
          INSERT INTO PurchaseReturns (PurchaseID, ItemID, ReturnQuantity, CreatedAt)
          VALUES (@PurchaseID, @ItemID, @ReturnQuantity, GETDATE())
        `);
      }

      // Calculate total return amount based on fetched purchase items
      const totalReturnAmount = ReturnItems.reduce((sum, item) => {
        const purchaseItem = purchaseItems.find(i => i.ItemID === item.ItemID);
        return sum + (item.ReturnQuantity * (purchaseItem?.NetAmount / purchaseItem?.Quantity || 0));
      }, 0);

      // Update PendingAmount in PurchaseDetails
      const updatePurchaseRequest = new sql.Request(transaction);
      updatePurchaseRequest.input('PurchaseID', sql.Int, purchaseID);
      updatePurchaseRequest.input('NewPendingAmount', sql.Decimal(18, 2), purchaseDetails.PendingAmount - totalReturnAmount);
      await updatePurchaseRequest.query(`
        UPDATE PurchaseDetails 
        SET PendingAmount = @NewPendingAmount,
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