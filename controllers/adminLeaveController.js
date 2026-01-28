import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Leave from '../models/Leave.js';
import LeaveBalance from '../models/LeaveBalance.js';
import User from '../models/User.js';

// Utility function to calculate working days
const calculateWorkingDays = (startDate, endDate) => {
  let days = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Skip weekends (Sunday = 0, Saturday = 6)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return days;
};

// Get all leaves with filters
export const getAllLeaves = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    type,
    userId,
    department,
    fromDate,
    toDate,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter
  const filter = {};
  
  if (status && status !== 'all') {
    filter.status = status;
  }
  
  if (type && type !== 'all') {
    filter.type = type;
  }
  
  if (userId) {
    filter.user = userId;
  }
  
  if (department) {
    // Get users in this department
    const users = await User.find({ department }, '_id');
    filter.user = { $in: users.map(u => u._id) };
  }
  
  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) {
      filter.createdAt.$gte = new Date(fromDate);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
  }
  
  // Search by user name, email, or employee ID
  if (search) {
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ]
    }, '_id');
    
    if (users.length > 0) {
      filter.user = { $in: users.map(u => u._id) };
    } else {
      // No matching users, return empty result
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          pages: 0,
          limit: parseInt(limit)
        }
      });
    }
  }

  // Parse pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Get total count
  const total = await Leave.countDocuments(filter);

  // Get leaves with pagination
  const leaves = await Leave.find(filter)
    .populate('user', 'name email employeeId department position')
    .populate('approvedBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .lean();

  res.json({
    success: true,
    data: leaves,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum
    }
  });
});

// Create leave (admin can create for any user)
export const createLeave = asyncHandler(async (req, res) => {
  const {
    user: userId,
    type,
    from,
    to,
    reason,
    status = 'Pending',
    attachment,
    remarks
  } = req.body;

  // Validation
  if (!userId || !type || !from || !to || !reason) {
    res.status(400);
    throw new Error('Please fill all required fields');
  }

  // Check user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Parse dates
  const fromDate = new Date(from);
  const toDate = new Date(to);
  
  // Validate dates
  if (fromDate > toDate) {
    res.status(400);
    throw new Error('From date must be before or equal to To date');
  }
  
  if (fromDate < new Date()) {
    res.status(400);
    throw new Error('Cannot apply for leave in the past');
  }

  // Calculate working days
  const days = calculateWorkingDays(fromDate, toDate);
  
  if (days <= 0) {
    res.status(400);
    throw new Error('Leave must be for at least 1 working day');
  }

  // Check for overlapping leaves
  const overlappingLeave = await Leave.findOne({
    user: userId,
    status: { $in: ['Pending', 'Approved'] },
    $or: [
      {
        $and: [
          { from: { $lte: toDate } },
          { to: { $gte: fromDate } }
        ]
      }
    ]
  });

  if (overlappingLeave) {
    res.status(400);
    throw new Error(`User already has an approved/pending leave from ${overlappingLeave.from.toDateString()} to ${overlappingLeave.to.toDateString()}`);
  }

  // Check leave balance if status is Approved
  let balanceUpdate = null;
  if (status === 'Approved') {
    const year = fromDate.getFullYear();
    
    // Get or create leave balance
    let leaveBalance = await LeaveBalance.findOne({ user: userId, year });
    
    if (!leaveBalance) {
      leaveBalance = await LeaveBalance.create({
        user: userId,
        year,
        balances: {
          emergency: 5,
          sick: 10,
          annual: 15,
          casual: 7
        }
      });
    }
    
    // Check available balance
    const availableBalance = leaveBalance.balances[type] - leaveBalance.used[type];
    
    if (availableBalance < days) {
      res.status(400);
      throw new Error(`Insufficient ${type} leave balance. Available: ${availableBalance}, Requested: ${days}`);
    }
    
    // Update used balance
    leaveBalance.used[type] += days;
    await leaveBalance.save();
    
    balanceUpdate = {
      type,
      previousBalance: availableBalance,
      newBalance: availableBalance - days,
      deducted: days
    };
  }

  // Create leave
  const leave = await Leave.create({
    user: userId,
    type,
    from: fromDate,
    to: toDate,
    days,
    reason,
    status,
    approvedBy: status === 'Approved' ? req.user._id : null,
    attachment,
    remarks
  });

  // Populate and return
  const populatedLeave = await Leave.findById(leave._id)
    .populate('user', 'name email employeeId department position')
    .populate('approvedBy', 'name email');

  res.status(201).json({
    success: true,
    message: `Leave ${status === 'Approved' ? 'approved and created' : 'created successfully'}`,
    data: populatedLeave,
    balanceUpdate
  });
});

