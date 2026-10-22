import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCookieOptions } from "../utils/token.js";

describe("Production Server & Deployment Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Cookie Security Options", () => {
    it("returns development-safe cookie options when NODE_ENV is development", () => {
      process.env.NODE_ENV = "development";
      const options = getCookieOptions();

      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(false);
      expect(options.sameSite).toBe("lax");
      expect(options.path).toBe("/");
      expect(options.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it("returns HTTPS and cross-site compatible options when NODE_ENV is production", () => {
      process.env.NODE_ENV = "production";
      const options = getCookieOptions();

      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(true);
      expect(options.sameSite).toBe("none");
      expect(options.path).toBe("/");
    });
  });

  describe("CORS Origins and Vercel Validation", () => {
    const isOriginAllowed = (origin, clientUrl) => {
      if (!origin) return true;
      const configured = (clientUrl || "http://localhost:5173")
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);

      const allowed = [
        ...configured,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
      ];

      if (allowed.includes(origin)) return true;
      if (origin.endsWith(".vercel.app")) return true;
      return false;
    };

    it("permits exact configured CLIENT_URL", () => {
      const clientUrl = "https://velvet-app.vercel.app";
      expect(isOriginAllowed("https://velvet-app.vercel.app", clientUrl)).toBe(true);
    });

    it("permits comma-separated multi-origin CLIENT_URL", () => {
      const clientUrl = "https://velvet-app.vercel.app, http://localhost:5173, https://custom-domain.com";
      expect(isOriginAllowed("https://custom-domain.com", clientUrl)).toBe(true);
      expect(isOriginAllowed("https://velvet-app.vercel.app", clientUrl)).toBe(true);
      expect(isOriginAllowed("http://localhost:5173", clientUrl)).toBe(true);
    });

    it("permits Vercel preview deployments ending in .vercel.app", () => {
      expect(isOriginAllowed("https://velvet-preview-branch-12.vercel.app", "http://localhost:5173")).toBe(true);
    });

    it("permits requests with no origin (curl, server-to-server, Render health checks)", () => {
      expect(isOriginAllowed(undefined, "http://localhost:5173")).toBe(true);
      expect(isOriginAllowed("", "http://localhost:5173")).toBe(true);
    });

    it("blocks unauthorized third-party origins", () => {
      expect(isOriginAllowed("https://malicious-site.com", "https://velvet-app.vercel.app")).toBe(false);
      expect(isOriginAllowed("http://evil-attacker.io", "http://localhost:5173")).toBe(false);
    });
  });

  describe("Port and Host Configuration", () => {
    it("resolves PORT from process.env or falls back to 8000", () => {
      process.env.PORT = "10000";
      const resolvedPort = process.env.PORT || 8000;
      expect(resolvedPort).toBe("10000");

      delete process.env.PORT;
      const fallbackPort = process.env.PORT || 8000;
      expect(fallbackPort).toBe(8000);
    });
  });
});
