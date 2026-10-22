import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Swipe } from "../models/swipe.model.js";
import { Block } from "../models/block.model.js";
import { Like } from "../models/like.model.js";
import { Match, getCanonicalPair } from "../models/match.model.js";
import {
  ALLOWED_GENDERS,
  ALLOWED_RELATIONSHIP_INTENTS,
  CURATED_INTERESTS,
} from "../utils/profileConstants.js";
import {
  getBirthDateBounds,
  GENDER_TO_PREFERENCE_MAP,
  PREFERENCE_TO_GENDERS_MAP,
  isGenderCompatible,
} from "../utils/compatibility.js";

/**
 * Fetch candidate discovery profiles for authenticated user.
 * GET /api/discovery
 */
export async function getDiscovery(req, res) {
  try {
    const user = req.user;

    // Requester must have completed onboarding to access discovery
    if (!user.profileCompleted) {
      return res.status(403).json({
        success: false,
        message: "Please complete your profile to access discovery.",
      });
    }

    // ── Parse & Validate Pagination ───────────────────────────────────────────
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

    // ── Parse & Validate Age Range ────────────────────────────────────────────
    let minAge = 18;
    let maxAge = 100;

    if (req.query.minAge !== undefined) {
      const parsedMin = parseInt(req.query.minAge, 10);
      if (isNaN(parsedMin)) {
        return res.status(400).json({ success: false, message: "minAge must be a valid number." });
      }
      if (parsedMin < 18) {
        return res.status(400).json({ success: false, message: "minAge cannot be below 18." });
      }
      minAge = parsedMin;
    }

    if (req.query.maxAge !== undefined) {
      const parsedMax = parseInt(req.query.maxAge, 10);
      if (isNaN(parsedMax)) {
        return res.status(400).json({ success: false, message: "maxAge must be a valid number." });
      }
      if (parsedMax > 100) {
        return res.status(400).json({ success: false, message: "maxAge cannot exceed 100." });
      }
      maxAge = parsedMax;
    }

    if (minAge > maxAge) {
      return res.status(400).json({
        success: false,
        message: "minAge cannot be greater than maxAge.",
      });
    }

    // ── Parse & Validate Gender Filters ───────────────────────────────────────
    let queryGenders = [];
    if (req.query.genders) {
      const rawGenders = Array.isArray(req.query.genders)
        ? req.query.genders
        : String(req.query.genders).split(",");
      queryGenders = rawGenders.map((g) => g.trim().toLowerCase()).filter(Boolean);

      for (const g of queryGenders) {
        if (!ALLOWED_GENDERS.includes(g)) {
          return res.status(400).json({
            success: false,
            message: `Unsupported gender filter: '${g}'. Allowed: ${ALLOWED_GENDERS.join(", ")}`,
          });
        }
      }
    }

    // ── Parse & Validate Interests Filters ────────────────────────────────────
    let queryInterests = [];
    if (req.query.interests) {
      const rawInterests = Array.isArray(req.query.interests)
        ? req.query.interests
        : String(req.query.interests).split(",");
      queryInterests = rawInterests.map((i) => i.trim()).filter(Boolean);
    }

    // ── Parse & Validate Relationship Intent Filters ──────────────────────────
    let queryIntents = [];
    if (req.query.relationshipIntent) {
      const rawIntents = Array.isArray(req.query.relationshipIntent)
        ? req.query.relationshipIntent
        : String(req.query.relationshipIntent).split(",");
      queryIntents = rawIntents.map((ri) => ri.trim().toLowerCase()).filter(Boolean);

      for (const intent of queryIntents) {
        if (!ALLOWED_RELATIONSHIP_INTENTS.includes(intent)) {
          return res.status(400).json({
            success: false,
            message: `Unsupported relationshipIntent: '${intent}'. Allowed: ${ALLOWED_RELATIONSHIP_INTENTS.join(", ")}`,
          });
        }
      }
    }

    // ── Exclusions: Self, Swiped Profiles, Blocked Users, and Active Matches ──
    const [swipedTargetIds, blockedByUserIds, blockingUserIds, activeMatches] = await Promise.all([
      Swipe.find({ actor: user._id }).distinct("target"),
      Block.find({ blocker: user._id }).distinct("blocked"),
      Block.find({ blocked: user._id }).distinct("blocker"),
      Match.find({ users: user._id, status: "active" }).select("users"),
    ]);

    const matchedPartnerIds = activeMatches
      .flatMap((m) => m.users)
      .filter((id) => id && id.toString() !== user._id.toString());

    const excludedIds = [
      user._id,
      ...swipedTargetIds,
      ...blockedByUserIds,
      ...blockingUserIds,
      ...matchedPartnerIds,
    ];

    // ── Build Candidate MongoDB Query ─────────────────────────────────────────
    const { minBirthDate, maxBirthDate } = getBirthDateBounds(minAge, maxAge);

    const filterQuery = {
      _id: { $nin: excludedIds },
      profileCompleted: true,
      // Must have at least 1 saved photo
      "photos.0": { $exists: true },
      // Strict 18+ and age range filter on server
      dateOfBirth: { $gte: minBirthDate, $lte: maxBirthDate },
    };

    // 1. Forward Gender Compatibility:
    // Requester's dating preference for candidates
    const reqInterestedIn = user.preferences?.interestedIn || ["everyone"];
    let permittedGenders = null;

    if (!reqInterestedIn.includes("everyone") && reqInterestedIn.length > 0) {
      permittedGenders = reqInterestedIn.flatMap((pref) => PREFERENCE_TO_GENDERS_MAP[pref] || []);
    }

    // If query genders filter was supplied, intersect it
    if (queryGenders.length > 0) {
      if (permittedGenders) {
        permittedGenders = permittedGenders.filter((g) => queryGenders.includes(g));
      } else {
        permittedGenders = queryGenders;
      }
    }

    if (permittedGenders !== null) {
      filterQuery.gender = { $in: permittedGenders };
    }

    // 2. Reciprocal Gender Compatibility:
    // Candidate's preferences must accept requester's gender
    const requesterPluralGroup = GENDER_TO_PREFERENCE_MAP[user.gender] || "everyone";
    filterQuery["preferences.interestedIn"] = {
      $in: ["everyone", requesterPluralGroup],
    };

    // 3. Optional Interests Filter (matches any selected interest)
    if (queryInterests.length > 0) {
      filterQuery.interests = { $in: queryInterests };
    }

    // 4. Optional Relationship Intent Filter
    if (queryIntents.length > 0) {
      filterQuery.relationshipIntent = { $in: queryIntents };
    }

    // ── Count Total Matching & Deterministic Pagination ───────────────────────
    const total = await User.countDocuments(filterQuery);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const candidates = await User.find(filterQuery)
      .sort({ createdAt: -1, _id: 1 })
      .skip(skip)
      .limit(limit);

    // Privacy-safe serialized profiles for discovery
    const profiles = candidates.map((candidate) => candidate.toDiscoveryProfile());

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
    console.error("getDiscovery error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve discovery profiles.",
    });
  }
}

