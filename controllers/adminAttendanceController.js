
import User from "../models/User.js";
import Salary from "../models/Salary.js";
import Attendance from "../models/Attendance.js";
import { startOfDay, endOfDay, differenceInMinutes } from "date-fns";

/* =========================
   Get All Attendance by Admin ID - FIXED VERSION
   GET /api/attendance/admin/my-users
   Private (Admin only)
========================= */
export const getAttendanceByAdminId = async (req, res) => {
  try {
    console.log("User making request:", {
      userId: req.user._id,
      role: req.user.role,
      email: req.user.email
    });

    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const {
      userId,
      fromDate,
      toDate,
      status,
      department,
      page = 1,
      limit = 30,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    console.log("Query parameters:", {
      userId,
      fromDate,
      toDate,
      status,
      department,
      page,
      limit
    });

    // Get all users managed by this admin
    let managedUsers;
    if (req.user.role === "super_admin") {
      // Super admin can see all users
      console.log("Super admin: Fetching all users");
      managedUsers = await User.find({ role: "user" }).select("_id name email department shifts adminId createdBy");
    } else {
      // Regular admin can see users they created OR users assigned to them
      console.log("Regular admin: Fetching users created by or assigned to:", req.user._id);
      managedUsers = await User.find({
        role: "user",
        $or: [
          { adminId: req.user._id },
          { createdBy: req.user._id }
        ]
      }).select("_id name email department shifts adminId createdBy");
    }
    
    console.log("Managed users found:", managedUsers.length);
    console.log("Managed users details:", managedUsers.map(u => ({
      id: u._id,
      name: u.name,
      adminId: u.adminId,
      createdBy: u.createdBy
    })));

    if (managedUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users found under your management",
        data: {
          attendance: [],
          managedUsers: [],
          pagination: {
            total: 0,
            pages: 0,
            page: 1,
            limit: parseInt(limit),
          },
          statistics: {},
        },
      });
    }

    // Build query - Find attendance for managed users
    const query = {
      userId: { $in: managedUsers.map(user => user._id) }
    };

    console.log("Initial attendance query:", query);

    // Filter by specific user
    if (userId) {
      // Verify this user is managed by the admin
      const userExists = managedUsers.find(u => u._id.toString() === userId);
      if (!userExists && req.user.role !== "super_admin") {
        return res.status(403).json({
          success: false,
          message: "You can only view attendance for your managed users",
        });
      }
      query.userId = userId;
    }

    // Filter by department
    if (department) {
      const usersInDept = managedUsers.filter(u => u.department === department);
      if (usersInDept.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No users found in this department",
          data: {
            attendance: [],
            managedUsers: [],
            pagination: {
              total: 0,
              pages: 0,
              page: 1,
              limit: parseInt(limit),
            },
            statistics: {},
          },
        });
      }
      query.userId = { $in: usersInDept.map(u => u._id) };
    }

    // Filter by date range
    if (fromDate && toDate) {
      query.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
      console.log("Date range filter:", query.date);
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    console.log("Final query:", JSON.stringify(query, null, 2));

    // Pagination and sorting
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Get total count
    const total = await Attendance.countDocuments(query);
    console.log("Total records found:", total);

    // Get paginated data with user population
    const attendance = await Attendance.find(query)
      .populate({
        path: "userId",
        select: "name email department shifts adminId createdBy",
      })
      .populate({
        path: "createdBy",
        select: "name email",
      })
      .populate({
        path: "adminId",
        select: "name email",
      })
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    console.log("Attendance records fetched:", attendance.length);

    // Calculate statistics if we have data
    let statistics = {};
    if (attendance.length > 0) {
      statistics = await calculateAdminAttendanceStats(query, managedUsers);
    }

    // Get salary info for earnings calculation
    const salaryRecords = await Salary.find({
      userId: { $in: managedUsers.map(u => u._id) },
    });

    // Calculate total earnings
    let totalEarnings = 0;
    attendance.forEach((record) => {
      const userSalary = salaryRecords.find(s => 
        s.userId && record.userId && 
        s.userId.toString() === record.userId._id.toString()
      );
      if (userSalary && record.workingHours) {
        const hourlyRate = userSalary.baseSalary / (userSalary.workingDaysPerWeek * 4 * userSalary.workingHoursPerDay);
        totalEarnings += (record.workingHours * hourlyRate) + 
                        (record.overtimeHours * hourlyRate * userSalary.overtimeRate);
      }
    });

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: {
        attendance: attendance.map(record => ({
          ...record.toObject(),
          userId: record.userId ? {
            _id: record.userId._id,
            name: record.userId.name,
            email: record.userId.email,
            department: record.userId.department,
            shifts: record.userId.shifts,
            adminId: record.userId.adminId,
            createdBy: record.userId.createdBy
          } : null,
          createdBy: record.createdBy ? {
            _id: record.createdBy._id,
            name: record.createdBy.name,
            email: record.createdBy.email
          } : null,
          adminId: record.adminId ? {
            _id: record.adminId._id,
            name: record.adminId.name,
            email: record.adminId.email
          } : null
        })),
        managedUsers: managedUsers.map(user => ({
          _id: user._id,
          name: user.name,
          email: user.email,
          department: user.department,
          shifts: user.shifts,
          adminId: user.adminId,
          createdBy: user.createdBy
        })),
        pagination: {
          total,
          pages: totalPages,
          page: pageNum,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        statistics: {
          ...statistics,
          totalEarnings: totalEarnings.toFixed(2),
          totalUsers: managedUsers.length,
          totalRecords: attendance.length
        },
      },
    });
  } catch (error) {
    console.error("Get attendance by admin error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance data",
      error: error.message,
    });
  }
};

