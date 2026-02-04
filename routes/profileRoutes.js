// // // // // // import express from "express";
// // // // // // import {
// // // // // //   protect,
// // // // // //   authorize,
// // // // // //   canManageUser,
// // // // // // } from "../middlewares/auth.js";
// // // // // // import {
// // // // // //   uploadAvatar,
// // // // // //   uploadProfileImages,
// // // // // //   processUploadedFiles,
// // // // // // } from "../middlewares/profileUpload.js";
// // // // // // import {
// // // // // //   getUserProfile,
// // // // // //   updateUserProfile,
// // // // // //   getAllUserProfilesByAdmin,
// // // // // //   deleteUserByAdmin,
// // // // // //   createUserByAdmin,
// // // // // //   updateUserByAdmin,
// // // // // //   addProfileItem,
// // // // // //   updateProfileItem,
// // // // // //   deleteProfileItem,
// // // // // // } from "../controllers/profileController.js";

// // // // // // const router = express.Router();

// // // // // // // Public routes (if any) - none for now

// // // // // // // Protected routes
// // // // // // router.use(protect);

// // // // // // // User profile routes
// // // // // // router
// // // // // //   .route("/me")
// // // // // //   .get((req, res) => getUserProfile(req, res)) // Get own profile
// // // // // //   .put(
// // // // // //     uploadProfileImages,
// // // // // //     processUploadedFiles,
// // // // // //     (req, res) => updateUserProfile(req, res) // Update own profile
// // // // // //   );

// // // // // // router
// // // // // //   .route("/:userId")
// // // // // //   .get(canManageUser, (req, res) => getUserProfile(req, res)) // Get specific user profile
// // // // // //   .put(
// // // // // //     canManageUser,
// // // // // //     uploadProfileImages,
// // // // // //     processUploadedFiles,
// // // // // //     (req, res) => updateUserProfile(req, res) // Update specific user profile
// // // // // //   );

// // // // // // // Admin routes for user management
// // // // // // router
// // // // // //   .route("/admin/users")
// // // // // //   .get(authorize("admin", "super_admin"), (req, res) =>
// // // // // //     getAllUserProfilesByAdmin(req, res)
// // // // // //   ) // Get all users by admin
// // // // // //   .post(authorize("admin", "super_admin"), (req, res) =>
// // // // // //     createUserByAdmin(req, res)
// // // // // //   ); // Create user by admin

// // // // // // router
// // // // // //   .route("/admin/users/:userId")
// // // // // //   .put(authorize("admin", "super_admin"), canManageUser, (req, res) =>
// // // // // //     updateUserByAdmin(req, res)
// // // // // //   ) // Update user by admin
// // // // // //   .delete(authorize("admin", "super_admin"), canManageUser, (req, res) =>
// // // // // //     deleteUserByAdmin(req, res)
// // // // // //   ); // Delete user by admin

// // // // // // // Avatar upload route
// // // // // // router.post(
// // // // // //   "/:userId/avatar",
// // // // // //   canManageUser,
// // // // // //   uploadAvatar,
// // // // // //   processUploadedFiles,
// // // // // //   (req, res) => updateUserProfile(req, res)
// // // // // // );

// // // // // // // Profile items management (education, experience, skills)
// // // // // // router.post(
// // // // // //   "/:userId/:type", // education, experience, or skills
// // // // // //   canManageUser,
// // // // // //   (req, res) => addProfileItem(req, res)
// // // // // // );

// // // // // // router
// // // // // //   .route("/:userId/:type/:itemId")
// // // // // //   .put(canManageUser, (req, res) => updateProfileItem(req, res))
// // // // // //   .delete(canManageUser, (req, res) => deleteProfileItem(req, res));

// // // // // // export default router;


// // // // // import express from "express";
// // // // // import {
// // // // //   getProfileById,
// // // // //   getAdminUsersProfiles,
// // // // //   updateProfile,
// // // // //   addEducation,
// // // // //   updateEducation,
// // // // //   deleteEducation,
// // // // //   addExperience,
// // // // //   updateExperience,
// // // // //   deleteExperience,
// // // // //   updateSkills,
// // // // //   getMyProfile,
// // // // //   updateMyProfile,
// // // // // } from "../controllers/profileController.js";
// // // // // import { protect, authorize, canModifyUser } from "../middlewares/auth.js";
// // // // // import { uploadProfileImages, processUploadedFiles } from "../middlewares/profileUpload.js";

// // // // // const router = express.Router();

// // // // // // Protect all routes
// // // // // router.use(protect);