/**
 * Like a profile
 * POST /api/discovery/:userId/like
 */
export async function likeProfile(req, res) {
  try {
    const actor = req.user;
    const { userId: targetId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ success: false, message: "Invalid profile ID." });
    }

    // Cannot like oneself
    if (actor._id.toString() === targetId) {
      return res.status(400).json({ success: false, message: "You cannot like your own profile." });
    }

    // Verify target exists, completed onboarding, and meets adult requirements
    const targetUser = await User.findById(targetId);
    if (!targetUser || !targetUser.profileCompleted) {
      return res.status(404).json({
        success: false,
        message: "Candidate profile not found or is ineligible for discovery.",
      });
    }

    // Check block status in either direction
    const blockExists = await Block.findOne({
      $or: [
        { blocker: actor._id, blocked: targetId },
        { blocker: targetId, blocked: actor._id },
      ],
    });

    if (blockExists) {
      return res.status(403).json({
        success: false,
        message: "Action not permitted due to safety restrictions.",
      });
    }

    // Verify reciprocal gender and dating preference compatibility
    if (!isGenderCompatible(actor, targetUser)) {
      return res.status(400).json({
        success: false,
        message: "Profiles do not meet mutual gender and dating preference criteria.",
      });
    }

    // Persist like decision in Swipe collection (discovery history)
    await Swipe.findOneAndUpdate(
      { actor: actor._id, target: targetId },
      { action: "like" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Persist active one-sided like in Like collection
    await Like.findOneAndUpdate(
      { liker: actor._id, liked: targetId },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Check if target user has an active reciprocal like for actor
    const reciprocalLike = await Like.findOne({
      liker: targetId,
      liked: actor._id,
    });

    // If no reciprocal like exists yet, return regular like confirmation
    if (!reciprocalLike) {
      return res.status(200).json({
        success: true,
        message: "Liked successfully.",
        action: "like",
        targetId,
        data: {
          liked: true,
          matched: false,
          isNewMatch: false,
          match: null,
        },
      });
    }

    // Reciprocal like detected: get canonical unordered pair
    const [u1, u2] = getCanonicalPair(actor._id, targetId);

    // Check if a match record already exists for this canonical pair
    const existingMatch = await Match.findOne({ user1: u1, user2: u2 });

    if (existingMatch) {
      // If already active, do not recreate or trigger new celebration
      if (existingMatch.status === "active") {
        return res.status(200).json({
          success: true,
          message: "Match already exists.",
          action: "like",
          targetId,
          data: {
            liked: true,
            matched: true,
            isNewMatch: false,
            match: {
              id: existingMatch._id,
              matchedAt: existingMatch.matchedAt,
            },
          },
        });
      }

      // If it was unmatched previously, reactivate it atomically
      const reactivatedMatch = await Match.findOneAndUpdate(
        { user1: u1, user2: u2, status: "unmatched" },
        {
          $set: {
            status: "active",
            matchedAt: new Date(),
            unmatchedAt: null,
            unmatchedBy: null,
          },
        },
        { new: true }
      );

      const isNew = Boolean(reactivatedMatch);
      const currentMatch = reactivatedMatch || (await Match.findOne({ user1: u1, user2: u2 }));

      return res.status(200).json({
        success: true,
        message: isNew ? "It's a Match!" : "Liked successfully.",
        action: "like",
        targetId,
        data: {
          liked: true,
          matched: true,
          isNewMatch: isNew,
          match: {
            id: currentMatch?._id,
            matchedAt: currentMatch?.matchedAt,
          },
        },
      });
    }

    // No prior match record exists: create a new active match
    try {
      const newMatch = await Match.create({
        users: [u1, u2],
        user1: u1,
        user2: u2,
        status: "active",
        matchedAt: new Date(),
      });

      return res.status(200).json({
        success: true,
        message: "It's a Match!",
        action: "like",
        targetId,
        data: {
          liked: true,
          matched: true,
          isNewMatch: true,
          match: {
            id: newMatch._id,
            matchedAt: newMatch.matchedAt,
          },
        },
      });
    } catch (createErr) {
      // Concurrency protection: catch duplicate key error E11000 on `{ user1: 1, user2: 1 }`
      if (createErr.code === 11000 || (createErr.message && createErr.message.includes("E11000"))) {
        const persistedMatch = await Match.findOne({ user1: u1, user2: u2 });
        return res.status(200).json({
          success: true,
          message: "It's a Match!",
          action: "like",
          targetId,
          data: {
            liked: true,
            matched: true,
            isNewMatch: false, // Parallel thread won the race and was assigned isNewMatch: true
            match: {
              id: persistedMatch?._id,
              matchedAt: persistedMatch?.matchedAt,
            },
          },
        });
      }
      throw createErr;
    }
  } catch (error) {
    console.error("likeProfile error:", error);
    return res.status(500).json({ success: false, message: "Failed to record like." });
  }
}

/**
 * Pass on a profile
 * POST /api/discovery/:userId/pass
 */
export async function passProfile(req, res) {
  try {
    const actor = req.user;
    const { userId: targetId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ success: false, message: "Invalid profile ID." });
    }

    // Cannot pass on oneself
    if (actor._id.toString() === targetId) {
      return res.status(400).json({ success: false, message: "You cannot pass on your own profile." });
    }

    // Verify target exists, completed onboarding, and meets adult requirements
    const targetUser = await User.findById(targetId);
    if (!targetUser || !targetUser.profileCompleted) {
      return res.status(404).json({
        success: false,
        message: "Candidate profile not found or is ineligible for discovery.",
      });
    }

    // Check block status in either direction
    const blockExists = await Block.findOne({
      $or: [
        { blocker: actor._id, blocked: targetId },
        { blocker: targetId, blocked: actor._id },
      ],
    });

    if (blockExists) {
      return res.status(403).json({
        success: false,
        message: "Action not permitted due to safety restrictions.",
      });
    }

    // Check if currently matched: active matches require explicit unmatching
    const [u1, u2] = getCanonicalPair(actor._id, targetId);
    const activeMatch = await Match.findOne({ user1: u1, user2: u2, status: "active" });
    if (activeMatch) {
      return res.status(400).json({
        success: false,
        message: "You are currently matched with this user. Please unmatch explicitly before passing.",
      });
    }

    // Remove any active outgoing like from Like collection so stale likes cannot create matches
    await Like.findOneAndDelete({ liker: actor._id, liked: targetId });

    // Atomic upsert into Swipe collection (pass action)
    await Swipe.findOneAndUpdate(
      { actor: actor._id, target: targetId },
      { action: "pass" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Passed successfully.",
      action: "pass",
      targetId,
    });
  } catch (error) {
    console.error("passProfile error:", error);
    return res.status(500).json({ success: false, message: "Failed to record pass." });
  }
}

