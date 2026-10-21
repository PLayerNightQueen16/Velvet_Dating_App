import {
  sendMessage,
  getConversationHistory,
  markConversationRead,
  getUnreadCounts,
  getConversationsList,
} from "../services/message.service.js";
import { getIO } from "../socket/index.js";

/**
 * List active authorized conversations with last-message preview and unread counters.
 * GET /api/chat/conversations
 */
export async function getConversations(req, res) {
  try {
    const result = await getConversationsList({
      userId: req.user._id,
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("getConversations error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to retrieve conversations.",
    });
  }
}

/**
 * Load paginated conversation history.
 * GET /api/chat/:matchId/messages?before=<cursor>&limit=30
 */
export async function getMessages(req, res) {
  try {
    const { matchId } = req.params;
    const { before, limit } = req.query;

    const result = await getConversationHistory({
      matchId,
      userId: req.user._id,
      beforeCursor: before,
      limit,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("getMessages error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to retrieve messages.",
    });
  }
}

/**
 * Send a message via REST.
 * POST /api/chat/:matchId/messages
 */
export async function postMessage(req, res) {
  try {
    const { matchId } = req.params;
    const { text, clientMessageId } = req.body;

    const result = await sendMessage({
      matchId,
      senderId: req.user._id,
      text,
      clientMessageId,
    });

    // If real-time Socket.IO is initialized, broadcast to active room participants
    try {
      const io = getIO();
      if (io) {
        io.to(`match:${matchId}`).emit("chat:message", result.message);
        const unreadRes = await getUnreadCounts({ userId: result.partnerId });
        io.to(`user:${result.partnerId}`).emit("chat:unread:update", unreadRes);
      }
    } catch (e) {
      // Non-fatal if socket emission encounters an error
      console.error("Socket broadcast error in postMessage:", e.message);
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: result.message,
      isDuplicate: result.isDuplicate,
    });
  } catch (error) {
    console.error("postMessage error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to send message.",
    });
  }
}

/**
 * Mark messages in a conversation as read.
 * POST /api/chat/:matchId/read
 */
export async function postMarkRead(req, res) {
  try {
    const { matchId } = req.params;
    const { beforeCursor } = req.body;

    const result = await markConversationRead({
      matchId,
      userId: req.user._id,
      beforeCursor,
    });

    // Broadcast read receipt via Socket.IO if connected
    if (result.updatedCount > 0) {
      try {
        const io = getIO();
        if (io) {
          io.to(`match:${matchId}`).emit("chat:read:receipt", {
            matchId: result.matchId,
            readerId: result.readerId,
            readAt: result.readAt,
            updatedCount: result.updatedCount,
          });
          const unreadRes = await getUnreadCounts({ userId: req.user._id });
          io.to(`user:${req.user._id.toString()}`).emit("chat:unread:update", unreadRes);
        }
      } catch (e) {
        console.error("Socket broadcast error in postMarkRead:", e.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Messages marked as read.",
      data: {
        updatedCount: result.updatedCount,
        readAt: result.readAt,
      },
    });
  } catch (error) {
    console.error("postMarkRead error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to mark messages as read.",
    });
  }
}

/**
 * Get total unread count and count per conversation.
 * GET /api/chat/unread
 */
export async function getUnread(req, res) {
  try {
    const result = await getUnreadCounts({ userId: req.user._id });
    return res.status(200).json(result);
  } catch (error) {
    console.error("getUnread error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to retrieve unread counts.",
    });
  }
}
