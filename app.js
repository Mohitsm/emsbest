
// // import express from "express";
// // import bodyParser from "body-parser";
// // import cors from "cors";
// // import dotenv from "dotenv";

// // // Load environment variables
// // dotenv.config();

// // // Import config
// // import { connectDB, disconnectDB, healthCheck } from "./config/database.js";
// // import { validateEnv, getEnv } from "./config/environment.js";
// // import log from "./config/logger.js";
// // import constants from "./config/constants.js";

// // // Import routes
// // import attendanceRoutes from "./routes/attendanceRoutes.js";
// // import holidayRoutes from "./routes/holidayRoutes.js";
// // import leaveRoutes from "./routes/leaveRoutes.js";
// // import payrollRoutes from "./routes/payrollRoutes.js";
// // import documentRoutes from "./routes/documentRoutes.js";
// // import authRoutes from "./routes/authRoutes.js";
// // import userRoutes from "./routes/userRoutes.js";
// // import adminRoutes from "./routes/adminRoutes.js";
// // import superAdminRoutes from "./routes/superAdminRoutes.js";
// // import fileRoutes from "./routes/fileRoutes.js";
// // import salaryRoutes from "./routes/salaryRoutes.js";
// // import advancePaymentRoutes from "./routes/advancePaymentRoutes.js";
// // import reimbursementRoutes from './routes/reimbursementRoutes.js';
// // import announcementRoutes from './routes/announcementRoutes.js';
// // import profileRoutes from './routes/profileRoutes.js';
// // // Initialize express app
// // const app = express();

// // app.use(express.json());
// // app.use('/uploads', express.static('uploads'));



// // validateEnv();
// // const env = getEnv();

// // /* =========================
// //    MIDDLEWARE
// // ========================= */
// // app.use(bodyParser.json({ limit: "50mb" }));
// // app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
// // app.use(
// //   cors({
// //     origin: env.CORS_ORIGIN,
// //     credentials: true,
// //     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
// //     allowedHeaders: ["Content-Type", "Authorization"],
// //   }),
// // );

// // /* =========================
// //    Health Check Endpoint
// // ========================= */
// // app.get("/api/health", async (req, res) => {
// //   try {
// //     const dbHealth = await healthCheck();
// //     res.status(200).json({
// //       success: true,
// //       message: "Server is healthy",
// //       timestamp: new Date().toISOString(),
// //       environment: env.NODE_ENV,
// //       port: env.PORT,
// //       database: dbHealth,
// //     });
// //   } catch (error) {
// //     log.error("Health check failed:", error.message);
// //     res.status(503).json({
// //       success: false,
// //       message: "Service unavailable",
// //       error: error.message,
// //     });
// //   }
// // });

// // /* =========================
// //    API ROUTES
// // ========================= */
// // app.use("/api/auth", authRoutes);
// // app.use("/api/users", userRoutes);
// // app.use("/api/admin", adminRoutes);
// // app.use("/api/super-admin", superAdminRoutes);

// // app.use("/api/holidays", holidayRoutes);

// // app.use("/api/documents", documentRoutes);
// // app.use("/api/files", fileRoutes);
// // app.use("/api/attendance", attendanceRoutes);
// // app.use("/api/leaves", leaveRoutes);
// // app.use("/api/salary", salaryRoutes);
// // app.use("/api/payroll", payrollRoutes);
// // app.use("/api/advance-payments", advancePaymentRoutes)
// // app.use('/api/reimbursements', reimbursementRoutes);
// // app.use('/api/announcements', announcementRoutes);
// // app.use('/api/profiles', profileRoutes);
// // /* =========================
// //    Global Error Handler
// // ========================= */
// // app.use((err, req, res, next) => {
// //   log.error("Global error handler:", err.message);

// //   const statusCode = err.statusCode || 500;
// //   const message = err.message || constants.ERROR_MESSAGES.SERVER_ERROR;

// //   res.status(statusCode).json({
// //     success: false,
// //     message,
// //     ...(env.isDevelopment && { stack: err.stack }),
// //   });
// // });

// // /* =========================
// //    404 Handler
// // ========================= */
// // app.use((req, res) => {
// //   res.status(404).json({
// //     success: false,
// //     message: `Route ${req.method} ${req.path} not found`,
// //   });
// // });

// // /* =========================
// //    Database Connection & Server Startup
// // ========================= */
// // const startServer = async () => {
// //   try {
// //     log.info("Starting Employee Management System...");
// //     log.info(`Environment: ${env.NODE_ENV}`);
// //     log.info(`MongoDB URI: ${env.MONGODB_URI.substring(0, 30)}...`);

// //     // Connect to MongoDB
// //     await connectDB();
// //     log.success("Database connected successfully");

// //     // Start server
// //     app.listen(env.PORT, () => {
// //       log.success(`Server is running on port ${env.PORT}`);
// //       log.info(`Client URL configured: ${env.CLIENT_URL}`);
// //       log.info(`CORS Origin: ${env.CORS_ORIGIN}`);
// //       log.info(`\nAPI Health Check: http://localhost:${env.PORT}/api/health`);
// //       log.info("Ready to accept requests...\n");
// //     });
// //   } catch (error) {
// //     log.error("Failed to start server:", error.message);
// //     process.exit(1);
// //   }
// // };

