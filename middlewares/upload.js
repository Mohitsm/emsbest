// import multer from "multer"
// import path from "path"
// import fs from "fs"
// import { fileURLToPath } from "url"
// import crypto from "crypto"

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

// // Define upload directories
// const UPLOAD_DIRS = {
//   leave: "uploads/leaves",
//   documents: "uploads/documents",
//   payroll: "uploads/payroll",
//   attendance: "uploads/attendance",
//   profile: "uploads/profile",
// }

// // Initialize directories
// Object.values(UPLOAD_DIRS).forEach((dir) => {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true })
//   }
// })

// // Storage configuration for local disk
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // Determine upload path based on field name
//     let uploadPath = UPLOAD_DIRS.profile

//     if (file.fieldname === "leaveDocument" || file.fieldname === "leaveDocuments") {
//       uploadPath = UPLOAD_DIRS.leave
//     } else if (file.fieldname === "document" || file.fieldname === "documents") {
//       uploadPath = UPLOAD_DIRS.documents
//     } else if (file.fieldname === "payrollFile" || file.fieldname === "payrollFiles") {
//       uploadPath = UPLOAD_DIRS.payroll
//     } else if (file.fieldname === "attendanceFile" || file.fieldname === "attendanceFiles") {
//       uploadPath = UPLOAD_DIRS.attendance
//     }

//     // Ensure directory exists
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true })
//     }

//     cb(null, uploadPath)
//   },
//   filename: (req, file, cb) => {
//     // Generate unique filename with hash
//     const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`
//     const ext = path.extname(file.originalname)
//     const name = path.basename(file.originalname, ext).replace(/\s+/g, "-")
//     cb(null, `${name}-${uniqueSuffix}${ext}`)
//   },
// })

// // Advanced file filter
// const fileFilter = (req, file, cb) => {
//   const allowedMimes = {
//     images: ["image/jpeg", "image/png", "image/gif", "image/webp"],
//     documents: [
//       "application/pdf",
//       "application/msword",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//       "application/vnd.ms-excel",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     ],
//   }

//   const allAllowed = [...allowedMimes.images, ...allowedMimes.documents]

//   if (allAllowed.includes(file.mimetype)) {
//     cb(null, true)
//   } else {
//     cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: PDF, Images (JPG, PNG, GIF), Word, Excel documents`))
//   }
// }

// // Create multer instance
// export const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB
//     files: 5, // Max 5 files per upload
//   },
// })

// // Handle multer errors
// export const handleUploadError = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     if (err.code === "FILE_TOO_LARGE") {
//       return res.status(400).json({
//         success: false,
//         message: "File size exceeds 10MB limit",
//       })
//     }
//     if (err.code === "LIMIT_FILE_COUNT") {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot upload more than 5 files at once",
//       })
//     }
//     return res.status(400).json({
//       success: false,
//       message: `Upload error: ${err.message}`,
//     })
//   } else if (err) {
//     return res.status(400).json({
//       success: false,
//       message: err.message,
//     })
//   }
//   next()
// }

// // File management utilities
// export const fileService = {
//   // Get file URL for serving
//   getFileUrl: (filePath) => {
//     return `/api/files/download/${filePath}`
//   },

//   // Delete file from disk
//   deleteFile: (filePath) => {
//     try {
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath)
//         return true
//       }
//       return false
//     } catch (err) {
//       console.error("[v0] Error deleting file:", err.message)
//       return false
//     }
//   },

//   // Get file info
//   getFileInfo: (filePath) => {
//     try {
//       if (fs.existsSync(filePath)) {
//         const stats = fs.statSync(filePath)
//         return {
//           exists: true,
//           size: stats.size,
//           createdAt: stats.birthtime,
//           modifiedAt: stats.mtime,
//         }
//       }
//       return { exists: false }
//     } catch (err) {
//       console.error("[v0] Error getting file info:", err.message)
//       return { exists: false }
//     }
//   },

//   // Archive old files
//   archiveFile: (filePath, archiveDir = "uploads/archive") => {
//     try {
//       if (!fs.existsSync(archiveDir)) {
//         fs.mkdirSync(archiveDir, { recursive: true })
//       }
//       const fileName = path.basename(filePath)
//       const newPath = path.join(archiveDir, fileName)
//       fs.renameSync(filePath, newPath)
//       return newPath
//     } catch (err) {
//       console.error("[v0] Error archiving file:", err.message)
//       return null
//     }
//   },
// }
import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import crypto from "crypto"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define upload directories
const UPLOAD_DIRS = {
  leave: "uploads/leaves",
  documents: "uploads/documents",
  payroll: "uploads/payroll",
  attendance: "uploads/attendance",
  profile: "uploads/profile",
}

// Initialize directories
Object.values(UPLOAD_DIRS).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// Storage configuration for local disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine upload path based on field name
    let uploadPath = UPLOAD_DIRS.profile

    if (file.fieldname === "leaveDocument" || file.fieldname === "leaveDocuments") {
      uploadPath = UPLOAD_DIRS.leave
    } else if (file.fieldname === "document" || file.fieldname === "documents") {
      uploadPath = UPLOAD_DIRS.documents
    } else if (file.fieldname === "payrollFile" || file.fieldname === "payrollFiles") {
      uploadPath = UPLOAD_DIRS.payroll
    } else if (file.fieldname === "attendanceFile" || file.fieldname === "attendanceFiles") {
      uploadPath = UPLOAD_DIRS.attendance
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }

    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Generate unique filename with hash
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "-")
    cb(null, `${name}-${uniqueSuffix}${ext}`)
  },
})

// Advanced file filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = {
    images: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/bmp"],
    documents: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
      "application/zip",
      "application/x-rar-compressed"
    ],
  }

  const allAllowed = [...allowedMimes.images, ...allowedMimes.documents]

  if (allAllowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: PDF, Images (JPG, PNG, GIF, SVG, BMP), Word, Excel documents`))
  }
}

// Create multer instance
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5, // Max 5 files per upload
  },
})

// Handle multer errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "FILE_TOO_LARGE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds 10MB limit",
      })
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Cannot upload more than 5 files at once",
      })
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    })
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    })
  }
  next()
}

// File management utilities
export const fileService = {
  // Get file URL for serving
  getFileUrl: (filePath) => {
    return `/api/files/download/${filePath}`
  },

  // Delete file from disk
  deleteFile: (filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        return true
      }
      return false
    } catch (err) {
      console.error("[v0] Error deleting file:", err.message)
      return false
    }
  },

  // Get file info
  getFileInfo: (filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath)
        return {
          exists: true,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        }
      }
      return { exists: false }
    } catch (err) {
      console.error("[v0] Error getting file info:", err.message)
      return { exists: false }
    }
  },

  // Archive old files
  archiveFile: (filePath, archiveDir = "uploads/archive") => {
    try {
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true })
      }
      const fileName = path.basename(filePath)
      const newPath = path.join(archiveDir, fileName)
      fs.renameSync(filePath, newPath)
      return newPath
    } catch (err) {
      console.error("[v0] Error archiving file:", err.message)
      return null
    }
  },
}