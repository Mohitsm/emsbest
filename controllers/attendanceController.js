
import Attendance from "../models/Attendance.js";
import Holiday from "../models/Holiday.js";
import Leave from "../models/Leave.js";
import Salary from "../models/Salary.js";
import User from "../models/User.js";
import { format, startOfDay, endOfDay, parseISO, differenceInHours, differenceInMinutes } from "date-fns";

/* =========================
   Punch In Time
   POST /api/attendance/punch-in
   Private
========================= */
export const punchIn = async (req, res) => {
  try {
    const { remark } = req.body;
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const today = startOfDay(new Date());
    
    // Check if already punched in today
    const existingAttendance = await Attendance.findOne({
      userId: req.user._id,
      date: today,
    });

    if (existingAttendance && existingAttendance.punchInTime) {
      return res.status(400).json({
        success: false,
        message: "Already punched in today",
      });
    }

    // Check if today is a holiday
    const holiday = await Holiday.findOne({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    // Check if user has leave approved for today
    const leave = await Leave.findOne({
      userId: req.user._id,
      fromDate: { $lte: today },
      toDate: { $gte: today },
      status: "approved",
    });

    // Get user's salary info for lunch break
    const salary = await Salary.findOne({ userId: req.user._id });
    const lunchBreakHours = salary ? salary.lunchBreakHours : 1;

    // Create or update attendance
    const attendance = await Attendance.findOneAndUpdate(
      { userId: req.user._id, date: today },
      {
        $setOnInsert: {
          userId: req.user._id,
          adminId: req.user.adminId,
          date: today,
        },
        punchInTime: new Date(),
        remark,
        status: holiday ? "holiday" : leave ? "on-leave" : "present",
        createdBy: req.user._id,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: holiday
        ? `Holiday: ${holiday.name}`
        : leave
        ? "Leave approved for this day"
        : "Punched in successfully",
      data: attendance,
    });
  } catch (err) {
    console.error("Punch in error:", err);
    res.status(500).json({
      success: false,
      message: "Error punching in",
      error: err.message,
    });
  }
};

/* =========================
   Punch Out Time
   POST /api/attendance/punch-out
   Private
========================= */
/* =========================
   Punch Out Time - 8 HOURS TOTAL (7 WORK + 1 LUNCH)
========================= */
export const punchOut = async (req, res) => {
  try {
    const { remark } = req.body;
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const today = startOfDay(new Date());
    
    // Find today's attendance
    const attendance = await Attendance.findOne({
      userId: req.user._id,
      date: today,
    });

    if (!attendance || !attendance.punchInTime) {
      return res.status(400).json({
        success: false,
        message: "Please punch in first",
      });
    }

    if (attendance.punchOutTime) {
      return res.status(400).json({
        success: false,
        message: "Already punched out today",
      });
    }

    const punchOutTime = new Date();
    
    // Get user's salary info
    const salary = await Salary.findOne({ userId: req.user._id });
    
    if (!salary) {
      return res.status(400).json({
        success: false,
        message: "Salary information not found. Please contact HR.",
      });
    }

    // Calculate total minutes at office
    const totalMilliseconds = punchOutTime.getTime() - attendance.punchInTime.getTime();
    const totalMinutes = totalMilliseconds / (1000 * 60);
    const totalHoursAtOffice = totalMinutes / 60;
    
    console.log("=== PUNCH OUT CALCULATION ===");
    console.log("Punch In:", attendance.punchInTime.toLocaleTimeString());
    console.log("Punch Out:", punchOutTime.toLocaleTimeString());
    console.log("Total at office:", totalHoursAtOffice.toFixed(2), "hours");

    // NEW LOGIC: 8 hours total = 7 work + 1 lunch
    const totalDayHours = salary.workingHoursPerDay; // This is 8 (total office time)
    const lunchBreakHours = salary.lunchBreakHours; // This is 1 (included in the 8)
    const actualWorkHours = totalDayHours - lunchBreakHours; // This is 7 (actual work)
    
    console.log("Work Structure:", {
      totalOfficeTime: totalDayHours + " hours",
      lunchBreak: lunchBreakHours + " hour (included in total)",
      actualWorkRequired: actualWorkHours + " hours",
      explanation: "8 hours office = 7 hours work + 1 hour lunch"
    });

    let workingHours = totalHoursAtOffice; // Start with total time at office
    let overtimeHours = 0;

    console.log(`Initial: ${workingHours.toFixed(2)} hours at office`);

    // If user was at office less than 4 hours, no lunch break considered
    if (totalHoursAtOffice < 4) {
      console.log("Short day (<4 hours): No lunch break considered");
      // Working hours = total hours (since no lunch)
    } else {
      // For 4+ hours, lunch is part of the total
      console.log(`${lunchBreakHours} hour lunch included in total`);
    }

    // Overtime calculation
    // Overtime starts after total day hours (8 hours)
    if (totalHoursAtOffice > totalDayHours) {
      overtimeHours = totalHoursAtOffice - totalDayHours;
      console.log(`Overtime: ${totalHoursAtOffice} - ${totalDayHours} = ${overtimeHours.toFixed(2)} hours`);
      
      // Working hours capped at total day hours (8 hours)
      workingHours = Math.min(workingHours, totalDayHours);
      console.log(`Working hours capped at: ${workingHours.toFixed(2)} hours`);
    }

    // Round to 2 decimal places
    workingHours = Math.round(workingHours * 100) / 100;
    overtimeHours = Math.round(overtimeHours * 100) / 100;

    console.log("Final values:", {
      totalAtOffice: totalHoursAtOffice.toFixed(2) + " hours",
      workingHours: workingHours.toFixed(2) + " hours (shown in system)",
      actualWork: (workingHours - lunchBreakHours).toFixed(2) + " hours (actual work)",
      lunch: lunchBreakHours + " hour",
      overtime: overtimeHours.toFixed(2) + " hours"
    });

    // ===== STATUS DETERMINATION =====
    let status = attendance.status;
    if (status === "present") {
      console.log("=== STATUS DETERMINATION ===");
      console.log("Based on", totalDayHours, "hour total office time:");
      console.log("- Absent: <", (totalDayHours / 2), "hours at office");
      console.log("- Half-day: ≥", (totalDayHours / 2), "and <", totalDayHours, "hours at office");
      console.log("- Present: ≥", totalDayHours, "hours at office");
      console.log("Current office hours:", totalHoursAtOffice);

      if (totalHoursAtOffice === 0) {
        status = "absent";
        console.log("Status: ABSENT (0 hours)");
      } 
      else if (totalHoursAtOffice < totalDayHours / 2) {
        status = "absent";
        console.log("Status: ABSENT (less than", (totalDayHours / 2), "hours)");
      } 
      else if (totalHoursAtOffice < totalDayHours) {
        status = "half-day";
        console.log("Status: HALF-DAY");
      } 
      else {
        status = "present";
        console.log("Status: PRESENT");
      }
    }

    // Update attendance
    attendance.punchOutTime = punchOutTime;
    attendance.workingHours = workingHours; // This will show as 8 for full day
    attendance.overtimeHours = overtimeHours;
    attendance.status = status;
    if (remark) attendance.remark = remark;
    
    await attendance.save();

    // Calculate earnings - Use actual work hours (7) for rate calculation
    const hourlyRate = salary.baseSalary / (salary.workingDaysPerWeek * 4 * actualWorkHours);
    const dailyEarnings = (actualWorkHours * hourlyRate) + (overtimeHours * hourlyRate * salary.overtimeRate);

    res.status(200).json({
      success: true,
      message: "Punched out successfully",
      data: {
        attendance: attendance.toObject(),
        summary: {
          totalAtOffice: totalHoursAtOffice.toFixed(2) + " hours",
          workingHours: workingHours.toFixed(2) + " hours",
          overtimeHours: overtimeHours.toFixed(2) + " hours",
          lunchBreak: lunchBreakHours + " hour (included)",
          status,
          dailyEarnings: dailyEarnings.toFixed(2),
        },
        breakdown: {
          totalDay: totalDayHours + " hours office time",
          composition: actualWorkHours + "h work + " + lunchBreakHours + "h lunch",
          systemShows: workingHours + "h as 'Working Hours'",
          actualWork: actualWorkHours + "h actual productive work"
        }
      },
    });
  } catch (err) {
    console.error("Punch out error:", err);
    res.status(500).json({
      success: false,
      message: "Error punching out",
      error: err.message,
    });
  }
};

/* =========================
   Get Today's Attendance
   GET /api/attendance/today
   Private
========================= */
export const getTodayAttendance = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const today = startOfDay(new Date());
    
    let attendance = await Attendance.findOne({
      userId: req.user._id,
      date: today,
    });

    // If no attendance record exists, create a default one
    if (!attendance) {
      // Check if today is a holiday
      const holiday = await Holiday.findOne({
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      });

      // Check if user has leave
      const leave = await Leave.findOne({
        userId: req.user._id,
        fromDate: { $lte: today },
        toDate: { $gte: today },
        status: "approved",
      });

      attendance = {
        date: today,
        punchInTime: null,
        punchOutTime: null,
        workingHours: 0,
        overtimeHours: 0,
        status: holiday ? "holiday" : leave ? "on-leave" : "absent",
        remark: "",
      };
    }

    // Get salary info for calculations
    const salary = await Salary.findOne({ userId: req.user._id });
    const workingHoursPerDay = salary ? salary.workingHoursPerDay : 8;
    const lunchBreakHours = salary ? salary.lunchBreakHours : 1;

    // Calculate current working hours if punched in but not out
    let currentWorkingHours = 0;
    if (attendance.punchInTime && !attendance.punchOutTime) {
      const minutes = differenceInMinutes(new Date(), attendance.punchInTime);
      currentWorkingHours = minutes / 60;
      
      // Subtract lunch break if applicable
      if (currentWorkingHours >= 4) {
        currentWorkingHours = Math.max(0, currentWorkingHours - lunchBreakHours);
      }
      currentWorkingHours = Math.round(currentWorkingHours * 100) / 100;
    }

    res.status(200).json({
      success: true,
      data: {
        ...attendance.toObject ? attendance.toObject() : attendance,
        currentWorkingHours,
        workingHoursPerDay,
        lunchBreakHours,
        remainingHours: Math.max(0, workingHoursPerDay - (attendance.workingHours || 0)),
        isPunchedIn: !!attendance.punchInTime && !attendance.punchOutTime,
        isPunchedOut: !!attendance.punchOutTime,
      },
    });
  } catch (err) {
    console.error("Get today attendance error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching today's attendance",
      error: err.message,
    });
  }
};