/**
 * Block a user
 * POST /api/discovery/:userId/block
 */
export async function blockUser(req, res) {
  try {
    const blocker = req.user;
    const { userId: blockedId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(blockedId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID to block." });
    }

    if (blocker._id.toString() === blockedId) {
      return res.status(400).json({ success: false, message: "You cannot block yourself." });
    }

    // Atomic upsert into Block collection
    await Block.findOneAndUpdate(
      { blocker: blocker._id, blocked: blockedId },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Remove active likes in both directions
    await Like.deleteMany({
      $or: [
        { liker: blocker._id, liked: blockedId },
        { liker: blockedId, liked: blocker._id },
      ],
    });

    // Deactivate active match if any exists
    const [u1, u2] = getCanonicalPair(blocker._id, blockedId);
    await Match.findOneAndUpdate(
      { user1: u1, user2: u2, status: "active" },
      {
        $set: {
          status: "unmatched",
          unmatchedAt: new Date(),
          unmatchedBy: blocker._id,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "User blocked successfully.",
      blockedId,
    });
  } catch (error) {
    console.error("blockUser error:", error);
    return res.status(500).json({ success: false, message: "Failed to block user." });
  }
}

/**
 * Unblock a user
 * DELETE /api/discovery/:userId/block
 */
export async function unblockUser(req, res) {
  try {
    const blocker = req.user;
    const { userId: blockedId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(blockedId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID to unblock." });
    }

    await Block.findOneAndDelete({ blocker: blocker._id, blocked: blockedId });

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully.",
      unblockedId: blockedId,
    });
  } catch (error) {
    console.error("unblockUser error:", error);
    return res.status(500).json({ success: false, message: "Failed to unblock user." });
  }
}
