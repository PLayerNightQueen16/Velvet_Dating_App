import { calculateAge, validateAgeRange } from "../utils/ageValidator.js";
import {
  uploadImageBuffer,
  deleteCloudinaryImage,
  isCloudinaryConfigured,
  generateUploadSignature,
} from "../utils/cloudinary.js";
import {
  MIN_PHOTOS_REQUIRED,
  MAX_PHOTOS_ALLOWED,
  MAX_INTERESTS_ALLOWED,
  MAX_PROMPTS_ALLOWED,
  ALLOWED_GENDERS,
  ALLOWED_INTERESTED_IN,
  ALLOWED_RELATIONSHIP_INTENTS,
} from "../utils/profileConstants.js";

const httpsUrlRegex = /^https:\/\/.+/i;

/**
 * Get authenticated user's profile
 * GET /api/profile/me
 */
export async function getProfile(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    return res.status(200).json({
      success: true,
      profile: user.toSafeProfile(true),
    });
  } catch (error) {
    console.error("getProfile error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve profile." });
  }
}

/**
 * Update permitted profile fields
 * PATCH /api/profile/me
 */
export async function updateProfile(req, res) {
  try {
    const user = req.user;

    // Explicit allowlist of editable fields
    const {
      name,
      dateOfBirth,
      gender,
      bio,
      location,
      occupation,
      education,
      languages,
      relationshipIntent,
      interests,
      preferences,
      prompts,
    } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 50) {
        return res.status(400).json({ success: false, message: "Name must be between 2 and 50 characters." });
      }
      user.name = name.trim();
    }

    if (dateOfBirth !== undefined) {
      const ageCheck = calculateAge(dateOfBirth);
      if (!ageCheck.isValid) {
        return res.status(400).json({ success: false, message: ageCheck.error });
      }
      user.dateOfBirth = new Date(dateOfBirth);
    }

    if (gender !== undefined) {
      const cleanGender = typeof gender === "string" ? gender.trim().toLowerCase() : "";
      if (cleanGender && !ALLOWED_GENDERS.includes(cleanGender)) {
        return res.status(400).json({
          success: false,
          message: `Gender must be one of: ${ALLOWED_GENDERS.join(", ")}`,
        });
      }
      user.gender = cleanGender;
    }

    if (bio !== undefined) {
      if (typeof bio === "string" && bio.length > 500) {
        return res.status(400).json({ success: false, message: "Bio cannot exceed 500 characters." });
      }
      user.bio = typeof bio === "string" ? bio.trim() : "";
    }

    if (location !== undefined) {
      user.location = typeof location === "string" ? location.trim() : "";
    }

    if (occupation !== undefined) {
      user.occupation = typeof occupation === "string" ? occupation.trim() : "";
    }

    if (education !== undefined) {
      user.education = typeof education === "string" ? education.trim() : "";
    }

    if (languages !== undefined) {
      if (Array.isArray(languages)) {
        user.languages = languages.map((l) => String(l).trim()).filter(Boolean);
      }
    }

    if (relationshipIntent !== undefined) {
      const cleanIntent = typeof relationshipIntent === "string" ? relationshipIntent.trim().toLowerCase() : "";
      if (cleanIntent && !ALLOWED_RELATIONSHIP_INTENTS.includes(cleanIntent)) {
        return res.status(400).json({
          success: false,
          message: `Relationship intent must be one of: ${ALLOWED_RELATIONSHIP_INTENTS.join(", ")}`,
        });
      }
      user.relationshipIntent = cleanIntent;
    }

    if (interests !== undefined) {
      if (!Array.isArray(interests)) {
        return res.status(400).json({ success: false, message: "Interests must be an array." });
      }
      if (interests.length > MAX_INTERESTS_ALLOWED) {
        return res.status(400).json({
          success: false,
          message: `Cannot select more than ${MAX_INTERESTS_ALLOWED} interests.`,
        });
      }
      // Deduplicate and trim
      const uniqueInterests = [...new Set(interests.map((i) => String(i).trim()).filter(Boolean))];
      user.interests = uniqueInterests;
    }

    if (preferences !== undefined && typeof preferences === "object") {
      if (preferences.ageRange) {
        const { min, max } = preferences.ageRange;
        const validRange = validateAgeRange(min ?? 18, max ?? 45);
        if (!validRange.isValid) {
          return res.status(400).json({ success: false, message: validRange.error });
        }
        user.preferences.ageRange.min = validRange.min;
        user.preferences.ageRange.max = validRange.max;
      }

      if (preferences.interestedIn && Array.isArray(preferences.interestedIn)) {
        const validInterests = preferences.interestedIn.filter((item) =>
          ALLOWED_INTERESTED_IN.includes(item)
        );
        user.preferences.interestedIn = validInterests.length > 0 ? validInterests : ["everyone"];
      }

      if (preferences.distanceKm !== undefined) {
        const dist = Number(preferences.distanceKm);
        if (!isNaN(dist) && dist >= 1 && dist <= 500) {
          user.preferences.distanceKm = dist;
        }
      }
    }

    if (prompts !== undefined) {
      if (!Array.isArray(prompts)) {
        return res.status(400).json({ success: false, message: "Prompts must be an array." });
      }
      if (prompts.length > MAX_PROMPTS_ALLOWED) {
        return res.status(400).json({
          success: false,
          message: `Cannot answer more than ${MAX_PROMPTS_ALLOWED} prompts.`,
        });
      }

      const validatedPrompts = [];
      const seenPromptQuestions = new Set();

      for (const item of prompts) {
        if (!item.prompt || !item.answer) continue;
        const cleanPrompt = String(item.prompt).trim();
        const cleanAnswer = String(item.answer).trim();

        if (seenPromptQuestions.has(cleanPrompt)) {
          return res.status(400).json({
            success: false,
            message: `Duplicate prompt question: "${cleanPrompt}". Each prompt must be unique.`,
          });
        }
        seenPromptQuestions.add(cleanPrompt);

        if (cleanAnswer.length > 300) {
          return res.status(400).json({
            success: false,
            message: "Prompt answers cannot exceed 300 characters.",
          });
        }

        validatedPrompts.push({ prompt: cleanPrompt, answer: cleanAnswer });
      }

      user.prompts = validatedPrompts;
    }

    // Automatically recalculate completion status based on server criteria
    const { isComplete } = user.checkCompletionStatus();
    user.profileCompleted = isComplete;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      profile: user.toSafeProfile(true),
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update profile." });
  }
}

