import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getProfile,
  updateProfile,
  saveOnboarding,
  completeProfile,
  addPhoto,
  setPrimaryPhoto,
  deletePhoto,
  getUploadSignature,
} from "../controllers/profile.controller.js";

const router = Router();

// Configure multer for secure in-memory photo handling (Cloudinary server-mediated upload)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max image file size
  },
  fileFilter: (req, file, cb) => {
    // Only accept image MIME types (JPEG, PNG, WebP, HEIC)
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/jpg"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, WebP) are allowed."), false);
    }
  },
});

// All profile routes require authentication
router.use(requireAuth);

// ── Profile data endpoints ────────────────────────────────────────────────────
// GET /api/profile/me          → Return authenticated user's full profile
router.get("/me", getProfile);

// PATCH /api/profile/me        → Partial update of permitted profile fields
router.patch("/me", updateProfile);

// PUT /api/profile/me/onboarding → Save onboarding step progress (partial OK)
router.put("/me/onboarding", saveOnboarding);

// POST /api/profile/me/complete  → Validate all fields and mark profile complete
router.post("/me/complete", completeProfile);

// ── Photo management endpoints ────────────────────────────────────────────────
// GET /api/profile/me/photos/upload-signature → Server-signed Cloudinary params
router.get("/me/photos/upload-signature", getUploadSignature);

// POST /api/profile/me/photos  → Add photo (file upload via multer, or URL in body)
router.post("/me/photos", upload.single("photo"), addPhoto);

// PATCH /api/profile/me/photos/:photoId/primary → Set photo as primary
router.patch("/me/photos/:photoId/primary", setPrimaryPhoto);

// DELETE /api/profile/me/photos/:photoId → Remove a photo (and Cloudinary asset)
router.delete("/me/photos/:photoId", deletePhoto);

export default router;