// // // // // // Get current user's profile
// // // // // router.get("/me", getMyProfile);
// // // // // router.put("/me", uploadProfileImages, processUploadedFiles, updateMyProfile);

// // // // // // Admin routes
// // // // // router.get("/admin/users", authorize("admin", "super_admin"), getAdminUsersProfiles);

// // // // // // User-specific routes (with authorization)
// // // // // router.get("/:userId", canModifyUser, getProfileById);
// // // // // router.put("/:userId", canModifyUser, uploadProfileImages, processUploadedFiles, updateProfile);

// // // // // // Education routes
// // // // // router.post("/:userId/education", canModifyUser, addEducation);
// // // // // router.put("/:userId/education/:eduId", canModifyUser, updateEducation);
// // // // // router.delete("/:userId/education/:eduId", canModifyUser, deleteEducation);

// // // // // // Experience routes
// // // // // router.post("/:userId/experience", canModifyUser, addExperience);
// // // // // router.put("/:userId/experience/:expId", canModifyUser, updateExperience);
// // // // // router.delete("/:userId/experience/:expId", canModifyUser, deleteExperience);

// // // // // // Skills routes
// // // // // router.put("/:userId/skills", canModifyUser, updateSkills);

// // // // // export default router;

// // // // import express from 'express';
// // // // import {
// // // //   getUserProfile,
// // // //   updateUserProfile,
// // // //   addEducation,
// // // //   updateEducation,
// // // //   deleteEducation,
// // // //   addExperience,
// // // //   updateExperience,
// // // //   deleteExperience,
// // // //   updateSkills,
// // // //   getUserSalary
// // // // } from '../controllers/profileController.js';
// // // // import { protect, canModifyUser } from '../middlewares/auth.js';

// // // // const router = express.Router();

// // // // // Apply protection to all routes
// // // // router.use(protect);

// // // // // User profile routes
// // // // router.route('/me')
// // // //   .get(getUserProfile)
// // // //   .put(canModifyUser, updateUserProfile);

// // // // // Education routes
// // // // router.route('/education')
// // // //   .post(canModifyUser, addEducation);

// // // // router.route('/education/:educationId')
// // // //   .put(canModifyUser, updateEducation)
// // // //   .delete(canModifyUser, deleteEducation);

// // // // // Experience routes
// // // // router.route('/experience')
// // // //   .post(canModifyUser, addExperience);

// // // // router.route('/experience/:experienceId')
// // // //   .put(canModifyUser, updateExperience)
// // // //   .delete(canModifyUser, deleteExperience);

// // // // // Skills route
// // // // router.route('/skills')
// // // //   .put(canModifyUser, updateSkills);

// // // // // Salary route
// // // // router.route('/salary')
// // // //   .get(getUserSalary);

// // // // export default router;


// // // import express from 'express';
// // // import {
// // //   getAllUsers,
// // //   getUserProfile,
// // //   updateProfile,
// // //   addEducation,
// // //   updateEducation,
// // //   deleteEducation,
// // //   addExperience,
// // //   updateExperience,
// // //   deleteExperience,
// // //   addSkill,
// // //   updateSkill,
// // //   deleteSkill,
// // //   getAllEducation,
// // //   getAllExperience,
// // //   getAllSkills
// // // } from '../controllers/profileController.js';
// // // import { protect, authorize, canManageUser } from '../middlewares/auth.js';
// // // import { uploadAvatar, uploadCover } from '../middlewares/profileUpload.js';

// // // const router = express.Router();

// // // // Apply protection to all routes
// // // router.use(protect);

// // // // Get all users (Admin only)
// // // router.get('/users', authorize('admin', 'super_admin'), getAllUsers);

// // // // Profile routes
// // // router.route('/profile')
// // //   .get(getUserProfile)
// // //   .put(updateProfile);

// // // router.route('/profile/:userId')
// // //   .get(authorize('admin', 'super_admin'), getUserProfile)
// // //   .put(authorize('admin', 'super_admin'), canManageUser, updateProfile);

// // // // Avatar upload
// // // router.put('/profile/avatar', uploadAvatar, updateProfile);
// // // router.put('/profile/:userId/avatar', 
// // //   authorize('admin', 'super_admin,'), 
// // //   canManageUser, 
// // //   uploadAvatar, 
// // //   updateProfile
// // // );

// // // // Cover photo upload
// // // router.put('/profile/cover', uploadCover, updateProfile);
// // // router.put('/profile/:userId/cover', 
// // //   authorize('admin', 'super_admin'), 
// // //   canManageUser, 
// // //   uploadCover, 
// // //   updateProfile
// // // );

// // // // Education routes
// // // router.route('/education')
// // //   .get(getAllEducation)
// // //   .post(addEducation);

