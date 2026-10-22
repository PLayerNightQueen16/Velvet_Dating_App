import { describe, it, expect } from "vitest";
import { calculateAge, validateAgeRange } from "../utils/ageValidator.js";

describe("Adult Age Validation Utility (Calendar-aware)", () => {
  it("accepts a valid adult birth date (e.g. 25 years old)", () => {
    const today = new Date();
    const dob = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
    const res = calculateAge(dob.toISOString());
    expect(res.isValid).toBe(true);
    expect(res.age).toBe(25);
    expect(res.error).toBeNull();
  });

  it("rejects an underage birth date (< 18 years old)", () => {
    const today = new Date();
    const dob = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
    const res = calculateAge(dob.toISOString());
    expect(res.isValid).toBe(false);
    expect(res.age).toBe(17);
    expect(res.error).toContain("18 years old");
  });

  it("rejects future birth dates", () => {
    const today = new Date();
    const futureDob = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    const res = calculateAge(futureDob.toISOString());
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("future");
  });

  it("handles birthday that has NOT occurred yet in the current year", () => {
    const today = new Date();
    // Birthday is tomorrow, but 20 years ago. Today, person is still 19!
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dob = new Date(today.getFullYear() - 20, tomorrow.getMonth(), tomorrow.getDate());

    const res = calculateAge(dob.toISOString());
    // If tomorrow happens to cross into next month/year, test specifically by offsetting month/day
    const now = new Date();
    // Set birthday to next month
    const nextMonthDob = new Date(now.getFullYear() - 20, (now.getMonth() + 1) % 12, 15);
    // If next month is January (i.e. currently December), year should be properly adjusted
    if (now.getMonth() === 11) {
      // birthday was earlier this year, so test with later day in December
      const laterDay = new Date(now.getFullYear() - 20, 11, 31);
      if (now.getDate() < 31) {
        const check = calculateAge(laterDay.toISOString());
        expect(check.age).toBe(19);
      }
    } else {
      const check = calculateAge(nextMonthDob.toISOString());
      expect(check.age).toBe(19);
    }
  });

  it("rejects missing or invalid date strings", () => {
    expect(calculateAge(null).isValid).toBe(false);
    expect(calculateAge("").isValid).toBe(false);
    expect(calculateAge("not-a-date").isValid).toBe(false);
  });

  it("rejects unrealistic ages (> 120 years)", () => {
    const res = calculateAge("1890-01-01");
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("valid date of birth");
  });
});

describe("Dating Preference Age Range Validation", () => {
  it("accepts valid adult age range (e.g. 21 to 35)", () => {
    const res = validateAgeRange(21, 35);
    expect(res.isValid).toBe(true);
    expect(res.min).toBe(21);
    expect(res.max).toBe(35);
    expect(res.error).toBeNull();
  });

  it("rejects minimum preferred age below 18", () => {
    const res = validateAgeRange(17, 30);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("below 18");
  });

  it("rejects maximum preferred age less than minimum preferred age", () => {
    const res = validateAgeRange(30, 25);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("greater than or equal to minimum");
  });

  it("rejects maximum age over 100", () => {
    const res = validateAgeRange(20, 105);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("cannot exceed 100");
  });

  it("rejects non-numeric values", () => {
    const res = validateAgeRange("twenty", 30);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("must be numbers");
  });
});
