
import express from "express";
import {
  punchIn,
  punchOut,
  getTodayAttendance,
  getAttendanceByDateRange,
  getAllEmployeesAttendance,
  updateAttendance,
  createManualAttendance,
  deleteAttendance,
  getAttendanceSummary,
  getAttendanceStatistics,
} from "../controllers/attendanceController.js";

import {
  getAttendanceByAdminId,
  getMonthlyAttendanceReport,
} from "../controllers/adminAttendanceController.js";

import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// ==================== User Routes ====================
router.post("/punch-in", punchIn);
router.post("/punch-out", punchOut);
router.get("/today", getTodayAttendance);
router.get("/", getAttendanceByDateRange);
 router.get("/summary", getAttendanceSummary);
router.get("/statistics", getAttendanceStatistics);

// ==================== Admin Routes ====================
// Get attendance for admin's managed users
router.get(
  "/admin/my-users",
  authorize("admin", "super_admin"),
  getAttendanceByAdminId
);

// Get monthly report for admin's users
router.get(
  "/admin/monthly-report",
  authorize("admin", "super_admin"),
  getMonthlyAttendanceReport
);

// Get all employees attendance (with filters)
router.get(
  "/admin/all",
  authorize("admin", "super_admin"),
  getAllEmployeesAttendance
);

// Create manual attendance record
router.post(
  "/admin/create",
  authorize("admin", "super_admin"),
  createManualAttendance
);

// Update specific attendance record
router.put(
  "/:id",
  authorize("admin", "super_admin"),
  updateAttendance
);

// Delete attendance record
router.delete(
  "/:id",
  authorize("admin", "super_admin"),
  deleteAttendance
);

export default router;