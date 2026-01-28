import express from "express"
import {
  createHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday,
  isHoliday,
} from "../controllers/holidayController.js"
import { protect, authorize } from "../middlewares/auth.js"

const router = express.Router()

router.use(protect)

// Public
router.get("/check", isHoliday)
router.get("/", getHolidays)

// Admin only
router.post("/", authorize("admin", "super_admin"), createHoliday)
router.put("/:id", authorize("admin", "super_admin"), updateHoliday)
router.delete("/:id", authorize("admin", "super_admin"), deleteHoliday)

export default router
