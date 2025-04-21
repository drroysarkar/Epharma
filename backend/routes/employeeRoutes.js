import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { addEmployee, fetchEmployees, updateEmployee, deleteEmployee } from '../controllers/employeeController.js';

const router = express.Router();

router.post('/add', upload.single('profileImage'), addEmployee);
router.get('/all', fetchEmployees);
router.put('/:id', upload.single('profile_Image'), updateEmployee); // Edit
router.delete('/:id', deleteEmployee); // Soft delete

export default router;
