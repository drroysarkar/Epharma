import { ConnectMSSQL, sql } from '../config/db.js';

export const getAllMedicines = async (req, res) => {
  try {
    const pool = await ConnectMSSQL();
    const request = new sql.Request(pool);
    const result = await request.query(`
      SELECT [id], [name], [Batch], [price], [Expiry], [Quantity], [QtyInLoose], 
             [Is_discontinued], [manufacturer_name], [type], [pack_size_label], 
             [short_composition1], [short_composition2], [UpdatedAt]
      FROM [ReactDB].[dbo].[Pharma_Medicines]
      WHERE IsDeleted = 0
      ORDER BY UpdatedAt DESC
    `);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching medicines:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

export const getMyMedicines = async (req, res) => {
  try {
    const pool = await ConnectMSSQL();
    const request = new sql.Request(pool);
    const result = await request.query(`
      SELECT [id], [name], [Batch], [price], [Expiry], [Quantity], [QtyInLoose], 
             [Is_discontinued], [manufacturer_name], [type], [pack_size_label], 
             [short_composition1], [short_composition2], [UpdatedAt]
      FROM [ReactDB].[dbo].[Pharma_Medicines]
      WHERE Quantity > 0 AND IsDeleted = 0
      ORDER BY UpdatedAt DESC
    `);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching in-stock medicines:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

export const addMedicine = async (req, res) => {
  const {
    name, Batch, price, Expiry, Quantity, QtyInLoose, Is_discontinued,
    manufacturer_name, type, pack_size_label, short_composition1, short_composition2
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const pool = await ConnectMSSQL();
    const request = new sql.Request(pool);
    const result = await request
      .input('name', sql.NVarChar, name)
      .input('Batch', sql.NVarChar, Batch || null)
      .input('price', sql.Float, price || 0)
      .input('Expiry', sql.NVarChar, Expiry || null)
      .input('Quantity', sql.Int, Quantity || 0)
      .input('QtyInLoose', sql.Int, QtyInLoose || 0)
      .input('Is_discontinued', sql.Bit, Is_discontinued || false)
      .input('manufacturer_name', sql.NVarChar, manufacturer_name || null)
      .input('type', sql.NVarChar, type || null)
      .input('pack_size_label', sql.NVarChar, pack_size_label || null)
      .input('short_composition1', sql.NVarChar, short_composition1 || null)
      .input('short_composition2', sql.NVarChar, short_composition2 || null)
      .query(`
        INSERT INTO [ReactDB].[dbo].[Pharma_Medicines] (
          name, Batch, price, Expiry, Quantity, QtyInLoose, Is_discontinued,
          manufacturer_name, type, pack_size_label, short_composition1, short_composition2, UpdatedAt, IsDeleted
        )
        OUTPUT INSERTED.id
        VALUES (
          @name, @Batch, @price, @Expiry, @Quantity, @QtyInLoose, @Is_discontinued,
          @manufacturer_name, @type, @pack_size_label, @short_composition1, @short_composition2, GETDATE(), 0
        )
      `);

    res.status(201).json({
      success: true,
      id: result.recordset[0].id,
      message: 'Medicine added successfully',
    });
  } catch (err) {
    console.error('Error adding medicine:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

export const updateMedicine = async (req, res) => {
  const { id } = req.params;
  const {
    name, Batch, price, Expiry, Quantity, QtyInLoose, Is_discontinued,
    manufacturer_name, type, pack_size_label, short_composition1, short_composition2
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const pool = await ConnectMSSQL();
    const request = new sql.Request(pool);
    const result = await request
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('Batch', sql.NVarChar, Batch || null)
      .input('price', sql.Float, price || 0)
      .input('Expiry', sql.NVarChar, Expiry || null)
      .input('Quantity', sql.Int, Quantity || 0)
      .input('QtyInLoose', sql.Int, QtyInLoose || 0)
      .input('Is_discontinued', sql.Bit, Is_discontinued || false)
      .input('manufacturer_name', sql.NVarChar, manufacturer_name || null)
      .input('type', sql.NVarChar, type || null)
      .input('pack_size_label', sql.NVarChar, pack_size_label || null)
      .input('short_composition1', sql.NVarChar, short_composition1 || null)
      .input('short_composition2', sql.NVarChar, short_composition2 || null)
      .query(`
        UPDATE [ReactDB].[dbo].[Pharma_Medicines]
        SET name = @name,
            Batch = @Batch,
            price = @price,
            Expiry = @Expiry,
            Quantity = @Quantity,
            QtyInLoose = @QtyInLoose,
            Is_discontinued = @Is_discontinued,
            manufacturer_name = @manufacturer_name,
            type = @type,
            pack_size_label = @pack_size_label,
            short_composition1 = @short_composition1,
            short_composition2 = @short_composition2,
            UpdatedAt = GETDATE()
        WHERE id = @id AND IsDeleted = 0
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Medicine not found or already deleted' });
    }

    res.status(200).json({ success: true, message: 'Medicine updated successfully' });
  } catch (err) {
    console.error('Error updating medicine:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

export const deleteMedicine = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await ConnectMSSQL();
    const request = new sql.Request(pool);
    const result = await request
      .input('id', sql.Int, id)
      .query(`
        UPDATE [ReactDB].[dbo].[Pharma_Medicines]
        SET IsDeleted = 1, UpdatedAt = GETDATE()
        WHERE id = @id AND IsDeleted = 0
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Medicine not found or already deleted' });
    }

    res.status(200).json({ success: true, message: 'Medicine deleted successfully' });
  } catch (err) {
    console.error('Error soft-deleting medicine:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};