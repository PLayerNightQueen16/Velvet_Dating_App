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

export default api;