// Update leave status
export const updateLeaveStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  // Validate status
  if (!status || !['Approved', 'Rejected', 'Pending'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status. Must be one of: Approved, Rejected, Pending');
  }

  // Find leave
  const leave = await Leave.findById(id);
  if (!leave) {
    res.status(404);
    throw new Error('Leave not found');
  }

  // Check if status is changing
  const isStatusChanged = leave.status !== status;
  const previousStatus = leave.status;

  // Handle balance updates
  let balanceUpdate = null;
  
  // If changing from Pending to Approved
  if (isStatusChanged && previousStatus === 'Pending' && status === 'Approved') {
    const year = leave.from.getFullYear();
    
    // Get or create balance
    let leaveBalance = await LeaveBalance.findOne({ user: leave.user, year });
    
    if (!leaveBalance) {
      leaveBalance = await LeaveBalance.create({
        user: leave.user,
        year,
        balances: {
          emergency: 5,
          sick: 10,
          annual: 15,
          casual: 7
        }
      });
    }
    
    // Check balance
    const availableBalance = leaveBalance.balances[leave.type] - leaveBalance.used[leave.type];
    
    if (availableBalance < leave.days) {
      res.status(400);
      throw new Error(`Insufficient ${leave.type} leave balance. Available: ${availableBalance}, Required: ${leave.days}`);
    }
    
    // Deduct from balance
    leaveBalance.used[leave.type] += leave.days;
    await leaveBalance.save();
    
    balanceUpdate = {
      type: leave.type,
      previousBalance: availableBalance,
      newBalance: availableBalance - leave.days,
      deducted: leave.days
    };
  }
  
  // If changing from Approved to Rejected or Pending
  if (isStatusChanged && previousStatus === 'Approved' && status !== 'Approved') {
    const year = leave.from.getFullYear();
    
    // Get balance
    const leaveBalance = await LeaveBalance.findOne({ user: leave.user, year });
    
    if (leaveBalance) {
      // Restore balance
      leaveBalance.used[leave.type] = Math.max(0, leaveBalance.used[leave.type] - leave.days);
      await leaveBalance.save();
      
      balanceUpdate = {
        type: leave.type,
        restored: leave.days
      };
    }
  }

  // Update leave
  leave.status = status;
  leave.approvedBy = status === 'Approved' ? req.user._id : null;
  
  if (remarks) {
    leave.remarks = remarks;
  }
  
  await leave.save();

  // Populate and return
  const populatedLeave = await Leave.findById(leave._id)
    .populate('user', 'name email employeeId department position')
    .populate('approvedBy', 'name email');

  res.json({
    success: true,
    message: `Leave ${status.toLowerCase()} successfully`,
    data: populatedLeave,
    balanceUpdate
  });
});

// Get leaves by user
export const getLeavesByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, type, year } = req.query;

  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Build filter
  const filter = { user: userId };
  
  if (status && status !== 'all') {
    filter.status = status;
  }
  
  if (type && type !== 'all') {
    filter.type = type;
  }
  
  if (year) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    endDate.setHours(23, 59, 59, 999);
    filter.from = { $gte: startDate, $lte: endDate };
  }

  // Get leaves
  const leaves = await Leave.find(filter)
    .populate('approvedBy', 'name email')
    .sort({ from: -1 });

  // Get leave balance
  const currentYear = year || new Date().getFullYear();
  let balance = await LeaveBalance.findOne({ user: userId, year: currentYear });
  
  if (!balance) {
    balance = {
      balances: {
        emergency: 5,
        sick: 10,
        annual: 15,
        casual: 7
      },
      used: {
        emergency: 0,
        sick: 0,
        annual: 0,
        casual: 0
      }
    };
  }

  // Calculate available balances
  const availableBalances = {
    emergency: balance.balances.emergency - balance.used.emergency,
    sick: balance.balances.sick - balance.used.sick,
    annual: balance.balances.annual - balance.used.annual,
    casual: balance.balances.casual - balance.used.casual
  };

  res.json({
    success: true,
    data: leaves,
    balance: {
      ...balance.toObject ? balance.toObject() : balance,
      available: availableBalances
    },
    user: {
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      department: user.department,
      position: user.position
    }
  });
});

// Delete leave
export const deleteLeave = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const leave = await Leave.findById(id);
  if (!leave) {
    res.status(404);
    throw new Error('Leave not found');
  }

  // If leave was approved, restore balance
  if (leave.status === 'Approved') {
    const year = leave.from.getFullYear();
    const leaveBalance = await LeaveBalance.findOne({ user: leave.user, year });
    
    if (leaveBalance) {
      leaveBalance.used[leave.type] = Math.max(0, leaveBalance.used[leave.type] - leave.days);
      await leaveBalance.save();
    }
  }

  await leave.deleteOne();

  res.json({
    success: true,
    message: 'Leave deleted successfully'
  });
});

