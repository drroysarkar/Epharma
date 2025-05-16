import express from 'express';
import { addPurchase , getPurchaseByID, updatePurchaseItems, deletePurchase, getAllPurchases, processPurchaseReturn } from '../controllers/purchaseController.js';

const router = express.Router();

router.post('/', addPurchase);
router.get('/:purchaseID', getPurchaseByID);
router.put('/:purchaseID/items', updatePurchaseItems);
router.get('/', getAllPurchases);
router.post('/:purchaseID/return', processPurchaseReturn);
router.post('/delete/:id', deletePurchase);
export default router;
