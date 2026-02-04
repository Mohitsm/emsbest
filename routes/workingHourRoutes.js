import express from "express";
import { getUserAdminCounts } from "../controllers/superAdminController.js";

const router = express.Router();

// No auth / no protection
router.get("/counts", getUserAdminCounts);

export default router;