import { sql } from '../config/db.js';

export const addShortBookItem = async (req, res) => {
    try {
        const {
            itemId,
            itemName,
            itemDescription,
            manufacturer,
            minStock,
            currentStock,
            requestedQuantity,
        } = req.body;

        const pool = req.app.get('db');
        const result = await pool.request()
            .input('ItemId', sql.Int, itemId)
            .input('ItemName', sql.NVarChar, itemName)
            .input('ItemDescription', sql.NVarChar, itemDescription)
            .input('DateAdded', sql.Date, new Date())
            .input('DistributorName', sql.NVarChar, 'Unknown')
            .input('DistributorLocation', sql.NVarChar, 'Unknown')
            .input('Manufacturer', sql.NVarChar, manufacturer)
            .input('Priority', sql.NVarChar, 'Low')
            .input('MinStock', sql.Int, minStock)
            .input('CurrentStock', sql.Int, currentStock)
            .input('RequestedQuantity', sql.Int, requestedQuantity)
            .input('Status', sql.NVarChar, 'Pending')
            .input('Created_at', sql.DateTime, new Date())
            .input('IsDeleted', sql.Bit, 0)
            .query(`
                INSERT INTO [dbo].[ShortBookItems] (
                    ItemId, ItemName, ItemDescription, DateAdded, DistributorName, DistributorLocation,
                    Manufacturer, Priority, MinStock, CurrentStock, RequestedQuantity, Status,
                    Created_at, IsDeleted
                )
                OUTPUT INSERTED.ShortBookID
                VALUES (
                    @ItemId, @ItemName, @ItemDescription, @DateAdded, @DistributorName, @DistributorLocation,
                    @Manufacturer, @Priority, @MinStock, @CurrentStock, @RequestedQuantity, @Status,
                    @Created_at, @IsDeleted
                )
            `);

        res.status(201).json({ shortBookId: result.recordset[0].ShortBookID });
    } catch (err) {
        console.error('Error adding to ShortBook:', err);
        res.status(500).json({ error: 'Failed to add item to ShortBook' });
    }
};

export const getShortBookItems = async (req, res) => {
    try {
        const pool = req.app.get('db');
        const result = await pool.request().query(`
            SELECT 
                ShortBookID,
                ItemId,
                ItemName,
                ItemDescription,
                CONVERT(VARCHAR, DateAdded, 105) AS Date,
                DistributorName,
                DistributorLocation,
                Manufacturer,
                Priority,
                MinStock,
                CurrentStock,
                RequestedQuantity,
                Status,
                RequestedByUser
            FROM [dbo].[ShortBookItems]
            WHERE IsDeleted = 0
            ORDER BY Created_at DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching ShortBook:', err);
        res.status(500).json([]);
    }
};

export const deleteShortBookItem = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = req.app.get('db');
        await pool.request()
            .input('ShortBookID', sql.Int, id)
            .query(`
                UPDATE [dbo].[ShortBookItems]
                SET IsDeleted = 1, Modified_at = GETDATE()
                WHERE ShortBookID = @ShortBookID
            `);

        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (err) {
        console.error('Error deleting ShortBook item:', err);
        res.status(500).json({ error: 'Failed to delete item' });
    }
};

export const searchCustomers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 3) {
            return res.json([]);
        }

        const pool = req.app.get('db');
        const result = await pool.request()
            .input('MobilePrefix', sql.NVarChar, query)
            .query(`
                SELECT Id, CustomerName AS name, Mobile AS mobile
                FROM [dbo].[PharmaCustomers]
                WHERE IsDeleted = 0 AND Mobile LIKE @MobilePrefix + '%'
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error searching customers:', err);
        res.status(500).json([]);
    }
};

export const updateRequestedByUser = async (req, res) => {
    try {
        const { shortBookId } = req.params;
        const { requestedByUser, mobile, isNewCustomer } = req.body;

        if (!requestedByUser) {
            return res.status(400).json({ error: 'RequestedByUser is required' });
        }

        const pool = req.app.get('db');

        let customerId = null;
        if (isNewCustomer) {
            if (!mobile) {
                return res.status(400).json({ error: 'Mobile number is required for new customer' });
            }

            const result = await pool.request()
                .input('CustomerName', sql.NVarChar, requestedByUser)
                .input('Mobile', sql.NVarChar, mobile)
                .input('PendingAmount', sql.Decimal(18, 2), 0)
                .input('CreatedAt', sql.DateTime, new Date())
                .input('IsDeleted', sql.Bit, 0)
                .query(`
                    INSERT INTO [dbo].[PharmaCustomers] (
                        CustomerName, Mobile, PendingAmount, CreatedAt, IsDeleted
                    )
                    OUTPUT INSERTED.Id
                    VALUES (
                        @CustomerName, @Mobile, @PendingAmount, @CreatedAt, @IsDeleted
                    )
                `);

            customerId = result.recordset[0].Id;
        }

        const updateResult = await pool.request()
            .input('ShortBookID', sql.Int, shortBookId)
            .input('RequestedByUser', sql.NVarChar, requestedByUser)
            .query(`
                UPDATE [dbo].[ShortBookItems]
                SET RequestedByUser = @RequestedByUser, Modified_at = GETDATE()
                WHERE ShortBookID = @ShortBookID AND IsDeleted = 0
            `);

        if (updateResult.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'ShortBook item not found or already deleted' });
        }

        res.status(200).json({ message: 'RequestedByUser updated successfully', customerId });
    } catch (err) {
        console.error('Error updating RequestedByUser:', err);
        res.status(500).json({ error: 'Failed to update RequestedByUser' });
    }
};

