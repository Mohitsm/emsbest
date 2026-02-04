// // // // // // import User from "../models/User.js";
// // // // // // import UserProfile from "../models/UserProfile.js";
// // // // // // import Salary from "../models/Salary.js";
// // // // // // import { cleanupOldFiles } from "../middlewares/profileUpload.js";

// // // // // // /* =========================
// // // // // //    Get User Profile
// // // // // // ========================= */
// // // // // // export const getUserProfile = async (req, res) => {
// // // // // //   try {
// // // // // //     const userId = req.params.userId || req.user._id;
    
// // // // // //     // Check authorization
// // // // // //     if (req.user.role === "user" && userId !== req.user._id.toString()) {
// // // // // //       return res.status(403).json({
// // // // // //         success: false,
// // // // // //         message: "Not authorized to view this profile",
// // // // // //       });
// // // // // //     }

// // // // // //     // For admin, check if user is under their management
// // // // // //     if (req.user.role === "admin") {
// // // // // //       const isUnderAdmin = await User.isUserUnderAdmin(userId, req.user._id);
// // // // // //       if (!isUnderAdmin && userId !== req.user._id.toString()) {
// // // // // //         return res.status(403).json({
// // // // // //           success: false,
// // // // // //           message: "Not authorized to view this profile",
// // // // // //         });
// // // // // //       }
// // // // // //     }

// // // // // //     // Get user profile with user data
// // // // // //     const profile = await UserProfile.findOne({ userId })
// // // // // //       .populate({
// // // // // //         path: "user",
// // // // // //         select: "name email department employeeId joinDate role company shifts isActive",
// // // // // //       })
// // // // // //       .lean();

// // // // // //     if (!profile) {
// // // // // //       return res.status(404).json({
// // // // // //         success: false,
// // // // // //         message: "Profile not found",
// // // // // //       });
// // // // // //    }

// // // // // //     // Get salary information
// // // // // //     const salary = await Salary.findOne({ userId }).lean();

// // // // // //     // Combine data
// // // // // //     const response = {
// // // // // //       ...profile,
// // // // // //       user: {
// // // // // //         ...profile.user,
// // // // // //         // Non-changeable fields from User model
// // // // // //         email: profile.user.email,
// // // // // //         name: profile.user.name,
// // // // // //         department: profile.user.department,
// // // // // //         employeeId: profile.user.employeeId,
// // // // // //         joinDate: profile.user.joinDate,
// // // // // //       },
// // // // // //       salary: salary
// // // // // //         ? {
// // // // // //             // Non-changeable fields from Salary model (only showing)
// // // // // //             basicSalary: salary.basicSalary,
// // // // // //             netSalary: salary.netSalary,
// // // // // //             grossSalary: salary.grossSalary,
// // // // // //             totalAllowance: salary.totalAllowance,
// // // // // //             totalDeductions: salary.totalDeductions,
// // // // // //             currencyType: salary.currencyType,
// // // // // //             paymentMethod: salary.paymentMethod,
// // // // // //             isActive: salary.isActive,
// // // // // //             effectiveFrom: salary.effectiveFrom,
// // // // // //           }
// // // // // //         : null,
// // // // // //     };

// // // // // //     res.status(200).json({
// // // // // //       success: true,
// // // // // //       data: response,
// // // // // //     });
// // // // // //   } catch (error) {
// // // // // //     console.error("Get profile error:", error);
// // // // // //     res.status(500).json({
// // // // // //       success: false,
// // // // // //       message: "Server error",
// // // // // //       error: error.message,
// // // // // //     });
// // // // // //   }
// // // // // // };

// // // // // // /* =========================
// // // // // //    Update User Profile
// // // // // // ========================= */
// // // // // // export const updateUserProfile = async (req, res) => {
// // // // // //   try {
// // // // // //     const userId = req.params.userId || req.user._id;
// // // // // //     const updateData = { ...req.body };

// // // // // //     // Remove non-changeable fields
// // // // // //     const nonChangeableFields = [
// // // // // //       "email",
// // // // // //       "name",
// // // // // //       "department",
// // // // // //       "employeeId",
// // // // // //       "joinDate",
// // // // // //       "salary",
// // // // // //       "basicSalary",
// // // // // //       "netSalary",
// // // // // //       "grossSalary",
// // // // // //       "totalAllowance",
// // // // // //       "totalDeductions",
// // // // // //       "currencyType",
// // // // // //       "paymentMethod",
// // // // // //       "userId",
// // // // // //     ];

// // // // // //     nonChangeableFields.forEach((field) => delete updateData[field]);

// // // // // //     // Check authorization
// // // // // //     if (req.user.role === "user" && userId !== req.user._id.toString()) {
// // // // // //       return res.status(403).json({
// // // // // //         success: false,
// // // // // //         message: "Not authorized to update this profile",
// // // // // //       });
// // // // // //     }

// // // // // //     // For admin, check if user is under their management
// // // // // //     if (req.user.role === "admin") {
// // // // // //       const isUnderAdmin = await User.isUserUnderAdmin(userId, req.user._id);
// // // // // //       if (!isUnderAdmin && userId !== req.user._id.toString()) {
// // // // // //         return res.status(403).json({
// // // // // //           success: false,
// // // // // //           message: "Not authorized to update this profile",
// // // // // //         });
// // // // // //       }
// // // // // //     }

// // // // // //     // Find existing profile
// // // // // //     let profile = await UserProfile.findOne({ userId });

// // // // // //     if (!profile) {
// // // // // //       // Create new profile if doesn't exist
// // // // // //       profile = new UserProfile({
// // // // // //         userId,
// // // // // //         ...updateData,
// // // // // //       });
// // // // // //       await profile.save();
// // // // // //     } else {
// // // // // //       // Clean up old files if new ones are uploaded
// // // // // //       if (req.body.avatar || req.body.coverPhoto) {
// // // // // //         await cleanupOldFiles(profile.toObject(), updateData);
// // // // // //       }

// // // // // //       // Update existing profile
// // // // // //       profile = await UserProfile.findOneAndUpdate(
// // // // // //         { userId },
// // // // // //         { $set: updateData },
// // // // // //         { new: true, runValidators: true }
// // // // // //       );
// // // // // //     }

// // // // // //     // Populate user data
// // // // // //     const populatedProfile = await UserProfile.findOne({ userId })
// // // // // //       .populate({
// // // // // //         path: "user",
// // // // // //         select: "name email department employeeId joinDate role company shifts",
// // // // // //       })
// // // // // //       .lean();

// // // // // //     res.status(200).json({
// // // // // //       success: true,
// // // // // //       message: "Profile updated successfully",
// // // // // //       data: populatedProfile,
// // // // // //     });
// // // // // //   } catch (error) {
// // // // // //     console.error("Update profile error:", error);
// // // // // //     res.status(500).json({
// // // // // //       success: false,
// // // // // //       message: "Server error",
// // // // // //       error: error.message,
// // // // // //     });
// // // // // //   }
// // // // // // };

// // // // // // /* =========================
// // // // // //    Get All User Profiles by Admin
// // // // // // ========================= */
// // // // // // export const getAllUserProfilesByAdmin = async (req, res) => {
// // // // // //   try {
// // // // // //     const adminId = req.user._id;
// // // // // //     const {
// // // // // //       page = 1,
// // // // // //       limit = 10,
// // // // // //       search = "",
// // // // // //       department,
// // // // // //       isActive,
// // // // // //     } = req.query;

// // // // // //     // Build query for users managed by admin
// // // // // //     let userQuery = {
// // // // // //       $or: [{ adminId: adminId }, { createdBy: adminId }],
// // // // // //       role: "user",
// // // // // //     };

// // // // // //     // Add filters
// // // // // //     if (search) {
// // // // // //       userQuery.$or = [
// // // // // //         { name: { $regex: search, $options: "i" } },
// // // // // //         { email: { $regex: search, $options: "i" } },
// // // // // //         { employeeId: { $regex: search, $options: "i" } },
// // // // // //       ];
// // // // // //     }

// // // // // //     if (department) {
// // // // // //       userQuery.department = department;
// // // // // //     }

// // // // // //     if (isActive !== undefined) {
// // // // // //       userQuery.isActive = isActive === "true";
// // // // // //     }

// // // // // //     // Get paginated users
// // // // // //     const pageNum = parseInt(page);
// // // // // //     const limitNum = parseInt(limit);
// // // // // //     const skip = (pageNum - 1) * limitNum;

// // // // // //     // Get users with profiles
// // // // // //     const users = await User.find(userQuery)
// // // // // //       .select("_id name email department employeeId joinDate role company shifts isActive")
// // // // // //       .skip(skip)
// // // // // //       .limit(limitNum)
// // // // // //       .sort("-createdAt")
// // // // // //       .lean();

// // // // // //     // Get user IDs
// // // // // //     const userIds = users.map((user) => user._id);

// // // // // //     // Get profiles for these users
// // // // // //     const profiles = await UserProfile.find({ userId: { $in: userIds } }).lean();

// // // // // //     // Get salaries for these users
// // // // // //     const salaries = await Salary.find({ userId: { $in: userIds } }).lean();

// // // // // //     // Combine data
// // // // // //     const userProfiles = users.map((user) => {
// // // // // //       const profile = profiles.find((p) => p.userId.toString() === user._id.toString());
// // // // // //       const salary = salaries.find((s) => s.userId.toString() === user._id.toString());

// // // // // //       return {
// // // // // //         ...user,
// // // // // //         profile: profile || null,
// // // // // //         salary: salary
// // // // // //           ? {
// // // // // //               basicSalary: salary.basicSalary,
// // // // // //               netSalary: salary.netSalary,
// // // // // //               grossSalary: salary.grossSalary,
// // // // // //               currencyType: salary.currencyType,
// // // // // //               isActive: salary.isActive,
// // // // // //             }
// // // // // //           : null,
// // // // // //       };
// // // // // //     });

// // // // // //     // Get total count
// // // // // //     const total = await User.countDocuments(userQuery);

// // // // // //     res.status(200).json({
// // // // // //       success: true,
// // // // // //       data: userProfiles,
// // // // // //       pagination: {
// // // // // //         page: pageNum,
// // // // // //         limit: limitNum,
// // // // // //         total,
// // // // // //         pages: Math.ceil(total / limitNum),
// // // // // //       },
// // // // // //     });
// // // // // //   } catch (error) {
// // // // // //     console.error("Get all profiles error:", error);
// // // // // //     res.status(500).json({
// // // // // //       success: false,
// // // // // //       message: "Server error",
// // // // // //       error: error.message,
// // // // // //     });
// // // // // //   }
// // // // // // };

// // // // // // /* =========================
// // // // // //    Delete User (Admin only)
// // // // // // ========================= */
// // // // // // export const deleteUserByAdmin = async (req, res) => {
// // // // // //   try {
// // // // // //     const { userId } = req.params;
// // // // // //     const adminId = req.user._id;

// // // // // //     // Check if user exists and is under admin's management
// // // // // //     const user = await User.findById(userId);
// // // // // //     if (!user) {
// // // // // //       return res.status(404).json({
// // // // // //         success: false,
// // // // // //         message: "User not found",
// // // // // //       });
// // // // // //     }

// // // // // //     // Check authorization
// // // // // //     const isUnderAdmin = await User.isUserUnderAdmin(userId, adminId);
// // // // // //     if (!isUnderAdmin) {
// // // // // //       return res.status(403).json({
// // // // // //         success: false,
// // // // // //         message: "Not authorized to delete this user",
// // // // // //       });
// // // // // //     }

// // // // // //     // Don't allow deleting self
// // // // // //     if (userId === adminId.toString()) {
// // // // // //       return res.status(400).json({
// // // // // //         success: false,
// // // // // //         message: "Cannot delete your own account",
// // // // // //       });
// // // // // //     }

// // // // // //     // Soft delete: mark as inactive
// // // // // //     user.isActive = false;
// // // // // //     await user.save();

// // // // // //     // Also mark profile as inactive
// // // // // //     await UserProfile.findOneAndUpdate(
// // // // // //       { userId },
// // // // // //       { $set: { isActive: false } }
// // // // // //     );

// // // // // //     res.status(200).json({
// // // // // //       success: true,
// // // // // //       message: "User deactivated successfully",
// // // // // //     });
// // // // // //   } catch (error) {
// // // // // //     console.error("Delete user error:", error);
// // // // // //     res.status(500).json({
// // // // // //       success: false,
// // // // // //       message: "Server error",
// // // // // //       error: error.message,
// // // // // //     });
// // // // // //   }
// // // // // // };

// // // // // // /* =========================
// // // // // //    Create User (Admin only)
// // // // // // ========================= */
// // // // // // export const createUserByAdmin = async (req, res) => {
// // // // // //   try {
// // // // // //     const adminId = req.user._id;
// // // // // //     const {
// // // // // //       email,
// // // // // //       name,
// // // // // //       password,
// // // // // //       role = "user",
// // // // // //       department,
// // // // // //       company,
// // // // // //       shifts,
// // // // // //       ...profileData
// // // // // //     } = req.body;

// // // // // //     // Check if admin can create this role
// // // // // //     if (req.user.role === "admin" && role !== "user") {
// // // // // //       return res.status(403).json({
// // // // // //         success: false,
// // // // // //         message: "Admin can only create regular users",
// // // // // //       });
// // // // // //     }

// // // // // //     // Check if email already exists
// // // // // //     const existingUser = await User.findOne({ email });
// // // // // //     if (existingUser) {
// // // // // //       return res.status(400).json({
// // // // // //         success: false,
// // // // // //         message: "Email already exists",
// // // // // //       });
// // // // // //     }

// // // // // //     // Create user
// // // // // //     const user = new User({
// // // // // //       email,
// // // // // //       name,
// // // // // //       password,
// // // // // //       role,
// // // // // //       department: department || "Operations",
// // // // // //       company: company || req.user.company,
// // // // // //       shifts: shifts || "General (8 AM - 5 PM)",
// // // // // //       adminId: role === "user" ? adminId : undefined,
// // // // // //       createdBy: adminId,
// // // // // //     });

// // // // // //     await user.save();

// // // // // //     // Create empty profile
// // // // // //     const profile = new UserProfile({
// // // // // //       userId: user._id,
// // // // // //       ...profileData,
// // // // // //     });
// // // // // //     await profile.save();

// // // // // //     // Create default salary entry
// // // // // //     const salary = new Salary({
// // // // // //       userId: user._id,
// // // // // //       basicSalary: 0,
// // // // // //       workingHoursPerDay: 8,
// // // // // //       workingDaysPerWeek: 5,
// // // // // //       lunchBreakHours: 1,
// // // // // //       overtimeRate: 1.5,
// // // // // //       currencyType: "INR",
// // // // // //       paymentMethod: "bank_transfer",
// // // // // //       isActive: true,
// // // // // //       createdBy: adminId,
// // // // // //     });
// // // // // //     await salary.save();

