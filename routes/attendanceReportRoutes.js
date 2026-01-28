import express from "express"
import { generateAttendanceReport, getAttendanceSummary } from "../controllers/attendanceReportController.js"
import { protect, authorize } from "../middlewares/auth.js"

const router = express.Router()

router.use(protect)

// Generate attendance report (CSV export)
router.post("/generate-report", authorize("admin", "super_admin"), generateAttendanceReport)

// Get attendance summary for a month
router.get("/summary", getAttendanceSummary)

export default router
