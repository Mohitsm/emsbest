import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const unlinkAsync = promisify(fs.unlink);

/**
 * Remove old file from server
 */
export const removeOldFile = async (filePath) => {
  if (!filePath || filePath.startsWith('http')) return;
  
  try {
    let absolutePath;
    
    // Handle different path formats
    if (filePath.startsWith('/uploads/')) {
      absolutePath = path.join(process.cwd(), 'public', filePath);
    } else if (filePath.startsWith('uploads/')) {
      absolutePath = path.join(process.cwd(), 'public', filePath);
    } else if (filePath.startsWith('http')) {
      // External URL, don't delete
      return;
    } else {
      absolutePath = path.join(process.cwd(), 'public', 'uploads', 'profiles', path.basename(filePath));
    }
    
    if (fs.existsSync(absolutePath)) {
      await unlinkAsync(absolutePath);
      console.log(`Deleted old file: ${absolutePath}`);
    }
  } catch (error) {
    console.error('Error deleting old file:', error.message);
  }
};

/**
 * Generate full URL for files
 */
export const generateFullUrl = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath;
  
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
};

/**
 * Format date to readable string
 */
export const formatDate = (date, format = 'DD-MM-YYYY') => {
  if (!date) return '';
  const d = new Date(date);
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  switch (format) {
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD-MM-YYYY HH:mm':
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    case 'relative':
      return timeAgo(d);
    default:
      return d.toISOString();
  }
};

/**
 * Convert date to time ago format
 */
export const timeAgo = (date) => {
  const now = new Date();
  const seconds = Math.floor((now - new Date(date)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return Math.floor(seconds) + ' seconds ago';
};

/**
 * Validate email
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate phone number
 */
export const validatePhone = (phone) => {
  const re = /^[\+]?[1-9][\d]{0,15}$/;
  return re.test(phone);
};

/**
 * Generate random string
 */
export const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Calculate pagination
 */
export const calculatePagination = (page = 1, limit = 10, total) => {
  const currentPage = parseInt(page);
  const pageSize = parseInt(limit);
  const totalPages = Math.ceil(total / pageSize);
  const skip = (currentPage - 1) * pageSize;
  
  return {
    currentPage,
    pageSize,
    totalPages,
    skip,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};

/**
 * Sanitize data for security
 */
export const sanitizeData = (data) => {
  if (!data) return data;
  
  if (typeof data === 'string') {
    // Remove script tags and other dangerous HTML
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/on\w+='[^']*'/g, '')
      .replace(/javascript:/gi, '')
      .trim();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (typeof data === 'object') {
    const sanitized = {};
    for (const key in data) {
      sanitized[key] = sanitizeData(data[key]);
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Generate avatar URL
 */
export const generateAvatarUrl = (seed = 'default') => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

/**
 * Create directory if not exists
 */
export const createDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Error response formatter
 */
export const errorResponse = (message, errors = null, statusCode = 400) => {
  return {
    success: false,
    message,
    errors,
    statusCode,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Success response formatter
 */
export const successResponse = (data, message = 'Success', meta = null) => {
  return {
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Log activity
 */
export const logActivity = (userId, action, details = {}) => {
  const logEntry = {
    userId,
    action,
    details,
    timestamp: new Date(),
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown',
  };
  
  // Here you would typically save to a database or log file
  console.log('Activity Log:', JSON.stringify(logEntry));
  
  // For production, you might want to save to a database
  // await ActivityLog.create(logEntry);
};

/**
 * Generate unique filename
 */
export const generateUniqueFilename = (originalname) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalname);
  return `${timestamp}-${randomString}${extension}`;
};