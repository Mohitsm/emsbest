import mongoose from 'mongoose';
import LeaveBalance from '../models/LeaveBalance.js';

export const createLeaveBalance = async (req, res) => {
  try {
    const { user, year, balances } = req.body;

    if (!user || !year) {
      return res.status(400).json({ 
        success: false,
        message: 'User and year are required' 
      });
    }

    const exists = await LeaveBalance.findOne({ user, year });
    if (exists) {
      return res.status(400).json({ 
        success: false,
        message: 'Leave balance for this user and year already exists' 
      });
    }

    const data = await LeaveBalance.create({ 
      user, 
      year, 
      balances: balances || {
        emergency: 5,
        sick: 10,
        annual: 15,
        casual: 7
      }
    });

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const editLeaveBalance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingBalance = await LeaveBalance.findById(id);
    if (!existingBalance) {
      return res.status(404).json({
        success: false,
        message: 'Leave balance not found'
      });
    }

    const data = await LeaveBalance.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name email employeeId');

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteLeaveBalance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedBalance = await LeaveBalance.findByIdAndDelete(id);
    
    if (!deletedBalance) {
      return res.status(404).json({
        success: false,
        message: 'Leave balance not found'
      });
    }

    res.json({
      success: true,
      message: 'Leave balance deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getLeaveBalance = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    let userId;
    
    if (req.user.role === 'user') {
      userId = req.user._id;
    } else if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      userId = req.query.userId || req.user._id;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const balance = await LeaveBalance.findOne({ 
      user: userId, 
      year: parseInt(year) 
    }).populate('user', 'name email employeeId department');

    if (!balance) {
      return res.status(200).json({
        success: true,
        data: {
          user: userId,
          year: parseInt(year),
          message: 'Leave balance not set up for this year',
          balances: {
            emergency: 0,
            sick: 0,
            annual: 0,
            casual: 0
          },
          used: {
            emergency: 0,
            sick: 0,
            annual: 0,
            casual: 0
          },
          available: {
            emergency: 0,
            sick: 0,
            annual: 0,
            casual: 0
          }
        }
      });
    }

    const available = {
      emergency: balance.balances.emergency - balance.used.emergency,
      sick: balance.balances.sick - balance.used.sick,
      annual: balance.balances.annual - balance.used.annual,
      casual: balance.balances.casual - balance.used.casual
    };

    res.json({
      success: true,
      data: {
        ...balance.toObject(),
        available,
        user: balance.user
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getUserLeaveBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    const year = req.query.year || new Date().getFullYear();

    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const balance = await LeaveBalance.findOne({ 
      user: userId, 
      year: parseInt(year) 
    }).populate('user', 'name email employeeId department');

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: 'Leave balance not found for this user and year'
      });
    }

    const available = {
      emergency: balance.balances.emergency - balance.used.emergency,
      sick: balance.balances.sick - balance.used.sick,
      annual: balance.balances.annual - balance.used.annual,
      casual: balance.balances.casual - balance.used.casual
    };

    res.json({
      success: true,
      data: {
        ...balance.toObject(),
        available
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllLeaveBalances = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const { department, search } = req.query;
    
    let query = { year: parseInt(year) };
    
    if (search) {
      const users = await mongoose.model('User').find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      query.user = { $in: users.map(user => user._id) };
    }

    const balances = await LeaveBalance.find(query)
      .populate({
        path: 'user',
        select: 'name email employeeId department position',
        match: department ? { department } : {}
      })
      .sort({ createdAt: -1 });

    const filteredBalances = balances.filter(balance => balance.user !== null);

    const formattedBalances = filteredBalances.map(balance => {
      const available = {
        emergency: balance.balances.emergency - balance.used.emergency,
        sick: balance.balances.sick - balance.used.sick,
        annual: balance.balances.annual - balance.used.annual,
        casual: balance.balances.casual - balance.used.casual
      };
      
      return {
        ...balance.toObject(),
        available
      };
    });

    res.json({
      success: true,
      data: formattedBalances,
      count: formattedBalances.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const bulkCreateLeaveBalances = async (req, res) => {
  try {
    const { year, users } = req.body;

    if (!year || !users || !Array.isArray(users)) {
      return res.status(400).json({
        success: false,
        message: 'Year and users array are required'
      });
    }

    const operations = users.map(user => ({
      updateOne: {
        filter: { user: user.userId, year },
        update: {
          $set: {
            user: user.userId,
            year,
            balances: user.balances || {
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
          }
        },
        upsert: true
      }
    }));

    await LeaveBalance.bulkWrite(operations);

    res.json({
      success: true,
      message: 'Leave balances created/updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};