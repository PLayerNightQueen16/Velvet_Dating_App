import { User } from "../models/user.model.js";

// Allowlist of editable privacy fields
const ALLOWED_PRIVACY_FIELDS = ["discoverable", "showOnlineStatus", "showLastActive"];

/**
 * Get privacy settings for authenticated user
 * GET /api/privacy
 */
export async function getPrivacySettings(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const privacy = user.privacy || {
      discoverable: true,
      showOnlineStatus: true,
      showLastActive: true,
    };

    return res.status(200).json({
      success: true,
      privacy: {
        discoverable: privacy.discoverable !== false,
        showOnlineStatus: privacy.showOnlineStatus !== false,
        showLastActive: privacy.showLastActive !== false,
      },
    });
  } catch (error) {
    console.error("getPrivacySettings error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to retrieve privacy settings." });
  }
}

/**
 * Update privacy settings for authenticated user
 * PATCH /api/privacy
 */
export async function updatePrivacySettings(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const bodyKeys = Object.keys(req.body || {});

    // Check for mass assignment of forbidden fields
    for (const key of bodyKeys) {
      if (!ALLOWED_PRIVACY_FIELDS.includes(key)) {
        return res.status(400).json({
          success: false,
          message: `Field '${key}' is not allowed in privacy updates. Allowed fields: ${ALLOWED_PRIVACY_FIELDS.join(", ")}`,
        });
      }
    }

    const userDoc = await User.findById(user._id);
    if (!userDoc) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    if (!userDoc.privacy) {
      userDoc.privacy = {
        discoverable: true,
        showOnlineStatus: true,
        showLastActive: true,
      };
    }

    const { discoverable, showOnlineStatus, showLastActive } = req.body;

    if (discoverable !== undefined) {
      if (typeof discoverable !== "boolean") {
        return res.status(400).json({ success: false, message: "discoverable must be a boolean." });
      }
      userDoc.privacy.discoverable = discoverable;
    }

    if (showOnlineStatus !== undefined) {
      if (typeof showOnlineStatus !== "boolean") {
        return res.status(400).json({ success: false, message: "showOnlineStatus must be a boolean." });
      }
      userDoc.privacy.showOnlineStatus = showOnlineStatus;
    }

    if (showLastActive !== undefined) {
      if (typeof showLastActive !== "boolean") {
        return res.status(400).json({ success: false, message: "showLastActive must be a boolean." });
      }
      userDoc.privacy.showLastActive = showLastActive;
    }

    await userDoc.save();

    return res.status(200).json({
      success: true,
      message: "Privacy settings updated successfully.",
      privacy: {
        discoverable: userDoc.privacy.discoverable,
        showOnlineStatus: userDoc.privacy.showOnlineStatus,
        showLastActive: userDoc.privacy.showLastActive,
      },
    });
  } catch (error) {
    console.error("updatePrivacySettings error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update privacy settings." });
  }
}
