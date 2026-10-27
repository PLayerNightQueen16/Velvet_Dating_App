import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimiter.js";
import { createReport } from "../controllers/reports.controller.js";

const router = Router();

// Rate limiter for safety reports
const reportLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 reports per minute per IP
  message: "Too many report submissions. Please wait a moment before trying again.",
});

// All report endpoints require authentication
router.use(requireAuth);

// POST /api/reports/:userId → Submit confidential report
router.post("/:userId", reportLimiter, createReport);

export default router;
