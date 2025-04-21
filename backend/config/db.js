import sql from 'mssql/msnodesqlv8.js';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  driver: 'msnodesqlv8',
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
  },
};

let pool;

const ConnectMSSQL = async () => {
  if (pool) return pool; // Reuse existing pool

  try {
    pool = await new sql.ConnectionPool(config).connect();
    console.log('✅ Connected to MSSQL database');
    return pool;
  } catch (error) {
    console.error('❌ Error connecting to MSSQL:', error);
    throw error;
  }
};

export { sql, ConnectMSSQL };