// // // // // //     // Remove password from response
// // // // // //     const userResponse = user.toObject();
// // // // // //     delete userResponse.password;

// // // // // //     res.status(201).json({
// // // // // //       success: true,
// // // // // //       message: "User created successfully",
// // // // // //       data: {
// // // // // //         user: userResponse,
// // // // // //         profile,
// // // // // //         salary: {
// // // // // //           basicSalary: salary.basicSalary,
// // // // // //           netSalary: salary.netSalary,
// // // // // //         },
// // // // // //       },
// // // // // //     });
// // // // // //   } catch (error) {
// // // // // //     console.error("Create user error:", error);
// // // // // //     res.status(500).json({
// // // // // //       success: false,
// // // // // //       message: "Server error",
// // // // // //       error: error.message,
// // // // // //     });
// // // // // //   }
// // // // // // };

// // // // // // /* =========================
// // // // // //    Update User (Admin only)
// // // // // // ========================= */
// // // // // // export const updateUserByAdmin = async (req, res) => {
// // // // // //   try {
// // // // // //     const { userId } = req.params;
// // // // // //     const adminId = req.user._id;
// // // // // //     const updateData = req.body;

// // // // // //     // Check if user exists and is under admin's management
// // // // // //     const user = await User.findById(userId);
// // // // // //     if (!user) {
// // // // // //       return res.status(404).json({
// // // // // //         success: false,
// // // // // //         message: "User not found",
// // // // // //       });
// // // // // //     }

// // // // // //     const isUnderAdmin = await User.isUserUnderAdmin(userId, adminId);
// // // // // //     if (!isUnderAdmin) {
// // // // // //       return res.status(403).json({
// // // // // //         success: false,
// // // // // //         message: "Not authorized to update this user",
// // // // // //       });
// // // // // //     }

// // // // // //     // Non-changeable fields for admin
// // // // // //     const nonChangeableFields = ["email", "employeeId", "joinDate"];
// // // // // //     nonChangeableFields.forEach((field) => delete updateData[field]);

// // // // // //     // Update user
// // // // // //     Object.keys(updateData).forEach((key) => {
// // // // // //       if (key in user.schema.paths && key !== "password") {
// // // // // //         user[key] = updateData[key];
// // // // // //       }
// // // // // //     });

// // // // // //     // Handle password update separately
// // // // // //     if (updateData.password) {
// // // // // //       user.password = updateData.password;
// // // // // //     }

// // // // // //     await user.save();

// // // // // //     // Update profile if profile data exists
// // // // // //     if (Object.keys(updateData).some((key) => !key in user.schema.paths)) {
// // // // // //       const profileUpdate = {};
// // // // // //       const profileFields = [
// // // // // //         "phone",
// // // // // //         "address",
// // // // // //         "birthDate",
// // // // // //         "position",
// // // // // //         "bio",
// // // // // //         "username",
// // // // // //         "education",
// // // // // //         "experience",
// // // // // //         "skills",
// // // // // //         "linkedin",
// // // // // //         "github",
// // // // // //         "twitter",
// // // // // //         "emergencyContact",
// // // // // //         "bloodGroup",
// // // // // //         "maritalStatus",
// // // // // //       ];

// // // // // //       profileFields.forEach((field) => {
// // // // // //         if (updateData[field] !== undefined) {
// // // // // //           profileUpdate[field] = updateData[field];
// // // // // //         }
// // // // // //       });

// // // // // //       if (Object.keys(profileUpdate).length > 0) {
// // // // // //         await UserProfile.findOneAndUpdate(
// // // // // //           { userId },
// // // // // //           { $set: profileUpdate },
// // // // // //           { upsert: true, new: true }
// // // // // //         );
// // // // // //       }
// // // // // //     }

// // // // // //     // Get updated user with profile
// // // // // //     const updatedUser = await User.findById(userId)
// // // // // //       .select("-password")
// // // // // //       .lean();

// // // // // //     const profile = await UserProfile.findOne({ userId }).lean();

// // // // // //     res.status(200).json({
// // // // // //       success: true,
// // // // // //       message: "User updated successfully",
// // // // // //       data: {
// // // // // //         user: updatedUser,
// // // // // //         profile,
// // // // // //       },
// // // // // //     });
// // // // // //   } catch (error) {
// // // // // //     console.error("Update user error:", error);
// // // // // //     res.status(500).json({
// // // // // //       success: false,
// // // // // //       message: "Server error",
// // // // // //       error: error.message,
// // // // // //     });
// // // // // //   }
// // // // // // };

// // // // // // /* =========================
// // // // // //    Add Education/Experience/Skill
// // // // // // ========================= */
// // // // // // export const addProfileItem = async (req, res) => {
// // // // // //   try {
// // // // // //     const userId = req.params.userId || req.user._id;
// // // // // //     const { type } = req.params; // education, experience, or skills
// // // // // //     const itemData = req.body;

// // // // // //     // Check authorization
// // // // // //     if (req.user.role === "user" && userId !== req.user._id.toString()) {
// // // // // //       return res.status(403).json({
// // // // // //         success: false,
// // // // // //         message: "Not authorized to update this profile",
// // // // // //       });
// // // // // //     }

// // // // // //     // For admin, check if user is under their management
// // // // // //     if (req.user.role === "admin") {
// // // // // //       const isUnderAdmin = await User.isUserUnderAdmin(userId, req.user._id);
// // // // // //       if (!isUnderAdmin && userId !== req.user._id.toString()) {
// // // // // //         return res.status(403).json({
// // // // // //           success: false,
// // // // // //           message: "Not authorized to update this profile",
// // // // // //         });
// // // // // //       }
// // // // // //     }

// // // // // //     const updateField = `${type}`;
    
// // // // // //     const profile = await UserProfile.findOneAndUpdate(
// // // // // //       { userId },
// // // // // //       { $push: { [updateField]: itemData } },
// // // // // //       { new: true, upsert: true }
// // // // // //     );

// // // // // //     res.status(200).json({
// // // // // //       success: true,
// // // // // //       message: `${type.charAt(0).toUpperCase() + type.slice(1)} added successfully`,
// // // // // //       data: profile[type],
// // // // // //     });
// // // // // //   } catch (error) {
// // // // // //     console.error(`Add ${type} error:`, error);
// // // // // //     res.status(500).json({
// // // // // //       success: false,
// // // // // //       message: "Server error",
// // // // // //       error: error.message,
// // // // // //     });
// // // // // //   }
// // // // // // };

// // // // // // /* =========================
// // // // // //    Update Education/Experience/Skill Item
// // // // // // ========================= */
// // // // // // export const updateProfileItem = async (req, res) => {
// // // // // //   try {
// // // // // //     const userId = req.params.userId || req.user._id;
// // // // // //     const { type, itemId } = req.params;
// // // // // //     const updateData = req.body;

// // // // // //     // Check authorization
// // // // // //     if (req.user.role === "user" && userId !== req.user._id.toString()) {
// // // // // //       return res.status(403).json({
// // // // // //         success: false,
// // // // // //         message: "Not authorized to update this profile",
// // // // // //       });
// // // // // //     }

// // // // // //     // For admin, check if user is under their management
// // // // // //     if (req.user.role === "admin") {
// // // // // //       const isUnderAdmin = await User.isUserUnderAdmin(userId, req.user._id);
// // // // // //       if (!isUnderAdmin && userId !== req.user._id.toString()) {
// // // // // //         return res.status(403).json({
// // // // // //           success: false,
// // // // // //           message: "Not authorized to update this profile",
// // // // // //         });
// // // // // //       }
// // // // // //     }

// // // // // //     const updateField = `${type}.$`;
    
// // // // // //     const profile = await UserProfile.findOneAndUpdate(
// // // // // //       { userId, [`${type}._id`]: itemId },
// // // // // //       { $set: { [updateField]: updateData } },
// // // // // //       { new: true }
// // // // // //     );

// // // // // //     if (!profile) {
// // // // // //       return res.status(404).json({
// // // // // //         success: false,
// // // // // //         message: "Item not found",
// // // // // //       });
// // // // // //     }

// // // // // //     res.status(200).json({
// // // // // //       success: true,
// // // // // //       message: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`,
// // // // // //       data: profile[type].find(item => item._id.toString() === itemId),
// // // // // //     });
// // // // // //   } catch (error) {
// // // // // //     console.error(`Update ${type} error:`, error);
// // // // // //     res.status(500).json({
// // // // // //       success: false,
// // // // // //       message: "Server error",
// // // // // //       error: error.message,
// // // // // //     });
// // // // // //   }
// // // // // // };

// // // // // // /* =========================
// // // // // //    Delete Education/Experience/Skill Item
// // // // // // ========================= */
// // // // // // export const deleteProfileItem = async (req, res) => {
// // // // // //   try {
// // // // // //     const userId = req.params.userId || req.user._id;
// // // // // //     const { type, itemId } = req.params;

// // // // // //     // Check authorization
// // // // // //     if (req.user.role === "user" && userId !== req.user._id.toString()) {
// // // // // //       return res.status(403).json({
// // // // // //         success: false,
// // // // // //         message: "Not authorized to update this profile",
// // // // // //       });
// // // // // //     }

// // // // // //     // For admin, check if user is under their management
// // // // // //     if (req.user.role === "admin") {
// // // // // //       const isUnderAdmin = await User.isUserUnderAdmin(userId, req.user._id);
// // // // // //       if (!isUnderAdmin && userId !== req.user._id.toString()) {
// // // // // //         return res.status(403).json({
// // // // // //           success: false,
// // // // // //           message: "Not authorized to update this profile",
// // // // // //         });
// // // // // //       }
// // // // // //     }

// // // // // //     const profile = await UserProfile.findOneAndUpdate(
// // // // // //       { userId },
// // // // // //       { $pull: { [type]: { _id: itemId } } },
// // // // // //       { new: true }
// // // // // //     );

// // // // // //     res.status(200).json({
// // // // // //       success: true,
// // // // // //       message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
// // // // // //       data: profile[type],
// // // // // //     });
// // // // // //   } catch (error) {
// // // // // //     console.error(`Delete ${type} error:`, error);
// // // // // //     res.status(500).json({
// // // // // //       success: false,
// // // // // //       message: "Server error",
// // // // // //       error: error.message,
// // // // // //     });
// // // // // //   }
// // // // // // };


// // // // // import UserProfile from "../models/UserProfile.js";
// // // // // import User from "../models/User.js";
// // // // // import Salary from "../models/Salary.js";
// // // // // import { cleanupOldFiles } from "../middlewares/profileUpload.js";

// // // // // /**
// // // // //  * @desc    Get user profile by ID
// // // // //  * @route   GET /api/profiles/:userId
// // // // //  * @access  Private
// // // // //  */
// // // // // export const getProfileById = async (req, res) => {
// // // // //   try {
// // // // //     const { userId } = req.params;

// // // // //     // Check if user exists
// // // // //     const user = await User.findById(userId).select(
// // // // //       "name email department employeeId joinDate isActive role createdBy"
// // // // //     );
    
// // // // //     if (!user) {
// // // // //       return res.status(404).json({
// // // // //         success: false,
// // // // //         message: "User not found",
// // // // //       });
// // // // //     }

// // // // //     // Check authorization - Super admin can view all, admin can view their users, user can view only themselves
// // // // //     if (req.user.role === "user" && req.user._id.toString() !== userId) {
// // // // //       return res.status(403).json({
// // // // //         success: false,
// // // // //         message: "Not authorized to view this profile",
// // // // //       });
// // // // //     }

// // // // //     if (req.user.role === "admin") {
// // // // //       if (
// // // // //         req.user._id.toString() !== userId &&
// // // // //         !user.createdBy.equals(req.user._id)
// // // // //       ) {
// // // // //         return res.status(403).json({
// // // // //           success: false,
// // // // //           message: "Not authorized to view this profile",
// // // // //         });
// // // // //       }
// // // // //     }

// // // // //     // Get or create profile
// // // // //     let profile = await UserProfile.findOne({ userId })
// // // // //       .populate("user", "name email role department employeeId joinDate")
// // // // //       .select("-__v");

// // // // //     if (!profile) {
// // // // //       // Create empty profile if doesn't exist
// // // // //       profile = await UserProfile.create({
// // // // //         userId,
// // // // //         username: user.email.split("@")[0],
// // // // //       });
// // // // //     }

// // // // //     // Get salary information (if exists)
// // // // //     const salary = await Salary.findOne({ userId })
// // // // //       .select(
// // // // //         "basicSalary houseRentAllowance travelAllowance medicalAllowance specialAllowance providentFund professionalTax incomeTax otherDeductions currencyType paymentMethod effectiveFrom isActive"
// // // // //       )
// // // // //       .lean();

// // // // //     const response = {
// // // // //       success: true,
// // // // //       data: {
// // // // //         // User model fields (read-only)
// // // // //         userInfo: {
// // // // //           _id: user._id,
// // // // //           name: user.name,
// // // // //           email: user.email,
// // // // //           department: user.department,
// // // // //           employeeId: user.employeeId,
// // // // //           joinDate: user.joinDate,
// // // // //           role: user.role,
// // // // //           isActive: user.isActive,
// // // // //         },
// // // // //         // Profile model fields (editable)
// // // // //         profile: {
// // // // //           phone: profile.phone,
// // // // //           address: profile.address,
// // // // //           birthDate: profile.birthDate,
// // // // //           position: profile.position,
// // // // //           avatar: profile.avatar,
// // // // //           coverPhoto: profile.coverPhoto,
// // // // //           bio: profile.bio,
// // // // //           username: profile.username,
// // // // //           education: profile.education,
// // // // //           experience: profile.experience,
// // // // //           skills: profile.skills,
// // // // //           linkedin: profile.linkedin,
// // // // //           github: profile.github,
// // // // //           twitter: profile.twitter,
// // // // //           emergencyContact: profile.emergencyContact,
// // // // //           bloodGroup: profile.bloodGroup,
// // // // //           maritalStatus: profile.maritalStatus,
// // // // //           updatedAt: profile.updatedAt,
// // // // //         },
// // // // //         // Salary model fields (read-only)
// // // // //         salary: salary || null,
// // // // //       },
// // // // //     };

// // // // //     res.status(200).json(response);
// // // // //   } catch (error) {
// // // // //     console.error("Get profile error:", error);
// // // // //     res.status(500).json({
// // // // //       success: false,
// // // // //       message: "Server error",
// // // // //       error: error.message,
// // // // //     });
// // // // //   }
// // // // // };

