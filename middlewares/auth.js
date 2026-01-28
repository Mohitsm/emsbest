// // // // // import jwt from 'jsonwebtoken';
// // // // // import User from '../models/User.js';

// // // // // /* =========================
// // // // //    Protect Routes
// // // // // ========================= */
// // // // // export const protect = async (req, res, next) => {
// // // // //   let token;

// // // // //   if (
// // // // //     req.headers.authorization &&
// // // // //     req.headers.authorization.startsWith('Bearer ')
// // // // //   ) {
// // // // //     token = req.headers.authorization.split(' ')[1];
// // // // //   }

// // // // //   if (!token) {
// // // // //     return res.status(401).json({
// // // // //       success: false,
// // // // //       message: 'Not authorized to access this route'
// // // // //     });
// // // // //   }

// // // // //   try {
// // // // //     const decoded = jwt.verify(token, process.env.JWT_SECRET);

// // // // //     const user = await User.findById(decoded.id).select('-password');
// // // // //     if (!user || !user.isActive) {
// // // // //       return res.status(401).json({
// // // // //         success: false,
// // // // //         message: 'User not found or inactive'
// // // // //       });
// // // // //     }

// // // // //     req.user = user;
// // // // //     next();
// // // // //   } catch (err) {
// // // // //     return res.status(401).json({
// // // // //       success: false,
// // // // //       message: 'Invalid or expired token'
// // // // //     });
// // // // //   }
// // // // // };

// // // // // /* =========================
// // // // //    Role Authorization
// // // // // ========================= */
// // // // // export const authorize = (...roles) => {
// // // // //   return (req, res, next) => {
// // // // //     if (!req.user || !roles.includes(req.user.role)) {
// // // // //       return res.status(403).json({
// // // // //         success: false,
// // // // //         message: `Role ${req.user?.role} is not allowed`
// // // // //       });
// // // // //     }
// // // // //     next();
// // // // //   };
// // // // // };

// // // // // /* =========================
// // // // //    User Modification Rules
// // // // // ========================= */
// // // // // export const canModifyUser = async (req, res, next) => {
// // // // //   const targetUserId = req.params.id || req.body.userId;

// // // // //   if (!targetUserId) {
// // // // //     return res.status(400).json({
// // // // //       success: false,
// // // // //       message: 'Target user ID is required'
// // // // //     });
// // // // //   }

// // // // //   // Super Admin: god mode
// // // // //   if (req.user.role === 'super_admin') {
// // // // //     return next();
// // // // //   }

// // // // //   try {
// // // // //     const targetUser = await User.findById(targetUserId);
// // // // //     if (!targetUser) {
// // // // //       return res.status(404).json({
// // // // //         success: false,
// // // // //         message: 'User not found'
// // // // //       });
// // // // //     }

// // // // //     // Admin rules
// // // // //     if (req.user.role === 'admin') {
// // // // //       // Admin can modify themselves
// // // // //       if (targetUser._id.equals(req.user._id)) {
// // // // //         return next();
// // // // //       }

// // // // //       // Admin can modify users they created
// // // // //       if (
// // // // //         targetUser.createdBy &&
// // // // //         targetUser.createdBy.equals(req.user._id)
// // // // //       ) {
// // // // //         return next();
// // // // //       }
// // // // //     }

// // // // //     // Normal user: self only
// // // // //     if (
// // // // //       req.user.role === 'user' &&
// // // // //       targetUser._id.equals(req.user._id)
// // // // //     ) {
// // // // //       return next();
// // // // //     }

// // // // //     return res.status(403).json({
// // // // //       success: false,
// // // // //       message: 'Not authorized to modify this user'
// // // // //     });
// // // // //   } catch (err) {
// // // // //     return res.status(500).json({
// // // // //       success: false,
// // // // //       message: 'Server error'
// // // // //     });
// // // // //   }
// // // // // };
// // // // import jwt from 'jsonwebtoken';
// // // // import User from '../models/User.js';

// // // // /* =========================
// // // //    Protect Routes
// // // // ========================= */
// // // // export const protect = async (req, res, next) => {
// // // //   let token;

// // // //   if (
// // // //     req.headers.authorization &&
// // // //     req.headers.authorization.startsWith('Bearer ')
// // // //   ) {
// // // //     token = req.headers.authorization.split(' ')[1];
// // // //   }

