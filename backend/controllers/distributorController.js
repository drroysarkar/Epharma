import { ConnectMSSQL, sql } from '../config/db.js';

export const getAllDistributors = async (req, res) => {
  try {
    const pool = await ConnectMSSQL();
    const request = new sql.Request(pool);
    const result = await request.query(`
      SELECT [DistributorID], [Name], [ContactNumber], [Email], [Address], 
             [CreatedAt], [ModifiedAt], [IsDeleted]
      FROM [ReactDB].[dbo].[Distributors]
      WHERE IsDeleted = 0
      ORDER BY CreatedAt DESC
    `);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching distributors:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

export const addDistributor = async (req, res) => {
  const { Name, ContactNumber, Email, Address } = req.body;

  if (!Name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const pool = await ConnectMSSQL();
    const request = new sql.Request(pool);
    const result = await request
      .input('Name', sql.NVarChar, Name)
      .input('ContactNumber', sql.NVarChar, ContactNumber || null)
      .input('Email', sql.NVarChar, Email || null)
      .input('Address', sql.NVarChar, Address || null)
      .query(`
        INSERT INTO [ReactDB].[dbo].[Distributors] (
          Name, ContactNumber, Email, Address, CreatedAt, IsDeleted
        )
        OUTPUT INSERTED.DistributorID
        VALUES (
          @Name, @ContactNumber, @Email, @Address, GETDATE(), 0
        )
      `);

    res.status(201).json({
      success: true,
      distributorID: result.recordset[0].DistributorID,
      message: 'Distributor added successfully',
    });
  } catch (err) {
    console.error('Error adding distributor:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

export const updateDistributor = async (req, res) => {
  const { id } = req.params;
  const { Name, ContactNumber, Email, Address } = req.body;

  if (!Name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const pool = await ConnectMSSQL();
    const request = new sql.Request(pool);
    const result = await request
      .input('DistributorID', sql.Int, id)
      .input('Name', sql.NVarChar, Name)
      .input('ContactNumber', sql.NVarChar, ContactNumber || null)
      .input('Email', sql.NVarChar, Email || null)
      .input('Address', sql.NVarChar, Address || null)
      .query(`
        UPDATE [ReactDB].[dbo].[Distributors]
        SET Name = @Name,
            ContactNumber = @ContactNumber,
            Email = @Email,
            Address = @Address,
            ModifiedAt = GETDATE()
        WHERE DistributorID = @DistributorID AND IsDeleted = 0
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Distributor not found or already deleted' });
    }

    res.status(200).json({ success: true, message: 'Distributor updated successfully' });
  } catch (err) {
    console.error('Error updating distributor:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

export const deleteDistributor = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await ConnectMSSQL();
    const request = new sql.Request(pool);
    const result = await request
      .input('DistributorID', sql.Int, id)
      .query(`
        UPDATE [ReactDB].[dbo].[Distributors]
        SET IsDeleted = 1, ModifiedAt = GETDATE()
        WHERE DistributorID = @DistributorID AND IsDeleted = 0
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Distributor not found or already deleted' });
    }

    res.status(200).json({ success: true, message: 'Distributor deleted successfully' });
  } catch (err) {
    console.error('Error deleting distributor:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};