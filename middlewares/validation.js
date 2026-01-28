import validator from "validator"

/* =========================
   Input Validation Helpers
========================= */
export const validateEmail = (email) => {
  return validator.isEmail(email)
}

export const validatePassword = (password) => {
  // Min 8 chars, at least one uppercase, one lowercase, one number
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(password)
}

export const validatePhone = (phone) => {
  return validator.isMobilePhone(phone)
}

export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input
  return validator.trim(validator.escape(input))
}

export const validateAttendanceHours = (hours) => {
  const validHours = [8, 8.75, 9, 12]
  return validHours.includes(Number.parseFloat(hours))
}

export const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return start <= end
}

export default {
  validateEmail,
  validatePassword,
  validatePhone,
  sanitizeInput,
  validateAttendanceHours,
  validateDateRange,
}
