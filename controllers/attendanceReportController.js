import Attendance from "../models/Attendance.js"
import { fileStorageService } from "../utils/fileStorage.js"
import fs from "fs"
import path from "path"

/* =========================
   Generate Attendance Report (CSV/Excel export)
========================= */
export const generateAttendanceReport = async (req, res) => {
  try {
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    const { startDate, endDate, userId, format = "csv" } = req.body

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      })
    }

    const filter = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }

    if (userId) {
      filter.user = userId
    }

    const attendanceRecords = await Attendance.find(filter).populate("user", "name email department").sort({ date: 1 })

    if (attendanceRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found for the given period",
      })
    }

    if (format === "csv") {
      const csvHeader = "Date,Employee Name,Email,Department,Status,Punch In,Punch Out,Total Hours,Overtime Hours\n"

      const csvRows = attendanceRecords.map((record) => {
        const punchIn = record.punchInTime ? new Date(record.punchInTime).toLocaleString() : "N/A"
        const punchOut = record.punchOutTime ? new Date(record.punchOutTime).toLocaleString() : "N/A"
        const totalHours = record.totalHours || 0
        const overtimeHours = record.overtimeHours || 0

        return `"${record.date.toLocaleDateString()}","${record.user.name}","${record.user.email}","${record.user.department}","${record.status}","${punchIn}","${punchOut}","${totalHours}","${overtimeHours}"`
      })

      const csvContent = csvHeader + csvRows.join("\n")

      const reportDir = "uploads/attendance"
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true })
      }

      const fileName = `attendance_report_${Date.now()}.csv`
      const filePath = path.join(reportDir, fileName)
      fs.writeFileSync(filePath, csvContent)

      // Cache report metadata
      const fileMetadata = {
        originalName: fileName,
        fileName,
        filePath,
        fileSize: csvContent.length,
        mimeType: "text/csv",
        category: "attendance",
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
        downloadCount: 0,
        recordCount: attendanceRecords.length,
        period: `${startDate} to ${endDate}`,
      }

      const fileId = `attendance_report_${Date.now()}`
      fileStorageService.saveToLocalStorage(fileId, fileMetadata)

      res.setHeader("Content-Type", "text/csv")
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`)
      res.send(csvContent)
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error generating attendance report",
      error: err.message,
    })
  }
}

/* =========================
   Get Attendance Summary with file cache
========================= */
export const getAttendanceSummary = async (req, res) => {
  try {
    const { month, year } = req.query
    const userId = req.user.role === "user" ? req.user._id : req.query.userId

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const records = await Attendance.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    })

    const summary = {
      present: records.filter((r) => r.status === "present").length,
      absent: records.filter((r) => r.status === "absent").length,
      halfDay: records.filter((r) => r.status === "half-day").length,
      holiday: records.filter((r) => r.status === "holiday").length,
      onLeave: records.filter((r) => r.status === "on-leave").length,
      totalOvertimeHours: records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0),
      totalOvertimeAmount: records.reduce((sum, r) => sum + (r.overtimeAmount || 0), 0),
    }

    res.status(200).json({
      success: true,
      month,
      year,
      data: summary,
      recordCount: records.length,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching attendance summary",
      error: err.message,
    })
  }
}
