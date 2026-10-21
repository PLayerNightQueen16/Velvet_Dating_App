import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getConversations,
  getMessages,
  postMessage,
  postMarkRead,
  getUnread,
} from "../controllers/chat.controller.js";

const router = Router();

// All chat endpoints require authenticated session
router.use(requireAuth);

// GET /api/chat/conversations → List active conversations with last-message previews
router.get("/conversations", getConversations);

// GET /api/chat/unread → Total unread count and per-conversation breakdown
router.get("/unread", getUnread);

// GET /api/chat/:matchId/messages → Paginated conversation history
router.get("/:matchId/messages", getMessages);

// POST /api/chat/:matchId/messages → Send message (REST fallback)
router.post("/:matchId/messages", postMessage);

// POST /api/chat/:matchId/read → Mark messages as read
router.post("/:matchId/read", postMarkRead);

export default router;
