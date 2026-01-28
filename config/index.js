/* =========================
   Centralized Config Export
========================= */
import { connectDB, disconnectDB, getConnectionStatus, healthCheck } from "./database.js"
import { validateEnv, getEnv } from "./environment.js"
import log from "./logger.js"
import constants from "./constants.js"

export default {
  database: {
    connectDB,
    disconnectDB,
    getConnectionStatus,
    healthCheck,
  },
  environment: {
    validateEnv,
    getEnv,
  },
  log,
  constants,
}

// Or export individually
export { connectDB, disconnectDB, getConnectionStatus, healthCheck, validateEnv, getEnv, log, constants }