// // // //   if (!token) {
// // // //     return res.status(401).json({
// // // //       success: false,
// // // //       message: 'Not authorized to access this route'
// // // //     });
// // // //   }

// // // //   try {
// // // //     const decoded = jwt.verify(token, process.env.JWT_SECRET);

// // // //     const user = await User.findById(decoded.id).select('-password');
// // // //     if (!user || !user.isActive) {
// // // //       return res.status(401).json({
// // // //         success: false,
// // // //         message: 'User not found or inactive'
// // // //       });
// // // //     }

// // // //     req.user = user;
// // // //     next();
// // // //   } catch (err) {
// // // //     return res.status(401).json({
// // // //       success: false,
// // // //       message: 'Invalid or expired token'
// // // //     });
// // // //   }
// // // // };

// // // // /* =========================
// // // //    Role Authorization
// // // // ========================= */
// // // // export const authorize = (...roles) => {
// // // //   return (req, res, next) => {
// // // //     if (!req.user || !roles.includes(req.user.role)) {
// // // //       return res.status(403).json({
// // // //         success: false,
// // // //         message: `Role ${req.user?.role} is not allowed`
// // // //       });
// // // //     }
// // // //     next();
// // // //   };
// // // // };

// // // // /* =========================
// // // //    Document Authorization
// // // // ========================= */
// // // // export const authorizeDocumentAccess = async (req, res, next) => {
// // // //   try {
// // // //     const documentId = req.params.id;
// // // //     const user = req.user;

// // // //     if (user.role === 'super_admin') {
// // // //       return next();
// // // //     }

// // // //     if (user.role === 'admin') {
// // // //       // Check if admin can access this document
// // // //       const Document = mongoose.model('Document');
// // // //       const document = await Document.findById(documentId);
      
// // // //       if (!document) {
// // // //         return res.status(404).json({
// // // //           success: false,
// // // //           message: 'Document not found'
// // // //         });
// // // //       }

// // // //       // Check if the document belongs to a user created by this admin
// // // //       const documentUser = await User.findById(document.user);
// // // //       if (documentUser && documentUser.createdBy && documentUser.createdBy.equals(user._id)) {
// // // //         return next();
// // // //       }
// // // //     }

// // // //     if (user.role === 'user') {
// // // //       const Document = mongoose.model('Document');
// // // //       const document = await Document.findById(documentId);
      
// // // //       if (!document) {
// // // //         return res.status(404).json({
// // // //           success: false,
// // // //           message: 'Document not found'
// // // //         });
// // // //       }

// // // //       // Check if the document belongs to this user
// // // //       if (document.user.equals(user._id)) {
// // // //         return next();
// // // //       }
// // // //     }

// // // //     return res.status(403).json({
// // // //       success: false,
// // // //       message: 'Not authorized to access this document'
// // // //     });
// // // //   } catch (err) {
// // // //     return res.status(500).json({
// // // //       success: false,
// // // //       message: 'Server error'
// // // //     });
// // // //   }
// // // // };

// // // // /* =========================
// // // //    User Modification Rules
// // // // ========================= */
// // // // export const canModifyUser = async (req, res, next) => {
// // // //   const targetUserId = req.params.id || req.body.userId;

// // // //   if (!targetUserId) {
// // // //     return res.status(400).json({
// // // //       success: false,
// // // //       message: 'Target user ID is required'
// // // //     });
// // // //   }

// // // //   // Super Admin: god mode
// // // //   if (req.user.role === 'super_admin') {
// // // //     return next();
// // // //   }

// // // //   try {
// // // //     const targetUser = await User.findById(targetUserId);
// // // //     if (!targetUser) {
// // // //       return res.status(404).json({
// // // //         success: false,
// // // //         message: 'User not found'
// // // //       });
// // // //     }

// // // //     // Admin rules
// // // //     if (req.user.role === 'admin') {
// // // //       // Admin can modify themselves
// // // //       if (targetUser._id.equals(req.user._id)) {
// // // //         return next();
// // // //       }

// // // //       // Admin can modify users they created
// // // //       if (
// // // //         targetUser.createdBy &&
// // // //         targetUser.createdBy.equals(req.user._id)
// // // //       ) {
// // // //         return next();
// // // //       }
// // // //     }

// // // //     // Normal user: self only
// // // //     if (
// // // //       req.user.role === 'user' &&
// // // //       targetUser._id.equals(req.user._id)
// // // //     ) {
// // // //       return next();
// // // //     }

