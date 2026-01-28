
import Document from "../models/Document.js"
import User from "../models/User.js"
import fs from "fs"
import path from "path"
import { fileStorageService } from "../utils/fileStorage.js"
import { fileService } from "../middlewares/upload.js"
import mongoose from "mongoose"

/* =========================
   Upload Document
========================= */
export const uploadDocument = async (req, res) => {
  try {
    const {
      documentType,
      remarks,
      aadharNumber,
      panNumber,
      bankAccountNumber,
      bankName,
      bankIFSC,
      documentName,
      documentDescription,
    } = req.body

    if (!documentType || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Document type and file are required",
      })
    }

    const metadata = {}
    if (documentType === "aadhar_card" && aadharNumber) {
      if (!/^\d{12}$/.test(aadharNumber)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Aadhar number format (12 digits required)",
        })
      }
      metadata.aadharNumber = aadharNumber
    }
    if (documentType === "pan_card" && panNumber) {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
        return res.status(400).json({
          success: false,
          message: "Invalid PAN format",
        })
      }
      metadata.panNumber = panNumber
    }
    if (["bank_details", "bank_passbook", "cheque_leaf"].includes(documentType)) {
      if (bankAccountNumber) metadata.bankAccountNumber = bankAccountNumber
      if (bankName) metadata.bankName = bankName
      if (bankIFSC) metadata.bankIFSC = bankIFSC
    }
    if (documentType === "printed_documents") {
      if (documentName) metadata.documentName = documentName
      if (documentDescription) metadata.documentDescription = documentDescription
    }

    const fileMetadata = fileStorageService.createFileObject(req.file, "documents", req.user._id)

    const document = await Document.create({
      user: req.user._id,
      documentType,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      verificationStatus: "pending",
      remarks: remarks || "",
      uploadedBy: req.user._id,
      metadata: metadata,
    })

    const fileId = `${req.user._id}_doc_${document._id}`
    fileStorageService.saveToLocalStorage(fileId, {
      ...fileMetadata,
      documentId: document._id,
      documentType,
      metadata,
    })

    console.log("[v0] Document uploaded and cached:", {
      fileId,
      documentType,
      fileName: req.file.originalname,
      metadata,
    })

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
      fileMetadata: { fileId, ...fileMetadata },
    })
  } catch (err) {
    if (req.file) {
      fileService.deleteFile(req.file.path)
    }

    res.status(500).json({
      success: false,
      message: "Error uploading document",
      error: err.message,
    })
  }
}

/* =========================
   Get User Documents
========================= */
export const getUserDocuments = async (req, res) => {
  try {
    const userId = req.user.role === "user" ? req.user._id : req.query.userId

    const documents = await Document.find({ user: userId }).populate("user", "name email").sort({ createdAt: -1 })

    const docsWithCache = documents.map((doc) => {
      const cachedData = fileStorageService.getFromLocalStorage(`${userId}_doc_${doc._id}`)
      return {
        ...doc.toObject(),
        cachedFile: cachedData || null,
      }
    })

    res.status(200).json({
      success: true,
      count: docsWithCache.length,
      data: docsWithCache,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching documents",
      error: err.message,
    })
  }
}

/* =========================
   Get All Documents (Admin - Filtered by admin's users)
========================= */
export const getAllDocuments = async (req, res) => {
  try {
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    const { status, documentType, userId } = req.query

    const filter = {}
    
    // If admin (not super_admin), only show documents of users they created
    if (req.user.role === "admin") {
      // Get all users created by this admin
      const usersCreatedByAdmin = await User.find({ 
        createdBy: req.user._id 
      }).select('_id')
      
      const userIds = usersCreatedByAdmin.map(user => user._id)
      
      // If specific userId is provided, check if it belongs to admin's users
      if (userId) {
        if (!userIds.includes(new mongoose.Types.ObjectId(userId))) {
          return res.status(403).json({
            success: false,
            message: "Not authorized to view documents of this user",
          })
        }
        filter.user = userId
      } else {
        // Filter by all users created by this admin
        filter.user = { $in: userIds }
      }
    } else if (userId) {
      // For super_admin, if userId is provided, filter by that user
      filter.user = userId
    }

    // Add other filters
    if (status) filter.verificationStatus = status
    if (documentType) filter.documentType = documentType

    // Build query
    const query = Document.find(filter)
      .populate({
        path: "user",
        select: "name email role department company createdBy",
        populate: {
          path: "createdBy",
          select: "name email role"
        }
      })
      .populate("verifiedBy", "name")
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 })

    // Execute query
    const documents = await query

    // Get document counts by status for stats
    const stats = {
      total: documents.length,
      pending: documents.filter(doc => doc.verificationStatus === 'pending').length,
      verified: documents.filter(doc => doc.verificationStatus === 'verified').length,
      rejected: documents.filter(doc => doc.verificationStatus === 'rejected').length,
    }

    res.status(200).json({
      success: true,
      count: documents.length,
      stats: stats,
      data: documents,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching documents",
      error: err.message,
    })
  }
}