/* =========================
   Calculate Admin Attendance Statistics
========================= */
const calculateAdminAttendanceStats = async (query, managedUsers) => {
  try {
    const attendance = await Attendance.find(query)
      .populate("userId", "name department adminId createdBy");

    const stats = {
      totalUsers: managedUsers.length,
      totalRecords: attendance.length,
      totalWorkingHours: 0,
      totalOvertimeHours: 0,
      present: 0,
      absent: 0,
      halfDay: 0,
      onLeave: 0,
      holiday: 0,
      lateArrivals: 0,
      earlyDepartures: 0,
    };

    // Process attendance records
    attendance.forEach(record => {
      const status = record.status || "absent";
      
      // Update overall stats
      stats.totalWorkingHours += record.workingHours || 0;
      stats.totalOvertimeHours += record.overtimeHours || 0;
      
      if (stats[status] !== undefined) {
        stats[status]++;
      }

      // Check for late arrivals (assuming 10:00 AM is start time)
      if (record.punchInTime) {
        const punchInHour = record.punchInTime.getHours();
        const punchInMinute = record.punchInTime.getMinutes();
        if (punchInHour > 10 || (punchInHour === 10 && punchInMinute > 0)) {
          stats.lateArrivals++;
        }
      }

      // Check for early departures (assuming 6:00 PM is end time)
      if (record.punchOutTime) {
        const punchOutHour = record.punchOutTime.getHours();
        if (punchOutHour < 18) {
          stats.earlyDepartures++;
        }
      }
    });

    // Calculate overall attendance rate
    const totalPresentDays = stats.present + (stats.halfDay * 0.5);
    const totalDays = stats.present + stats.absent + stats.halfDay + stats.onLeave + stats.holiday;
    stats.attendanceRate = totalDays > 0
      ? ((totalPresentDays / totalDays) * 100).toFixed(2)
      : "0.00";

    stats.totalWorkingHours = parseFloat(stats.totalWorkingHours.toFixed(2));
    stats.totalOvertimeHours = parseFloat(stats.totalOvertimeHours.toFixed(2));

    return stats;
  } catch (error) {
    console.error("Error calculating stats:", error);
    return {
      totalUsers: managedUsers.length,
      totalRecords: 0,
      totalWorkingHours: 0,
      totalOvertimeHours: 0,
      present: 0,
      absent: 0,
      halfDay: 0,
      onLeave: 0,
      holiday: 0,
      attendanceRate: "0.00",
      lateArrivals: 0,
      earlyDepartures: 0
    };
  }
};