// // // Handle graceful shutdown
// // process.on("SIGTERM", async () => {
// //   log.warn("SIGTERM signal received: closing HTTP server");
// //   await disconnectDB();
// //   process.exit(0);
// // });

// // process.on("SIGINT", async () => {
// //   log.warn("SIGINT signal received: closing HTTP server");
// //   await disconnectDB();
// //   process.exit(0);
// // });

// // // Start the application
// // startServer();

// // export default app;

// import express from "express";
// import bodyParser from "body-parser";
// import cors from "cors";
// import dotenv from "dotenv";
// import path from "path";
// import { fileURLToPath } from "url";

// // Load environment variables
// dotenv.config();

// // Import config
// import { connectDB, disconnectDB, healthCheck } from "./config/database.js";
// import { validateEnv, getEnv } from "./config/environment.js";
// import log from "./config/logger.js";
// import constants from "./config/constants.js";

// // Import routes
// import attendanceRoutes from "./routes/attendanceRoutes.js";
// import holidayRoutes from "./routes/holidayRoutes.js";
// import leaveRoutes from "./routes/leaveRoutes.js";
// import payrollRoutes from "./routes/payrollRoutes.js";
// import documentRoutes from "./routes/documentRoutes.js";
// import authRoutes from "./routes/authRoutes.js";
// import userRoutes from "./routes/userRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";
// import superAdminRoutes from "./routes/superAdminRoutes.js";
// import fileRoutes from "./routes/fileRoutes.js";
// import salaryRoutes from "./routes/salaryRoutes.js";
// import advancePaymentRoutes from "./routes/advancePaymentRoutes.js";
// import reimbursementRoutes from './routes/reimbursementRoutes.js';
// import announcementRoutes from './routes/announcementRoutes.js';
// import profileRoutes from './routes/profileRoutes.js';

// // Initialize express app
// const app = express();

// // Get directory name in ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Validate environment variables
// validateEnv();
// const env = getEnv();

// /* =========================
//    MIDDLEWARE
// ========================= */
// app.use(bodyParser.json({ limit: "50mb" }));
// app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
// app.use(
//   cors({
//     origin: env.CORS_ORIGIN,
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// // Serve static files - FIXED PATH
// app.use(
//   '/uploads',
//   express.static(path.join(__dirname, 'public', 'uploads'))
// );

// // Create necessary directories
// import fs from 'fs';
// const uploadsDir = path.join(__dirname, 'public', 'uploads');
// const profilesDir = path.join(uploadsDir, 'profiles');

// if (!fs.existsSync(profilesDir)) {
//   fs.mkdirSync(profilesDir, { recursive: true });
//   log.info(`Created uploads directory: ${profilesDir}`);
// }

// /* =========================
//    Health Check Endpoint
// ========================= */
// app.get("/api/health", async (req, res) => {
//   try {
//     const dbHealth = await healthCheck();
//     res.status(200).json({
//       success: true,
//       message: "Server is healthy",
//       timestamp: new Date().toISOString(),
//       environment: env.NODE_ENV,
//       port: env.PORT,
//       database: dbHealth,
//     });
//   } catch (error) {
//     log.error("Health check failed:", error.message);
//     res.status(503).json({
//       success: false,
//       message: "Service unavailable",
//       error: error.message,
//     });
//   }
// });

// /* =========================
//    API ROUTES
// ========================= */
// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/super-admin", superAdminRoutes);
// app.use("/api/holidays", holidayRoutes);
// app.use("/api/documents", documentRoutes);
// app.use("/api/files", fileRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/leaves", leaveRoutes);
// app.use("/api/salary", salaryRoutes);
// app.use("/api/payroll", payrollRoutes);
// app.use("/api/advance-payments", advancePaymentRoutes);
// app.use('/api/reimbursements', reimbursementRoutes);
// app.use('/api/announcements', announcementRoutes);
// app.use('/api/profile', profileRoutes);

// /* =========================
//    Global Error Handler
// ========================= */
// app.use((err, req, res, next) => {
//   log.error("Global error handler:", err.message);

//   const statusCode = err.statusCode || 500;
//   const message = err.message || constants.ERROR_MESSAGES.SERVER_ERROR;

//   res.status(statusCode).json({
//     success: false,
//     message,
//     ...(env.isDevelopment && { stack: err.stack }),
//   });
// });

// /* =========================
//    404 Handler
// ========================= */
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route ${req.method} ${req.path} not found`,
//   });
// });

// /* =========================
//    Database Connection & Server Startup
// ========================= */
// const startServer = async () => {
//   try {
//     log.info("Starting Employee Management System...");
//     log.info(`Environment: ${env.NODE_ENV}`);
//     log.info(`MongoDB URI: ${env.MONGODB_URI.substring(0, 30)}...`);

//     // Connect to MongoDB
//     await connectDB();
//     log.success("Database connected successfully");

//     // Start server
//     app.listen(env.PORT, () => {
//       log.success(`Server is running on port ${env.PORT}`);
//       log.info(`Client URL configured: ${env.CLIENT_URL}`);
//       log.info(`CORS Origin: ${env.CORS_ORIGIN}`);
//       log.info(`Uploads directory: ${profilesDir}`);
//       log.info(`\nAPI Health Check: http://localhost:${env.PORT}/api/health`);
//       log.info(`Profile images will be served from: http://localhost:${env.PORT}/uploads/profiles/`);
//       log.info("Ready to accept requests...\n");
//     });
//   } catch (error) {
//     log.error("Failed to start server:", error.message);
//     process.exit(1);
//   }
// };

