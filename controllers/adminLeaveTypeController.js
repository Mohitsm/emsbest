import asyncHandler from 'express-async-handler';
import LeaveBalance from '../models/LeaveBalance.js';
import User from '../models/User.js';

// Get all leave type balances
export const getLeaveTypesbalances = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const query = {};
  
  if (year) {
    query.year = parseInt(year);
  }

  const leaveBalances = await LeaveBalance.find(query)
    .populate('user', 'name email employeeId department')
    .sort({ year: -1, 'user.name': 1 });

  res.json({
    success: true,
    data: leaveBalances
  });
});

// Get leave type balance by ID
export const getLeaveTypebalanceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const leaveBalance = await LeaveBalance.findById(id)
    .populate('user', 'name email employeeId department position');
  
  if (!leaveBalance) {
    res.status(404);
    throw new Error('Leave balance not found');
  }

  res.json({
    success: true,
    data: leaveBalance
  });
});

// Create leave type balance
export const createLeaveTypebalances = asyncHandler(async (req, res) => {
  const { userId, year, balances } = req.body;

  // Validation
  if (!userId || !year) {
    res.status(400);
    throw new Error('User ID and year are required');
  }

  // Check user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if balance already exists for this user and year
  const existingBalance = await LeaveBalance.findOne({ user: userId, year });
  if (existingBalance) {
    res.status(400);
    throw new Error('Leave balance already exists for this user and year');
  }

  // Create balance
  const leaveBalance = await LeaveBalance.create({
    user: userId,
    year,
    balances: balances || {
      emergency: 5,
      sick: 10,
      annual: 15,
      casual: 7
    }
  });

  const populatedBalance = await LeaveBalance.findById(leaveBalance._id)
    .populate('user', 'name email employeeId department');

  res.status(201).json({
    success: true,
    message: 'Leave balance created successfully',
    data: populatedBalance
  });
});

// Update leave type balance
export const updateLeaveTypebalances = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { balances, resetUsed } = req.body;

  const leaveBalance = await LeaveBalance.findById(id);
  if (!leaveBalance) {
    res.status(404);
    throw new Error('Leave balance not found');
  }

  // Update balances
  if (balances) {
    Object.keys(balances).forEach(type => {
      if (leaveBalance.balances[type] !== undefined) {
        leaveBalance.balances[type] = balances[type];
      }
    });
  }

  // Reset used balances if requested
  if (resetUsed) {
    leaveBalance.used = {
      emergency: 0,
      sick: 0,
      annual: 0,
      casual: 0
    };
  }

  await leaveBalance.save();

  const populatedBalance = await LeaveBalance.findById(leaveBalance._id)
    .populate('user', 'name email employeeId department');

  res.json({
    success: true,
    message: 'Leave balance updated successfully',
    data: populatedBalance
  });
});

// Delete leave type balance
export const deleteLeaveTypebalances = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const leaveBalance = await LeaveBalance.findById(id);
  if (!leaveBalance) {
    res.status(404);
    throw new Error('Leave balance not found');
  }

  await leaveBalance.deleteOne();

  res.json({
    success: true,
    message: 'Leave balance deleted successfully'
  });
});

// Bulk update leave balances
export const bulkUpdateLeaveBalances = asyncHandler(async (req, res) => {
  const { year, updates } = req.body;

  if (!year || !updates || !Array.isArray(updates)) {
    res.status(400);
    throw new Error('Year and updates array are required');
  }

  const results = [];
  
  for (const update of updates) {
    try {
      const { userId, balances } = update;
      
      if (!userId) {
        results.push({ userId, success: false, error: 'User ID is required' });
        continue;
      }

      // Find or create balance
      let leaveBalance = await LeaveBalance.findOne({ user: userId, year });
      
      if (!leaveBalance) {
        leaveBalance = await LeaveBalance.create({
          user: userId,
          year,
          balances: balances || {
            emergency: 5,
            sick: 10,
            annual: 15,
            casual: 7
          }
        });
        results.push({ userId, success: true, action: 'created' });
      } else {
        // Update existing balance
        Object.keys(balances || {}).forEach(type => {
          if (leaveBalance.balances[type] !== undefined) {
            leaveBalance.balances[type] = balances[type];
          }
        });
        await leaveBalance.save();
        results.push({ userId, success: true, action: 'updated' });
      }
    } catch (error) {
      results.push({ userId: update.userId, success: false, error: error.message });
    }
  }

  res.json({
    success: true,
    message: 'Bulk update completed',
    results
  });
});

// Get leave type configuration
export const getLeaveTypeConfig = asyncHandler(async (req, res) => {
  const defaultConfig = {
    emergency: {
      name: 'Emergency Leave',
      defaultDays: 5,
      description: 'For emergency situations',
      requiresDocument: false
    },
    sick: {
      name: 'Sick Leave',
      defaultDays: 10,
      description: 'For medical reasons',
      requiresDocument: true
    },
    annual: {
      name: 'Annual Leave',
      defaultDays: 15,
      description: 'Paid time off',
      requiresDocument: false
    },
    casual: {
      name: 'Casual Leave',
      defaultDays: 7,
      description: 'Short notice leave',
      requiresDocument: false
    }
  };

  res.json({
    success: true,
    data: defaultConfig
  });
});