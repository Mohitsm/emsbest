// import path from "path"
// import { fileURLToPath } from "url"

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

// /**
//  * File Storage Service for Local Storage with LocalStorage Caching
//  */
// export const fileStorageService = {
//   /**
//    * Get relative file path for storage
//    */
//   getStoragePath: (fileName, category = "uploads") => {
//     return path.join(category, fileName)
//   },

//   /**
//    * Generate localStorage metadata key
//    */
//   getLocalStorageKey: (fileId) => {
//     return `file_${fileId}`
//   },

//   /**
//    * Save file metadata to localStorage cache
//    * @param {String} fileId - Unique file ID
//    * @param {Object} metadata - File metadata
//    */
//   saveToLocalStorage: (fileId, metadata) => {
//     try {
//       const key = fileStorageService.getLocalStorageKey(fileId)
//       const data = {
//         id: fileId,
//         ...metadata,
//         cachedAt: new Date().toISOString(),
//         cacheExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
//       }

//       // Simulate localStorage for Node.js (actual localStorage is browser-based)
//       // In production, use Redis or similar
//       if (global.fileStorageCache === undefined) {
//         global.fileStorageCache = {}
//       }
//       global.fileStorageCache[key] = data

//       return data
//     } catch (err) {
//       console.error("[v0] Error saving to localStorage:", err.message)
//       return null
//     }
//   },

//   /**
//    * Get file metadata from cache
//    */
//   getFromLocalStorage: (fileId) => {
//     try {
//       const key = fileStorageService.getLocalStorageKey(fileId)
//       if (global.fileStorageCache && global.fileStorageCache[key]) {
//         const data = global.fileStorageCache[key]
//         // Check if cache is expired
//         if (new Date(data.cacheExpiry) > new Date()) {
//           return data
//         } else {
//           // Remove expired entry
//           delete global.fileStorageCache[key]
//           return null
//         }
//       }
//       return null
//     } catch (err) {
//       console.error("[v0] Error getting from localStorage:", err.message)
//       return null
//     }
//   },

//   /**
//    * Clear file from cache
//    */
//   clearFromLocalStorage: (fileId) => {
//     try {
//       const key = fileStorageService.getLocalStorageKey(fileId)
//       if (global.fileStorageCache && global.fileStorageCache[key]) {
//         delete global.fileStorageCache[key]
//         return true
//       }
//       return false
//     } catch (err) {
//       console.error("[v0] Error clearing from localStorage:", err.message)
//       return false
//     }
//   },

//   /**
//    * Create file object with metadata
//    */
//   createFileObject: (file, category, userId) => {
//     return {
//       originalName: file.originalname,
//       fileName: file.filename,
//       filePath: file.path,
//       fileSize: file.size,
//       mimeType: file.mimetype,
//       category: category,
//       uploadedBy: userId,
//       uploadedAt: new Date(),
//       downloadCount: 0,
//       lastDownloadedAt: null,
//     }
//   },

//   /**
//    * Prepare files for batch processing
//    */
//   processBatchFiles: (files, category, userId) => {
//     if (!files || files.length === 0) return []

//     return files.map((file) => fileStorageService.createFileObject(file, category, userId))
//   },

//   /**
//    * Get file statistics for a user
//    */
//   getUserFileStats: (userId, files) => {
//     return {
//       totalFiles: files.length,
//       totalSize: files.reduce((sum, f) => sum + (f.fileSize || 0), 0),
//       byType: files.reduce((acc, f) => {
//         acc[f.mimeType] = (acc[f.mimeType] || 0) + 1
//         return acc
//       }, {}),
//       oldestFile: files.length > 0 ? Math.min(...files.map((f) => new Date(f.uploadedAt).getTime())) : null,
//       newestFile: files.length > 0 ? Math.max(...files.map((f) => new Date(f.uploadedAt).getTime())) : null,
//     }
//   },

//   /**
//    * Validate file before processing
//    */
//   validateFile: (file, maxSize = 10 * 1024 * 1024) => {
//     const errors = []

//     if (!file) {
//       errors.push("File is required")
//     } else {
//       if (file.size > maxSize) {
//         errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`)
//       }