// // // // // /**
// // // // //  * @desc    Get all profiles for admin
// // // // //  * @route   GET /api/profiles/admin/users
// // // // //  * @access  Private (Admin only)
// // // // //  */
// // // // // export const getAdminUsersProfiles = async (req, res) => {
// // // // //   try {
// // // // //     // Only admin and super admin can access
// // // // //     if (req.user.role === "user") {
// // // // //       return res.status(403).json({
// // // // //         success: false,
// // // // //         message: "Not authorized",
// // // // //       });
// // // // //     }

// // // // //     let query = {};
    
// // // // //     // Admin can only see users they created
// // // // //     if (req.user.role === "admin") {
// // // // //       query = { createdBy: req.user._id, role: "user" };
// // // // //     }
    
// // // // //     // Super admin can see all users
// // // // //     if (req.user.role === "super_admin") {
// // // // //       query = { role: "user" };
// // // // //     }

// // // // //     // Get users with basic info
// // // // //     const users = await User.find(query)
// // // // //       .select("_id name email department employeeId joinDate isActive createdAt")
// // // // //       .sort({ name: 1 });

// // // // //     // Get profiles for these users
// // // // //     const userIds = users.map((user) => user._id);
// // // // //     const profiles = await UserProfile.find({ userId: { $in: userIds } })
// // // // //       .select("userId phone position avatar")
// // // // //       .lean();

// // // // //     // Get salaries for these users
// // // // //     const salaries = await Salary.find({ userId: { $in: userIds }, isActive: true })
// // // // //       .select("userId basicSalary netSalary currencyType")
// // // // //       .lean();

// // // // //     // Combine data
// // // // //     const usersWithProfiles = users.map((user) => {
// // // // //       const profile = profiles.find((p) => p.userId.toString() === user._id.toString());
// // // // //       const salary = salaries.find((s) => s.userId.toString() === user._id.toString());

// // // // //       return {
// // // // //         _id: user._id,
// // // // //         name: user.name,
// // // // //         email: user.email,
// // // // //         department: user.department,
// // // // //         employeeId: user.employeeId,
// // // // //         joinDate: user.joinDate,
// // // // //         isActive: user.isActive,
// // // // //         createdAt: user.createdAt,
// // // // //         profile: profile
// // // // //           ? {
// // // // //               phone: profile.phone,
// // // // //               position: profile.position,
// // // // //               avatar: profile.avatar,
// // // // //             }
// // // // //           : null,
// // // // //         salary: salary
// // // // //           ? {
// // // // //               basicSalary: salary.basicSalary,
// // // // //               netSalary: salary.netSalary,
// // // // //               currencyType: salary.currencyType,
// // // // //             }
// // // // //           : null,
// // // // //       };
// // // // //     });

// // // // //     res.status(200).json({
// // // // //       success: true,
// // // // //       count: usersWithProfiles.length,
// // // // //       data: usersWithProfiles,
// // // // //     });
// // // // //   } catch (error) {
// // // // //     console.error("Get admin users profiles error:", error);
// // // // //     res.status(500).json({
// // // // //       success: false,
// // // // //       message: "Server error",
// // // // //       error: error.message,
// // // // //     });
// // // // //   }
// // // // // };

// // // // // /**
// // // // //  * @desc    Update user profile
// // // // //  * @route   PUT /api/profiles/:userId
// // // // //  * @access  Private
// // // // //  */
// // // // // export const updateProfile = async (req, res) => {
// // // // //   try {
// // // // //     const { userId } = req.params;

// // // // //     // Check if user exists
// // // // //     const user = await User.findById(userId);
// // // // //     if (!user) {
// // // // //       return res.status(404).json({
// // // // //         success: false,
// // // // //         message: "User not found",
// // // // //       });
// // // // //     }

// // // // //     // Check authorization
// // // // //     if (req.user.role === "user" && req.user._id.toString() !== userId) {
// // // // //       return res.status(403).json({
// // // // //         success: false,
// // // // //         message: "Not authorized to update this profile",
// // // // //       });
// // // // //     }

// // // // //     if (req.user.role === "admin") {
// // // // //       if (
// // // // //         req.user._id.toString() !== userId &&
// // // // //         !user.createdBy.equals(req.user._id)
// // // // //       ) {
// // // // //         return res.status(403).json({
// // // // //           success: false,
// // // // //           message: "Not authorized to update this profile",
// // // // //         });
// // // // //       }
// // // // //     }

// // // // //     // Fields that CANNOT be updated through profile
// // // // //     const protectedFields = [
// // // // //       "userId",
// // // // //       "_id",
// // // // //       "createdAt",
// // // // //       "updatedAt",
// // // // //       "__v",
// // // // //     ];

// // // // //     // Remove protected fields from update data
// // // // //     protectedFields.forEach((field) => {
// // // // //       delete req.body[field];
// // // // //     });

// // // // //     // Handle username uniqueness check
// // // // //     if (req.body.username) {
// // // // //       const existingProfile = await UserProfile.findOne({
// // // // //         username: req.body.username,
// // // // //         userId: { $ne: userId },
// // // // //       });

// // // // //       if (existingProfile) {
// // // // //         return res.status(400).json({
// // // // //           success: false,
// // // // //           message: "Username already exists",
// // // // //         });
// // // // //       }
// // // // //     }

// // // // //     // Find existing profile
// // // // //     const existingProfile = await UserProfile.findOne({ userId });
// // // // //     let profile;

// // // // //     if (existingProfile) {
// // // // //       // Clean up old files if new ones are uploaded
// // // // //       if ((req.body.avatar || req.body.coverPhoto) && existingProfile) {
// // // // //         await cleanupOldFiles(existingProfile, req.body);
// // // // //       }

// // // // //       // Update existing profile
// // // // //       profile = await UserProfile.findOneAndUpdate(
// // // // //         { userId },
// // // // //         { $set: req.body },
// // // // //         { new: true, runValidators: true }
// // // // //       );
// // // // //     } else {
// // // // //       // Create new profile
// // // // //       profile = await UserProfile.create({
// // // // //         userId,
// // // // //         username: user.email.split("@")[0],
// // // // //         ...req.body,
// // // // //       });
// // // // //     }

// // // // //     res.status(200).json({
// // // // //       success: true,
// // // // //       message: "Profile updated successfully",
// // // // //       data: profile,
// // // // //     });
// // // // //   } catch (error) {
// // // // //     console.error("Update profile error:", error);
// // // // //     res.status(500).json({
// // // // //       success: false,
// // // // //       message: "Server error",
// // // // //       error: error.message,
// // // // //     });
// // // // //   }
// // // // // };

// // // // // /**
// // // // //  * @desc    Add education entry
// // // // //  * @route   POST /api/profiles/:userId/education
// // // // //  * @access  Private
// // // // //  */
// // // // // export const addEducation = async (req, res) => {
// // // // //   try {
// // // // //     const { userId } = req.params;

// // // // //     // Check authorization
// // // // //     if (req.user.role === "user" && req.user._id.toString() !== userId) {
// // // // //       return res.status(403).json({
// // // // //         success: false,
// // // // //         message: "Not authorized",
// // // // //       });
// // // // //     }

// // // // //     const profile = await UserProfile.findOne({ userId });
// // // // //     if (!profile) {
// // // // //       return res.status(404).json({
// // // // //         success: false,
// // // // //         message: "Profile not found",
// // // // //       });
// // // // //     }

// // // // //     profile.education.push(req.body);
// // // // //     await profile.save();

// // // // //     res.status(201).json({
// // // // //       success: true,
// // // // //       message: "Education added successfully",
// // // // //       data: profile.education[profile.education.length - 1],
// // // // //     });
// // // // //   } catch (error) {
// // // // //     console.error("Add education error:", error);
// // // // //     res.status(500).json({
// // // // //       success: false,
// // // // //       message: "Server error",
// // // // //       error: error.message,
// // // // //     });
// // // // //   }
// // // // // };

// // // // // /**
// // // // //  * @desc    Update education entry
// // // // //  * @route   PUT /api/profiles/:userId/education/:eduId
// // // // //  * @access  Private
// // // // //  */
// // // // // export const updateEducation = async (req, res) => {
// // // // //   try {
// // // // //     const { userId, eduId } = req.params;

// // // // //     // Check authorization
// // // // //     if (req.user.role === "user" && req.user._id.toString() !== userId) {
// // // // //       return res.status(403).json({
// // // // //         success: false,
// // // // //         message: "Not authorized",
// // // // //       });
// // // // //     }

// // // // //     const profile = await UserProfile.findOne({ userId });
// // // // //     if (!profile) {
// // // // //       return res.status(404).json({
// // // // //         success: false,
// // // // //         message: "Profile not found",
// // // // //       });
// // // // //     }

// // // // //     const educationIndex = profile.education.findIndex(
// // // // //       (edu) => edu._id.toString() === eduId
// // // // //     );

// // // // //     if (educationIndex === -1) {
// // // // //       return res.status(404).json({
// // // // //         success: false,
// // // // //         message: "Education entry not found",
// // // // //       });
// // // // //     }

// // // // //     // Update the education entry
// // // // //     profile.education[educationIndex] = {
// // // // //       ...profile.education[educationIndex].toObject(),
// // // // //       ...req.body,
// // // // //     };

// // // // //     await profile.save();

// // // // //     res.status(200).json({
// // // // //       success: true,
// // // // //       message: "Education updated successfully",
// // // // //       data: profile.education[educationIndex],
// // // // //     });
// // // // //   } catch (error) {
// // // // //     console.error("Update education error:", error);
// // // // //     res.status(500).json({
// // // // //       success: false,
// // // // //       message: "Server error",
// // // // //       error: error.message,
// // // // //     });
// // // // //   }
// // // // // };

// // // // // /**
// // // // //  * @desc    Delete education entry
// // // // //  * @route   DELETE /api/profiles/:userId/education/:eduId
// // // // //  * @access  Private
// // // // //  */
// // // // // export const deleteEducation = async (req, res) => {
// // // // //   try {
// // // // //     const { userId, eduId } = req.params;

// // // // //     // Check authorization
// // // // //     if (req.user.role === "user" && req.user._id.toString() !== userId) {
// // // // //       return res.status(403).json({
// // // // //         success: false,
// // // // //         message: "Not authorized",
// // // // //       });
// // // // //     }

// // // // //     const profile = await UserProfile.findOne({ userId });
// // // // //     if (!profile) {
// // // // //       return res.status(404).json({
// // // // //         success: false,
// // // // //         message: "Profile not found",
// // // // //       });
// // // // //     }

// // // // //     profile.education = profile.education.filter(
// // // // //       (edu) => edu._id.toString() !== eduId
// // // // //     );

// // // // //     await profile.save();

// // // // //     res.status(200).json({
// // // // //       success: true,
// // // // //       message: "Education deleted successfully",
// // // // //     });
// // // // //   } catch (error) {
// // // // //     console.error("Delete education error:", error);
// // // // //     res.status(500).json({
// // // // //       success: false,
// // // // //       message: "Server error",
// // // // //       error: error.message,
// // // // //     });
// // // // //   }
// // // // // };

// // // // // /**
// // // // //  * @desc    Add experience entry
// // // // //  * @route   POST /api/profiles/:userId/experience
// // // // //  * @access  Private
// // // // //  */
// // // // // export const addExperience = async (req, res) => {
// // // // //   try {
// // // // //     const { userId } = req.params;

// // // // //     // Check authorization
// // // // //     if (req.user.role === "user" && req.user._id.toString() !== userId) {
// // // // //       return res.status(403).json({
// // // // //         success: false,
// // // // //         message: "Not authorized",
// // // // //       });
// // // // //     }

// // // // //     const profile = await UserProfile.findOne({ userId });
// // // // //     if (!profile) {
// // // // //       return res.status(404).json({
// // // // //         success: false,
// // // // //         message: "Profile not found",
// // // // //       });
// // // // //     }

// // // // //     profile.experience.push(req.body);
// // // // //     await profile.save();

// // // // //     res.status(201).json({
// // // // //       success: true,
// // // // //       message: "Experience added successfully",
// // // // //       data: profile.experience[profile.experience.length - 1],
// // // // //     });
// // // // //   } catch (error) {
// // // // //     console.error("Add experience error:", error);
// // // // //     res.status(500).json({
// // // // //       success: false,
// // // // //       message: "Server error",
// // // // //       error: error.message,
// // // // //     });
// // // // //   }
// // // // // };

// // // // // /**
// // // // //  * @desc    Update experience entry
// // // // //  * @route   PUT /api/profiles/:userId/experience/:expId
// // // // //  * @access  Private
// // // // //  */
// // // // // export const updateExperience = async (req, res) => {
// // // // //   try {
// // // // //     const { userId, expId } = req.params;

// // // // //     // Check authorization
// // // // //     if (req.user.role === "user" && req.user._id.toString() !== userId) {
// // // // //       return res.status(403).json({
// // // // //         success: false,
// // // // //         message: "Not authorized",
// // // // //       });
// // // // //     }

// // // // //     const profile = await UserProfile.findOne({ userId });
// // // // //     if (!profile) {
// // // // //       return res.status(404).json({
// // // // //         success: false,
// // // // //         message: "Profile not found",
// // // // //       });
// // // // //     }

// // // // //     const experienceIndex = profile.experience.findIndex(
// // // // //       (exp) => exp._id.toString() === expId
// // // // //     );

// // // // //     if (experienceIndex === -1) {
// // // // //       return res.status(404).json({
// // // // //         success: false,
// // // // //         message: "Experience entry not found",
// // // // //       });
// // // // //     }

// // // // //     // Update the experience entry
// // // // //     profile.experience[experienceIndex] = {
// // // // //       ...profile.experience[experienceIndex].toObject(),
// // // // //       ...req.body,
// // // // //     };

// // // // //     await profile.save();

// // // // //     res.status(200).json({
// // // // //       success: true,
// // // // //       message: "Experience updated successfully",
// // // // //       data: profile.experience[experienceIndex],
// // // // //     });
// // // // //   } catch (error) {
// // // // //     console.error("Update experience error:", error);
// // // // //     res.status(500).json({
// // // // //       success: false,
// // // // //       message: "Server error",
// // // // //       error: error.message,
// // // // //     });
// // // // //   }
// // // // // };

// // // // // /**
// // // // //  * @desc    Delete experience entry
// // // // //  * @route   DELETE /api/profiles/:userId/experience/:expId
// // // // //  * @access  Private
// // // // //  */
// // // // // export const deleteExperience = async (req, res) => {
// // // // //   try {
// // // // //     const { userId, expId } = req.params;

// // // // //     // Check authorization
// // // // //     if (req.user.role === "user" && req.user._id.toString() !== userId) {
// // // // //       return res.status(403).json({
// // // // //         success: false,
// // // // //         message: "Not authorized",
// // // // //       });
// // // // //     }

