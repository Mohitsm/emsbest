
import express from 'express';
import {
  // Employee
  createReimbursement,
  getMyReimbursements,
  getReimbursementById,
  updateReimbursement,
  deleteReimbursement,
  
  // Admin
  getAllReimbursementsByAdmin,
  getAdminDashboardStats,
  updateReimbursementStatus,
  bulkUpdateStatus,
  getReimbursementsByUserId,
  exportReimbursements,
  getCategoryStats,
  
  // Super Admin
  getAllReimbursements,
  
  // Shared
  downloadProof
} from '../controllers/reimbursementController.js';

import { protect, authorize } from '../middlewares/auth.js';
import { uploadProof } from '../middlewares/uploadMiddleware.js';
import { authorizeReimbursementAccess } from '../middlewares/reimbursementAuthMiddleware.js';

const router = express.Router();

/* =========================
   Employee Routes
========================= */
router.post('/', 
  protect, 
  uploadProof.single('proof'), 
  createReimbursement
);

router.get('/my', 
  protect, 
  getMyReimbursements
);

router.get('/:id', 
  protect, 
  authorizeReimbursementAccess,
  getReimbursementById
);

router.put('/:id', 
  protect, 
  authorizeReimbursementAccess,
  updateReimbursement
);

router.delete('/:id', 
  protect, 
  authorizeReimbursementAccess,
  deleteReimbursement
);

router.get('/download/:filename', 
  protect, 
  downloadProof
);

/* =========================
   Admin Routes (for users they created)
========================= */
// Get all reimbursements for admin's created users
router.get('/admin/my-users', 
  protect, 
  authorize('admin'), 
  getAllReimbursementsByAdmin
);

// Get admin dashboard statistics
router.get('/admin/dashboard', 
  protect, 
  authorize('admin'), 
  getAdminDashboardStats
);

// Get category statistics
router.get('/admin/category-stats', 
  protect, 
  authorize('admin'), 
  getCategoryStats
);

// Update reimbursement status
router.put('/:id/status', 
  protect, 
  authorize('admin'), 
  updateReimbursementStatus
);

// Bulk update status
router.put('/bulk/status', 
  protect, 
  authorize('admin'), 
  bulkUpdateStatus
);

// Get reimbursements by specific user
router.get('/admin/user/:userId', 
  protect, 
  authorize('admin'), 
  getReimbursementsByUserId
);

// Export reimbursements
router.get('/admin/export', 
  protect, 
  authorize('admin'), 
  exportReimbursements
);

/* =========================
   Super Admin Routes (all reimbursements)
========================= */
router.get('/super-admin/all', 
  protect, 
  authorize('super_admin'), 
  getAllReimbursements
);

export default router;