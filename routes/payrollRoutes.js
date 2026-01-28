
import express from "express"
import {
  generatePayroll,
  bulkGeneratePayroll,
  getUserPayroll,
  getPayrollById,
  getAllPayrolls,
  updatePayrollStatus,
  updatePayroll,
  deletePayroll,
  getPayrollSummary,
  downloadPayslip,

   downloadAllPayslipsExcel,
  downloadAllPayslipsPDF,
  downloadBankPaymentCSV,
  downloadDetailedPayslip,
  getPaymentSummary,
} from "../controllers/payrollController.js"
import { protect,authorize } from "../middlewares/auth.js"

const router = express.Router()

// All routes are protected
router.use(protect)

// ========== USER ROUTES ==========
// Get user's own payroll (users can view their own payrolls)
router.get("/user/me", getUserPayroll)
router.get("/user/:userId", getUserPayroll)

// Get specific payroll by ID
router.get("/:id", getPayrollById)

// Download payslip
router.get("/:id/payslip", downloadPayslip)

// ========== ADMIN ROUTES ==========
// Generate payroll (single user)
router.post("/generate", generatePayroll)

// Bulk generate payroll
router.post("/bulk-generate", bulkGeneratePayroll)

// Get all payrolls (with filters)
router.get("/admin/all", getAllPayrolls)

// Get payroll summary
router.get("/admin/summary", getPayrollSummary)

// Update payroll status
router.put("/:id/status", updatePayrollStatus)

// Update payroll details
router.put("/:id", updatePayroll)

// Delete payroll
router.delete("/:id", deletePayroll)

router.get(
  '/admin/download-all-payslips/excel',
  protect,
  authorize('admin', 'super_admin'),
  downloadAllPayslipsExcel
);

router.get(
  '/admin/download-all-payslips/pdf',
  protect,
  authorize('admin', 'super_admin'),
  downloadAllPayslipsPDF
);

router.get(
  '/admin/download-bank-payment-csv',
  protect,
  authorize('admin', 'super_admin'),
  downloadBankPaymentCSV
);

router.get(
  '/admin/download-payslip/:id',
  protect,
  authorize('admin', 'super_admin'),
  downloadDetailedPayslip
);

router.get(
  '/admin/payment-summary',
  protect,
  authorize('admin', 'super_admin'),
  getPaymentSummary
);

export default router