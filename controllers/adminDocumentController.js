// controllers/adminDocumentController.js
import Document from '../models/Document.js';
import User from '../models/User.js';

// @desc    Get all documents (Admin)
// @route   GET /api/admin/documents
// @access  Private (Admin/Super Admin)
export const getAllDocuments = async (req, res) => {
  try {
    const {
      status,
      type,
      userId,
      department,
      verifiedBy,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'uploadDate',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build query
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (userId) query.user = userId;
    if (verifiedBy) query.verifiedBy = verifiedBy;

    // Department filter
    if (department && department !== 'All') {
      // Find users in the department and get their documents
      const usersInDept = await User.find({ department }).select('_id');
      const userIds = usersInDept.map(user => user._id);
      query.user = { $in: userIds };
    }

    // Date range filter
    if (startDate || endDate) {
      query.uploadDate = {};
      if (startDate) query.uploadDate.$gte = new Date(startDate);
      if (endDate) query.uploadDate.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { documentNumber: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const documents = await Document.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email department shifts')
      .populate('verifiedBy', 'name email')
      .populate('createdBy', 'name email');

    const total = await Document.countDocuments(query);

    // Get statistics
    const stats = await Document.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: documents.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      stats,
      data: documents
    });
  } catch (error) {
    console.error('Get all documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get documents by user ID
// @route   GET /api/admin/documents/user/:userId
// @access  Private (Admin/Super Admin)
export const getDocumentsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      status,
      type,
      page = 1,
      limit = 10
    } = req.query;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build query
    const query = { user: userId };
    if (status) query.status = status;
    if (type) query.type = type;

    // Get documents
    const documents = await Document.find(query)
      .sort({ uploadDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('verifiedBy', 'name email');

    const total = await Document.countDocuments(query);

    // Get user statistics
    const userStats = await Document.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          department: user.department,
          role: user.role
        },
        documents,
        statistics: {
          total,
          stats: userStats
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get documents by user ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update document status (Admin)
// @route   PUT /api/admin/documents/:id/status
// @access  Private (Admin/Super Admin)
export const updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status || !['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Update document
    const updateData = {
      status,
      remarks: remarks || document.remarks,
      verifiedBy: req.user._id,
      verifiedDate: new Date()
    };

    const updatedDocument = await Document.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email')
     .populate('verifiedBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Document status updated to ${status}`,
      data: updatedDocument
    });
  } catch (error) {
    console.error('Update document status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Bulk update document status
// @route   PUT /api/admin/documents/bulk-status
// @access  Private (Admin/Super Admin)
export const bulkUpdateDocumentStatus = async (req, res) => {
  try {
    const { documentIds, status, remarks } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Document IDs array is required'
      });
    }

    if (!status || !['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }

    // Update multiple documents
    const updateData = {
      status,
      remarks: remarks || '',
      verifiedBy: req.user._id,
      verifiedDate: new Date()
    };

    const result = await Document.updateMany(
      { _id: { $in: documentIds } },
      updateData
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} documents updated to ${status}`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update document status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get document statistics (Admin)
// @route   GET /api/admin/documents/stats
// @access  Private (Admin/Super Admin)
export const getAdminDocumentStats = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    // Build match query
    const matchQuery = {};
    
    if (startDate || endDate) {
      matchQuery.uploadDate = {};
      if (startDate) matchQuery.uploadDate.$gte = new Date(startDate);
      if (endDate) matchQuery.uploadDate.$lte = new Date(endDate);
    }

    // Department filter
    if (department && department !== 'All') {
      const usersInDept = await User.find({ department }).select('_id');
      const userIds = usersInDept.map(user => user._id);
      matchQuery.user = { $in: userIds };
    }

    // Get overall statistics
    const overallStats = await Document.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get statistics by document type
    const typeStats = await Document.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get statistics by department
    const departmentStats = await Document.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      { $match: matchQuery },
      {
        $group: {
          _id: '$userInfo.department',
          count: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get daily upload statistics for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await Document.aggregate([
      {
        $match: {
          ...matchQuery,
          uploadDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$uploadDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: overallStats,
        byType: typeStats,
        byDepartment: departmentStats,
        daily: dailyStats,
        total: await Document.countDocuments(matchQuery)
      }
    });
  } catch (error) {
    console.error('Get admin document stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get expired documents
// @route   GET /api/admin/documents/expired
// @access  Private (Admin/Super Admin)
export const getExpiredDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const now = new Date();

    const query = {
      expiryDate: { $lt: now },
      status: { $ne: 'expired' }
    };

    const documents = await Document.find(query)
      .sort({ expiryDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email department')
      .populate('verifiedBy', 'name email');

    const total = await Document.countDocuments(query);

    // Auto-update status to expired
    await Document.updateMany(
      query,
      { status: 'expired' }
    );

    res.status(200).json({
      success: true,
      count: documents.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: documents
    });
  } catch (error) {
    console.error('Get expired documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};