// // // //     return res.status(403).json({
// // // //       success: false,
// // // //       message: 'Not authorized to modify this user'
// // // //     });
// // // //   } catch (err) {
// // // //     return res.status(500).json({
// // // //       success: false,
// // // //       message: 'Server error'
// // // //     });
// // // //   }
// // // // };

// // // import jwt from 'jsonwebtoken';
// // // import User from '../models/User.js';

// // // /* =========================
// // //    Protect Routes
// // // ========================= */
// // // export const protect = async (req, res, next) => {
// // //   let token;

// // //   if (
// // //     req.headers.authorization &&
// // //     req.headers.authorization.startsWith('Bearer ')
// // //   ) {
// // //     token = req.headers.authorization.split(' ')[1];
// // //   }

// // //   if (!token) {
// // //     return res.status(401).json({
// // //       success: false,
// // //       message: 'Not authorized to access this route'
// // //     });
// // //   }

// // //   try {
// // //     const decoded = jwt.verify(token, process.env.JWT_SECRET);

// // //     const user = await User.findById(decoded.id).select('-password');
// // //     if (!user || !user.isActive) {
// // //       return res.status(401).json({
// // //         success: false,
// // //         message: 'User not found or inactive'
// // //       });
// // //     }

// // //     req.user = user;
// // //     next();
// // //   } catch (err) {
// // //     return res.status(401).json({
// // //       success: false,
// // //       message: 'Invalid or expired token'
// // //     });
// // //   }
// // // };

// // // /* =========================
// // //    Role Authorization
// // // ========================= */
// // // export const authorize = (...roles) => {
// // //   return (req, res, next) => {
// // //     if (!req.user || !roles.includes(req.user.role)) {
// // //       return res.status(403).json({
// // //         success: false,
// // //         message: `Role ${req.user?.role} is not allowed`
// // //       });
// // //     }
// // //     next();
// // //   };
// // // };

// // // /* =========================
// // //    Leave Authorization (Admin can only manage their users' leaves)
// // // ========================= */
// // // export const authorizeLeaveAccess = async (req, res, next) => {
// // //   try {
// // //     const leaveId = req.params.id;
// // //     const user = req.user;

// // //     if (user.role === 'super_admin') {
// // //       return next();
// // //     }

// // //     const Leave = require('../models/Leave').default || require('../models/Leave');
// // //     const leave = await Leave.findById(leaveId).populate('userId');
    
// // //     if (!leave) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Leave not found'
// // //       });
// // //     }

// // //     if (user.role === 'admin') {
// // //       // Check if the leave belongs to a user created by this admin
// // //       const leaveUser = await User.findById(leave.userId);
// // //       if (leaveUser && leaveUser.createdBy && leaveUser.createdBy.equals(user._id)) {
// // //         return next();
// // //       }
// // //     }

// // //     if (user.role === 'user') {
// // //       // Check if the leave belongs to this user
// // //       if (leave.userId._id.equals(user._id)) {
// // //         return next();
// // //       }
// // //     }

// // //     return res.status(403).json({
// // //       success: false,
// // //       message: 'Not authorized to access this leave'
// // //     });
// // //   } catch (err) {
// // //     return res.status(500).json({
// // //       success: false,
// // //       message: 'Server error'
// // //     });
// // //   }
// // // };

// // // /* =========================
// // //    User Modification Rules
// // // ========================= */
// // // export const canModifyUser = async (req, res, next) => {
// // //   const targetUserId = req.params.id || req.body.userId;

// // //   if (!targetUserId) {
// // //     return res.status(400).json({
// // //       success: false,
// // //       message: 'Target user ID is required'
// // //     });
// // //   }

// // //   // Super Admin: god mode
// // //   if (req.user.role === 'super_admin') {
// // //     return next();
// // //   }

// // //   try {
// // //     const targetUser = await User.findById(targetUserId);
// // //     if (!targetUser) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'User not found'
// // //       });
// // //     }

// // //     // Admin rules
// // //     if (req.user.role === 'admin') {
// // //       // Admin can modify themselves
// // //       if (targetUser._id.equals(req.user._id)) {
// // //         return next();
// // //       }

// // //       // Admin can modify users they created
// // //       if (
// // //         targetUser.createdBy &&
// // //         targetUser.createdBy.equals(req.user._id)
// // //       ) {
// // //         return next();
// // //       }
// // //     }

