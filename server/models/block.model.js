import mongoose from "mongoose";

const blockSchema = new mongoose.Schema(
  {
    blocker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Blocker user is required"],
      index: true,
    },
    blocked: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Blocked user is required"],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index prevents duplicate block records
blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export const Block = mongoose.model("Block", blockSchema);
