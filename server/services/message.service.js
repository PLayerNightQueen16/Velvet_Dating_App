import mongoose from "mongoose";
import { Message } from "../models/message.model.js";
import { Match } from "../models/match.model.js";
import { Block } from "../models/block.model.js";
import { verifyChatAccess } from "../utils/chatAuth.js";

/**
 * Shared message service supporting both REST endpoints and Socket.IO handlers.
 */

/**
 * Sends a message within a valid, active match.
 * Enforces server-side authorization and idempotency.
 */
export async function sendMessage({ matchId, senderId, text, clientMessageId }) {
  // 1. Authorize sender for this match
  const authCheck = await verifyChatAccess(matchId, senderId);
  if (!authCheck.authorized) {
    const error = new Error(authCheck.message);
    error.status = authCheck.status || 403;
    throw error;
  }

  // 2. Validate message text
  if (!text || typeof text !== "string" || !text.trim()) {
    const error = new Error("Message text cannot be empty.");
    error.status = 400;
    throw error;
  }

  const trimmedText = text.trim();
  if (trimmedText.length > 2000) {
    const error = new Error("Message cannot exceed 2,000 characters.");
    error.status = 400;
    throw error;
  }

  const recipientId = authCheck.otherUserId;

  // 3. Check idempotency if clientMessageId is provided
  if (clientMessageId && typeof clientMessageId === "string" && clientMessageId.trim()) {
    const cleanClientId = clientMessageId.trim().slice(0, 100);
    const existing = await Message.findOne({
      match: matchId,
      sender: senderId,
      clientMessageId: cleanClientId,
    });

    if (existing) {
      return {
        success: true,
        message: existing.toMessageDTO(),
        partnerId: recipientId,
        isDuplicate: true,
      };
    }

    try {
      const message = await Message.create({
        match: matchId,
        sender: senderId,
        recipient: recipientId,
        text: trimmedText,
        clientMessageId: cleanClientId,
        readAt: null,
        createdAt: new Date(),
      });

      return {
        success: true,
        message: message.toMessageDTO(),
        partnerId: recipientId,
        isDuplicate: false,
      };
    } catch (err) {
      // Catch race condition E11000 duplicate key
      if (err.code === 11000 || (err.message && err.message.includes("E11000"))) {
        const persisted = await Message.findOne({
          match: matchId,
          sender: senderId,
          clientMessageId: cleanClientId,
        });

        if (persisted) {
          return {
            success: true,
            message: persisted.toMessageDTO(),
            partnerId: recipientId,
            isDuplicate: true,
          };
        }
      }
      throw err;
    }
  }

  // Standard non-idempotent send
  const message = await Message.create({
    match: matchId,
    sender: senderId,
    recipient: recipientId,
    text: trimmedText,
    clientMessageId: null,
    readAt: null,
    createdAt: new Date(),
  });

  return {
    success: true,
    message: message.toMessageDTO(),
    partnerId: recipientId,
    isDuplicate: false,
  };
}

/**
 * Loads paginated history for a conversation using cursor pagination.
 */
export async function getConversationHistory({ matchId, userId, beforeCursor, limit = 30 }) {
  const authCheck = await verifyChatAccess(matchId, userId);
  if (!authCheck.authorized) {
    const error = new Error(authCheck.message);
    error.status = authCheck.status || 403;
    throw error;
  }

  const parsedLimit = parseInt(limit, 10);
  const safeLimit = Math.min(50, Math.max(1, isNaN(parsedLimit) ? 30 : parsedLimit));

  const query = { match: matchId };

  if (beforeCursor && typeof beforeCursor === "string") {
    // If beforeCursor is a valid ObjectId, look up its createdAt; otherwise treat as ISO string
    if (mongoose.Types.ObjectId.isValid(beforeCursor)) {
      const cursorMessage = await Message.findById(beforeCursor);
      if (cursorMessage) {
        query.createdAt = { $lt: cursorMessage.createdAt };
      }
    } else {
      const cursorDate = new Date(beforeCursor);
      if (!isNaN(cursorDate.getTime())) {
        query.createdAt = { $lt: cursorDate };
      }
    }
  }

  // Fetch safeLimit + 1 to check hasMore
  const docs = await Message.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(safeLimit + 1);

  const hasMore = docs.length > safeLimit;
  const slicedDocs = hasMore ? docs.slice(0, safeLimit) : docs;

  // Newest-to-oldest in query, reversed to chronological order for client display
  const chronologicalMessages = [...slicedDocs].reverse().map((doc) => doc.toMessageDTO());
  const nextCursor = hasMore ? slicedDocs[slicedDocs.length - 1]._id.toString() : null;

  return {
    success: true,
    messages: chronologicalMessages,
    hasMore,
    nextCursor,
    partner: authCheck.partner.toDiscoveryProfile(),
  };
}

/**
 * Marks unread messages in a conversation as read.
 * Updates only incoming messages addressed to the authenticated user.
 */
