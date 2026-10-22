import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getMatches, unmatch } from "../controllers/matches.controller.js";

const router = Router();

// All matches endpoints require an authenticated user
router.use(requireAuth);

// GET /api/matches → Retrieve active matches for the authenticated user
router.get("/", getMatches);

// DELETE /api/matches/:matchId → Unmatch an active connection
router.delete("/:matchId", unmatch);

export default router;
