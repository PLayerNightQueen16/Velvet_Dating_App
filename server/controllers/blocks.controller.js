import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Block } from "../models/block.model.js";
import { Like } from "../models/like.model.js";
import { Match, getCanonicalPair } from "../models/match.model.js";
import { getIO } from "../socket/index.js";

/**
 * Get list of users blocked by the authenticated user
 * GET /api/blocks
 */
export async function getBlockedUsers(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const rawLimit = parseInt(req.query.limit, 10);
    const limit = Math.min(50, Math.max(1, isNaN(rawLimit) ? 20 : rawLimit));

    const total = await Block.countDocuments({ blocker: user._id });
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const blockRecords = await Block.find({ blocker: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("blocked");

    const blockedList = [];
    for (const record of blockRecords) {
      const blockedUser = record.blocked;
      if (blockedUser) {
        const primaryPhoto =
          blockedUser.photos?.find((p) => p.isPrimary)?.url ||
          blockedUser.photos?.[0]?.url ||
          null;

        blockedList.push({
          id: blockedUser._id.toString(),
          name: blockedUser.name,
          username: blockedUser.username,
          age: blockedUser.age,
          location: blockedUser.location || "",
          photoUrl: primaryPhoto,
          blockedAt: record.createdAt,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        blockedUsers: blockedList,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("getBlockedUsers error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to retrieve blocked users." });
  }
}

/**
 * Block a user
 * POST /api/blocks/:userId
 */
export async function blockUser(req, res) {
  try {
    const blocker = req.user;
    if (!blocker) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const { userId: blockedId } = req.params;

    if (!blockedId || !mongoose.Types.ObjectId.isValid(blockedId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID to block." });
    }

    if (blocker._id.toString() === blockedId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot block yourself." });
    }

    // Atomic upsert into Block collection (safe & idempotent)
    await Block.findOneAndUpdate(
      { blocker: blocker._id, blocked: blockedId },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Remove active likes in both directions so stale likes cannot recreate matches
    await Like.deleteMany({
      $or: [
        { liker: blocker._id, liked: blockedId },
        { liker: blockedId, liked: blocker._id },
      ],
    });

    // Deactivate active match if any exists
    const [u1, u2] = getCanonicalPair(blocker._id, blockedId);
    const match = await Match.findOneAndUpdate(
      { user1: u1, user2: u2, status: "active" },
      {
        $set: {
          status: "unmatched",
          unmatchedAt: new Date(),
          unmatchedBy: blocker._id,
        },
      },
      { new: true }
    );

    // Invalidate Socket.IO rooms and emit privacy-safe event
    try {
      const io = getIO();
      if (io && match) {
        const roomName = `match:${match._id}`;
        io.to(roomName).emit("chat:invalidated", {
          matchId: match._id.toString(),
          reason: "restricted",
        });

        // Evict sockets from this room
        const sockets = await io.in(roomName).fetchSockets();
        for (const s of sockets) {
          s.leave(roomName);
        }
      }
    } catch (socketErr) {
      console.error("Socket room invalidation on block error:", socketErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "User blocked successfully.",
      blockedId,
    });
  } catch (error) {
    console.error("blockUser error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to block user." });
  }
}

/**
 * Unblock a user
 * DELETE /api/blocks/:userId
 */
export async function unblockUser(req, res) {
  try {
    const blocker = req.user;
    if (!blocker) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const { userId: blockedId } = req.params;

    if (!blockedId || !mongoose.Types.ObjectId.isValid(blockedId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID to unblock." });
    }

    // Idempotent deletion
    await Block.findOneAndDelete({ blocker: blocker._id, blocked: blockedId });

    // Note: unblocking does NOT reactivate old matches or likes (fresh mutual likes required)

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully.",
      unblockedId: blockedId,
    });
  } catch (error) {
    console.error("unblockUser error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to unblock user." });
  }
}