// // // // //     const profile = await UserProfile.findOne({ userId });
// // // // //     if (!profile) {
// // // // //       return res.status(404).json({
// // // // //         success: false,
// // // // //         message: "Profile not found",
// // // // //       });
// // // // //     }

// // // // //     profile.experience = profile.experience.filter(
// // // // //       (exp) => exp._id.toString() !== expId
// // // // //     );

// // // // //     await profile.save();

// // // // //     res.status(200).json({
// // // // //       success: true,
// // // // //       message: "Experience deleted successfully",
// // // // //     });
// // // // //   } catch (error) {
// // // // //     console.error("Delete experience error:", error);
// // // // //     res.status(500).json({
// // // // //       success: false,
// // // // //       message: "Server error",
// // // // //       error: error.message,
// // // // //     });
// // // // //   }
// // // // // };

// // // // // /**
// // // // //  * @desc    Add/Update skills
// // // // //  * @route   PUT /api/profiles/:userId/skills
// // // // //  * @access  Private
// // // // //  */
// // // // // export const updateSkills = async (req, res) => {
// // // // //   try {
// // // // //     const { userId } = req.params;
// // // // //     const { skills } = req.body;

// // // // //     // Check authorization
// // // // //     if (req.user.role === "user" && req.user._id.toString() !== userId) {
// // // // //       return res.status(403).json({
// // // // //         success: false,
// // // // //         message: "Not authorized",
// // // // //       });
// // // // //     }

// // // // //     if (!Array.isArray(skills)) {
// // // // //       return res.status(400).json({
// // // // //         success: false,
// // // // //         message: "Skills must be an array",
// // // // //       });
// // // // //     }

// // // // //     const profile = await UserProfile.findOne({ userId });
// // // // //     if (!profile) {
// // // // //       return res.status(404).json({
// // // // //         success: false,
// // // // //         message: "Profile not found",
// // // // //       });
// // // // //     }

// // // // //     // Replace all skills
// // // // //     profile.skills = skills;
// // // // //     await profile.save();

// // // // //     res.status(200).json({
// // // // //       success: true,
// // // // //       message: "Skills updated successfully",
// // // // //       data: profile.skills,
// // // // //     });
// // // // //   } catch (error) {
// // // // //     console.error("Update skills error:", error);
// // // // //     res.status(500).json({
// // // // //       success: false,
// // // // //       message: "Server error",
// // // // //       error: error.message,
// // // // //     });
// // // // //   }
// // // // // };

// // // // // /**
// // // // //  * @desc    Get current user's profile
// // // // //  * @route   GET /api/profiles/me
// // // // //  * @access  Private
// // // // //  */
// // // // // export const getMyProfile = async (req, res) => {
// // // // //   try {
// // // // //     // Redirect to getProfileById with current user's ID
// // // // //     req.params.userId = req.user._id;
// // // // //     return getProfileById(req, res);
// // // // //   } catch (error) {
// // // // //     console.error("Get my profile error:", error);
// // // // //     res.status(500).json({
// // // // //       success: false,
// // // // //       message: "Server error",
// // // // //       error: error.message,
// // // // //     });
// // // // //   }
// // // // // };

// // // // // /**
// // // // //  * @desc    Update current user's profile
// // // // //  * @route   PUT /api/profiles/me
// // // // //  * @access  Private
// // // // //  */
// // // // // export const updateMyProfile = async (req, res) => {
// // // // //   try {
// // // // //     // Redirect to updateProfile with current user's ID
// // // // //     req.params.userId = req.user._id;
// // // // //     return updateProfile(req, res);
// // // // //   } catch (error) {
// // // // //     console.error("Update my profile error:", error);
// // // // //     res.status(500).json({
// // // // //       success: false,
// // // // //       message: "Server error",
// // // // //       error: error.message,
// // // // //     });
// // // // //   }
// // // // // };


// // // // import User from '../models/User.js';
// // // // import UserProfile from '../models/UserProfile.js';
// // // // import Salary from '../models/Salary.js';

// // // // /* =========================
// // // //    GET USER PROFILE
// // // // ========================= */
// // // // export const getUserProfile = async (req, res) => {
// // // //   try {
// // // //     const userProfile = await UserProfile.findOne({ userId: req.user._id })
// // // //       .populate({
// // // //         path: 'user',
// // // //         select: 'name email role department shifts employeeId joinDate createdBy company isActive'
// // // //       })
// // // //       .lean();

// // // //     if (!userProfile) {
// // // //       // Create empty profile if not exists
// // // //       const newProfile = await UserProfile.create({
// // // //         userId: req.user._id,
// // // //         username: req.user.email.split('@')[0]
// // // //       });
      
// // // //       return res.status(200).json({
// // // //         success: true,
// // // //         data: {
// // // //           ...newProfile.toObject(),
// // // //           user: req.user
// // // //         }
// // // //       });
// // // //     }

// // // //     // Get salary if exists
// // // //     const salary = await Salary.findOne({ userId: req.user._id })
// // // //       .select('-__v -createdBy -updatedBy')
// // // //       .lean();

// // // //     res.status(200).json({
// // // //       success: true,
// // // //       data: {
// // // //         ...userProfile,
// // // //         salary
// // // //       }
// // // //     });
// // // //   } catch (error) {
// // // //     console.error('Get profile error:', error);
// // // //     res.status(500).json({
// // // //       success: false,
// // // //       message: 'Server error'
// // // //     });
// // // //   }
// // // // };

// // // // /* =========================
// // // //    UPDATE USER PROFILE
// // // // ========================= */
// // // // export const updateUserProfile = async (req, res) => {
// // // //   try {
// // // //     const userId = req.user._id;
// // // //     const updateData = req.body;

// // // //     // Remove fields that shouldn't be updated
// // // //     const restrictedFields = [
// // // //       'userId', 'email', 'name', 'department', 'employeeId', 
// // // //       'joinDate', 'role', 'createdBy', 'adminId', 'company'
// // // //     ];
    
// // // //     restrictedFields.forEach(field => delete updateData[field]);

// // // //     // Check if username already exists (if being updated)
// // // //     if (updateData.username) {
// // // //       const existingUser = await UserProfile.findOne({
// // // //         username: updateData.username,
// // // //         userId: { $ne: userId }
// // // //       });
      
// // // //       if (existingUser) {
// // // //         return res.status(400).json({
// // // //           success: false,
// // // //           message: 'Username already taken'
// // // //         });
// // // //       }
// // // //     }

// // // //     // Update or create profile
// // // //     const profile = await UserProfile.findOneAndUpdate(
// // // //       { userId },
// // // //       updateData,
// // // //       { 
// // // //         new: true,
// // // //         upsert: true,
// // // //         runValidators: true,
// // // //         setDefaultsOnInsert: true
// // // //       }
// // // //     ).populate({
// // // //       path: 'user',
// // // //       select: 'name email role department shifts employeeId joinDate company'
// // // //     });

// // // //     res.status(200).json({
// // // //       success: true,
// // // //       message: 'Profile updated successfully',
// // // //       data: profile
// // // //     });
// // // //   } catch (error) {
// // // //     console.error('Update profile error:', error);
// // // //     res.status(500).json({
// // // //       success: false,
// // // //       message: error.message || 'Server error'
// // // //     });
// // // //   }
// // // // };

// // // // /* =========================
// // // //    ADD EDUCATION
// // // // ========================= */
// // // // export const addEducation = async (req, res) => {
// // // //   try {
// // // //     const userId = req.user._id;
// // // //     const educationData = req.body;

// // // //     const profile = await UserProfile.findOneAndUpdate(
// // // //       { userId },
// // // //       { $push: { education: educationData } },
// // // //       { new: true }
// // // //     );

// // // //     res.status(200).json({
// // // //       success: true,
// // // //       message: 'Education added successfully',
// // // //       data: profile.education
// // // //     });
// // // //   } catch (error) {
// // // //     console.error('Add education error:', error);
// // // //     res.status(500).json({
// // // //       success: false,
// // // //       message: 'Server error'
// // // //     });
// // // //   }
// // // // };

// // // // /* =========================
// // // //    UPDATE EDUCATION
// // // // ========================= */
// // // // export const updateEducation = async (req, res) => {
// // // //   try {
// // // //     const userId = req.user._id;
// // // //     const { educationId } = req.params;
// // // //     const updateData = req.body;

// // // //     const profile = await UserProfile.findOne({ userId });
    
// // // //     if (!profile) {
// // // //       return res.status(404).json({
// // // //         success: false,
// // // //         message: 'Profile not found'
// // // //       });
// // // //     }

// // // //     const educationIndex = profile.education.id(educationId);
    
// // // //     if (!educationIndex) {
// // // //       return res.status(404).json({
// // // //         success: false,
// // // //         message: 'Education record not found'
// // // //       });
// // // //     }

// // // //     // Update education
// // // //     Object.keys(updateData).forEach(key => {
// // // //       if (updateData[key] !== undefined) {
// // // //         educationIndex[key] = updateData[key];
// // // //       }
// // // //     });

// // // //     await profile.save();

// // // //     res.status(200).json({
// // // //       success: true,
// // // //       message: 'Education updated successfully',
// // // //       data: profile.education
// // // //     });
// // // //   } catch (error) {
// // // //     console.error('Update education error:', error);
// // // //     res.status(500).json({
// // // //       success: false,
// // // //       message: 'Server error'
// // // //     });
// // // //   }
// // // // };

// // // // /* =========================
// // // //    DELETE EDUCATION
// // // // ========================= */
// // // // export const deleteEducation = async (req, res) => {
// // // //   try {
// // // //     const userId = req.user._id;
// // // //     const { educationId } = req.params;

// // // //     const profile = await UserProfile.findOneAndUpdate(
// // // //       { userId },
// // // //       { $pull: { education: { _id: educationId } } },
// // // //       { new: true }
// // // //     );

// // // //     res.status(200).json({
// // // //       success: true,
// // // //       message: 'Education deleted successfully',
// // // //       data: profile.education
// // // //     });
// // // //   } catch (error) {
// // // //     console.error('Delete education error:', error);
// // // //     res.status(500).json({
// // // //       success: false,
// // // //       message: 'Server error'
// // // //     });
// // // //   }
// // // // };

// // // // /* =========================
// // // //    ADD EXPERIENCE
// // // // ========================= */
// // // // export const addExperience = async (req, res) => {
// // // //   try {
// // // //     const userId = req.user._id;
// // // //     const experienceData = req.body;

// // // //     const profile = await UserProfile.findOneAndUpdate(
// // // //       { userId },
// // // //       { $push: { experience: experienceData } },
// // // //       { new: true }
// // // //     );

// // // //     res.status(200).json({
// // // //       success: true,
// // // //       message: 'Experience added successfully',
// // // //       data: profile.experience
// // // //     });
// // // //   } catch (error) {
// // // //     console.error('Add experience error:', error);
// // // //     res.status(500).json({
// // // //       success: false,
// // // //       message: 'Server error'
// // // //     });
// // // //   }
// // // // };

// // // // /* =========================
// // // //    UPDATE EXPERIENCE
// // // // ========================= */
// // // // export const updateExperience = async (req, res) => {
// // // //   try {
// // // //     const userId = req.user._id;
// // // //     const { experienceId } = req.params;
// // // //     const updateData = req.body;

// // // //     const profile = await UserProfile.findOne({ userId });
    
// // // //     if (!profile) {
// // // //       return res.status(404).json({
// // // //         success: false,
// // // //         message: 'Profile not found'
// // // //       });
// // // //     }

// // // //     const experienceIndex = profile.experience.id(experienceId);
    
// // // //     if (!experienceIndex) {
// // // //       return res.status(404).json({
// // // //         success: false,
// // // //         message: 'Experience record not found'
// // // //       });
// // // //     }

// // // //     // Update experience
// // // //     Object.keys(updateData).forEach(key => {
// // // //       if (updateData[key] !== undefined) {
// // // //         experienceIndex[key] = updateData[key];
// // // //       }
// // // //     });

// // // //     await profile.save();

// // // //     res.status(200).json({
// // // //       success: true,
// // // //       message: 'Experience updated successfully',
// // // //       data: profile.experience
// // // //     });
// // // //   } catch (error) {
// // // //     console.error('Update experience error:', error);
// // // //     res.status(500).json({
// // // //       success: false,
// // // //       message: 'Server error'
// // // //     });
// // // //   }
// // // // };

// // // // /* =========================
// // // //    DELETE EXPERIENCE
// // // // ========================= */
// // // // export const deleteExperience = async (req, res) => {
// // // //   try {
// // // //     const userId = req.user._id;
// // // //     const { experienceId } = req.params;

// // // //     const profile = await UserProfile.findOneAndUpdate(
// // // //       { userId },
// // // //       { $pull: { experience: { _id: experienceId } } },
// // // //       { new: true }
// // // //     );

// // // //     res.status(200).json({
// // // //       success: true,
// // // //       message: 'Experience deleted successfully',
// // // //       data: profile.experience
// // // //     });
// // // //   } catch (error) {
// // // //     console.error('Delete experience error:', error);
// // // //     res.status(500).json({
// // // //       success: false,
// // // //       message: 'Server error'
// // // //     });
// // // //   }
// // // // };

// // // // /* =========================
// // // //    ADD/UPDATE SKILLS
// // // // ========================= */
// // // // export const updateSkills = async (req, res) => {
// // // //   try {
// // // //     const userId = req.user._id;
// // // //     const { skills } = req.body;

// // // //     const profile = await UserProfile.findOneAndUpdate(
// // // //       { userId },
// // // //       { $set: { skills } },
// // // //       { new: true }
// // // //     );

// // // //     res.status(200).json({
// // // //       success: true,
// // // //       message: 'Skills updated successfully',
// // // //       data: profile.skills
// // // //     });
// // // //   } catch (error) {
// // // //     console.error('Update skills error:', error);
// // // //     res.status(500).json({
// // // //       success: false,
// // // //       message: 'Server error'
// // // //     });
// // // //   }
// // // // };

// // // // /* =========================
// // // //    GET USER SALARY
// // // // ========================= */
// // // // export const getUserSalary = async (req, res) => {
// // // //   try {
// // // //     const userId = req.user._id;

// // // //     const salary = await Salary.findOne({ userId })
// // // //       .select('-__v -createdBy -updatedBy')
// // // //       .lean();

// // // //     if (!salary) {
// // // //       return res.status(404).json({
// // // //         success: false,
// // // //         message: 'Salary information not found'
// // // //       });
// // // //     }

// // // //     res.status(200).json({
// // // //       success: true,
// // // //       data: salary
// // // //     });
// // // //   } catch (error) {
// // // //     console.error('Get salary error:', error);
// // // //     res.status(500).json({
// // // //       success: false,
// // // //       message: 'Server error'
// // // //     });
// // // //   }
// // // // };


