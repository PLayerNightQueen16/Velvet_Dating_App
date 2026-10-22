import mongoose from "mongoose";

/**
 * Like Mongoose Model
 * Represents an active, one-sided expression of romantic interest.
 * Synchronized with the discovery Swipe collection and used to evaluate genuine mutual matches.
 */
const likeSchema = new mongoose.Schema(
  {
    liker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Liker is required"],
      index: true,
    },
    liked: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Liked user is required"],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index prevents duplicate active likes between the same pair
likeSchema.index({ liker: 1, liked: 1 }, { unique: true });

// Performance index for fetching incoming likes sorted by date
likeSchema.index({ liked: 1, createdAt: -1 });

// Performance index for fetching outgoing likes sorted by date
likeSchema.index({ liker: 1, createdAt: -1 });

export const Like = mongoose.model("Like", likeSchema);