/* =========================
   Get Attendance by Date Range
   GET /api/attendance?fromDate=&toDate=
   Private
========================= */
export const getAttendanceByDateRange = async (req, res) => {
  try {
    const { fromDate, toDate, page = 1, limit = 30 } = req.query;
    const query = { userId: req.user._id };
    
    if (fromDate && toDate) {
      query.date = {
        $gte: startOfDay(new Date(fromDate)),
        $lte: endOfDay(new Date(toDate)),
      };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { date: -1 },
    };

    const attendance = await Attendance.paginate(query, options);

    // Calculate statistics
    let totalWorkingHours = 0;
    let totalOvertimeHours = 0;
    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;

    attendance.docs.forEach((record) => {
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
      }
    });

    // Get salary info for earnings calculation
    const salary = await Salary.findOne({ userId: req.user._id });
    let totalEarnings = 0;
    
    if (salary) {
      const hourlyRate = salary.baseSalary / (salary.workingDaysPerWeek * 4 * salary.workingHoursPerDay);
      totalEarnings = (totalWorkingHours * hourlyRate) + 
                      (totalOvertimeHours * hourlyRate * salary.overtimeRate);
    }

    res.status(200).json({
      success: true,
      data: {
        attendance: attendance.docs,
        pagination: {
          total: attendance.totalDocs,
          pages: attendance.totalPages,
          page: attendance.page,
          limit: attendance.limit,
          hasNextPage: attendance.hasNextPage,
          hasPrevPage: attendance.hasPrevPage,
        },
        statistics: {
          totalWorkingHours: totalWorkingHours.toFixed(2),
          totalOvertimeHours: totalOvertimeHours.toFixed(2),
          presentDays,
          absentDays,
          halfDays,
          leaveDays: attendance.docs.filter(r => r.status === "on-leave").length,
          holidayDays: attendance.docs.filter(r => r.status === "holiday").length,
          totalEarnings: totalEarnings.toFixed(2),
        },
      },
    });
  } catch (err) {
    console.error("Get attendance by date range error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance",
      error: err.message,
    });
  }
};