// // // import User from '../models/User.js';
// // // import UserProfile from '../models/UserProfile.js';
// // // import Salary from '../models/Salary.js';
// // // import { removeOldFile } from '../middlewares/profileUpload.js';

// // // // Get all users with basic info and salary
// // // export const getAllUsers = async (req, res) => {
// // //   try {
// // //     const users = await User.find({ 
// // //       role: 'user',
// // //       isActive: true 
// // //     })
// // //     .select('_id email name department shifts createdAt')
// // //     .sort('-createdAt');

// // //     // Get salary info for each user
// // //     const usersWithSalary = await Promise.all(
// // //       users.map(async (user) => {
// // //         const salary = await Salary.findOne({ 
// // //           userId: user._id, 
// // //           isActive: true 
// // //         }).select('basicSalary currencyType');

// // //         const profile = await UserProfile.findOne({ 
// // //           userId: user._id 
// // //         }).select('avatar position');

// // //         return {
// // //           _id: user._id,
// // //           email: user.email,
// // //           name: user.name,
// // //           department: user.department,
// // //           employeeId: user._id.toString().slice(-6), // Generate employee ID from last 6 chars
// // //           joinDate: user.createdAt,
// // //           position: profile?.position || 'Not specified',
// // //           avatar: profile?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
// // //           basicSalary: salary?.basicSalary || 0,
// // //           currency: salary?.currencyType || 'INR'
// // //         };
// // //       })
// // //     );

// // //     res.status(200).json({
// // //       success: true,
// // //       count: usersWithSalary.length,
// // //       data: usersWithSalary
// // //     });
// // //   } catch (error) {
// // //     console.error('Get all users error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Server error'
// // //     });
// // //   }
// // // };

// // // // Get user profile
// // // export const getUserProfile = async (req, res) => {
// // //   try {
// // //     const userId = req.params.userId || req.user._id;
    
// // //     const profile = await UserProfile.findOne({ userId })
// // //       .populate('user', 'name email role department shifts');

// // //     if (!profile) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Profile not found'
// // //       });
// // //     }

// // //     res.status(200).json({
// // //       success: true,
// // //       data: profile
// // //     });
// // //   } catch (error) {
// // //     console.error('Get profile error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Server error'
// // //     });
// // //   }
// // // };

// // // // Create or update user profile
// // // export const updateProfile = async (req, res) => {
// // //   try {
// // //     const userId = req.params.userId || req.user._id;
// // //     const updateData = { ...req.body };
    
// // //     // Handle file uploads if present
// // //     if (req.file) {
// // //       if (req.file.fieldname === 'avatar') {
// // //         // Remove old avatar if exists
// // //         const oldProfile = await UserProfile.findOne({ userId });
// // //         if (oldProfile?.avatar) {
// // //           removeOldFile(oldProfile.avatar);
// // //         }
// // //         updateData.avatar = `/${req.file.path.replace(/\\/g, '/')}`;
// // //       } else if (req.file.fieldname === 'coverPhoto') {
// // //         // Remove old cover photo if exists
// // //         const oldProfile = await UserProfile.findOne({ userId });
// // //         if (oldProfile?.coverPhoto) {
// // //           removeOldFile(oldProfile.coverPhoto);
// // //         }
// // //         updateData.coverPhoto = `/${req.file.path.replace(/\\/g, '/')}`;
// // //       }
// // //     }

// // //     // Validate username uniqueness
// // //     if (updateData.username) {
// // //       const existingProfile = await UserProfile.findOne({
// // //         username: updateData.username,
// // //         userId: { $ne: userId }
// // //       });
      
// // //       if (existingProfile) {
// // //         return res.status(400).json({
// // //           success: false,
// // //           message: 'Username already taken'
// // //         });
// // //       }
// // //     }

// // //     const profile = await UserProfile.findOneAndUpdate(
// // //       { userId },
// // //       updateData,
// // //       { 
// // //         new: true, 
// // //         upsert: true,
// // //         runValidators: true 
// // //       }
// // //     ).populate('user', 'name email');

// // //     res.status(200).json({
// // //       success: true,
// // //       message: 'Profile updated successfully',
// // //       data: profile
// // //     });
// // //   } catch (error) {
// // //     console.error('Update profile error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: error.message || 'Server error'
// // //     });
// // //   }
// // // };

// // // // Education CRUD operations
// // // export const addEducation = async (req, res) => {
// // //   try {
// // //     const userId = req.params.userId || req.user._id;
    
// // //     const profile = await UserProfile.findOneAndUpdate(
// // //       { userId },
// // //       { $push: { education: req.body } },
// // //       { new: true, upsert: true }
// // //     );

// // //     res.status(200).json({
// // //       success: true,
// // //       message: 'Education added successfully',
// // //       data: profile.education
// // //     });
// // //   } catch (error) {
// // //     console.error('Add education error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Server error'
// // //     });
// // //   }
// // // };

// // // export const updateEducation = async (req, res) => {
// // //   try {
// // //     const userId = req.params.userId || req.user._id;
// // //     const { educationId } = req.params;

// // //     const profile = await UserProfile.findOne({ userId });
// // //     if (!profile) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Profile not found'
// // //       });
// // //     }

// // //     const educationIndex = profile.education.findIndex(
// // //       edu => edu._id.toString() === educationId
// // //     );

// // //     if (educationIndex === -1) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Education record not found'
// // //       });
// // //     }

// // //     profile.education[educationIndex] = {
// // //       ...profile.education[educationIndex].toObject(),
// // //       ...req.body
// // //     };

// // //     await profile.save();

// // //     res.status(200).json({
// // //       success: true,
// // //       message: 'Education updated successfully',
// // //       data: profile.education[educationIndex]
// // //     });
// // //   } catch (error) {
// // //     console.error('Update education error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Server error'
// // //     });
// // //   }
// // // };

// // // export const deleteEducation = async (req, res) => {
// // //   try {
// // //     const userId = req.params.userId || req.user._id;
// // //     const { educationId } = req.params;

// // //     const profile = await UserProfile.findOneAndUpdate(
// // //       { userId },
// // //       { $pull: { education: { _id: educationId } } },
// // //       { new: true }
// // //     );

// // //     res.status(200).json({
// // //       success: true,
// // //       message: 'Education deleted successfully',
// // //       data: profile?.education || []
// // //     });
// // //   } catch (error) {
// // //     console.error('Delete education error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Server error'
// // //     });
// // //   }
// // // };

// // // // Experience CRUD operations
// // // export const addExperience = async (req, res) => {
// // //   try {
// // //     const userId = req.params.userId || req.user._id;
    
// // //     const profile = await UserProfile.findOneAndUpdate(
// // //       { userId },
// // //       { $push: { experience: req.body } },
// // //       { new: true, upsert: true }
// // //     );

// // //     res.status(200).json({
// // //       success: true,
// // //       message: 'Experience added successfully',
// // //       data: profile.experience
// // //     });
// // //   } catch (error) {
// // //     console.error('Add experience error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Server error'
// // //     });
// // //   }
// // // };

// // // export const updateExperience = async (req, res) => {
// // //   try {
// // //     const userId = req.params.userId || req.user._id;
// // //     const { experienceId } = req.params;

// // //     const profile = await UserProfile.findOne({ userId });
// // //     if (!profile) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Profile not found'
// // //       });
// // //     }

// // //     const experienceIndex = profile.experience.findIndex(
// // //       exp => exp._id.toString() === experienceId
// // //     );

// // //     if (experienceIndex === -1) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Experience record not found'
// // //       });
// // //     }

// // //     profile.experience[experienceIndex] = {
// // //       ...profile.experience[experienceIndex].toObject(),
// // //       ...req.body
// // //     };

// // //     await profile.save();

// // //     res.status(200).json({
// // //       success: true,
// // //       message: 'Experience updated successfully',
// // //       data: profile.experience[experienceIndex]
// // //     });
// // //   } catch (error) {
// // //     console.error('Update experience error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Server error'
// // //     });
// // //   }
// // // };

// // // export const deleteExperience = async (req, res) => {
// // //   try {
// // //     const userId = req.params.userId || req.user._id;
// // //     const { experienceId } = req.params;

// // //     const profile = await UserProfile.findOneAndUpdate(
// // //       { userId },
// // //       { $pull: { experience: { _id: experienceId } } },
// // //       { new: true }
// // //     );

// // //     res.status(200).json({
// // //       success: true,
// // //       message: 'Experience deleted successfully',
// // //       data: profile?.experience || []
// // //     });
// // //   } catch (error) {
// // //     console.error('Delete experience error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Server error'
// // //     });
// // //   }
// // // };

// // // // Skills CRUD operations
// // // export const addSkill = async (req, res) => {
// // //   try {
// // //     const userId = req.params.userId || req.user._id;
    
// // //     const profile = await UserProfile.findOneAndUpdate(
// // //       { userId },
// // //       { $push: { skills: req.body } },
// // //       { new: true, upsert: true }
// // //     );

// // //     res.status(200).json({
// // //       success: true,
// // //       message: 'Skill added successfully',
// // //       data: profile.skills
// // //     });
// // //   } catch (error) {
// // //     console.error('Add skill error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Server error'
// // //     });
// // //   }
// // // };

// // // export const updateSkill = async (req, res) => {
// // //   try {
// // //     const userId = req.params.userId || req.user._id;
// // //     const { skillId } = req.params;

// // //     const profile = await UserProfile.findOne({ userId });
// // //     if (!profile) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Profile not found'
// // //       });
// // //     }

// // //     const skillIndex = profile.skills.findIndex(
// // //       skill => skill._id.toString() === skillId
// // //     );

// // //     if (skillIndex === -1) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Skill not found'
// // //       });
// // //     }

// // //     profile.skills[skillIndex] = {
// // //       ...profile.skills[skillIndex].toObject(),
// // //       ...req.body
// // //     };

// // //     await profile.save();

// // //     res.status(200).json({
// // //       success: true,
// // //       message: 'Skill updated successfully',
// // //       data: profile.skills[skillIndex]
// // //     });
// // //   } catch (error) {
// // //     console.error('Update skill error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Server error'
// // //     });
// // //   }
// // // };

// // // export const deleteSkill = async (req, res) => {
// // //   try {
// // //     const userId = req.params.userId || req.user._id;
// // //     const { skillId } = req.params;

// // //     const profile = await UserProfile.findOneAndUpdate(
// // //       { userId },
// // //       { $pull: { skills: { _id: skillId } } },
// // //       { new: true }
// // //     );

// // //     res.status(200).json({
// // //       success: true,
// // //       message: 'Skill deleted successfully',
// // //       data: profile?.skills || []
// // //     });
// // //   } catch (error) {
// // //     console.error('Delete skill error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Server error'
// // //     });
// // //   }
// // // };

// // // // Get all education for a user
// // // export const getAllEducation = async (req, res) => {
// // //   try {
// // //     const userId = req.params.userId || req.user._id;
    
// // //     const profile = await UserProfile.findOne({ userId })
// // //       .select('education');

// // //     res.status(200).json({
// // //       success: true,
// // //       data: profile?.education || []
// // //     });
// // //   } catch (error) {
// // //     console.error('Get education error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Server error'
// // //     });
// // //   }
// // // };

// // // // Get all experience for a user
// // // export const getAllExperience = async (req, res) => {
// // //   try {
// // //     const userId = req.params.userId || req.user._id;
    
// // //     const profile = await UserProfile.findOne({ userId })
// // //       .select('experience');

// // //     res.status(200).json({
// // //       success: true,
// // //       data: profile?.experience || []
// // //     });
// // //   } catch (error) {
// // //     console.error('Get experience error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Server error'
// // //     });
// // //   }
// // // };

// // // // Get all skills for a user
// // // export const getAllSkills = async (req, res) => {
// // //   try {
// // //     const userId = req.params.userId || req.user._id;
    
// // //     const profile = await UserProfile.findOne({ userId })
// // //       .select('skills');

// // //     res.status(200).json({
// // //       success: true,
// // //       data: profile?.skills || []
// // //     });
// // //   } catch (error) {
// // //     console.error('Get skills error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Server error'
// // //     });
// // //   }
// // // };

// // import User from '../models/User.js';
// // import UserProfile from '../models/UserProfile.js';
// // import Salary from '../models/Salary.js';


// // // Get all users with basic info and salary
// // export const getAllUsers = async (req, res) => {
// //   try {
// //     const users = await User.find({ 
// //       role: 'user',
// //       isActive: true 
// //     })
// //     .select('_id email name department shifts createdAt')
// //     .sort('-createdAt');

// //     // Get salary info for each user
// //     const usersWithSalary = await Promise.all(
// //       users.map(async (user) => {
// //         const salary = await Salary.findOne({ 
// //           userId: user._id, 
// //           isActive: true 
// //         }).select('basicSalary currencyType');

// //         const profile = await UserProfile.findOne({ 
// //           userId: user._id 
// //         }).select('avatar position');

// //         return {
// //           _id: user._id,
// //           email: user.email,
// //           name: user.name,
// //           department: user.department,
// //           employeeId: user._id.toString().slice(-6),
// //           joinDate: user.createdAt,
// //           position: profile?.position || 'Not specified',
// //           avatar: profile?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
// //           basicSalary: salary?.basicSalary || 0,
// //           currency: salary?.currencyType || 'INR'
// //         };
// //       })
// //     );

// //     res.status(200).json({
// //       success: true,
// //       count: usersWithSalary.length,
// //       data: usersWithSalary
// //     });
// //   } catch (error) {
// //     console.error('Get all users error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };

// // // Get user profile
// // export const getUserProfile = async (req, res) => {
// //   try {
// //     const userId = req.params.userId || req.user._id;
    
// //     console.log('Fetching profile for user ID:', userId);
    
// //     const profile = await UserProfile.findOne({ userId })
// //       .populate('user', 'name email role department shifts');

// //     if (!profile) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Profile not found',
// //         data: null
// //       });
// //     }

// //     res.status(200).json({
// //       success: true,
// //       data: profile
// //     });
// //   } catch (error) {
// //     console.error('Get profile error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };

// // // Create or update user profile
// // export const updateProfile = async (req, res) => {
// //   try {
// //     const userId = req.params.userId || req.user._id;
// //     const updateData = { ...req.body };
    
// //     console.log('Updating profile for userId:', userId);
// //     console.log('Update data:', updateData);
    
// //     // Handle file uploads if present
// //     if (req.file) {
// //       console.log('File uploaded:', req.file.fieldname, req.file.filename);
      
