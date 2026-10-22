/**
 * Adult age validation utility for VELVET.
 * Calculates age with calendar accuracy and enforces the strict 18+ adult requirement.
 */

export function calculateAge(dob) {
  if (!dob) {
    return { isValid: false, age: null, error: "Date of birth is required." };
  }

  const birthDate = new Date(dob);

  if (isNaN(birthDate.getTime())) {
    return { isValid: false, age: null, error: "Invalid date format for date of birth." };
  }

  const today = new Date();

  // Reject future birth dates
  if (birthDate > today) {
    return { isValid: false, age: null, error: "Date of birth cannot be in the future." };
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // If birth month hasn't occurred yet this year, or is this month but birth day hasn't occurred yet, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Reject underage accounts (< 18)
  if (age < 18) {
    return {
      isValid: false,
      age,
      error: "You must be at least 18 years old to join VELVET.",
    };
  }

  // Reject unrealistic ages
  if (age > 120) {
    return {
      isValid: false,
      age,
      error: "Please provide a valid date of birth.",
    };
  }

  return { isValid: true, age, error: null };
}

/**
 * Validates preferred age range boundaries.
 */
export function validateAgeRange(minAge, maxAge) {
  const min = Number(minAge);
  const max = Number(maxAge);

  if (isNaN(min) || isNaN(max)) {
    return { isValid: false, error: "Age range values must be numbers." };
  }

  if (min < 18) {
    return { isValid: false, error: "Minimum preferred age cannot be below 18." };
  }

  if (max < min) {
    return { isValid: false, error: "Maximum preferred age must be greater than or equal to minimum age." };
  }

  if (max > 100) {
    return { isValid: false, error: "Maximum preferred age cannot exceed 100." };
  }

  return { isValid: true, min, max, error: null };
}
