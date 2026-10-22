import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getDiscovery,
  likeProfile,
  passProfile,
  blockUser,
  unblockUser,
} from "../controllers/discovery.controller.js";

const router = Router();

// All discovery endpoints require authenticated user
router.use(requireAuth);

// GET /api/discovery → Retrieve discovery candidates matching filters
router.get("/", getDiscovery);

// POST /api/discovery/:userId/like → Send a like (persisted in MongoDB Swipe collection)
router.post("/:userId/like", likeProfile);

// POST /api/discovery/:userId/pass → Pass on a profile (persisted in MongoDB Swipe collection)
router.post("/:userId/pass", passProfile);

// POST /api/discovery/:userId/block → Block a user
router.post("/:userId/block", blockUser);

// DELETE /api/discovery/:userId/block → Unblock a user
router.delete("/:userId/block", unblockUser);
router.post("/:userId/unblock", unblockUser);

export default router;
