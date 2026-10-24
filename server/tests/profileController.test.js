import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getProfile,
  updateProfile,
  completeProfile,
  getUploadSignature,
  addPhoto,
  setPrimaryPhoto,
  deletePhoto,
} from "../controllers/profile.controller.js";
import * as cloudinaryUtils from "../utils/cloudinary.js";
const { isCloudinaryConfigured, generateUploadSignature } = cloudinaryUtils;

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

describe("Photo Upload Controller (Cloudinary Integration)", () => {
  it("enforces maximum 5 photos limit", async () => {
    const mockUser = {
      photos: [
        { _id: "1", url: "https://res.cloudinary.com/demo/image/upload/p1.jpg" },
        { _id: "2", url: "https://res.cloudinary.com/demo/image/upload/p2.jpg" },
        { _id: "3", url: "https://res.cloudinary.com/demo/image/upload/p3.jpg" },
        { _id: "4", url: "https://res.cloudinary.com/demo/image/upload/p4.jpg" },
        { _id: "5", url: "https://res.cloudinary.com/demo/image/upload/p5.jpg" },
      ],
      save: vi.fn(),
    };

    const req = {
      user: mockUser,
      file: { buffer: Buffer.from("fake-image"), originalname: "test.jpg" },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await addPhoto(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("maximum limit of 5 photos"),
      })
    );
    expect(mockUser.save).not.toHaveBeenCalled();
  });

  it("returns 503 if Cloudinary is not configured and does NOT create a local record", async () => {
    vi.spyOn(cloudinaryUtils, "isCloudinaryConfigured").mockReturnValue(false);

    const mockUser = {
      _id: "user_123",
      photos: [],
      save: vi.fn(),
    };
    const req = {
      user: mockUser,
      file: { buffer: Buffer.from("image-bytes"), originalname: "pic.jpg" },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await addPhoto(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("Cloudinary"),
      })
    );
    // CRITICAL: Must not silently fall back to local disk or push into user.photos
    expect(mockUser.photos).toHaveLength(0);
    expect(mockUser.save).not.toHaveBeenCalled();
  });

  it("handles Cloudinary upload failure gracefully without saving broken database record", async () => {
    vi.spyOn(cloudinaryUtils, "isCloudinaryConfigured").mockReturnValue(true);
    vi.spyOn(cloudinaryUtils, "uploadImageBuffer").mockRejectedValue(new Error("Cloudinary network timeout"));

    const mockUser = {
      _id: "user_123",
      photos: [],
      save: vi.fn(),
    };
    const req = {
      user: mockUser,
      file: { buffer: Buffer.from("image-bytes"), originalname: "pic.jpg" },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await addPhoto(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("Failed to upload image to Cloudinary"),
      })
    );
    // Must NOT push into user.photos or save
    expect(mockUser.photos).toHaveLength(0);
    expect(mockUser.save).not.toHaveBeenCalled();
  });

  it("successfully uploads image buffer to Cloudinary and saves secure_url and public_id", async () => {
    vi.spyOn(cloudinaryUtils, "isCloudinaryConfigured").mockReturnValue(true);
    vi.spyOn(cloudinaryUtils, "uploadImageBuffer").mockResolvedValue({
      url: "https://res.cloudinary.com/test-cloud/image/upload/v1234/velvet/profiles/user_123/img.jpg",
      publicId: "velvet/profiles/user_123/img",
    });

    const mockUser = {
      _id: "user_123",
      photos: [],
      checkCompletionStatus: vi.fn().mockReturnValue({ isComplete: false }),
      save: vi.fn().mockResolvedValue(true),
      toSafeProfile: vi.fn().mockReturnValue({
        photos: [
          {
            id: "ph_1",
            url: "https://res.cloudinary.com/test-cloud/image/upload/v1234/velvet/profiles/user_123/img.jpg",
            publicId: "velvet/profiles/user_123/img",
            isPrimary: true,
          },
        ],
      }),
    };
    const req = {
      user: mockUser,
      file: { buffer: Buffer.from("image-bytes"), originalname: "portrait.jpg" },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await addPhoto(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockUser.photos).toHaveLength(1);
    expect(mockUser.photos[0]).toEqual({
      url: "https://res.cloudinary.com/test-cloud/image/upload/v1234/velvet/profiles/user_123/img.jpg",
      publicId: "velvet/profiles/user_123/img",
      isPrimary: true,
    });
    expect(mockUser.photos[0].publicId).not.toContain("local:");
    expect(mockUser.save).toHaveBeenCalled();
  });

  it("uploads external HTTPS URL to Cloudinary and saves Cloudinary asset details", async () => {
    vi.spyOn(cloudinaryUtils, "isCloudinaryConfigured").mockReturnValue(true);
    vi.spyOn(cloudinaryUtils, "uploadImageUrl").mockResolvedValue({
      url: "https://res.cloudinary.com/test-cloud/image/upload/v5678/velvet/profiles/user_123/unsplash.jpg",
      publicId: "velvet/profiles/user_123/unsplash",
    });

    const mockUser = {
      _id: "user_123",
      photos: [{ url: "https://res.cloudinary.com/demo/p1.jpg", publicId: "velvet/profiles/user_123/p1", isPrimary: true }],
      checkCompletionStatus: vi.fn().mockReturnValue({ isComplete: false }),
      save: vi.fn().mockResolvedValue(true),
      toSafeProfile: vi.fn().mockReturnValue({ photos: [] }),
    };

    const req = {
      user: mockUser,
      body: { url: "https://images.unsplash.com/photo-12345" },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await addPhoto(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockUser.photos).toHaveLength(2);
    expect(mockUser.photos[1]).toEqual({
      url: "https://res.cloudinary.com/test-cloud/image/upload/v5678/velvet/profiles/user_123/unsplash.jpg",
      publicId: "velvet/profiles/user_123/unsplash",
      isPrimary: false,
    });
    expect(mockUser.save).toHaveBeenCalled();
  });

  it("rejects non-HTTPS URLs or localhost/uploads schemes", async () => {
    const mockUser = { photos: [] };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await addPhoto({ user: mockUser, body: { url: "http://insecure.com/pic.jpg" } }, res);
    expect(res.status).toHaveBeenCalledWith(400);

    await addPhoto({ user: mockUser, body: { url: "https://localhost:8000/uploads/profiles/1.jpg" } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("Photo Deletion & Primary Reassignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("deletes photo and calls deleteCloudinaryImage for Cloudinary publicId", async () => {
    const deleteCloudSpy = vi.spyOn(cloudinaryUtils, "deleteCloudinaryImage").mockResolvedValue(true);

    const mockPhoto = {
      _id: "photo_123",
      url: "https://res.cloudinary.com/test-cloud/image/upload/v1/velvet/profiles/u1/photo_123.jpg",
      publicId: "velvet/profiles/u1/photo_123",
      isPrimary: false,
    };

    const mockUser = {
      _id: "u1",
      photos: {
        id: vi.fn().mockReturnValue(mockPhoto),
        pull: vi.fn(),
        length: 2,
      },
      checkCompletionStatus: vi.fn().mockReturnValue({ isComplete: false }),
      save: vi.fn().mockResolvedValue(true),
      toSafeProfile: vi.fn().mockReturnValue({ photos: [] }),
    };

    const req = { user: mockUser, params: { photoId: "photo_123" } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await deletePhoto(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockUser.photos.pull).toHaveBeenCalledWith({ _id: "photo_123" });
    expect(mockUser.save).toHaveBeenCalled();
    expect(deleteCloudSpy).toHaveBeenCalledWith("velvet/profiles/u1/photo_123");
  });

  it("does NOT call deleteCloudinaryImage when deleting a legacy local: publicId", async () => {
    const deleteCloudSpy = vi.spyOn(cloudinaryUtils, "deleteCloudinaryImage").mockResolvedValue(true);

    const mockPhoto = {
      _id: "legacy_photo_456",
      url: "https://velvet-dating-app.onrender.com/uploads/profiles/u1/1793133040081-lpcogl.jpg",
      publicId: "local:1793133040081-lpcogl.jpg",
      isPrimary: false,
    };

    const mockUser = {
      _id: "u1",
      photos: {
        id: vi.fn().mockReturnValue(mockPhoto),
        pull: vi.fn(),
        length: 1,
      },
      checkCompletionStatus: vi.fn().mockReturnValue({ isComplete: false }),
      save: vi.fn().mockResolvedValue(true),
      toSafeProfile: vi.fn().mockReturnValue({ photos: [] }),
    };

    const req = { user: mockUser, params: { photoId: "legacy_photo_456" } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await deletePhoto(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockUser.photos.pull).toHaveBeenCalledWith({ _id: "legacy_photo_456" });
    // Must NOT call Cloudinary for local: publicIds!
    expect(deleteCloudSpy).not.toHaveBeenCalled();
  });

  it("reassigns first remaining photo as primary when primary photo is deleted", async () => {
    const remainingPhoto = { _id: "ph_2", isPrimary: false };
    const deletedPhoto = { _id: "ph_1", isPrimary: true, publicId: "velvet/profiles/u1/ph_1" };

    const photosArray = [remainingPhoto];
    photosArray.id = vi.fn().mockReturnValue(deletedPhoto);
    photosArray.pull = vi.fn();

    const mockUser = {
      _id: "u1",
      photos: photosArray,
      checkCompletionStatus: vi.fn().mockReturnValue({ isComplete: false }),
      save: vi.fn().mockResolvedValue(true),
      toSafeProfile: vi.fn().mockReturnValue({ photos: [] }),
    };

    const req = { user: mockUser, params: { photoId: "ph_1" } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await deletePhoto(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(remainingPhoto.isPrimary).toBe(true);
    expect(mockUser.save).toHaveBeenCalled();
  });
});

describe("Primary Photo Selection", () => {
  it("setPrimaryPhoto sets chosen photo to true and all others to false", async () => {
    const photo1 = { _id: { toString: () => "ph_1" }, isPrimary: true };
    const photo2 = { _id: { toString: () => "ph_2" }, isPrimary: false };

    const photos = [photo1, photo2];
    photos.id = vi.fn().mockImplementation((id) => photos.find((p) => p._id.toString() === id));

    const mockUser = {
      photos,
      save: vi.fn().mockResolvedValue(true),
      toSafeProfile: vi.fn().mockReturnValue({ photos }),
    };

    const req = { user: mockUser, params: { photoId: "ph_2" } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await setPrimaryPhoto(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(photo1.isPrimary).toBe(false);
    expect(photo2.isPrimary).toBe(true);
    expect(mockUser.save).toHaveBeenCalled();
  });
});