// Get leave statistics
export const getLeaveStatistics = asyncHandler(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31`);
  endDate.setHours(23, 59, 59, 999);

  // Get total leaves count
  const totalLeaves = await Leave.countDocuments({
    from: { $gte: startDate, $lte: endDate }
  });

  // Get leaves by status
  const leavesByStatus = await Leave.aggregate([
    {
      $match: {
        from: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalDays: { $sum: '$days' }
      }
    }
  ]);

  // Get leaves by type
  const leavesByType = await Leave.aggregate([
    {
      $match: {
        from: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalDays: { $sum: '$days' }
      }
    }
  ]);

  // Get monthly leaves
  const monthlyLeaves = await Leave.aggregate([
    {
      $match: {
        from: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $month: '$from' },
        count: { $sum: 1 },
        totalDays: { $sum: '$days' },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
        },
        approved: {
          $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
        },
        rejected: {
          $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  // Get department-wise statistics
  const departmentStats = await Leave.aggregate([
    {
      $match: {
        from: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $group: {
        _id: '$user.department',
        count: { $sum: 1 },
        totalDays: { $sum: '$days' },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
        },
        approved: {
          $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
        },
        rejected: {
          $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { totalDays: -1 }
    }
  ]);

  // Get top 10 users with most leaves
  const topUsers = await Leave.aggregate([
    {
      $match: {
        from: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$user',
        totalLeaves: { $sum: 1 },
        totalDays: { $sum: '$days' },
        approvedLeaves: {
          $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
        },
        approvedDays: {
          $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, '$days', 0] }
        }
      }
    },
    {
      $sort: { totalDays: -1 }
    },
    {
      $limit: 10
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$user.name',
        email: '$user.email',
        employeeId: '$user.employeeId',
        department: '$user.department',
        totalLeaves: 1,
        totalDays: 1,
        approvedLeaves: 1,
        approvedDays: 1
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      totalLeaves,
      leavesByStatus,
      leavesByType,
      monthlyLeaves,
      departmentStats,
      topUsers,
      year
    }
  });
});

// Bulk update leave status
export const bulkUpdateLeaveStatus = asyncHandler(async (req, res) => {
  const { leaveIds, status, remarks } = req.body;

  if (!leaveIds || !Array.isArray(leaveIds) || leaveIds.length === 0) {
    res.status(400);
    throw new Error('Please provide leave IDs');
  }

  if (!status || !['Approved', 'Rejected'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  // Update all leaves
  const updatePromises = leaveIds.map(async (leaveId) => {
    try {
      const leave = await Leave.findById(leaveId);
      
      if (!leave) {
        return { id: leaveId, success: false, error: 'Leave not found' };
      }

      // Skip if already in the target status
      if (leave.status === status) {
        return { id: leaveId, success: true, message: 'Already in target status' };
      }

      // Handle balance updates
      const previousStatus = leave.status;
      
      // If changing from Pending to Approved
      if (previousStatus === 'Pending' && status === 'Approved') {
        const year = leave.from.getFullYear();
        const leaveBalance = await LeaveBalance.findOne({ user: leave.user, year });
        
        if (leaveBalance) {
          const availableBalance = leaveBalance.balances[leave.type] - leaveBalance.used[leave.type];
          
          if (availableBalance < leave.days) {
            return {
              id: leaveId,
              success: false,
              error: `Insufficient ${leave.type} balance`
            };
          }
          
          leaveBalance.used[leave.type] += leave.days;
          await leaveBalance.save();
        }
      }
      
      // If changing from Approved to Rejected
      if (previousStatus === 'Approved' && status === 'Rejected') {
        const year = leave.from.getFullYear();
        const leaveBalance = await LeaveBalance.findOne({ user: leave.user, year });
        
        if (leaveBalance) {
          leaveBalance.used[leave.type] = Math.max(0, leaveBalance.used[leave.type] - leave.days);
          await leaveBalance.save();
        }
      }

      // Update leave
      leave.status = status;
      leave.approvedBy = status === 'Approved' ? req.user._id : null;
      
      if (remarks) {
        leave.remarks = remarks;
      }
      
      await leave.save();
      
      return { id: leaveId, success: true };
    } catch (error) {
      return { id: leaveId, success: false, error: error.message };
    }
  });

  const results = await Promise.all(updatePromises);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  res.json({
    success: true,
    message: `Processed ${results.length} leaves. Successful: ${successful.length}, Failed: ${failed.length}`,
    successful,
    failed
  });
});

// Get dashboard statistics
export const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  // Get today's leaves
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  
  const todayLeaves = await Leave.countDocuments({
    from: { $lte: todayEnd },
    to: { $gte: todayStart },
    status: 'Approved'
  });

  // Get pending leaves
  const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

  // Get this month's leaves
  const monthStart = new Date(currentYear, currentMonth - 1, 1);
  const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
  
  const monthlyLeaves = await Leave.countDocuments({
    from: { $gte: monthStart, $lte: monthEnd }
  });

  // Get total employees
  const totalEmployees = await User.countDocuments({ isActive: true });

  // Get leaves by type (current year)
  const leavesByType = await Leave.aggregate([
    {
      $match: {
        from: { 
          $gte: new Date(`${currentYear}-01-01`),
          $lte: new Date(`${currentYear}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        days: { $sum: '$days' }
      }
    }
  ]);

  // Get recent leaves
  const recentLeaves = await Leave.find()
    .populate('user', 'name email employeeId department')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  res.json({
    success: true,
    data: {
      todayLeaves,
      pendingLeaves,
      monthlyLeaves,
      totalEmployees,
      leavesByType,
      recentLeaves
    }
  });
});