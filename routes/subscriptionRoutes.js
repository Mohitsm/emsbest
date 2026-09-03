import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import {
  getSubscription,
  getAvailablePlans,
  purchaseSubscription,
  getAllAdminSubscriptions,
} from '../controllers/subscriptionController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/me', getSubscription);
router.get('/plans', getAvailablePlans);
router.post('/purchase', purchaseSubscription);

// Super admin only
router.get('/admins', authorize('super_admin'), getAllAdminSubscriptions);

export default router;