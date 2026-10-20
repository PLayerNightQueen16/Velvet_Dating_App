import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginUser, registerUser, logoutUser, getMe } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session from HTTP-only cookie on application mount
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMe();
      if (data?.success && data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      // 401 means not logged in / expired session
      if (err.response?.status === 401) {
        setUser(null);
      } else {
        // Network or server error — log without crashing
        console.warn("Session check encountered an error:", err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Log in user
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginUser(credentials);
      if (data?.success && data?.user) {
        setUser(data.user);
        return data.user;
      }
      throw new Error(data?.message || "Failed to log in.");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Invalid credentials.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await registerUser(userData);
      if (data?.success && data?.user) {
        setUser(data.user);
        return data.user;
      }
      throw new Error(data?.message || "Failed to register.");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to create account.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Log out user
  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
    } catch (err) {
      console.warn("Logout error:", err.message);
    } finally {
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    checkAuth,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
