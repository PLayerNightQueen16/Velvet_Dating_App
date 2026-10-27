import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Block } from "../models/block.model.js";
import { Report } from "../models/report.model.js";
import { Like } from "../models/like.model.js";
import { Swipe } from "../models/swipe.model.js";
import { Match, getCanonicalPair } from "../models/match.model.js";
import { Message } from "../models/message.model.js";
import { generateToken } from "../utils/token.js";
import { verifyChatAccess } from "../utils/chatAuth.js";
import { blockUser, unblockUser, getBlockedUsers } from "../controllers/blocks.controller.js";
import { createReport } from "../controllers/reports.controller.js";
import { getPrivacySettings, updatePrivacySettings } from "../controllers/privacy.controller.js";
import { changePassword } from "../controllers/auth.controller.js";
import { deleteAccount } from "../controllers/account.controller.js";

describe("Batch 7: Safety, Reporting, Privacy, Account Security & Deletion", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.JWT_SECRET = "test-secret-key-12345";
  });

  // ── 1. Blocking Tests ────────────────────────────────────────────────────────
  describe("Persistent User Blocking", () => {
    it("rejects unauthenticated requests to block or unblock", async () => {
      const targetId = new mongoose.Types.ObjectId().toString();

      // Block without auth
      const reqBlock = { user: null, params: { userId: targetId } };
      const resBlock = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      await blockUser(reqBlock, resBlock);
      expect(resBlock.status).toHaveBeenCalledWith(401);

      // Unblock without auth
      const reqUnblock = { user: null, params: { userId: targetId } };
      const resUnblock = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      await unblockUser(reqUnblock, resUnblock);
      expect(resUnblock.status).toHaveBeenCalledWith(401);
    });

    it("rejects attempts to block oneself", async () => {
      const userId = new mongoose.Types.ObjectId();
      const req = {
        user: { _id: userId },
        params: { userId: userId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await blockUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/cannot block yourself/i),
        })
      );
    });

    it("persists block, cleans up mutual likes, and deactivates active match", async () => {
      const userAId = new mongoose.Types.ObjectId();
      const userBId = new mongoose.Types.ObjectId();

      vi.spyOn(Block, "findOneAndUpdate").mockResolvedValueOnce({
        blocker: userAId,
        blocked: userBId,
      });
      const deleteLikesSpy = vi.spyOn(Like, "deleteMany").mockResolvedValueOnce({ deletedCount: 2 });
      const updateMatchSpy = vi.spyOn(Match, "findOneAndUpdate").mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        status: "unmatched",
      });

      const req = {
        user: { _id: userAId },
        params: { userId: userBId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await blockUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(Block.findOneAndUpdate).toHaveBeenCalled();
      expect(deleteLikesSpy).toHaveBeenCalled();
      expect(updateMatchSpy).toHaveBeenCalled();
    });

    it("unblocking removes block relationship without reactivating stale matches or likes", async () => {
      const userAId = new mongoose.Types.ObjectId();
      const userBId = new mongoose.Types.ObjectId();

      const deleteBlockSpy = vi.spyOn(Block, "findOneAndDelete").mockResolvedValueOnce({
        blocker: userAId,
        blocked: userBId,
      });
      const updateMatchSpy = vi.spyOn(Match, "findOneAndUpdate");
      const insertLikeSpy = vi.spyOn(Like, "create");

      const req = {
        user: { _id: userAId },
        params: { userId: userBId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await unblockUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(deleteBlockSpy).toHaveBeenCalled();
      // Unblocking must NOT reactivate matches or recreate likes
      expect(updateMatchSpy).not.toHaveBeenCalled();
      expect(insertLikeSpy).not.toHaveBeenCalled();
    });

    it("getBlockedUsers returns only the authenticated user's blocked list with safe summaries", async () => {
      const userAId = new mongoose.Types.ObjectId();
      const blockedUserDoc = {
        _id: new mongoose.Types.ObjectId(),
        name: "Blocked Persona",
        username: "blocked_persona",
        age: 26,
        location: "New York",
        photos: [{ url: "https://cloudinary.com/photo.jpg", isPrimary: true }],
      };

      vi.spyOn(Block, "countDocuments").mockResolvedValueOnce(1);
      vi.spyOn(Block, "find").mockReturnValueOnce({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValueOnce([
          {
            blocker: userAId,
            blocked: blockedUserDoc,
            createdAt: new Date(),
          },
        ]),
      });

      const req = {
        user: { _id: userAId },
        query: { page: 1, limit: 10 },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getBlockedUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            blockedUsers: expect.arrayContaining([
              expect.objectContaining({
                name: "Blocked Persona",
                username: "blocked_persona",
                photoUrl: "https://cloudinary.com/photo.jpg",
              }),
            ]),
          }),
        })
      );
    });
  });

  // ── 2. Reporting Tests ───────────────────────────────────────────────────────
  describe("Confidential User Reporting", () => {
    it("persists report with authenticated reporter identity and valid reason", async () => {
      const reporterId = new mongoose.Types.ObjectId();
      const reportedId = new mongoose.Types.ObjectId();

      vi.spyOn(User, "findById").mockResolvedValueOnce({
        _id: reportedId,
        name: "Reported User",
      });

      const createSpy = vi.spyOn(Report, "create").mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        reporter: reporterId,
        reportedUser: reportedId,
        reason: "harassment",
        details: "Inappropriate messages sent late at night.",
        status: "open",
      });

      const req = {
        user: { _id: reporterId },
        params: { userId: reportedId.toString() },
        body: {
          reason: "harassment",
          details: "Inappropriate messages sent late at night.",
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await createReport(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          reporter: reporterId,
          reportedUser: reportedId.toString(),
          reason: "harassment",
          details: "Inappropriate messages sent late at night.",
        })
      );
    });

    it("rejects self-reporting with 400", async () => {
      const userId = new mongoose.Types.ObjectId();
      const req = {
        user: { _id: userId },
        params: { userId: userId.toString() },
        body: { reason: "spam" },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await createReport(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/cannot report your own/i),
        })
      );
    });

    it("rejects invalid reasons and oversized details (>1000 chars)", async () => {
      const reporterId = new mongoose.Types.ObjectId();
      const reportedId = new mongoose.Types.ObjectId();

      vi.spyOn(User, "findById").mockResolvedValue({ _id: reportedId });

      // Invalid reason
      const reqInvalidReason = {
        user: { _id: reporterId },
        params: { userId: reportedId.toString() },
        body: { reason: "unsupported_reason" },
      };
      const res1 = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      await createReport(reqInvalidReason, res1);
      expect(res1.status).toHaveBeenCalledWith(400);

      // Oversized details
      const reqOversized = {
        user: { _id: reporterId },
        params: { userId: reportedId.toString() },
        body: { reason: "spam", details: "a".repeat(1001) },
      };
      const res2 = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      await createReport(reqOversized, res2);
      expect(res2.status).toHaveBeenCalledWith(400);
      expect(res2.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/cannot exceed 1,000 characters/i),
        })
      );
    });
  });

  // ── 3. Privacy & Discoverability Tests ──────────────────────────────────────
  describe("Privacy & Discoverability Settings", () => {
    it("returns safe defaults when user has missing legacy settings", async () => {
      const req = {
        user: {
          _id: new mongoose.Types.ObjectId(),
          privacy: null, // Legacy user with no privacy object
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getPrivacySettings(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        privacy: {
          discoverable: true,
          showOnlineStatus: true,
          showLastActive: true,
        },
      });
    });

    it("rejects mass assignment of forbidden or protected fields", async () => {
      const req = {
        user: { _id: new mongoose.Types.ObjectId() },
        body: {
          discoverable: false,
          role: "admin", // Protected field
          emailVerified: true,
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await updatePrivacySettings(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/not allowed in privacy updates/i),
        })
      );
    });

    it("successfully updates permitted privacy fields and persists in MongoDB", async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUserDoc = {
        _id: userId,
        privacy: {
          discoverable: true,
          showOnlineStatus: true,
          showLastActive: true,
        },
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, "findById").mockResolvedValueOnce(mockUserDoc);

      const req = {
        user: { _id: userId },
        body: {
          discoverable: false,
          showOnlineStatus: false,
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await updatePrivacySettings(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockUserDoc.privacy.discoverable).toBe(false);
      expect(mockUserDoc.privacy.showOnlineStatus).toBe(false);
      expect(mockUserDoc.privacy.showLastActive).toBe(true);
      expect(mockUserDoc.save).toHaveBeenCalled();
    });
  });

  // ── 4. Secure Password Changes ──────────────────────────────────────────────
  describe("Secure Password Changes", () => {
    it("rejects incorrect current password with 400", async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: userId,
        comparePassword: vi.fn().mockResolvedValueOnce(false), // Current password check fails
      };

      vi.spyOn(User, "findById").mockResolvedValueOnce(mockUser);

      const req = {
        user: { _id: userId },
        body: {
          currentPassword: "wrongPassword",
          newPassword: "newValidPassword123",
          confirmPassword: "newValidPassword123",
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await changePassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/incorrect current password/i),
        })
      );
    });

    it("rejects unchanged new password matching the current password", async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: userId,
        comparePassword: vi
          .fn()
          .mockResolvedValueOnce(true) // Current password matches
          .mockResolvedValueOnce(true), // New password is identical
      };

      vi.spyOn(User, "findById").mockResolvedValueOnce(mockUser);

      const req = {
        user: { _id: userId },
        body: {
          currentPassword: "samePassword123",
          newPassword: "samePassword123",
          confirmPassword: "samePassword123",
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await changePassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/cannot be the same as your current/i),
        })
      );
    });

    it("hashes new password, increments tokenVersion, and rotates auth cookie", async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: userId,
        tokenVersion: 1,
        comparePassword: vi
          .fn()
          .mockResolvedValueOnce(true) // Current password matches
          .mockResolvedValueOnce(false), // New password is truly different
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, "findById").mockResolvedValueOnce(mockUser);

      const req = {
        user: { _id: userId },
        body: {
          currentPassword: "oldSecretPassword123",
          newPassword: "freshCrimsonPassword999",
          confirmPassword: "freshCrimsonPassword999",
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        cookie: vi.fn(),
      };

      await changePassword(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockUser.tokenVersion).toBe(2);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalled();
      // Password hash must not be equal to plain text
      expect(mockUser.password).not.toBe("freshCrimsonPassword999");
    });
  });

  // ── 5. Account Deletion Tests ───────────────────────────────────────────────
  describe("Account Deletion & Data Cleanup", () => {
    it("rejects unauthenticated account deletion", async () => {
      const req = { user: null, body: { password: "any", confirmation: "DELETE" } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await deleteAccount(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("rejects deletion when confirmation phrase is not 'DELETE'", async () => {
      const req = {
        user: { _id: new mongoose.Types.ObjectId() },
        body: { password: "anyPassword", confirmation: "no" },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await deleteAccount(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/typing DELETE/i),
        })
      );
    });

    it("rejects deletion when password confirmation fails", async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: userId,
        comparePassword: vi.fn().mockResolvedValueOnce(false),
      };

      vi.spyOn(User, "findById").mockResolvedValueOnce(mockUser);

      const req = {
        user: { _id: userId },
        body: { password: "wrongPassword", confirmation: "DELETE" },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await deleteAccount(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/incorrect password/i),
        })
      );
    });

    it("cleans up likes, swipes, blocks, matches, messages, anonymizes reports, and deletes user", async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: userId,
        photos: [{ publicId: "velvet/profiles/test_photo_1" }],
        comparePassword: vi.fn().mockResolvedValueOnce(true),
      };

      vi.spyOn(User, "findById").mockResolvedValueOnce(mockUser);
      const deleteLikesSpy = vi.spyOn(Like, "deleteMany").mockResolvedValueOnce({ deletedCount: 5 });
      const deleteSwipesSpy = vi.spyOn(Swipe, "deleteMany").mockResolvedValueOnce({ deletedCount: 10 });
      const deleteBlocksSpy = vi.spyOn(Block, "deleteMany").mockResolvedValueOnce({ deletedCount: 1 });
      const updateMatchesSpy = vi.spyOn(Match, "updateMany").mockResolvedValueOnce({ modifiedCount: 2 });
      const deleteMessagesSpy = vi.spyOn(Message, "deleteMany").mockResolvedValueOnce({ deletedCount: 20 });
      const updateReportsSpy = vi.spyOn(Report, "updateMany").mockResolvedValueOnce({ modifiedCount: 3 });
      const deleteUserSpy = vi.spyOn(User, "findByIdAndDelete").mockResolvedValueOnce(mockUser);

      const req = {
        user: { _id: userId },
        body: { password: "correctPassword123", confirmation: "DELETE" },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        clearCookie: vi.fn(),
      };

      await deleteAccount(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(deleteLikesSpy).toHaveBeenCalledWith({
        $or: [{ liker: userId }, { liked: userId }],
      });
      expect(deleteSwipesSpy).toHaveBeenCalledWith({
        $or: [{ actor: userId }, { target: userId }],
      });
      expect(deleteBlocksSpy).toHaveBeenCalledWith({
        $or: [{ blocker: userId }, { blocked: userId }],
      });
      expect(updateMatchesSpy).toHaveBeenCalledWith(
        { users: userId, status: "active" },
        expect.objectContaining({
          $set: expect.objectContaining({ status: "unmatched" }),
        })
      );
      expect(deleteMessagesSpy).toHaveBeenCalledWith({
        $or: [{ sender: userId }, { recipient: userId }],
      });
      expect(updateReportsSpy).toHaveBeenCalledWith(
        { reporter: userId },
        { $set: { reporter: null } }
      );
      expect(deleteUserSpy).toHaveBeenCalledWith(userId);
      expect(res.clearCookie).toHaveBeenCalled();
    });
  });

  // ── 6. Chat Authorization & Regression Tests ────────────────────────────────
  describe("Chat Authorization Regressions", () => {
    it("denies access to conversations where partner is no longer available (deleted)", async () => {
      const matchId = new mongoose.Types.ObjectId();
      const userA = new mongoose.Types.ObjectId();
      const userB = new mongoose.Types.ObjectId();

      vi.spyOn(Match, "findById").mockResolvedValueOnce({
        _id: matchId,
        users: [userA, userB],
        status: "active",
        unmatchedAt: null,
      });

      // Partner userB no longer exists (account was deleted)
      vi.spyOn(User, "findById").mockResolvedValueOnce(null);

      const res = await verifyChatAccess(matchId, userA);
      expect(res.authorized).toBe(false);
      expect(res.status).toBe(404);
      expect(res.message).toContain("no longer available");
    });

    it("denies access to conversations that have been blocked", async () => {
      const matchId = new mongoose.Types.ObjectId();
      const userA = new mongoose.Types.ObjectId();
      const userB = new mongoose.Types.ObjectId();

      vi.spyOn(Match, "findById").mockResolvedValueOnce({
        _id: matchId,
        users: [userA, userB],
        status: "active",
        unmatchedAt: null,
      });

      vi.spyOn(User, "findById").mockResolvedValueOnce({
        _id: userB,
        profileCompleted: true,
      });

      vi.spyOn(Block, "findOne").mockResolvedValueOnce({
        blocker: userA,
        blocked: userB,
      });

      const res = await verifyChatAccess(matchId, userA);
      expect(res.authorized).toBe(false);
      expect(res.status).toBe(403);
      expect(res.message).toContain("safety restrictions");
    });
  });
});
