import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import {
  getAllLeaves,
  createLeave,
  updateLeaveStatus,
  getLeavesByUser,
  deleteLeave,
  getLeaveStatistics,
  bulkUpdateLeaveStatus,
  getDashboardStats
} from '../controllers/adminLeaveController.js';
import {
  createLeaveTypebalances,
  getLeaveTypesbalances,
  getLeaveTypebalanceById,
  updateLeaveTypebalances,
  deleteLeaveTypebalances,
  bulkUpdateLeaveBalances,
  getLeaveTypeConfig
} from '../controllers/adminLeaveTypeController.js';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('admin', 'super_admin'));

// Leave management routes
router.get('/leaves', getAllLeaves);
router.post('/leaves', createLeave);
router.get('/leaves/statistics', getLeaveStatistics);
router.get('/leaves/dashboard', getDashboardStats);
router.get('/leaves/user/:userId', getLeavesByUser);
router.put('/leaves/:id/status', updateLeaveStatus);
router.put('/leaves/bulk-status', bulkUpdateLeaveStatus);
router.delete('/leaves/:id', deleteLeave);

// Leave type/balance management routes
router.post('/balances', createLeaveTypebalances);
router.get('/balances', getLeaveTypesbalances);
router.get('/balances/config', getLeaveTypeConfig);
router.get('/balances/:id', getLeaveTypebalanceById);
router.put('/balances/:id', updateLeaveTypebalances);
router.put('/balances/bulk-update', bulkUpdateLeaveBalances);
router.delete('/balances/:id', deleteLeaveTypebalances);

export default router;