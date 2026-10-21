import mongoose from "mongoose";
import { Match } from "../models/match.model.js";
import { User } from "../models/user.model.js";
import { Block } from "../models/block.model.js";

/**
 * Validates whether an authenticated user is authorized to participate in a conversation.
 * Rechecked against MongoDB for all REST and Socket operations.
 *
 * @param {string|mongoose.Types.ObjectId} matchId - The match/conversation ID
 * @param {string|mongoose.Types.ObjectId} userId - The requesting user ID
 * @returns {Promise<{
 *   authorized: boolean,
 *   status?: number,
 *   message?: string,
 *   match?: object,
 *   partner?: object,
 *   otherUserId?: string
 * }>}
 */
export async function verifyChatAccess(matchId, userId) {
  if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
    return {
      authorized: false,
      status: 400,
      message: "Invalid conversation identifier.",
    };
  }

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return {
      authorized: false,
      status: 401,
      message: "Authentication required to access conversation.",
    };
  }

  const userIdStr = userId.toString();

  // 1. Fetch match document
  const match = await Match.findById(matchId);
  if (!match) {
    return {
      authorized: false,
      status: 404,
      message: "Conversation not found.",
    };
  }

  // 2. Verify match is active and not unmatched
  if (match.status !== "active" || match.unmatchedAt !== null) {
    return {
      authorized: false,
      status: 403,
      message: "This conversation is no longer active.",
    };
  }

  // 3. Verify requester is one of the two participants
  const isParticipant = match.users.some((id) => id && id.toString() === userIdStr);
  if (!isParticipant) {
    return {
      authorized: false,
      status: 403,
      message: "You are not authorized to access this conversation.",
    };
  }

  // 4. Identify the other participant
  const otherUserId = match.users.find((id) => id && id.toString() !== userIdStr)?.toString();
  if (!otherUserId) {
    return {
      authorized: false,
      status: 400,
      message: "Conversation participants are invalid.",
    };
  }

  // 5. Verify partner account existence and eligibility
  const partner = await User.findById(otherUserId);
  if (!partner || !partner.profileCompleted) {
    return {
      authorized: false,
      status: 404,
      message: "The other user profile is no longer available.",
    };
  }

  // 6. Check safety blocks in both directions
  const blockExists = await Block.findOne({
    $or: [
      { blocker: userId, blocked: otherUserId },
      { blocker: otherUserId, blocked: userId },
    ],
  });

  if (blockExists) {
    // Sanitized: Never reveal who blocked whom
    return {
      authorized: false,
      status: 403,
      message: "Conversation is unavailable due to safety restrictions.",
    };
  }

  return {
    authorized: true,
    match,
    partner,
    otherUserId,
  };
}