/**
 * Save partial or complete onboarding step data
 * PUT /api/profile/me/onboarding
 */
export async function saveOnboarding(req, res) {
  try {
    // Delegate to updateProfile logic for consistent validation
    return updateProfile(req, res);
  } catch (error) {
    console.error("saveOnboarding error:", error);
    return res.status(500).json({ success: false, message: "Failed to save onboarding progress." });
  }
}

/**
 * Mark profile as complete after validating all mandatory fields
 * POST /api/profile/me/complete
 */
export async function completeProfile(req, res) {
  try {
    const user = req.user;
    const { isComplete, missing } = user.checkCompletionStatus();

    if (!isComplete) {
      return res.status(400).json({
        success: false,
        message: "Cannot complete profile. Required fields are missing.",
        missingFields: missing,
      });
    }

    user.profileCompleted = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Congratulations! Your VELVET profile is now complete.",
      profile: user.toSafeProfile(true),
    });
  } catch (error) {
    console.error("completeProfile error:", error);
    return res.status(500).json({ success: false, message: "Failed to finalize profile completion." });
  }
}

/**
 * Add a photo via Cloudinary upload or HTTPS URL
 * POST /api/profile/me/photos
 */
export async function addPhoto(req, res) {
  try {
    const user = req.user;

    // Check maximum photos limit (5 photos)
    if (user.photos.length >= MAX_PHOTOS_ALLOWED) {
      return res.status(400).json({
        success: false,
        message: `You have reached the maximum limit of ${MAX_PHOTOS_ALLOWED} photos. Please remove an existing photo first.`,
      });
    }

    let photoUrl = "";
    let publicId = null;

    // Case 1: Image file uploaded via Multer
    if (req.file) {
      if (!isCloudinaryConfigured()) {
        return res.status(503).json({
          success: false,
          message: "Cloudinary upload service is currently unavailable. You may add photos via image URL.",
        });
      }

      const uploadResult = await uploadImageBuffer(req.file.buffer, user._id.toString());
      photoUrl = uploadResult.url;
      publicId = uploadResult.publicId;
    }
    // Case 2: Direct image URL provided in request body
    else if (req.body?.url) {
      const rawUrl = String(req.body.url).trim();

      // Reject non-HTTPS or malformed URLs
      if (!httpsUrlRegex.test(rawUrl)) {
        return res.status(400).json({
          success: false,
          message: "Photo URL must be a valid, secure HTTPS address (e.g. https://...).",
        });
      }

      // Reject malicious or local URI schemes
      if (rawUrl.startsWith("javascript:") || rawUrl.startsWith("data:") || rawUrl.includes("localhost")) {
        return res.status(400).json({
          success: false,
          message: "Unsupported image URL scheme.",
        });
      }

      photoUrl = rawUrl;
    } else {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file or provide a valid HTTPS photo URL.",
      });
    }

    // First photo added automatically becomes primary
    const isFirstPhoto = user.photos.length === 0;

    user.photos.push({
      url: photoUrl,
      publicId,
      isPrimary: isFirstPhoto,
    });

    // Check if adding this photo now satisfies completion criteria
    const { isComplete } = user.checkCompletionStatus();
    user.profileCompleted = isComplete;

    await user.save();

    return res.status(201).json({
      success: true,
      message: "Photo added successfully.",
      photos: user.toSafeProfile(true).photos,
      profileCompleted: user.profileCompleted,
    });
  } catch (error) {
    console.error("addPhoto error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to add photo." });
  }
}