// // //     // Normal user: self only
// // //     if (
// // //       req.user.role === 'user' &&
// // //       targetUser._id.equals(req.user._id)
// // //     ) {
// // //       return next();
// // //     }

// // //     return res.status(403).json({
// // //       success: false,
// // //       message: 'Not authorized to modify this user'
// // //     });
// // //   } catch (err) {
// // //     return res.status(500).json({
// // //       success: false,
// // //       message: 'Server error'
// // //     });
// // //   }
// // // };


// // import jwt from 'jsonwebtoken';
// // import User from '../models/User.js';

// // /* =========================
// //    Protect Routes
// // ========================= */
// // export const protect = async (req, res, next) => {
// //   let token;

// //   if (
// //     req.headers.authorization &&
// //     req.headers.authorization.startsWith('Bearer ')
// //   ) {
// //     token = req.headers.authorization.split(' ')[1];
// //   }

// //   if (!token) {
// //     return res.status(401).json({
// //       success: false,
// //       message: 'Not authorized to access this route'
// //     });
// //   }

// //   try {
// //     const decoded = jwt.verify(token, process.env.JWT_SECRET);

// //     const user = await User.findById(decoded.id).select('-password');
// //     if (!user) {
// //       return res.status(401).json({
// //         success: false,
// //         message: 'User not found'
// //       });
// //     }

// //     if (!user.isActive) {
// //       return res.status(401).json({
// //         success: false,
// //         message: 'Your account is inactive. Please contact administrator.'
// //       });
// //     }

// //     req.user = user;
// //     next();
// //   } catch (err) {
// //     console.error('Auth error:', err);
// //     return res.status(401).json({
// //       success: false,
// //       message: 'Invalid or expired token'
// //     });
// //   }
// // };

// // /* =========================
// //    Role Authorization
// // ========================= */
// // export const authorize = (...roles) => {
// //   return (req, res, next) => {
// //     if (!req.user || !roles.includes(req.user.role)) {
// //       return res.status(403).json({
// //         success: false,
// //         message: `Role ${req.user?.role} is not allowed to access this resource`
// //       });
// //     }
// //     next();
// //   };
// // };

// // /* =========================
// //    Check if user can manage another user
// // ========================= */
// // export const canManageUser = async (req, res, next) => {
// //   try {
// //     const targetUserId = req.params.id || req.body.userId;
    
// //     if (!targetUserId) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'User ID is required'
// //       });
// //     }

// //     // Super admin can manage anyone
// //     if (req.user.role === 'super_admin') {
// //       return next();
// //     }

// //     const targetUser = await User.findById(targetUserId);
// //     if (!targetUser) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'User not found'
// //       });
// //     }

// //     // Admin can manage themselves and users they created
// //     if (req.user.role === 'admin') {
// //       if (targetUser._id.equals(req.user._id)) {
// //         return next();
// //       }
      
// //       if (targetUser.createdBy && targetUser.createdBy.equals(req.user._id)) {
// //         return next();
// //       }
// //     }

// //     // User can only manage themselves
// //     if (req.user.role === 'user' && targetUser._id.equals(req.user._id)) {
// //       return next();
// //     }

// //     return res.status(403).json({
// //       success: false,
// //       message: 'Not authorized to manage this user'
// //     });
// //   } catch (error) {
// //     console.error('Authorization error:', error);
// //     return res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };

// // /* =========================
// //    Check if admin can view user data
// // ========================= */
// // export const canViewUserData = async (req, res, next) => {
// //   try {
// //     const userId = req.params.userId || req.query.userId;
    
// //     if (!userId) {
// //       return next();
// //     }

// //     // Super admin can view anyone
// //     if (req.user.role === 'super_admin') {
// //       return next();
// //     }

// //     const targetUser = await User.findById(userId);
// //     if (!targetUser) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'User not found'
// //       });
// //     }

// //     // Admin can view users they created
// //     if (req.user.role === 'admin') {
// //       if (targetUser.createdBy && targetUser.createdBy.equals(req.user._id)) {
// //         return next();
// //       }
// //     }

// //     // User can only view themselves
// //     if (req.user.role === 'user' && targetUser._id.equals(req.user._id)) {
// //       return next();
// //     }

// //     return res.status(403).json({
// //       success: false,
// //       message: 'Not authorized to view this user\'s data'
// //     });
// //   } catch (error) {
// //     console.error('Authorization error:', error);
// //     return res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };
// // export const canModifyUser = async (req, res, next) => {
// //   const targetUserId = req.params.id || req.body.userId;

