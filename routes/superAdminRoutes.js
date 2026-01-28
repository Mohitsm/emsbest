import express from 'express';
import { 
  getAllAdmins, 
  registerAdmin, 
  updateAdminPassword,
  getAllUsersSuperAdmin 
} from '../controllers/superAdminController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected and require super admin
router.use(protect);
router.use(authorize('super_admin'));

router.get('/admins', getAllAdmins);
router.post('/admins', registerAdmin);
router.put('/admins/:id/password', updateAdminPassword);
router.get('/all-users', getAllUsersSuperAdmin);

export default router;
