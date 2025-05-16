// medicinesRouter.js
import express from 'express';
import {
  getAllMedicines,
  getMyMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
} from '../controllers/medicinesController.js';

const router = express.Router();

router.get('/all', getAllMedicines);
router.get('/my', getMyMedicines);
router.post('/', addMedicine);
router.put('/:id', updateMedicine);
router.delete('/:id', deleteMedicine);

export default router;