export const updateShortBookItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { priority, requestedQuantity, distributorName, distributorLocation } = req.body;

        if (!priority || !requestedQuantity || !distributorName || !distributorLocation) {
            return res.status(400).json({ error: 'Priority, RequestedQuantity, DistributorName, and DistributorLocation are required' });
        }

        if (!['Low', 'High'].includes(priority)) {
            return res.status(400).json({ error: 'Invalid priority value' });
        }

        if (requestedQuantity < 1) {
            return res.status(400).json({ error: 'RequestedQuantity must be at least 1' });
        }

        const pool = req.app.get('db');
        const result = await pool.request()
            .input('ShortBookID', sql.Int, id)
            .input('Priority', sql.NVarChar, priority)
            .input('RequestedQuantity', sql.Int, requestedQuantity)
            .input('DistributorName', sql.NVarChar, distributorName)
            .input('DistributorLocation', sql.NVarChar, distributorLocation)
            .query(`
                UPDATE [dbo].[ShortBookItems]
                SET Priority = @Priority, 
                    RequestedQuantity = @RequestedQuantity,
                    DistributorName = @DistributorName,
                    DistributorLocation = @DistributorLocation,
                    Modified_at = GETDATE()
                WHERE ShortBookID = @ShortBookID AND IsDeleted = 0
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'ShortBook item not found or already deleted' });
        }

        res.status(200).json({ message: 'Item updated successfully' });
    } catch (err) {
        console.error('Error updating ShortBook item:', err);
        res.status(500).json({ error: 'Failed to update item' });
    }
};

export const updateShortBookStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Ordered', 'Delivered', 'PO Generated'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const pool = req.app.get('db');
        const result = await pool.request()
            .input('ShortBookID', sql.Int, id)
            .input('Status', sql.NVarChar, status)
            .query(`
                UPDATE [dbo].[ShortBookItems]
                SET Status = @Status, Modified_at = GETDATE()
                WHERE ShortBookID = @ShortBookID AND IsDeleted = 0
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'ShortBook item not found or already deleted' });
        }

        res.status(200).json({ message: 'Status updated successfully' });
    } catch (err) {
        console.error('Error updating ShortBook status:', err);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

export const createPurchaseOrder = async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items provided for PO' });
        }

        const pool = req.app.get('db');

        // Create a new PO
        const poResult = await pool.request()
            .input('CreatedAt', sql.DateTime, new Date())
            .input('IsDeleted', sql.Bit, 0)
            .query(`
                INSERT INTO [dbo].[PurchaseOrders] (CreatedAt, IsDeleted)
                OUTPUT INSERTED.PurchaseOrderID
                VALUES (@CreatedAt, @IsDeleted)
            `);

        const poId = poResult.recordset[0].PurchaseOrderID;

        // Insert items into PurchaseOrderItems
        for (const item of items) {
            await pool.request()
                .input('PurchaseOrderID', sql.Int, poId)
                .input('ShortBookID', sql.Int, item.ShortBookID)
                .input('ItemName', sql.NVarChar, item.ItemName)
                .input('ItemDescription', sql.NVarChar, item.ItemDescription)
                .input('DistributorName', sql.NVarChar, item.DistributorName)
                .input('DistributorLocation', sql.NVarChar, item.DistributorLocation)
                .input('Manufacturer', sql.NVarChar, item.Manufacturer)
                .input('RequestedQuantity', sql.Int, item.RequestedQuantity)
                .query(`
                    INSERT INTO [dbo].[PurchaseOrderItems] (
                        PurchaseOrderID, ShortBookID, ItemName, ItemDescription,
                        DistributorName, DistributorLocation, Manufacturer, RequestedQuantity
                    )
                    VALUES (
                        @PurchaseOrderID, @ShortBookID, @ItemName, @ItemDescription,
                        @DistributorName, @DistributorLocation, @Manufacturer, @RequestedQuantity
                    )
                `);
        }

        // Update status of ShortBook items to "PO Generated"
        for (const item of items) {
            await pool.request()
                .input('ShortBookID', sql.Int, item.ShortBookID)
                .input('Status', sql.NVarChar, 'PO Generated')
                .query(`
                    UPDATE [dbo].[ShortBookItems]
                    SET Status = @Status, Modified_at = GETDATE()
                    WHERE ShortBookID = @ShortBookID AND IsDeleted = 0
                `);
        }

        res.status(201).json({ poId });
    } catch (err) {
        console.error('Error creating purchase order:', err);
        res.status(500).json({ error: 'Failed to create purchase order' });
    }
};

