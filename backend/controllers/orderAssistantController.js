import { sql } from '../config/db.js';

export const getSaleItems = async (req, res) => {
  try {
    const { filter } = req.query; // Get filter from query params (Today, Yesterday, etc.)
    const pool = req.app.get('db');

    // Determine date range for filtering based on the selected filter
    let dateFilter = '';
    const today = new Date();
    if (filter) {
      if (filter === 'Today') {
        const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        dateFilter = `AND si.CreatedAt >= '${startOfToday}'`;
      } else if (filter === 'Yesterday') {
        const startOfYesterday = new Date(today.setDate(today.getDate() - 1)).setHours(0, 0, 0, 0);
        const endOfYesterday = new Date(today.setDate(today.getDate() - 1)).setHours(23, 59, 59, 999);
        dateFilter = `AND si.CreatedAt BETWEEN '${new Date(startOfYesterday).toISOString()}' AND '${new Date(endOfYesterday).toISOString()}'`;
      } else if (filter === 'Last 3 Days') {
        const threeDaysAgo = new Date(today.setDate(today.getDate() - 3)).setHours(0, 0, 0, 0);
        dateFilter = `AND si.CreatedAt >= '${new Date(threeDaysAgo).toISOString()}'`;
      } else if (filter === '5 Days') {
        const fiveDaysAgo = new Date(today.setDate(today.getDate() - 5)).setHours(0, 0, 0, 0);
        dateFilter = `AND si.CreatedAt >= '${new Date(fiveDaysAgo).toISOString()}'`;
      }
    }

    // Fetch sale items with manufacturer name, current quantity, and MinQty/MaxQty from PurchaseItems
    const saleItemsResult = await pool.request().query(`
      SELECT 
        si.[SaleItemID] AS ItemID, 
        si.[ItemName], 
        si.[Pack], 
        si.[Quantity] AS SellQty,
        si.[IsDeleted],
        si.[CreatedAt],
        si.[ItemId] AS MedId,
        pm.[manufacturer_name],
        pm.[Quantity] AS CurrentStock,
        pi.[MinQty],
        pi.[MaxQty]
      FROM [ReactDB].[dbo].[SaleItems] si
      LEFT JOIN [ReactDB].[dbo].[Pharma_Medicines] pm ON si.ItemId = pm.id
      LEFT JOIN [ReactDB].[dbo].[PurchaseItems] pi ON si.ItemId = pi.MedId
      WHERE si.IsDeleted = 0 ${dateFilter}
    `);

    const saleItems = saleItemsResult.recordset;

    // Fetch all Shortbook items to check if items are already in Shortbook
    const shortBookItemsResult = await pool.request().query(`
      SELECT ItemId
      FROM [dbo].[ShortBookItems]
      WHERE IsDeleted = 0
    `);
    const shortBookItemIds = new Set(shortBookItemsResult.recordset.map(item => item.ItemId));

    // Map sale items and add IsInShortbook and IsSuggested flags
    const itemsWithFlags = saleItems.map(item => ({
      ...item,
      IsInShortbook: shortBookItemIds.has(item.ItemID),
      IsSuggested: item.MinQty && item.CurrentStock < item.MinQty,
      Stock: item.CurrentStock || 0,
    }));

    res.status(200).json(itemsWithFlags);
  } catch (err) {
    console.error('Error fetching sale items:', err);
    res.status(500).json({ error: 'Failed to fetch sale items' });
  }
};

export const getPurchaseItems = async (req, res) => {
  try {
    const { filter } = req.query; // Get filter from query params
    const pool = req.app.get('db');

    // Determine date range for filtering based on the selected filter
    let dateFilter = '';
    const today = new Date();
    if (filter) {
      if (filter === 'Today') {
        const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        dateFilter = `AND pi.CreatedAt >= '${startOfToday}'`;
      } else if (filter === 'Yesterday') {
        const startOfYesterday = new Date(today.setDate(today.getDate() - 1)).setHours(0, 0, 0, 0);
        const endOfYesterday = new Date(today.setDate(today.getDate() - 1)).setHours(23, 59, 59, 999);
        dateFilter = `AND pi.CreatedAt BETWEEN '${new Date(startOfYesterday).toISOString()}' AND '${new Date(endOfYesterday).toISOString()}'`;
      } else if (filter === 'Last 3 Days') {
        const threeDaysAgo = new Date(today.setDate(today.getDate() - 3)).setHours(0, 0, 0, 0);
        dateFilter = `AND pi.CreatedAt >= '${new Date(threeDaysAgo).toISOString()}'`;
      } else if (filter === '5 Days') {
        const fiveDaysAgo = new Date(today.setDate(today.getDate() - 5)).setHours(0, 0, 0, 0);
        dateFilter = `AND pi.CreatedAt >= '${new Date(fiveDaysAgo).toISOString()}'`;
      }
    }

    // Fetch purchase items with manufacturer name and current quantity
    const purchaseItemsResult = await pool.request().query(`
      SELECT 
        pi.[ItemID], 
        pi.[ItemName], 
        pi.[Pack], 
        pi.[Quantity] AS SellQty, 
        pi.[MinQty], 
        pi.[MaxQty], 
        pi.[IsDeleted],
        pi.[CreatedAt],
        pm.[manufacturer_name],
        pm.[Quantity] AS CurrentStock
      FROM [ReactDB].[dbo].[PurchaseItems] pi
      LEFT JOIN [ReactDB].[dbo].[Pharma_Medicines] pm ON pi.MedId = pm.id
      WHERE pi.IsDeleted = 0 ${dateFilter}
    `);

    const purchaseItems = purchaseItemsResult.recordset;

    // Fetch all Shortbook items to check if items are already in Shortbook
    const shortBookItemsResult = await pool.request().query(`
      SELECT ItemId
      FROM [dbo].[ShortBookItems]
      WHERE IsDeleted = 0
    `);
    const shortBookItemIds = new Set(shortBookItemsResult.recordset.map(item => item.ItemId));

    // Map purchase items and add IsInShortbook and IsSuggested flags
    const itemsWithFlags = purchaseItems.map(item => ({
      ...item,
      IsInShortbook: shortBookItemIds.has(item.ItemID),
      IsSuggested: item.MinQty && item.CurrentStock < item.MinQty,
      Stock: item.CurrentStock || 0,
    }));

    res.status(200).json(itemsWithFlags);
  } catch (err) {
    console.error('Error fetching purchase items:', err);
    res.status(500).json({ error: 'Failed to fetch purchase items' });
  }
};

