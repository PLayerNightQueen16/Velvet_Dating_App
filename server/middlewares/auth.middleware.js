import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { COOKIE_NAME } from "../utils/token.js";

/**
 * Authentication middleware that verifies the HTTP-only JWT cookie
 * and attaches the authenticated user to the request.
 */
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error (JWT_SECRET).",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session has expired. Please log in again.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid or malformed authentication token.",
      });
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account associated with this session no longer exists.",
      });
    }

    // Invalidate session if user tokenVersion has incremented (e.g. password changed)
    const tokenVersion = decoded.tokenVersion ?? 0;
    const userTokenVersion = user.tokenVersion ?? 0;
    if (userTokenVersion > 0 && tokenVersion < userTokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Session has expired due to password change or security update. Please log in again.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication check.",
    });
  }
}
