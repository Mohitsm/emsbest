// // import mongoose from "mongoose"

// // /* =========================
// //    MongoDB Connection Setup
// // ========================= */
// // export const connectDB = async () => {
// //   try {
// //     const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ems_db"

// //     console.log("[v0] Attempting to connect to MongoDB...")

// //     const conn = await mongoose.connect(MONGO_URI, {
// //       maxPoolSize: 10,
// //       minPoolSize: 5,
// //       serverSelectionTimeoutMS: 5000,
// //       socketTimeoutMS: 45000,
// //       retryWrites: true,
// //       w: "majority",
// //       heartbeatFrequencyMS: 10000,
// //     })

// //     console.log(`[v0] MongoDB connected: ${conn.connection.host}`)
// //     console.log(`[v0] Database: ${conn.connection.name}`)
// //     return conn
// //   } catch (error) {
// //     console.error("[v0] Database connection error:", error.message)
// //     process.exit(1)
// //   }
// // }

// // /* =========================
// //    Disconnect Database
// // ========================= */
// // export const disconnectDB = async () => {
// //   try {
// //     await mongoose.disconnect()
// //     console.log("[v0] MongoDB disconnected")
// //   } catch (error) {
// //     console.error("[v0] Error disconnecting from database:", error.message)
// //   }
// // }

// // /* =========================
// //    Get Connection Status
// // ========================= */
// // export const getConnectionStatus = () => {
// //   const state = mongoose.connection.readyState
// //   const states = {
// //     0: "disconnected",
// //     1: "connected",
// //     2: "connecting",
// //     3: "disconnecting",
// //   }
// //   return states[state] || "unknown"
// // }

// // /* =========================
// //    Health Check
// // ========================= */
// // export const healthCheck = async () => {
// //   try {
// //     const admin = mongoose.connection.db.admin()
// //     const status = await admin.ping()
// //     return {
// //       status: "healthy",
// //       database: "mongodb",
// //       connection: getConnectionStatus(),
// //       timestamp: new Date().toISOString(),
// //     }
// //   } catch (error) {
// //     return {
// //       status: "unhealthy",
// //       database: "mongodb",
// //       error: error.message,
// //       timestamp: new Date().toISOString(),
// //     }
// //   }
// // }

// // export default {
// //   connectDB,
// //   disconnectDB,
// //   getConnectionStatus,
// //   healthCheck,
// // }
// // config/database.js
// import mongoose from "mongoose";
// import Attendance from "../models/Attendance.js"; // Make sure the path is correct

// /* =========================
//    MongoDB Connection Setup
// ========================= */
// export const connectDB = async () => {
//   try {
//     const MONGO_URI =
//       process.env.MONGODB_URI || "mongodb://localhost:27017/ems_db";

//     console.log("[v0] Attempting to connect to MongoDB...");

//     const conn = await mongoose.connect(MONGO_URI, {
//       maxPoolSize: 10,
//       minPoolSize: 5,
//       serverSelectionTimeoutMS: 5000,
//       socketTimeoutMS: 45000,
//       retryWrites: true,
//       w: "majority",
//       heartbeatFrequencyMS: 10000,
//     });

//     console.log(`[v0] MongoDB connected: ${conn.connection.host}`);
//     console.log(`[v0] Database: ${conn.connection.name}`);

//     // ───────────────────────────────────────────────────────────────
//     // Safely ensure the correct index exists (without crashing on name mismatch)
//     // ───────────────────────────────────────────────────────────────
//     try {
//       // First try the preferred method
//       const syncResult = await Attendance.syncIndexes();
//       console.log("[v0] Attendance indexes sync result:", syncResult);
//     } catch (syncErr) {
//       console.warn("[v0] syncIndexes warning:", syncErr.message);

//       // Fallback: try to create explicitly (MongoDB will ignore if keys already exist)
//       try {
//         await Attendance.createIndex(
//           { userId: 1, date: 1 },
//           { unique: true, name: "userId_1_date_1" }
//         );
//         console.log("[v0] Explicitly created/verified userId_1_date_1 index");
//       } catch (createErr) {
//         if (createErr.code === 85) {
//           // Index already exists with different options/name → safe to ignore in most cases
//           console.log(
//             "[v0] Index on {userId,date} already exists (code 85) - continuing"
//           );
//         } else {
//           console.error("[v0] createIndex failed:", createErr.message);
//           throw createErr; // only re-throw if it's a real problem
//         }
//       }
//     }

//     return conn;
//   } catch (error) {
//     console.error("[v0] Database connection error:", error.message);
//     process.exit(1);
//   }
// };

