/**
 * Profile compatibility and discovery filtering helpers for VELVET.
 */

/**
 * Maps singular user gender to candidate preferred interest group.
 */
export const GENDER_TO_PREFERENCE_MAP = {
  woman: "women",
  man: "men",
  "non-binary": "non-binary",
  other: "everyone",
};

/**
 * Maps plural preference option to matching individual genders.
 */
export const PREFERENCE_TO_GENDERS_MAP = {
  women: ["woman"],
  men: ["man"],
  "non-binary": ["non-binary"],
  everyone: ["woman", "man", "non-binary", "other"],
};

/**
 * Calculates dateOfBirth MongoDB query boundaries for inclusive minAge and maxAge.
 * Ensures the strict 18+ adult boundary is never bypassed.
 *
 * @param {number} minAge - Inclusive minimum age (>= 18)
 * @param {number} maxAge - Inclusive maximum age (>= minAge, <= 100)
 * @returns {{ minBirthDate: Date, maxBirthDate: Date }}
 */
export function getBirthDateBounds(minAge = 18, maxAge = 100) {
  const today = new Date();
  const effectiveMinAge = Math.max(18, Number(minAge));
  const effectiveMaxAge = Math.min(100, Math.max(effectiveMinAge, Number(maxAge)));

  // Upper bound for dateOfBirth: must be born on or before this date to be at least minAge
  const maxBirthDate = new Date(
    today.getFullYear() - effectiveMinAge,
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999
  );

  // Lower bound for dateOfBirth: must be born on or after this date to be at most maxAge
  const minBirthDate = new Date(
    today.getFullYear() - effectiveMaxAge - 1,
    today.getMonth(),
    today.getDate() + 1,
    0,
    0,
    0,
    0
  );

  return { minBirthDate, maxBirthDate };
}

/**
 * Evaluates whether two users are mutually compatible in their gender preferences.
 *
 * @param {object} requester - Requester User document
 * @param {object} candidate - Candidate User document
 * @returns {boolean}
 */
export function isGenderCompatible(requester, candidate) {
  if (!requester || !candidate) return false;

  const reqInterestedIn = requester.preferences?.interestedIn || ["everyone"];
  const candGender = candidate.gender || "";

  // 1. Forward check: Does candidate gender match requester preferences?
  let forwardMatch = false;
  if (reqInterestedIn.includes("everyone") || reqInterestedIn.length === 0) {
    forwardMatch = true;
  } else {
    for (const pref of reqInterestedIn) {
      const allowedGenders = PREFERENCE_TO_GENDERS_MAP[pref] || [];
      if (allowedGenders.includes(candGender)) {
        forwardMatch = true;
        break;
      }
    }
  }

  if (!forwardMatch) return false;

  // 2. Reciprocal check: Does requester gender match candidate preferences?
  const candInterestedIn = candidate.preferences?.interestedIn || ["everyone"];
  const reqGender = requester.gender || "";

  let reciprocalMatch = false;
  if (candInterestedIn.includes("everyone") || candInterestedIn.length === 0) {
    reciprocalMatch = true;
  } else {
    for (const pref of candInterestedIn) {
      const allowedGenders = PREFERENCE_TO_GENDERS_MAP[pref] || [];
      if (allowedGenders.includes(reqGender)) {
        reciprocalMatch = true;
        break;
      }
    }
  }

  return reciprocalMatch;
}