/* =========================
   Verify Document (Admin)
========================= */
export const verifyDocument = async (req, res) => {
  try {
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    const { id } = req.params
    const { remarks } = req.body

    const document = await Document.findById(id)
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    // If admin (not super_admin), check if they can verify this document
    if (req.user.role === "admin") {
      const user = await User.findById(document.user)
      if (user && user.createdBy && !user.createdBy.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to verify this document",
        })
      }
    }

    document.verificationStatus = "verified"
    document.verifiedBy = req.user._id
    document.verificationDate = new Date()
    document.remarks = remarks || document.remarks

    await document.save()

    res.status(200).json({
      success: true,
      message: "Document verified successfully",
      data: document,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error verifying document",
      error: err.message,
    })
  }
}

/* =========================
   Reject Document (Admin)
========================= */
export const rejectDocument = async (req, res) => {
  try {
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    const { id } = req.params
    const { rejectionReason } = req.body

    const document = await Document.findById(id)
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    // If admin (not super_admin), check if they can reject this document
    if (req.user.role === "admin") {
      const user = await User.findById(document.user)
      if (user && user.createdBy && !user.createdBy.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to reject this document",
        })
      }
    }

    document.verificationStatus = "rejected"
    document.verifiedBy = req.user._id
    document.verificationDate = new Date()
    document.rejectionReason = rejectionReason || ""

    await document.save()

    res.status(200).json({
      success: true,
      message: "Document rejected",
      data: document,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error rejecting document",
      error: err.message,
    })
  }
}

/* =========================
   Download Document
========================= */
export const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params

    const document = await Document.findById(id)
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    // Check authorization for regular users
    if (req.user.role === "user" && !document.user.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to download this document",
      })
    }

    // Check authorization for admin (only their users' documents)
    if (req.user.role === "admin") {
      // Get the user who uploaded the document
      const user = await User.findById(document.user)
      if (user && user.createdBy && !user.createdBy.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to download this document",
        })
      }
    }

    const filePath = path.resolve(document.filePath)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      })
    }

    // Set appropriate headers
    res.setHeader('Content-Type', document.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.fileName)}"`)
    res.setHeader('Content-Length', document.fileSize)

    // Track download in cache
    const fileId = `${document.user}_doc_${document._id}`
    const cachedData = fileStorageService.getFromLocalStorage(fileId)
    if (cachedData) {
      cachedData.downloadCount = (cachedData.downloadCount || 0) + 1
      cachedData.lastDownloadedAt = new Date().toISOString()
      fileStorageService.saveToLocalStorage(fileId, cachedData)
    }

    // Stream the file
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)

    fileStream.on('error', (err) => {
      console.error('[v0] Error streaming file:', err.message)
      res.status(500).json({
        success: false,
        message: "Error downloading document",
      })
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error downloading document",
      error: err.message,
    })
  }
}

/* =========================
   View Document (Inline - for images/PDFs in browser)
========================= */
export const viewDocument = async (req, res) => {
  try {
    const { id } = req.params

    const document = await Document.findById(id)
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    // Check authorization for regular users
    if (req.user.role === "user" && !document.user.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this document",
      })
    }

    // Check authorization for admin (only their users' documents)
    if (req.user.role === "admin") {
      const user = await User.findById(document.user)
      if (user && user.createdBy && !user.createdBy.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this document",
        })
      }
    }

    const filePath = path.resolve(document.filePath)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      })
    }

    // Determine if it's an image
    const isImage = document.mimeType.startsWith('image/')
    
    if (isImage) {
      // For images, send as inline
      res.setHeader('Content-Type', document.mimeType)
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.fileName)}"`)
    } else {
      // For PDFs, allow inline viewing in browser
      if (document.mimeType === 'application/pdf') {
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.fileName)}"`)
      } else {
        // For other files, force download
        res.setHeader('Content-Type', 'application/octet-stream')
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.fileName)}"`)
      }
    }

    res.setHeader('Content-Length', document.fileSize)

    // Stream the file
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)

    fileStream.on('error', (err) => {
      console.error('[v0] Error streaming file:', err.message)
      res.status(500).json({
        success: false,
        message: "Error viewing document",
      })
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error viewing document",
      error: err.message,
    })
  }
}

