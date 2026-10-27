import { describe, it, expect, vi, beforeEach } from "vitest";
import { getApiBaseUrl } from "./axios";

describe("API Base URL Normalization", () => {
  const originalEnv = import.meta.env;

  it("defaults to http://localhost:8000/api when VITE_API_URL is unset", () => {
    vi.stubEnv("VITE_API_URL", "");
    expect(getApiBaseUrl()).toBe("http://localhost:8000/api");
  });

  it("appends /api when VITE_API_URL is provided without prefix", () => {
    vi.stubEnv("VITE_API_URL", "https://velvet-dating-app.onrender.com");
    expect(getApiBaseUrl()).toBe("https://velvet-dating-app.onrender.com/api");
  });

  it("handles trailing slashes properly without duplicate /api or //", () => {
    vi.stubEnv("VITE_API_URL", "https://velvet-dating-app.onrender.com/");
    expect(getApiBaseUrl()).toBe("https://velvet-dating-app.onrender.com/api");
  });

  it("preserves /api when already included in VITE_API_URL", () => {
    vi.stubEnv("VITE_API_URL", "https://velvet-dating-app.onrender.com/api");
    expect(getApiBaseUrl()).toBe("https://velvet-dating-app.onrender.com/api");
  });

  it("handles trailing slash after /api properly", () => {
    vi.stubEnv("VITE_API_URL", "https://velvet-dating-app.onrender.com/api/");
    expect(getApiBaseUrl()).toBe("https://velvet-dating-app.onrender.com/api");
  });
});
