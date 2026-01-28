import User from '../models/User.js';

/* =========================
   Get All Users
   GET /api/users
   Private
========================= */
export const getAllUsers = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'super_admin') {
      // No filter
    } else if (req.user.role === 'admin') {
      query = {
        $or: [
          { createdBy: req.user._id },
          { _id: req.user._id }
        ]
      };
    } else {
      query = { _id: req.user._id };
    }

    const users = await User.find(query).select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: err.message
    });
  }
};

/* =========================
   Get Single User
   GET /api/users/:id
   Private
========================= */
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Authorization
    if (req.user.role === 'user' && !user._id.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user'
      });
    }

    if (req.user.role === 'admin' &&
        !user._id.equals(req.user._id) &&
        (!user.createdBy || !user.createdBy.equals(req.user._id))) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: err.message
    });
  }
};

/* =========================
   Update User
   PUT /api/users/:id
   Private
========================= */
export const updateUser = async (req, res) => {
  try {
    const { name, company, department } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update only allowed fields
    user.name = name || user.name;
    user.company = company || user.company;
    user.department = department || user.department;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        department: user.department
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: err.message
    });
  }
};

/* =========================
   Change Password
   PUT /api/users/:id/password
   Private
========================= */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new password'
      });
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isSelf = req.user._id.equals(user._id);

    if (isSelf) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide current password'
        });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    } else {
      if (req.user.role === 'user') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to change this password'
        });
      }

      if (req.user.role === 'admin' &&
          (!user.createdBy || !user.createdBy.equals(req.user._id))) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to change this password'
        });
      }
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: err.message
    });
  }
};

/* =========================
   Delete User
   DELETE /api/users/:id
   Private (Super Admin only)
========================= */
export const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete users'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: err.message
    });
  }
};
