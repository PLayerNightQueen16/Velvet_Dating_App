import { describe, it, expect } from "vitest";
import {
  getBirthDateBounds,
  isGenderCompatible,
  GENDER_TO_PREFERENCE_MAP,
  PREFERENCE_TO_GENDERS_MAP,
} from "../utils/compatibility.js";

describe("Compatibility Utilities", () => {
  describe("getBirthDateBounds (Calendar-aware bounds)", () => {
    it("enforces minimum age >= 18 even when minAge < 18 is passed", () => {
      const bounds = getBirthDateBounds(16, 30);
      const today = new Date();
      const expectedMaxYear = today.getFullYear() - 18;
      expect(bounds.maxBirthDate.getFullYear()).toBe(expectedMaxYear);
    });

    it("calculates correct birthdate boundaries for given age range", () => {
      const today = new Date();
      const { minBirthDate, maxBirthDate } = getBirthDateBounds(20, 30);

      // maxBirthDate corresponds to minAge (20 years ago)
      expect(maxBirthDate.getFullYear()).toBe(today.getFullYear() - 20);

      // minBirthDate corresponds to maxAge (30 years ago)
      expect(minBirthDate.getFullYear()).toBe(today.getFullYear() - 31);
    });
  });

  describe("isGenderCompatible (Forward & Reciprocal compatibility)", () => {
    it("returns true when both users prefer 'everyone'", () => {
      const userA = { gender: "woman", preferences: { interestedIn: ["everyone"] } };
      const userB = { gender: "man", preferences: { interestedIn: ["everyone"] } };
      expect(isGenderCompatible(userA, userB)).toBe(true);
    });

    it("returns true when preferences are mutually aligned (woman seeking men, man seeking women)", () => {
      const woman = { gender: "woman", preferences: { interestedIn: ["men"] } };
      const man = { gender: "man", preferences: { interestedIn: ["women"] } };
      expect(isGenderCompatible(woman, man)).toBe(true);
    });

    it("returns false when forward preference matches but reciprocal fails", () => {
      // User A (woman) is interested in men.
      // User B (man) is only interested in men.
      const woman = { gender: "woman", preferences: { interestedIn: ["men"] } };
      const man = { gender: "man", preferences: { interestedIn: ["men"] } };
      expect(isGenderCompatible(woman, man)).toBe(false);
    });

    it("returns false when forward preference does not match", () => {
      // User A (woman) is only interested in women.
      // User B is a man.
      const woman = { gender: "woman", preferences: { interestedIn: ["women"] } };
      const man = { gender: "man", preferences: { interestedIn: ["everyone"] } };
      expect(isGenderCompatible(woman, man)).toBe(false);
    });

    it("handles non-binary mutual compatibility", () => {
      const nb = { gender: "non-binary", preferences: { interestedIn: ["non-binary"] } };
      const candidateNb = { gender: "non-binary", preferences: { interestedIn: ["non-binary"] } };
      expect(isGenderCompatible(nb, candidateNb)).toBe(true);

      const candidateMan = { gender: "man", preferences: { interestedIn: ["everyone"] } };
      expect(isGenderCompatible(nb, candidateMan)).toBe(false); // nb only seeks non-binary
    });
  });
});
