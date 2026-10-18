import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

/**
 * Configure and return Cloudinary instance.
 */
function ensureCloudinaryConfig() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

// Initial configuration
ensureCloudinaryConfig();

/**
 * Checks if Cloudinary is fully configured with credentials.
 */
export function isCloudinaryConfigured() {
  ensureCloudinaryConfig();
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Uploads an image buffer directly to Cloudinary using a stream.
 * Used for server-mediated uploads via Multer.
 *
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} userId     - User ID to namespace the Cloudinary folder
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export async function uploadImageBuffer(fileBuffer, userId) {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary service is not configured on the server.");
  }

  ensureCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `velvet/profiles/${userId}`,
        resource_type: "image",
        // Only allow safe image formats
        allowed_formats: ["jpg", "jpeg", "png", "webp", "heic"],
        transformation: [
          { width: 1200, height: 1600, crop: "limit" },
          { quality: "auto:good", fetch_format: "auto" },
        ],
        // Tag uploads with user ID for ownership tracing
        context: { user_id: userId, app: "velvet" },
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload stream error:", error);
          return reject(new Error(error.message || "Failed to upload image to Cloudinary."));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Generates a server-side signed upload signature for direct browser uploads.
 * The API secret is NEVER exposed to the client — only the signed params are sent.
 *
 * @param {string} userId     - Authenticated user ID (from JWT)
 * @param {number} timestamp  - Unix timestamp in seconds
 * @returns {{ signature: string, apiKey: string, cloudName: string, timestamp: number, folder: string }}
 */
export function generateUploadSignature(userId, timestamp) {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured. Cannot generate upload signature.");
  }

  ensureCloudinaryConfig();

  const folder = `velvet/profiles/${userId}`;
  const params = {
    folder,
    timestamp,
    transformation: "w_1200,h_1600,c_limit/q_auto:good,f_auto",
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    timestamp,
    folder,
  };
}

/**
 * Deletes an image from Cloudinary by its public ID.
 * Only call this for assets belonging to the authenticated user.
 *
 * @param {string} publicId
 * @returns {Promise<boolean>}
 */
export async function deleteCloudinaryImage(publicId) {
  if (!isCloudinaryConfigured() || !publicId) {
    return false;
  }

  ensureCloudinaryConfig();

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary deletion error:", error.message);
    return false;
  }
}

export default cloudinary;
