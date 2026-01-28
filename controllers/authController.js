import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/* =========================
   JWT Helper
========================= */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

/* =========================
   Register User
   POST /api/auth/register
   Public
========================= */
export const register = async (req, res) => {
  try {
    const { email, password, name, role, company, department } = req.body;

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

    const user = await User.create({
      email,
      password,
      name,
      role: role || 'user',
      company,
      department,
      createdBy: req.user?._id || null
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
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
      message: 'Error registering user',
      error: err.message
    });
  }
};

/* =========================
   Login User
   POST /api/auth/login
   Public
========================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
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
      message: 'Error logging in',
      error: err.message
    });
  }
};

/* =========================
   Get Current Logged-in User
   GET /api/auth/me
   Private
========================= */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error getting user',
      error: err.message
    });
  }
};

/* =========================
   Logout User
   GET /api/auth/logout
   Private
========================= */
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