/* =========================
   Get Monthly Attendance Report by Admin
   GET /api/attendance/admin/monthly-report
========================= */
export const getMonthlyAttendanceReport = async (req, res) => {
  try {
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0);

    // Get managed users
    let managedUsers;
    if (req.user.role === "super_admin") {
      managedUsers = await User.find({ role: "user" });
    } else {
      managedUsers = await User.find({
        role: "user",
        $or: [
          { adminId: req.user._id },
          { createdBy: req.user._id }
        ]
      });
    }

    if (managedUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users found under your management",
        data: {
          month: targetMonth + 1,
          year: targetYear,
          users: [],
          summary: {},
        },
      });
    }

    // Get attendance for all managed users for the month
    const attendance = await Attendance.find({
      userId: { $in: managedUsers.map(u => u._id) },
      date: {
        $gte: startOfDay(startDate),
        $lte: endOfDay(endDate),
      },
    }).populate("userId", "name email department");

    // Get salary records
    const salaryRecords = await Salary.find({
      userId: { $in: managedUsers.map(u => u._id) },
    });

    // Prepare user-wise report
    const userReports = managedUsers.map(user => {
      const userAttendance = attendance.filter(a => 
        a.userId && a.userId._id.toString() === user._id.toString()
      );
      const userSalary = salaryRecords.find(s => 
        s.userId.toString() === user._id.toString()
      );

      let totalWorkingHours = 0;
      let totalOvertimeHours = 0;
      let presentDays = 0;
      let absentDays = 0;
      let halfDays = 0;
      let leaveDays = 0;
      let holidayDays = 0;

      userAttendance.forEach(record => {
        totalWorkingHours += record.workingHours || 0;
        totalOvertimeHours += record.overtimeHours || 0;

        switch (record.status) {
          case "present":
            presentDays++;
            break;
          case "absent":
            absentDays++;
            break;
          case "half-day":
            halfDays++;
            break;
          case "on-leave":
            leaveDays++;
            break;
          case "holiday":
            holidayDays++;
            break;
        }
      });

      // Calculate earnings
      let earnings = 0;
      if (userSalary) {
        const hourlyRate = userSalary.baseSalary / (userSalary.workingDaysPerWeek * 4 * userSalary.workingHoursPerDay);
        earnings = (totalWorkingHours * hourlyRate) + 
                   (totalOvertimeHours * hourlyRate * userSalary.overtimeRate);
      }

      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        attendance: {
          presentDays,
          absentDays,
          halfDays,
          leaveDays,
          holidayDays,
          totalDays: userAttendance.length,
          attendanceRate: userAttendance.length > 0
            ? ((presentDays + (halfDays * 0.5)) / userAttendance.length * 100).toFixed(2)
            : 0,
        },
        hours: {
          totalWorkingHours: totalWorkingHours.toFixed(2),
          totalOvertimeHours: totalOvertimeHours.toFixed(2),
          averageDailyHours: userAttendance.length > 0
            ? (totalWorkingHours / userAttendance.length).toFixed(2)
            : 0,
        },
        earnings: earnings.toFixed(2),
      };
    });

    // Calculate summary
    const summary = {
      totalUsers: managedUsers.length,
      totalPresent: userReports.reduce((sum, user) => sum + user.attendance.presentDays, 0),
      totalAbsent: userReports.reduce((sum, user) => sum + user.attendance.absentDays, 0),
      totalHalfDays: userReports.reduce((sum, user) => sum + user.attendance.halfDays, 0),
      totalWorkingHours: userReports.reduce((sum, user) => sum + parseFloat(user.hours.totalWorkingHours), 0).toFixed(2),
      totalOvertimeHours: userReports.reduce((sum, user) => sum + parseFloat(user.hours.totalOvertimeHours), 0).toFixed(2),
      totalEarnings: userReports.reduce((sum, user) => sum + parseFloat(user.earnings), 0).toFixed(2),
      averageAttendanceRate: managedUsers.length > 0 
        ? (userReports.reduce((sum, user) => sum + parseFloat(user.attendance.attendanceRate), 0) / managedUsers.length).toFixed(2)
        : "0.00",
    };

    res.status(200).json({
      success: true,
      data: {
        month: targetMonth + 1,
        year: targetYear,
        users: userReports,
        summary,
      },
    });
  } catch (error) {
    console.error("Monthly report error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating monthly report",
      error: error.message,
    });
  }
};

