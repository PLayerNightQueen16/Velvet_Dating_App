import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Match, getCanonicalPair } from "../models/match.model.js";
import { Block } from "../models/block.model.js";
import { Swipe } from "../models/swipe.model.js";

/**
 * Get profiles who have liked the authenticated user (Incoming Likes).
 * GET /api/likes/received
 */
export async function getIncomingLikes(req, res) {
  try {
    const user = req.user;

    // Parse & Validate Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const rawLimit = parseInt(req.query.limit, 10);
    if (req.query.limit !== undefined && (isNaN(rawLimit) || rawLimit <= 0)) {
      return res.status(400).json({ success: false, message: "Limit must be a positive integer." });
    }
    const limit = Math.min(24, Math.max(1, rawLimit || 12));

    if (req.query.page !== undefined) {
      const parsedPage = parseInt(req.query.page, 10);
      if (isNaN(parsedPage) || parsedPage <= 0) {
        return res.status(400).json({ success: false, message: "Page must be a positive integer." });
      }
    }

    // Identify blocks in both directions and active matches
    const [blockedByUserIds, blockingUserIds, activeMatches] = await Promise.all([
      Block.find({ blocker: user._id }).distinct("blocked"),
      Block.find({ blocked: user._id }).distinct("blocker"),
      Match.find({ users: user._id, status: "active" }).select("users"),
    ]);

    const matchedPartnerIds = activeMatches
      .flatMap((m) => m.users)
      .filter((id) => id && id.toString() !== user._id.toString())
      .map((id) => id.toString());

    const excludeIds = [
      user._id.toString(),
      ...blockedByUserIds.map(String),
      ...blockingUserIds.map(String),
      ...matchedPartnerIds,
    ];

    // Find active likes directed at current user
    const likeQuery = {
      liked: user._id,
      liker: { $nin: excludeIds },
    };

    const total = await Like.countDocuments(likeQuery);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const likeRecords = await Like.find(likeQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("liker");

    // Filter out any deleted/incomplete users and serialize privacy-safe discovery profile
    const profiles = [];
    for (const record of likeRecords) {
      const likerUser = record.liker;
      if (likerUser && likerUser.profileCompleted) {
        const serialized = likerUser.toDiscoveryProfile();
        profiles.push({
          ...serialized,
          likedAt: record.createdAt,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        profiles,
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
    console.error("getIncomingLikes error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve received likes.",
    });
  }
}

/**
 * Get profiles the authenticated user has liked (Outgoing Likes).
 * GET /api/likes/sent
 */
export async function getOutgoingLikes(req, res) {
  try {
    const user = req.user;

    // Parse & Validate Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const rawLimit = parseInt(req.query.limit, 10);
    if (req.query.limit !== undefined && (isNaN(rawLimit) || rawLimit <= 0)) {
      return res.status(400).json({ success: false, message: "Limit must be a positive integer." });
    }
    const limit = Math.min(24, Math.max(1, rawLimit || 12));

    if (req.query.page !== undefined) {
      const parsedPage = parseInt(req.query.page, 10);
      if (isNaN(parsedPage) || parsedPage <= 0) {
        return res.status(400).json({ success: false, message: "Page must be a positive integer." });
      }
    }

    // Identify blocks in both directions and active matches
    const [blockedByUserIds, blockingUserIds, activeMatches] = await Promise.all([
      Block.find({ blocker: user._id }).distinct("blocked"),
      Block.find({ blocked: user._id }).distinct("blocker"),
      Match.find({ users: user._id, status: "active" }).select("users"),
    ]);

    const matchedPartnerIds = activeMatches
      .flatMap((m) => m.users)
      .filter((id) => id && id.toString() !== user._id.toString())
      .map((id) => id.toString());

    const excludeIds = [
      user._id.toString(),
      ...blockedByUserIds.map(String),
      ...blockingUserIds.map(String),
      ...matchedPartnerIds,
    ];

    // Find active likes sent by current user
    const likeQuery = {
      liker: user._id,
      liked: { $nin: excludeIds },
    };

    const total = await Like.countDocuments(likeQuery);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const likeRecords = await Like.find(likeQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("liked");

    const profiles = [];
    for (const record of likeRecords) {
      const likedUser = record.liked;
      if (likedUser && likedUser.profileCompleted) {
        const serialized = likedUser.toDiscoveryProfile();
        profiles.push({
          ...serialized,
          likedAt: record.createdAt,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        profiles,
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
    console.error("getOutgoingLikes error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve sent likes.",
    });
  }
}

/**
 * Withdraw an active outgoing like.
 * DELETE /api/likes/:userId
 */
export async function withdrawLike(req, res) {
  try {
    const actor = req.user;
    const { userId: targetId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ success: false, message: "Invalid profile ID to withdraw like from." });
    }

    if (actor._id.toString() === targetId) {
      return res.status(400).json({ success: false, message: "Invalid action." });
    }

    // Verify whether an active match currently exists
    const [u1, u2] = getCanonicalPair(actor._id, targetId);
    const activeMatch = await Match.findOne({ user1: u1, user2: u2, status: "active" });

    if (activeMatch) {
      return res.status(400).json({
        success: false,
        message: "Cannot withdraw like while an active match exists. Please unmatch instead.",
      });
    }

    // Delete outgoing like from Like collection
    await Like.findOneAndDelete({
      liker: actor._id,
      liked: targetId,
    });

    // Also remove swipe record to reset discovery status
    await Swipe.findOneAndDelete({
      actor: actor._id,
      target: targetId,
    });

    return res.status(200).json({
      success: true,
      message: "Like withdrawn successfully.",
      targetId,
    });
  } catch (error) {
    console.error("withdrawLike error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to withdraw like.",
    });
  }
}