/**
 * Set a photo as the primary profile photo
 * PATCH /api/profile/me/photos/:photoId/primary
 */
export async function setPrimaryPhoto(req, res) {
  try {
    const user = req.user;
    const { photoId } = req.params;

    const photoExists = user.photos.id(photoId);
    if (!photoExists) {
      return res.status(404).json({ success: false, message: "Photo not found." });
    }

    // Set designated photo as primary, unmark all others
    user.photos.forEach((p) => {
      p.isPrimary = p._id.toString() === photoId;
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Primary photo updated.",
      photos: user.toSafeProfile(true).photos,
    });
  } catch (error) {
    console.error("setPrimaryPhoto error:", error);
    return res.status(500).json({ success: false, message: "Failed to update primary photo." });
  }
}

/**
 * Delete a photo by ID
 * DELETE /api/profile/me/photos/:photoId
 */
export async function deletePhoto(req, res) {
  try {
    const user = req.user;
    const { photoId } = req.params;

    const photo = user.photos.id(photoId);
    if (!photo) {
      return res.status(404).json({ success: false, message: "Photo not found." });
    }

    const wasPrimary = photo.isPrimary;
    const publicIdToDelete = photo.publicId;

    // Remove photo from subdocument array
    user.photos.pull({ _id: photoId });

    // If remaining photos exist and the deleted photo was primary, designate first as primary
    if (wasPrimary && user.photos.length > 0) {
      user.photos[0].isPrimary = true;
    }

    // Recalculate completion (if user now has fewer than 3 photos, completion status becomes false)
    const { isComplete } = user.checkCompletionStatus();
    user.profileCompleted = isComplete;

    await user.save();

    // Asynchronously destroy Cloudinary asset if publicId exists
    if (publicIdToDelete) {
      deleteCloudinaryImage(publicIdToDelete).catch((err) =>
        console.warn("Async Cloudinary deletion error:", err)
      );
    }

    return res.status(200).json({
      success: true,
      message: "Photo deleted successfully.",
      photos: user.toSafeProfile(true).photos,
      profileCompleted: user.profileCompleted,
    });
  } catch (error) {
    console.error("deletePhoto error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete photo." });
  }
}

/**
 * Generate a Cloudinary signed upload signature for direct browser uploads.
 * The API secret is computed server-side and NEVER exposed to the client.
 * GET /api/profile/me/photos/upload-signature
 */
export async function getUploadSignature(req, res) {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Cloudinary upload service is not configured on this server.",
        cloudinaryAvailable: false,
      });
    }

    const user = req.user;
    const timestamp = Math.floor(Date.now() / 1000);
    const signatureData = generateUploadSignature(user._id.toString(), timestamp);

    return res.status(200).json({
      success: true,
      cloudinaryAvailable: true,
      ...signatureData,
    });
  } catch (error) {
    console.error("getUploadSignature error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate upload signature." });
  }
}
