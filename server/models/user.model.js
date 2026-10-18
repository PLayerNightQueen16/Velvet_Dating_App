import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { calculateAge } from "../utils/ageValidator.js";
import {
  MIN_PHOTOS_REQUIRED,
  MAX_PHOTOS_ALLOWED,
  MAX_INTERESTS_ALLOWED,
  MAX_PROMPTS_ALLOWED,
  ALLOWED_GENDERS,
  ALLOWED_INTERESTED_IN,
  ALLOWED_RELATIONSHIP_INTENTS,
} from "../utils/profileConstants.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9_]+$/;
const httpsUrlRegex = /^https:\/\/.+/i;

// Subschema for User Photos
const photoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "Photo URL is required"],
      trim: true,
      match: [httpsUrlRegex, "Photo URL must be a secure HTTPS link"],
    },
    publicId: {
      type: String,
      trim: true,
      default: null,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true, timestamps: true }
);

// Subschema for Profile Prompts
const promptAnswerSchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      required: [true, "Prompt question is required"],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, "Prompt answer is required"],
      trim: true,
      maxlength: [300, "Prompt answer cannot exceed 300 characters"],
    },
  },
  { _id: true }
);

// Subschema for Dating Preferences
const preferencesSchema = new mongoose.Schema(
  {
    ageRange: {
      min: {
        type: Number,
        default: 18,
        min: [18, "Minimum preferred age cannot be below 18"],
        max: [100, "Minimum preferred age cannot exceed 100"],
      },
      max: {
        type: Number,
        default: 45,
        min: [18, "Maximum preferred age cannot be below 18"],
        max: [100, "Maximum preferred age cannot exceed 100"],
      },
    },
    interestedIn: {
      type: [String],
      enum: ALLOWED_INTERESTED_IN,
      default: ["everyone"],
    },
    distanceKm: {
      type: Number,
      default: 50,
      min: [1, "Preferred distance must be at least 1 km"],
      max: [500, "Preferred distance cannot exceed 500 km"],
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // Authentication & Identity
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        usernameRegex,
        "Username may only contain letters, numbers, and underscores",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [emailRegex, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },

    // Basic Profile Information
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      trim: true,
      lowercase: true,
      enum: {
        values: [...ALLOWED_GENDERS, ""],
        message: "Gender must be woman, man, non-binary, or other",
      },
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
      default: "",
    },
    occupation: {
      type: String,
      trim: true,
      maxlength: [100, "Occupation cannot exceed 100 characters"],
      default: "",
    },
    education: {
      type: String,
      trim: true,
      maxlength: [100, "Education cannot exceed 100 characters"],
      default: "",
    },
    languages: {
      type: [String],
      default: [],
    },
    relationshipIntent: {
      type: String,
      trim: true,
      lowercase: true,
      enum: {
        values: [...ALLOWED_RELATIONSHIP_INTENTS, ""],
        message: `Relationship intent must be one of: ${ALLOWED_RELATIONSHIP_INTENTS.join(", ")}`,
      },
      default: "",
    },

    // Interests
    interests: {
      type: [String],
      validate: [
        (val) => val.length <= MAX_INTERESTS_ALLOWED,
        `Cannot select more than ${MAX_INTERESTS_ALLOWED} interests`,
      ],
      default: [],
    },

    // Prompts & Answers
    prompts: {
      type: [promptAnswerSchema],
      validate: [
        (val) => val.length <= MAX_PROMPTS_ALLOWED,
        `Cannot answer more than ${MAX_PROMPTS_ALLOWED} prompts`,
      ],
      default: [],
    },

    // Photos (Mandatory 3 for completion, Max 5 allowed)
    photos: {
      type: [photoSchema],
      validate: [
        (val) => val.length <= MAX_PHOTOS_ALLOWED,
        `Cannot upload more than ${MAX_PHOTOS_ALLOWED} photos`,
      ],
      default: [],
    },

    // Dating Preferences
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },

    // Profile Completion State
    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for calculated age
userSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const result = calculateAge(this.dateOfBirth);
  return result.isValid ? result.age : null;
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if profile satisfies all mandatory completion requirements
userSchema.methods.checkCompletionStatus = function () {
  const missing = [];

  if (!this.name || this.name.trim().length < 2) {
    missing.push("name");
  }

  if (!this.dateOfBirth) {
    missing.push("dateOfBirth");
  } else {
    const ageCheck = calculateAge(this.dateOfBirth);
    if (!ageCheck.isValid) {
      missing.push("validAdultAge (must be 18+)");
    }
  }

  if (!this.gender || !ALLOWED_GENDERS.includes(this.gender)) {
    missing.push("gender");
  }

  if (!this.location || !this.location.trim()) {
    missing.push("location");
  }

  if (!this.bio || !this.bio.trim()) {
    missing.push("bio");
  }

  if (!this.interests || this.interests.length < 1) {
    missing.push("interests (at least 1 required)");
  }

  // Mandatory 3 photos requirement
  if (!this.photos || this.photos.length < MIN_PHOTOS_REQUIRED) {
    missing.push(`photos (mandatory at least ${MIN_PHOTOS_REQUIRED} required, up to ${MAX_PHOTOS_ALLOWED})`);
  }

  const isComplete = missing.length === 0;
  return { isComplete, missing };
};

// Safe JSON serialization for authentication
userSchema.methods.toSafeObject = function () {
  const age = this.age;
  return {
    id: this._id,
    name: this.name,
    username: this.username,
    email: this.email,
    age,
    gender: this.gender,
    location: this.location,
    profileCompleted: this.profileCompleted,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Comprehensive Safe Profile serialization (never leaks password or raw DOB)
userSchema.methods.toSafeProfile = function (isOwner = false) {
  const age = this.age;

  const profile = {
    id: this._id,
    name: this.name,
    username: this.username,
    email: isOwner ? this.email : undefined,
    age,
    gender: this.gender,
    bio: this.bio,
    location: this.location,
    occupation: this.occupation,
    education: this.education,
    languages: this.languages,
    relationshipIntent: this.relationshipIntent || undefined,
    interests: this.interests,
    prompts: this.prompts,
    photos: this.photos.map((p) => ({
      id: p._id,
      url: p.url,
      publicId: isOwner ? p.publicId : undefined,
      isPrimary: p.isPrimary,
    })),
    preferences: isOwner ? this.preferences : undefined,
    profileCompleted: this.profileCompleted,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };

  // Only include raw dateOfBirth string for the owner in edit forms
  if (isOwner && this.dateOfBirth) {
    profile.dateOfBirth = this.dateOfBirth.toISOString().split("T")[0];
  }

  return profile;
};

// Safe Discovery serialization (returns strictly public data, never secrets/email/raw DOB/preferences)
userSchema.methods.toDiscoveryProfile = function () {
  const age = this.age;
  return {
    id: this._id,
    name: this.name,
    username: this.username,
    age,
    gender: this.gender,
    bio: this.bio,
    location: this.location,
    occupation: this.occupation,
    education: this.education,
    languages: this.languages || [],
    interests: this.interests || [],
    relationshipIntent: this.relationshipIntent || undefined,
    prompts: (this.prompts || []).map((p) => ({
      id: p._id,
      prompt: p.prompt,
      answer: p.answer,
    })),
    photos: (this.photos || []).map((p) => ({
      id: p._id,
      url: p.url,
      isPrimary: p.isPrimary,
    })),
  };
};

export const User = mongoose.model("User", userSchema);