// //       if (req.file.fieldname === 'avatar') {
// //         // Remove old avatar if exists
// //         const oldProfile = await UserProfile.findOne({ userId });
// //         if (oldProfile?.avatar && oldProfile.avatar !== 'https://api.dicebear.com/7.x/avataaars/svg?seed=User') {
// //           await removeOldFile(oldProfile.avatar);
// //         }
// //         updateData.avatar = `/uploads/${req.file.filename}`;
// //       } else if (req.file.fieldname === 'coverPhoto') {
// //         // Remove old cover photo if exists
// //         const oldProfile = await UserProfile.findOne({ userId });
// //         if (oldProfile?.coverPhoto) {
// //           await removeOldFile(oldProfile.coverPhoto);
// //         }
// //         updateData.coverPhoto = `/uploads/${req.file.filename}`;
// //       }
// //     }

// //     // Validate username uniqueness
// //     if (updateData.username) {
// //       const existingProfile = await UserProfile.findOne({
// //         username: updateData.username,
// //         userId: { $ne: userId }
// //       });
      
// //       if (existingProfile) {
// //         return res.status(400).json({
// //           success: false,
// //           message: 'Username already taken'
// //         });
// //       }
// //     }

// //     // Check if profile exists
// //     const existingProfile = await UserProfile.findOne({ userId });
    
// //     if (!existingProfile) {
// //       // Create new profile
// //       const newProfile = new UserProfile({
// //         userId,
// //         ...updateData,
// //         avatar: updateData.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'
// //       });
      
// //       const savedProfile = await newProfile.save();
// //       await savedProfile.populate('user', 'name email');
      
// //       return res.status(201).json({
// //         success: true,
// //         message: 'Profile created successfully',
// //         data: savedProfile
// //       });
// //     }

// //     // Update existing profile
// //     const profile = await UserProfile.findOneAndUpdate(
// //       { userId },
// //       updateData,
// //       { 
// //         new: true, 
// //         upsert: false,
// //         runValidators: true 
// //       }
// //     ).populate('user', 'name email');

// //     if (!profile) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Profile not found'
// //       });
// //     }

// //     res.status(200).json({
// //       success: true,
// //       message: 'Profile updated successfully',
// //       data: profile
// //     });
// //   } catch (error) {
// //     console.error('Update profile error:', error);
    
// //     if (error.name === 'ValidationError') {
// //       const messages = Object.values(error.errors).map(err => err.message);
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Validation error',
// //         errors: messages
// //       });
// //     }
    
// //     if (error.code === 11000) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Duplicate field value entered'
// //       });
// //     }
    
// //     res.status(500).json({
// //       success: false,
// //       message: error.message || 'Server error'
// //     });
// //   }
// // };

// // export const uploadAvatar = async (req, res) => {
// //   if (!req.file) {
// //     return res.status(400).json({ success: false, message: 'No file uploaded' });
// //   }

// //   const avatarUrl = `/uploads/profiles/${req.file.filename}`;

// //   const profile = await UserProfile.findOneAndUpdate(
// //     { userId: req.user._id },
// //     { avatar: avatarUrl },
// //     { new: true, upsert: true }
// //   );

// //   res.json({
// //     success: true,
// //     message: 'Avatar uploaded',
// //     fileUrl: avatarUrl,
// //     data: profile
// //   });
// // };

// // // DELETE AVATAR
// // export const deleteAvatar = async (req, res) => {
// //   const profile = await UserProfile.findOne({ userId: req.user._id });

// //   if (!profile?.avatar) {
// //     return res.status(404).json({ success: false, message: 'Avatar not found' });
// //   }

// //   const filePath = path.join(process.cwd(), 'public', profile.avatar);
// //   if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

// //   profile.avatar = null;
// //   await profile.save();

// //   res.json({ success: true, message: 'Avatar deleted' });
// // };

// // // UPLOAD COVER
// // export const uploadCover = async (req, res) => {
// //   if (!req.file) {
// //     return res.status(400).json({ success: false, message: 'No file uploaded' });
// //   }

// //   const coverUrl = `/uploads/profiles/${req.file.filename}`;

// //   const profile = await UserProfile.findOneAndUpdate(
// //     { userId: req.user._id },
// //     { coverPhoto: coverUrl },
// //     { new: true, upsert: true }
// //   );

// //   res.json({
// //     success: true,
// //     message: 'Cover uploaded',
// //     fileUrl: coverUrl,
// //     data: profile
// //   });
// // };

// // // Education CRUD operations
// // export const addEducation = async (req, res) => {
// //   try {
// //     const userId = req.params.userId || req.user._id;
    
// //     // Check if profile exists
// //     let profile = await UserProfile.findOne({ userId });
    
// //     if (!profile) {
// //       // Create new profile
// //       profile = new UserProfile({
// //         userId,
// //         education: [req.body]
// //       });
// //     } else {
// //       // Add education to existing profile
// //       profile.education.push(req.body);
// //     }
    
// //     await profile.save();
    
// //     res.status(200).json({
// //       success: true,
// //       message: 'Education added successfully',
// //       data: profile.education
// //     });
// //   } catch (error) {
// //     console.error('Add education error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };

// // export const updateEducation = async (req, res) => {
// //   try {
// //     const userId = req.params.userId || req.user._id;
// //     const { educationId } = req.params;

// //     const profile = await UserProfile.findOne({ userId });
// //     if (!profile) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Profile not found'
// //       });
// //     }

// //     const educationIndex = profile.education.findIndex(
// //       edu => edu._id.toString() === educationId
// //     );

// //     if (educationIndex === -1) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Education record not found'
// //       });
// //     }

// //     profile.education[educationIndex] = {
// //       ...profile.education[educationIndex].toObject(),
// //       ...req.body
// //     };

// //     await profile.save();

// //     res.status(200).json({
// //       success: true,
// //       message: 'Education updated successfully',
// //       data: profile.education[educationIndex]
// //     });
// //   } catch (error) {
// //     console.error('Update education error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };

// // export const deleteEducation = async (req, res) => {
// //   try {
// //     const userId = req.params.userId || req.user._id;
// //     const { educationId } = req.params;

// //     const profile = await UserProfile.findOneAndUpdate(
// //       { userId },
// //       { $pull: { education: { _id: educationId } } },
// //       { new: true }
// //     );

// //     res.status(200).json({
// //       success: true,
// //       message: 'Education deleted successfully',
// //       data: profile?.education || []
// //     });
// //   } catch (error) {
// //     console.error('Delete education error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };

// // // Experience CRUD operations
// // export const addExperience = async (req, res) => {
// //   try {
// //     const userId = req.params.userId || req.user._id;
    
// //     // Check if profile exists
// //     let profile = await UserProfile.findOne({ userId });
    
// //     if (!profile) {
// //       // Create new profile
// //       profile = new UserProfile({
// //         userId,
// //         experience: [req.body]
// //       });
// //     } else {
// //       // Add experience to existing profile
// //       profile.experience.push(req.body);
// //     }
    
// //     await profile.save();

// //     res.status(200).json({
// //       success: true,
// //       message: 'Experience added successfully',
// //       data: profile.experience
// //     });
// //   } catch (error) {
// //     console.error('Add experience error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };

// // export const updateExperience = async (req, res) => {
// //   try {
// //     const userId = req.params.userId || req.user._id;
// //     const { experienceId } = req.params;

// //     const profile = await UserProfile.findOne({ userId });
// //     if (!profile) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Profile not found'
// //       });
// //     }

// //     const experienceIndex = profile.experience.findIndex(
// //       exp => exp._id.toString() === experienceId
// //     );

// //     if (experienceIndex === -1) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Experience record not found'
// //       });
// //     }

// //     profile.experience[experienceIndex] = {
// //       ...profile.experience[experienceIndex].toObject(),
// //       ...req.body
// //     };

// //     await profile.save();

// //     res.status(200).json({
// //       success: true,
// //       message: 'Experience updated successfully',
// //       data: profile.experience[experienceIndex]
// //     });
// //   } catch (error) {
// //     console.error('Update experience error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };

// // export const deleteExperience = async (req, res) => {
// //   try {
// //     const userId = req.params.userId || req.user._id;
// //     const { experienceId } = req.params;

// //     const profile = await UserProfile.findOneAndUpdate(
// //       { userId },
// //       { $pull: { experience: { _id: experienceId } } },
// //       { new: true }
// //     );

// //     res.status(200).json({
// //       success: true,
// //       message: 'Experience deleted successfully',
// //       data: profile?.experience || []
// //     });
// //   } catch (error) {
// //     console.error('Delete experience error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };

// // // Skills CRUD operations
// // export const addSkill = async (req, res) => {
// //   try {
// //     const userId = req.params.userId || req.user._id;
    
// //     // Check if profile exists
// //     let profile = await UserProfile.findOne({ userId });
    
// //     if (!profile) {
// //       // Create new profile
// //       profile = new UserProfile({
// //         userId,
// //         skills: [req.body]
// //       });
// //     } else {
// //       // Add skill to existing profile
// //       profile.skills.push(req.body);
// //     }
    
// //     await profile.save();

// //     res.status(200).json({
// //       success: true,
// //       message: 'Skill added successfully',
// //       data: profile.skills
// //     });
// //   } catch (error) {
// //     console.error('Add skill error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };

// // export const updateSkill = async (req, res) => {
// //   try {
// //     const userId = req.params.userId || req.user._id;
// //     const { skillId } = req.params;

// //     const profile = await UserProfile.findOne({ userId });
// //     if (!profile) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Profile not found'
// //       });
// //     }

// //     const skillIndex = profile.skills.findIndex(
// //       skill => skill._id.toString() === skillId
// //     );

// //     if (skillIndex === -1) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Skill not found'
// //       });
// //     }

// //     profile.skills[skillIndex] = {
// //       ...profile.skills[skillIndex].toObject(),
// //       ...req.body
// //     };

// //     await profile.save();

// //     res.status(200).json({
// //       success: true,
// //       message: 'Skill updated successfully',
// //       data: profile.skills[skillIndex]
// //     });
// //   } catch (error) {
// //     console.error('Update skill error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };

// // export const deleteSkill = async (req, res) => {
// //   try {
// //     const userId = req.params.userId || req.user._id;
// //     const { skillId } = req.params;

// //     const profile = await UserProfile.findOneAndUpdate(
// //       { userId },
// //       { $pull: { skills: { _id: skillId } } },
// //       { new: true }
// //     );

// //     res.status(200).json({
// //       success: true,
// //       message: 'Skill deleted successfully',
// //       data: profile?.skills || []
// //     });
// //   } catch (error) {
// //     console.error('Delete skill error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };

// // // Get all education for a user
// // export const getAllEducation = async (req, res) => {
// //   try {
// //     const userId = req.params.userId || req.user._id;
    
// //     const profile = await UserProfile.findOne({ userId })
// //       .select('education');

// //     if (!profile) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Profile not found',
// //         data: []
// //       });
// //     }

// //     res.status(200).json({
// //       success: true,
// //       data: profile.education || []
// //     });
// //   } catch (error) {
// //     console.error('Get education error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };

// // // Get all experience for a user
// // export const getAllExperience = async (req, res) => {
// //   try {
// //     const userId = req.params.userId || req.user._id;
    
// //     const profile = await UserProfile.findOne({ userId })
// //       .select('experience');

// //     if (!profile) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Profile not found',
// //         data: []
// //       });
// //     }

// //     res.status(200).json({
// //       success: true,
// //       data: profile.experience || []
// //     });
// //   } catch (error) {
// //     console.error('Get experience error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };

// // // Get all skills for a user
// // export const getAllSkills = async (req, res) => {
// //   try {
// //     const userId = req.params.userId || req.user._id;
    
// //     const profile = await UserProfile.findOne({ userId })
// //       .select('skills');

// //     if (!profile) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Profile not found',
// //         data: []
// //       });
// //     }

// //     res.status(200).json({
// //       success: true,
// //       data: profile.skills || []
// //     });
// //   } catch (error) {
// //     console.error('Get skills error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error'
// //     });
// //   }
// // };

// import User from '../models/User.js';
// import UserProfile from '../models/UserProfile.js';
// import Salary from '../models/Salary.js';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Helper function to delete old file
// const deleteOldFile = (filePath) => {
//   try {
//     if (!filePath) return;
    
//     // If it's a URL from dicebear or external URL, don't delete
//     if (filePath.includes('dicebear.com') || filePath.startsWith('http')) {
//       return;
//     }
    
//     // Remove leading slash if present
//     let relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    
//     // Construct full path - relative to project root
//     const projectRoot = path.join(__dirname, '..', '..');
//     const fullPath = path.join(projectRoot, 'public', relativePath);
    
//     if (fs.existsSync(fullPath)) {
//       fs.unlinkSync(fullPath);
//       console.log(`Deleted old file: ${fullPath}`);
//     } else {
//       console.log(`File not found for deletion: ${fullPath}`);
//     }
//   } catch (error) {
//     console.error('Error deleting file:', error.message);
//   }
// };

// // Upload avatar
// export const uploadAvatar = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'No file uploaded' 
//       });
//     }

//     const userId = req.params.userId || req.user._id;
    
//     // IMPORTANT: This URL must match the static file serving in app.js
//     const avatarUrl = `/uploads/profiles/${req.file.filename}`;
    
//     console.log('\n=== AVATAR UPLOAD DETAILS ===');
//     console.log('User ID:', userId);
//     console.log('File saved at:', req.file.path);
//     console.log('File URL to save in DB:', avatarUrl);
//     console.log('Expected access URL:', `http://localhost:${process.env.PORT || 5000}${avatarUrl}`);
    
//     // Verify file exists
//     if (!fs.existsSync(req.file.path)) {
//       throw new Error('File was not saved correctly');
//     }

//     // Remove old avatar if exists
//     const oldProfile = await UserProfile.findOne({ userId });
//     if (oldProfile?.avatar && !oldProfile.avatar.includes('dicebear.com')) {
//       deleteOldFile(oldProfile.avatar);
//     }

//     const profile = await UserProfile.findOneAndUpdate(
//       { userId },
//       { avatar: avatarUrl },
//       { new: true, upsert: true }
//     ).populate('user', 'name email');

//     res.json({
//       success: true,
//       message: 'Avatar uploaded successfully',
//       fileUrl: avatarUrl,
//       fullUrl: `${req.protocol}://${req.get('host')}${avatarUrl}`,
//       debug: {
//         fileSize: req.file.size,
//         fileName: req.file.filename,
//         fileExists: fs.existsSync(req.file.path)
//       },
//       data: profile
//     });
//   } catch (error) {
//     console.error('Upload avatar error:', error);
    
//     // Delete uploaded file if there's an error
//     if (req.file) {
//       deleteOldFile(`/uploads/profiles/${req.file.filename}`);
//     }
    
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // Upload cover photo
// export const uploadCover = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'No file uploaded' 
//       });
//     }

