import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimiter.js";
import { deleteAccount } from "../controllers/account.controller.js";

const router = Router();

const accountLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many deletion requests. Please wait a moment.",
});

// All account endpoints require authentication
router.use(requireAuth);

// DELETE /api/account → Delete account and perform related data cleanup
router.delete("/", accountLimiter, deleteAccount);

export default router;
