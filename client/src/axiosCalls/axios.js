import axios from "axios";

/**
 * Normalizes the API base URL so that it always includes the `/api` prefix,
 * regardless of whether the environment variable is configured with or without `/api`:
 * - "https://velvet-dating-app.onrender.com"     -> "https://velvet-dating-app.onrender.com/api"
 * - "https://velvet-dating-app.onrender.com/"    -> "https://velvet-dating-app.onrender.com/api"
 * - "https://velvet-dating-app.onrender.com/api" -> "https://velvet-dating-app.onrender.com/api"
 * - undefined                                   -> "http://localhost:8000/api"
 */
export function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) {
    return "http://localhost:8000/api";
  }
  const cleanUrl = envUrl.trim().replace(/\/+$/, "");
  return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
}

/**
 * Centralized Axios instance pre-configured for VELVET API.
 * Uses withCredentials: true so that HTTP-only authentication cookies
 * are automatically sent and received on every cross-origin request.
 */
const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
