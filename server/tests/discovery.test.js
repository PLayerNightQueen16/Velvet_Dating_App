import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import {
  getDiscovery,
  likeProfile,
  passProfile,
  blockUser,
  unblockUser,
} from "../controllers/discovery.controller.js";
import { User } from "../models/user.model.js";
import { Swipe } from "../models/swipe.model.js";
import { Block } from "../models/block.model.js";
import { Like } from "../models/like.model.js";
import { Match } from "../models/match.model.js";

describe("Discovery Controller & Safety Rules", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Like, "findOneAndUpdate").mockResolvedValue({});
    vi.spyOn(Like, "findOne").mockResolvedValue(null);
    vi.spyOn(Like, "findOneAndDelete").mockResolvedValue({});
    vi.spyOn(Like, "deleteMany").mockResolvedValue({});
    vi.spyOn(Match, "find").mockReturnValue({
      select: vi.fn().mockResolvedValue([]),
    });
    vi.spyOn(Match, "findOne").mockResolvedValue(null);
    vi.spyOn(Match, "findOneAndUpdate").mockResolvedValue(null);
  });
  describe("GET /api/discovery - Authorization & Parameter Validation", () => {
    it("rejects incomplete requester profiles with 403", async () => {
      const req = {
        user: {
          _id: new mongoose.Types.ObjectId(),
          profileCompleted: false,
        },
        query: {},
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getDiscovery(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("complete your profile"),
        })
      );
    });

    it("rejects invalid page parameters (non-positive or NaN) with 400", async () => {
      const req = {
        user: { _id: new mongoose.Types.ObjectId(), profileCompleted: true },
        query: { page: "-1" },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getDiscovery(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining("positive integer") })
      );
    });

    it("rejects invalid limit parameters with 400", async () => {
      const req = {
        user: { _id: new mongoose.Types.ObjectId(), profileCompleted: true },
        query: { limit: "invalid" },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getDiscovery(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining("Limit must be a positive integer") })
      );
    });

    it("rejects minAge < 18 with 400", async () => {
      const req = {
        user: { _id: new mongoose.Types.ObjectId(), profileCompleted: true },
        query: { minAge: "16" },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getDiscovery(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining("cannot be below 18") })
      );
    });

    it("rejects minAge > maxAge with 400", async () => {
      const req = {
        user: { _id: new mongoose.Types.ObjectId(), profileCompleted: true },
        query: { minAge: "40", maxAge: "25" },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getDiscovery(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining("minAge cannot be greater than maxAge") })
      );
    });

    it("rejects maxAge > 100 with 400", async () => {
      const req = {
        user: { _id: new mongoose.Types.ObjectId(), profileCompleted: true },
        query: { maxAge: "115" },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getDiscovery(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining("cannot exceed 100") })
      );
    });

    it("rejects unsupported gender filter values with 400", async () => {
      const req = {
        user: { _id: new mongoose.Types.ObjectId(), profileCompleted: true },
        query: { genders: "alien,martian" },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getDiscovery(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining("Unsupported gender filter") })
      );
    });

    it("rejects unsupported relationshipIntent filter values with 400", async () => {
      const req = {
        user: { _id: new mongoose.Types.ObjectId(), profileCompleted: true },
        query: { relationshipIntent: "secret-affair" },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getDiscovery(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining("Unsupported relationshipIntent") })
      );
    });
  });

  describe("Discovery Response Privacy & Sanitization", () => {
    it("toDiscoveryProfile never exposes passwords, emails, raw date of birth, or preferences", () => {
      const today = new Date();
      const dob = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());

      const user = new User({
        name: "Chloe",
        username: "chloe_paris",
        email: "private_chloe@example.com",
        password: "super_secret_hashed_pw",
        dateOfBirth: dob,
        gender: "woman",
        bio: "Art lover in Paris",
        relationshipIntent: "long-term",
        photos: [
          { url: "https://res.cloudinary.com/demo/image/upload/p1.jpg", isPrimary: true },
        ],
        preferences: {
          interestedIn: ["men"],
          ageRange: { min: 24, max: 35 },
          distanceKm: 40,
        },
      });

      const discoveryProfile = user.toDiscoveryProfile();

      // Allowed public fields:
      expect(discoveryProfile).toHaveProperty("id");
      expect(discoveryProfile.name).toBe("Chloe");
      expect(discoveryProfile.username).toBe("chloe_paris");
      expect(discoveryProfile.age).toBe(25);
      expect(discoveryProfile.gender).toBe("woman");
      expect(discoveryProfile.bio).toBe("Art lover in Paris");
      expect(discoveryProfile.relationshipIntent).toBe("long-term");
      expect(discoveryProfile.photos).toHaveLength(1);

      // Sensitive fields that MUST NEVER leak to potential dates:
      expect(discoveryProfile.password).toBeUndefined();
      expect(discoveryProfile.email).toBeUndefined();
      expect(discoveryProfile.dateOfBirth).toBeUndefined();
      expect(discoveryProfile.preferences).toBeUndefined();
      expect(discoveryProfile.tokens).toBeUndefined();
    });
  });

  describe("POST /api/discovery/:userId/like", () => {
    it("rejects invalid ObjectId with 400", async () => {
      const req = {
        user: { _id: new mongoose.Types.ObjectId() },
        params: { userId: "invalid-id" },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await likeProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "Invalid profile ID." })
      );
    });

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

    it("rejects liking ineligible/nonexistent/incomplete targets with 404", async () => {
      const req = {
        user: { _id: new mongoose.Types.ObjectId() },
        params: { userId: new mongoose.Types.ObjectId().toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // Mock User.findById returning null
      vi.spyOn(User, "findById").mockResolvedValueOnce(null);

      await likeProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining("ineligible") })
      );
    });

    it("rejects liking a blocked user with 403", async () => {
      const myId = new mongoose.Types.ObjectId();
      const targetId = new mongoose.Types.ObjectId().toString();

      const req = {
        user: { _id: myId },
        params: { userId: targetId },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(User, "findById").mockResolvedValueOnce({ profileCompleted: true });
      vi.spyOn(Block, "findOne").mockResolvedValueOnce({ _id: new mongoose.Types.ObjectId() });

      await likeProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining("safety restrictions") })
      );
    });

    it("successfully creates or updates a like with 200 without creating a match", async () => {
      const myId = new mongoose.Types.ObjectId();
      const targetId = new mongoose.Types.ObjectId().toString();

      const req = {
        user: { _id: myId },
        params: { userId: targetId },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(User, "findById").mockResolvedValueOnce({ profileCompleted: true });
      vi.spyOn(Block, "findOne").mockResolvedValueOnce(null);
      const findOneAndUpdateSpy = vi.spyOn(Swipe, "findOneAndUpdate").mockResolvedValueOnce({
        actor: myId,
        target: targetId,
        action: "like",
      });

      await likeProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Liked successfully.",
          action: "like",
        })
      );
      expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        { actor: myId, target: targetId },
        { action: "like" },
        expect.objectContaining({ upsert: true })
      );
    });
  });

  describe("POST /api/discovery/:userId/pass", () => {
    it("rejects passing on oneself with 400", async () => {
      const myId = new mongoose.Types.ObjectId();
      const req = {
        user: { _id: myId },
        params: { userId: myId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await passProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "You cannot pass on your own profile." })
      );
    });

    it("successfully records a pass with action 'pass'", async () => {
      const myId = new mongoose.Types.ObjectId();
      const targetId = new mongoose.Types.ObjectId().toString();

      const req = {
        user: { _id: myId },
        params: { userId: targetId },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(User, "findById").mockResolvedValueOnce({ profileCompleted: true });
      vi.spyOn(Block, "findOne").mockResolvedValueOnce(null);
      vi.spyOn(Swipe, "findOneAndUpdate").mockResolvedValueOnce({
        actor: myId,
        target: targetId,
        action: "pass",
      });

      await passProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          action: "pass",
        })
      );
    });
  });

  describe("Block and Unblock Safety Operations", () => {
    it("rejects blocking oneself with 400", async () => {
      const myId = new mongoose.Types.ObjectId();
      const req = {
        user: { _id: myId },
        params: { userId: myId.toString() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await blockUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "You cannot block yourself." })
      );
    });

    it("successfully blocks a target with 200", async () => {
      const myId = new mongoose.Types.ObjectId();
      const targetId = new mongoose.Types.ObjectId().toString();

      const req = {
        user: { _id: myId },
        params: { userId: targetId },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(Block, "findOneAndUpdate").mockResolvedValueOnce({
        blocker: myId,
        blocked: targetId,
      });

      await blockUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: "User blocked successfully." })
      );
    });

    it("successfully unblocks a target with 200", async () => {
      const myId = new mongoose.Types.ObjectId();
      const targetId = new mongoose.Types.ObjectId().toString();

      const req = {
        user: { _id: myId },
        params: { userId: targetId },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(Block, "findOneAndDelete").mockResolvedValueOnce({
        blocker: myId,
        blocked: targetId,
      });

      await unblockUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: "User unblocked successfully." })
      );
    });
  });

  describe("Model Compound Indexes & Validation", () => {
    it("Swipe model enforces required actor, target, and valid action enum", async () => {
      const swipe = new Swipe({});
      const err = await swipe.validate().catch((e) => e);
      expect(err).toBeDefined();
      expect(err.errors["actor"]).toBeDefined();
      expect(err.errors["target"]).toBeDefined();
      expect(err.errors["action"]).toBeDefined();
    });

    it("Swipe model rejects invalid action enum", async () => {
      const swipe = new Swipe({
        actor: new mongoose.Types.ObjectId(),
        target: new mongoose.Types.ObjectId(),
        action: "super-like", // Not supported in Batch 4!
      });
      const err = await swipe.validate().catch((e) => e);
      expect(err).toBeDefined();
      expect(err.errors["action"]).toBeDefined();
    });

    it("Block model enforces required blocker and blocked references", async () => {
      const block = new Block({});
      const err = await block.validate().catch((e) => e);
      expect(err).toBeDefined();
      expect(err.errors["blocker"]).toBeDefined();
      expect(err.errors["blocked"]).toBeDefined();
    });
  });
});
