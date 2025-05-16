import express from 'express';
import {
  getAllDistributors,
  addDistributor,
  updateDistributor,
  deleteDistributor,
} from '../controllers/distributorController.js';

const router = express.Router();

router.get('/all', getAllDistributors);
router.post('/', addDistributor);
router.put('/:id', updateDistributor);
router.delete('/:id', deleteDistributor);

export default router;