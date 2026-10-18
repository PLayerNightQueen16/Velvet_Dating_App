import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getIncomingLikes,
  getOutgoingLikes,
  withdrawLike,
} from "../controllers/likes.controller.js";
import { likeProfile } from "../controllers/discovery.controller.js";

const router = Router();

// All likes endpoints require an authenticated user
router.use(requireAuth);

// GET /api/likes/received & /api/likes/incoming → Profiles who liked the current user
router.get("/received", getIncomingLikes);
router.get("/incoming", getIncomingLikes);

// GET /api/likes/sent & /api/likes/outgoing → Profiles the current user has liked
router.get("/sent", getOutgoingLikes);
router.get("/outgoing", getOutgoingLikes);

// DELETE /api/likes/:userId → Withdraw an active outgoing like
router.delete("/:userId", withdrawLike);

// POST /api/likes/:userId → Send or reciprocate a like (calls canonical likeProfile logic)
router.post("/:userId", likeProfile);

export default router;
