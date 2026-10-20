import axios from "axios";

/**
 * Centralized Axios instance pre-configured for VELVET API.
 * Uses withCredentials: true so that HTTP-only authentication cookies
 * are automatically sent and received on every cross-origin request.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