/* =========================
   Get All Employees Attendance (Admin)
   GET /api/attendance/admin/all
   Private (Admin/Super Admin)
========================= */
export const getAllEmployeesAttendance = async (req, res) => {
  try {
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const {
      userId,
      department,
      fromDate,
      toDate,
      status,
      page = 1,
      limit = 50,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    let query = {};

    // Super admin can see all, regular admin only sees their users
    if (req.user.role === "super_admin") {
      // Super admin sees all attendance
      if (userId) {
        query.userId = userId;
      }
    } else {
      // Regular admin only sees their managed users
      const managedUsers = await User.find({ adminId: req.user._id }).select("_id");
      const managedUserIds = managedUsers.map(u => u._id);
      
      if (userId) {
        // Verify this user is managed by the admin
        if (managedUserIds.includes(userId)) {
          query.userId = userId;
        } else {
          return res.status(403).json({
            success: false,
            message: "You can only view attendance for your managed users",
          });
        }
      } else {
        query.userId = { $in: managedUserIds };
      }
    }

    // Filter by department
    if (department) {
      const usersInDept = await User.find({ department }, "_id");
      if (query.userId && query.userId.$in) {
        query.userId.$in = query.userId.$in.filter(id => 
          usersInDept.some(u => u._id.toString() === id.toString())
        );
      } else if (query.userId) {
        // Check if specific user is in department
        const user = await User.findById(query.userId);
        if (!user || user.department !== department) {
          query.userId = null; // No results
        }
      } else {
        query.userId = { $in: usersInDept.map(u => u._id) };
      }
    }

    if (status) {
      query.status = status;
    }

    if (fromDate && toDate) {
      query.date = {
        $gte: startOfDay(new Date(fromDate)),
        $lte: endOfDay(new Date(toDate)),
      };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Get total count
    const total = await Attendance.countDocuments(query);

    // Get paginated data with population
    const attendance = await Attendance.find(query)
      .populate([
        {
          path: "userId",
          select: "name email department shifts",
        },
        {
          path: "createdBy",
          select: "name email",
        },
      ])
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Calculate statistics
    const departmentStats = {};
    let overallStats = {
      totalRecords: 0,
      totalWorkingHours: 0,
      totalOvertimeHours: 0,
      present: 0,
      absent: 0,
      halfDay: 0,
      onLeave: 0,
      holiday: 0,
    };

    attendance.forEach((record) => {
      overallStats.totalRecords++;
      overallStats.totalWorkingHours += record.workingHours || 0;
      overallStats.totalOvertimeHours += record.overtimeHours || 0;
      
      if (record.status) {
        overallStats[record.status] = (overallStats[record.status] || 0) + 1;
      }

      // Department-wise stats
      const dept = record.userId?.department || "Unknown";
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          present: 0,
          absent: 0,
          halfDay: 0,
          onLeave: 0,
          holiday: 0,
          totalEmployees: 0,
        };
      }
      
      if (record.status) {
        departmentStats[dept][record.status] = (departmentStats[dept][record.status] || 0) + 1;
      }
    });

    // Count unique employees per department
    const uniqueEmployees = {};
    attendance.forEach((record) => {
      const dept = record.userId?.department || "Unknown";
      const empId = record.userId?._id.toString();
      
      if (!uniqueEmployees[dept]) {
        uniqueEmployees[dept] = new Set();
      }
      uniqueEmployees[dept].add(empId);
    });

    // Add employee count to department stats
    Object.keys(departmentStats).forEach((dept) => {
      departmentStats[dept].totalEmployees = uniqueEmployees[dept]?.size || 0;
    });

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: {
        attendance,
        pagination: {
          total,
          pages: totalPages,
          page: pageNum,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        statistics: {
          overall: {
            ...overallStats,
            totalWorkingHours: overallStats.totalWorkingHours.toFixed(2),
            totalOvertimeHours: overallStats.totalOvertimeHours.toFixed(2),
            attendanceRate: overallStats.totalRecords > 0 
              ? ((overallStats.present + overallStats.halfDay * 0.5) / overallStats.totalRecords * 100).toFixed(2)
              : 0,
          },
          byDepartment: departmentStats,
        },
      },
    });
  } catch (err) {
    console.error("Get all employees attendance error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance",
      error: err.message,
    });
  }
};

