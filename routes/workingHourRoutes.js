import express from "express"
import {
  createWorkingHour,
  getWorkingHours,
  getDefaultWorkingHour,
  updateWorkingHour,
} from "../controllers/workingHourController.js"
import { protect, authorize } from "../middlewares/auth.js"

const router = express.Router()

router.use(protect)

// User routes - get default working hour
router.get("/default", getDefaultWorkingHour)
router.get("/", getWorkingHours)

// Admin routes
router.post("/", authorize("admin", "super_admin"), createWorkingHour)
router.put("/:id", authorize("admin", "super_admin"), updateWorkingHour)

export default router