// //   if (!targetUserId) {
// //     return res.status(400).json({
// //       success: false,
// //       message: 'Target user ID is required'
// //     });
// //   }

// //   // Super Admin: god mode
// //   if (req.user.role === 'super_admin') {
// //     return next();
// //   }

// //   try {
// //     const targetUser = await User.findById(targetUserId);
// //     if (!targetUser) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'User not found'
// //       });
// //     }

// //     // Admin rules
// //     if (req.user.role === 'admin') {
// //       // Admin can modify themselves
// //       if (targetUser._id.equals(req.user._id)) {
// //         return next();
// //       }

// //       // Admin can modify users they created
// //       if (
// //         targetUser.createdBy &&
// //         targetUser.createdBy.equals(req.user._id)
// //       ) {
// //         return next();
// //       }
// //     }

// //     // Normal user: self only
// //     if (
// //       req.user.role === 'user' &&
// //       targetUser._id.equals(req.user._id)
// //     ) {
// //       return next();
// //     }

// //     return res.status(403).json({
// //       success: false,
// //       message: 'Not authorized to modify this user'
// //     });
// //   } catch (err) {
// //     return res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };


// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';

// /* =========================
//    Protect Routes
// ========================= */
// export const protect = async (req, res, next) => {
//   let token;

//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer ')
//   ) {
//     token = req.headers.authorization.split(' ')[1];
//   }