/* =========================
   Update Attendance (Admin)
   PUT /api/attendance/:id
   Private (Admin/Super Admin)
========================= */
export const updateAttendance = async (req, res) => {
  try {
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const { punchInTime, punchOutTime, remark, status, workingHours, overtimeHours } = req.body;
    
    const attendance = await Attendance.findById(req.params.id)
      .populate("userId", "name email department");
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Check if admin can modify this record
    if (req.user.role !== "super_admin") {
      const managedUsers = await User.find({ adminId: req.user._id }).select("_id");
      const managedUserIds = managedUsers.map(u => u._id);
      
      if (!managedUserIds.includes(attendance.userId._id.toString())) {
        return res.status(403).json({
          success: false,
          message: "You can only modify attendance for your managed users",
        });
      }
    }

    // Update fields
    const updates = {};
    if (punchInTime !== undefined) updates.punchInTime = new Date(punchInTime);
    if (punchOutTime !== undefined) updates.punchOutTime = new Date(punchOutTime);
    if (remark !== undefined) updates.remark = remark;
    if (status !== undefined) updates.status = status;
    if (workingHours !== undefined) updates.workingHours = parseFloat(workingHours);
    if (overtimeHours !== undefined) updates.overtimeHours = parseFloat(overtimeHours);

    // If both punch times are provided, recalculate working hours
    if (punchInTime && punchOutTime) {
      const salary = await Salary.findOne({ userId: attendance.userId });
      if (salary) {
        const totalMinutes = differenceInMinutes(new Date(punchOutTime), new Date(punchInTime));
        let calculatedHours = totalMinutes / 60;
        
        // Subtract lunch break if applicable
        if (calculatedHours >= 4) {
          calculatedHours = Math.max(0, calculatedHours - salary.lunchBreakHours);
        }
        
        calculatedHours = Math.round(calculatedHours * 100) / 100;
        updates.workingHours = Math.min(calculatedHours, salary.workingHoursPerDay);
        updates.overtimeHours = Math.max(0, calculatedHours - salary.workingHoursPerDay);
      }
    }

    // Update attendance
    Object.assign(attendance, updates);
    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: attendance,
    });
  } catch (err) {
    console.error("Update attendance error:", err);
    res.status(500).json({
      success: false,
      message: "Error updating attendance",
      error: err.message,
    });
  }
};

/* =========================
   Create Manual Attendance (Admin)
   POST /api/attendance/admin/create
   Private (Admin/Super Admin)
========================= */
/* =========================
   Create Manual Attendance (Admin) - FIXED
========================= */
// export const createManualAttendance = async (req, res) => {
//   try {
//     if (!req.user.isAdmin()) {
//       return res.status(403).json({
//         success: false,
//         message: "Not authorized",
//       });
//     }

//     const {
//       userId,
//       date,
//       punchInTime,
//       punchOutTime,
//       status,
//       remark,
//     } = req.body;

//     console.log("Creating manual attendance with data:", {
//       userId,
//       date,
//       punchInTime,
//       punchOutTime,
//       status,
//       remark,
//       adminId: req.user._id,
//       adminRole: req.user.role
//     });

//     if (!userId || !date) {
//       return res.status(400).json({
//         success: false,
//         message: "User ID and date are required",
//       });
//     }

//     // Check if admin can create attendance for this user
//     if (req.user.role !== "super_admin") {
//       // FIXED: Check for users created by OR assigned to this admin
//       const managedUsers = await User.find({
//         $or: [
//           { adminId: req.user._id },
//           { createdBy: req.user._id }
//         ],
//         role: 'user'
//       }).select("_id");
      
//       const managedUserIds = managedUsers.map(u => u._id.toString());
      
//       console.log("Managed user IDs:", managedUserIds);
//       console.log("Requested user ID:", userId);
//       console.log("Is user managed?", managedUserIds.includes(userId));
      
