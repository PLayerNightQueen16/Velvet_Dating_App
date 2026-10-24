import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import { isCloudinaryConfigured, uploadImageBuffer } from "../utils/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

/**
 * Checks whether a buffer appears to contain valid image binary data
 * by inspecting common magic bytes (JPEG, PNG, WebP, GIF, HEIC/AVIF).
 */
export function isImageBuffer(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }
  // WebP: RIFF .... WEBP
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return true;
  }
  // GIF: GIF87a or GIF89a
  if (buffer.toString("ascii", 0, 3) === "GIF") {
    return true;
  }
  // HEIC/AVIF: ....ftyp
  if (buffer.toString("ascii", 4, 8) === "ftyp") {
    return true;
  }
  return false;
}

/**
 * Masks database connection string to protect credentials in logs.
 */
export function maskMongoUri(uri) {
  if (!uri) return "unknown";
  return uri.replace(/(mongodb(\+srv)?:\/\/)([^:@]+):([^@]+)@/, "$1$3:****@");
}

/**
 * Attempts to retrieve image buffer from local filesystem.
 */
export function tryReadLocalFile(userId, filename) {
  const possiblePaths = [
    path.resolve(__dirname, "../uploads/profiles", userId, filename),
    path.resolve(process.cwd(), "uploads/profiles", userId, filename),
    path.resolve(process.cwd(), "server/uploads/profiles", userId, filename),
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const stats = fs.statSync(p);
        if (stats.size > 100) {
          const buffer = fs.readFileSync(p);
          if (isImageBuffer(buffer)) {
            return { buffer, path: p };
          }
        }
      }
    } catch {
      // ignore read error and try next path
    }
  }
  return null;
}

/**
 * Attempts to retrieve image buffer via HTTP GET request.
 */
export async function tryFetchImageUrl(url) {
  if (!url || !url.startsWith("http")) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "VELVET-Photo-Migration-Agent/1.0",
        Accept: "image/*,*/*;q=0.8",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return null;
    }

    const contentType = res.headers.get("content-type") || "";
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    if (buffer.length > 100 && (contentType.startsWith("image/") || isImageBuffer(buffer))) {
      return { buffer, contentType };
    }
  } catch {
    // Network failure, timeout, or 404
  }
  return null;
}

/**
 * Creates a JSON snapshot of users and their photos before migration writes.
 */