export const addToShortbook = async (req, res) => {
  try {
    const { itemId, type } = req.body;
    if (!itemId || !type) {
      return res.status(400).json({ error: 'ItemId and type are required' });
    }

    const pool = req.app.get('db');

    // Check if the item is already in Shortbook
    const existingItem = await pool.request()
      .input('ItemId', sql.Int, itemId)
      .query(`
        SELECT ShortBookID
        FROM [dbo].[ShortBookItems]
        WHERE ItemId = @ItemId AND IsDeleted = 0
      `);

    if (existingItem.recordset.length > 0) {
      return res.status(400).json({ error: 'Item already in Shortbook' });
    }

    // Fetch item details based on type (Sale or Purchase) and include manufacturer_name
    let itemDetails;
    let manufacturerName = 'Unknown';
    if (type === 'Sell') {
      const saleItemResult = await pool.request()
        .input('ItemID', sql.Int, itemId)
        .query(`
          SELECT 
            si.ItemName, 
            si.Pack, 
            si.Quantity,
            pm.manufacturer_name,
            pm.Quantity AS CurrentStock,
            pi.MinQty,
            pi.MaxQty
          FROM [ReactDB].[dbo].[SaleItems] si
          LEFT JOIN [ReactDB].[dbo].[Pharma_Medicines] pm ON si.ItemId = pm.id
          LEFT JOIN [ReactDB].[dbo].[PurchaseItems] pi ON si.ItemId = pi.MedId
          WHERE si.SaleItemID = @ItemID AND si.IsDeleted = 0
        `);
      itemDetails = saleItemResult.recordset[0];
      if (itemDetails && itemDetails.manufacturer_name) {
        manufacturerName = itemDetails.manufacturer_name;
      }
    } else if (type === 'Purchase') {
      const purchaseItemResult = await pool.request()
        .input('ItemID', sql.Int, itemId)
        .query(`
          SELECT 
            pi.ItemName, 
            pi.Pack, 
            pi.Quantity, 
            pi.MinQty, 
            pi.MaxQty,
            pm.manufacturer_name,
            pm.Quantity AS CurrentStock
          FROM [ReactDB].[dbo].[PurchaseItems] pi
          LEFT JOIN [ReactDB].[dbo].[Pharma_Medicines] pm ON pi.MedId = pm.id
          WHERE pi.ItemID = @ItemID AND pi.IsDeleted = 0
        `);
      itemDetails = purchaseItemResult.recordset[0];
      if (itemDetails && itemDetails.manufacturer_name) {
        manufacturerName = itemDetails.manufacturer_name;
      }
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    if (!itemDetails) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Calculate requested quantity
    const requestedQuantity = itemDetails.MinQty && itemDetails.CurrentStock < itemDetails.MinQty
      ? itemDetails.MinQty - itemDetails.CurrentStock
      : 1;

    // Add item to Shortbook with manufacturer_name
    const result = await pool.request()
      .input('ItemId', sql.Int, itemId)
      .input('ItemName', sql.NVarChar, itemDetails.ItemName)
      .input('ItemDescription', sql.NVarChar, itemDetails.Pack || 'N/A')
      .input('DateAdded', sql.Date, new Date())
      .input('DistributorName', sql.NVarChar, 'Unknown')
      .input('DistributorLocation', sql.NVarChar, 'Unknown')
      .input('Manufacturer', sql.NVarChar, manufacturerName)
      .input('Priority', sql.NVarChar, 'Low')
      .input('MinStock', sql.Int, itemDetails.MinQty || 0)
      .input('CurrentStock', sql.Int, itemDetails.CurrentStock || 0)
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
    console.error('Error adding to Shortbook:', err);
    res.status(500).json({ error: 'Failed to add item to Shortbook' });
  }
};