//       const allowedMimes = [
//         "image/jpeg",
//         "image/png",
//         "image/gif",
//         "image/webp",
//         "application/pdf",
//         "application/msword",
//         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//         "application/vnd.ms-excel",
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       ]

//       if (!allowedMimes.includes(file.mimetype)) {
//         errors.push(`File type ${file.mimetype} is not allowed`)
//       }
//     }

//     return {
//       isValid: errors.length === 0,
//       errors: errors,
//     }
//   },
// }
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * File Storage Service for Local Storage with LocalStorage Caching
 */
export const fileStorageService = {
  /**
   * Get relative file path for storage
   */
  getStoragePath: (fileName, category = "uploads") => {
    return path.join(category, fileName)
  },

  /**
   * Generate localStorage metadata key
   */
  getLocalStorageKey: (fileId) => {
    return `file_${fileId}`
  },

  /**
   * Save file metadata to localStorage cache
   * @param {String} fileId - Unique file ID
   * @param {Object} metadata - File metadata
   */
  saveToLocalStorage: (fileId, metadata) => {
    try {
      const key = fileStorageService.getLocalStorageKey(fileId)
      const data = {
        id: fileId,
        ...metadata,
        cachedAt: new Date().toISOString(),
        cacheExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      }

      // Simulate localStorage for Node.js (actual localStorage is browser-based)
      // In production, use Redis or similar
      if (global.fileStorageCache === undefined) {
        global.fileStorageCache = {}
      }
      global.fileStorageCache[key] = data

      return data
    } catch (err) {
      console.error("[v0] Error saving to localStorage:", err.message)
      return null
    }
  },

  /**
   * Get file metadata from cache
   */
  getFromLocalStorage: (fileId) => {
    try {
      const key = fileStorageService.getLocalStorageKey(fileId)
      if (global.fileStorageCache && global.fileStorageCache[key]) {
        const data = global.fileStorageCache[key]
        // Check if cache is expired
        if (new Date(data.cacheExpiry) > new Date()) {
          return data
        } else {
          // Remove expired entry
          delete global.fileStorageCache[key]
          return null
        }
      }
      return null
    } catch (err) {
      console.error("[v0] Error getting from localStorage:", err.message)
      return null
    }
  },

  /**
   * Clear file from cache
   */
  clearFromLocalStorage: (fileId) => {
    try {
      const key = fileStorageService.getLocalStorageKey(fileId)
      if (global.fileStorageCache && global.fileStorageCache[key]) {
        delete global.fileStorageCache[key]
        return true
      }
      return false
    } catch (err) {
      console.error("[v0] Error clearing from localStorage:", err.message)
      return false
    }
  },

  /**
   * Create file object with metadata
   */
  createFileObject: (file, category, userId) => {
    return {
      originalName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      category: category,
      uploadedBy: userId,
      uploadedAt: new Date(),
      downloadCount: 0,
      lastDownloadedAt: null,
    }
  },

  /**
   * Prepare files for batch processing
   */
  processBatchFiles: (files, category, userId) => {
    if (!files || files.length === 0) return []

    return files.map((file) => fileStorageService.createFileObject(file, category, userId))
  },

  /**
   * Get file statistics for a user
   */
  getUserFileStats: (userId, files) => {
    return {
      totalFiles: files.length,
      totalSize: files.reduce((sum, f) => sum + (f.fileSize || 0), 0),
      byType: files.reduce((acc, f) => {
        const type = f.mimeType.split('/')[0]
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {}),
      oldestFile: files.length > 0 ? Math.min(...files.map((f) => new Date(f.uploadedAt).getTime())) : null,
      newestFile: files.length > 0 ? Math.max(...files.map((f) => new Date(f.uploadedAt).getTime())) : null,
    }
  },

  /**
   * Validate file before processing
   */
  validateFile: (file, maxSize = 10 * 1024 * 1024) => {
    const errors = []

    if (!file) {
      errors.push("File is required")
    } else {
      if (file.size > maxSize) {
        errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`)
      }

      const allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        "image/bmp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "text/csv",
      ]

      if (!allowedMimes.includes(file.mimetype)) {
        errors.push(`File type ${file.mimetype} is not allowed`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    }
  },
}