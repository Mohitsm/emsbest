


import express from "express"
import {
  uploadDocument,
  getUserDocuments,
  getAllDocuments,
  verifyDocument,
  rejectDocument,
  downloadDocument,
  deleteDocument,
  getPendingDocuments,
  viewDocument,
  getDocumentsByAdminId,
  getDocumentStats
} from "../controllers/documentController.js"
import { protect, authorize } from "../middlewares/auth.js"
import { upload, handleUploadError } from "../middlewares/upload.js"

const router = express.Router()

// Apply protect middleware to all routes
router.use(protect)

// Public routes (for authenticated users)
router.get("/types", (req, res) => {
  const documentTypes = [
    { value: "pan_card", label: "PAN Card" },
    { value: "aadhar_card", label: "Aadhar Card" },
    { value: "bank_details", label: "Bank Details" },
    { value: "bank_passbook", label: "Bank Passbook" },
    { value: "cheque_leaf", label: "Cheque Leaf" },
    { value: "10th_marksheet", label: "10th Marksheet" },
    { value: "12th_marksheet", label: "12th Marksheet" },
    { value: "graduation_marksheet", label: "Graduation Marksheet" },
    { value: "printed_documents", label: "Printed Documents" },
    { value: "employment_letter", label: "Employment Letter" },
    { value: "other", label: "Other" },
  ]
  
  res.status(200).json({
    success: true,
    data: documentTypes,
  })
})

// User routes
router.post("/upload", upload.single("document"), handleUploadError, uploadDocument)
router.get("/user", getUserDocuments)
router.get("/stats", getDocumentStats)
router.get("/download/:id", downloadDocument)
router.get("/view/:id", viewDocument)  // New endpoint for viewing documents inline
router.delete("/:id", deleteDocument)

// Admin routes
router.get("/", authorize("admin", "super_admin"), getAllDocuments)
router.get("/pending", authorize("admin", "super_admin"), getPendingDocuments)
router.get("/admin/:adminId", authorize("super_admin"), getDocumentsByAdminId) // Super admin only
router.put("/:id/verify", authorize("admin", "super_admin"), verifyDocument)
router.put("/:id/reject", authorize("admin", "super_admin"), rejectDocument)

export default router