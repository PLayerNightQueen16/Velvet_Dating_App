import mongoose from "mongoose";

const swipeSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Acting user (actor) is required"],
      index: true,
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Target user (target) is required"],
      index: true,
    },
    action: {
      type: String,
      enum: {
        values: ["like", "pass"],
        message: "Action must be either 'like' or 'pass'",
      },
      required: [true, "Action type is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensures each actor has at most one action per target
swipeSchema.index({ actor: 1, target: 1 }, { unique: true });

export const Swipe = mongoose.model("Swipe", swipeSchema);
