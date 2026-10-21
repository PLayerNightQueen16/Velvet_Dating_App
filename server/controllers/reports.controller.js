import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Report, REPORT_REASONS } from "../models/report.model.js";

/**
 * Submit a confidential safety report
 * POST /api/reports/:userId
 */
export async function createReport(req, res) {
  try {
    const reporter = req.user;
    if (!reporter) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const { userId: reportedId } = req.params;
    const { reason, details } = req.body;

    if (!reportedId || !mongoose.Types.ObjectId.isValid(reportedId)) {
      return res.status(400).json({ success: false, message: "Invalid target user ID." });
    }

    // Cannot report oneself
    if (reporter._id.toString() === reportedId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot report your own profile." });
    }

    // Verify reported user exists in database
    const reportedUser = await User.findById(reportedId);
    if (!reportedUser) {
      return res.status(404).json({ success: false, message: "Reported user does not exist." });
    }

    // Validate reason
    if (!reason || typeof reason !== "string" || !REPORT_REASONS.includes(reason.trim().toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid reason. Must be one of: ${REPORT_REASONS.join(", ")}`,
      });
    }

    // Validate optional details
    const cleanDetails = typeof details === "string" ? details.trim() : "";
    if (cleanDetails.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Report details cannot exceed 1,000 characters.",
      });
    }

    // Create persistent report record
    const report = await Report.create({
      reporter: reporter._id,
      reportedUser: reportedId,
      reason: reason.trim().toLowerCase(),
      details: cleanDetails,
      status: "open",
    });

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully. Thank you for helping keep VELVET safe.",
      reportId: report._id,
    });
  } catch (error) {
    console.error("createReport error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to submit report." });
  }
}
