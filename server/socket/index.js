import { Server } from "socket.io";
import * as cookie from "cookie";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { COOKIE_NAME } from "../utils/token.js";
import { verifyChatAccess } from "../utils/chatAuth.js";
import {
  sendMessage,
  markConversationRead,
  getUnreadCounts,
} from "../services/message.service.js";

let ioInstance = null;

/**
 * Initializes Socket.IO with HTTP server and authenticates connections via HTTP-only cookie.
 *
 * @param {import("http").Server} httpServer
 * @returns {Server}
 */
export function initSocket(httpServer) {
  const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
  const allowedOrigins = [
    CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked socket request from origin: ${origin}`));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // ── Authentication Middleware ───────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const rawCookies = socket.handshake.headers?.cookie || "";
      const parsedCookies = cookie.parse(rawCookies);
      const token = parsedCookies[COOKIE_NAME] || socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required. Please log in."));
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return next(new Error("Server configuration error (JWT_SECRET)."));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, secret);
      } catch (err) {
        return next(new Error("Invalid or expired authentication session."));
      }

      const user = await User.findById(decoded.userId).select("-password");
      if (!user) {
        return next(new Error("Account associated with session no longer exists."));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (err) {
      console.error("Socket authentication error:", err.message);
      next(new Error("Authentication failure."));
    }
  });

  // ── Event Handlers ──────────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();

    // Join personal room for user-targeted notifications (e.g. badge updates)
    socket.join(`user:${userId}`);

    // 1. Join a Conversation Room
    socket.on("chat:join", async ({ matchId }, callback) => {
      try {
        const auth = await verifyChatAccess(matchId, socket.user._id);
        if (!auth.authorized) {
          const res = { success: false, message: auth.message || "Unauthorized" };
          if (typeof callback === "function") callback(res);
          socket.emit("chat:error", res);
          return;
        }

        socket.join(`match:${matchId}`);
        const res = { success: true, matchId };
        if (typeof callback === "function") callback(res);
      } catch (err) {
        const res = { success: false, message: err.message || "Failed to join room." };
        if (typeof callback === "function") callback(res);
        socket.emit("chat:error", res);
      }
    });

    // 2. Leave a Conversation Room
    socket.on("chat:leave", ({ matchId }, callback) => {
      if (matchId) {
        socket.leave(`match:${matchId}`);
      }
      if (typeof callback === "function") callback({ success: true, matchId });
    });

    // 3. Send a Message
    socket.on("chat:send", async ({ matchId, text, clientMessageId }, callback) => {
      try {
        const result = await sendMessage({
          matchId,
          senderId: socket.user._id,
          text,
          clientMessageId,
        });

        // Broadcast message to everyone in the conversation room
        io.to(`match:${matchId}`).emit("chat:message", result.message);

        // Notify recipient's personal room with updated unread counts
        try {
          const unreadRes = await getUnreadCounts({ userId: result.partnerId });
          io.to(`user:${result.partnerId}`).emit("chat:unread:update", unreadRes);
        } catch (e) {
          console.error("Failed to emit unread update to partner:", e.message);
        }

        // Acknowledge sender with persisted message
        if (typeof callback === "function") {
          callback({
            success: true,
            message: result.message,
            isDuplicate: result.isDuplicate,
          });
        }
      } catch (err) {
        const res = {
          success: false,
          message: err.message || "Failed to send message.",
          status: err.status || 500,
        };
        if (typeof callback === "function") callback(res);
        socket.emit("chat:error", res);
      }
    });

    // 4. Mark Conversation Read
    socket.on("chat:read", async ({ matchId, beforeCursor }, callback) => {
      try {
        const result = await markConversationRead({
          matchId,
          userId: socket.user._id,
          beforeCursor,
        });

        if (result.updatedCount > 0) {
          // Broadcast read receipt to match room
          io.to(`match:${matchId}`).emit("chat:read:receipt", {
            matchId: result.matchId,
            readerId: result.readerId,
            readAt: result.readAt,
            updatedCount: result.updatedCount,
          });

          // Update reader's personal unread badge
          const unreadRes = await getUnreadCounts({ userId: socket.user._id });
          io.to(`user:${userId}`).emit("chat:unread:update", unreadRes);
        }

        if (typeof callback === "function") {
          callback({
            success: true,
            updatedCount: result.updatedCount,
            readAt: result.readAt,
          });
        }
      } catch (err) {
        const res = {
          success: false,
          message: err.message || "Failed to mark read.",
        };
        if (typeof callback === "function") callback(res);
      }
    });

    socket.on("disconnect", () => {
      // Clean disconnect handled by Socket.IO
    });
  });

  ioInstance = io;
  return io;
}

/**
 * Returns active Socket.IO server instance.
 */
export function getIO() {
  return ioInstance;
}
