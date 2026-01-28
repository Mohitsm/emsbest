const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "JWT_EXPIRE", "NODE_ENV", "PORT"]

export const validateEnv = () => {
  const missing = requiredEnvVars.filter((env) => !process.env[env])

  if (missing.length > 0) {
    console.error("[v0] Missing required environment variables:", missing)
    process.exit(1)
  }

  console.log("[v0] Environment validation passed")
}

export const getEnv = () => ({
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173", // Added client URL
  MAX_FILE_SIZE: Number.parseInt(process.env.MAX_FILE_SIZE || 5242880), // 5MB default
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
})

export default {
  validateEnv,
  getEnv,
}
