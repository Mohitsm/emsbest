import express from 'express';
import {
  createLeaveBalance,
  editLeaveBalance,
  deleteLeaveBalance,
  getLeaveBalance,
  getUserLeaveBalance,
  getAllLeaveBalances,
  bulkCreateLeaveBalances
} from '../controllers/leaveBalanceController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', 
  protect, 
  authorize('admin', 'super_admin'), 
  createLeaveBalance
);

router.post('/bulk',
  protect,
  authorize('admin', 'super_admin'),
  bulkCreateLeaveBalances
);

router.put('/:id', 
  protect, 
  authorize('admin', 'super_admin'), 
  editLeaveBalance
);

router.delete('/:id', 
  protect, 
  authorize('admin', 'super_admin'), 
  deleteLeaveBalance
);

router.get('/user/:userId', 
  protect, 
  authorize('admin', 'super_admin'), 
  getUserLeaveBalance
);

router.get('/all', 
  protect, 
  authorize('admin', 'super_admin'), 
  getAllLeaveBalances
);

router.get('/', 
  protect, 
  getLeaveBalance
);

export default router;