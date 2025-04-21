import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ConnectMSSQL } from './config/db.js';
import employeeRoutes from './routes/employeeRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
ConnectMSSQL().then((pool) => {
    app.set('db', pool);
    console.log('Connected to MSSQL server');
}).catch((error) => {
    console.error('Error connecting to MSSQL database:', error);
    process.exit(1); // Exit the process if connection fails
}   );


app.get('/', (req, res) => {
    res.send('API is running...');
}   );
app.use('/api/employees', employeeRoutes);
app.use('/api/purchases', purchaseRoutes);



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`local : http://localhost:${PORT}`);
});