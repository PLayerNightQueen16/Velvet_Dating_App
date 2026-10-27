import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  User, Calendar, MapPin, Sparkles, Heart, Camera, ChevronRight,
  ChevronLeft, CheckCircle, X, Plus, Trash2, Star, Upload, AlertCircle,
  Loader2, Info, Link2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getProfile, saveOnboarding, completeProfile, uploadPhoto, addPhotoUrl, deletePhoto, setPrimaryPhoto,
} from "../services/api";

/* ===================== Constants (mirrors server) ===================== */
const MIN_PHOTOS = 3;
const MAX_PHOTOS = 5;
const MAX_INTERESTS = 10;

const INTEREST_CATEGORIES = [
  {
    label: "Arts & Culture",
    items: ["Contemporary Art", "Museums & Galleries", "Poetry", "Architecture", "Photography", "Theatre & Broadway"],
  },
  {
    label: "Food & Coffee",
    items: ["Artisanal Coffee", "Fine Dining", "Wine Tasting", "Baking", "Street Food", "Mixology", "Matcha & Tea"],
  },
  {
    label: "Music",
    items: ["Jazz & Blues", "Indie Rock", "Classical Music", "Vinyl Records", "Live Concerts", "Lo-Fi", "Electronic & Techno"],
  },
  {
    label: "Travel & Adventure",
    items: ["Road Trips", "Solo Backpacking", "Stargazing", "Boutique Hotels", "Cultural Tours", "Mountain Trekking", "Beach Sunsets"],
  },
  {
    label: "Fitness & Outdoors",
    items: ["Pilates & Yoga", "Rock Climbing", "Running", "Hiking", "Tennis", "Weightlifting"],
  },
  {
    label: "Books & Learning",
    items: ["Classic Literature", "Philosophy", "Psychology", "History", "Astronomy", "Book Clubs"],
  },
  {
    label: "Gaming & Technology",
    items: ["Cozy Games", "Sci-Fi", "Board Games", "Virtual Reality", "Coding & Tech"],
  },
  {
    label: "Film & Television",
    items: ["Arthouse Cinema", "Documentaries", "French New Wave", "Cinema Classics", "Anime"],
  },
  {
    label: "Lifestyle",
    items: ["Candle Making", "Vintage Fashion", "Interior Design", "Botanical Gardens", "Midnight Talks", "Meditation"],
  },
];

const CURATED_PROMPTS = [
  "A perfect Sunday looks like...",
  "The quickest way to my heart is...",
  "A hill I'll die on...",
  "Together, we could...",
  "My most controversial opinion...",
  "I'll fall for you if...",
  "My ideal first date...",
  "A green flag I look for...",
  "The best conversation starter is...",
  "You should leave a message if...",
];

const GENDERS = ["Woman", "Man", "Non-binary", "Other"];
const INTERESTED_IN_OPTIONS = ["Women", "Men", "Everyone", "Non-binary"];

/* ===================== Step config ===================== */
const STEPS = [
  { id: "basics",      label: "Basics",      icon: User },
  { id: "bio",         label: "About You",   icon: Sparkles },
  { id: "interests",   label: "Interests",   icon: Heart },
  { id: "prompts",     label: "Prompts",     icon: Sparkles },
  { id: "photos",      label: "Photos",      icon: Camera },
  { id: "preferences", label: "Preferences", icon: Heart },
];

/* ===================== Design tokens ===================== */
const CARD_STYLE = {
  background: "rgba(58, 13, 26, 0.55)",
  border: "1px solid rgba(242, 182, 194, 0.18)",
  boxShadow: "0 32px 96px rgba(0,0,0,0.65), 0 0 48px rgba(139,30,63,0.2)",
};

const INPUT_STYLE = {
  background: "rgba(26, 15, 19, 0.6)",
  border: "1px solid rgba(242, 182, 194, 0.2)",
  color: "#F8EDEB",
};

const LABEL_CLS = "block text-xs uppercase tracking-wider text-[#D4AF97] font-semibold mb-2";
const INPUT_CLS = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-[#F2B6C2]/40 focus:border-[#F2B6C2]/60 focus:shadow-[0_0_0_3px_rgba(242,182,194,0.12)]";

/* ===================== 18+ date cap helper ===================== */
function getMaxDobDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
}

/* ===================== Frontend age validation ===================== */
function validateAge(dob) {
  if (!dob) return { valid: false, error: "Date of birth is required." };
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return { valid: false, error: "Invalid date." };
  const now = new Date();
  if (birth > now) return { valid: false, error: "Date of birth cannot be in the future." };
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  if (age < 18) return { valid: false, error: "You must be at least 18 years old." };
  if (age > 120) return { valid: false, error: "Please enter a valid date of birth." };
  return { valid: true, age };
}