// // // router.route('/education/:educationId')
// // //   .put(updateEducation)
// // //   .delete(deleteEducation);

// // // // Experience routes
// // // router.route('/experience')
// // //   .get(getAllExperience)
// // //   .post(addExperience);

// // // router.route('/experience/:experienceId')
// // //   .put(updateExperience)
// // //   .delete(deleteExperience);

// // // // Skills routes
// // // router.route('/skills')
// // //   .get(getAllSkills)
// // //   .post(addSkill);

// // // router.route('/skills/:skillId')
// // //   .put(updateSkill)
// // //   .delete(deleteSkill);

// // // // Admin routes for managing other users' profiles
// // // router.route('/:userId/education')
// // //   .get(authorize('admin', 'super_admin'), canManageUser, getAllEducation)
// // //   .post(authorize('admin', 'super_admin'), canManageUser, addEducation);

// // // router.route('/:userId/education/:educationId')
// // //   .put(authorize('admin', 'super_admin'), canManageUser, updateEducation)
// // //   .delete(authorize('admin', 'super_admin'), canManageUser, deleteEducation);

// // // router.route('/:userId/experience')
// // //   .get(authorize('admin', 'super_admin'), canManageUser, getAllExperience)
// // //   .post(authorize('admin', 'super_admin'), canManageUser, addExperience);

// // // router.route('/:userId/experience/:experienceId')
// // //   .put(authorize('admin', 'super_admin'), canManageUser, updateExperience)
// // //   .delete(authorize('admin', 'super_admin'), canManageUser, deleteExperience);

// // // router.route('/:userId/skills')
// // //   .get(authorize('admin', 'super_admin'), canManageUser, getAllSkills)
// // //   .post(authorize('admin', 'super_admin'), canManageUser, addSkill);

// // // router.route('/:userId/skills/:skillId')
// // //   .put(authorize('admin', 'super_admin'), canManageUser, updateSkill)
// // //   .delete(authorize('admin', 'super_admin'), canManageUser, deleteSkill);

// // // export default router;

// // import express from 'express';
// // import {
// //   getAllUsers,
// //   getUserProfile,
// //   updateProfile,
// //   uploadAvatar,
// //   uploadCover,
// //   addEducation,
// //   updateEducation,
// //   deleteEducation,
// //   addExperience,
// //   updateExperience,
// //   deleteExperience,
// //   addSkill,
// //   updateSkill,
// //   deleteSkill,
// //   getAllEducation,
// //   getAllExperience,
// //   getAllSkills
// // } from '../controllers/profileController.js';
// // import { protect, authorize } from '../middlewares/auth.js';
// // import { uploadAvatarMiddleware, uploadCoverMiddleware } from '../middlewares/profileUpload.js';

// // const router = express.Router();

// // // Apply protection to all routes
// // router.use(protect);

// // // Get all users (Admin only)
// // router.get('/users', authorize('admin', 'super_admin'), getAllUsers);

// // // Profile routes
// // router.route('/profile')
// //   .get(getUserProfile)
// //   .put(updateProfile);

// // router.route('/profile/:userId')
// //   .get(authorize('admin', 'super_admin'), getUserProfile)
// //   .put(authorize('admin', 'super_admin'), updateProfile);

// // // Avatar upload - FIXED ROUTE
// // router.put('/avatar', uploadAvatarMiddleware, uploadAvatar);

// // // Cover photo upload - FIXED ROUTE
// // router.put('/cover', uploadCoverMiddleware, uploadCover);

// // // Admin routes for managing other users' uploads
// // router.put('/:userId/avatar', 
// //   authorize('admin', 'super_admin'), 
// //   uploadAvatarMiddleware, 
// //   uploadAvatar
// // );

// // router.put('/:userId/cover', 
// //   authorize('admin', 'super_admin'), 
// //   uploadCoverMiddleware, 
// //   uploadCover
// // );

// // // Education routes
// // router.route('/education')
// //   .get(getAllEducation)
// //   .post(addEducation);

// // router.route('/education/:educationId')
// //   .put(updateEducation)
// //   .delete(deleteEducation);

// // // Experience routes
// // router.route('/experience')
// //   .get(getAllExperience)
// //   .post(addExperience);

// // router.route('/experience/:experienceId')
// //   .put(updateExperience)
// //   .delete(deleteExperience);

// // // Skills routes
// // router.route('/skills')
// //   .get(getAllSkills)
// //   .post(addSkill);

// // router.route('/skills/:skillId')
// //   .put(updateSkill)
// //   .delete(deleteSkill);

