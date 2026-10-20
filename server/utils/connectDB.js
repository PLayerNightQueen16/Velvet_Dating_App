import mongoose from "mongoose";

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Sanitizes connection string if necessary and logs status without leaking credentials.
 */
export async function connectDB() {
  let uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI environment variable is missing. Please set it in server/.env");
  }

  // Remove accidental angle brackets like <username> or <password> if present in the URI
  if (uri.includes("<") && uri.includes(">")) {
    uri = uri.replace(/<([^>]+)>/g, "$1");
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true,
    });

    console.log(`✨ MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    throw error;
  }
}

// Connection event listeners for graceful monitoring
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected. Attempting reconnection...");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection runtime error:", err.message);
});
