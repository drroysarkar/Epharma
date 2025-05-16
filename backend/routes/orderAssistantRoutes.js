import express from 'express';
import {
  getSaleItems,
  getPurchaseItems,
  addToShortbook,
} from '../controllers/orderAssistantController.js';

const router = express.Router();

// Fetch sale items
router.get('/sale-items', getSaleItems);

// Fetch purchase items
router.get('/purchase-items', getPurchaseItems);

// Add an item to Shortbook
router.post('/add-to-shortbook', addToShortbook);

export default router;