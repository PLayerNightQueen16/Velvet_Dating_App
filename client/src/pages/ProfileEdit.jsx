import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  User, MapPin, Sparkles, Heart, Camera, Save, ArrowLeft, Star,
  Trash2, Plus, Upload, Loader2, CheckCircle, AlertCircle, X, Edit3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getProfile, updateProfile, uploadPhoto, deletePhoto, setPrimaryPhoto,
} from "../services/api";

/* ===================== Constants ===================== */
const MAX_PHOTOS = 5;
const MIN_PHOTOS = 3;
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

/* ===================== 18+ date cap helper ===================== */
function getMaxDobDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
}

/* ===================== Styles ===================== */
const INPUT_STYLE = {
  background: "rgba(26, 15, 19, 0.6)",
  border: "1px solid rgba(242, 182, 194, 0.2)",
  color: "#F8EDEB",
};
const INPUT_CLS = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-[#F2B6C2]/40 focus:border-[#F2B6C2]/60 focus:shadow-[0_0_0_3px_rgba(242,182,194,0.12)]";
const LABEL_CLS = "block text-xs uppercase tracking-wider text-[#D4AF97] font-semibold mb-2";
const SECTION_STYLE = {
  background: "rgba(58, 13, 26, 0.45)",
  border: "1px solid rgba(242, 182, 194, 0.15)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

/* ===================== Section wrapper ===================== */
function Section({ icon: Icon, title, children, badge }) {
  return (
    <div className="rounded-2xl p-6 backdrop-blur-xl" style={SECTION_STYLE}>
      <div className="flex items-center justify-between mb-5 pb-4 border-b" style={{ borderColor: "rgba(242,182,194,0.12)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8B1E3F 0%, #3A0D1A 100%)", border: "1px solid rgba(242,182,194,0.25)" }}
          >
            <Icon size={16} style={{ color: "#F2B6C2" }} />
          </div>
          <h2 className="font-display text-base font-semibold text-[#F8EDEB]">{title}</h2>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

/* ===================== Photo components ===================== */
function PhotoCard({ photo, isPrimary, onSetPrimary, onDelete }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="relative group aspect-[3/4] rounded-2xl overflow-hidden border"
      style={{ borderColor: isPrimary ? "rgba(212,175,151,0.7)" : "rgba(242,182,194,0.2)", background: "rgba(26,15,19,0.5)" }}
    >
      {!imgError ? (
        <img
          src={photo.url}
          alt="Profile"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
          <AlertCircle size={24} className="text-[#F2B6C2]/30" />
          <span className="text-[10px] text-[#F2B6C2]/40 text-center px-2">Image unavailable</span>
        </div>
      )}
      {isPrimary && (
        <div className="absolute top-2 left-2 bg-[#D4AF97] text-[#1A0F13] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Star size={9} /> Primary
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 gap-1.5">
        {!isPrimary && (
          <button
            type="button"
            onClick={() => onSetPrimary(photo._id || photo.id)}
            className="w-full text-[10px] font-semibold py-1.5 rounded-lg bg-[#D4AF97] text-[#1A0F13] flex items-center justify-center gap-1"
          >
            <Star size={10} /> Primary
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(photo._id || photo.id)}
          className="w-full text-[10px] font-semibold py-1.5 rounded-lg bg-[#8B1E3F]/80 text-[#FDE7E9] flex items-center justify-center gap-1"
        >
          <Trash2 size={10} /> Remove
        </button>
      </div>
    </div>
  );
}

function AddPhotoSlot({ onPickFile, uploading }) {
  return (
    <label
      htmlFor="photo-add-input"
      className="aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:bg-[#8B1E3F]/15"
      style={{ borderColor: "rgba(242,182,194,0.3)" }}
    >
      {uploading ? (
        <Loader2 size={24} className="text-[#F2B6C2] animate-spin" />
      ) : (
        <>
          <Plus size={28} className="text-[#F2B6C2]/50 mb-2" />
          <span className="text-[11px] text-[#F2B6C2]/50">Add Photo</span>
        </>
      )}
      <input
        id="photo-add-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={onPickFile}
        disabled={uploading}
      />
    </label>
  );
}

/* ===================== Main Page ===================== */
export default function ProfileEdit() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [completionStatus, setCompletionStatus] = useState(null);

  // Language input state
  const [langInput, setLangInput] = useState("");

  // Form state — initialized from fetched profile
  const [form, setForm] = useState({
    name: "",
    dateOfBirth: "",
    gender: "",
    bio: "",
    location: "",
    occupation: "",
    education: "",
    languages: [],
    interests: [],
    prompts: [{ prompt: "", answer: "" }],
    preferences: { interestedIn: [], ageRange: { min: 18, max: 45 }, distanceKm: 50 },
  });
  const [photos, setPhotos] = useState([]);

  /* Fetch profile on mount */
  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getProfile();
        if (data?.success && data?.profile) {
          const p = data.profile;
          setForm({
            name: p.name || "",
            dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "",
            gender: p.gender ? (p.gender.charAt(0).toUpperCase() + p.gender.slice(1)) : "",
            bio: p.bio || "",
            location: p.location || "",
            occupation: p.occupation || "",
            education: p.education || "",
            languages: p.languages || [],
            interests: p.interests || [],
            prompts: p.prompts?.length ? p.prompts : [{ prompt: "", answer: "" }],
            preferences: p.preferences
              ? {
                  interestedIn: p.preferences.interestedIn || [],
                  ageRange: { min: p.preferences.ageRange?.min ?? 18, max: p.preferences.ageRange?.max ?? 45 },
                  distanceKm: p.preferences.distanceKm ?? 50,
                }
              : { interestedIn: [], ageRange: { min: 18, max: 45 }, distanceKm: 50 },
          });
          setPhotos(p.photos || []);
          setCompletionStatus(p.profileCompleted);
        }
      } catch (err) {
        setError("Failed to load profile. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  /* Helpers */
  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const payload = {
        name: form.name.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender.toLowerCase(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        occupation: form.occupation.trim(),
        education: form.education.trim(),
        languages: form.languages,
        interests: form.interests,
        prompts: form.prompts.filter(p => p.prompt && p.answer.trim()),
        preferences: {
          interestedIn: form.preferences.interestedIn,
          ageRange: {
            min: form.preferences.ageRange.min,
            max: form.preferences.ageRange.max,
          },
          distanceKm: form.preferences.distanceKm,
        },
      };
      const result = await updateProfile(payload);
      if (result?.profile) {
        setCompletionStatus(result.profile.profileCompleted);
      }
      await checkAuth();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }
    setUploading(true);
    setError("");
    try {
      const res = await uploadPhoto(file);
      setPhotos(res.photos);
      if (res.profileCompleted !== undefined) setCompletionStatus(res.profileCompleted);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please check file format (JPEG, PNG, WebP).");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [photos.length]);

  const handleDeletePhoto = useCallback(async (photoId) => {
    setError("");
    try {
      const res = await deletePhoto(photoId);
      setPhotos(res.photos);
      if (res.profileCompleted !== undefined) setCompletionStatus(res.profileCompleted);
    } catch (err) {
      setError(err.response?.data?.message || "Remove failed.");
    }
  }, []);

  const handleSetPrimary = useCallback(async (photoId) => {
    setError("");
    try {
      const res = await setPrimaryPhoto(photoId);
      setPhotos(res.photos);
    } catch (err) {
      setError(err.response?.data?.message || "Could not set primary.");
    }
  }, []);

  const handleAddLanguage = () => {
    const trimmed = langInput.trim();
    if (trimmed && !form.languages.includes(trimmed) && form.languages.length < 10) {
      setField("languages", [...form.languages, trimmed]);
      setLangInput("");
    }
  };

  /* ===================== Loading state ===================== */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 relative z-10">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-[#F2B6C2] animate-spin" />
          <p className="text-[#F2B6C2]/60 text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  /* ===================== Layout ===================== */
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 relative z-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              id="back-to-app"
              type="button"
              onClick={() => navigate("/app")}
              className="p-2.5 rounded-xl border transition-all duration-200 hover:bg-[#3A0D1A]/60"
              style={{ borderColor: "rgba(242,182,194,0.2)", color: "#F2B6C2" }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#D4AF97] font-semibold flex items-center gap-1.5">
                <Edit3 size={10} /> Edit Profile
              </p>
              <h1 className="font-display text-2xl font-semibold text-[#F8EDEB]">Your VELVET Profile</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Completion badge */}
            {completionStatus !== null && (
              <span
                className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1"
                style={{
                  background: completionStatus ? "rgba(34,197,94,0.15)" : "rgba(139,30,63,0.2)",
                  color: completionStatus ? "#86efac" : "#F2B6C2",
                  border: `1px solid ${completionStatus ? "rgba(134,239,172,0.3)" : "rgba(242,182,194,0.2)"}`,
                }}
              >
                {completionStatus ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                {completionStatus ? "Complete" : "Incomplete"}
              </span>
            )}

            <button
              id="save-profile"
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
              style={{
                background: saved ? "rgba(74,222,128,0.2)" : "linear-gradient(135deg, #8B1E3F 0%, #5C1228 100%)",
                color: saved ? "#86efac" : "#FDE7E9",
                border: saved ? "1px solid rgba(134,239,172,0.4)" : "none",
                boxShadow: saved ? "none" : "0 8px 24px rgba(139,30,63,0.45)",
              }}
            >
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                : saved ? <><CheckCircle size={16} /> Saved!</>
                : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </motion.div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 flex items-start gap-2.5 p-4 rounded-xl border text-sm"
              style={{ background: "rgba(139,30,63,0.2)", borderColor: "rgba(242,182,194,0.25)", color: "#FDE7E9" }}
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#F2B6C2]" />
              <span className="flex-1">{error}</span>
              <button type="button" onClick={() => setError("")}>
                <X size={15} className="text-[#F2B6C2]/60 hover:text-[#F2B6C2]" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6">

          {/* === Photos === */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Section
              icon={Camera}
              title="Photos"
              badge={
                <span className="text-xs font-semibold text-[#D4AF97]">{photos.length}/{MAX_PHOTOS}</span>
              }
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#F2B6C2]/60">
                  {photos.length < MIN_PHOTOS ? (
                    <span className="text-[#F2B6C2]">⚠ {MIN_PHOTOS - photos.length} more photo{MIN_PHOTOS - photos.length !== 1 ? "s" : ""} required for completion</span>
                  ) : (
                    <span className="text-green-400/80">✓ Minimum {MIN_PHOTOS} photos met</span>
                  )}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {photos.map((photo) => (
                  <PhotoCard
                    key={photo._id || photo.id}
                    photo={photo}
                    isPrimary={photo.isPrimary}
                    onSetPrimary={handleSetPrimary}
                    onDelete={handleDeletePhoto}
                  />
                ))}
                {photos.length < MAX_PHOTOS && (
                  <AddPhotoSlot onPickFile={handleFileUpload} uploading={uploading} />
                )}
              </div>
              <div className="flex items-start gap-2 text-xs text-[#F2B6C2]/50">
                <Upload size={12} className="shrink-0 mt-0.5 text-[#D4AF97]" />
                Photos are uploaded to Cloudinary (JPEG, PNG, WebP, max 10MB). Hover any photo to set as primary or remove.
                Minimum {MIN_PHOTOS} required, maximum {MAX_PHOTOS}.
              </div>
            </Section>
          </motion.div>

          {/* === Basics === */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Section icon={User} title="Basic Info">
              <div className="space-y-4">
                <div>
                  <label className={LABEL_CLS}>Full Name</label>
                  <input
                    id="edit-name"
                    className={INPUT_CLS}
                    style={INPUT_STYLE}
                    value={form.name}
                    onChange={e => setField("name", e.target.value)}
                    placeholder="Your display name"
                    maxLength={50}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLS}>Date of Birth <span className="normal-case text-[#F2B6C2]/50">(18+)</span></label>
                    <input
                      id="edit-dob"
                      type="date"
                      className={INPUT_CLS}
                      style={{ ...INPUT_STYLE, colorScheme: "dark" }}
                      value={form.dateOfBirth}
                      max={getMaxDobDate()}
                      onChange={e => setField("dateOfBirth", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>I identify as</label>
                    <select
                      id="edit-gender"
                      className={INPUT_CLS}
                      style={{ ...INPUT_STYLE, appearance: "none" }}
                      value={form.gender}
                      onChange={e => setField("gender", e.target.value)}
                    >
                      <option value="">Select...</option>
                      {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLS}><MapPin size={11} className="inline mr-1" />Location</label>
                  <input
                    id="edit-location"
                    className={INPUT_CLS}
                    style={INPUT_STYLE}
                    value={form.location}
                    onChange={e => setField("location", e.target.value)}
                    placeholder="City, Country"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLS}>Occupation</label>
                    <input
                      id="edit-occupation"
                      className={INPUT_CLS}
                      style={INPUT_STYLE}
                      value={form.occupation}
                      onChange={e => setField("occupation", e.target.value)}
                      placeholder="What you do"
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Education</label>
                    <input
                      id="edit-education"
                      className={INPUT_CLS}
                      style={INPUT_STYLE}
                      value={form.education}
                      onChange={e => setField("education", e.target.value)}
                      placeholder="e.g. B.Sc. Design"
                    />
                  </div>
                </div>
              </div>
            </Section>
          </motion.div>

          {/* === About === */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Section icon={Sparkles} title="About You">
              <div className="space-y-4">
                <div>
                  <label className={LABEL_CLS}>
                    Bio <span className="text-[#F2B6C2]/50 normal-case">({form.bio.length}/500)</span>
                  </label>
                  <textarea
                    id="edit-bio"
                    className={INPUT_CLS}
                    style={{ ...INPUT_STYLE, resize: "none" }}
                    rows={4}
                    value={form.bio}
                    onChange={e => setField("bio", e.target.value)}
                    placeholder="Tell potential matches what makes you, you..."
                    maxLength={500}
                  />
                </div>
                {/* Languages */}
                <div>
                  <label className={LABEL_CLS}>Languages</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      id="edit-lang-input"
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
                      className="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 shrink-0"
                      style={{ background: "rgba(139,30,63,0.5)", color: "#FDE7E9", border: "1px solid rgba(242,182,194,0.25)" }}
                    >
                      Add
                    </button>
                  </div>
                  {form.languages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.languages.map(lang => (
                        <span
                          key={lang}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{ background: "rgba(139,30,63,0.35)", border: "1px solid rgba(242,182,194,0.3)", color: "#FDE7E9" }}
                        >
                          {lang}
                          <button
                            type="button"
                            onClick={() => setField("languages", form.languages.filter(l => l !== lang))}
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
            </Section>
          </motion.div>

          {/* === Interests === */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Section
              icon={Heart}
              title="Interests"
              badge={
                <span className="text-xs text-[#D4AF97] font-semibold">{form.interests.length}/{MAX_INTERESTS}</span>
              }
            >
              <div
                className="space-y-4 max-h-72 overflow-y-auto pr-1"
                style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(242,182,194,0.2) transparent" }}
              >
                {INTEREST_CATEGORIES.map(cat => (
                  <div key={cat.label}>
                    <p className="text-[10px] uppercase tracking-widest text-[#D4AF97] font-semibold mb-2">{cat.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.items.map(interest => {
                        const selected = form.interests.includes(interest);
                        return (
                          <button
                            key={interest}
                            id={`edit-interest-${interest.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
                            type="button"
                            onClick={() => {
                              if (selected) setField("interests", form.interests.filter(i => i !== interest));
                              else if (form.interests.length < MAX_INTERESTS) setField("interests", [...form.interests, interest]);
                            }}
                            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200"
                            style={{
                              background: selected ? "rgba(139,30,63,0.55)" : "rgba(26,15,19,0.45)",
                              borderColor: selected ? "rgba(242,182,194,0.6)" : "rgba(242,182,194,0.15)",
                              color: selected ? "#FDE7E9" : "#F2B6C2",
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
            </Section>
          </motion.div>

          {/* === Prompts === */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Section icon={Sparkles} title="Prompts">
              <div className="space-y-4">
                {form.prompts.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border space-y-3"
                    style={{ background: "rgba(26,15,19,0.45)", borderColor: "rgba(242,182,194,0.12)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-[#D4AF97] font-semibold">Prompt {idx + 1}</span>
                      {form.prompts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setField("prompts", form.prompts.filter((_, i) => i !== idx))}
                          className="text-[#F2B6C2]/50 hover:text-[#F2B6C2] transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <select
                      id={`edit-prompt-q-${idx}`}
                      className={INPUT_CLS}
                      style={{ ...INPUT_STYLE, appearance: "none" }}
                      value={p.prompt}
                      onChange={e => setField("prompts", form.prompts.map((item, i) => i === idx ? { ...item, prompt: e.target.value } : item))}
                    >
                      <option value="">Choose a prompt...</option>
                      {CURATED_PROMPTS.filter(q => q === p.prompt || !form.prompts.some(x => x.prompt === q)).map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                    <div>
                      <textarea
                        id={`edit-prompt-a-${idx}`}
                        className={INPUT_CLS}
                        style={{ ...INPUT_STYLE, resize: "none" }}
                        rows={2}
                        value={p.answer}
                        maxLength={300}
                        onChange={e => setField("prompts", form.prompts.map((item, i) => i === idx ? { ...item, answer: e.target.value } : item))}
                        placeholder="Your answer..."
                      />
                      <p className="text-[10px] text-[#F2B6C2]/40 text-right mt-1">{p.answer.length}/300</p>
                    </div>
                  </div>
                ))}
                {form.prompts.length < 3 && (
                  <button
                    type="button"
                    onClick={() => setField("prompts", [...form.prompts, { prompt: "", answer: "" }])}
                    className="w-full py-2.5 rounded-xl border border-dashed text-xs text-[#F2B6C2]/60 hover:text-[#F2B6C2] flex items-center justify-center gap-2 transition-all duration-200"
                    style={{ borderColor: "rgba(242,182,194,0.2)" }}
                  >
                    <Plus size={14} /> Add Prompt
                  </button>
                )}
              </div>
            </Section>
          </motion.div>

          {/* === Preferences === */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Section icon={Heart} title="Preferences">
              <div className="space-y-6">
                <div>
                  <label className={LABEL_CLS}>Interested in</label>
                  <div className="grid grid-cols-2 gap-3">
                    {INTERESTED_IN_OPTIONS.map(opt => {
                      const val = opt.toLowerCase();
                      const selected = form.preferences.interestedIn.includes(val);
                      return (
                        <button
                          key={opt}
                          id={`edit-interested-${val}`}
                          type="button"
                          onClick={() => setField("preferences", {
                            ...form.preferences,
                            interestedIn: selected
                              ? form.preferences.interestedIn.filter(x => x !== val)
                              : [...form.preferences.interestedIn, val],
                          })}
                          className="py-2.5 px-4 rounded-xl text-sm font-medium border transition-all duration-200"
                          style={{
                            background: selected ? "rgba(139,30,63,0.5)" : "rgba(26,15,19,0.5)",
                            borderColor: selected ? "rgba(242,182,194,0.6)" : "rgba(242,182,194,0.15)",
                            color: selected ? "#F8EDEB" : "#F2B6C2",
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLS}>
                    Age range: <span className="text-[#D4AF97] normal-case">{form.preferences.ageRange.min}–{form.preferences.ageRange.max}</span>
                  </label>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-[#F2B6C2]/60 block mb-1">Min: {form.preferences.ageRange.min}</label>
                      <input
                        id="edit-age-min"
                        type="range"
                        min={18}
                        max={form.preferences.ageRange.max - 1}
                        value={form.preferences.ageRange.min}
                        onChange={e => setField("preferences", {
                          ...form.preferences,
                          ageRange: { ...form.preferences.ageRange, min: Number(e.target.value) },
                        })}
                        className="w-full accent-[#8B1E3F] h-1.5 rounded-full cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#F2B6C2]/60 block mb-1">Max: {form.preferences.ageRange.max}</label>
                      <input
                        id="edit-age-max"
                        type="range"
                        min={form.preferences.ageRange.min + 1}
                        max={80}
                        value={form.preferences.ageRange.max}
                        onChange={e => setField("preferences", {
                          ...form.preferences,
                          ageRange: { ...form.preferences.ageRange, max: Number(e.target.value) },
                        })}
                        className="w-full accent-[#8B1E3F] h-1.5 rounded-full cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLS}>
                    Discovery radius: <span className="text-[#D4AF97] normal-case">{form.preferences.distanceKm} km</span>
                  </label>
                  <input
                    id="edit-distance"
                    type="range"
                    min={1}
                    max={500}
                    value={form.preferences.distanceKm}
                    onChange={e => setField("preferences", { ...form.preferences, distanceKm: Number(e.target.value) })}
                    className="w-full accent-[#8B1E3F] h-1.5 rounded-full cursor-pointer"
                  />
                  <p className="text-[10px] text-[#F2B6C2]/40 mt-1">
                    Note: Distance-based discovery will be enabled in a future update.
                  </p>
                </div>
              </div>
            </Section>
          </motion.div>

          {/* Bottom Save */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="flex justify-end pt-2">
            <button
              id="save-profile-bottom"
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
              style={{
                background: saved ? "rgba(74,222,128,0.2)" : "linear-gradient(135deg, #8B1E3F 0%, #5C1228 100%)",
                color: saved ? "#86efac" : "#FDE7E9",
                border: saved ? "1px solid rgba(134,239,172,0.4)" : "none",
                boxShadow: saved ? "none" : "0 8px 24px rgba(139,30,63,0.45)",
              }}
            >
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                : saved ? <><CheckCircle size={16} /> All Saved!</>
                : <><Save size={16} /> Save All Changes</>}
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