/* =========================
   Debug User Relationships
   GET /api/attendance/debug-relationships
========================= */
export const debugUserRelationships = async (req, res) => {
  try {
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    // Get all users
    const allUsers = await User.find()
      .select('_id name email role adminId createdBy')
      .lean();

    // Get all attendance records
    const allAttendance = await Attendance.find()
      .populate('userId', '_id name email adminId createdBy')
      .limit(20)
      .lean();

    // Get the current admin
    const currentAdmin = await User.findById(req.user._id)
      .select('_id name email role')
      .lean();

    // Find users created by this admin
    const usersCreatedByAdmin = await User.find({ 
      createdBy: req.user._id,
      role: 'user' 
    })
    .select('_id name email adminId createdBy')
    .lean();

    // Find users with adminId matching current admin
    const usersWithAdminId = await User.find({ 
      adminId: req.user._id,
      role: 'user' 
    })
    .select('_id name email adminId createdBy')
    .lean();

    // Find users managed by this admin (createdBy OR adminId)
    const managedUsers = await User.find({
      role: "user",
      $or: [
        { adminId: req.user._id },
        { createdBy: req.user._id }
      ]
    }).select('_id name email adminId createdBy').lean();

    res.status(200).json({
      success: true,
      currentAdmin,
      stats: {
        totalUsers: allUsers.length,
        usersCreatedByAdmin: usersCreatedByAdmin.length,
        usersWithAdminId: usersWithAdminId.length,
        managedUsers: managedUsers.length,
        totalAttendance: allAttendance.length
      },
      allUsers: allUsers.map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        adminId: u.adminId,
        createdBy: u.createdBy
      })),
      usersCreatedByAdmin,
      usersWithAdminId,
      managedUsers,
      recentAttendance: allAttendance.map(a => ({
        _id: a._id,
        userId: a.userId?._id,
        userName: a.userId?.name,
        userEmail: a.userId?.email,
        userAdminId: a.userId?.adminId,
        userCreatedBy: a.userId?.createdBy,
        date: a.date,
        status: a.status,
        attendanceAdminId: a.adminId
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/* =========================
   Fix Attendance Admin IDs
   POST /api/attendance/fix-admin-ids
========================= */
export const fixAttendanceAdminIds = async (req, res) => {
  try {
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    // Find all attendance records
    const allAttendance = await Attendance.find().populate('userId', 'adminId createdBy');

    console.log(`Found ${allAttendance.length} attendance records`);

    let updatedCount = 0;
    
    for (const record of allAttendance) {
      if (record.userId) {
        let adminId = null;
        
        // Try to get adminId from user
        if (record.userId.adminId) {
          adminId = record.userId.adminId;
        }
        // Fallback to createdBy
        else if (record.userId.createdBy) {
          adminId = record.userId.createdBy;
        }
        
        if (adminId && (!record.adminId || record.adminId.toString() !== adminId.toString())) {
          record.adminId = adminId;
          await record.save();
          updatedCount++;
          console.log(`Updated record ${record._id} with adminId: ${adminId}`);
        }
      }
    }

    // Also update users without adminId
    const usersWithoutAdmin = await User.find({
      role: 'user',
      $or: [
        { adminId: { $exists: false } },
        { adminId: null }
      ],
      createdBy: { $exists: true, $ne: null }
    });

    console.log(`Found ${usersWithoutAdmin.length} users without adminId but with createdBy`);

    let usersUpdated = 0;
    for (const user of usersWithoutAdmin) {
      user.adminId = user.createdBy;
      await user.save();
      usersUpdated++;
      console.log(`Updated user ${user._id} with adminId: ${user.createdBy}`);
    }

    res.status(200).json({
      success: true,
      message: "Migration completed",
      results: {
        totalAttendanceRecords: allAttendance.length,
        attendanceRecordsFixed: updatedCount,
        userRecordsFixed: usersUpdated
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};