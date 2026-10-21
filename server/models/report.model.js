import mongoose from "mongoose";

export const REPORT_REASONS = [
  "harassment",
  "fake_profile",
  "inappropriate_content",
  "spam",
  "underage",
  "safety_concerns",
  "other",
];

export const REPORT_STATUSES = ["open", "under_review", "resolved", "dismissed"];

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // nullable if reporter deleted account later
      index: true,
      default: null,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reported user is required"],
      index: true,
    },
    reason: {
      type: String,
      required: [true, "Report reason is required"],
      enum: {
        values: REPORT_REASONS,
        message: `Report reason must be one of: ${REPORT_REASONS.join(", ")}`,
      },
      index: true,
    },
    details: {
      type: String,
      trim: true,
      maxlength: [1000, "Details cannot exceed 1,000 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: REPORT_STATUSES,
        message: `Status must be one of: ${REPORT_STATUSES.join(", ")}`,
      },
      default: "open",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound query index for review workflows
reportSchema.index({ reportedUser: 1, createdAt: -1 });
reportSchema.index({ reporter: 1, reportedUser: 1, createdAt: -1 });

export const Report = mongoose.model("Report", reportSchema);