//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       message: 'Not authorized to access this route'
//     });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const user = await User.findById(decoded.id).select('-password');
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     if (!user.isActive) {
//       return res.status(401).json({
//         success: false,
//         message: 'Your account is inactive. Please contact administrator.'
//       });
//     }

//     req.user = user;
//     next();
//   } catch (err) {
//     console.error('Auth error:', err);
//     return res.status(401).json({
//       success: false,
//       message: 'Invalid or expired token'
//     });
//   }
// };

// /* =========================
//    Role Authorization
// ========================= */
// export const authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!req.user || !roles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: `Role ${req.user?.role} is not allowed to access this resource`
//       });
//     }
//     next();
//   };
// };

// /* =========================
//    Check if user can manage another user
// ========================= */
// export const canManageUser = async (req, res, next) => {
//   try {
//     const targetUserId = req.params.id || req.body.userId;
    
//     if (!targetUserId) {
//       return res.status(400).json({
//         success: false,
//         message: 'User ID is required'
//       });
//     }

//     // Super admin can manage anyone
//     if (req.user.role === 'super_admin') {
//       return next();
//     }

//     const targetUser = await User.findById(targetUserId);
//     if (!targetUser) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // Admin can manage themselves, users they created, and users assigned to them
//     if (req.user.role === 'admin') {
//       if (targetUser._id.equals(req.user._id)) {
//         return next();
//       }
      
//       // Check if user was created by this admin
//       if (targetUser.createdBy && targetUser.createdBy.equals(req.user._id)) {
//         return next();
//       }
      
//       // Check if user is managed by this admin
//       if (targetUser.managedBy && targetUser.managedBy.equals(req.user._id)) {
//         return next();
//       }
//     }

//     // Manager can manage themselves and users assigned to them
//     if (req.user.role === 'manager') {
//       if (targetUser._id.equals(req.user._id)) {
//         return next();
//       }
      
//       if (targetUser.managedBy && targetUser.managedBy.equals(req.user._id)) {
//         return next();
//       }
//     }

//     // User can only manage themselves
//     if (req.user.role === 'user' && targetUser._id.equals(req.user._id)) {
//       return next();
//     }

//     return res.status(403).json({
//       success: false,
//       message: 'Not authorized to manage this user'
//     });
//   } catch (error) {
//     console.error('Authorization error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// /* =========================
//    Check if admin can view user data
// ========================= */
// export const canViewUserData = async (req, res, next) => {
//   try {
//     const userId = req.params.userId || req.query.userId;
    
//     if (!userId) {
//       return next();
//     }

//     // Super admin can view anyone
//     if (req.user.role === 'super_admin') {
//       return next();
//     }

//     const targetUser = await User.findById(userId);
//     if (!targetUser) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // Admin can view users they created or manage
//     if (req.user.role === 'admin') {
//       if (targetUser.createdBy && targetUser.createdBy.equals(req.user._id)) {
//         return next();
//       }
//       if (targetUser.managedBy && targetUser.managedBy.equals(req.user._id)) {
//         return next();
//       }
//     }

//     // Manager can view users they manage
//     if (req.user.role === 'manager') {
//       if (targetUser.managedBy && targetUser.managedBy.equals(req.user._id)) {
//         return next();
//       }
//     }

//     // User can only view themselves
//     if (req.user.role === 'user' && targetUser._id.equals(req.user._id)) {
//       return next();
//     }

//     return res.status(403).json({
//       success: false,
//       message: 'Not authorized to view this user\'s data'
//     });
//   } catch (error) {
//     console.error('Authorization error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// /* =========================
//    Get all users under admin (for filtering)
// ========================= */
// export const getUsersUnderAdmin = async (adminId) => {
//   try {
//     const admin = await User.findById(adminId);
//     if (!admin) return [];
    
//     if (admin.role === 'super_admin') {
//       // Super admin can see all users
//       return await User.find({ role: { $ne: 'super_admin' } });
//     }
    
//     // Get users created by or managed by this admin
//     const createdUsers = await User.find({ createdBy: adminId });
//     const managedUsers = await User.find({ managedBy: adminId });
    
//     // Combine and remove duplicates
//     const allUserIds = [
//       ...createdUsers.map(u => u._id.toString()),
//       ...managedUsers.map(u => u._id.toString())
//     ];
//     const uniqueUserIds = [...new Set(allUserIds)];
    
//     return await User.find({ _id: { $in: uniqueUserIds } });
//   } catch (error) {
//     console.error('Error getting users under admin:', error);
//     return [];
//   }
// };

//  export const canModifyUser = async (req, res, next) => {
//   const targetUserId = req.params.id || req.body.userId;

//   if (!targetUserId) {
//     return res.status(400).json({
//       success: false,
//       message: 'Target user ID is required'
//     });
//   }

//   // Super Admin: god mode
//   if (req.user.role === 'super_admin') {
//     return next();
//   }

//   try {
//     const targetUser = await User.findById(targetUserId);
//     if (!targetUser) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // Admin rules
//     if (req.user.role === 'admin') {
//       // Admin can modify themselves
//       if (targetUser._id.equals(req.user._id)) {
//         return next();
//       }

//       // Admin can modify users they created
//       if (
//         targetUser.createdBy &&
//         targetUser.createdBy.equals(req.user._id)
//       ) {
//         return next();
//       }
//     }

//     // Normal user: self only
//     if (
//       req.user.role === 'user' &&
//       targetUser._id.equals(req.user._id)
//     ) {
//       return next();
//     }

//     return res.status(403).json({
//       success: false,
//       message: 'Not authorized to modify this user'
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// middlewares/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/* =========================
   Protect Routes
========================= */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account is inactive. Please contact administrator.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/* =========================
   Role Authorization
========================= */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user?.role} is not allowed to access this resource`
      });
    }
    next();
  };
};

/* =========================
   Check if admin can manage user
========================= */
export const canManageUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id || req.body.userId;
    
    if (!targetUserId) {
      return next();
    }

    // Super admin can manage anyone
    if (req.user.role === 'super_admin') {
      return next();
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Admin can manage themselves and users they created
    if (req.user.role === 'admin') {
      if (targetUser._id.equals(req.user._id)) {
        return next();
      }
      
      if (targetUser.adminId && targetUser.adminId.equals(req.user._id)) {
        return next();
      }
      
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage this user'
      });
    }

    // User can only manage themselves
    if (req.user.role === 'user' && targetUser._id.equals(req.user._id)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Not authorized to manage this user'
    });
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

 export const canModifyUser = async (req, res, next) => {
  const targetUserId = req.params.id || req.body.userId;

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: 'Target user ID is required'
    });
  }

  // Super Admin: god mode
  if (req.user.role === 'super_admin') {
    return next();
  }

  try {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Admin rules
    if (req.user.role === 'admin') {
      // Admin can modify themselves
      if (targetUser._id.equals(req.user._id)) {
        return next();
      }

      // Admin can modify users they created
      if (
        targetUser.createdBy &&
        targetUser.createdBy.equals(req.user._id)
      ) {
        return next();
      }
    }

    // Normal user: self only
    if (
      req.user.role === 'user' &&
      targetUser._id.equals(req.user._id)
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Not authorized to modify this user'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

