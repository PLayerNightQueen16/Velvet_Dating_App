import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import fs from "fs";
import {
  isImageBuffer,
  maskMongoUri,
  runLegacyPhotoMigration,
} from "../scripts/migrateLegacyPhotos.js";
import { User } from "../models/user.model.js";
import * as cloudinaryUtils from "../utils/cloudinary.js";

describe("Legacy Photo Migration Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(mongoose, "connect").mockResolvedValue(true);
    vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(1);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  });

  describe("Binary Image Detection & URL Masking", () => {
    it("detects valid image formats via magic numbers", () => {
      // JPEG magic: FF D8 FF
      const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      expect(isImageBuffer(jpeg)).toBe(true);

      // PNG magic: 89 50 4E 47
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      expect(isImageBuffer(png)).toBe(true);

      // WebP magic: RIFF .... WEBP
      const webp = Buffer.from("RIFF\x20\x00\x00\x00WEBPVP8 ");
      expect(isImageBuffer(webp)).toBe(true);

      // Plain text or empty buffer is rejected
      const text = Buffer.from("<html><head><title>404 Not Found</title></head></html>");
      expect(isImageBuffer(text)).toBe(false);
      expect(isImageBuffer(null)).toBe(false);
      expect(isImageBuffer(Buffer.alloc(5))).toBe(false);
    });

    it("masks MongoDB credentials in connection URIs", () => {
      const atlasUri = "mongodb+srv://velvet_admin:superSecret123@cluster0.abcde.mongodb.net/velvet_prod?retryWrites=true";
      const masked = maskMongoUri(atlasUri);
      expect(masked).toContain("velvet_admin:****@");
      expect(masked).not.toContain("superSecret123");

      const localUri = "mongodb://user:pass@127.0.0.1:27017/velvet";
      expect(maskMongoUri(localUri)).toContain("user:****@");
    });
  });

  describe("Dry Run Mode & Photo Classification", () => {
    it("classifies Cloudinary photos, skips duplicates, and flags unavailable photos without writing to MongoDB", async () => {
      const userId = new mongoose.Types.ObjectId();
      const photo1Id = new mongoose.Types.ObjectId();
      const photo2Id = new mongoose.Types.ObjectId();

      const mockUser = {
        _id: userId,
        name: "Elena Rostova",
        email: "elena@example.com",
        photos: [
          {
            _id: photo1Id,
            url: "https://res.cloudinary.com/test-cloud/image/upload/v1/velvet/profiles/u1/existing.jpg",
            publicId: "velvet/profiles/u1/existing",
            isPrimary: true,
          },
          {
            _id: photo2Id,
            url: "https://velvet-dating-app.onrender.com/uploads/profiles/u1/1793133040081-wiped.jpg",
            publicId: "local:1793133040081-wiped.jpg",
            isPrimary: false,
          },
        ],
      };

      // Mock cursor
      const mockCursor = {
        [Symbol.asyncIterator]: async function* () {
          yield mockUser;
        },
      };

      vi.spyOn(User, "find").mockReturnValue({
        select: vi.fn().mockReturnValue({
          cursor: vi.fn().mockReturnValue(mockCursor),
        }),
      });

      const updateOneSpy = vi.spyOn(User, "updateOne").mockResolvedValue({ acknowledged: true });
      const uploadSpy = vi.spyOn(cloudinaryUtils, "uploadImageBuffer");

      // Run in dry-run mode
      const result = await runLegacyPhotoMigration({ dryRun: true, silent: true });

      expect(result.success).toBe(true);
      expect(result.summary.mode).toBe("DRY_RUN");
      expect(result.summary.totalUsersScanned).toBe(1);
      expect(result.summary.totalPhotosScanned).toBe(2);
      expect(result.summary.alreadyCloudinary).toBe(1); // photo1 was skipped
      expect(result.summary.unavailableMarked).toBe(1); // photo2 was unavailable

      // In dry-run mode, NO write operations occur
      expect(updateOneSpy).not.toHaveBeenCalled();
      expect(uploadSpy).not.toHaveBeenCalled();
    });
  });

  describe("Live Write Mode & Targeted Updates", () => {
    it("performs targeted MongoDB updates with positional operator and flags unavailable photos with requiresReupload", async () => {
      vi.spyOn(cloudinaryUtils, "isCloudinaryConfigured").mockReturnValue(true);

      const userId = new mongoose.Types.ObjectId();
      const photoId = new mongoose.Types.ObjectId();

      const mockUser = {
        _id: userId,
        name: "Chloe V.",
        email: "chloe@example.com",
        photos: [
          {
            _id: photoId,
            url: "https://velvet-dating-app.onrender.com/uploads/profiles/u1/1793133040081-lost.jpg",
            publicId: "local:1793133040081-lost.jpg",
            isPrimary: true,
          },
        ],
      };

      const mockCursor = {
        [Symbol.asyncIterator]: async function* () {
          yield mockUser;
        },
      };

      vi.spyOn(User, "find").mockImplementation((query) => {
        // Handle backup find query
        if (query && query["photos.0"]) {
          return {
            lean: vi.fn().mockResolvedValue([mockUser]),
            select: vi.fn().mockReturnValue({
              cursor: vi.fn().mockReturnValue(mockCursor),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            cursor: vi.fn().mockReturnValue(mockCursor),
          }),
        };
      });

      const updateOneSpy = vi.spyOn(User, "updateOne").mockResolvedValue({ acknowledged: true, modifiedCount: 1 });

      const result = await runLegacyPhotoMigration({ dryRun: false, backup: false, silent: true });

      expect(result.success).toBe(true);
      expect(result.summary.totalUsersScanned).toBe(1);
      expect(result.summary.unavailableMarked).toBe(1);

      // Targeted update must be called with positional $ operator
      expect(updateOneSpy).toHaveBeenCalledWith(
        { _id: userId, "photos._id": photoId },
        {
          $set: {
            "photos.$.requiresReupload": true,
          },
        }
      );
    });

    it("successfully migrates accessible legacy photos via URL to Cloudinary and updates MongoDB", async () => {
      vi.spyOn(cloudinaryUtils, "isCloudinaryConfigured").mockReturnValue(true);

      // Valid JPEG header > 100 bytes
      const fakeImageBytes = Buffer.alloc(256);
      fakeImageBytes[0] = 0xff;
      fakeImageBytes[1] = 0xd8;
      fakeImageBytes[2] = 0xff;
      fakeImageBytes[3] = 0xe0;

      // Mock successful fetch of valid image
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "image/jpeg" }),
        arrayBuffer: async () => fakeImageBytes,
      }));

      // Mock Cloudinary upload
      const uploadSpy = vi.spyOn(cloudinaryUtils, "uploadImageBuffer").mockResolvedValue({
        url: "https://res.cloudinary.com/test-cloud/image/upload/v1700000000/velvet/profiles/u1/photo1.jpg",
        publicId: "velvet/profiles/u1/photo1",
      });

      const userId = new mongoose.Types.ObjectId();
      const photoId = new mongoose.Types.ObjectId();

      const mockUser = {
        _id: userId,
        name: "Marcus Aurelius",
        email: "marcus@example.com",
        photos: [
          {
            _id: photoId,
            url: "https://velvet-dating-app.onrender.com/uploads/profiles/u1/marcus-profile.jpg",
            publicId: "local:marcus-profile.jpg",
            isPrimary: true,
          },
        ],
      };

      const mockCursor = {
        [Symbol.asyncIterator]: async function* () {
          yield mockUser;
        },
      };

      vi.spyOn(User, "find").mockImplementation((query) => {
        if (query && query["photos.0"]) {
          return {
            lean: vi.fn().mockResolvedValue([mockUser]),
            select: vi.fn().mockReturnValue({
              cursor: vi.fn().mockReturnValue(mockCursor),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            cursor: vi.fn().mockReturnValue(mockCursor),
          }),
        };
      });

      const updateOneSpy = vi.spyOn(User, "updateOne").mockResolvedValue({ acknowledged: true, modifiedCount: 1 });

      const result = await runLegacyPhotoMigration({ dryRun: false, backup: false, silent: true });

      expect(result.success).toBe(true);
      expect(result.summary.totalUsersScanned).toBe(1);
      expect(result.summary.successfullyMigrated).toBe(1);
      expect(result.summary.unavailableMarked).toBe(0);
      expect(uploadSpy).toHaveBeenCalledWith(fakeImageBytes, userId.toString());

      // Positional update replaces legacy URL and publicId, clearing requiresReupload
      expect(updateOneSpy).toHaveBeenCalledWith(
        { _id: userId, "photos._id": photoId },
        {
          $set: {
            "photos.$.url": "https://res.cloudinary.com/test-cloud/image/upload/v1700000000/velvet/profiles/u1/photo1.jpg",
            "photos.$.publicId": "velvet/profiles/u1/photo1",
            "photos.$.requiresReupload": false,
          },
        }
      );
    });

    it("successfully migrates photos recovered from the local filesystem", async () => {
      vi.spyOn(cloudinaryUtils, "isCloudinaryConfigured").mockReturnValue(true);

      const fakeImageBytes = Buffer.alloc(256);
      fakeImageBytes[0] = 0x89;
      fakeImageBytes[1] = 0x50;
      fakeImageBytes[2] = 0x4e;
      fakeImageBytes[3] = 0x47;

      // Mock filesystem existence and read
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "statSync").mockReturnValue({ size: 1024 });
      vi.spyOn(fs, "readFileSync").mockReturnValue(fakeImageBytes);

      const uploadSpy = vi.spyOn(cloudinaryUtils, "uploadImageBuffer").mockResolvedValue({
        url: "https://res.cloudinary.com/test-cloud/image/upload/v1700000000/velvet/profiles/u2/diskphoto.png",
        publicId: "velvet/profiles/u2/diskphoto",
      });

      const userId = new mongoose.Types.ObjectId();
      const photoId = new mongoose.Types.ObjectId();

      const mockUser = {
        _id: userId,
        name: "Sophia Chen",
        email: "sophia@example.com",
        photos: [
          {
            _id: photoId,
            url: "https://velvet-dating-app.onrender.com/uploads/profiles/u2/diskphoto.png",
            publicId: "local:diskphoto.png",
            isPrimary: false,
          },
        ],
      };

      const mockCursor = {
        [Symbol.asyncIterator]: async function* () {
          yield mockUser;
        },
      };

      vi.spyOn(User, "find").mockImplementation((query) => {
        if (query && query["photos.0"]) {
          return {
            lean: vi.fn().mockResolvedValue([mockUser]),
            select: vi.fn().mockReturnValue({
              cursor: vi.fn().mockReturnValue(mockCursor),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            cursor: vi.fn().mockReturnValue(mockCursor),
          }),
        };
      });

      const updateOneSpy = vi.spyOn(User, "updateOne").mockResolvedValue({ acknowledged: true, modifiedCount: 1 });

      const result = await runLegacyPhotoMigration({ dryRun: false, backup: false, silent: true });

      expect(result.success).toBe(true);
      expect(result.summary.successfullyMigrated).toBe(1);
      expect(uploadSpy).toHaveBeenCalledWith(fakeImageBytes, userId.toString());
      expect(updateOneSpy).toHaveBeenCalledWith(
        { _id: userId, "photos._id": photoId },
        {
          $set: {
            "photos.$.url": "https://res.cloudinary.com/test-cloud/image/upload/v1700000000/velvet/profiles/u2/diskphoto.png",
            "photos.$.publicId": "velvet/profiles/u2/diskphoto",
            "photos.$.requiresReupload": false,
          },
        }
      );
    });
  });
});
