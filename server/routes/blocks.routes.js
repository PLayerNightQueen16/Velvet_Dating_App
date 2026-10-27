import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getBlockedUsers,
  blockUser,
  unblockUser,
} from "../controllers/blocks.controller.js";

const router = Router();

// All block endpoints require authentication
router.use(requireAuth);

// GET /api/blocks → List blocked users for authenticated user
router.get("/", getBlockedUsers);

// POST /api/blocks/:userId → Block a user
router.post("/:userId", blockUser);

// DELETE /api/blocks/:userId → Unblock a user
router.delete("/:userId", unblockUser);

export default router;