/* =========================
   Delete Document
========================= */
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params

    const document = await Document.findById(id)
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    // Check authorization
    if (req.user.role === "user" && !document.user.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this document",
      })
    }

    // Check authorization for admin
    if (req.user.role === "admin") {
      const user = await User.findById(document.user)
      if (user && user.createdBy && !user.createdBy.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this document",
        })
      }
    }

    // Delete file from system
    const filePath = path.resolve(document.filePath)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    const fileId = `${document.user}_doc_${document._id}`
    fileStorageService.clearFromLocalStorage(fileId)

    await document.deleteOne()

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error deleting document",
      error: err.message,
    })
  }
}

/* =========================
   Get Documents Pending Verification (Admin-specific)
========================= */
export const getPendingDocuments = async (req, res) => {
  try {
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    const filter = {
      verificationStatus: "pending"
    }

    // If admin (not super_admin), only show documents of users they created
    if (req.user.role === "admin") {
      const usersCreatedByAdmin = await User.find({ 
        createdBy: req.user._id 
      }).select('_id')
      
      const userIds = usersCreatedByAdmin.map(user => user._id)
      
      if (userIds.length > 0) {
        filter.user = { $in: userIds }
      } else {
        // If admin has no users, return empty array
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        })
      }
    }

    const documents = await Document.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching pending documents",
      error: err.message,
    })
  }
}

/* =========================
   Get Documents by Admin ID (for super_admin to view specific admin's users' documents)
========================= */
export const getDocumentsByAdminId = async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only super admin can access this endpoint",
      })
    }

    const { adminId } = req.params
    const { status, documentType } = req.query

    // Verify the admin exists
    const admin = await User.findOne({ 
      _id: adminId,
      role: { $in: ["admin", "super_admin"] }
    })
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      })
    }

    // Get all users created by this admin
    const usersCreatedByAdmin = await User.find({ 
      createdBy: adminId 
    }).select('_id name email')
    
    const userIds = usersCreatedByAdmin.map(user => user._id)

    if (userIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users found for this admin",
        count: 0,
        stats: { total: 0, pending: 0, verified: 0, rejected: 0 },
        data: [],
        adminInfo: {
          name: admin.name,
          email: admin.email,
          role: admin.role
        },
        users: usersCreatedByAdmin
      })
    }

    const filter = {
      user: { $in: userIds }
    }

    // Add other filters
    if (status) filter.verificationStatus = status
    if (documentType) filter.documentType = documentType

    const documents = await Document.find(filter)
      .populate("user", "name email")
      .populate("verifiedBy", "name")
      .sort({ createdAt: -1 })

    // Get document counts by status for stats
    const stats = {
      total: documents.length,
      pending: documents.filter(doc => doc.verificationStatus === 'pending').length,
      verified: documents.filter(doc => doc.verificationStatus === 'verified').length,
      rejected: documents.filter(doc => doc.verificationStatus === 'rejected').length,
    }

    res.status(200).json({
      success: true,
      count: documents.length,
      stats: stats,
      adminInfo: {
        name: admin.name,
        email: admin.email,
        role: admin.role
      },
      users: usersCreatedByAdmin,
      data: documents,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching documents by admin",
      error: err.message,
    })
  }
}

/* =========================
   Get Document Statistics
========================= */
export const getDocumentStats = async (req, res) => {
  try {
    let filter = {}

    if (req.user.role === "user") {
      filter.user = req.user._id
    } else if (req.user.role === "admin") {
      const usersCreatedByAdmin = await User.find({ 
        createdBy: req.user._id 
      }).select('_id')
      const userIds = usersCreatedByAdmin.map(user => user._id)
      filter.user = { $in: userIds }
    }

    const documents = await Document.find(filter)
    
    const stats = {
      total: documents.length,
      pending: documents.filter(doc => doc.verificationStatus === 'pending').length,
      verified: documents.filter(doc => doc.verificationStatus === 'verified').length,
      rejected: documents.filter(doc => doc.verificationStatus === 'rejected').length,
      byType: documents.reduce((acc, doc) => {
        acc[doc.documentType] = (acc[doc.documentType] || 0) + 1
        return acc
      }, {}),
      byMonth: documents.reduce((acc, doc) => {
        const month = new Date(doc.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' })
        acc[month] = (acc[month] || 0) + 1
        return acc
      }, {})
    }

    res.status(200).json({
      success: true,
      data: stats,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching document statistics",
      error: err.message,
    })
  }
}