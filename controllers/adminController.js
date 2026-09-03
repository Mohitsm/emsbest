

import User from '../models/User.js';
import Subscription from '../models/Subscription.js';

/* =========================
   Get Admin Employees
========================= */
// GET /api/admin/employees
// Admin + Super Admin
export const getAdminEmployees = async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    const filter =
      req.user.role === 'super_admin'
        ? { role: 'user' }
        : { createdBy: req.user._id, role: 'user' };

    const employees = await User.find(filter).select('-password');

    res.status(200).json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: err.message
    });
  }
};

/* =========================
   Register New Employee
========================= */
// POST /api/admin/employees
// Admin + Super Admin
// export const registerEmployee = async (req, res) => {
//   try {
//     if (!['admin', 'super_admin'].includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to access this route'
//       });
//     }

//     const { email, password, name, company, department, shifts } = req.body;

//     if (!email || !password || !name) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email, password, and name are required'
//       });
//     }

//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return res.status(400).json({
//         success: false,
//         message: 'User already exists'
//       });
//     }

//     const employee = await User.create({
//       email,
//       password,
//       name,
//       role: 'user',
//       company: company || req.user.company,
//       department: department || 'All',
//       shifts: shifts || 'All',
//       createdBy: req.user._id
//     });

//     res.status(201).json({
//       success: true,
//       employee: {
//         id: employee._id,
//         email: employee.email,
//         name: employee.name,
//         role: employee.role,
//         company: employee.company,
//         department: employee.department,
//         shifts: employee.shifts,
//         createdBy: employee.createdBy
//       }
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: 'Error registering employee',
//       error: err.message
//     });
//   }
// };


export const registerEmployee = async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // For admin, check subscription limit
    if (req.user.role === 'admin') {
      const sub = await Subscription.findOne({ adminId: req.user._id });
      if (!sub || sub.status !== 'active' || sub.endDate < new Date()) {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required.',
        });
      }
      if (sub.currentUsers >= sub.maxUsers) {
        return res.status(403).json({
          success: false,
          message: 'User limit reached. Please upgrade your plan.',
          limitReached: true,
        });
      }
    }

    const { email, password, name, company, department, shifts } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required',
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const employee = await User.create({
      email,
      password,
      name,
      role: 'user',
      company: company || req.user.company,
      department: department || 'All',
      shifts: shifts || 'All',
      createdBy: req.user._id,
    });

    // Increment subscription currentUsers for admin (only if not super_admin)
    if (req.user.role === 'admin') {
      await Subscription.findOneAndUpdate(
        { adminId: req.user._id },
        { $inc: { currentUsers: 1 } }
      );
    }

    res.status(201).json({
      success: true,
      employee: {
        id: employee._id,
        email: employee.email,
        name: employee.name,
        role: employee.role,
        company: employee.company,
        department: employee.department,
        shifts: employee.shifts,
        createdBy: employee.createdBy,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error registering employee',
      error: err.message,
    });
  }
};