//     const userId = req.params.userId || req.user._id;
    
//     // IMPORTANT: This URL must match the static file serving in app.js
//     const coverUrl = `/uploads/profiles/${req.file.filename}`;
    
//     console.log('\n=== COVER PHOTO UPLOAD DETAILS ===');
//     console.log('User ID:', userId);
//     console.log('File saved at:', req.file.path);
//     console.log('File URL to save in DB:', coverUrl);
//     console.log('Expected access URL:', `http://localhost:${process.env.PORT || 5000}${coverUrl}`);
    
//     // Verify file exists
//     if (!fs.existsSync(req.file.path)) {
//       throw new Error('File was not saved correctly');
//     }

//     // Remove old cover if exists
//     const oldProfile = await UserProfile.findOne({ userId });
//     if (oldProfile?.coverPhoto) {
//       deleteOldFile(oldProfile.coverPhoto);
//     }

//     const profile = await UserProfile.findOneAndUpdate(
//       { userId },
//       { coverPhoto: coverUrl },
//       { new: true, upsert: true }
//     ).populate('user', 'name email');

//     res.json({
//       success: true,
//       message: 'Cover photo uploaded successfully',
//       fileUrl: coverUrl,
//       fullUrl: `${req.protocol}://${req.get('host')}${coverUrl}`,
//       debug: {
//         fileSize: req.file.size,
//         fileName: req.file.filename,
//         fileExists: fs.existsSync(req.file.path)
//       },
//       data: profile
//     });
//   } catch (error) {
//     console.error('Upload cover error:', error);
    
//     // Delete uploaded file if there's an error
//     if (req.file) {
//       deleteOldFile(`/uploads/profiles/${req.file.filename}`);
//     }
    
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // Delete avatar
// export const deleteAvatar = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;
    
//     const profile = await UserProfile.findOne({ userId });

//     if (!profile) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Profile not found' 
//       });
//     }

//     if (!profile?.avatar) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Avatar not found' 
//       });
//     }

//     // Don't delete dicebear default avatar
//     if (profile.avatar.includes('dicebear.com')) {
//       profile.avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
//       await profile.save();
      
//       return res.json({ 
//         success: true, 
//         message: 'Avatar reset to default' 
//       });
//     }

//     // Delete file from filesystem
//     deleteOldFile(profile.avatar);

//     // Update profile
//     profile.avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
//     await profile.save();

//     res.json({ 
//       success: true, 
//       message: 'Avatar deleted successfully' 
//     });
//   } catch (error) {
//     console.error('Delete avatar error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // Delete cover photo
// export const deleteCover = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;
    
//     const profile = await UserProfile.findOne({ userId });

//     if (!profile) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Profile not found' 
//       });
//     }

//     if (!profile?.coverPhoto) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Cover photo not found' 
//       });
//     }

//     // Delete file from filesystem
//     deleteOldFile(profile.coverPhoto);

//     // Update profile
//     profile.coverPhoto = null;
//     await profile.save();

//     res.json({ 
//       success: true, 
//       message: 'Cover photo deleted successfully' 
//     });
//   } catch (error) {
//     console.error('Delete cover error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // Get user profile
// export const getUserProfile = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;
    
//     console.log('\n=== FETCHING PROFILE ===');
//     console.log('User ID:', userId);
    
//     const [profile, salary] = await Promise.all([
//       UserProfile.findOne({ userId })
//         .populate('user', 'name email role department shifts company'),
//       Salary.findOne({ userId, isActive: true })
//     ]);

//     if (!profile) {
//       // Return empty profile if not found
//       const user = await User.findById(userId).select('name email role department shifts company');
//       return res.status(200).json({
//         success: true,
//         message: 'Profile not found, returning empty template',
//         data: {
//           userId: userId,
//           user: user,
//           avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
//           salary: salary || null,
//           education: [],
//           experience: [],
//           skills: []
//         }
//       });
//     }

//     const profileData = profile.toObject();
//     profileData.salary = salary || null;
    
//     // Debug file URLs
//     if (profileData.avatar && !profileData.avatar.includes('http')) {
//       console.log('Avatar URL in profile:', profileData.avatar);
//       console.log('Full avatar URL:', `${req.protocol}://${req.get('host')}${profileData.avatar}`);
//     }
//     if (profileData.coverPhoto) {
//       console.log('Cover URL in profile:', profileData.coverPhoto);
//       console.log('Full cover URL:', `${req.protocol}://${req.get('host')}${profileData.coverPhoto}`);
//     }

//     res.status(200).json({
//       success: true,
//       data: profileData
//     });
//   } catch (error) {
//     console.error('Get profile error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // Create or update user profile
// export const updateProfile = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;
//     const updateData = { ...req.body };
    
//     console.log('\n=== UPDATING PROFILE ===');
//     console.log('User ID:', userId);
    
//     // Handle file uploads if present
//     if (req.file) {
//       console.log('File uploaded:', req.file.fieldname, req.file.filename);
      
//       // Construct correct file URL
//       const fileUrl = `/uploads/profiles/${req.file.filename}`;
      
//       if (req.file.fieldname === 'avatar') {
//         // Remove old avatar if exists
//         const oldProfile = await UserProfile.findOne({ userId });
//         if (oldProfile?.avatar && !oldProfile.avatar.includes('dicebear.com')) {
//           deleteOldFile(oldProfile.avatar);
//         }
//         updateData.avatar = fileUrl;
//       } else if (req.file.fieldname === 'coverPhoto') {
//         // Remove old cover photo if exists
//         const oldProfile = await UserProfile.findOne({ userId });
//         if (oldProfile?.coverPhoto) {
//           deleteOldFile(oldProfile.coverPhoto);
//         }
//         updateData.coverPhoto = fileUrl;
//       }
//     }

//     // Validate username uniqueness
//     if (updateData.username) {
//       const existingProfile = await UserProfile.findOne({
//         username: updateData.username,
//         userId: { $ne: userId }
//       });
      
//       if (existingProfile) {
//         // Delete uploaded file if username is duplicate
//         if (req.file) {
//           deleteOldFile(`/uploads/profiles/${req.file.filename}`);
//         }
        
//         return res.status(400).json({
//           success: false,
//           message: 'Username already taken'
//         });
//       }
//     }

//     // Check if profile exists
//     const existingProfile = await UserProfile.findOne({ userId });
    
//     if (!existingProfile) {
//       // Create new profile
//       const newProfile = new UserProfile({
//         userId,
//         ...updateData,
//         avatar: updateData.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'
//       });
      
//       const savedProfile = await newProfile.save();
//       await savedProfile.populate('user', 'name email role department shifts company');
      
//       return res.status(201).json({
//         success: true,
//         message: 'Profile created successfully',
//         data: savedProfile
//       });
//     }

//     // Update existing profile
//     const profile = await UserProfile.findOneAndUpdate(
//       { userId },
//       updateData,
//       { 
//         new: true, 
//         upsert: false,
//         runValidators: true 
//       }
//     ).populate('user', 'name email role department shifts company');

//     if (!profile) {
//       return res.status(404).json({
//         success: false,
//         message: 'Profile not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Profile updated successfully',
//       data: profile
//     });
//   } catch (error) {
//     console.error('Update profile error:', error);
    
//     // Delete uploaded file if there's an error
//     if (req.file) {
//       deleteOldFile(`/uploads/profiles/${req.file.filename}`);
//     }
    
//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({
//         success: false,
//         message: 'Validation error',
//         errors: messages
//       });
//     }
    
//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: 'Duplicate field value entered'
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Server error'
//     });
//   }
// };

// // Get all users with profiles (Admin only)
// export const getAllUsersWithProfiles = async (req, res) => {
//   try {
//     const users = await User.find({ 
//       role: 'user',
//       isActive: true 
//     })
//     .select('_id email name department shifts createdAt company')
//     .sort('-createdAt');

//     // Get profiles and salary info for each user
//     const usersWithDetails = await Promise.all(
//       users.map(async (user) => {
//         const [profile, salary] = await Promise.all([
//           UserProfile.findOne({ userId: user._id }),
//           Salary.findOne({ userId: user._id, isActive: true })
//         ]);

//         return {
//           _id: user._id,
//           email: user.email,
//           name: user.name,
//           department: user.department,
//           company: user.company,
//           employeeId: user._id.toString().slice(-6),
//           joinDate: user.createdAt,
//           shift: user.shifts,
//           position: profile?.position || 'Not specified',
//           avatar: profile?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
//           phone: profile?.phone || 'Not provided',
//           address: profile?.address || 'Not provided',
//           basicSalary: salary?.basicSalary || 0,
//           netSalary: salary?.netSalary || 0,
//           currency: salary?.currencyType || 'INR',
//           profileExists: !!profile,
//           salaryExists: !!salary
//         };
//       })
//     );

//     res.status(200).json({
//       success: true,
//       count: usersWithDetails.length,
//       data: usersWithDetails
//     });
//   } catch (error) {
//     console.error('Get all users with profiles error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // Get all user profiles by admin ID
// export const getUserProfilesByAdminId = async (req, res) => {
//   try {
//     const adminId = req.params.adminId || req.user._id;
    
//     // First get all users managed by this admin
//     const managedUsers = await User.find({
//       $or: [
//         { adminId: adminId },
//         { createdBy: adminId }
//       ],
//       role: 'user',
//       isActive: true
//     }).select('_id email name department shifts company createdAt');

//     // Get profiles for all managed users
//     const userIds = managedUsers.map(user => user._id);
//     const profiles = await UserProfile.find({ userId: { $in: userIds } });
//     const salaries = await Salary.find({ 
//       userId: { $in: userIds },
//       isActive: true 
//     });

//     // Combine data
//     const usersWithProfiles = managedUsers.map(user => {
//       const profile = profiles.find(p => p.userId.equals(user._id));
//       const salary = salaries.find(s => s.userId.equals(user._id));
      
//       return {
//         _id: user._id,
//         email: user.email,
//         name: user.name,
//         department: user.department,
//         company: user.company,
//         shift: user.shifts,
//         joinDate: user.createdAt,
//         position: profile?.position || 'Not specified',
//         avatar: profile?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
//         phone: profile?.phone || 'Not provided',
//         address: profile?.address || 'Not provided',
//         basicSalary: salary?.basicSalary || 0,
//         netSalary: salary?.netSalary || 0,
//         currency: salary?.currencyType || 'INR',
//         profileId: profile?._id,
//         salaryId: salary?._id,
//         hasProfile: !!profile,
//         hasSalary: !!salary
//       };
//     });

//     res.status(200).json({
//       success: true,
//       count: usersWithProfiles.length,
//       data: usersWithProfiles
//     });
//   } catch (error) {
//     console.error('Get user profiles by admin ID error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // Delete user profile (Admin only)
// export const deleteUserProfile = async (req, res) => {
//   try {
//     const userId = req.params.userId;
    
//     // Check if user exists
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // Check if profile exists
//     const profile = await UserProfile.findOne({ userId });
    
//     if (!profile) {
//       return res.status(404).json({
//         success: false,
//         message: 'Profile not found'
//       });
//     }

//     // Delete avatar and cover photo files
//     if (profile.avatar && !profile.avatar.includes('dicebear.com')) {
//       deleteOldFile(profile.avatar);
//     }
    
//     if (profile.coverPhoto) {
//       deleteOldFile(profile.coverPhoto);
//     }

//     // Delete the profile
//     await UserProfile.deleteOne({ userId });

//     res.status(200).json({
//       success: true,
//       message: 'User profile deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete user profile error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // Delete user completely (Admin only)
// export const deleteUser = async (req, res) => {
//   try {
//     const userId = req.params.userId;
    
//     // Check if user exists
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // Prevent deletion of admin users by non-super admins
//     if (user.role !== 'user' && req.user.role !== 'super_admin') {
//       return res.status(403).json({
//         success: false,
//         message: 'Only super admin can delete admin users'
//       });
//     }

//     // Find and delete profile
//     const profile = await UserProfile.findOne({ userId });
    
//     if (profile) {
//       // Delete avatar and cover photo files
//       if (profile.avatar && !profile.avatar.includes('dicebear.com')) {
//         deleteOldFile(profile.avatar);
//       }
      
//       if (profile.coverPhoto) {
//         deleteOldFile(profile.coverPhoto);
//       }
      
//       // Delete the profile
//       await UserProfile.deleteOne({ userId });
//     }

//     // Delete salary records
//     await Salary.deleteMany({ userId });

//     // Soft delete the user (set isActive to false)
//     user.isActive = false;
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: 'User deleted successfully',
//       userId: userId
//     });
//   } catch (error) {
//     console.error('Delete user error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // Education CRUD operations
// export const addEducation = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;
    
//     let profile = await UserProfile.findOne({ userId });
    
//     if (!profile) {
//       profile = new UserProfile({
//         userId,
//         education: [req.body]
//       });
//     } else {
//       profile.education.push(req.body);
//     }
    
//     await profile.save();
    
//     res.status(200).json({
//       success: true,
//       message: 'Education added successfully',
//       data: profile.education
//     });
//   } catch (error) {
//     console.error('Add education error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// export const updateEducation = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;
//     const { educationId } = req.params;

//     const profile = await UserProfile.findOne({ userId });
//     if (!profile) {
//       return res.status(404).json({
//         success: false,
//         message: 'Profile not found'
//       });
//     }

//     const educationIndex = profile.education.findIndex(
//       edu => edu._id.toString() === educationId
//     );

//     if (educationIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         message: 'Education record not found'
//       });
//     }

//     profile.education[educationIndex] = {
//       ...profile.education[educationIndex].toObject(),
//       ...req.body
//     };

//     await profile.save();

//     res.status(200).json({
//       success: true,
//       message: 'Education updated successfully',
//       data: profile.education[educationIndex]
//     });
//   } catch (error) {
//     console.error('Update education error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// export const deleteEducation = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;
//     const { educationId } = req.params;

//     const profile = await UserProfile.findOneAndUpdate(
//       { userId },
//       { $pull: { education: { _id: educationId } } },
//       { new: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Education deleted successfully',
//       data: profile?.education || []
//     });
//   } catch (error) {
//     console.error('Delete education error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // Experience CRUD operations
// export const addExperience = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;
    
//     let profile = await UserProfile.findOne({ userId });
    
//     if (!profile) {
//       profile = new UserProfile({
//         userId,
//         experience: [req.body]
//       });
//     } else {
//       profile.experience.push(req.body);
//     }
    
//     await profile.save();

//     res.status(200).json({
//       success: true,
//       message: 'Experience added successfully',
//       data: profile.experience
//     });
//   } catch (error) {
//     console.error('Add experience error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// export const updateExperience = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;
//     const { experienceId } = req.params;

