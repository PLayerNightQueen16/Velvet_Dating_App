import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import {
  likeProfile,
  passProfile,
  blockUser,
} from "../controllers/discovery.controller.js";
import {
  getIncomingLikes,
  getOutgoingLikes,
  withdrawLike,
} from "../controllers/likes.controller.js";
import {
  getMatches,
  unmatch,
} from "../controllers/matches.controller.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Match, getCanonicalPair } from "../models/match.model.js";
import { Swipe } from "../models/swipe.model.js";
import { Block } from "../models/block.model.js";

describe("Batch 5: Genuine Mutual Matching, Likes, Matches & Unmatching", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Canonical Pair & Match Model", () => {
    it("orders user IDs deterministically regardless of input order", () => {
      const idA = "507f1f77bcf86cd799439011";
      const idB = "507f1f77bcf86cd799439022";

      const [pair1A, pair1B] = getCanonicalPair(idA, idB);
      const [pair2A, pair2B] = getCanonicalPair(idB, idA);

      expect(pair1A).toBe(idA);
      expect(pair1B).toBe(idB);
      expect(pair2A).toBe(idA);
      expect(pair2B).toBe(idB);
    });

    it("Match model validates exactly two users and valid status enum", async () => {
      const u1 = new mongoose.Types.ObjectId();
      const u2 = new mongoose.Types.ObjectId();
      const [canon1, canon2] = getCanonicalPair(u1, u2);

      const validMatch = new Match({
        users: [canon1, canon2],
        user1: canon1,
        user2: canon2,
        status: "active",
      });

      const err = await validMatch.validate().catch((e) => e);
      expect(err).toBeUndefined();
    });

    it("Match model rejects invalid user count or invalid status enum", async () => {
      const u1 = new mongoose.Types.ObjectId();

      const invalidMatch = new Match({
        users: [u1],
        user1: u1,
        user2: u1,
        status: "invalid_status",
      });

      const err = await invalidMatch.validate().catch((e) => e);
      expect(err).toBeDefined();
      expect(err.errors["users"]).toBeDefined();
      expect(err.errors["status"]).toBeDefined();
    });
  });

  describe("Like Action & Genuine Mutual Matching", () => {
    it("rejects liking oneself with 400", async () => {
      const myId = new mongoose.Types.ObjectId();
      const req = {
        user: { _id: myId },
        params: { userId: myId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await likeProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "You cannot like your own profile." })
      );
    });

    it("rejects liking incompatible gender profiles with 400", async () => {
      const userAId = new mongoose.Types.ObjectId();
      const userBId = new mongoose.Types.ObjectId();

      const req = {
        user: {
          _id: userAId,
          gender: "man",
          preferences: { interestedIn: ["women"] },
        },
        params: { userId: userBId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(User, "findById").mockResolvedValueOnce({
        _id: userBId,
        gender: "man", // Incompatible with userA's interestedIn: ["women"]
        preferences: { interestedIn: ["women"] },
        profileCompleted: true,
      });
      vi.spyOn(Block, "findOne").mockResolvedValueOnce(null);

      await likeProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("preference criteria"),
        })
      );
    });

    it("creates a one-sided like without creating a match when no reciprocal like exists", async () => {
      const userAId = new mongoose.Types.ObjectId();
      const userBId = new mongoose.Types.ObjectId();

      const req = {
        user: {
          _id: userAId,
          gender: "woman",
          preferences: { interestedIn: ["men"] },
        },
        params: { userId: userBId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(User, "findById").mockResolvedValueOnce({
        _id: userBId,
        gender: "man",
        preferences: { interestedIn: ["women"] },
        profileCompleted: true,
      });
      vi.spyOn(Block, "findOne").mockResolvedValueOnce(null);
      vi.spyOn(Swipe, "findOneAndUpdate").mockResolvedValueOnce({});
      const likeSpy = vi.spyOn(Like, "findOneAndUpdate").mockResolvedValueOnce({});
      vi.spyOn(Like, "findOne").mockResolvedValueOnce(null); // No reciprocal like from B yet

      await likeProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(likeSpy).toHaveBeenCalledWith(
        { liker: userAId, liked: userBId.toString() },
        {},
        expect.objectContaining({ upsert: true })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          action: "like",
          data: {
            liked: true,
            matched: false,
            isNewMatch: false,
            match: null,
          },
        })
      );
    });

    it("creates an active match and reports isNewMatch: true when reciprocal like exists", async () => {
      const userAId = new mongoose.Types.ObjectId();
      const userBId = new mongoose.Types.ObjectId();
      const matchId = new mongoose.Types.ObjectId();
      const now = new Date();

      const req = {
        user: {
          _id: userAId,
          gender: "woman",
          preferences: { interestedIn: ["men"] },
        },
        params: { userId: userBId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(User, "findById").mockResolvedValueOnce({
        _id: userBId,
        gender: "man",
        preferences: { interestedIn: ["women"] },
        profileCompleted: true,
      });
      vi.spyOn(Block, "findOne").mockResolvedValueOnce(null);
      vi.spyOn(Swipe, "findOneAndUpdate").mockResolvedValueOnce({});
      vi.spyOn(Like, "findOneAndUpdate").mockResolvedValueOnce({});
      // B has already liked A:
      vi.spyOn(Like, "findOne").mockResolvedValueOnce({ liker: userBId, liked: userAId });
      // No match currently exists:
      vi.spyOn(Match, "findOne").mockResolvedValueOnce(null);
      // New match is created:
      vi.spyOn(Match, "create").mockResolvedValueOnce({
        _id: matchId,
        matchedAt: now,
      });

      await likeProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "It's a Match!",
          data: {
            liked: true,
            matched: true,
            isNewMatch: true,
            match: {
              id: matchId,
              matchedAt: now,
            },
          },
        })
      );
    });

    it("handles concurrent reciprocal likes by catching E11000 duplicate key and returning isNewMatch: false", async () => {
      const userAId = new mongoose.Types.ObjectId();
      const userBId = new mongoose.Types.ObjectId();
      const matchId = new mongoose.Types.ObjectId();
      const now = new Date();

      const req = {
        user: {
          _id: userAId,
          gender: "woman",
          preferences: { interestedIn: ["men"] },
        },
        params: { userId: userBId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(User, "findById").mockResolvedValueOnce({
        _id: userBId,
        gender: "man",
        preferences: { interestedIn: ["women"] },
        profileCompleted: true,
      });
      vi.spyOn(Block, "findOne").mockResolvedValueOnce(null);
      vi.spyOn(Swipe, "findOneAndUpdate").mockResolvedValueOnce({});
      vi.spyOn(Like, "findOneAndUpdate").mockResolvedValueOnce({});
      vi.spyOn(Like, "findOne").mockResolvedValueOnce({ liker: userBId, liked: userAId });
      vi.spyOn(Match, "findOne")
        .mockResolvedValueOnce(null) // first check before create sees no match
        .mockResolvedValueOnce({ _id: matchId, matchedAt: now }); // fallback read after E11000

      // Simulate MongoDB duplicate key error thrown by unique compound index on user1 + user2
      const duplicateKeyError = new Error("E11000 duplicate key error collection: velvet.matches index: user1_1_user2_1 dup key");
      duplicateKeyError.code = 11000;
      vi.spyOn(Match, "create").mockRejectedValueOnce(duplicateKeyError);

      await likeProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            liked: true,
            matched: true,
            isNewMatch: false, // Concurrent request already created it
            match: {
              id: matchId,
              matchedAt: now,
            },
          },
        })
      );
    });

    it("does not report isNewMatch: true or trigger celebration for already active match", async () => {
      const userAId = new mongoose.Types.ObjectId();
      const userBId = new mongoose.Types.ObjectId();
      const matchId = new mongoose.Types.ObjectId();
      const now = new Date();

      const req = {
        user: {
          _id: userAId,
          gender: "woman",
          preferences: { interestedIn: ["men"] },
        },
        params: { userId: userBId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(User, "findById").mockResolvedValueOnce({
        _id: userBId,
        gender: "man",
        preferences: { interestedIn: ["women"] },
        profileCompleted: true,
      });
      vi.spyOn(Block, "findOne").mockResolvedValueOnce(null);
      vi.spyOn(Swipe, "findOneAndUpdate").mockResolvedValueOnce({});
      vi.spyOn(Like, "findOneAndUpdate").mockResolvedValueOnce({});
      vi.spyOn(Like, "findOne").mockResolvedValueOnce({ liker: userBId, liked: userAId });
      vi.spyOn(Match, "findOne").mockResolvedValueOnce({
        _id: matchId,
        status: "active",
        matchedAt: now,
      });

      await likeProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Match already exists.",
          data: {
            liked: true,
            matched: true,
            isNewMatch: false,
            match: {
              id: matchId,
              matchedAt: now,
            },
          },
        })
      );
    });
  });

  describe("Pass Action & State Consistency", () => {
    it("rejects passing on a currently matched profile with 400", async () => {
      const actorId = new mongoose.Types.ObjectId();
      const targetId = new mongoose.Types.ObjectId();

      const req = {
        user: { _id: actorId },
        params: { userId: targetId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(User, "findById").mockResolvedValueOnce({ profileCompleted: true });
      vi.spyOn(Block, "findOne").mockResolvedValueOnce(null);
      vi.spyOn(Match, "findOne").mockResolvedValueOnce({ status: "active" });

      await passProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("unmatch explicitly"),
        })
      );
    });

    it("deletes active outgoing like when user passes on a candidate", async () => {
      const actorId = new mongoose.Types.ObjectId();
      const targetId = new mongoose.Types.ObjectId();

      const req = {
        user: { _id: actorId },
        params: { userId: targetId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(User, "findById").mockResolvedValueOnce({ profileCompleted: true });
      vi.spyOn(Block, "findOne").mockResolvedValueOnce(null);
      vi.spyOn(Match, "findOne").mockResolvedValueOnce(null);
      const deleteLikeSpy = vi.spyOn(Like, "findOneAndDelete").mockResolvedValueOnce({});
      vi.spyOn(Swipe, "findOneAndUpdate").mockResolvedValueOnce({});

      await passProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(deleteLikeSpy).toHaveBeenCalledWith({
        liker: actorId,
        liked: targetId.toString(),
      });
    });
  });

  describe("Incoming Likes (Received Likes)", () => {
    it("returns active incoming likes excluding blocked and matched users", async () => {
      const currentUserId = new mongoose.Types.ObjectId();
      const likerUser = {
        _id: new mongoose.Types.ObjectId(),
        name: "Clara Wine",
        profileCompleted: true,
        toDiscoveryProfile: vi.fn().mockReturnValue({
          id: "candidate123",
          name: "Clara Wine",
          age: 26,
          photos: [{ url: "https://res.cloudinary.com/demo/image/upload/sample.jpg" }],
        }),
      };

      const req = {
        user: { _id: currentUserId },
        query: { page: "1", limit: "10" },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(Block, "find")
        .mockReturnValueOnce({ distinct: vi.fn().mockResolvedValue([]) })
        .mockReturnValueOnce({ distinct: vi.fn().mockResolvedValue([]) });
      vi.spyOn(Match, "find").mockReturnValueOnce({
        select: vi.fn().mockResolvedValue([]),
      });

      vi.spyOn(Like, "countDocuments").mockResolvedValueOnce(1);
      vi.spyOn(Like, "find").mockReturnValueOnce({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValueOnce([
          { liker: likerUser, createdAt: new Date("2026-10-27T10:00:00Z") },
        ]),
      });

      await getIncomingLikes(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            profiles: [
              expect.objectContaining({
                id: "candidate123",
                name: "Clara Wine",
                likedAt: expect.any(Date),
              }),
            ],
            pagination: expect.objectContaining({
              total: 1,
              page: 1,
            }),
          }),
        })
      );
    });
  });

  describe("Outgoing Likes & Withdrawal", () => {
    it("returns active outgoing likes with privacy-safe profiles", async () => {
      const currentUserId = new mongoose.Types.ObjectId();
      const likedUser = {
        _id: new mongoose.Types.ObjectId(),
        name: "Julian Noir",
        profileCompleted: true,
        toDiscoveryProfile: vi.fn().mockReturnValue({
          id: "julian123",
          name: "Julian Noir",
          age: 29,
        }),
      };

      const req = {
        user: { _id: currentUserId },
        query: { page: "1", limit: "10" },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(Block, "find")
        .mockReturnValueOnce({ distinct: vi.fn().mockResolvedValue([]) })
        .mockReturnValueOnce({ distinct: vi.fn().mockResolvedValue([]) });
      vi.spyOn(Match, "find").mockReturnValueOnce({
        select: vi.fn().mockResolvedValue([]),
      });

      vi.spyOn(Like, "countDocuments").mockResolvedValueOnce(1);
      vi.spyOn(Like, "find").mockReturnValueOnce({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValueOnce([
          { liked: likedUser, createdAt: new Date("2026-10-27T08:00:00Z") },
        ]),
      });

      await getOutgoingLikes(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            profiles: [
              expect.objectContaining({
                id: "julian123",
                name: "Julian Noir",
              }),
            ],
          }),
        })
      );
    });

    it("rejects withdrawing like if pair is actively matched with 400", async () => {
      const actorId = new mongoose.Types.ObjectId();
      const targetId = new mongoose.Types.ObjectId();

      const req = {
        user: { _id: actorId },
        params: { userId: targetId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(Match, "findOne").mockResolvedValueOnce({ status: "active" });

      await withdrawLike(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Please unmatch instead"),
        })
      );
    });

    it("successfully withdraws an outgoing like and resets swipe status", async () => {
      const actorId = new mongoose.Types.ObjectId();
      const targetId = new mongoose.Types.ObjectId();

      const req = {
        user: { _id: actorId },
        params: { userId: targetId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(Match, "findOne").mockResolvedValueOnce(null);
      const deleteLikeSpy = vi.spyOn(Like, "findOneAndDelete").mockResolvedValueOnce({});
      const deleteSwipeSpy = vi.spyOn(Swipe, "findOneAndDelete").mockResolvedValueOnce({});

      await withdrawLike(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(deleteLikeSpy).toHaveBeenCalledWith({
        liker: actorId,
        liked: targetId.toString(),
      });
      expect(deleteSwipeSpy).toHaveBeenCalledWith({
        actor: actorId,
        target: targetId.toString(),
      });
    });
  });

  describe("Matches & Unmatching", () => {
    it("retrieves only active matches for authenticated user", async () => {
      const currentUserId = new mongoose.Types.ObjectId();
      const partnerUser = {
        _id: new mongoose.Types.ObjectId(),
        name: "Elena Rose",
        profileCompleted: true,
        toDiscoveryProfile: vi.fn().mockReturnValue({
          id: "elena123",
          name: "Elena Rose",
          age: 24,
        }),
      };

      const matchId = new mongoose.Types.ObjectId();
      const matchedAt = new Date("2026-10-27T12:00:00Z");

      const req = {
        user: { _id: currentUserId },
        query: {},
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(Block, "find")
        .mockReturnValueOnce({ distinct: vi.fn().mockResolvedValue([]) })
        .mockReturnValueOnce({ distinct: vi.fn().mockResolvedValue([]) });

      vi.spyOn(Match, "countDocuments").mockResolvedValueOnce(1);
      vi.spyOn(Match, "find").mockReturnValueOnce({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValueOnce([
          {
            _id: matchId,
            matchedAt,
            users: [{ _id: currentUserId }, partnerUser],
          },
        ]),
      });

      await getMatches(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            matches: [
              {
                matchId,
                matchedAt,
                partner: {
                  id: "elena123",
                  name: "Elena Rose",
                  age: 24,
                },
              },
            ],
          }),
        })
      );
    });

    it("rejects unauthorized user attempting to unmatch with 403", async () => {
      const intruderId = new mongoose.Types.ObjectId();
      const user1 = new mongoose.Types.ObjectId();
      const user2 = new mongoose.Types.ObjectId();
      const matchId = new mongoose.Types.ObjectId();

      const req = {
        user: { _id: intruderId },
        params: { matchId: matchId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(Match, "findById").mockResolvedValueOnce({
        _id: matchId,
        users: [user1, user2],
      });

      await unmatch(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining("not authorized") })
      );
    });

    it("unmatches active connection, updates status, and removes active likes", async () => {
      const participantId = new mongoose.Types.ObjectId();
      const partnerId = new mongoose.Types.ObjectId();
      const matchId = new mongoose.Types.ObjectId();

      const mockMatch = {
        _id: matchId,
        users: [participantId, partnerId],
        status: "active",
        save: vi.fn().mockResolvedValue(true),
      };

      const req = {
        user: { _id: participantId },
        params: { matchId: matchId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(Match, "findById").mockResolvedValueOnce(mockMatch);
      const deleteLikesSpy = vi.spyOn(Like, "deleteMany").mockResolvedValueOnce({});

      await unmatch(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockMatch.status).toBe("unmatched");
      expect(mockMatch.unmatchedBy).toBe(participantId);
      expect(mockMatch.save).toHaveBeenCalled();
      expect(deleteLikesSpy).toHaveBeenCalledWith({
        $or: [
          { liker: participantId, liked: partnerId },
          { liker: partnerId, liked: participantId },
        ],
      });
    });

    it("is safe and idempotent when unmatching an already unmatched record", async () => {
      const participantId = new mongoose.Types.ObjectId();
      const partnerId = new mongoose.Types.ObjectId();
      const matchId = new mongoose.Types.ObjectId();

      const mockMatch = {
        _id: matchId,
        users: [participantId, partnerId],
        status: "unmatched",
      };

      const req = {
        user: { _id: participantId },
        params: { matchId: matchId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(Match, "findById").mockResolvedValueOnce(mockMatch);

      await unmatch(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Match is already inactive.",
        })
      );
    });
  });

  describe("Blocking Safety Synchronization", () => {
    it("deactivates active match and deletes likes when a user blocks another", async () => {
      const blockerId = new mongoose.Types.ObjectId();
      const blockedId = new mongoose.Types.ObjectId();

      const req = {
        user: { _id: blockerId },
        params: { userId: blockedId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(Block, "findOneAndUpdate").mockResolvedValueOnce({});
      const deleteLikesSpy = vi.spyOn(Like, "deleteMany").mockResolvedValueOnce({});
      const matchUpdateSpy = vi.spyOn(Match, "findOneAndUpdate").mockResolvedValueOnce({});

      await blockUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(deleteLikesSpy).toHaveBeenCalled();
      expect(matchUpdateSpy).toHaveBeenCalled();
    });
  });
});
