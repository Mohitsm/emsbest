import User from '../models/User.js';

/* =========================
   Get All Admins
   GET /api/super-admin/admins
   Private (Super Admin)
========================= */
export const getAllAdmins = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    const admins = await User.find({
      role: { $in: ['admin', 'super_admin'] }
    }).select('-password');

    res.status(200).json({
      success: true,
      count: admins.length,
      admins
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching admins',
      error: err.message
    });
  }
};

/* =========================
   Register New Admin
   POST /api/super-admin/admins
   Private (Super Admin)
========================= */
export const registerAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    const { email, password, name, company } = req.body;

    if (!email || !password || !name || !company) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, name, and company are required'
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const admin = await User.create({
      email,
      password,
      name,
      role: 'admin',
      company,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        company: admin.company,
        createdBy: admin.createdBy
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error registering admin',
      error: err.message
    });
  }
};

/* =========================
   Update Admin Password
   PUT /api/super-admin/admins/:id/password
   Private (Super Admin)
========================= */
export const updateAdminPassword = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new password'
      });
    }

    const admin = await User.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (!['admin', 'super_admin'].includes(admin.role)) {
      return res.status(400).json({
        success: false,
        message: 'User is not an admin'
      });
    }

    if (admin.role === 'super_admin' && !admin._id.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change another super admin password'
      });
    }

    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin password updated successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating admin password',
      error: err.message
    });
  }
};

/* =========================
   Get All Users (Super Admin)
   GET /api/super-admin/all-users
   Private (Super Admin)
========================= */
export const getAllUsersSuperAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching all users',
      error: err.message
    });
  }
};
