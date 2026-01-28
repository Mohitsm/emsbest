


import express from "express"
import {
  createOrUpdateSalary,
  getSalary,
  getAllSalaries,
  getSalaryStats,
  deleteSalary,
} from "../controllers/salaryController.js"
import { protect } from "../middlewares/auth.js"

const router = express.Router()

// All routes are protected
router.use(protect)

// ========== USER ROUTES ==========
// Get user's own salary information
router.get("/me", getSalary)
router.get("/:userId", getSalary)

// ========== ADMIN ROUTES ==========
// Create or update salary
router.post("/", createOrUpdateSalary)

// Get all salaries
router.get("/admin/all", getAllSalaries)

// Get salary statistics
router.get("/admin/stats", getSalaryStats)

// Delete salary
router.delete("/:id", deleteSalary)

export default router