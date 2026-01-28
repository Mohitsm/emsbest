import express from "express"
import {
  createAdvancePayment,
  getAdvancePayments,
  getAdvancePaymentById,
  updateAdvancePaymentStatus,
  updateAdvancePayment,
  deleteAdvancePayment,
  getAdvancePaymentSummary,
  createAdvancePaymentUser,
} from "../controllers/advancePaymentController.js"
import { protect } from "../middlewares/auth.js"

const router = express.Router()

// All routes are protected
router.use(protect)

// ========== USER ROUTES ==========
// Get user's own advance payments
router.get("/user/me", getAdvancePayments)
router.get("/", getAdvancePayments)
router.post("/user", createAdvancePaymentUser)

// Get specific advance payment by ID
router.get("/:id", getAdvancePaymentById)

// ========== ADMIN ROUTES ==========
// Create advance payment
router.post("/", createAdvancePayment)

// Get advance payment summary
router.get("/admin/summary", getAdvancePaymentSummary)

// Update advance payment status
router.put("/:id/status", updateAdvancePaymentStatus)

// Update advance payment
router.put("/:id", updateAdvancePayment)

// Delete advance payment
router.delete("/:id", deleteAdvancePayment)

export default router