async function createBackup() {
  const backupsDir = path.resolve(__dirname, "../backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFilePath = path.join(backupsDir, `photos-backup-${timestamp}.json`);

  const snapshot = await User.find(
    { "photos.0": { $exists: true } },
    { _id: 1, email: 1, name: 1, photos: 1 }
  ).lean();

  fs.writeFileSync(backupFilePath, JSON.stringify(snapshot, null, 2), "utf-8");
  return { path: backupFilePath, count: snapshot.length };
}

/**
 * Comprehensive Legacy Photo Migration Engine
 *
 * @param {object} options
 * @param {boolean} [options.dryRun=false]   - If true, audits and previews changes without modifying data.
 * @param {number}  [options.batchSize=50]   - Number of user documents to process per batch.
 * @param {boolean} [options.backup=true]    - If true, creates a point-in-time JSON backup before writes.
 * @param {boolean} [options.silent=false]   - Suppresses console logs if true.
 * @returns {Promise<{ success: boolean, summary: object }>}
 */
export async function runLegacyPhotoMigration(options = {}) {
  const dryRun = Boolean(
    options.dryRun ||
    process.env.DRY_RUN === "true" ||
    process.argv.includes("--dry-run")
  );
  const batchSize = Math.max(1, Number(options.batchSize) || 50);
  const performBackup = options.backup !== false && !process.argv.includes("--no-backup") && !dryRun;
  const log = options.silent ? () => {} : console.log;
  const warn = options.silent ? () => {} : console.warn;
  const errLog = options.silent ? () => {} : console.error;

  log("=".repeat(75));
  log(`🌹 VELVET Profile Photo Migration Engine ${dryRun ? "[DRY RUN MODE]" : "[LIVE WRITE MODE]"}`);
  log("=".repeat(75));

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/velvet";
  log(`📡 Target MongoDB Atlas Database: ${maskMongoUri(mongoUri)}`);

  const cloudinaryReady = isCloudinaryConfigured();
  if (!cloudinaryReady) {
    if (dryRun) {
      warn("⚠️  Notice: Cloudinary credentials are not configured in this environment. (Allowed in Dry-Run)");
    } else {
      errLog("❌ Error: Cloudinary is not configured! Migration in write mode requires CLOUDINARY_* credentials.");
      return { success: false, reason: "Cloudinary credentials missing." };
    }
  } else {
    log("☁️  Cloudinary credentials successfully verified.");
  }

  // Ensure DB connection
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(mongoUri);
      log("✅ Connected to MongoDB Atlas successfully.");
    } catch (connErr) {
      errLog("❌ Failed to connect to MongoDB Atlas:", connErr.message);
      return { success: false, reason: `Database connection failed: ${connErr.message}` };
    }
  }

  // Create point-in-time backup before any modifications
  let backupInfo = null;
  if (performBackup) {
    try {
      backupInfo = await createBackup();
      log(`💾 [BACKUP CREATED] Saved snapshot of ${backupInfo.count} users to:\n   ${backupInfo.path}`);
    } catch (bErr) {
      errLog("❌ Failed to create backup before migration:", bErr.message);
      return { success: false, reason: `Backup creation failed: ${bErr.message}` };
    }
  }

  const summary = {
    mode: dryRun ? "DRY_RUN" : "LIVE_WRITE",
    database: maskMongoUri(mongoUri),
    totalUsersScanned: 0,
    totalPhotosScanned: 0,
    alreadyCloudinary: 0,
    successfullyMigrated: 0,
    unavailableMarked: 0,
    uploadErrors: 0,
    migratedPhotosDetails: [],
    unavailablePhotosDetails: [],
    backupFile: backupInfo?.path || null,
  };

  log(`\n🔍 Scanning user documents in batches of ${batchSize}...`);

  // Stream users with photos from MongoDB Atlas
  const cursor = User.find({ "photos.0": { $exists: true } })
    .select("_id name email username photos")
    .cursor({ batchSize });

  for await (const user of cursor) {
    summary.totalUsersScanned++;
    const userIdStr = user._id.toString();

    for (const photo of user.photos) {
      summary.totalPhotosScanned++;
      const photoIdStr = photo._id.toString();

      // Classification 1: Photo already in Cloudinary (Idempotence check)
      const isCloudinaryUrl = photo.url && photo.url.includes("res.cloudinary.com");
      const hasCloudinaryPublicId = photo.publicId && !photo.publicId.startsWith("local:");

      if (isCloudinaryUrl && hasCloudinaryPublicId) {
        summary.alreadyCloudinary++;
        continue;
      }

      // Classification 2: Legacy local photo (/uploads/ or local:)
      const isLocalPublicId = photo.publicId && photo.publicId.startsWith("local:");
      const isLocalUrl = photo.url && photo.url.includes("/uploads/profiles/");

      if (!isLocalPublicId && !isLocalUrl) {
        // External HTTPS photo or other scheme already active
        summary.alreadyCloudinary++;
        continue;
      }

      // Extract filename
      let filename = "";
      if (isLocalPublicId) {
        filename = photo.publicId.replace(/^local:/i, "");
      } else if (photo.url) {
        const segments = photo.url.split("/");
        filename = segments[segments.length - 1];
      }

      // Step A: Check local filesystem
      let recovery = tryReadLocalFile(userIdStr, filename);
      let recoverySource = recovery ? "filesystem" : null;

      // Step B: If not on disk, check existing URL
      if (!recovery) {
        const urlFetch = await tryFetchImageUrl(photo.url);
        if (urlFetch) {
          recovery = { buffer: urlFetch.buffer, path: photo.url };
          recoverySource = "url";
        }
      }

      // Step C: If recovered, upload to Cloudinary and update MongoDB
      if (recovery) {
        if (dryRun) {
          log(
            `  [DRY-RUN] Would migrate photo ${photoIdStr} for "${user.name}" (${user.email || userIdStr})` +
              `\n            Source: ${recoverySource} | Existing URL: ${photo.url}`
          );
          summary.successfullyMigrated++;
          summary.migratedPhotosDetails.push({
            userId: userIdStr,
            photoId: photoIdStr,
            source: recoverySource,
            oldUrl: photo.url,
            isPrimary: photo.isPrimary,
          });
        } else {
          try {
            log(
              `  📤 Migrating photo ${photoIdStr} for "${user.name}" (recovered via ${recoverySource})...`
            );
            const uploadResult = await uploadImageBuffer(recovery.buffer, userIdStr);

            // Targeted MongoDB update: update ONLY this photo object
            await User.updateOne(
              { _id: user._id, "photos._id": photo._id },
              {
                $set: {
                  "photos.$.url": uploadResult.url,
                  "photos.$.publicId": uploadResult.publicId,
                  "photos.$.requiresReupload": false,
                },
              }
            );

            summary.successfullyMigrated++;
            summary.migratedPhotosDetails.push({
              userId: userIdStr,
              photoId: photoIdStr,
              newUrl: uploadResult.url,
              publicId: uploadResult.publicId,
              source: recoverySource,
              isPrimary: photo.isPrimary,
            });
            log(`     ✅ Migrated -> ${uploadResult.url}`);
          } catch (uploadErr) {
            summary.uploadErrors++;
            errLog(`     ❌ Upload failed for photo ${photoIdStr}:`, uploadErr.message);
          }
        }
      }
      // Step D: If unrecoverable, mark requiresReupload: true without deleting
      else {
        if (dryRun) {
          warn(
            `  [DRY-RUN] Photo ${photoIdStr} for "${user.name}" is unavailable on disk and URL.` +
              `\n            Would mark requiresReupload: true without removing record.`
          );
          summary.unavailableMarked++;
          summary.unavailablePhotosDetails.push({
            userId: userIdStr,
            userName: user.name,
            userEmail: user.email,
            photoId: photoIdStr,
            url: photo.url,
            isPrimary: photo.isPrimary,
          });
        } else {
          // Targeted MongoDB update: flag as requiring reupload
          await User.updateOne(
            { _id: user._id, "photos._id": photo._id },
            {
              $set: {
                "photos.$.requiresReupload": true,
              },
            }
          );

          summary.unavailableMarked++;
          summary.unavailablePhotosDetails.push({
            userId: userIdStr,
            userName: user.name,
            userEmail: user.email,
            photoId: photoIdStr,
            url: photo.url,
            isPrimary: photo.isPrimary,
          });
          warn(
            `  ⚠️  Photo ${photoIdStr} for "${user.name}" is unavailable on Render disk and URL.` +
              ` Marked requiresReupload: true.`
          );
        }
      }
    }
  }

  // Print final summary report
  log("\n" + "=".repeat(75));
  log(`📊 FINAL MIGRATION SUMMARY REPORT (${summary.mode})`);
  log("=".repeat(75));
  log(`Database:                              ${summary.database}`);
  log(`Total Users Scanned:                   ${summary.totalUsersScanned}`);
  log(`Total Photos Scanned:                  ${summary.totalPhotosScanned}`);
  log(`Already on Cloudinary (Skipped):       ${summary.alreadyCloudinary}`);
  log(`Successfully Migrated to Cloudinary:   ${summary.successfullyMigrated}`);
  log(`Unavailable (Flagged for Re-upload):   ${summary.unavailableMarked}`);
  log(`Upload / Network Errors:               ${summary.uploadErrors}`);
  if (summary.backupFile) {
    log(`Pre-migration Backup Location:         ${summary.backupFile}`);
  }

  if (summary.unavailablePhotosDetails.length > 0) {
    log("\n⚠️  PHOTOS REQUIRING USER RE-UPLOAD:");
    summary.unavailablePhotosDetails.forEach((item, index) => {
      log(
        `  ${index + 1}. User: "${item.userName}" (${item.userEmail || item.userId})` +
          ` | Photo ID: ${item.photoId} | Primary: ${item.isPrimary ? "Yes" : "No"}` +
          `\n     Stored URL: ${item.url}`
      );
    });
  }
  log("=".repeat(75) + "\n");

  return { success: true, summary };
}

// Standalone CLI invocation
if (process.argv[1] && process.argv[1].endsWith("migrateLegacyPhotos.js")) {
  runLegacyPhotoMigration()
    .then(() => {
      mongoose.disconnect().then(() => process.exit(0));
    })
    .catch((err) => {
      console.error("Migration execution failed:", err);
      process.exit(1);
    });
}
