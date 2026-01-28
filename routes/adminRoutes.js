import express from 'express';
import { getAdminEmployees, registerEmployee } from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected and require admin or super admin
router.use(protect);
router.use(authorize('admin', 'super_admin'));

router.get('/employees', getAdminEmployees);
router.post('/employees', registerEmployee);

export default router;
