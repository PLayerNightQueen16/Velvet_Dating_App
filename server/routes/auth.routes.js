import { Router } from "express";
import { register, login, logout, getMe, changePassword } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

// Rate limiters for sensitive endpoints
const authLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // max 15 attempts per minute per IP
  message: "Too many authentication attempts. Please pause for a moment and try again.",
});

// Authentication endpoints
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);
router.patch("/password", requireAuth, authLimiter, changePassword);

export default router;
