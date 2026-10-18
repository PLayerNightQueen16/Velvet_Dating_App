import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./utils/connectDB.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import discoveryRoutes from "./routes/discovery.routes.js";
import likesRoutes from "./routes/likes.routes.js";
import matchesRoutes from "./routes/matches.routes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Configure CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check against configured CLIENT_URL or localhost origins in dev
      const allowedOrigins = [
        CLIENT_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked request from origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Express body parser and cookie parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "VELVET Dating App API",
    tagline: "I once believed love would be burning red...then you turned my world crimson instead",
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/discovery", discoveryRoutes);
app.use("/api/likes", likesRoutes);
app.use("/api/matches", matchesRoutes);

// Handle unknown routes (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found on VELVET server.`,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  // Catch CORS error
  if (err.message && err.message.startsWith("CORS blocked")) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  // Catch invalid JSON syntax
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload provided in request body.",
    });
  }

  console.error("Unhandled Server Error:", err.stack || err);
  const isProd = process.env.NODE_ENV === "production";

  return res.status(err.status || 500).json({
    success: false,
    message: isProd ? "Internal server error." : err.message || "Internal server error.",
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🌹 VELVET API Server listening on http://localhost:${PORT}`);
      console.log(`🔒 Authentication active with HTTP-only cookies`);
      console.log(`🌐 Accepting client origin: ${CLIENT_URL}`);
    });
  } catch (error) {
    console.error("❌ Failed to start VELVET server due to database failure:", error.message);
    process.exit(1);
  }
}

startServer();

export default app;