//     const profile = await UserProfile.findOne({ userId });
//     if (!profile) {
//       return res.status(404).json({
//         success: false,
//         message: 'Profile not found'
//       });
//     }

//     const experienceIndex = profile.experience.findIndex(
//       exp => exp._id.toString() === experienceId
//     );

//     if (experienceIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         message: 'Experience record not found'
//       });
//     }

//     profile.experience[experienceIndex] = {
//       ...profile.experience[experienceIndex].toObject(),
//       ...req.body
//     };

//     await profile.save();

//     res.status(200).json({
//       success: true,
//       message: 'Experience updated successfully',
//       data: profile.experience[experienceIndex]
//     });
//   } catch (error) {
//     console.error('Update experience error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// export const deleteExperience = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;
//     const { experienceId } = req.params;

//     const profile = await UserProfile.findOneAndUpdate(
//       { userId },
//       { $pull: { experience: { _id: experienceId } } },
//       { new: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Experience deleted successfully',
//       data: profile?.experience || []
//     });
//   } catch (error) {
//     console.error('Delete experience error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // Skills CRUD operations
// export const addSkill = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;
    
//     let profile = await UserProfile.findOne({ userId });
    
//     if (!profile) {
//       profile = new UserProfile({
//         userId,
//         skills: [req.body]
//       });
//     } else {
//       profile.skills.push(req.body);
//     }
    
//     await profile.save();

//     res.status(200).json({
//       success: true,
//       message: 'Skill added successfully',
//       data: profile.skills
//     });
//   } catch (error) {
//     console.error('Add skill error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// export const updateSkill = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;
//     const { skillId } = req.params;

//     const profile = await UserProfile.findOne({ userId });
//     if (!profile) {
//       return res.status(404).json({
//         success: false,
//         message: 'Profile not found'
//       });
//     }

//     const skillIndex = profile.skills.findIndex(
//       skill => skill._id.toString() === skillId
//     );

//     if (skillIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         message: 'Skill not found'
//       });
//     }

//     profile.skills[skillIndex] = {
//       ...profile.skills[skillIndex].toObject(),
//       ...req.body
//     };

//     await profile.save();

//     res.status(200).json({
//       success: true,
//       message: 'Skill updated successfully',
//       data: profile.skills[skillIndex]
//     });
//   } catch (error) {
//     console.error('Update skill error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// export const deleteSkill = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;
//     const { skillId } = req.params;

//     const profile = await UserProfile.findOneAndUpdate(
//       { userId },
//       { $pull: { skills: { _id: skillId } } },
//       { new: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Skill deleted successfully',
//       data: profile?.skills || []
//     });
//   } catch (error) {
//     console.error('Delete skill error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // Get all education for a user
// export const getAllEducation = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;
    
//     const profile = await UserProfile.findOne({ userId })
//       .select('education');

//     if (!profile) {
//       return res.status(200).json({
//         success: true,
//         message: 'Profile not found, returning empty education',
//         data: []
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: profile.education || []
//     });
//   } catch (error) {
//     console.error('Get education error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // Get all experience for a user
// export const getAllExperience = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;
    
//     const profile = await UserProfile.findOne({ userId })
//       .select('experience');

//     if (!profile) {
//       return res.status(200).json({
//         success: true,
//         message: 'Profile not found, returning empty experience',
//         data: []
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: profile.experience || []
//     });
//   } catch (error) {
//     console.error('Get experience error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // Get all skills for a user
// export const getAllSkills = async (req, res) => {
//   try {
//     const userId = req.params.userId || req.user._id;
    
//     const profile = await UserProfile.findOne({ userId })
//       .select('skills');

//     if (!profile) {
//       return res.status(200).json({
//         success: true,
//         message: 'Profile not found, returning empty skills',
//         data: []
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: profile.skills || []
//     });
//   } catch (error) {
//     console.error('Get skills error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// controllers/profileController.js
import User from '../models/User.js';
import UserProfile from '../models/UserProfile.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to delete old file
const deleteOldFile = (filePath) => {
  try {
    if (!filePath) return;
    
    // Skip external URLs
    if (filePath.includes('dicebear.com') || filePath.startsWith('http')) {
      return;
    }
    
    // Remove leading slash
    const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const fullPath = path.join(process.cwd(), 'public', relativePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('✓ Deleted old file:', path.basename(fullPath));
    }
  } catch (error) {
    console.error('Error deleting file:', error.message);
  }
};

// ==================== GET USER PROFILE ====================
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('📋 Fetching profile for user:', userId);
    
    const profile = await UserProfile.findOne({ userId })
      .populate('user', 'name email role department shifts company');

    if (!profile) {
      // Return basic user info if no profile exists
      const user = await User.findById(userId).select('name email role department shifts company');
      return res.json({
        success: true,
        message: 'Profile not found, returning basic info',
        data: {
          userId,
          user,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
          education: [],
          experience: [],
          skills: []
        }
      });
    }

    console.log('✅ Profile found for user:', userId);
    
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: profile
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== UPLOAD COVER PHOTO ====================
export const uploadCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const userId = req.user._id;
    const coverUrl = `/uploads/profiles/${req.file.filename}`;

    console.log('\n📤 COVER PHOTO UPLOAD:');
    console.log('User ID:', userId);
    console.log('File saved as:', req.file.filename);
    console.log('File path:', req.file.path);
    console.log('Cover URL to save:', coverUrl);

    // Verify file was saved
    if (!fs.existsSync(req.file.path)) {
      throw new Error('File was not saved correctly');
    }

    console.log('✓ File exists on disk');

    // Find or create profile
    let profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      console.log('Creating new profile for user');
      profile = new UserProfile({
        userId,
        coverPhoto: coverUrl
      });
    } else {
      // Delete old cover if exists
      if (profile.coverPhoto) {
        console.log('Deleting old cover:', profile.coverPhoto);
        deleteOldFile(profile.coverPhoto);
      }
      profile.coverPhoto = coverUrl;
    }

    await profile.save();
    console.log('✓ Profile saved to database');
    
    // Populate user data
    await profile.populate('user', 'name email');

    res.json({
      success: true,
      message: 'Cover photo uploaded successfully',
      fileUrl: coverUrl,
      fullUrl: `${req.protocol}://${req.get('host')}${coverUrl}`,
      data: profile
    });
  } catch (error) {
    console.error('❌ Upload cover error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('Cleaned up failed upload file');
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== DELETE COVER PHOTO ====================
export const deleteCover = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('\n🗑️ DELETING COVER PHOTO:');
    console.log('User ID:', userId);

    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }

    if (!profile.coverPhoto) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cover photo not found' 
      });
    }

    console.log('Found cover photo:', profile.coverPhoto);

    // Delete file from filesystem
    deleteOldFile(profile.coverPhoto);

    // Remove cover photo from profile
    profile.coverPhoto = null;
    await profile.save();

    console.log('✓ Cover photo deleted from database');

    res.json({ 
      success: true, 
      message: 'Cover photo deleted successfully',
      data: profile
    });
  } catch (error) {
    console.error('❌ Delete cover error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== UPLOAD AVATAR ====================
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const userId = req.user._id;
    const avatarUrl = `/uploads/profiles/${req.file.filename}`;

    console.log('\n📤 AVATAR UPLOAD:');
    console.log('User ID:', userId);
    console.log('File saved as:', req.file.filename);
    console.log('Avatar URL to save:', avatarUrl);

    // Verify file was saved
    if (!fs.existsSync(req.file.path)) {
      throw new Error('File was not saved correctly');
    }

    console.log('✓ File exists on disk');

    // Find or create profile
    let profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      console.log('Creating new profile for user');
      profile = new UserProfile({
        userId,
        avatar: avatarUrl
      });
    } else {
      // Delete old avatar if exists (and not default dicebear)
      if (profile.avatar && !profile.avatar.includes('dicebear.com')) {
        console.log('Deleting old avatar:', profile.avatar);
        deleteOldFile(profile.avatar);
      }
      profile.avatar = avatarUrl;
    }

    await profile.save();
    console.log('✓ Profile saved to database');
    
    // Populate user data
    await profile.populate('user', 'name email');

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      fileUrl: avatarUrl,
      fullUrl: `${req.protocol}://${req.get('host')}${avatarUrl}`,
      data: profile
    });
  } catch (error) {
    console.error('❌ Upload avatar error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('Cleaned up failed upload file');
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== DELETE AVATAR ====================
export const deleteAvatar = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('\n🗑️ DELETING AVATAR:');
    console.log('User ID:', userId);

    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }

    if (!profile.avatar) {
      return res.status(404).json({ 
        success: false, 
        message: 'Avatar not found' 
      });
    }

    console.log('Found avatar:', profile.avatar);

    // Delete file from filesystem (if not default dicebear)
    if (!profile.avatar.includes('dicebear.com')) {
      deleteOldFile(profile.avatar);
    }

    // Reset to default avatar
    profile.avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
    await profile.save();

    console.log('✓ Avatar reset to default');

    res.json({ 
      success: true, 
      message: 'Avatar deleted successfully',
      data: profile
    });
  } catch (error) {
    console.error('❌ Delete avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== UPDATE PROFILE ====================
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    console.log('\n✏️ UPDATING PROFILE:');
    console.log('User ID:', userId);
    console.log('Update data:', updateData);

    let profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      console.log('Creating new profile');
      profile = new UserProfile({
        userId,
        ...updateData
      });
    } else {
      console.log('Updating existing profile');
      Object.keys(updateData).forEach(key => {
        profile[key] = updateData[key];
      });
    }

    await profile.save();
    console.log('✓ Profile saved');
    
    await profile.populate('user', 'name email role department shifts company');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== GET ALL USERS WITH PROFILES (ADMIN) ====================
export const getAllUsersWithProfiles = async (req, res) => {
  try {
    console.log('\n👥 GETTING ALL USERS WITH PROFILES');
    
    const users = await User.find({ 
      role: 'user',
      isActive: true 
    }).select('_id email name department shifts company createdAt')
      .sort('-createdAt');

    console.log(`Found ${users.length} active users`);

    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        const profile = await UserProfile.findOne({ userId: user._id });
        
        return {
          _id: user._id,
          email: user.email,
          name: user.name,
          department: user.department,
          company: user.company,
          shift: user.shifts,
          joinDate: user.createdAt,
          position: profile?.position || 'Not specified',
          avatar: profile?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
          phone: profile?.phone || 'Not provided',
          address: profile?.address || 'Not provided',
          profileExists: !!profile
        };
      })
    );

    res.json({
      success: true,
      count: usersWithProfiles.length,
      data: usersWithProfiles
    });
  } catch (error) {
    console.error('❌ Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== EDUCATION CRUD ====================
export const addEducation = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      profile = new UserProfile({
        userId,
        education: [req.body]
      });
    } else {
      profile.education.push(req.body);
    }
    
    await profile.save();
    
    res.json({
      success: true,
      message: 'Education added successfully',
      data: profile.education
    });
  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateEducation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { educationId } = req.params;

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const educationIndex = profile.education.findIndex(
      edu => edu._id.toString() === educationId
    );

    if (educationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Education record not found'
      });
    }

    profile.education[educationIndex] = {
      ...profile.education[educationIndex].toObject(),
      ...req.body
    };

    await profile.save();

    res.json({
      success: true,
      message: 'Education updated successfully',
      data: profile.education[educationIndex]
    });
  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const deleteEducation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { educationId } = req.params;

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $pull: { education: { _id: educationId } } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Education deleted successfully',
      data: profile?.education || []
    });
  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== EXPERIENCE CRUD ====================
export const addExperience = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      profile = new UserProfile({
        userId,
        experience: [req.body]
      });
    } else {
      profile.experience.push(req.body);
    }
    
    await profile.save();

    res.json({
      success: true,
      message: 'Experience added successfully',
      data: profile.experience
    });
  } catch (error) {
    console.error('Add experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateExperience = async (req, res) => {
  try {
    const userId = req.user._id;
    const { experienceId } = req.params;

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const experienceIndex = profile.experience.findIndex(
      exp => exp._id.toString() === experienceId
    );

    if (experienceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Experience record not found'
      });
    }

    profile.experience[experienceIndex] = {
      ...profile.experience[experienceIndex].toObject(),
      ...req.body
    };

    await profile.save();

    res.json({
      success: true,
      message: 'Experience updated successfully',
      data: profile.experience[experienceIndex]
    });
  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const deleteExperience = async (req, res) => {
  try {
    const userId = req.user._id;
    const { experienceId } = req.params;

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $pull: { experience: { _id: experienceId } } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Experience deleted successfully',
      data: profile?.experience || []
    });
  } catch (error) {
    console.error('Delete experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== SKILLS CRUD ====================
export const addSkill = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      profile = new UserProfile({
        userId,
        skills: [req.body]
      });
    } else {
      profile.skills.push(req.body);
    }
    
    await profile.save();

    res.json({
      success: true,
      message: 'Skill added successfully',
      data: profile.skills
    });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateSkill = async (req, res) => {
  try {
    const userId = req.user._id;
    const { skillId } = req.params;

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const skillIndex = profile.skills.findIndex(
      skill => skill._id.toString() === skillId
    );

    if (skillIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    profile.skills[skillIndex] = {
      ...profile.skills[skillIndex].toObject(),
      ...req.body
    };

    await profile.save();

    res.json({
      success: true,
      message: 'Skill updated successfully',
      data: profile.skills[skillIndex]
    });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const deleteSkill = async (req, res) => {
  try {
    const userId = req.user._id;
    const { skillId } = req.params;

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $pull: { skills: { _id: skillId } } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Skill deleted successfully',
      data: profile?.skills || []
    });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== GET ALL EDUCATION ====================
export const getAllEducation = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const profile = await UserProfile.findOne({ userId })
      .select('education');

    if (!profile) {
      return res.json({
        success: true,
        data: []
      });
    }

    res.json({
      success: true,
      data: profile.education || []
    });
  } catch (error) {
    console.error('Get education error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== GET ALL EXPERIENCE ====================
export const getAllExperience = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const profile = await UserProfile.findOne({ userId })
      .select('experience');

    if (!profile) {
      return res.json({
        success: true,
        data: []
      });
    }

    res.json({
      success: true,
      data: profile.experience || []
    });
  } catch (error) {
    console.error('Get experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== GET ALL SKILLS ====================
export const getAllSkills = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const profile = await UserProfile.findOne({ userId })
      .select('skills');

    if (!profile) {
      return res.json({
        success: true,
        data: []
      });
    }

    res.json({
      success: true,
      data: profile.skills || []
    });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getAllUserProfilesByAdmin = async (req, res) => {
  try {
    const adminId = req.user._id;

    const profiles = await UserProfile.getProfilesByAdmin(adminId);

    res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles
    });

  } catch (error) {
    console.error("Error fetching profiles:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