// /* =========================
//    Disconnect Database
// ========================= */
// export const disconnectDB = async () => {
//   try {
//     await mongoose.disconnect();
//     console.log("[v0] MongoDB disconnected");
//   } catch (error) {
//     console.error("[v0] Error disconnecting from database:", error.message);
//   }
// };

// /* =========================
//    Get Connection Status
// ========================= */
// export const getConnectionStatus = () => {
//   const state = mongoose.connection.readyState;
//   const states = {
//     0: "disconnected",
//     1: "connected",
//     2: "connecting",
//     3: "disconnecting",
//   };
//   return states[state] || "unknown";
// };

// /* =========================
//    Health Check
// ========================= */
// export const healthCheck = async () => {
//   try {
//     const admin = mongoose.connection.db.admin();
//     const status = await admin.ping();
//     return {
//       status: "healthy",
//       database: "mongodb",
//       connection: getConnectionStatus(),
//       timestamp: new Date().toISOString(),
//     };
//   } catch (error) {
//     return {
//       status: "unhealthy",
//       database: "mongodb",
//       error: error.message,
//       timestamp: new Date().toISOString(),
//     };
//   }
// };

// export default {
//   connectDB,
//   disconnectDB,
//   getConnectionStatus,
//   healthCheck,
// };

import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import LeaveType from "../models/LeaveType.js"; // Make sure the path is correct

/* =========================
   MongoDB Connection Setup
========================= */
export const connectDB = async () => {
  try {
    const MONGO_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/ems_db";

    console.log("[v0] Attempting to connect to MongoDB...");

    const conn = await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: "majority",
      heartbeatFrequencyMS: 10000,
    });

    console.log(`[v0] MongoDB connected: ${conn.connection.host}`);
    console.log(`[v0] Database: ${conn.connection.name}`);

    // ───────────────────────────────────────────────────────────────
    // Safely ensure the correct index exists for Attendance (without crashing on name mismatch)
    // ───────────────────────────────────────────────────────────────
    try {
      // First try the preferred method
      const syncResult = await Attendance.syncIndexes();
      console.log("[v0] Attendance indexes sync result:", syncResult);
    } catch (syncErr) {
      console.warn("[v0] syncIndexes warning for Attendance:", syncErr.message);

      // Fallback: try to create explicitly (MongoDB will ignore if keys already exist)
      try {
        await Attendance.createIndex(
          { userId: 1, date: 1 },
          { unique: true, name: "userId_1_date_1" }
        );
        console.log("[v0] Explicitly created/verified userId_1_date_1 index for Attendance");
      } catch (createErr) {
        if (createErr.code === 85) {
          // Index already exists with different options/name → safe to ignore in most cases
          console.log(
            "[v0] Index on {userId,date} already exists for Attendance (code 85) - continuing"
          );
        } else {
          console.error("[v0] createIndex failed for Attendance:", createErr.message);
          throw createErr; // only re-throw if it's a real problem
        }
      }
    }

    // ───────────────────────────────────────────────────────────────
    // Safely ensure the correct index exists for LeaveType (without crashing on name mismatch)
    // ───────────────────────────────────────────────────────────────
    try {
      // First try the preferred method
      const leaveTypeSyncResult = await LeaveType.syncIndexes();
      console.log("[v0] LeaveType indexes sync result:", leaveTypeSyncResult);
    } catch (syncErr) {
      console.warn("[v0] syncIndexes warning for LeaveType:", syncErr.message);

      // Fallback: try to create explicitly (MongoDB will ignore if keys already exist)
      try {
        await LeaveType.createIndex(
          { name: 1, company: 1 },
          { unique: true, name: "name_1_company_1" }
        );
        console.log("[v0] Explicitly created/verified name_1_company_1 index for LeaveType");
      } catch (createErr) {
        if (createErr.code === 85) {
          // Index already exists with different options/name → safe to ignore in most cases
          console.log(
            "[v0] Index on {name,company} already exists for LeaveType (code 85) - continuing"
          );
        } else {
          console.error("[v0] createIndex failed for LeaveType:", createErr.message);
          throw createErr; // only re-throw if it's a real problem
        }
      }
    }

    return conn;
  } catch (error) {
    console.error("[v0] Database connection error:", error.message);
    process.exit(1);
  }
};

/* =========================
   Disconnect Database
========================= */
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("[v0] MongoDB disconnected");
  } catch (error) {
    console.error("[v0] Error disconnecting from database:", error.message);
  }
};

/* =========================
   Get Connection Status
========================= */
export const getConnectionStatus = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[state] || "unknown";
};

/* =========================
   Health Check
========================= */
export const healthCheck = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    const status = await admin.ping();
    return {
      status: "healthy",
      database: "mongodb",
      connection: getConnectionStatus(),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      database: "mongodb",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

export default {
  connectDB,
  disconnectDB,
  getConnectionStatus,
  healthCheck,
};