//       if (!managedUserIds.includes(userId)) {
//         return res.status(403).json({
//           success: false,
//           message: "You can only create attendance for your managed users",
//         });
//       }
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     console.log("Found user:", {
//       id: user._id,
//       name: user.name,
//       email: user.email,
//       adminId: user.adminId,
//       createdBy: user.createdBy
//     });

//     const attendanceDate = startOfDay(new Date(date));

//     // Check for duplicate attendance
//     const existingAttendance = await Attendance.findOne({
//       userId,
//       date: attendanceDate,
//     });

//     if (existingAttendance) {
//       return res.status(400).json({
//         success: false,
//         message: "Attendance already exists for this date",
//       });
//     }

//     const salary = await Salary.findOne({ userId });
//     const workingHoursPerDay = salary?.workingHoursPerDay || 8;
//     const lunchBreakHours = salary?.lunchBreakHours || 1;

//     console.log("Salary info:", {
//       workingHoursPerDay,
//       lunchBreakHours,
//       hasSalary: !!salary
//     });

//     let workingHours = 0;
//     let overtimeHours = 0;
//     let finalStatus = status || "present";

//     // Calculate working hours if punch times provided
//     if (punchInTime && punchOutTime) {
//       const inTime = new Date(punchInTime);
//       const outTime = new Date(punchOutTime);

//       console.log("Punch times:", {
//         inTime,
//         outTime
//       });

//       const totalMinutes = differenceInMinutes(outTime, inTime);

//       console.log("Total minutes:", totalMinutes);

//       if (totalMinutes < 0) {
//         return res.status(400).json({
//           success: false,
//           message: "Punch-out time cannot be before punch-in time",
//         });
//       }

//       workingHours = Math.round((totalMinutes / 60) * 100) / 100;
//       console.log("Working hours before lunch break:", workingHours);

//       // Subtract lunch break if applicable
//       if (workingHours >= 4) {
//         workingHours = Math.max(0, workingHours - lunchBreakHours);
//         console.log("Working hours after lunch break:", workingHours);
//       }

//       // Calculate overtime
//       if (workingHours > workingHoursPerDay) {
//         overtimeHours = workingHours - workingHoursPerDay;
//         workingHours = workingHoursPerDay;
//         console.log("Overtime hours:", overtimeHours);
//       }

//       // Auto-determine status if not provided
//       if (!status) {
//         if (workingHours < workingHoursPerDay / 2) {
//           finalStatus = "absent";
//         } else if (workingHours < workingHoursPerDay) {
//           finalStatus = "half-day";
//         } else {
//           finalStatus = "present";
//         }
//       }
      
//       console.log("Auto-determined status:", finalStatus);
//     }

//     // Get adminId from user (either adminId or createdBy)
//     let adminId = user.adminId || user.createdBy;
    
//     console.log("Setting adminId for attendance:", adminId);

//     // Create attendance record
//     const attendance = new Attendance({
//       userId,
//       date: attendanceDate,
//       punchInTime: punchInTime ? new Date(punchInTime) : null,
//       punchOutTime: punchOutTime ? new Date(punchOutTime) : null,
//       workingHours,
//       overtimeHours,
//       status: finalStatus,
//       remark: remark || "",
//       createdBy: req.user._id,
//       // adminId will be automatically set by pre-save hook
//     });

//     await attendance.save();
    
//     console.log("Attendance created successfully:", attendance._id);

//     res.status(201).json({
//       success: true,
//       message: "Attendance created successfully",
//       data: attendance,
//     });
//   } catch (error) {
//     console.error("Manual attendance error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error creating attendance",
//       error: error.message,
//     });
//   }
// };
/* =========================
   Create Manual Attendance (Admin) - CORRECTED LOGIC
========================= */
export const createManualAttendance = async (req, res) => {
  try {
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const {
      userId,
      date,
      punchInTime,
      punchOutTime,
      status,
      remark,
      workingHours: manualWorkingHours,
      overtimeHours: manualOvertimeHours
    } = req.body;

    console.log("Creating manual attendance with data:", {
      userId,
      date,
      punchInTime,
      punchOutTime,
      status,
      remark,
      manualWorkingHours,
      manualOvertimeHours,
      adminId: req.user._id,
      adminRole: req.user.role
    });

    if (!userId || !date) {
      return res.status(400).json({
        success: false,
        message: "User ID and date are required",
      });
    }

    // Check if admin can create attendance for this user
    if (req.user.role !== "super_admin") {
      const managedUsers = await User.find({
        $or: [
          { adminId: req.user._id },
          { createdBy: req.user._id }
        ],
        role: 'user'
      }).select("_id");
      
      const managedUserIds = managedUsers.map(u => u._id.toString());
      
      console.log("Managed user IDs:", managedUserIds);
      console.log("Requested user ID:", userId);
      console.log("Is user managed?", managedUserIds.includes(userId));
      
      if (!managedUserIds.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: "You can only create attendance for your managed users",
        });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("Found user:", {
      id: user._id,
      name: user.name,
      email: user.email,
      adminId: user.adminId,
      createdBy: user.createdBy
    });

    const attendanceDate = startOfDay(new Date(date));

    // Check for duplicate attendance
    const existingAttendance = await Attendance.findOne({
      userId,
      date: attendanceDate,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already exists for this date",
      });
    }

    const salary = await Salary.findOne({ userId });
    const workingHoursPerDay = salary?.workingHoursPerDay || 8;
    const lunchBreakHours = salary?.lunchBreakHours || 1;
    
    // Standard work day: 8 hours total, 1 hour lunch, 7 hours effective work
    const effectiveWorkingHours = workingHoursPerDay ;

    console.log("Work timing info:", {
      totalWorkDay: workingHoursPerDay + " hours",
      lunchBreak: lunchBreakHours + " hour(s)",
      effectiveWorking: effectiveWorkingHours + " hours",
      hasSalary: !!salary
    });

    let workingHours = 0;
    let overtimeHours = 0;
    let totalHours = 0;
    let finalStatus = status || "present";

    // If manual hours are provided, use them
    if (manualWorkingHours !== undefined) {
      workingHours = parseFloat(manualWorkingHours) || 0;
      overtimeHours = parseFloat(manualOvertimeHours) || 0;
      totalHours = workingHours + overtimeHours + lunchBreakHours;
      console.log("Using manual hours:", { 
        workingHours, 
        overtimeHours, 
        totalHours 
      });
    }
    // Calculate from punch times
    else if (punchInTime && punchOutTime) {
      const inTime = new Date(punchInTime);
      const outTime = new Date(punchOutTime);

      console.log("Punch times:", {
        inTime: inTime.toLocaleTimeString(),
        outTime: outTime.toLocaleTimeString()
      });

      const totalMinutes = differenceInMinutes(outTime, inTime);

      console.log("Total minutes between punches:", totalMinutes);

      if (totalMinutes < 0) {
        return res.status(400).json({
          success: false,
          message: "Punch-out time cannot be before punch-in time",
        });
      }

      // Convert minutes to hours (TOTAL HOURS including everything)
      totalHours = Math.round((totalMinutes / 60) * 100) / 100;
      console.log("Total hours (including everything):", totalHours);

      // Calculate working hours: totalHours - lunchBreak
      workingHours = Math.max(0, totalHours );
      console.log("Working hours (total - lunch):", workingHours);

      // Check if more than standard work day (8 hours)
      if (totalHours > workingHoursPerDay) {
        // Overtime calculation: total hours - standard work day (8 hours)
        overtimeHours = totalHours - workingHoursPerDay;
        console.log("Overtime (total - 8 hours):", overtimeHours);
      }

      // Adjust working hours if overtime exists
      if (overtimeHours > 0) {
        // Working hours should be standard work day minus lunch
        workingHours = effectiveWorkingHours;
        console.log("Adjusted working hours (standard):", workingHours);
      }
    }

    // Round to 2 decimal places
    workingHours = Math.round(workingHours * 100) / 100;
    overtimeHours = Math.round(overtimeHours * 100) / 100;
    totalHours = Math.round(totalHours * 100) / 100;

    // Auto-determine status based on working hours if not provided
    if (!status) {
      if (workingHours === 0) {
        finalStatus = "absent";
      } else if (workingHours < effectiveWorkingHours / 2) {
        finalStatus = "absent";
      } else if (workingHours < effectiveWorkingHours) {
        finalStatus = "half-day";
      } else {
        finalStatus = "present";
      }
    }
    
    console.log("Final calculations:", {
      totalHours: totalHours + " hours (punch in to punch out)",
      lunchBreak: lunchBreakHours + " hour(s)",
      workingHours: workingHours + " hours (effective work)",
      overtimeHours: overtimeHours + " hours",
      finalStatus
    });

    // Get adminId from user (either adminId or createdBy)
    let adminId = user.adminId || user.createdBy;
    
    console.log("Setting adminId for attendance:", adminId);

    // Create attendance record
    const attendance = new Attendance({
      userId,
      date: attendanceDate,
      punchInTime: punchInTime ? new Date(punchInTime) : null,
      punchOutTime: punchOutTime ? new Date(punchOutTime) : null,
      workingHours,  // This should be 7 hours for full day
      overtimeHours, // This should be 0 for regular day, >0 for overtime
      status: finalStatus,
      remark: remark || "",
      createdBy: req.user._id,
      adminId: adminId
    });

    await attendance.save();
    
    console.log("Attendance created successfully:", {
      id: attendance._id,
      workingHours: attendance.workingHours,
      overtimeHours: attendance.overtimeHours,
      status: attendance.status
    });

    // Calculate earnings for response
    let dailyEarnings = 0;
    if (salary && workingHours > 0) {
      // Calculate hourly rate based on effective working hours (7 hours)
      const hourlyRate = salary.baseSalary / (salary.workingDaysPerWeek * 4 * effectiveWorkingHours);
      dailyEarnings = (workingHours * hourlyRate) + 
                     (overtimeHours * hourlyRate * salary.overtimeRate);
    }

    res.status(201).json({
      success: true,
      message: "Attendance created successfully",
      data: {
        attendance: attendance.toObject(),
        summary: {
          totalHours: totalHours.toFixed(2) + " hours",
          lunchBreak: lunchBreakHours.toFixed(2) + " hour(s)",
          workingHours: workingHours.toFixed(2) + " hours",
          overtimeHours: overtimeHours.toFixed(2) + " hours",
          status: finalStatus,
          dailyEarnings: dailyEarnings.toFixed(2)
        },
        calculation: {
          formula: "Working Hours = Total Hours - Lunch Break",
          standardDay: `${workingHoursPerDay} hours total = ${effectiveWorkingHours} working + ${lunchBreakHours} lunch`,
          overtimeFormula: "Overtime = Total Hours - 8 hours (standard day)"
        }
      },
    });
  } catch (error) {
    console.error("Manual attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating attendance",
      error: error.message,
    });
  }
};
/* =========================
   Delete Attendance (Admin)
   DELETE /api/attendance/:id
   Private (Admin/Super Admin)
========================= */
export const deleteAttendance = async (req, res) => {
  try {
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const attendance = await Attendance.findById(req.params.id)
      .populate("userId", "_id");
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Check if admin can delete this record
    if (req.user.role !== "super_admin") {
      const managedUsers = await User.find({ adminId: req.user._id }).select("_id");
      const managedUserIds = managedUsers.map(u => u._id);
      
      if (!managedUserIds.includes(attendance.userId._id.toString())) {
        return res.status(403).json({
          success: false,
          message: "You can only delete attendance for your managed users",
        });
      }
    }

    await attendance.deleteOne();

    res.status(200).json({
      success: true,
      message: "Attendance deleted successfully",
    });
  } catch (err) {
    console.error("Delete attendance error:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting attendance",
      error: err.message,
    });
  }
};
/* =========================
   Get Attendance Summary
   GET /api/attendance/summary
   Private
========================= */
export const getAttendanceSummary = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    
    // Get current month attendance
    const monthAttendance = await Attendance.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalWorkingHours: { $sum: "$workingHours" },
          totalOvertimeHours: { $sum: "$overtimeHours" },
          presentDays: {
            $sum: { $cond: [{ $in: ["$status", ["present", "half-day"]] }, 1, 0] },
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
          },
          halfDays: {
            $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] },
          },
          leaveDays: {
            $sum: { $cond: [{ $eq: ["$status", "on-leave"] }, 1, 0] },
          },
          holidayDays: {
            $sum: { $cond: [{ $eq: ["$status", "holiday"] }, 1, 0] },
          },
        },
      },
    ]);

    // Get current week attendance
    const weekAttendance = await Attendance.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startOfWeek },
        },
      },
      {
        $group: {
          _id: null,
          weekWorkingHours: { $sum: "$workingHours" },
          weekOvertimeHours: { $sum: "$overtimeHours" },
          weekPresentDays: {
            $sum: { $cond: [{ $in: ["$status", ["present", "half-day"]] }, 1, 0] },
          },
        },
      },
    ]);

    // Get today's attendance status
    const todayAttendance = await Attendance.findOne({
      userId: req.user._id,
      date: startOfDay(today),
    });

    // Get user's salary info
    const salary = await Salary.findOne({ userId: req.user._id });
    
    // Calculate attendance rate for the month
    const workingDaysThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const monthStats = monthAttendance[0] || {
      totalWorkingHours: 0,
      totalOvertimeHours: 0,
      presentDays: 0,
      absentDays: 0,
      halfDays: 0,
      leaveDays: 0,
      holidayDays: 0,
    };
    
    const totalDays = monthStats.presentDays + monthStats.absentDays + monthStats.halfDays;
    const attendanceRate = totalDays > 0 
      ? ((monthStats.presentDays + (monthStats.halfDays * 0.5)) / totalDays) * 100 
      : 0;

    // Calculate expected vs actual working hours
    const expectedHours = salary 
      ? (salary.workingDaysPerWeek / 7) * workingDaysThisMonth * salary.workingHoursPerDay
      : 0;
    
    const efficiencyRate = expectedHours > 0 
      ? (monthStats.totalWorkingHours / expectedHours) * 100 
      : 0;

    // Calculate earnings
    let monthlyEarnings = 0;
    let overtimeEarnings = 0;
    
    if (salary) {
      const hourlyRate = salary.baseSalary / (salary.workingDaysPerWeek * 4 * salary.workingHoursPerDay);
      monthlyEarnings = (monthStats.totalWorkingHours * hourlyRate);
      overtimeEarnings = (monthStats.totalOvertimeHours * hourlyRate * salary.overtimeRate);
    }

    const weekStats = weekAttendance[0] || {
      weekWorkingHours: 0,
      weekOvertimeHours: 0,
      weekPresentDays: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        today: {
          status: todayAttendance?.status || "absent",
          isPunchedIn: !!(todayAttendance?.punchInTime && !todayAttendance?.punchOutTime),
          isPunchedOut: !!todayAttendance?.punchOutTime,
          workingHours: todayAttendance?.workingHours || 0,
          punchInTime: todayAttendance?.punchInTime,
          punchOutTime: todayAttendance?.punchOutTime,
        },
        thisWeek: {
          workingHours: weekStats.weekWorkingHours.toFixed(2),
          overtimeHours: weekStats.weekOvertimeHours.toFixed(2),
          presentDays: weekStats.weekPresentDays,
          targetDays: salary?.workingDaysPerWeek || 5,
        },
        thisMonth: {
          workingHours: monthStats.totalWorkingHours.toFixed(2),
          overtimeHours: monthStats.totalOvertimeHours.toFixed(2),
          presentDays: monthStats.presentDays,
          halfDays: monthStats.halfDays,
          absentDays: monthStats.absentDays,
          leaveDays: monthStats.leaveDays,
          holidayDays: monthStats.holidayDays,
          attendanceRate: attendanceRate.toFixed(2),
          efficiencyRate: efficiencyRate.toFixed(2),
        },
        earnings: {
          monthlySalary: salary?.baseSalary || 0,
          monthlyEarnings: monthlyEarnings.toFixed(2),
          overtimeEarnings: overtimeEarnings.toFixed(2),
          totalEarnings: (monthlyEarnings + overtimeEarnings).toFixed(2),
        },
        settings: {
          workingHoursPerDay: salary?.workingHoursPerDay || 8,
          workingDaysPerWeek: salary?.workingDaysPerWeek || 5,
          overtimeRate: salary?.overtimeRate || 1.5,
        },
      },
    });
  } catch (err) {
    console.error("Get attendance summary error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance summary",
      error: err.message,
    });
  }
};

