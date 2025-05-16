import express from 'express';
import {
    addShortBookItem,
    getShortBookItems,
    deleteShortBookItem,
    searchCustomers,
    updateRequestedByUser,
    updateShortBookItem,
    updateShortBookStatus,
    createPurchaseOrder,
    getPurchaseOrders,
    updatePurchaseOrderItem,
} from '../controllers/shortBookController.js';

const router = express.Router();

router.post('/', addShortBookItem);
router.get('/', getShortBookItems);
router.delete('/:id', deleteShortBookItem);
router.get('/customers', searchCustomers);
router.put('/:shortBookId/requested-by', updateRequestedByUser);
router.put('/:id', updateShortBookItem);
router.put('/:id/status', updateShortBookStatus);
router.post('/createpo', createPurchaseOrder);
router.get('/purchase-orders', getPurchaseOrders);
router.post('/purchase-order-items/:purchaseOrderItemID', updatePurchaseOrderItem); 

export default router;