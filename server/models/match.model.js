import mongoose from "mongoose";

/**
 * Returns two user IDs in stable, deterministic canonical order.
 * Guarantees exactly one representation per unordered pair [A, B].
 *
 * @param {string|mongoose.Types.ObjectId} idA
 * @param {string|mongoose.Types.ObjectId} idB
 * @returns {[string, string]}
 */
export function getCanonicalPair(idA, idB) {
  const strA = idA.toString();
  const strB = idB.toString();
  return strA < strB ? [strA, strB] : [strB, strA];
}

const matchSchema = new mongoose.Schema(
  {
    users: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      validate: [
        (val) => Array.isArray(val) && val.length === 2,
        "Match must contain exactly two users",
      ],
      required: [true, "Users array is required"],
    },
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Canonical user1 is required"],
      index: true,
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Canonical user2 is required"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["active", "unmatched"],
        message: "Match status must be either 'active' or 'unmatched'",
      },
      default: "active",
      index: true,
    },
    matchedAt: {
      type: Date,
      default: Date.now,
    },
    unmatchedAt: {
      type: Date,
      default: null,
    },
    unmatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index on canonical pair guarantees exactly one match record per user pair
matchSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Compound query index for fetching a user's active matches sorted by date
matchSchema.index({ users: 1, status: 1, matchedAt: -1 });

export const Match = mongoose.model("Match", matchSchema);
