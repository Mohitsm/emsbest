// import express from "express"
// import fs from "fs"
// import path from "path"
// import { protect } from "../middlewares/auth.js"
// import { fileStorageService } from "../utils/fileStorage.js"

// const router = express.Router()

// router.use(protect)

// /* =========================
//    Download File
// ========================= */
// router.get("/download/:encodedPath", async (req, res) => {
//   try {
//     const { filePath: encodedPath } = req.params
//     const decodedPath = Buffer.from(encodedPath, "base64").toString("utf-8")
//     const absolutePath = path.resolve(decodedPath)

//     // Security: prevent path traversal
//     if (!absolutePath.startsWith(path.resolve("uploads"))) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied",
//       })
//     }

//     if (!fs.existsSync(absolutePath)) {
//       return res.status(404).json({
//         success: false,
//         message: "File not found",
//       })
//     }

//     const fileName = path.basename(absolutePath)
//     res.download(absolutePath, fileName)
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Error downloading file",
//       error: err.message,
//     })
//   }
// })

// /* =========================
//    Get File Info from Cache
// ========================= */
// router.get("/info/:fileId", async (req, res) => {
//   try {
//     const { fileId } = req.params
//     const cachedData = fileStorageService.getFromLocalStorage(fileId)

//     if (!cachedData) {
//       return res.status(404).json({
//         success: false,
//         message: "File information not found in cache",
//       })
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         ...cachedData,
//         isExpired: new Date(cachedData.cacheExpiry) <= new Date(),
//       },
//     })
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching file info",
//       error: err.message,
//     })
//   }
// })

// /* =========================
//    Get User File Statistics
// ========================= */
// router.get("/stats/user", async (req, res) => {
//   try {
//     const userId = req.user._id

//     // Get all cached files for user
//     const totalSize = 0
//     const fileCount = 0
//     const fileTypes = {}

//     // In production, implement proper file tracking in database
//     // This is a simplified version using cache

//     res.status(200).json({
//       success: true,
//       data: {
//         userId,
//         totalFiles: fileCount,
//         totalSize,
//         byType: fileTypes,
//       },
//     })
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching file statistics",
//       error: err.message,
//     })
//   }
// })

// export default router
import express from "express"
import fs from "fs"
import path from "path"
import mime from "mime-types"
import { protect } from "../middlewares/auth.js"
import { fileStorageService } from "../utils/fileStorage.js"

const router = express.Router()

// 🔐 Protect all routes
router.use(protect)

/* =========================
   PREVIEW / DOWNLOAD FILE
   Images & PDFs → Preview
   Others → Download
========================= */
router.get("/download/:encodedPath", async (req, res) => {
  try {
    const { encodedPath } = req.params
    const { download } = req.query // 👈 IMPORTANT

    const decodedPath = Buffer.from(encodedPath, "base64").toString("utf-8")
    const absolutePath = path.resolve(decodedPath)

    // 🔐 Security check
    const uploadsDir = path.resolve("uploads")
    if (!absolutePath.startsWith(uploadsDir)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      })
    }

    const fileName = path.basename(absolutePath)
    const mimeType = mime.lookup(absolutePath) || "application/octet-stream"

    // ⬇️ FORCE DOWNLOAD (IMAGES INCLUDED)
    if (download === "true") {
      res.setHeader("Content-Type", mimeType)
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      )
      return res.sendFile(absolutePath)
    }

    // 👁️ PREVIEW (IMAGE / PDF)
    if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
      res.setHeader("Content-Type", mimeType)
      res.setHeader("Content-Disposition", "inline")
      return res.sendFile(absolutePath)
    }

    // DEFAULT → DOWNLOAD
    return res.download(absolutePath)
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "File access error",
      error: err.message,
    })
  }
})

/* =========================
   GET FILE INFO FROM CACHE
========================= */
router.get("/info/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params

    const cachedData = fileStorageService.getFromLocalStorage(fileId)

    if (!cachedData) {
      return res.status(404).json({
        success: false,
        message: "File info not found in cache",
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        ...cachedData,
        isExpired: new Date(cachedData.cacheExpiry) <= new Date(),
      },
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching file info",
      error: err.message,
    })
  }
})

/* =========================
   USER FILE STATISTICS
========================= */
router.get("/stats/user", async (req, res) => {
  try {
    const userId = req.user._id

    // ⚠️ Example only – real apps should track in DB
    let totalFiles = 0
    let totalSize = 0
    let byType = {}

    const uploadsDir = path.resolve("uploads")

    const walk = (dir) => {
      const files = fs.readdirSync(dir)
      for (const file of files) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          walk(fullPath)
        } else {
          totalFiles++
          totalSize += stat.size
          const ext = path.extname(file) || "unknown"
          byType[ext] = (byType[ext] || 0) + 1
        }
      }
    }

    if (fs.existsSync(uploadsDir)) {
      walk(uploadsDir)
    }

    return res.status(200).json({
      success: true,
      data: {
        userId,
        totalFiles,
        totalSize,
        byType,
      },
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching file statistics",
      error: err.message,
    })
  }
})

export default router
