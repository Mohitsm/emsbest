


import express from 'express';
import {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAllAnnouncementsForAdmin,
  getAnnouncementsByAdminId,
  getAnnouncementsForAdminUsers,
  getAllAdminsWithAnnouncements,
  toggleAnnouncementStatus,
  downloadAttachment,
  deleteAttachment,
  trackAnnouncementView,
  getAnnouncementAnalytics,
  markAsRead,
  clearReadAnnouncements
} from '../controllers/announcementController.js';
import { protect, authorize } from '../middlewares/auth.js';
import upload from '../middlewares/a.js';

const router = express.Router();

// Public routes (none)

// Protected routes
router.use(protect);

// User routes
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncement);
router.post('/:id/view', trackAnnouncementView);
router.post('/:id/read', markAsRead);
router.post('/clear-read', clearReadAnnouncements);
router.get('/:id/attachments/:fileId/download', downloadAttachment);

// Admin routes
router.post('/', authorize('admin', 'super_admin'), 
  upload.fields([{ name: 'attachments', maxCount: 5 }]), 
  createAnnouncement
);
router.put('/:id', authorize('admin', 'super_admin'), 
  upload.fields([{ name: 'attachments', maxCount: 5 }]), 
  updateAnnouncement
);
router.delete('/:id', authorize('admin', 'super_admin'), deleteAnnouncement);
router.patch('/:id/toggle-status', authorize('admin', 'super_admin'), toggleAnnouncementStatus);
router.delete('/:id/attachments/:fileId', authorize('admin', 'super_admin'), deleteAttachment);

// Admin dashboard routes
router.get('/admin/all', authorize('admin', 'super_admin'), getAllAnnouncementsForAdmin);
router.get('/admin/:adminId', authorize('super_admin'), getAnnouncementsByAdminId);
router.get('/admin/:adminId/users', authorize('admin', 'super_admin'), getAnnouncementsForAdminUsers);
router.get('/admin/:adminId/analytics', authorize('admin', 'super_admin'), getAnnouncementAnalytics);
router.get('/admins/all', authorize('super_admin'), getAllAdminsWithAnnouncements);

export default router;