// // // Admin routes for managing other users' profiles
// // router.route('/:userId/education')
// //   .get(authorize('admin', 'super_admin'), getAllEducation)
// //   .post(authorize('admin', 'super_admin'), addEducation);

// // router.route('/:userId/education/:educationId')
// //   .put(authorize('admin', 'super_admin'), updateEducation)
// //   .delete(authorize('admin', 'super_admin'), deleteEducation);

// // router.route('/:userId/experience')
// //   .get(authorize('admin', 'super_admin'), getAllExperience)
// //   .post(authorize('admin', 'super_admin'), addExperience);

// // router.route('/:userId/experience/:experienceId')
// //   .put(authorize('admin', 'super_admin'), updateExperience)
// //   .delete(authorize('admin', 'super_admin'), deleteExperience);

// // router.route('/:userId/skills')
// //   .get(authorize('admin', 'super_admin'), getAllSkills)
// //   .post(authorize('admin', 'super_admin'), addSkill);

// // router.route('/:userId/skills/:skillId')
// //   .put(authorize('admin', 'super_admin'), updateSkill)
// //   .delete(authorize('admin', 'super_admin'), deleteSkill);

// // export default router;

// import express from 'express';
// import {
//   getAllUsersWithProfiles,
//   getUserProfilesByAdminId,
//   getUserProfile,
//   updateProfile,
//   uploadAvatar,
//   uploadCover,
//   deleteAvatar,
//   deleteCover,
//   deleteUserProfile,
//   deleteUser,
//   addEducation,
//   updateEducation,
//   deleteEducation,
//   addExperience,
//   updateExperience,
//   deleteExperience,
//   addSkill,
//   updateSkill,
//   deleteSkill,
//   getAllEducation,
//   getAllExperience,
//   getAllSkills
// } from '../controllers/profileController.js';
// import { protect, authorize, canManageUser } from '../middlewares/auth.js';
// import { uploadAvatarMiddleware, uploadCoverMiddleware, handleUploadError } from '../middlewares/profileUpload.js';

// const router = express.Router();

// // Apply protection to all routes
// router.use(protect);

// // =============== ADMIN ROUTES ===============

// // Get all users with profiles (Admin only)
// router.get('/users/all', authorize('admin', 'super_admin'), getAllUsersWithProfiles);

// // Get all user profiles by admin ID
// router.get('/admin/:adminId/users', authorize('admin', 'super_admin'), getUserProfilesByAdminId);

// // =============== PROFILE ROUTES ===============

// // Get own profile
// router.get('/', getUserProfile);

// // Update own profile
// router.put('/', updateProfile);

// // Get specific user profile (Admin only)
// router.get('/:userId', authorize('admin', 'super_admin'), canManageUser, getUserProfile);

// // Update specific user profile (Admin only)
// router.put('/:userId', authorize('admin', 'super_admin'), canManageUser, updateProfile);

// // =============== AVATAR ROUTES ===============

// // Upload own avatar
// router.post('/avatar', uploadAvatarMiddleware, handleUploadError, uploadAvatar);

// // Delete own avatar
// router.delete('/avatar', deleteAvatar);

// // Upload avatar for specific user (Admin only)
// router.post('/:userId/avatar', 
//   authorize('admin', 'super_admin'), 
//   canManageUser,
//   uploadAvatarMiddleware, 
//   handleUploadError,
//   uploadAvatar
// );

// // Delete avatar for specific user (Admin only)
// router.delete('/:userId/avatar', 
//   authorize('admin', 'super_admin'), 
//   canManageUser,
//   deleteAvatar
// );

// // =============== COVER PHOTO ROUTES ===============

// // Upload own cover photo
// router.post('/cover', uploadCoverMiddleware, handleUploadError, uploadCover);

// // Delete own cover photo
// router.delete('/cover', deleteCover);

// // Upload cover for specific user (Admin only)
// router.post('/:userId/cover', 
//   authorize('admin', 'super_admin'), 
//   canManageUser,
//   uploadCoverMiddleware, 
//   handleUploadError,
//   uploadCover
// );

// // Delete cover for specific user (Admin only)
// router.delete('/:userId/cover', 
//   authorize('admin', 'super_admin'), 
//   canManageUser,
//   deleteCover
// );

// // =============== DELETE OPERATIONS ===============

// // Delete user profile only (Admin only)
// router.delete('/profile/:userId', 
//   authorize('admin', 'super_admin'), 
//   canManageUser,
//   deleteUserProfile
// );

// // Delete user completely (Admin only)
// router.delete('/user/:userId', 
//   authorize('admin', 'super_admin'), 
//   canManageUser,
//   deleteUser
// );