export async function markConversationRead({ matchId, userId, beforeCursor }) {
  const authCheck = await verifyChatAccess(matchId, userId);
  if (!authCheck.authorized) {
    const error = new Error(authCheck.message);
    error.status = authCheck.status || 403;
    throw error;
  }

  const query = {
    match: matchId,
    recipient: userId,
    readAt: null,
  };

  if (beforeCursor && typeof beforeCursor === "string") {
    if (mongoose.Types.ObjectId.isValid(beforeCursor)) {
      const cursorMessage = await Message.findById(beforeCursor);
      if (cursorMessage) {
        query.createdAt = { $lte: cursorMessage.createdAt };
      }
    } else {
      const cursorDate = new Date(beforeCursor);
      if (!isNaN(cursorDate.getTime())) {
        query.createdAt = { $lte: cursorDate };
      }
    }
  }

  const readAt = new Date();
  const updateResult = await Message.updateMany(query, {
    $set: { readAt },
  });

  return {
    success: true,
    updatedCount: updateResult.modifiedCount || 0,
    readAt: readAt.toISOString(),
    matchId: matchId.toString(),
    readerId: userId.toString(),
    partnerId: authCheck.otherUserId,
  };
}

/**
 * Retrieves unread message counts for an authenticated user across all valid matches.
 */
export async function getUnreadCounts({ userId }) {
  const userIdObj = new mongoose.Types.ObjectId(userId);

  // Exclude blocked pairs
  const [blockedByUserIds, blockingUserIds] = await Promise.all([
    Block.find({ blocker: userIdObj }).distinct("blocked"),
    Block.find({ blocked: userIdObj }).distinct("blocker"),
  ]);

  const blockedIds = new Set([
    ...blockedByUserIds.map(String),
    ...blockingUserIds.map(String),
  ]);

  // Find active matches where partner is not blocked
  const activeMatches = await Match.find({
    users: userIdObj,
    status: "active",
  }).select("users");

  const validMatchIds = [];
  for (const m of activeMatches) {
    const partnerId = m.users.find((id) => id && id.toString() !== userId.toString())?.toString();
    if (partnerId && !blockedIds.has(partnerId)) {
      validMatchIds.push(m._id);
    }
  }

  if (validMatchIds.length === 0) {
    return {
      success: true,
      totalUnread: 0,
      unreadByMatch: {},
    };
  }

  const totalUnread = await Message.countDocuments({
    match: { $in: validMatchIds },
    recipient: userIdObj,
    readAt: null,
  });

  const unreadAgg = await Message.aggregate([
    {
      $match: {
        match: { $in: validMatchIds },
        recipient: userIdObj,
        readAt: null,
      },
    },
    {
      $group: {
        _id: "$match",
        count: { $sum: 1 },
      },
    },
  ]);

  const unreadByMatch = {};
  for (const item of unreadAgg) {
    unreadByMatch[item._id.toString()] = item.count;
  }

  return {
    success: true,
    totalUnread,
    unreadByMatch,
  };
}

/**
 * Lists active conversations with last-message preview and unread counters.
 */
export async function getConversationsList({ userId, page = 1, limit = 20 }) {
  const userIdObj = new mongoose.Types.ObjectId(userId);

  // Exclude blocked pairs
  const [blockedByUserIds, blockingUserIds] = await Promise.all([
    Block.find({ blocker: userIdObj }).distinct("blocked"),
    Block.find({ blocked: userIdObj }).distinct("blocker"),
  ]);

  const blockedIds = new Set([
    ...blockedByUserIds.map(String),
    ...blockingUserIds.map(String),
  ]);

  // Find active matches populated with users
  const activeMatches = await Match.find({
    users: userIdObj,
    status: "active",
  }).populate("users");

  // Filter valid matches
  const validMatches = [];
  for (const m of activeMatches) {
    const partner = m.users.find(
      (u) => u && u._id.toString() !== userId.toString()
    );
    if (partner && partner.profileCompleted && !blockedIds.has(partner._id.toString())) {
      validMatches.push({ match: m, partner });
    }
  }

  // Populate last message and unread count for each conversation
  const conversationsData = await Promise.all(
    validMatches.map(async ({ match, partner }) => {
      const [lastMsgDoc, unreadCount] = await Promise.all([
        Message.findOne({ match: match._id }).sort({ createdAt: -1, _id: -1 }),
        Message.countDocuments({
          match: match._id,
          recipient: userIdObj,
          readAt: null,
        }),
      ]);

      const lastActivity = lastMsgDoc ? lastMsgDoc.createdAt : match.matchedAt || new Date(0);

      return {
        matchId: match._id.toString(),
        matchedAt: match.matchedAt ? match.matchedAt.toISOString() : null,
        partner: partner.toDiscoveryProfile(),
        lastMessage: lastMsgDoc ? lastMsgDoc.toMessageDTO() : null,
        unreadCount,
        lastActivity,
      };
    })
  );

  // Sort conversations by most recent activity descending
  conversationsData.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

  // Deterministic pagination
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const total = conversationsData.length;
  const totalPages = Math.ceil(total / safeLimit);
  const skip = (safePage - 1) * safeLimit;
  const paginatedConversations = conversationsData.slice(skip, skip + safeLimit);

  // Clean up internal lastActivity field
  const conversations = paginatedConversations.map(({ lastActivity, ...rest }) => rest);

  return {
    success: true,
    conversations,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}
