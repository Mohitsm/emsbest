

import User from '../models/User.js';

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
export const registerEmployee = async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    const { email, password, name, company, department, shifts } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const employee = await User.create({
      email,
      password,
      name,
      role: 'user',
      company: company || req.user.company,
      department: department || 'All',
      shifts: shifts || 'All',
      createdBy: req.user._id
    });

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
        createdBy: employee.createdBy
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error registering employee',
      error: err.message
    });
  }
};