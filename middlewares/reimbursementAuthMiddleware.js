import Reimbursement from '../models/Reimbursement.js';
import User from '../models/User.js';

export const authorizeReimbursementAccess = async (req, res, next) => {
  try {
    const reimbursementId = req.params.id;
    const user = req.user;

    // Skip if no reimbursement ID (for routes like /my)
    if (!reimbursementId) {
      return next();
    }

    // Super admin has full access
    if (user.role === 'super_admin') {
      return next();
    }

    const reimbursement = await Reimbursement.findById(reimbursementId)
      .populate('user');
    
    if (!reimbursement) {
      return res.status(404).json({
        success: false,
        message: 'Reimbursement not found'
      });
    }

    // Employee can only access their own reimbursements
    if (user.role === 'user') {
      if (reimbursement.user._id.equals(user._id)) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this reimbursement'
      });
    }

    // Admin can only access reimbursements of users they created
    if (user.role === 'admin') {
      const reimbursementUser = await User.findById(reimbursement.user._id);
      
      if (reimbursementUser && 
          reimbursementUser.createdBy && 
          reimbursementUser.createdBy.equals(user._id)) {
        return next();
      }
      
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this reimbursement'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Middleware for admin-only reimbursement operations
export const authorizeAdminReimbursement = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};