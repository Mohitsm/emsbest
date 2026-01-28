
import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import { getFileInfo, cleanupUploadedFiles } from '../middlewares/a.js';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

/* =========================
   HELPER FUNCTIONS
========================= */
const validateAnnouncementAccess = async (announcementId, userId) => {
  const announcement = await Announcement.findById(announcementId);
  if (!announcement) {
    throw new Error('Announcement not found');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.role === 'super_admin') return { announcement, user, canEdit: true };

  const canEdit = announcement.createdBy.toString() === userId.toString();
  const canAccess = await announcement.canAccess(user);

  return { announcement, user, canEdit, canAccess };
};

/* =========================
   MAIN CONTROLLERS
========================= */

// @desc    Get all announcements (for users) - FIXED VERSION
// @route   GET /api/announcements
// @access  Private (all authenticated users)


export const getAnnouncements = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentDate = new Date();

    /** -----------------------
     * BASE QUERY
     ------------------------ */
    const query = {
      isActive: true,
      $or: [
        { validUntil: { $gte: currentDate } },
        { validUntil: null }
      ]
    };

    /** -----------------------
     * ADMIN FILTER (IMPORTANT)
     ------------------------ */
    if (user.role === 'super_admin') {
      // super_admin → sees everything (or limit if you want)
    } 
    else if (user.role === 'admin') {
      // admin → only their announcements
      query.adminId = user._id;
    } 
    else {
      // user → only their admin's announcements
      query.adminId = user.createdBy;
    }

    /** -----------------------
     * TARGET AUDIENCE FILTER
     ------------------------ */
    const audience = ['all'];
    if (user.role) audience.push(user.role);
    if (user.department) audience.push(user.department);

    query.targetAudience = { $in: audience };

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name email role department')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });

  } catch (error) {
    console.error('getAnnouncements error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private (all authenticated users)
export const getAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Getting announcement:', id, 'for user:', req.user._id);
    
    const { announcement, user, canEdit, canAccess } = await validateAnnouncementAccess(id, req.user._id);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this announcement'
      });
    }

    // Track view
    await announcement.trackView(req.user._id);

    // Populate additional info
    const populatedAnnouncement = await Announcement.findById(id)
      .populate('createdBy', 'name email role department profilePicture')
      .populate('adminId', 'name email role');

    // Mark as read in cookie
    const readAnnouncements = req.cookies?.readAnnouncements 
      ? JSON.parse(req.cookies.readAnnouncements) 
      : [];
    
    if (!readAnnouncements.includes(id)) {
      readAnnouncements.push(id);
      res.cookie('readAnnouncements', JSON.stringify(readAnnouncements), {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...populatedAnnouncement.toObject(),
        isExpired: announcement.isExpired,
        canEdit: canEdit || user.role === 'super_admin',
        canDelete: canEdit || user.role === 'super_admin',
        views: announcement.views || 0
      }
    });
  } catch (error) {
    console.error('Error in getAnnouncement:', error);
    if (error.message === 'Announcement not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create announcement with file upload
// @route   POST /api/announcements
// @access  Private (admin/super_admin)
export const createAnnouncement = async (req, res) => {
  let attachments = [];
  
  try {
    const { title, content, targetAudience, priority, validUntil, tags } = req.body;
    const createdBy = req.user._id;

    console.log('Creating announcement with data:', {
      title, content, createdBy, targetAudience, priority, validUntil, tags
    });

    // Validate required fields
    if (!title || !content) {
      if (req.files) {
        cleanupUploadedFiles(req);
      }
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Parse arrays if they are strings
    const audienceArray = Array.isArray(targetAudience) 
      ? targetAudience 
      : (targetAudience ? targetAudience.split(',').map(item => item.trim()).filter(item => item) : ['all']);
    
    const tagsArray = tags ? (
      Array.isArray(tags) 
        ? tags 
        : tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    ) : [];

    // Process uploaded files
    if (req.files && req.files.attachments) {
      const files = Array.isArray(req.files.attachments) 
        ? req.files.attachments 
        : [req.files.attachments];
      
      attachments = files.map(file => getFileInfo(file));
    }

    // Create announcement data
    const announcementData = {
      title,
      content,
      createdBy,
      targetAudience: audienceArray,
      priority: priority || 'medium',
      validUntil: validUntil || null,
      tags: tagsArray,
      attachments
    };

    console.log('Announcement data prepared:', {
      ...announcementData,
      attachmentsCount: attachments.length
    });

    const announcement = await Announcement.create(announcementData);

    // Populate creator and admin details
    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name email role department profilePicture')
      .populate('adminId', 'name email role');

    console.log('Announcement created successfully:', announcement._id);

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: populatedAnnouncement
    });

  } catch (error) {
    // Clean up uploaded files on error
    if (attachments.length > 0) {
      attachments.forEach(attachment => {
        const filePath = path.join(process.cwd(), 'uploads', 'announcements', attachment.fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    console.error('Error in createAnnouncement:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      errors: error.errors
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : null
    });
  }
};

// @desc    Update announcement with file management
// @route   PUT /api/announcements/:id
// @access  Private (admin/super_admin)
export const updateAnnouncement = async (req, res) => {
  let newAttachments = [];
  let announcementToUpdate = null;

  try {
    const { id } = req.params;
    const { title, content, targetAudience, priority, isActive, validUntil, tags, 
            attachmentsToRemove, existingAttachments } = req.body;

    // Find the announcement
    announcementToUpdate = await Announcement.findById(id);
    
    if (!announcementToUpdate) {
      if (req.files) cleanupUploadedFiles(req);
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check authorization
    if (announcementToUpdate.createdBy.toString() !== req.user._id.toString() && 
        req.user.role !== 'super_admin') {
      if (req.files) cleanupUploadedFiles(req);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this announcement'
      });
    }

    // Process new attachments
    if (req.files && req.files.attachments) {
      const files = Array.isArray(req.files.attachments) 
        ? req.files.attachments 
        : [req.files.attachments];
      
      newAttachments = files.map(file => getFileInfo(file));
    }

    // Process attachments to remove
    let finalAttachments = existingAttachments 
      ? (Array.isArray(existingAttachments) ? existingAttachments : JSON.parse(existingAttachments))
      : announcementToUpdate.attachments;

    if (attachmentsToRemove) {
      const toRemove = Array.isArray(attachmentsToRemove) 
        ? attachmentsToRemove 
        : JSON.parse(attachmentsToRemove);
      
      // Delete files from server
      toRemove.forEach(fileId => {
        const fileToRemove = announcementToUpdate.attachments.find(
          att => att._id.toString() === fileId
        );
        if (fileToRemove) {
          const filePath = path.join(process.cwd(), 'uploads', 'announcements', fileToRemove.fileName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });

      // Remove from attachments array
      finalAttachments = finalAttachments.filter(
        att => !toRemove.includes(att._id?.toString())
      );
    }

    // Add new attachments
    finalAttachments = [...finalAttachments, ...newAttachments];

    // Parse arrays
    const audienceArray = targetAudience 
      ? (Array.isArray(targetAudience) ? targetAudience : targetAudience.split(',').map(item => item.trim()).filter(item => item))
      : announcementToUpdate.targetAudience;
    
    const tagsArray = tags 
      ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()).filter(tag => tag))
      : announcementToUpdate.tags;

    // Update announcement
    const updateData = {
      title: title || announcementToUpdate.title,
      content: content || announcementToUpdate.content,
      targetAudience: audienceArray,
      priority: priority || announcementToUpdate.priority,
      isActive: isActive !== undefined ? isActive : announcementToUpdate.isActive,
      validUntil: validUntil || announcementToUpdate.validUntil,
      tags: tagsArray,
      attachments: finalAttachments,
      adminId: announcementToUpdate.adminId // Preserve existing adminId
    };

    console.log('Updating announcement with data:', {
      id,
      updateData: { ...updateData, attachmentsCount: finalAttachments.length }
    });

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('createdBy', 'name email role department profilePicture')
      .populate('adminId', 'name email role');

    console.log('Announcement updated successfully:', id);

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: updatedAnnouncement
    });

  } catch (error) {
    // Clean up uploaded files on error
    if (newAttachments.length > 0) {
      newAttachments.forEach(attachment => {
        const filePath = path.join(process.cwd(), 'uploads', 'announcements', attachment.fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    console.error('Error in updateAnnouncement:', error);
    console.error('Error details:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update announcement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete announcement and associated files
// @route   DELETE /api/announcements/:id
// @access  Private (admin/super_admin)
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Deleting announcement:', id, 'by user:', req.user._id);

    const announcement = await Announcement.findById(id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check authorization
    if (announcement.createdBy.toString() !== req.user._id.toString() && 
        req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this announcement'
      });
    }

    // Delete associated files
    if (announcement.attachments && announcement.attachments.length > 0) {
      announcement.attachments.forEach(attachment => {
        const filePath = path.join(process.cwd(), 'uploads', 'announcements', attachment.fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    // Delete the announcement
    await announcement.deleteOne();

    console.log('Announcement deleted successfully:', id);

    res.status(200).json({
      success: true,
      message: 'Announcement and associated files deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteAnnouncement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all announcements for admin dashboard
// @route   GET /api/announcements/admin/all
// @access  Private (admin/super_admin)
export const getAllAnnouncementsForAdmin = async (req, res) => {
  try {
    const { 
      search, 
      targetAudience, 
      priority, 
      isActive,
      startDate,
      endDate,
      createdBy,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('Admin fetching announcements with params:', {
      user: req.user._id,
      role: req.user.role,
      search, targetAudience, priority, isActive, page, limit
    });

    let query = {};

    // For admin, only show their own announcements
    if (req.user.role === 'admin') {
      query.adminId = req.user._id;
    }
    // Super admin can see all

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Filters
    if (targetAudience && targetAudience !== 'all') {
      query.targetAudience = { $in: [targetAudience] };
    }
    if (priority) query.priority = priority;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (createdBy) query.createdBy = createdBy;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Only show active announcements unless specified
    if (isActive === undefined) {
      query.isActive = true;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Announcement.countDocuments(query);

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name email role department profilePicture')
      .populate('adminId', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate stats based on role
    let stats = {};
    if (req.user.role === 'super_admin') {
      stats = {
        total: await Announcement.countDocuments({}),
        active: await Announcement.countDocuments({ isActive: true }),
        urgent: await Announcement.countDocuments({ priority: 'urgent', isActive: true }),
        expired: await Announcement.countDocuments({
          validUntil: { $lt: new Date() },
          isActive: true
        })
      };
    } else {
      stats = {
        total: await Announcement.countDocuments({ adminId: req.user._id }),
        active: await Announcement.countDocuments({ adminId: req.user._id, isActive: true }),
        urgent: await Announcement.countDocuments({ 
          adminId: req.user._id, 
          priority: 'urgent', 
          isActive: true 
        }),
        expired: await Announcement.countDocuments({
          adminId: req.user._id,
          validUntil: { $lt: new Date() },
          isActive: true
        })
      };
    }

    console.log(`Admin view: Found ${announcements.length} announcements`);

    res.status(200).json({
      success: true,
      count: announcements.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      stats,
      data: announcements
    });
  } catch (error) {
    console.error('Error in getAllAnnouncementsForAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get announcements by admin ID
// @route   GET /api/announcements/admin/:adminId
// @access  Private (super_admin only)
export const getAnnouncementsByAdminId = async (req, res) => {
  try {
    const { adminId } = req.params;
    const {
      search,
      targetAudience,
      priority,
      isActive = true,
      startDate,
      endDate,
      createdBy,
      includeExpired = false,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('Fetching announcements by admin ID:', adminId);

    // Authorization check
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can view announcements by admin ID'
      });
    }

    // Verify admin exists
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Get announcements using model method
    const result = await Announcement.getAnnouncementsByAdminId(adminId, {
      search,
      targetAudience,
      priority,
      isActive,
      startDate,
      endDate,
      createdBy,
      includeExpired,
      page,
      limit,
      sortBy,
      sortOrder
    });

    // Get admin stats
    const adminStats = await User.getAdminByIdWithStats(adminId);

    res.status(200).json({
      success: true,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        department: admin.department
      },
      adminStats: adminStats?.stats || {},
      ...result
    });
  } catch (error) {
    console.error('Error in getAnnouncementsByAdminId:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get announcements for admin's managed users
// @route   GET /api/announcements/admin/:adminId/users
// @access  Private (admin/super_admin)
export const getAnnouncementsForAdminUsers = async (req, res) => {
  try {
    const { adminId } = req.params;

    console.log('Fetching announcements for admin users:', adminId);

    // Authorization check
    if (req.user.role === 'admin' && req.user._id.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view announcements for your own managed users'
      });
    }

    // Verify admin exists
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Get announcements for admin's users
    const announcements = await Announcement.getAnnouncementsForAdminUsers(adminId);

    // Get managed users
    const managedUsers = await User.getManagedUsersByAdmin(adminId);

    // Categorize announcements
    const categorizedAnnouncements = {
      adminAnnouncements: announcements.filter(a => a.adminId?.toString() === adminId.toString()),
      generalAnnouncements: announcements.filter(a => a.adminId?.toString() !== adminId.toString()),
      byPriority: {
        urgent: announcements.filter(a => a.priority === 'urgent'),
        high: announcements.filter(a => a.priority === 'high'),
        medium: announcements.filter(a => a.priority === 'medium'),
        low: announcements.filter(a => a.priority === 'low')
      },
      byDepartment: {}
    };

    // Group by department
    const departments = ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations'];
    departments.forEach(dept => {
      categorizedAnnouncements.byDepartment[dept] = 
        announcements.filter(a => a.targetAudience.includes(dept));
    });

    // Get announcement stats
    const stats = await Announcement.getAnnouncementStatsByAdmin(adminId);

    res.status(200).json({
      success: true,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email
      },
      managedUsers: {
        total: managedUsers.length,
        list: managedUsers
      },
      announcements: {
        total: announcements.length,
        categorized: categorizedAnnouncements,
        stats: stats[0] || {}
      },
      data: announcements
    });
  } catch (error) {
    console.error('Error in getAnnouncementsForAdminUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all admins with announcement stats
// @route   GET /api/announcements/admins
// @access  Private (super_admin only)
export const getAllAdminsWithAnnouncements = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can access this endpoint'
      });
    }

    const admins = await User.getAllAdminsWithStats();

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    console.error('Error in getAllAdminsWithAnnouncements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admins',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to format date


// @desc    Toggle announcement status
// @route   PATCH /api/announcements/:id/toggle-status
// @access  Private (admin/super_admin)
export const toggleAnnouncementStatus = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Toggling status for announcement:', id);

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check authorization
    if (announcement.createdBy.toString() !== req.user._id.toString() && 
        req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this announcement'
      });
    }

    announcement.isActive = !announcement.isActive;
    await announcement.save();

    console.log('Announcement status toggled:', {
      id,
      newStatus: announcement.isActive
    });

    res.status(200).json({
      success: true,
      message: `Announcement ${announcement.isActive ? 'activated' : 'deactivated'} successfully`,
      data: announcement
    });
  } catch (error) {
    console.error('Error in toggleAnnouncementStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Download attachment
// @route   GET /api/announcements/:id/attachments/:fileId/download
// @access  Private
export const downloadAttachment = async (req, res) => {
  try {
    const { id, fileId } = req.params;

    console.log('Downloading attachment:', { id, fileId, user: req.user._id });

    // Validate access
    const { announcement, canAccess } = await validateAnnouncementAccess(id, req.user._id);
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this file'
      });
    }

    // Find the attachment
    const attachment = announcement.attachments.find(
      att => att._id?.toString() === fileId
    );

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Construct file path
    const filePath = path.join(process.cwd(), 'uploads', 'announcements', attachment.fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    console.log('Sending file:', attachment.originalName);

    // Set headers for download
    res.setHeader('Content-Type', attachment.fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName || attachment.fileName}"`);
    res.setHeader('Content-Length', attachment.fileSize);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error in downloadAttachment:', error);
    if (error.message === 'Announcement not found' || error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete single attachment
// @route   DELETE /api/announcements/:id/attachments/:fileId
// @access  Private (admin/super_admin)
export const deleteAttachment = async (req, res) => {
  try {
    const { id, fileId } = req.params;

    console.log('Deleting attachment:', { id, fileId });

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check authorization
    if (announcement.createdBy.toString() !== req.user._id.toString() && 
        req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this file'
      });
    }

    // Find the attachment
    const attachment = announcement.attachments.find(
      att => att._id?.toString() === fileId
    );

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete file from server
    const filePath = path.join(process.cwd(), 'uploads', 'announcements', attachment.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from attachments array
    announcement.attachments = announcement.attachments.filter(
      att => att._id?.toString() !== fileId
    );

    await announcement.save();

    console.log('Attachment deleted successfully:', fileId);

    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteAttachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attachment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Track announcement view
// @route   POST /api/announcements/:id/view
// @access  Private
export const trackAnnouncementView = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Tracking view for announcement:', id, 'by user:', req.user._id);

    const { announcement, canAccess } = await validateAnnouncementAccess(id, req.user._id);
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this announcement'
      });
    }

    // Track view
    await announcement.trackView(req.user._id);

    console.log('View tracked for announcement:', id);

    res.status(200).json({
      success: true,
      message: 'View tracked successfully',
      views: announcement.views || 0
    });
  } catch (error) {
    console.error('Error in trackAnnouncementView:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track view',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get announcement analytics for admin
// @route   GET /api/announcements/admin/:adminId/analytics
// @access  Private (admin/super_admin)
export const getAnnouncementAnalytics = async (req, res) => {
  try {
    const { adminId } = req.params;

    console.log('Fetching analytics for admin:', adminId);

    // Authorization check
    if (req.user.role === 'admin' && req.user._id.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own analytics'
      });
    }

    // Get analytics
    const analytics = await Announcement.getAnnouncementStatsByAdmin(adminId);

    // Get managed users for context
    const managedUsers = await User.getManagedUsersByAdmin(adminId);

    res.status(200).json({
      success: true,
      analytics: analytics[0] || {},
      managedUsers: {
        total: managedUsers.length,
        departments: [...new Set(managedUsers.map(u => u.department))]
      }
    });
  } catch (error) {
    console.error('Error in getAnnouncementAnalytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Mark announcement as read
// @route   POST /api/announcements/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Marking announcement as read:', id, 'for user:', req.user._id);

    const { announcement, canAccess } = await validateAnnouncementAccess(id, req.user._id);
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this announcement'
      });
    }

    // Get current read announcements
    let readAnnouncements = [];
    try {
      if (req.cookies?.readAnnouncements) {
        readAnnouncements = JSON.parse(req.cookies.readAnnouncements);
      }
    } catch (error) {
      console.warn('Error parsing readAnnouncements cookie:', error);
    }

    // Add announcement ID if not already present
    if (!readAnnouncements.includes(id)) {
      readAnnouncements.push(id);
      
      // Update cookie
      res.cookie('readAnnouncements', JSON.stringify(readAnnouncements), {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });
    }

    console.log('Announcement marked as read:', id);

    res.status(200).json({
      success: true,
      message: 'Announcement marked as read'
    });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Clear all read announcements
// @route   POST /api/announcements/clear-read
// @access  Private
export const clearReadAnnouncements = async (req, res) => {
  try {
    console.log('Clearing read announcements for user:', req.user._id);

    // Clear the cookie
    res.clearCookie('readAnnouncements');

    console.log('Read announcements cleared');

    res.status(200).json({
      success: true,
      message: 'Read announcements cleared successfully'
    });
  } catch (error) {
    console.error('Error in clearReadAnnouncements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear read announcements',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};