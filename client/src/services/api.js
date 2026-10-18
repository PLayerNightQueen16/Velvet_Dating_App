import api from "../axiosCalls/axios";

/**
 * Authentication API Service methods.
 */

// Register a new user
export async function registerUser({ name, username, email, password }) {
  const response = await api.post("/auth/register", {
    name,
    username,
    email,
    password,
  });
  return response.data;
}

// Log in an existing user
export async function loginUser({ emailOrUsername, password }) {
  const response = await api.post("/auth/login", {
    emailOrUsername,
    password,
  });
  return response.data;
}

// Log out user and clear cookie
export async function logoutUser() {
  const response = await api.post("/auth/logout");
  return response.data;
}

// Restore session from HTTP-only cookie
export async function getMe() {
  const response = await api.get("/auth/me");
  return response.data;
}

/* ============================================================
   Profile API
   ============================================================ */

// Get authenticated user's own profile
export async function getProfile() {
  const response = await api.get("/profile/me");
  return response.data;
}

// Update profile fields (PATCH — partial update)
export async function updateProfile(data) {
  const response = await api.patch("/profile/me", data);
  return response.data;
}

// Save onboarding step data (PUT)
export async function saveOnboarding(data) {
  const response = await api.put("/profile/me/onboarding", data);
  return response.data;
}

// Mark profile as complete
export async function completeProfile() {
  const response = await api.post("/profile/me/complete");
  return response.data;
}

// Upload a photo file (multipart/form-data)
export async function uploadPhoto(file) {
  const form = new FormData();
  form.append("photo", file);
  const response = await api.post("/profile/me/photos", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// Add a photo via HTTPS URL
export async function addPhotoUrl(url) {
  const response = await api.post("/profile/me/photos", { url });
  return response.data;
}

// Set primary photo
export async function setPrimaryPhoto(photoId) {
  const response = await api.patch(`/profile/me/photos/${photoId}/primary`);
  return response.data;
}

// Delete a photo
export async function deletePhoto(photoId) {
  const response = await api.delete(`/profile/me/photos/${photoId}`);
  return response.data;
}

// Get Cloudinary server-signed upload params (for direct browser uploads)
export async function getUploadSignature() {
  const response = await api.get("/profile/me/photos/upload-signature");
  return response.data;
}

// ── Discovery Endpoints (Batch 4) ─────────────────────────────────────────────
// Fetch discovery candidates with optional filters
export async function getDiscovery(params = {}) {
  const response = await api.get("/discovery", { params });
  return response.data;
}

// Like a candidate profile
export async function likeProfile(userId) {
  const response = await api.post(`/discovery/${userId}/like`);
  return response.data;
}

// Pass on a candidate profile
export async function passProfile(userId) {
  const response = await api.post(`/discovery/${userId}/pass`);
  return response.data;
}

// Block a user
export async function blockUser(userId) {
  const response = await api.post(`/discovery/${userId}/block`);
  return response.data;
}

// Unblock a user
export async function unblockUser(userId) {
  const response = await api.delete(`/discovery/${userId}/block`);
  return response.data;
}

// ── Likes Endpoints (Batch 5) ─────────────────────────────────────────────────
// Get profiles who liked the current user (Received)
export async function getIncomingLikes(params = {}) {
  const response = await api.get("/likes/received", { params });
  return response.data;
}

// Get profiles the current user liked (Sent)
export async function getOutgoingLikes(params = {}) {
  const response = await api.get("/likes/sent", { params });
  return response.data;
}

// Withdraw an outgoing like
export async function withdrawLike(userId) {
  const response = await api.delete(`/likes/${userId}`);
  return response.data;
}

// ── Matches Endpoints (Batch 5) ───────────────────────────────────────────────
// Get active matches for current user
export async function getMatches(params = {}) {
  const response = await api.get("/matches", { params });
  return response.data;
}

// Unmatch an active match
export async function unmatchConnection(matchId) {
  const response = await api.delete(`/matches/${matchId}`);
  return response.data;
}

export default api;