/* ===================== Photo slot helpers ===================== */
function PhotoSlot({ photo, index, onSetPrimary, onDelete, isPrimary }) {
  return (
    <div
      className="relative group aspect-[3/4] rounded-2xl overflow-hidden border"
      style={{
        borderColor: isPrimary ? "rgba(212,175,151,0.7)" : "rgba(242,182,194,0.2)",
        background: "rgba(26,15,19,0.5)",
      }}
    >
      <img
        src={photo.url}
        alt={`Profile photo ${index + 1}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      {isPrimary && (
        <div className="absolute top-2 left-2 bg-[#D4AF97] text-[#1A0F13] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Star size={9} /> Primary
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-2">
        {!isPrimary && (
          <button
            type="button"
            onClick={() => onSetPrimary(photo._id || photo.id)}
            className="w-full text-[10px] font-semibold py-1.5 rounded-lg bg-[#D4AF97] text-[#1A0F13] flex items-center justify-center gap-1 hover:bg-[#e8c9a7] transition-colors"
          >
            <Star size={10} /> Set Primary
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(photo._id || photo.id)}
          className="w-full text-[10px] font-semibold py-1.5 rounded-lg bg-[#8B1E3F]/80 text-[#FDE7E9] flex items-center justify-center gap-1 hover:bg-[#8B1E3F] transition-colors"
        >
          <Trash2 size={10} /> Remove
        </button>
      </div>
    </div>
  );
}

function EmptyPhotoSlot({ onPickFile, uploading, index }) {
  return (
    <label
      htmlFor={`photo-upload-${index}`}
      className="relative aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:bg-[#8B1E3F]/15"
      style={{ borderColor: "rgba(242,182,194,0.3)" }}
    >
      {uploading ? (
        <Loader2 size={24} className="text-[#F2B6C2] animate-spin" />
      ) : (
        <>
          <Plus size={28} className="text-[#F2B6C2]/50 mb-2" />
          <span className="text-[11px] text-[#F2B6C2]/50 text-center px-2">Add Photo</span>
        </>
      )}
      <input
        id={`photo-upload-${index}`}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={onPickFile}
        disabled={uploading}
      />
    </label>
  );
}

/* ===================== Main component ===================== */
export default function ProfileOnboarding() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Form state — restored from backend on mount
  const [basics, setBasics] = useState({
    name: user?.name || "",
    dateOfBirth: "",
    gender: "",
    location: "",
    occupation: "",
    education: "",
  });
  const [bioData, setBioData] = useState({ bio: "" });
  const [languages, setLanguages] = useState([]);
  const [langInput, setLangInput] = useState("");
  const [interests, setInterests] = useState([]);
  const [prompts, setPrompts] = useState([{ prompt: "", answer: "" }]);
  const [photos, setPhotos] = useState([]);
  const [preferences, setPreferences] = useState({
    interestedIn: [],
    ageRange: { min: 18, max: 45 },
    distanceKm: 50,
  });

  /* ---- Restore saved onboarding progress from backend on mount ---- */
  useEffect(() => {
    async function restoreProgress() {
      try {
        const data = await getProfile();
        if (data?.success && data?.profile) {
          const p = data.profile;

          // If profile is already complete, redirect to app
          if (p.profileCompleted) {
            navigate("/app", { replace: true });
            return;
          }

          setBasics({
            name: p.name || user?.name || "",
            dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "",
            gender: p.gender ? (p.gender.charAt(0).toUpperCase() + p.gender.slice(1)) : "",
            location: p.location || "",
            occupation: p.occupation || "",
            education: p.education || "",
          });
          setBioData({ bio: p.bio || "" });
          setLanguages(p.languages || []);
          setInterests(p.interests || []);
          if (p.prompts?.length) setPrompts(p.prompts);
          setPhotos(p.photos || []);
          if (p.preferences) {
            setPreferences({
              interestedIn: p.preferences.interestedIn || [],
              ageRange: {
                min: p.preferences.ageRange?.min ?? 18,
                max: p.preferences.ageRange?.max ?? 45,
              },
              distanceKm: p.preferences.distanceKm ?? 50,
            });
          }
        }
      } catch {
        // Non-fatal — continue with defaults
      } finally {
        setLoadingProfile(false);
      }
    }
    restoreProgress();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  /* ---------- Validate per step ---------- */
  const validateStep = useCallback(() => {
    const errs = {};
    if (currentStep.id === "basics") {
      if (!basics.name.trim() || basics.name.trim().length < 2) errs.name = "Name must be at least 2 characters.";
      if (!basics.dateOfBirth) {
        errs.dateOfBirth = "Date of birth is required.";
      } else {
        const ageCheck = validateAge(basics.dateOfBirth);
        if (!ageCheck.valid) errs.dateOfBirth = ageCheck.error;
      }
      if (!basics.gender) errs.gender = "Please select a gender.";
      if (!basics.location.trim()) errs.location = "Location is required.";
    }
    if (currentStep.id === "bio") {
      if (!bioData.bio.trim() || bioData.bio.trim().length < 10) errs.bio = "Bio must be at least 10 characters.";
    }
    if (currentStep.id === "interests") {
      if (interests.length < 1) errs.interests = "Select at least 1 interest.";
    }
    if (currentStep.id === "prompts") {
      const valid = prompts.filter(p => p.prompt && p.answer.trim().length >= 3);
      if (valid.length < 1) errs.prompts = "Please answer at least one prompt (min 3 characters).";
    }
    if (currentStep.id === "photos") {
      if (photos.length < MIN_PHOTOS) errs.photos = `Please add at least ${MIN_PHOTOS} photos.`;
    }
    if (currentStep.id === "preferences") {
      if (preferences.interestedIn.length < 1) errs.interestedIn = "Please select at least one option.";
    }
    return errs;
  }, [currentStep.id, basics, bioData, interests, prompts, photos, preferences]);

  const canProceed = useCallback(() => {
    return Object.keys(validateStep()).length === 0;
  }, [validateStep]);

  /* ---------- Save current step ---------- */
  const saveStep = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {};
      if (currentStep.id === "basics") {
        payload.name = basics.name.trim();
        payload.dateOfBirth = basics.dateOfBirth;
        payload.gender = basics.gender.toLowerCase();
        payload.location = basics.location.trim();
        payload.occupation = basics.occupation.trim();
        payload.education = basics.education.trim();
      } else if (currentStep.id === "bio") {
        payload.bio = bioData.bio.trim();
        payload.languages = languages;
      } else if (currentStep.id === "interests") {
        payload.interests = interests;
      } else if (currentStep.id === "prompts") {
        payload.prompts = prompts.filter(p => p.prompt && p.answer.trim());
      } else if (currentStep.id === "preferences") {
        payload.preferences = {
          interestedIn: preferences.interestedIn,
          ageRange: { min: preferences.ageRange.min, max: preferences.ageRange.max },
          distanceKm: preferences.distanceKm,
        };
      }
      if (Object.keys(payload).length > 0) {
        await saveOnboarding(payload);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
    return true;
  }, [currentStep.id, basics, bioData, languages, interests, prompts, preferences]);

  /* ---------- Navigation ---------- */
  const handleNext = async () => {
    const errs = validateStep();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    // Photos step is saved on each upload — skip saveStep
    if (currentStep.id !== "photos") {
      const ok = await saveStep();
      if (!ok) return;
    }
    if (isLastStep) {
      await handleComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(s => s - 1);
      setError("");
      setFieldErrors({});
    }
  };

  /* ---------- Complete profile ---------- */
  const handleComplete = async () => {
    setSaving(true);
    setError("");
    try {
      // Save final preferences step
      await saveOnboarding({
        preferences: {
          interestedIn: preferences.interestedIn,
          ageRange: preferences.ageRange,
          distanceKm: preferences.distanceKm,
        },
      });
      await completeProfile();
      await checkAuth();
      navigate("/app", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Could not complete profile.";
      const missing = err.response?.data?.missingFields;
      setError(msg + (missing?.length ? ` Missing: ${missing.join(", ")}.` : ""));
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Photo handlers ---------- */
  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= MAX_PHOTOS) {
      setError(`You can add at most ${MAX_PHOTOS} photos.`);
      return;
    }
    setUploading(true);
    setError("");
    setFieldErrors(prev => ({ ...prev, photos: undefined }));
    try {
      const res = await uploadPhoto(file);
      setPhotos(res.photos);
    } catch (err) {
      setError(err.response?.data?.message || "Photo upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [photos.length]);

  const handleAddPhotoByUrl = useCallback(async (targetUrl) => {
    const url = String(targetUrl || "").trim();
    if (!url || !url.startsWith("https://")) {
      setError("Please provide a valid secure photo URL starting with https://");
      return;
    }
    if (photos.length >= MAX_PHOTOS) {
      setError(`You can add at most ${MAX_PHOTOS} photos.`);
      return;
    }
    setUploading(true);
    setError("");
    setFieldErrors(prev => ({ ...prev, photos: undefined }));
    try {
      const res = await addPhotoUrl(url);
      setPhotos(res.photos);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add photo URL.");
    } finally {
      setUploading(false);
    }
  }, [photos.length]);

  const handleDeletePhoto = useCallback(async (photoId) => {
    setError("");
    try {
      const res = await deletePhoto(photoId);
      setPhotos(res.photos);
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove photo.");
    }
  }, []);

  const handleSetPrimary = useCallback(async (photoId) => {
    try {
      const res = await setPrimaryPhoto(photoId);
      setPhotos(res.photos);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update primary photo.");
    }
  }, []);

  const handleAddLanguage = () => {
    const trimmed = langInput.trim();
    if (trimmed && !languages.includes(trimmed) && languages.length < 10) {
      setLanguages(prev => [...prev, trimmed]);
      setLangInput("");
    }
  };

  /* ===================== Loading skeleton ===================== */
  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 relative z-10">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-[#F2B6C2] animate-spin" />
          <p className="text-[#F2B6C2]/60 text-sm">Restoring your progress...</p>
        </div>
      </div>
    );
  }

  /* ===================== Render steps ===================== */
  const renderStep = () => {
    switch (currentStep.id) {

      /* ---- Basics ---- */
      case "basics":
        return (
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="onboard-name" className={LABEL_CLS}>Full Name</label>
              <input
                id="onboard-name"
                className={INPUT_CLS}
                style={INPUT_STYLE}
                placeholder="Your display name"
                value={basics.name}
                onChange={e => {
                  setBasics(b => ({ ...b, name: e.target.value }));
                  if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: undefined }));
                }}
                maxLength={50}
              />
              {fieldErrors.name && <p className="text-[#F2B6C2] text-xs mt-1">{fieldErrors.name}</p>}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="onboard-dob" className={LABEL_CLS}>
                Date of Birth <span className="text-[#F2B6C2]/60 normal-case">(18+ required)</span>
              </label>
              <input
                id="onboard-dob"
                type="date"
                className={INPUT_CLS}
                style={{ ...INPUT_STYLE, colorScheme: "dark" }}
                value={basics.dateOfBirth}
                max={getMaxDobDate()}
                onChange={e => {
                  setBasics(b => ({ ...b, dateOfBirth: e.target.value }));
                  if (fieldErrors.dateOfBirth) setFieldErrors(p => ({ ...p, dateOfBirth: undefined }));
                }}
              />
              {fieldErrors.dateOfBirth && <p className="text-[#F2B6C2] text-xs mt-1">{fieldErrors.dateOfBirth}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className={LABEL_CLS}>I identify as</label>
              <div className="grid grid-cols-2 gap-3">
                {GENDERS.map(g => (
                  <button
                    key={g}
                    id={`gender-${g.toLowerCase().replace(/\s+/g, "-")}`}
                    type="button"
                    onClick={() => {
                      setBasics(b => ({ ...b, gender: g }));
                      if (fieldErrors.gender) setFieldErrors(p => ({ ...p, gender: undefined }));
                    }}
                    className="py-3 px-4 rounded-xl text-sm font-medium border transition-all duration-200"
                    style={{
                      background: basics.gender === g ? "rgba(139,30,63,0.5)" : "rgba(26,15,19,0.5)",
                      borderColor: basics.gender === g ? "rgba(242,182,194,0.6)" : "rgba(242,182,194,0.15)",
                      color: basics.gender === g ? "#F8EDEB" : "#F2B6C2",
                      boxShadow: basics.gender === g ? "0 0 16px rgba(139,30,63,0.4)" : "none",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {fieldErrors.gender && <p className="text-[#F2B6C2] text-xs mt-1">{fieldErrors.gender}</p>}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="onboard-location" className={LABEL_CLS}>
                <MapPin size={12} className="inline mr-1" />Location
              </label>
              <input
                id="onboard-location"
                className={INPUT_CLS}
                style={INPUT_STYLE}
                placeholder="City, Country"
                value={basics.location}
                onChange={e => {
                  setBasics(b => ({ ...b, location: e.target.value }));
                  if (fieldErrors.location) setFieldErrors(p => ({ ...p, location: undefined }));
                }}
              />
              {fieldErrors.location && <p className="text-[#F2B6C2] text-xs mt-1">{fieldErrors.location}</p>}
            </div>

            {/* Occupation & Education */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="onboard-occupation" className={LABEL_CLS}>Occupation</label>
                <input
                  id="onboard-occupation"
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                  placeholder="What you do"
                  value={basics.occupation}
                  onChange={e => setBasics(b => ({ ...b, occupation: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="onboard-education" className={LABEL_CLS}>Education</label>
                <input
                  id="onboard-education"
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                  placeholder="e.g. B.Sc. Design"
                  value={basics.education}
                  onChange={e => setBasics(b => ({ ...b, education: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      /* ---- Bio & Languages ---- */
      case "bio":
        return (
          <div className="space-y-5">
            <div>
              <label htmlFor="onboard-bio" className={LABEL_CLS}>
                Your Bio <span className="text-[#F2B6C2]/60 normal-case">({bioData.bio.length}/500)</span>
              </label>
              <textarea
                id="onboard-bio"
                className={INPUT_CLS}
                style={{ ...INPUT_STYLE, resize: "none" }}
                rows={5}
                placeholder="Tell potential matches what makes you, you..."
                value={bioData.bio}
                onChange={e => {
                  setBioData(b => ({ ...b, bio: e.target.value }));
                  if (fieldErrors.bio) setFieldErrors(p => ({ ...p, bio: undefined }));
                }}
                maxLength={500}
              />
              {fieldErrors.bio && <p className="text-[#F2B6C2] text-xs mt-1">{fieldErrors.bio}</p>}
            </div>

            {/* Languages */}
            <div>
              <label className={LABEL_CLS}>Languages</label>
              <div className="flex gap-2 mb-2">
                <input
                  id="onboard-lang-input"
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                  placeholder="e.g. English"
                  value={langInput}
                  onChange={e => setLangInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddLanguage())}
                  maxLength={40}
                />
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{ background: "rgba(139,30,63,0.5)", color: "#FDE7E9", border: "1px solid rgba(242,182,194,0.25)" }}
                >
                  Add
                </button>
              </div>
              {languages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {languages.map(lang => (
                    <span
                      key={lang}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{ background: "rgba(139,30,63,0.35)", border: "1px solid rgba(242,182,194,0.3)", color: "#FDE7E9" }}
                    >
                      {lang}
                      <button
                        type="button"
                        onClick={() => setLanguages(prev => prev.filter(l => l !== lang))}
                        className="hover:text-[#F2B6C2] transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      /* ---- Interests ---- */
      case "interests":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[#F2B6C2]/70 text-sm">
                Select up to {MAX_INTERESTS} interests.
              </p>
              <span className="text-xs font-semibold text-[#D4AF97]">{interests.length}/{MAX_INTERESTS}</span>
            </div>
            {fieldErrors.interests && (
              <p className="text-[#F2B6C2] text-xs flex items-center gap-1.5">
                <AlertCircle size={13} />{fieldErrors.interests}
              </p>
            )}
            <div
              className="space-y-5 max-h-[360px] overflow-y-auto pr-1 scroll-smooth"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(242,182,194,0.2) transparent" }}
            >
              {INTEREST_CATEGORIES.map(cat => (
                <div key={cat.label}>
                  <p className="text-[10px] uppercase tracking-widest text-[#D4AF97] font-semibold mb-2">{cat.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map(interest => {
                      const selected = interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          id={`interest-${interest.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              setInterests(prev => prev.filter(i => i !== interest));
                            } else if (interests.length < MAX_INTERESTS) {
                              setInterests(prev => [...prev, interest]);
                              if (fieldErrors.interests) setFieldErrors(p => ({ ...p, interests: undefined }));
                            }
                          }}
                          className="px-3.5 py-2 rounded-full text-xs font-medium border transition-all duration-200"
                          style={{
                            background: selected ? "rgba(139,30,63,0.55)" : "rgba(26,15,19,0.45)",
                            borderColor: selected ? "rgba(242,182,194,0.6)" : "rgba(242,182,194,0.15)",
                            color: selected ? "#FDE7E9" : "#F2B6C2",
                            boxShadow: selected ? "0 0 12px rgba(139,30,63,0.35)" : "none",
                          }}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      /* ---- Prompts ---- */
      case "prompts":
        return (
          <div className="space-y-5">
            <p className="text-[#F2B6C2]/70 text-sm">Answer 1–3 prompts to spark connections.</p>
            {fieldErrors.prompts && (
              <p className="text-[#F2B6C2] text-xs flex items-center gap-1.5">
                <AlertCircle size={13} />{fieldErrors.prompts}
              </p>
            )}
            {prompts.map((p, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border space-y-3"
                style={{ background: "rgba(26,15,19,0.5)", borderColor: "rgba(242,182,194,0.15)" }}
              >
                <div className="flex items-center justify-between">
                  <label className={LABEL_CLS + " mb-0"}>Prompt {idx + 1}</label>
                  {prompts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPrompts(prev => prev.filter((_, i) => i !== idx))}
                      className="text-[#F2B6C2]/50 hover:text-[#F2B6C2] transition-colors"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
                <select
                  id={`prompt-q-${idx}`}
                  className={INPUT_CLS}
                  style={{ ...INPUT_STYLE, appearance: "none" }}
                  value={p.prompt}
                  onChange={e => {
                    setPrompts(prev => prev.map((item, i) => i === idx ? { ...item, prompt: e.target.value } : item));
                    if (fieldErrors.prompts) setFieldErrors(prev => ({ ...prev, prompts: undefined }));
                  }}
                >
                  <option value="">Choose a prompt...</option>
                  {CURATED_PROMPTS.filter(q => q === p.prompt || !prompts.some(x => x.prompt === q)).map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
                <textarea
                  id={`prompt-a-${idx}`}
                  className={INPUT_CLS}
                  style={{ ...INPUT_STYLE, resize: "none" }}
                  rows={3}
                  placeholder="Your answer..."
                  value={p.answer}
                  onChange={e => setPrompts(prev => prev.map((item, i) => i === idx ? { ...item, answer: e.target.value } : item))}
                  maxLength={300}
                />
                <p className="text-[10px] text-[#F2B6C2]/40 text-right">{p.answer.length}/300</p>
              </div>
            ))}
            {prompts.length < 3 && (
              <button
                type="button"
                onClick={() => setPrompts(prev => [...prev, { prompt: "", answer: "" }])}
                className="w-full py-3 rounded-xl border border-dashed text-sm text-[#F2B6C2]/60 hover:text-[#F2B6C2] hover:border-[#F2B6C2]/40 flex items-center justify-center gap-2 transition-all duration-200"
                style={{ borderColor: "rgba(242,182,194,0.2)" }}
              >
                <Plus size={16} /> Add Another Prompt
              </button>
            )}
          </div>
        );

      /* ---- Photos ---- */
      case "photos":
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-[#F2B6C2]/70 text-sm">
                Add at least <span className="text-[#F2B6C2] font-semibold">{MIN_PHOTOS} photos</span>, up to {MAX_PHOTOS}.
              </p>
              <span className="text-xs font-semibold text-[#D4AF97]">{photos.length}/{MAX_PHOTOS}</span>
            </div>

            {/* Photo progress bar */}
            <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(242,182,194,0.15)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((photos.length / MIN_PHOTOS) * 100, 100)}%`,
                  background: photos.length >= MIN_PHOTOS
                    ? "linear-gradient(90deg, #22c55e, #86efac)"
                    : "linear-gradient(90deg, #8B1E3F, #D4AF97)",
                }}
              />
            </div>

            {photos.length < MIN_PHOTOS ? (
              <div className="flex items-center gap-2 text-xs text-[#F2B6C2]/60 px-1">
                <AlertCircle size={13} />
                {MIN_PHOTOS - photos.length} more photo{MIN_PHOTOS - photos.length !== 1 ? "s" : ""} required
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-green-400/80 px-1">
                <CheckCircle size={13} /> Minimum met — profile can be completed!
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, i) => (
                <PhotoSlot
                  key={photo._id || photo.id || i}
                  photo={photo}
                  index={i}
                  isPrimary={photo.isPrimary}
                  onSetPrimary={handleSetPrimary}
                  onDelete={handleDeletePhoto}
                />
              ))}
              {photos.length < MAX_PHOTOS &&
                Array.from({ length: MAX_PHOTOS - photos.length }).map((_, i) => (
                  <EmptyPhotoSlot
                    key={`empty-${i}`}
                    index={photos.length + i}
                    uploading={uploading && i === 0}
                    onPickFile={handleFileUpload}
                  />
                ))}
            </div>

            {fieldErrors.photos && (
              <p className="text-[#F2B6C2] text-xs flex items-center gap-1.5">
                <AlertCircle size={13} />{fieldErrors.photos}
              </p>
            )}

            {/* Quick Portrait Presets and URL Fallback */}
            <div className="p-3.5 rounded-xl border border-[#F2B6C2]/15 bg-[#1A0F13]/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#D4AF97] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#F2B6C2]" /> Quick Add Velvet Portraits (1-Click)
                </span>
                <span className="text-[10px] text-[#F2B6C2]/50">Or upload your own files</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Classic Velvet", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80" },
                  { label: "Golden Hour", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80" },
                  { label: "Sunset Glow", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80" },
                  { label: "Noir Elegance", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80" },
                ].map(p => (
                  <button
                    key={p.label}
                    type="button"
                    disabled={photos.length >= MAX_PHOTOS || uploading}
                    onClick={() => handleAddPhotoByUrl(p.url)}
                    className="p-1.5 rounded-lg border border-[#F2B6C2]/20 bg-[#1A0F13]/70 hover:bg-[#8B1E3F]/30 hover:border-[#F2B6C2]/40 text-left transition-all flex items-center gap-2 group disabled:opacity-50"
                  >
                    <img src={p.url} alt={p.label} className="w-7 h-7 rounded-md object-cover shrink-0" />
                    <span className="text-[10px] font-medium text-[#F8EDEB] group-hover:text-[#F2B6C2] truncate">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload info */}
            <div
              className="p-3 rounded-xl text-xs text-[#F2B6C2]/60 border flex items-start gap-2"
              style={{ background: "rgba(26,15,19,0.4)", borderColor: "rgba(242,182,194,0.1)" }}
            >
              <Upload size={13} className="shrink-0 mt-0.5 text-[#D4AF97]" />
              <span>
                Upload your files (JPEG, PNG, WebP) or click any preset portrait above. The first photo is automatically set as your primary.
              </span>
            </div>
          </div>
        );

      /* ---- Preferences ---- */
      case "preferences":
        return (
          <div className="space-y-6">
            {/* Info note */}
            <div
              className="flex items-start gap-2 p-3 rounded-xl text-xs text-[#F2B6C2]/70 border"
              style={{ background: "rgba(26,15,19,0.4)", borderColor: "rgba(242,182,194,0.1)" }}
            >
              <Info size={13} className="shrink-0 mt-0.5 text-[#D4AF97]" />
              <span>
                These are your dating preferences. They help shape your experience — they are not a guarantee
                of who will appear in discovery.
              </span>
            </div>

            {/* Interested in */}
            <div>
              <label className={LABEL_CLS}>Interested in</label>
              <div className="grid grid-cols-2 gap-3">
                {INTERESTED_IN_OPTIONS.map(opt => {
                  const val = opt.toLowerCase();
                  const selected = preferences.interestedIn.includes(val);
                  return (
                    <button
                      key={opt}
                      id={`interested-in-${val}`}
                      type="button"
                      onClick={() => {
                        setPreferences(p => ({
                          ...p,
                          interestedIn: selected
                            ? p.interestedIn.filter(x => x !== val)
                            : [...p.interestedIn, val],
                        }));
                        if (fieldErrors.interestedIn) setFieldErrors(prev => ({ ...prev, interestedIn: undefined }));
                      }}
                      className="py-3 px-4 rounded-xl text-sm font-medium border transition-all duration-200"
                      style={{
                        background: selected ? "rgba(139,30,63,0.5)" : "rgba(26,15,19,0.5)",
                        borderColor: selected ? "rgba(242,182,194,0.6)" : "rgba(242,182,194,0.15)",
                        color: selected ? "#F8EDEB" : "#F2B6C2",
                        boxShadow: selected ? "0 0 16px rgba(139,30,63,0.4)" : "none",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {fieldErrors.interestedIn && <p className="text-[#F2B6C2] text-xs mt-1">{fieldErrors.interestedIn}</p>}
            </div>

            {/* Age range */}
            <div>
              <label className={LABEL_CLS}>
                Age range: <span className="text-[#D4AF97] normal-case">{preferences.ageRange.min}–{preferences.ageRange.max}</span>
              </label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#F2B6C2]/60 mb-1 block">Minimum age: {preferences.ageRange.min}</label>
                  <input
                    id="pref-age-min"
                    type="range"
                    min={18}
                    max={preferences.ageRange.max - 1}
                    value={preferences.ageRange.min}
                    onChange={e => setPreferences(p => ({ ...p, ageRange: { ...p.ageRange, min: Number(e.target.value) } }))}
                    className="w-full accent-[#8B1E3F] h-1.5 rounded-full cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#F2B6C2]/60 mb-1 block">Maximum age: {preferences.ageRange.max}</label>
                  <input
                    id="pref-age-max"
                    type="range"
                    min={preferences.ageRange.min + 1}
                    max={80}
                    value={preferences.ageRange.max}
                    onChange={e => setPreferences(p => ({ ...p, ageRange: { ...p.ageRange, max: Number(e.target.value) } }))}
                    className="w-full accent-[#8B1E3F] h-1.5 rounded-full cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className={LABEL_CLS}>
                Discovery radius: <span className="text-[#D4AF97] normal-case">{preferences.distanceKm} km</span>
              </label>
              <input
                id="pref-distance"
                type="range"
                min={1}
                max={500}
                value={preferences.distanceKm}
                onChange={e => setPreferences(p => ({ ...p, distanceKm: Number(e.target.value) }))}
                className="w-full accent-[#8B1E3F] h-1.5 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#F2B6C2]/40 mt-1">
                <span>1 km</span><span>500 km</span>
              </div>
              <p className="text-[10px] text-[#F2B6C2]/40 mt-1">
                Note: Distance-based discovery will be enabled in a future update.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ===================== Layout ===================== */
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 relative z-10 flex items-center justify-center">
      <div className="w-full max-w-lg mx-auto">

        {/* Progress header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          {/* Step pills */}
          <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={s.id} className="flex items-center gap-1.5">
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all duration-300"
                    style={{
                      background: done ? "rgba(212,175,151,0.2)" : active ? "rgba(139,30,63,0.45)" : "rgba(26,15,19,0.45)",
                      borderColor: done ? "rgba(212,175,151,0.4)" : active ? "rgba(242,182,194,0.5)" : "rgba(242,182,194,0.12)",
                      color: done ? "#D4AF97" : active ? "#F8EDEB" : "#F2B6C2",
                    }}
                  >
                    {done ? <CheckCircle size={11} /> : <s.icon size={11} />}
                    {s.label}
                  </div>
                  {i < STEPS.length - 1 && <div className="w-4 h-px" style={{ background: "rgba(242,182,194,0.2)" }} />}
                </div>
              );
            })}
          </div>

          {/* Global progress bar */}
          <div className="h-1 rounded-full" style={{ background: "rgba(242,182,194,0.12)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((step + 1) / STEPS.length) * 100}%`,
                background: "linear-gradient(90deg, #8B1E3F 0%, #D4AF97 100%)",
              }}
            />
          </div>
          <p className="text-center text-[10px] text-[#F2B6C2]/50 mt-2">Step {step + 1} of {STEPS.length}</p>
        </motion.div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="rounded-3xl p-8 backdrop-blur-2xl"
            style={CARD_STYLE}
          >
            {/* Step header */}
            <div className="mb-7">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #8B1E3F 0%, #3A0D1A 100%)",
                    border: "1px solid rgba(242,182,194,0.3)",
                  }}
                >
                  <currentStep.icon size={20} style={{ color: "#F2B6C2" }} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#D4AF97] font-semibold">
                    Step {step + 1} of {STEPS.length}
                  </p>
                  <h1 className="text-xl font-display font-semibold text-[#F8EDEB]">{currentStep.label}</h1>
                </div>
              </div>
            </div>

            {/* Step content */}
            {renderStep()}

            {/* API-level error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-5 flex items-start gap-2 p-3 rounded-xl text-sm border"
                  style={{
                    background: "rgba(139,30,63,0.2)",
                    borderColor: "rgba(242,182,194,0.2)",
                    color: "#FDE7E9",
                  }}
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#F2B6C2]" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div
              className="flex items-center justify-between mt-8 pt-6 border-t"
              style={{ borderColor: "rgba(242,182,194,0.1)" }}
            >
              <button
                id="onboard-back"
                type="button"
                onClick={handleBack}
                disabled={step === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#3A0D1A]/60"
                style={{
                  borderColor: "rgba(242,182,194,0.2)",
                  color: "#F2B6C2",
                  background: "rgba(26,15,19,0.4)",
                }}
              >
                <ChevronLeft size={17} /> Back
              </button>

              <button
                id="onboard-next"
                type="button"
                onClick={handleNext}
                disabled={saving || uploading}
                className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #8B1E3F 0%, #5C1228 100%)",
                  color: "#FDE7E9",
                  boxShadow: "0 8px 24px rgba(139,30,63,0.45)",
                }}
              >
                {saving ? (
                  <><Loader2 size={17} className="animate-spin" /> Saving...</>
                ) : isLastStep ? (
                  <><CheckCircle size={17} /> Complete Profile</>
                ) : (
                  <>Continue <ChevronRight size={17} /></>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