// // Handle graceful shutdown
// process.on("SIGTERM", async () => {
//   log.warn("SIGTERM signal received: closing HTTP server");
//   await disconnectDB();
//   process.exit(0);
// });

// process.on("SIGINT", async () => {
//   log.warn("SIGINT signal received: closing HTTP server");
//   await disconnectDB();
//   process.exit(0);
// });

// // Start the application
// startServer();

// export default app;

// app.js or server.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Load environment variables
dotenv.config();

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
import documentRoutes from "./routes/documentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import advancePaymentRoutes from "./routes/advancePaymentRoutes.js";
import reimbursementRoutes from './routes/reimbursementRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import workingHourRoutes from './routes/workingHourRoutes.js';

// Initialize express app
const app = express();

// Validate environment variables
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
  })
);

/* =========================
   STATIC FILE SERVING - CRITICAL FOR FILE UPLOADS
========================= */
// Get project root
const projectRoot = process.cwd();
console.log('\n📂 FILE SERVING CONFIGURATION:');
console.log('Project Root:', projectRoot);

// Create necessary directories
const publicDir = path.join(projectRoot, 'public');
const uploadsDir = path.join(publicDir, 'uploads');
const profilesDir = path.join(uploadsDir, 'profiles');

console.log('Public Directory:', publicDir);
console.log('Uploads Directory:', uploadsDir);
console.log('Profiles Directory:', profilesDir);

// Create directories if they don't exist
[publicDir, uploadsDir, profilesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
});

// Serve static files from public directory
app.use(express.static(publicDir));

// Explicitly serve uploads
app.use('/uploads', express.static(uploadsDir));
app.use('/uploads/profiles', express.static(profilesDir));

console.log('\n🌐 STATIC FILE URLs:');
console.log(`- Base URL: http://localhost:${env.PORT}`);
console.log(`- Uploads URL: http://localhost:${env.PORT}/uploads`);
console.log(`- Profiles URL: http://localhost:${env.PORT}/uploads/profiles`);
console.log('');

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
      staticFiles: {
        publicDir,
        uploadsDir,
        profilesDir,
        filesInProfiles: fs.readdirSync(profilesDir)
      }
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
   Debug Endpoint for File Uploads
========================= */
app.get('/api/debug-uploads', (req, res) => {
  const files = fs.readdirSync(profilesDir);
  
  res.json({
    success: true,
    message: 'File upload debug info',
    data: {
      directories: {
        projectRoot,
        publicDir,
        uploadsDir,
        profilesDir
      },
      fileCount: files.length,
      files: files.map(file => ({
        name: file,
        path: path.join(profilesDir, file),
        url: `http://localhost:${env.PORT}/uploads/profiles/${file}`,
        size: fs.statSync(path.join(profilesDir, file)).size,
        modified: fs.statSync(path.join(profilesDir, file)).mtime
      }))
    }
  });
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
app.use("/api/advance-payments", advancePaymentRoutes);
app.use('/api/reimbursements', reimbursementRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/employee', workingHourRoutes);

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
    console.log('\n🚀 STARTING EMPLOYEE MANAGEMENT SYSTEM');
    console.log(`Environment: ${env.NODE_ENV}`);
    console.log(`Port: ${env.PORT}`);
    
    // Check upload directory
    const files = fs.readdirSync(profilesDir);
    console.log(`Files in uploads directory: ${files.length} files`);
    if (files.length > 0) {
      console.log('Sample files:', files.slice(0, 3));
    }

    // Connect to MongoDB
    await connectDB();
    console.log('✓ Database connected successfully');

    // Start server
    app.listen(env.PORT, () => {
      console.log(`\n✅ SERVER RUNNING ON PORT ${env.PORT}`);
      console.log('\n🔗 IMPORTANT URLs:');
      console.log(`- Health Check: http://localhost:${env.PORT}/api/health`);
      console.log(`- Upload Debug: http://localhost:${env.PORT}/api/debug-uploads`);
      console.log(`- Profile API: http://localhost:${env.PORT}/api/profile`);
      console.log(`- File Upload Test: http://localhost:${env.PORT}/uploads/profiles/test.png`);
      console.log('\n📁 UPLOAD DIRECTORY:');
      console.log(profilesDir);
      console.log('\n🎯 Ready to accept requests...\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log('\n⚠️ SIGTERM signal received: closing HTTP server');
  await disconnectDB();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log('\n⚠️ SIGINT signal received: closing HTTP server');
  await disconnectDB();
  process.exit(0);
});

// Start the application
startServer();

export default app;