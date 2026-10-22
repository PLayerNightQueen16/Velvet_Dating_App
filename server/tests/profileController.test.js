import { describe, it, expect, vi } from "vitest";
import {
  getProfile,
  updateProfile,
  completeProfile,
  getUploadSignature,
  deletePhoto,
} from "../controllers/profile.controller.js";
import { isCloudinaryConfigured, generateUploadSignature } from "../utils/cloudinary.js";

describe("Profile Controller Unit Tests", () => {
  it("getProfile rejects unauthenticated requests (req.user missing)", async () => {
    const req = { user: null };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await getProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Authentication required." })
    );
  });

  it("getProfile returns safe profile for authenticated user", async () => {
    const mockUser = {
      toSafeProfile: vi.fn().mockReturnValue({
        id: "user123",
        name: "Clara",
        age: 26,
        profileCompleted: true,
      }),
    };
    const req = { user: mockUser };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await getProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockUser.toSafeProfile).toHaveBeenCalledWith(true);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      profile: expect.objectContaining({ name: "Clara", age: 26 }),
    });
  });

  it("completeProfile rejects if mandatory completion requirements are missing", async () => {
    const mockUser = {
      checkCompletionStatus: vi.fn().mockReturnValue({
        isComplete: false,
        missing: ["photos (mandatory at least 3 required, up to 5)"],
      }),
      save: vi.fn(),
    };
    const req = { user: mockUser };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await completeProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("Required fields are missing"),
      })
    );
    expect(mockUser.save).not.toHaveBeenCalled();
  });

  it("completeProfile marks profile completed and saves when valid", async () => {
    const mockUser = {
      checkCompletionStatus: vi.fn().mockReturnValue({
        isComplete: true,
        missing: [],
      }),
      profileCompleted: false,
      save: vi.fn().mockResolvedValue(true),
      toSafeProfile: vi.fn().mockReturnValue({
        id: "user123",
        name: "Clara",
        profileCompleted: true,
      }),
    };
    const req = { user: mockUser };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await completeProfile(req, res);
    expect(mockUser.profileCompleted).toBe(true);
    expect(mockUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("updateProfile rejects underage date of birth", async () => {
    const today = new Date();
    const underageDob = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate()).toISOString();

    const mockUser = {
      dateOfBirth: null,
      save: vi.fn(),
    };
    const req = {
      user: mockUser,
      body: { dateOfBirth: underageDob },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("18 years old"),
      })
    );
    expect(mockUser.save).not.toHaveBeenCalled();
  });

  it("updateProfile rejects duplicate prompts", async () => {
    const mockUser = {
      save: vi.fn(),
      prompts: [],
    };
    const req = {
      user: mockUser,
      body: {
        prompts: [
          { prompt: "A hill I'll die on...", answer: "Pineapple on pizza is good." },
          { prompt: "A hill I'll die on...", answer: "Different answer same question." },
        ],
      },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("Duplicate prompt question"),
      })
    );
  });

  it("updateProfile preserves unrelated existing fields when doing partial update", async () => {
    const mockUser = {
      name: "Existing Name",
      bio: "Existing Bio",
      location: "Paris",
      interests: ["Jazz & Blues"],
      preferences: {
        ageRange: { min: 21, max: 35 },
        interestedIn: ["everyone"],
        distanceKm: 50,
      },
      checkCompletionStatus: vi.fn().mockReturnValue({ isComplete: false, missing: [] }),
      save: vi.fn().mockResolvedValue(true),
      toSafeProfile: vi.fn().mockReturnValue({
        name: "Existing Name",
        bio: "Updated Bio Text Only",
        location: "Paris",
      }),
    };

    const req = {
      user: mockUser,
      body: { bio: "Updated Bio Text Only" },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockUser.name).toBe("Existing Name");
    expect(mockUser.location).toBe("Paris");
    expect(mockUser.bio).toBe("Updated Bio Text Only");
    expect(mockUser.save).toHaveBeenCalled();
  });
});

describe("Cloudinary Upload Signature & Integration", () => {
  it("generates signed upload params without leaking secret if configured", () => {
    if (isCloudinaryConfigured()) {
      const sig = generateUploadSignature("user_abc_123", 1700000000);
      expect(sig).toHaveProperty("signature");
      expect(sig).toHaveProperty("apiKey");
      expect(sig).toHaveProperty("cloudName");
      expect(sig).toHaveProperty("timestamp", 1700000000);
      expect(sig).toHaveProperty("folder", "velvet/profiles/user_abc_123");
      // Must NOT contain api_secret
      expect(sig).not.toHaveProperty("api_secret");
      expect(sig).not.toHaveProperty("CLOUDINARY_API_SECRET");
    }
  });

  it("getUploadSignature endpoint returns signed params when configured", async () => {
    if (isCloudinaryConfigured()) {
      const req = { user: { _id: "650000000000000000000001" } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getUploadSignature(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          cloudinaryAvailable: true,
          signature: expect.any(String),
          apiKey: expect.any(String),
        })
      );
    }
  });
});
