import { Router } from "express";
import { runLegacyPhotoMigration } from "../scripts/migrateLegacyPhotos.js";

const router = Router();

/**
 * Strict administrator authorization middleware.
 * Verifies that ADMIN_API_KEY is configured and matches the request header.
 * Never allows public or unrestricted execution.
 */
function requireAdminKey(req, res, next) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey || adminKey.trim().length === 0) {
    return res.status(403).json({
      success: false,
      message: "Admin operations are disabled on this server (ADMIN_API_KEY is not configured).",
    });
  }

  const providedKey =
    req.headers["x-admin-key"] ||
    req.headers["authorization"]?.replace(/^Bearer\s+/i, "");

  if (!providedKey || providedKey !== adminKey) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Unauthorized administrator request.",
    });
  }

  next();
}

router.use(requireAdminKey);

/**
 * POST /api/admin/migrate-photos
 * Triggers photo migration with optional dry-run and batch options.
 */
router.post("/migrate-photos", async (req, res) => {
  try {
    const dryRun = Boolean(req.body?.dryRun ?? req.query?.dryRun === "true");
    const batchSize = Math.max(1, Number(req.body?.batchSize || req.query?.batchSize) || 50);
    const backup = req.body?.backup !== false && req.query?.backup !== "false";

    const result = await runLegacyPhotoMigration({
      dryRun,
      batchSize,
      backup,
      silent: false,
    });

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Admin photo migration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to execute photo migration.",
    });
  }
});

export default router;

