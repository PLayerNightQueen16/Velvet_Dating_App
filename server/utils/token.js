import jwt from "jsonwebtoken";

const COOKIE_NAME = "velvet_token";

/**
 * Signs a JWT for an authenticated user ID.
 */
export function generateToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured in server environment.");
  }

  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

/**
 * Returns consistent cookie configuration for local and production environments.
 */
export function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: "/",
  };
}

/**
 * Sets the authentication JWT cookie on the HTTP response.
 */
export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
}

/**
 * Clears the authentication JWT cookie from the HTTP response.
 */
export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    ...getCookieOptions(),
    maxAge: 0,
  });
}

export { COOKIE_NAME };