/* =========================
   Get Attendance Statistics
   GET /api/attendance/statistics
   Private
========================= */
export const getAttendanceStatistics = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { period = "monthly", year, month } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    let matchStage = {
      userId: req.user._id,
    };

    let groupStage = {};
    let statistics = {};

    if (period === "yearly") {
      // Yearly statistics
      matchStage.date = {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`),
      };

      groupStage = {
        _id: { $month: "$date" },
        workingHours: { $sum: "$workingHours" },
        overtimeHours: { $sum: "$overtimeHours" },
        presentCount: {
          $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
        },
        halfDayCount: {
          $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] },
        },
        absentCount: {
          $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
        },
        leaveCount: {
          $sum: { $cond: [{ $eq: ["$status", "on-leave"] }, 1, 0] },
        },
        holidayCount: {
          $sum: { $cond: [{ $eq: ["$status", "holiday"] }, 1, 0] },
        },
      };

      const yearlyStats = await Attendance.aggregate([
        { $match: matchStage },
        { $group: groupStage },
        { $sort: { _id: 1 } },
      ]);

      // Format monthly data
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];

      statistics = months.map((monthName, index) => {
        const monthData = yearlyStats.find(stat => stat._id === index + 1);
        const workingDays = monthData ? monthData.presentCount + monthData.halfDayCount : 0;
        const totalDays = monthData ? workingDays + monthData.absentCount : 0;
        const attendanceRate = totalDays > 0 ? (workingDays / totalDays) * 100 : 0;

        return {
          month: monthName,
          workingHours: monthData?.workingHours?.toFixed(2) || "0.00",
          overtimeHours: monthData?.overtimeHours?.toFixed(2) || "0.00",
          presentDays: monthData?.presentCount || 0,
          halfDays: monthData?.halfDayCount || 0,
          absentDays: monthData?.absentCount || 0,
          leaveDays: monthData?.leaveCount || 0,
          holidayDays: monthData?.holidayCount || 0,
          attendanceRate: attendanceRate.toFixed(2),
        };
      });

    } else if (period === "monthly") {
      // Monthly statistics (default)
      const selectedMonth = month || new Date().getMonth() + 1;
      const startDate = new Date(`${currentYear}-${String(selectedMonth).padStart(2, '0')}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      matchStage.date = {
        $gte: startDate,
        $lte: endDate,
      };

      // Get daily statistics
      const dailyStats = await Attendance.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dayOfMonth: "$date" },
            workingHours: { $sum: "$workingHours" },
            overtimeHours: { $sum: "$overtimeHours" },
            status: { $first: "$status" },
            punchInTime: { $first: "$punchInTime" },
            punchOutTime: { $first: "$punchOutTime" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get weekly statistics within the month
      const weeklyStats = await Attendance.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $week: "$date" },
            workingHours: { $sum: "$workingHours" },
            overtimeHours: { $sum: "$overtimeHours" },
            presentCount: {
              $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
            },
            absentCount: {
              $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Calculate totals for the month
      const totalStats = await Attendance.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalWorkingHours: { $sum: "$workingHours" },
            totalOvertimeHours: { $sum: "$overtimeHours" },
            presentDays: {
              $sum: { $cond: [{ $in: ["$status", ["present", "half-day"]] }, 1, 0] },
            },
            absentDays: {
              $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
            },
            leaveDays: {
              $sum: { $cond: [{ $eq: ["$status", "on-leave"] }, 1, 0] },
            },
            holidayDays: {
              $sum: { $cond: [{ $eq: ["$status", "holiday"] }, 1, 0] },
            },
          },
        },
      ]);

      const totals = totalStats[0] || {
        totalWorkingHours: 0,
        totalOvertimeHours: 0,
        presentDays: 0,
        absentDays: 0,
        leaveDays: 0,
        holidayDays: 0,
      };

      // Get salary info for calculations
      const salary = await Salary.findOne({ userId: req.user._id });
      const workingDaysInMonth = new Date(currentYear, selectedMonth - 1, 0).getDate();
      const expectedHours = salary 
        ? (salary.workingDaysPerWeek / 7) * workingDaysInMonth * salary.workingHoursPerDay
        : 0;
      
      const efficiencyRate = expectedHours > 0 
        ? (totals.totalWorkingHours / expectedHours) * 100 
        : 0;

      statistics = {
        daily: dailyStats.map(day => ({
          day: day._id,
          workingHours: day.workingHours.toFixed(2),
          overtimeHours: day.overtimeHours.toFixed(2),
          status: day.status,
          punchInTime: day.punchInTime,
          punchOutTime: day.punchOutTime,
          isWeekend: [0, 6].includes(new Date(currentYear, selectedMonth - 1, day._id - 1).getDay()),
        })),
        weekly: weeklyStats.map(week => ({
          week: week._id,
          workingHours: week.workingHours.toFixed(2),
          overtimeHours: week.overtimeHours.toFixed(2),
          presentDays: week.presentCount,
          absentDays: week.absentCount,
          attendanceRate: (week.presentCount + week.absentCount) > 0 
            ? (week.presentCount / (week.presentCount + week.absentCount)) * 100 
            : 0,
        })),
        monthly: {
          totalWorkingHours: totals.totalWorkingHours.toFixed(2),
          totalOvertimeHours: totals.totalOvertimeHours.toFixed(2),
          presentDays: totals.presentDays,
          absentDays: totals.absentDays,
          leaveDays: totals.leaveDays,
          holidayDays: totals.holidayDays,
          workingDays: workingDaysInMonth,
          attendanceRate: (totals.presentDays + totals.absentDays) > 0 
            ? (totals.presentDays / (totals.presentDays + totals.absentDays)) * 100 
            : 0,
          efficiencyRate: efficiencyRate.toFixed(2),
        },
      };

    } else if (period === "weekly") {
      // Weekly statistics for the last 4 weeks
      const today = new Date();
      const weeklyData = [];

      for (let i = 0; i < 4; i++) {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - (today.getDay() + (i * 7)));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const weekStats = await Attendance.aggregate([
          {
            $match: {
              userId: req.user._id,
              date: {
                $gte: startOfDay(startOfWeek),
                $lte: endOfDay(endOfWeek),
              },
            },
          },
          {
            $group: {
              _id: null,
              workingHours: { $sum: "$workingHours" },
              overtimeHours: { $sum: "$overtimeHours" },
              presentDays: {
                $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
              },
              absentDays: {
                $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
              },
            },
          },
        ]);

        const stats = weekStats[0] || {
          workingHours: 0,
          overtimeHours: 0,
          presentDays: 0,
          absentDays: 0,
        };

        weeklyData.push({
          week: `Week ${i + 1}`,
          dateRange: `${format(startOfWeek, 'MMM dd')} - ${format(endOfWeek, 'MMM dd')}`,
          workingHours: stats.workingHours.toFixed(2),
          overtimeHours: stats.overtimeHours.toFixed(2),
          presentDays: stats.presentDays,
          absentDays: stats.absentDays,
          attendanceRate: (stats.presentDays + stats.absentDays) > 0 
            ? (stats.presentDays / (stats.presentDays + stats.absentDays)) * 100 
            : 0,
        });
      }

      statistics = { weekly: weeklyData.reverse() }; // Reverse to show most recent first
    }

    res.status(200).json({
      success: true,
      data: {
        period,
        year: currentYear,
        statistics,
      },
    });
  } catch (err) {
    console.error("Get attendance statistics error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance statistics",
      error: err.message,
    });
  }
};