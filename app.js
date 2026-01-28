
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import config
import { connectDB, disconnectDB, healthCheck } from "./config/database.js";
import { validateEnv, getEnv } from "./config/environment.js";
import log from "./config/logger.js";
import constants from "./config/constants.js";

// Import routes
import attendanceRoutes from "./routes/attendanceRoutes.js";
import holidayRoutes from "./routes/holidayRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import documentRoutes from "./routes/DocumentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import advancePaymentRoutes from "./routes/advancePaymentRoutes.js";
import reimbursementRoutes from './routes/reimbursementRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
// Initialize express app
const app = express();

app.use(express.json());
app.use('/uploads', express.static('uploads'));

validateEnv();
const env = getEnv();

/* =========================
   MIDDLEWARE
========================= */
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/* =========================
   Health Check Endpoint
========================= */
app.get("/api/health", async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    res.status(200).json({
      success: true,
      message: "Server is healthy",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      port: env.PORT,
      database: dbHealth,
    });
  } catch (error) {
    log.error("Health check failed:", error.message);
    res.status(503).json({
      success: false,
      message: "Service unavailable",
      error: error.message,
    });
  }
});

/* =========================
   API ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/super-admin", superAdminRoutes);

app.use("/api/holidays", holidayRoutes);

app.use("/api/documents", documentRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/advance-payments", advancePaymentRoutes)
app.use('/api/reimbursements', reimbursementRoutes);
app.use('/api/announcements', announcementRoutes);

/* =========================
   Global Error Handler
========================= */
app.use((err, req, res, next) => {
  log.error("Global error handler:", err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || constants.ERROR_MESSAGES.SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.isDevelopment && { stack: err.stack }),
  });
});

/* =========================
   404 Handler
========================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

/* =========================
   Database Connection & Server Startup
========================= */
const startServer = async () => {
  try {
    log.info("Starting Employee Management System...");
    log.info(`Environment: ${env.NODE_ENV}`);
    log.info(`MongoDB URI: ${env.MONGODB_URI.substring(0, 30)}...`);

    // Connect to MongoDB
    await connectDB();
    log.success("Database connected successfully");

    // Start server
    app.listen(env.PORT, () => {
      log.success(`Server is running on port ${env.PORT}`);
      log.info(`Client URL configured: ${env.CLIENT_URL}`);
      log.info(`CORS Origin: ${env.CORS_ORIGIN}`);
      log.info(`\nAPI Health Check: http://localhost:${env.PORT}/api/health`);
      log.info("Ready to accept requests...\n");
    });
  } catch (error) {
    log.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  log.warn("SIGTERM signal received: closing HTTP server");
  await disconnectDB();
  process.exit(0);
});

process.on("SIGINT", async () => {
  log.warn("SIGINT signal received: closing HTTP server");
  await disconnectDB();
  process.exit(0);
});

// Start the application
startServer();

export default app;