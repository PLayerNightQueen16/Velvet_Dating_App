import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { generateToken, setAuthCookie, clearAuthCookie } from "../utils/token.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9_]+$/;

/**
 * Register a new user account
 * POST /api/auth/register
 */
export async function register(req, res) {
  try {
    const { name, username, email, password } = req.body;

    // Validate presence and reject whitespace-only strings
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required." });
    }
    if (!username || typeof username !== "string" || !username.trim()) {
      return res.status(400).json({ success: false, message: "Username is required." });
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }
    if (!password || typeof password !== "string" || !password.trim()) {
      return res.status(400).json({ success: false, message: "Password is required." });
    }

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Field-level validations
    if (cleanName.length < 2 || cleanName.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 50 characters.",
      });
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({
        success: false,
        message: "Username must be between 3 and 30 characters.",
      });
    }

    if (!usernameRegex.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: "Username may only contain letters, numbers, and underscores.",
      });
    }

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        success: false,
        message: "Password must not exceed 128 characters.",
      });
    }

    // Check existing email
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Check existing username
    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "This username is already taken. Please choose another.",
      });
    }

    // Hash password with bcrypt (cost factor 12)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
    });

    await newUser.save();

    // Issue JWT in HTTP-only cookie
    const token = generateToken(newUser._id);
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Welcome to VELVET. Your account has been created.",
      user: newUser.toSafeObject(),
    });
  } catch (error) {
    // Handle duplicate key race condition (MongoDB code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "credential";
      return res.status(400).json({
        success: false,
        message: `This ${field} is already in use.`,
      });
    }

    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating your account. Please try again.",
    });
  }
}

/**
 * Log in an existing user
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { emailOrUsername, email, username, identifier, password } = req.body;

    // Support flexible identifier naming (emailOrUsername / identifier / email / username)
    const rawIdentifier = emailOrUsername || identifier || email || username;

    if (!rawIdentifier || typeof rawIdentifier !== "string" || !rawIdentifier.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email or username.",
      });
    }

    if (!password || typeof password !== "string" || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your password.",
      });
    }

    const cleanIdentifier = rawIdentifier.trim().toLowerCase();

    // Look up user by normalized email OR username
    const user = await User.findOne({
      $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }],
    });

    if (!user) {
      // Generic invalid credentials message to prevent account enumeration
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password.",
      });
    }

    // Issue JWT in HTTP-only cookie
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during sign in. Please try again.",
    });
  }
}

/**
 * Log out user by clearing the HTTP-only cookie
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  try {
    clearAuthCookie(res);
    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during logout.",
    });
  }
}

/**
 * Get current authenticated user session
 * GET /api/auth/me
 */
export async function getMe(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated.",
      });
    }

    const safeUser = req.user.toSafeObject ? req.user.toSafeObject() : req.user;

    return res.status(200).json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to restore session.",
    });
  }
}
