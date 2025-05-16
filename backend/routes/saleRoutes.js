import express from 'express';
import { addSale, getAllSales, deleteSale ,processSaleReturn, getSaleForReturn, saveSalePDF } from '../controllers/saleController.js';

const router = express.Router();

router.post('/', addSale);
router.get('/all', getAllSales);
router.post('/delete/:id', deleteSale);
router.get('/:saleID', getSaleForReturn); 
router.post('/:saleID/return', processSaleReturn);
router.post('/:saleID/save-pdf',  saveSalePDF);

export default router;