
import express from "express"
import {
  createLeaveType,
  getLeaveTypes,
  applyLeave,
  getLeaveBalance,
  getMyLeaves,
  getAllLeaveRequests,
  updateLeaveStatus,
  getLeavesByAdminId,
  getLeavesApprovedByAdmin,
  getLeaveStats,
  getLeaveById,
  updateLeave,
  cancelLeave
} from "../controllers/leaveController.js"
import { protect, authorize } from "../middlewares/auth.js"

const router = express.Router()

// Apply protect middleware to all routes
router.use(protect)

// Leave types (Admin)
router.post("/types", authorize("admin", "super_admin"), createLeaveType)
router.get("/types", getLeaveTypes)

// Leave requests (User)
router.post("/apply", applyLeave)
router.get("/balance", getLeaveBalance)
router.get("/my-leaves", getMyLeaves)
router.get("/stats", getLeaveStats)
router.get("/:id", getLeaveById)
router.put("/:id", updateLeave)
router.delete("/:id", cancelLeave)

// Admin routes
router.get("/admin/all", authorize("admin", "super_admin"), getAllLeaveRequests)
router.put("/:id/status", authorize("admin", "super_admin"), updateLeaveStatus)
router.get("/admin/approved-by/:adminId", authorize("admin", "super_admin"), getLeavesApprovedByAdmin)
router.get("/admin/:adminId", authorize("super_admin"), getLeavesByAdminId) // Super admin only

export default router