export const getPurchaseOrders = async (req, res) => {
    try {
        const pool = req.app.get('db');
        const poResult = await pool.request().query(`
            SELECT PurchaseOrderID, CONVERT(VARCHAR, CreatedAt, 105) AS CreatedAt
            FROM [dbo].[PurchaseOrders]
            WHERE IsDeleted = 0
            ORDER BY CreatedAt DESC
        `);

        const pos = poResult.recordset;

        const purchaseOrders = [];
        for (const po of pos) {
            const itemsResult = await pool.request()
                .input('PurchaseOrderID', sql.Int, po.PurchaseOrderID)
                .query(`
                    SELECT PurchaseOrderItemID ,ShortBookID, ItemName, ItemDescription, DistributorName,
                           DistributorLocation, Manufacturer, RequestedQuantity
                    FROM [dbo].[PurchaseOrderItems]
                    WHERE PurchaseOrderID = @PurchaseOrderID
                `);

            purchaseOrders.push({
                PurchaseOrderID: po.PurchaseOrderID,
                CreatedAt: po.CreatedAt,
                Items: itemsResult.recordset,
            });
        }

        res.json(purchaseOrders);
    } catch (err) {
        console.error('Error fetching purchase orders:', err);
        res.status(500).json([]);
    }
};

export const updatePurchaseOrderItem = async (req, res) => {
    try {
        const { purchaseOrderItemID } = req.params;
        const { requestedQuantity, manufacturer } = req.body;

        if (!requestedQuantity || !manufacturer) {
            return res.status(400).json({ error: 'RequestedQuantity and Manufacturer are required' });
        }

        if (requestedQuantity < 1) {
            return res.status(400).json({ error: 'RequestedQuantity must be at least 1' });
        }

        const pool = req.app.get('db');
        const result = await pool.request()
            .input('PurchaseOrderItemID', sql.Int, purchaseOrderItemID)
            .input('RequestedQuantity', sql.Int, requestedQuantity)
            .input('Manufacturer', sql.NVarChar, manufacturer)
            .query(`
                UPDATE [dbo].[PurchaseOrderItems]
                SET RequestedQuantity = @RequestedQuantity,
                    Manufacturer = @Manufacturer,
                    UpdatedAt = GETDATE()
                WHERE PurchaseOrderItemID = @PurchaseOrderItemID AND IsDeleted = 0
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Purchase order item not found or already deleted' });
        }

        res.status(200).json({ message: 'Purchase order item updated successfully' });
    } catch (err) {
        console.error('Error updating PurchaseOrder item:', err);
        res.status(500).json({ error: 'Failed to update purchase order item' });
    }
};