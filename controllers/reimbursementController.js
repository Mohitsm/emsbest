
import Reimbursement from '../models/Reimbursement.js';
import User from '../models/User.js';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

/* =========================
   Employee Functions
========================= */
export const createReimbursement = async (req, res) => {
  try {
    // Check if user is active
    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive'
      });
    }

    // Get the user's createdBy (admin) field
    const user = await User.findById(req.user._id).select('createdBy');
    
    const reimbursement = await Reimbursement.create({
      user: req.user._id,
      createdByAdmin: user.createdBy || req.user._id, // Set createdByAdmin or default to user's _id
      category: req.body.category,
      amount: req.body.amount,
      description: req.body.description,
      proof: req.file?.filename,
      dateOfExpense: req.body.dateOfExpense || Date.now()
    });

    res.status(201).json({
      success: true,
      data: reimbursement
    });
  } catch (error) {
    console.error('Create reimbursement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reimbursement request'
    });
  }
};

export const getMyReimbursements = async (req, res) => {
  try {
    const reimbursements = await Reimbursement.find({ user: req.user._id })
      .sort('-createdAt')
      .populate('approvedBy', 'name');

    res.json({
      success: true,
      count: reimbursements.length,
      data: reimbursements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reimbursements'
    });
  }
};

export const getReimbursementById = async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.id)
      .populate('user', 'name email department shifts')
      .populate('approvedBy', 'name');

    if (!reimbursement) {
      return res.status(404).json({
        success: false,
        message: 'Reimbursement not found'
      });
    }

    res.json({
      success: true,
      data: reimbursement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reimbursement'
    });
  }
};

export const updateReimbursement = async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({
        success: false,
        message: 'Reimbursement not found'
      });
    }

    // Check if user owns this reimbursement
    if (!reimbursement.user.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this reimbursement'
      });
    }

    // Check if locked
    if (reimbursement.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'This request is locked and cannot be modified'
      });
    }

    // Check if status allows update (only pending can be updated)
    if (reimbursement.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending reimbursements can be updated'
      });
    }

    // Update fields
    reimbursement.category = req.body.category || reimbursement.category;
    reimbursement.amount = req.body.amount || reimbursement.amount;
    reimbursement.description = req.body.description || reimbursement.description;
    reimbursement.dateOfExpense = req.body.dateOfExpense || reimbursement.dateOfExpense;

    await reimbursement.save();

    res.json({
      success: true,
      data: reimbursement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update reimbursement'
    });
  }
};

export const deleteReimbursement = async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({
        success: false,
        message: 'Reimbursement not found'
      });
    }

    // Check if user owns this reimbursement
    if (!reimbursement.user.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this reimbursement'
      });
    }

    // Check if locked
    if (reimbursement.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'This request is locked and cannot be deleted'
      });
    }

    // Check if status allows delete (only pending can be deleted)
    if (reimbursement.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending reimbursements can be deleted'
      });
    }

    // Delete proof file if exists
    if (reimbursement.proof) {
      const filePath = path.join(
        process.cwd(),
        'uploads/reimbursements',
        reimbursement.proof
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await reimbursement.deleteOne();

    res.json({
      success: true,
      message: 'Reimbursement deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete reimbursement'
    });
  }
};

/* =========================
   Admin Functions
========================= */

