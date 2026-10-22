import { describe, it, expect } from "vitest";
import { User } from "../models/user.model.js";
import {
  MIN_PHOTOS_REQUIRED,
  MAX_PHOTOS_ALLOWED,
  MAX_INTERESTS_ALLOWED,
  MAX_PROMPTS_ALLOWED,
} from "../utils/profileConstants.js";

describe("User Model & Profile Schema Validation", () => {
  it("rejects non-HTTPS photo URLs", async () => {
    const user = new User({
      name: "Sophia Rose",
      username: "sophia_rose",
      email: "sophia@example.com",
      password: "password123",
      photos: [
        { url: "http://insecure.com/photo.jpg" },
      ],
    });

    const err = await user.validate().catch((e) => e);
    expect(err).toBeDefined();
    expect(err.errors["photos.0.url"]).toBeDefined();
    expect(err.errors["photos.0.url"].message).toContain("HTTPS");
  });

  it("accepts valid HTTPS photo URLs", async () => {
    const user = new User({
      name: "Sophia Rose",
      username: "sophia_rose",
      email: "sophia@example.com",
      password: "password123",
      photos: [
        { url: "https://res.cloudinary.com/demo/image/upload/sample.jpg", isPrimary: true },
      ],
    });

    const err = await user.validate().catch((e) => e);
    expect(err?.errors?.["photos.0.url"]).toBeUndefined();
  });

  it(`enforces maximum ${MAX_PHOTOS_ALLOWED} photos limit`, async () => {
    const photos = Array.from({ length: MAX_PHOTOS_ALLOWED + 1 }, (_, i) => ({
      url: `https://res.cloudinary.com/demo/image/upload/sample${i}.jpg`,
    }));

    const user = new User({
      name: "Sophia Rose",
      username: "sophia_rose",
      email: "sophia@example.com",
      password: "password123",
      photos,
    });

    const err = await user.validate().catch((e) => e);
    expect(err).toBeDefined();
    expect(err.errors["photos"]).toBeDefined();
    expect(err.errors["photos"].message).toContain(`Cannot upload more than ${MAX_PHOTOS_ALLOWED}`);
  });

  it(`enforces maximum ${MAX_INTERESTS_ALLOWED} interests limit`, async () => {
    const interests = Array.from({ length: MAX_INTERESTS_ALLOWED + 1 }, (_, i) => `Interest ${i}`);

    const user = new User({
      name: "Sophia Rose",
      username: "sophia_rose",
      email: "sophia@example.com",
      password: "password123",
      interests,
    });

    const err = await user.validate().catch((e) => e);
    expect(err).toBeDefined();
    expect(err.errors["interests"]).toBeDefined();
    expect(err.errors["interests"].message).toContain(`Cannot select more than ${MAX_INTERESTS_ALLOWED}`);
  });

  it(`enforces maximum ${MAX_PROMPTS_ALLOWED} prompts limit`, async () => {
    const prompts = Array.from({ length: MAX_PROMPTS_ALLOWED + 1 }, (_, i) => ({
      prompt: `Question ${i}`,
      answer: `Answer ${i}`,
    }));

    const user = new User({
      name: "Sophia Rose",
      username: "sophia_rose",
      email: "sophia@example.com",
      password: "password123",
      prompts,
    });

    const err = await user.validate().catch((e) => e);
    expect(err).toBeDefined();
    expect(err.errors["prompts"]).toBeDefined();
    expect(err.errors["prompts"].message).toContain(`Cannot answer more than ${MAX_PROMPTS_ALLOWED}`);
  });

  it("calculates age correctly from dateOfBirth virtual", () => {
    const today = new Date();
    const dob = new Date(today.getFullYear() - 24, today.getMonth(), today.getDate());

    const user = new User({
      name: "Julian",
      username: "julian_v",
      email: "julian@example.com",
      password: "password123",
      dateOfBirth: dob,
    });

    expect(user.age).toBe(24);
  });

  describe("Profile Completion Status (checkCompletionStatus)", () => {
    it(`fails completion when fewer than mandatory ${MIN_PHOTOS_REQUIRED} photos are uploaded`, () => {
      const today = new Date();
      const dob = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());

      const user = new User({
        name: "Elena Vance",
        username: "elena_vance",
        email: "elena@example.com",
        password: "password123",
        dateOfBirth: dob,
        gender: "woman",
        location: "Paris, France",
        bio: "Curator at modern art gallery. Passionate about architecture and jazz.",
        interests: ["Contemporary Art", "Jazz & Blues"],
        photos: [
          { url: "https://res.cloudinary.com/demo/image/upload/p1.jpg", isPrimary: true },
          { url: "https://res.cloudinary.com/demo/image/upload/p2.jpg", isPrimary: false },
          // Only 2 photos provided — mandatory 3 required!
        ],
      });

      const { isComplete, missing } = user.checkCompletionStatus();
      expect(isComplete).toBe(false);
      expect(missing.some((m) => m.includes("photos"))).toBe(true);
    });

    it("fails completion if user is underage (< 18)", () => {
      const today = new Date();
      const dob = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());

      const user = new User({
        name: "Young User",
        username: "young_user",
        email: "young@example.com",
        password: "password123",
        dateOfBirth: dob,
        gender: "woman",
        location: "London",
        bio: "Valid length bio text here.",
        interests: ["Photography"],
        photos: [
          { url: "https://res.cloudinary.com/demo/image/upload/p1.jpg" },
          { url: "https://res.cloudinary.com/demo/image/upload/p2.jpg" },
          { url: "https://res.cloudinary.com/demo/image/upload/p3.jpg" },
        ],
      });

      const { isComplete, missing } = user.checkCompletionStatus();
      expect(isComplete).toBe(false);
      expect(missing.some((m) => m.includes("18+"))).toBe(true);
    });

    it("succeeds completion when all required fields and mandatory 3 photos are satisfied", () => {
      const today = new Date();
      const dob = new Date(today.getFullYear() - 26, today.getMonth(), today.getDate());

      const user = new User({
        name: "Elena Vance",
        username: "elena_vance",
        email: "elena@example.com",
        password: "password123",
        dateOfBirth: dob,
        gender: "woman",
        location: "Paris, France",
        bio: "Curator at modern art gallery. Passionate about architecture and jazz.",
        interests: ["Contemporary Art", "Jazz & Blues", "Artisanal Coffee"],
        photos: [
          { url: "https://res.cloudinary.com/demo/image/upload/p1.jpg", isPrimary: true },
          { url: "https://res.cloudinary.com/demo/image/upload/p2.jpg", isPrimary: false },
          { url: "https://res.cloudinary.com/demo/image/upload/p3.jpg", isPrimary: false },
        ],
      });

      const { isComplete, missing } = user.checkCompletionStatus();
      expect(isComplete).toBe(true);
      expect(missing).toHaveLength(0);
    });
  });

  describe("Safe Serialization & Privacy (toSafeProfile)", () => {
    it("never exposes password hash in safe profile output", () => {
      const user = new User({
        name: "Elena",
        username: "elena",
        email: "elena@example.com",
        password: "hashed_secret_password_123",
      });

      const profile = user.toSafeProfile(true);
      expect(profile.password).toBeUndefined();
    });

    it("does not expose full dateOfBirth or email to public viewers (isOwner = false)", () => {
      const today = new Date();
      const dob = new Date(today.getFullYear() - 28, today.getMonth(), today.getDate());

      const user = new User({
        name: "Elena",
        username: "elena",
        email: "private_email@example.com",
        password: "secretpassword",
        dateOfBirth: dob,
      });

      const publicProfile = user.toSafeProfile(false);
      expect(publicProfile.email).toBeUndefined();
      expect(publicProfile.dateOfBirth).toBeUndefined();
      expect(publicProfile.age).toBe(28);
    });

    it("provides calculated age and dateOfBirth string only to the profile owner", () => {
      const today = new Date();
      const dob = new Date(today.getFullYear() - 28, today.getMonth(), today.getDate());

      const user = new User({
        name: "Elena",
        username: "elena",
        email: "owner@example.com",
        password: "secretpassword",
        dateOfBirth: dob,
      });

      const ownerProfile = user.toSafeProfile(true);
      expect(ownerProfile.email).toBe("owner@example.com");
      expect(ownerProfile.dateOfBirth).toBe(dob.toISOString().split("T")[0]);
      expect(ownerProfile.age).toBe(28);
    });
  });
});
