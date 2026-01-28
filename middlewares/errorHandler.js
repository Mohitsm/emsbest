import { log } from "../config/index.js"

/* =========================
   Error Handler Middleware
========================= */
export const errorHandler = (err, req, res, next) => {
  log.error("Error occurred:", err.message)

  const statusCode = err.statusCode || 500
  const message = err.message || "Internal Server Error"

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack, details: err }),
  })
}

/* =========================
   Async Handler Wrapper
========================= */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

/* =========================
   Custom Error Class
========================= */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

export default errorHandler