// // =============== EDUCATION ROUTES ===============

// // Own education
// router.route('/education')
//   .get(getAllEducation)
//   .post(addEducation);

// router.route('/education/:educationId')
//   .put(updateEducation)
//   .delete(deleteEducation);

// // =============== EXPERIENCE ROUTES ===============

// // Own experience
// router.route('/experience')
//   .get(getAllExperience)
//   .post(addExperience);

// router.route('/experience/:experienceId')
//   .put(updateExperience)
//   .delete(deleteExperience);

// // =============== SKILLS ROUTES ===============

// // Own skills
// router.route('/skills')
//   .get(getAllSkills)
//   .post(addSkill);

// router.route('/skills/:skillId')
//   .put(updateSkill)
//   .delete(deleteSkill);

// // =============== ADMIN MANAGEMENT ROUTES ===============

// // Admin routes for managing other users' education
// router.route('/:userId/education')
//   .get(authorize('admin', 'super_admin'), canManageUser, getAllEducation)
//   .post(authorize('admin', 'super_admin'), canManageUser, addEducation);

// router.route('/:userId/education/:educationId')
//   .put(authorize('admin', 'super_admin'), canManageUser, updateEducation)
//   .delete(authorize('admin', 'super_admin'), canManageUser, deleteEducation);

// // Admin routes for managing other users' experience
// router.route('/:userId/experience')
//   .get(authorize('admin', 'super_admin'), canManageUser, getAllExperience)
//   .post(authorize('admin', 'super_admin'), canManageUser, addExperience);

// router.route('/:userId/experience/:experienceId')
//   .put(authorize('admin', 'super_admin'), canManageUser, updateExperience)
//   .delete(authorize('admin', 'super_admin'), canManageUser, deleteExperience);

// // Admin routes for managing other users' skills
// router.route('/:userId/skills')
//   .get(authorize('admin', 'super_admin'), canManageUser, getAllSkills)
//   .post(authorize('admin', 'super_admin'), canManageUser, addSkill);

// router.route('/:userId/skills/:skillId')
//   .put(authorize('admin', 'super_admin'), canManageUser, updateSkill)
//   .delete(authorize('admin', 'super_admin'), canManageUser, deleteSkill);

// export default router;

// routes/profileRoutes.js
import express from 'express';
import {
  // Profile
  getUserProfile,
  updateProfile,
  
  // Avatar
  uploadAvatar,
  deleteAvatar,
  
  // Cover Photo
  uploadCover,
  deleteCover,
  
  // Education
  addEducation,
  updateEducation,
  deleteEducation,
  getAllEducation,
  
  // Experience
  addExperience,
  updateExperience,
  deleteExperience,
  getAllExperience,
  
  // Skills
  addSkill,
  updateSkill,
  deleteSkill,
  getAllSkills,
  
  // Admin
  getAllUsersWithProfiles
  ,getAllUserProfilesByAdmin
} from '../controllers/profileController.js';

import { protect, authorize } from '../middlewares/auth.js';
import { uploadAvatarMiddleware, uploadCoverMiddleware, handleUploadError } from '../middlewares/profileUpload.js';

const router = express.Router();

// ==================== PROTECT ALL ROUTES ====================
router.use(protect);

// ==================== PROFILE ROUTES ====================
router.route('/')
  .get(getUserProfile)
  .put(updateProfile);

// ==================== AVATAR ROUTES ====================
router.route('/avatar')
  .post(uploadAvatarMiddleware, handleUploadError, uploadAvatar)
  .delete(deleteAvatar);

// ==================== COVER PHOTO ROUTES ====================
router.route('/cover')
  .post(uploadCoverMiddleware, handleUploadError, uploadCover)
  .delete(deleteCover);

// ==================== EDUCATION ROUTES ====================
router.route('/education')
  .get(getAllEducation)
  .post(addEducation);

router.route('/education/:educationId')
  .put(updateEducation)
  .delete(deleteEducation);

// ==================== EXPERIENCE ROUTES ====================
router.route('/experience')
  .get(getAllExperience)
  .post(addExperience);

router.route('/experience/:experienceId')
  .put(updateExperience)
  .delete(deleteExperience);

// ==================== SKILLS ROUTES ====================
router.route('/skills')
  .get(getAllSkills)
  .post(addSkill);

router.route('/skills/:skillId')
  .put(updateSkill)
  .delete(deleteSkill);

// ==================== ADMIN ROUTES ====================
router.get('/users/all', authorize('admin', 'super_admin'), getAllUsersWithProfiles);

router.get("/admin/user-profiles", protect, getAllUserProfilesByAdmin);


export default router;