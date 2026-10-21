import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Swipe } from "../models/swipe.model.js";
import { Block } from "../models/block.model.js";
import { Match } from "../models/match.model.js";
import { Message } from "../models/message.model.js";
import { Report } from "../models/report.model.js";
import { deleteCloudinaryImage } from "../utils/cloudinary.js";
import { clearAuthCookie } from "../utils/token.js";
import { getIO } from "../socket/index.js";

/**
 * Permanently delete authenticated user's account and perform related data cleanup
 * DELETE /api/account
 */
export async function deleteAccount(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const { password, confirmation } = req.body || {};

    // Explicit confirmation validation
    if (!confirmation || confirmation.trim() !== "DELETE") {
      return res.status(400).json({
        success: false,
        message: "Please confirm deletion by typing DELETE.",
      });
    }

    // Require password for reauthentication
    if (!password || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Password is required to confirm account deletion.",
      });
    }

    // Fetch user with password
    const userWithPassword = await User.findById(user._id);
    if (!userWithPassword) {
      return res.status(404).json({ success: false, message: "Account not found." });
    }

    // Verify password
    const isPasswordValid = await userWithPassword.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Incorrect password." });
    }

    const userId = userWithPassword._id;

    // 1. Identify and delete stored Cloudinary assets
    const publicIds = (userWithPassword.photos || [])
      .map((p) => p.publicId)
      .filter(Boolean);

    for (const pid of publicIds) {
      try {
        await deleteCloudinaryImage(pid);
      } catch (cloudErr) {
        console.error(`Failed to delete Cloudinary asset ${pid}:`, cloudErr.message);
      }
    }

    // 2. Remove all likes in both directions
    await Like.deleteMany({
      $or: [{ liker: userId }, { liked: userId }],
    });

    // 3. Remove all swipe interactions
    await Swipe.deleteMany({
      $or: [{ actor: userId }, { target: userId }],
    });

    // 4. Remove all block records
    await Block.deleteMany({
      $or: [{ blocker: userId }, { blocked: userId }],
    });

    // 5. Deactivate all active matches involving this account
    await Match.updateMany(
      { users: userId, status: "active" },
      {
        $set: {
          status: "unmatched",
          unmatchedAt: new Date(),
          unmatchedBy: userId,
        },
      }
    );

    // 6. Delete all messages exchanged in conversations involving this account
    await Message.deleteMany({
      $or: [{ sender: userId }, { recipient: userId }],
    });

    // 7. Retain safety reports but anonymize reporter reference
    await Report.updateMany(
      { reporter: userId },
      { $set: { reporter: null } }
    );

    // 8. Invalidate active sockets for this user
    try {
      const io = getIO();
      if (io) {
        const userRoom = `user:${userId.toString()}`;
        io.to(userRoom).emit("account:deleted", {
          message: "Your account has been deleted.",
        });
        const sockets = await io.in(userRoom).fetchSockets();
        for (const s of sockets) {
          s.disconnect(true);
        }
      }
    } catch (socketErr) {
      console.error("Socket termination on account deletion error:", socketErr.message);
    }

    // 9. Delete the User document itself
    await User.findByIdAndDelete(userId);

    // 10. Clear the authentication cookie
    clearAuthCookie(res);

    return res.status(200).json({
      success: true,
      message: "Your account and associated data have been permanently deleted.",
    });
  } catch (error) {
    console.error("deleteAccount error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting your account. Please try again.",
    });
  }
}
