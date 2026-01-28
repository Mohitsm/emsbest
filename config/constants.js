/* =========================
   Application Constants
========================= */
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  USER: "user",
}

export const DEPARTMENTS = ["All", "Engineering", "HR", "Sales", "Marketing", "Finance", "Operations"]

export const SHIFTS = [
  "All",
  "Morning (9 AM - 6 PM)",
  "Flexible (10 AM - 7 PM)",
  "Night (7 PM - 4 AM)",
  "General (8 AM - 5 PM)",
]

export const ATTENDANCE_STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  HALF_DAY: "half_day",
  ON_LEAVE: "on_leave",
  HOLIDAY: "holiday",
}

export const LEAVE_TYPES = {
  ANNUAL: "Annual Leave",
  SICK: "Sick Leave",
  CASUAL: "Casual Leave",
  EMERGENCY: "Emergency Leave",
}

export const LEAVE_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
}

export const DOCUMENT_TYPES = [
  "PAN Card",
  "Aadhar Card",
  "10th Marksheet",
  "12th Marksheet",
  "Graduation Marksheet",
  "Other",
]

export const DOCUMENT_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
}

export const PAYROLL_STATUS = {
  DRAFT: "draft",
  FINALIZED: "finalized",
  PAID: "paid",
}

export const WORK_HOURS = {
  EIGHT: 8,
  EIGHT_FORTY_FIVE: 8.75,
  NINE: 9,
  TWELVE: 12,
}

export const LUNCH_BREAK_DURATION = 1 // 1 hour in minutes: 60

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Not authorized to access this route",
  FORBIDDEN: "Access forbidden",
  NOT_FOUND: "Resource not found",
  INVALID_CREDENTIALS: "Invalid credentials",
  INVALID_TOKEN: "Invalid or expired token",
  USER_INACTIVE: "User account is inactive",
  USER_EXISTS: "User already exists",
  SERVER_ERROR: "Server error",
}

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Logged in successfully",
  LOGOUT_SUCCESS: "Logged out successfully",
  CREATED_SUCCESS: "Created successfully",
  UPDATED_SUCCESS: "Updated successfully",
  DELETED_SUCCESS: "Deleted successfully",
  PASSWORD_CHANGED: "Password changed successfully",
}

export default {
  ROLES,
  DEPARTMENTS,
  SHIFTS,
  ATTENDANCE_STATUS,
  LEAVE_TYPES,
  LEAVE_STATUS,
  DOCUMENT_TYPES,
  DOCUMENT_STATUS,
  PAYROLL_STATUS,
  WORK_HOURS,
  LUNCH_BREAK_DURATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
}
