import mongoose from "mongoose";
import { Match } from "../models/match.model.js";
import { Like } from "../models/like.model.js";
import { Block } from "../models/block.model.js";

/**
 * Retrieve active matches for the authenticated user.
 * GET /api/matches
 */
export async function getMatches(req, res) {
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

    // Identify blocks in both directions
    const [blockedByUserIds, blockingUserIds] = await Promise.all([
      Block.find({ blocker: user._id }).distinct("blocked"),
      Block.find({ blocked: user._id }).distinct("blocker"),
    ]);

    const blockedIds = new Set([
      ...blockedByUserIds.map(String),
      ...blockingUserIds.map(String),
    ]);

    // Query active matches where current user is a participant
    const matchQuery = {
      users: user._id,
      status: "active",
    };

    const total = await Match.countDocuments(matchQuery);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const matchRecords = await Match.find(matchQuery)
      .sort({ matchedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("users");

    const matches = [];
    for (const match of matchRecords) {
      const partner = match.users.find(
        (u) => u && u._id.toString() !== user._id.toString()
      );

      // Verify partner exists, is not blocked, and has completed onboarding
      if (
        partner &&
        partner.profileCompleted &&
        !blockedIds.has(partner._id.toString())
      ) {
        matches.push({
          matchId: match._id,
          matchedAt: match.matchedAt,
          partner: partner.toDiscoveryProfile(),
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        matches,
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
    console.error("getMatches error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve matches.",
    });
  }
}

/**
 * Unmatch an active connection.
 * DELETE /api/matches/:matchId
 */
export async function unmatch(req, res) {
  try {
    const user = req.user;
    const { matchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ success: false, message: "Invalid match ID." });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found." });
    }

    // Verify authenticated user is a participant of this match
    const isParticipant = match.users.some(
      (id) => id.toString() === user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to unmatch this connection.",
      });
    }

    // Safe and idempotent handling for already-unmatched connections
    if (match.status === "unmatched") {
      return res.status(200).json({
        success: true,
        message: "Match is already inactive.",
        matchId: match._id,
      });
    }

    // Atomically transition match to unmatched state
    match.status = "unmatched";
    match.unmatchedAt = new Date();
    match.unmatchedBy = user._id;
    await match.save();

    // Clean up active likes between both participants to prevent stale likes from recreating the match
    await Like.deleteMany({
      $or: [
        { liker: match.users[0], liked: match.users[1] },
        { liker: match.users[1], liked: match.users[0] },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Unmatched successfully.",
      matchId: match._id,
    });
  } catch (error) {
    console.error("unmatch error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unmatch connection.",
    });
  }
}
