import { v4 as uuidv4 } from "uuid"

/* =========================
   Helper Functions
========================= */
export const generateUniqueId = () => uuidv4()

export const getCurrentMonthRange = () => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { startOfMonth, endOfMonth }
}

export const calculateHoursWorked = (punchIn, punchOut, lunchDuration = 1) => {
  const msPerHour = 1000 * 60 * 60
  const diffMs = new Date(punchOut) - new Date(punchIn)
  const hours = diffMs / msPerHour
  return Math.max(0, hours - lunchDuration)
}

export const calculateOvertime = (hoursWorked, standardHours) => {
  return Math.max(0, hoursWorked - standardHours)
}

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export const isHoliday = (date, holidays) => {
  const checkDate = new Date(date).toDateString()
  return holidays.some((holiday) => new Date(holiday.date).toDateString() === checkDate)
}

export const isLeaveDate = (date, leaveRecords) => {
  const checkDate = new Date(date).toDateString()
  return leaveRecords.some((leave) => {
    const start = new Date(leave.startDate).toDateString()
    const end = new Date(leave.endDate).toDateString()
    return checkDate >= start && checkDate <= end
  })
}

export const calculateLeaveDays = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // Include both start and end date
}

export const generatePayrollSummary = (attendance, leaves, holidays, salary) => {
  const totalDays = 30 // Approximate
  const presentDays = attendance.filter((a) => a.status === "present").length
  const absentDays = attendance.filter((a) => a.status === "absent").length
  const halfDays = attendance.filter((a) => a.status === "half_day").length
  const leaveDays = leaves.filter((l) => l.status === "approved").length
  const holidayDays = holidays.length

  const workingDays = presentDays + halfDays * 0.5
  const attendancePercentage = (workingDays / (totalDays - holidayDays - leaveDays)) * 100

  return {
    presentDays,
    absentDays,
    halfDays,
    leaveDays,
    holidayDays,
    workingDays,
    attendancePercentage: attendancePercentage.toFixed(2),
  }
}

export const calculateNetSalary = (basicSalary, allowances = {}, deductions = {}) => {
  const totalAllowances = Object.values(allowances).reduce((a, b) => a + b, 0)
  const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0)

  const grossSalary = basicSalary + totalAllowances
  const netSalary = grossSalary - totalDeductions

  return {
    basicSalary,
    totalAllowances,
    grossSalary,
    totalDeductions,
    netSalary,
  }
}

export default {
  generateUniqueId,
  getCurrentMonthRange,
  calculateHoursWorked,
  calculateOvertime,
  formatDate,
  formatDateTime,
  isHoliday,
  isLeaveDate,
  calculateLeaveDays,
  generatePayrollSummary,
  calculateNetSalary,
}
