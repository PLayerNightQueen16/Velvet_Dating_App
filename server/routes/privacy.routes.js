import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getPrivacySettings,
  updatePrivacySettings,
} from "../controllers/privacy.controller.js";

const router = Router();

// All privacy endpoints require authentication
router.use(requireAuth);

// GET /api/privacy → Get current privacy settings
router.get("/", getPrivacySettings);

// PATCH /api/privacy → Update allowed privacy fields
router.patch("/", updatePrivacySettings);

export default router;