// Get all reimbursements for users created by the admin
export const getAllReimbursementsByAdmin = async (req, res) => {
  try {
    const adminId = req.user._id;
    
    // Get query parameters
    const { 
      status, 
      category, 
      startDate, 
      endDate,
      search,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter
    const filter = { createdByAdmin: adminId };

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Category filter
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Search filter
    if (search) {
      // Find users matching search
      const users = await User.find({
        createdBy: adminId,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      filter.user = { $in: userIds };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [reimbursements, total] = await Promise.all([
      Reimbursement.find(filter)
        .populate('user', 'name email department shifts')
        .populate('approvedBy', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Reimbursement.countDocuments(filter)
    ]);

    // Get statistics
    const stats = await Reimbursement.aggregate([
      {
        $match: { createdByAdmin: new mongoose.Types.ObjectId(adminId) }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Format statistics
    const statusStats = {
      pending: { count: 0, totalAmount: 0 },
      approved: { count: 0, totalAmount: 0 },
      rejected: { count: 0, totalAmount: 0 },
      paid: { count: 0, totalAmount: 0 }
    };

    stats.forEach(stat => {
      statusStats[stat._id] = {
        count: stat.count,
        totalAmount: stat.totalAmount
      };
    });

    res.json({
      success: true,
      data: reimbursements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      statistics: statusStats,
      summary: {
        totalReimbursements: total,
        totalAmount: stats.reduce((sum, stat) => sum + stat.totalAmount, 0)
      }
    });
  } catch (error) {
    console.error('Get reimbursements by admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reimbursements'
    });
  }
};

// Get all reimbursements (super admin only)
export const getAllReimbursements = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can access all reimbursements'
      });
    }

    const { page = 1, limit = 20, ...filters } = req.query;
    const skip = (page - 1) * limit;

    const query = {};

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters.category && filters.category !== 'all') {
      query.category = filters.category;
    }
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    const [reimbursements, total] = await Promise.all([
      Reimbursement.find(query)
        .populate('user', 'name email company department shifts')
        .populate('createdByAdmin', 'name email')
        .populate('approvedBy', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Reimbursement.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: reimbursements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all reimbursements'
    });
  }
};

// Get dashboard statistics for admin
export const getAdminDashboardStats = async (req, res) => {
  try {
    const adminId = req.user._id;

    // Get current date and start of month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get users created by this admin
    const createdUsers = await User.find({ createdBy: adminId });
    const userIds = createdUsers.map(user => user._id);

    // Get total counts and amounts
    const [totalStats, monthlyStats, categoryStats, recentRequests] = await Promise.all([
      // Total statistics
      Reimbursement.aggregate([
        {
          $match: { 
            createdByAdmin: new mongoose.Types.ObjectId(adminId)
          }
        },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            pendingAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
            },
            approvedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            approvedAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] }
            }
          }
        }
      ]),

      // Monthly statistics
      Reimbursement.aggregate([
        {
          $match: {
            createdByAdmin: new mongoose.Types.ObjectId(adminId),
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]),

      // Category statistics
      Reimbursement.aggregate([
        {
          $match: { 
            createdByAdmin: new mongoose.Types.ObjectId(adminId),
            createdAt: { $gte: startOfYear }
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        },
        {
          $sort: { amount: -1 }
        }
      ]),

      // Recent requests
      Reimbursement.find({ createdByAdmin: adminId })
        .populate('user', 'name email')
        .sort('-createdAt')
        .limit(5)
    ]);

    // Get user statistics
    const userStats = await Promise.all(
      createdUsers.map(async (user) => {
        const userReimbursements = await Reimbursement.find({ user: user._id });
        const pending = userReimbursements.filter(r => r.status === 'pending').length;
        const totalAmount = userReimbursements.reduce((sum, r) => sum + r.amount, 0);

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          department: user.department,
          totalRequests: userReimbursements.length,
          pendingRequests: pending,
          totalAmount: totalAmount
        };
      })
    );

    // Sort users by total amount (descending)
    userStats.sort((a, b) => b.totalAmount - a.totalAmount);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: createdUsers.length,
          totalReimbursements: totalStats[0]?.totalCount || 0,
          totalAmount: totalStats[0]?.totalAmount || 0,
          pendingReimbursements: totalStats[0]?.pendingCount || 0,
          pendingAmount: totalStats[0]?.pendingAmount || 0,
          approvedReimbursements: totalStats[0]?.approvedCount || 0,
          approvedAmount: totalStats[0]?.approvedAmount || 0
        },
        monthlyStats: monthlyStats.map(stat => ({
          month: stat._id,
          count: stat.count,
          amount: stat.amount
        })),
        categoryStats: categoryStats.map(stat => ({
          category: stat._id,
          count: stat.count,
          amount: stat.amount
        })),
        userStats: userStats.slice(0, 10), // Top 10 users
        recentRequests,
        activitySummary: {
          activeUsers: createdUsers.filter(u => u.isActive).length,
          averagePerUser: createdUsers.length > 0 ? 
            (totalStats[0]?.totalAmount || 0) / createdUsers.length : 0,
          highestRequest: Math.max(...userStats.map(u => u.totalAmount))
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

// Update reimbursement status with admin restrictions
export const updateReimbursementStatus = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    const reimbursementId = req.params.id;

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'paid'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Find the reimbursement
    const reimbursement = await Reimbursement.findById(reimbursementId)
      .populate('user');

    if (!reimbursement) {
      return res.status(404).json({
        success: false,
        message: 'Reimbursement not found'
      });
    }

    // Authorization check
    if (req.user.role === 'admin') {
      // Check if this reimbursement belongs to admin's created users
      const user = await User.findById(reimbursement.user._id);
      
      if (!user || !user.createdBy || !user.createdBy.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to manage this reimbursement'
        });
      }
    }

    // Status transition validation
    if (status === 'paid' && reimbursement.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved reimbursements can be marked as paid'
      });
    }

    // Check if already locked for non-super admins
    if (reimbursement.isLocked && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'This reimbursement is locked and cannot be modified'
      });
    }

    // Update reimbursement
    reimbursement.status = status;
    reimbursement.adminRemarks = adminRemarks || '';
    
    if (req.user.role === 'admin' && !reimbursement.isLocked) {
      reimbursement.isLocked = true;
    }
    
    if (status === 'approved') {
      reimbursement.approvedBy = req.user._id;
      reimbursement.approvedAt = Date.now();
    }
    
    if (status === 'paid') {
      reimbursement.isPaid = true;
      reimbursement.paidAt = Date.now();
    }

    await reimbursement.save();

    // Populate for response
    await reimbursement.populate('user', 'name email');
    await reimbursement.populate('approvedBy', 'name');

    res.json({
      success: true,
      message: req.user.role === 'admin' && !reimbursement.isLocked ?
        'Status updated. Request is now locked.' :
        'Status updated successfully',
      data: reimbursement
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
};

// Bulk update status
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { reimbursementIds, status, adminRemarks } = req.body;

    if (!Array.isArray(reimbursementIds) || reimbursementIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No reimbursements selected'
      });
    }

    // Validate status
    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status for bulk update'
      });
    }

    // For admin, check authorization for all reimbursements
    if (req.user.role === 'admin') {
      const reimbursements = await Reimbursement.find({
        _id: { $in: reimbursementIds }
      }).populate('user');

      // Check if all reimbursements belong to admin's created users
      for (const reimbursement of reimbursements) {
        const user = await User.findById(reimbursement.user._id);
        if (!user || !user.createdBy || !user.createdBy.equals(req.user._id)) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to manage all selected reimbursements'
          });
        }

        // Check if any is locked
        if (reimbursement.isLocked) {
          return res.status(400).json({
            success: false,
            message: 'Some reimbursements are locked and cannot be modified'
          });
        }
      }
    }

    // Update all reimbursements
    const updateData = {
      status,
      adminRemarks: adminRemarks || '',
      approvedBy: status === 'approved' ? req.user._id : null,
      approvedAt: status === 'approved' ? Date.now() : null
    };

    if (req.user.role === 'admin') {
      updateData.isLocked = true;
    }

    const result = await Reimbursement.updateMany(
      {
        _id: { $in: reimbursementIds },
        ...(req.user.role === 'admin' ? { isLocked: false } : {})
      },
      updateData
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} reimbursement(s)`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update status'
    });
  }
};

// Get reimbursements by specific user (for admin)
export const getReimbursementsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check authorization
    if (req.user.role === 'admin') {
      const user = await User.findById(userId);
      
      if (!user || !user.createdBy || !user.createdBy.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this user\'s reimbursements'
        });
      }
    }

    const reimbursements = await Reimbursement.find({ user: userId })
      .populate('approvedBy', 'name')
      .sort('-createdAt');

    // Get user details
    const user = await User.findById(userId).select('name email department shifts');

    // Get statistics for this user
    const stats = await Reimbursement.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        user,
        reimbursements,
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Get user reimbursements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reimbursements'
    });
  }
};

// Export reimbursements to CSV/Excel (admin only)
export const exportReimbursements = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { startDate, endDate, format = 'csv' } = req.query;

    const filter = { createdByAdmin: adminId };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const reimbursements = await Reimbursement.find(filter)
      .populate('user', 'name email department shifts')
      .populate('approvedBy', 'name')
      .sort('-createdAt');

    if (format === 'json') {
      return res.json({
        success: true,
        data: reimbursements
      });
    }

    // CSV format
    const headers = [
      'ID',
      'Employee Name',
      'Employee Email',
      'Department',
      'Category',
      'Amount',
      'Description',
      'Status',
      'Date Submitted',
      'Approved By',
      'Admin Remarks'
    ];

    const csvData = reimbursements.map(r => [
      r._id,
      r.user?.name || 'N/A',
      r.user?.email || 'N/A',
      r.user?.department || 'N/A',
      r.category,
      r.amount,
      `"${r.description.replace(/"/g, '""')}"`,
      r.status,
      r.createdAt.toISOString().split('T')[0],
      r.approvedBy?.name || 'N/A',
      r.adminRemarks || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=reimbursements_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export reimbursements'
    });
  }
};

/* =========================
   Utility Functions
========================= */
export const downloadProof = async (req, res) => {
  try {
    const filePath = path.join(
      process.cwd(),
      'uploads/reimbursements',
      req.params.filename
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.download(filePath);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to download file'
    });
  }
};

// Get reimbursement statistics by category
export const getCategoryStats = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const stats = await Reimbursement.aggregate([
      {
        $match: {
          createdByAdmin: new mongoose.Types.ObjectId(adminId),
          createdAt: {
            $gte: startOfYear,
            $lte: endOfYear
          }
        }
      },
      {
        $group: {
          _id: {
            category: '$category',
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          monthlyStats: {
            $push: {
              month: '$_id.month',
              count: '$count',
              amount: '$amount'
            }
          },
          totalCount: { $sum: '$count' },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Category stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category statistics'
    });
  }
};