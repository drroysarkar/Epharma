import { ConnectMSSQL, sql } from '../config/db.js';

export const searchMedicines = async (req, res) => {
    const { query } = req.query;

    if (!query || query.length < 3) {
        return res.status(400).json({ 
            error: 'Search query must be at least 3 characters long' 
        });
    }

    try {
        const pool = await ConnectMSSQL();
        const request = new sql.Request(pool);
        
        // Search for medicines where name contains the query (case insensitive)
        const result = await request
            .input('query', sql.NVarChar, `%${query}%`)
            .query(`
                SELECT TOP 20 
                    id, name, price, manufacturer_name, 
                    type, batch, expiry, quantity, pack_size_label, short_composition1, short_composition2
                FROM Pharma_Medicines
                WHERE name LIKE @query AND Is_discontinued = 0
                ORDER BY name
            `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error searching medicines:', err);
        res.status(500).json({ 
            error: 'Database error', 
            details: err.message 
        });
    }
};