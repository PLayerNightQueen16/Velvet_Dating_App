import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  User, MapPin, Sparkles, Heart, Camera, Save, ArrowLeft, Star,
  Trash2, Plus, Upload, Loader2, CheckCircle, AlertCircle, X, Edit3,
  Link2, Image as ImageIcon, ChevronDown, Briefcase, GraduationCap,
  Languages as LangIcon, Compass, Palette, Coffee, Music, Dumbbell,
  BookOpen, Gamepad2, Film, Check
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getProfile, updateProfile, uploadPhoto, addPhotoUrl, deletePhoto, setPrimaryPhoto,
} from "../services/api";

/* ===================== Constants ===================== */
const MAX_PHOTOS = 5;
const MIN_PHOTOS = 3;
const MAX_INTERESTS = 10;

// Curated high-res aesthetic portraits for 1-click fallback additions
const CURATED_PORTRAITS = [
  { label: "Classic Velvet", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80" },
  { label: "Golden Hour", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80" },
  { label: "Sunset Glow", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80" },
  { label: "Noir Elegance", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80" },
];

const INTEREST_CATEGORIES = [
  {
    label: "Arts & Culture",
    icon: Palette,
    items: ["Contemporary Art", "Museums & Galleries", "Poetry", "Architecture", "Photography", "Theatre & Broadway"],
  },
  {
    label: "Food & Coffee",
    icon: Coffee,
    items: ["Artisanal Coffee", "Fine Dining", "Wine Tasting", "Baking", "Street Food", "Mixology", "Matcha & Tea"],
  },
  {
    label: "Music",
    icon: Music,
    items: ["Jazz & Blues", "Indie Rock", "Classical Music", "Vinyl Records", "Live Concerts", "Lo-Fi", "Electronic & Techno"],
  },
  {
    label: "Travel & Adventure",
    icon: Compass,
    items: ["Road Trips", "Solo Backpacking", "Stargazing", "Boutique Hotels", "Cultural Tours", "Mountain Trekking", "Beach Sunsets"],
  },
  {
    label: "Fitness & Outdoors",
    icon: Dumbbell,
    items: ["Pilates & Yoga", "Rock Climbing", "Running", "Hiking", "Tennis", "Weightlifting"],
  },
  {
    label: "Books & Learning",
    icon: BookOpen,
    items: ["Classic Literature", "Philosophy", "Psychology", "History", "Astronomy", "Book Clubs"],
  },
  {
    label: "Gaming & Technology",
    icon: Gamepad2,
    items: ["Cozy Games", "Sci-Fi", "Board Games", "Virtual Reality", "Coding & Tech"],
  },
  {
    label: "Film & Television",
    icon: Film,
    items: ["Arthouse Cinema", "Documentaries", "French New Wave", "Cinema Classics", "Anime"],
  },
  {
    label: "Lifestyle",
    icon: Sparkles,
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

function getMaxDobDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
}

/* ===================== Design Tokens ===================== */
const INPUT_STYLE = {
  background: "rgba(26, 15, 19, 0.65)",
  border: "1px solid rgba(242, 182, 194, 0.18)",
  color: "#F8EDEB",
};

const INPUT_CLS = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-[#F2B6C2]/35 focus:border-[#F2B6C2]/60 focus:ring-2 focus:ring-[#F2B6C2]/15";
const LABEL_CLS = "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#D4AF97] mb-2";
const SECTION_STYLE = {
  background: "rgba(35, 12, 20, 0.55)",
  border: "1px solid rgba(242, 182, 194, 0.15)",
  boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
};

/* ===================== Reusable Section Card ===================== */
function Section({ icon: Icon, title, children, badge, subtitle }) {
  return (
    <div className="rounded-2xl p-6 md:p-7 backdrop-blur-xl transition-all duration-300" style={SECTION_STYLE}>
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#F2B6C2]/12">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
            style={{
              background: "linear-gradient(135deg, rgba(139,30,63,0.6) 0%, rgba(58,13,26,0.85) 100%)",
              border: "1px solid rgba(242,182,194,0.25)",
            }}
          >
            <Icon size={17} className="text-[#F2B6C2]" />
          </div>
          <div>
            <h2 className="font-display text-base md:text-lg font-semibold tracking-wide text-[#F8EDEB]">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-[#F2B6C2]/50 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

/* ===================== Photo Card ===================== */
function PhotoCard({ photo, isPrimary, onSetPrimary, onDelete }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="relative group aspect-[3/4] rounded-2xl overflow-hidden border transition-all duration-200 shadow-md"
      style={{
        borderColor: isPrimary ? "rgba(212,175,151,0.8)" : "rgba(242,182,194,0.2)",
        background: "rgba(26,15,19,0.7)",
      }}
    >
      {!imgError ? (
        <img
          src={photo.url}
          alt="Profile photo"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
          <AlertCircle size={22} className="text-[#F2B6C2]/40" />
          <span className="text-[10px] text-[#F2B6C2]/50">Image unavailable</span>
        </div>
      )}

      {/* Primary Badge */}
      {isPrimary && (
        <div className="absolute top-2.5 left-2.5 bg-[#D4AF97] text-[#1A0F13] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
          <Star size={10} className="fill-[#1A0F13]" /> Primary
        </div>
      )}

      {/* Hover action overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5 gap-1.5">
        {!isPrimary && (
          <button
            type="button"
            onClick={() => onSetPrimary(photo._id || photo.id)}
            className="w-full text-[11px] font-semibold py-1.5 rounded-lg bg-[#D4AF97] text-[#1A0F13] flex items-center justify-center gap-1.5 hover:bg-[#e2c1a9] transition-colors shadow-sm"
          >
            <Star size={11} /> Make Primary
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(photo._id || photo.id)}
          className="w-full text-[11px] font-semibold py-1.5 rounded-lg bg-[#8B1E3F]/90 text-[#FDE7E9] flex items-center justify-center gap-1.5 hover:bg-[#a3244a] transition-colors shadow-sm"
        >
          <Trash2 size={11} /> Remove
        </button>
      </div>
    </div>
  );
}

/* ===================== Main ProfileEdit Page ===================== */
export default function ProfileEdit() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [completionStatus, setCompletionStatus] = useState(null);

  // Photo tab state: "upload" | "url"
  const [photoMode, setPhotoMode] = useState("upload");
  const [customPhotoUrl, setCustomPhotoUrl] = useState("");
  const [addingUrl, setAddingUrl] = useState(false);

  // Language input state
  const [langInput, setLangInput] = useState("");

  // Form state
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

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  /* Save profile changes */
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

  /* File upload via Cloudinary */
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
      const msg = err.response?.data?.message || err.message || "";
      if (msg.includes("403") || msg.includes("Cloudinary")) {
        setError(
          "Cloudinary upload rejected (403): The configured API key lacks upload permissions. You can easily add photos right now using the 'Add via URL' tab below!"
        );
        setPhotoMode("url");
      } else {
        setError(msg || "Upload failed. Please check file format (JPEG, PNG, WebP).");
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [photos.length]);

  /* Direct HTTPS URL Photo Addition */
  const handleAddPhotoByUrl = async (urlToAdd) => {
    const targetUrl = (urlToAdd || customPhotoUrl).trim();
    if (!targetUrl) return;

    if (!targetUrl.startsWith("https://")) {
      setError("Photo URL must begin with secure 'https://'.");
      return;
    }

    if (photos.length >= MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }

    setAddingUrl(true);
    setError("");
    try {
      const res = await addPhotoUrl(targetUrl);
      setPhotos(res.photos);
      if (res.profileCompleted !== undefined) setCompletionStatus(res.profileCompleted);
      setCustomPhotoUrl("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add photo URL. Please ensure it is a direct image link.");
    } finally {
      setAddingUrl(false);
    }
  };

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

  /* Loading State */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="text-[#F2B6C2] animate-spin" />
          <p className="text-[#F2B6C2]/60 text-sm font-medium">Loading your profile sanctuary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 relative z-10">
      <div className="max-w-2xl mx-auto">

        {/* ===================== Header Bar ===================== */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3.5">
            <button
              id="back-to-app"
              type="button"
              onClick={() => navigate("/app")}
              className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 hover:bg-[#3A0D1A]/70 text-[#F2B6C2] hover:text-[#F8EDEB] border-[#F2B6C2]/20 hover:border-[#F2B6C2]/40"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[#D4AF97] font-semibold flex items-center gap-1.5">
                <Edit3 size={11} className="text-[#F2B6C2]" /> Profile Sanctuary
              </p>
              <h1 className="font-display text-2xl md:text-3xl font-semibold text-[#F8EDEB] tracking-tight">
                Your VELVET Profile
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            {/* Completion status pill */}
            {completionStatus !== null && (
              <span
                className="h-10 px-3.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide border shadow-sm"
                style={{
                  background: completionStatus ? "rgba(34,197,94,0.15)" : "rgba(139,30,63,0.3)",
                  color: completionStatus ? "#86efac" : "#F2B6C2",
                  borderColor: completionStatus ? "rgba(134,239,172,0.3)" : "rgba(242,182,194,0.25)",
                }}
              >
                {completionStatus ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                <span>{completionStatus ? "Complete" : "Incomplete"}</span>
              </span>
            )}

            {/* Save Button */}
            <button
              id="save-profile"
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-5 rounded-full inline-flex items-center gap-2 text-xs md:text-sm font-semibold transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
              style={{
                background: saved ? "rgba(74,222,128,0.25)" : "linear-gradient(135deg, #8B1E3F 0%, #5C1228 100%)",
                color: saved ? "#86efac" : "#FDE7E9",
                border: saved ? "1px solid rgba(134,239,172,0.4)" : "1px solid rgba(242,182,194,0.3)",
                boxShadow: saved ? "none" : "0 6px 20px rgba(139,30,63,0.4)",
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saved ? (
                <>
                  <CheckCircle size={15} />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* ===================== Error Banner ===================== */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-xl border text-sm flex items-start gap-3 backdrop-blur-md shadow-lg"
              style={{
                background: "rgba(139,30,63,0.28)",
                borderColor: "rgba(242,182,194,0.3)",
                color: "#FDE7E9",
              }}
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-[#F2B6C2]" />
              <div className="flex-1 text-xs md:text-sm leading-relaxed">{error}</div>
              <button
                type="button"
                onClick={() => setError("")}
                className="p-1 rounded-lg text-[#F2B6C2]/60 hover:text-[#F2B6C2] hover:bg-[#3A0D1A]/50 transition-colors"
                aria-label="Dismiss message"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-7">

          {/* ===================== Section: Photos ===================== */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Section
              icon={Camera}
              title="Profile Photos"
              subtitle="Photos bring your presence to life. Minimum 3 required, up to 5."
              badge={
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1A0F13]/70 text-[#D4AF97] border border-[#F2B6C2]/20">
                  {photos.length} / {MAX_PHOTOS}
                </span>
              }
            >
              {/* Status Notice */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-[#1A0F13]/60 border border-[#F2B6C2]/15 mb-5">
                <div className="flex items-center gap-2 text-xs">
                  {photos.length < MIN_PHOTOS ? (
                    <>
                      <AlertCircle size={15} className="text-[#F2B6C2] shrink-0" />
                      <span className="text-[#F2B6C2] font-medium">
                        {MIN_PHOTOS - photos.length} more photo{MIN_PHOTOS - photos.length !== 1 ? "s" : ""} required to unlock Discovery
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                      <span className="text-emerald-400 font-medium">
                        Photo requirements satisfied ({photos.length} photos active)
                      </span>
                    </>
                  )}
                </div>
                <div className="text-[11px] text-[#F2B6C2]/60">
                  {photos.length > 0 ? "Hover photo to set primary or delete" : "Add your first photo"}
                </div>
              </div>

              {/* Photos Grid: Balanced 5-slot layout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-5">
                {/* Render active photos */}
                {photos.map((photo) => (
                  <PhotoCard
                    key={photo._id || photo.id}
                    photo={photo}
                    isPrimary={photo.isPrimary}
                    onSetPrimary={handleSetPrimary}
                    onDelete={handleDeletePhoto}
                  />
                ))}

                {/* Next available slot: interactive add button */}
                {photos.length < MAX_PHOTOS && (
                  <label
                    htmlFor="photo-add-file-input"
                    className="aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all duration-200 hover:bg-[#8B1E3F]/20 group"
                    style={{ borderColor: "rgba(242,182,194,0.35)", background: "rgba(26,15,19,0.4)" }}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <Loader2 size={24} className="text-[#F2B6C2] animate-spin" />
                        <span className="text-[10px] text-[#F2B6C2]/70 font-medium">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#8B1E3F]/30 text-[#F2B6C2] group-hover:scale-110 transition-transform mb-2">
                          <Plus size={20} />
                        </div>
                        <span className="text-xs font-semibold text-[#F8EDEB]">Add Photo</span>
                        <span className="text-[10px] text-[#F2B6C2]/50 mt-0.5">Slot {photos.length + 1}</span>
                      </>
                    )}
                    <input
                      id="photo-add-file-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                )}

                {/* Remaining empty placeholder slots up to 5 */}
                {Array.from({ length: Math.max(0, MAX_PHOTOS - photos.length - 1) }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="aspect-[3/4] rounded-2xl border border-dashed flex flex-col items-center justify-center p-3 text-center opacity-40 select-none"
                    style={{ borderColor: "rgba(242,182,194,0.15)", background: "rgba(26,15,19,0.2)" }}
                  >
                    <ImageIcon size={18} className="text-[#F2B6C2]/30 mb-1" />
                    <span className="text-[10px] text-[#F2B6C2]/40">Slot {photos.length + 2 + idx}</span>
                  </div>
                ))}
              </div>

              {/* Photo Input Mode Selector */}
              <div className="p-4 rounded-xl bg-[#1A0F13]/50 border border-[#F2B6C2]/15 space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#F2B6C2]/10 pb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#D4AF97] flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#F2B6C2]" /> Photo Input Options
                  </span>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#2A0E18] border border-[#F2B6C2]/20 text-xs">
                    <button
                      type="button"
                      onClick={() => setPhotoMode("upload")}
                      className={`px-3 py-1 rounded-md font-medium transition-all ${
                        photoMode === "upload"
                          ? "bg-[#8B1E3F] text-[#FDE7E9] shadow-sm"
                          : "text-[#F2B6C2]/60 hover:text-[#F8EDEB]"
                      }`}
                    >
                      File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoMode("url")}
                      className={`px-3 py-1 rounded-md font-medium transition-all ${
                        photoMode === "url"
                          ? "bg-[#8B1E3F] text-[#FDE7E9] shadow-sm"
                          : "text-[#F2B6C2]/60 hover:text-[#F8EDEB]"
                      }`}
                    >
                      Add via URL
                    </button>
                  </div>
                </div>

                {photoMode === "upload" ? (
                  <div className="flex items-start gap-2.5 text-xs text-[#F2B6C2]/70 leading-relaxed">
                    <Upload size={14} className="text-[#D4AF97] shrink-0 mt-0.5" />
                    <div>
                      Upload high-resolution files (JPEG, PNG, WebP, HEIC up to 10MB). Photos are automatically centered and cropped to portrait aspect ratio.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F2B6C2]/50" />
                        <input
                          type="url"
                          placeholder="Paste secure image URL (e.g. https://...)"
                          value={customPhotoUrl}
                          onChange={(e) => setCustomPhotoUrl(e.target.value)}
                          className={`${INPUT_CLS} pl-9`}
                          style={INPUT_STYLE}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddPhotoByUrl()}
                        disabled={addingUrl || !customPhotoUrl.trim() || photos.length >= MAX_PHOTOS}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 bg-[#8B1E3F] hover:bg-[#a3244a] text-[#FDE7E9] shrink-0 border border-[#F2B6C2]/30"
                      >
                        {addingUrl ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
                        <span>Add Photo</span>
                      </button>
                    </div>

                    {/* Quick Curated Portraits Palette */}
                    <div>
                      <p className="text-[11px] text-[#D4AF97] font-semibold uppercase tracking-wider mb-2">
                        Quick Add Velvet Portraits (1-Click Presets)
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CURATED_PORTRAITS.map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            disabled={addingUrl || photos.length >= MAX_PHOTOS}
                            onClick={() => handleAddPhotoByUrl(p.url)}
                            className="p-2 rounded-xl border border-[#F2B6C2]/20 bg-[#1A0F13]/70 hover:bg-[#8B1E3F]/30 hover:border-[#F2B6C2]/40 text-left transition-all group flex items-center gap-2"
                          >
                            <img src={p.url} alt={p.label} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-[#F2B6C2]/20" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium text-[#F8EDEB] truncate group-hover:text-[#F2B6C2]">{p.label}</p>
                              <p className="text-[9px] text-[#F2B6C2]/50">+ Add preset</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Section>
          </motion.div>

          {/* ===================== Section: Basic Info ===================== */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Section icon={User} title="Basic Information" subtitle="Your core identity and presentation.">
              <div className="space-y-5">
                <div>
                  <label htmlFor="edit-name" className={LABEL_CLS}>
                    <User size={13} className="text-[#F2B6C2]" /> Full Name
                  </label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-dob" className={LABEL_CLS}>
                      <Sparkles size={13} className="text-[#F2B6C2]" /> Date of Birth <span className="normal-case text-[#F2B6C2]/50 font-normal">(18+)</span>
                    </label>
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
                    <label htmlFor="edit-gender" className={LABEL_CLS}>
                      <Heart size={13} className="text-[#F2B6C2]" /> I Identify As
                    </label>
                    <div className="relative">
                      <select
                        id="edit-gender"
                        className={`${INPUT_CLS} appearance-none pr-10`}
                        style={INPUT_STYLE}
                        value={form.gender}
                        onChange={e => setField("gender", e.target.value)}
                      >
                        <option value="" className="bg-[#1A0F13] text-[#F8EDEB]">Select gender identity...</option>
                        {GENDERS.map(g => (
                          <option key={g} value={g} className="bg-[#1A0F13] text-[#F8EDEB]">{g}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#F2B6C2]/50 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-location" className={LABEL_CLS}>
                    <MapPin size={13} className="text-[#F2B6C2]" /> Location
                  </label>
                  <input
                    id="edit-location"
                    className={INPUT_CLS}
                    style={INPUT_STYLE}
                    value={form.location}
                    onChange={e => setField("location", e.target.value)}
                    placeholder="e.g. Paris, France or New York, NY"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-occupation" className={LABEL_CLS}>
                      <Briefcase size={13} className="text-[#F2B6C2]" /> Occupation
                    </label>
                    <input
                      id="edit-occupation"
                      className={INPUT_CLS}
                      style={INPUT_STYLE}
                      value={form.occupation}
                      onChange={e => setField("occupation", e.target.value)}
                      placeholder="e.g. Architect, Writer, Creative Director"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-education" className={LABEL_CLS}>
                      <GraduationCap size={13} className="text-[#F2B6C2]" /> Education
                    </label>
                    <input
                      id="edit-education"
                      className={INPUT_CLS}
                      style={INPUT_STYLE}
                      value={form.education}
                      onChange={e => setField("education", e.target.value)}
                      placeholder="e.g. Master of Fine Arts"
                    />
                  </div>
                </div>
              </div>
            </Section>
          </motion.div>

          {/* ===================== Section: About You ===================== */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Section icon={Sparkles} title="About You" subtitle="Bio and conversational languages.">
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="edit-bio" className={`${LABEL_CLS} mb-0`}>
                      <Sparkles size={13} className="text-[#F2B6C2]" /> Bio
                    </label>
                    <span className="text-[11px] font-medium text-[#F2B6C2]/50">
                      {form.bio.length} / 500
                    </span>
                  </div>
                  <textarea
                    id="edit-bio"
                    className={INPUT_CLS}
                    style={{ ...INPUT_STYLE, resize: "none" }}
                    rows={4}
                    value={form.bio}
                    onChange={e => setField("bio", e.target.value)}
                    placeholder="Tell potential matches about your passions, quirks, and what turns your world crimson..."
                    maxLength={500}
                  />
                </div>

                {/* Languages */}
                <div>
                  <label htmlFor="edit-lang-input" className={LABEL_CLS}>
                    <LangIcon size={13} className="text-[#F2B6C2]" /> Languages Spoken
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      id="edit-lang-input"
                      className={INPUT_CLS}
                      style={INPUT_STYLE}
                      placeholder="e.g. French, Japanese, Spanish..."
                      value={langInput}
                      onChange={e => setLangInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddLanguage())}
                      maxLength={40}
                    />
                    <button
                      type="button"
                      onClick={handleAddLanguage}
                      className="px-5 py-3 rounded-xl text-xs font-semibold transition-all shrink-0 bg-[#8B1E3F]/70 hover:bg-[#8B1E3F] text-[#FDE7E9] border border-[#F2B6C2]/25"
                    >
                      Add
                    </button>
                  </div>
                  {form.languages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.languages.map(lang => (
                        <span
                          key={lang}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#8B1E3F]/30 border border-[#F2B6C2]/30 text-[#FDE7E9]"
                        >
                          <span>{lang}</span>
                          <button
                            type="button"
                            onClick={() => setField("languages", form.languages.filter(l => l !== lang))}
                            className="text-[#F2B6C2]/60 hover:text-[#F8EDEB] transition-colors"
                            aria-label={`Remove ${lang}`}
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

          {/* ===================== Section: Interests ===================== */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Section
              icon={Heart}
              title="Passions & Interests"
              subtitle="Select up to 10 passions to calculate lifestyle compatibility."
              badge={
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1A0F13]/70 text-[#D4AF97] border border-[#F2B6C2]/20">
                  {form.interests.length} / {MAX_INTERESTS}
                </span>
              }
            >
              <div
                className="space-y-5 max-h-80 overflow-y-auto pr-1.5"
                style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(242,182,194,0.25) transparent" }}
              >
                {INTEREST_CATEGORIES.map(cat => {
                  const CatIcon = cat.icon;
                  return (
                    <div key={cat.label} className="p-3.5 rounded-xl bg-[#1A0F13]/40 border border-[#F2B6C2]/10">
                      <p className="text-[11px] uppercase tracking-wider text-[#D4AF97] font-semibold flex items-center gap-1.5 mb-2.5">
                        <CatIcon size={12} className="text-[#F2B6C2]" /> {cat.label}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cat.items.map(interest => {
                          const selected = form.interests.includes(interest);
                          return (
                            <button
                              key={interest}
                              id={`edit-interest-${interest.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
                              type="button"
                              onClick={() => {
                                if (selected) {
                                  setField("interests", form.interests.filter(i => i !== interest));
                                } else if (form.interests.length < MAX_INTERESTS) {
                                  setField("interests", [...form.interests, interest]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 ${
                                selected
                                  ? "bg-[#8B1E3F]/80 border-[#F2B6C2]/60 text-[#FDE7E9] shadow-sm shadow-[#8B1E3F]/30"
                                  : "bg-[#1A0F13]/60 border-[#F2B6C2]/15 text-[#F2B6C2]/80 hover:border-[#F2B6C2]/35 hover:text-[#F8EDEB]"
                              }`}
                            >
                              {selected && <Check size={11} className="text-[#FDE7E9]" />}
                              <span>{interest}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          </motion.div>

          {/* ===================== Section: Prompts ===================== */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Section
              icon={Sparkles}
              title="Curated Conversation Prompts"
              subtitle="Showcase your wit, opinions, and romantic philosophy."
              badge={
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1A0F13]/70 text-[#D4AF97] border border-[#F2B6C2]/20">
                  {form.prompts.length} / 3
                </span>
              }
            >
              <div className="space-y-4">
                {form.prompts.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-[#F2B6C2]/15 space-y-3 shadow-inner"
                    style={{ background: "rgba(26,15,19,0.55)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-[#D4AF97] font-semibold flex items-center gap-1.5">
                        <Sparkles size={11} className="text-[#F2B6C2]" /> Prompt {idx + 1}
                      </span>
                      {form.prompts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setField("prompts", form.prompts.filter((_, i) => i !== idx))}
                          className="text-[#F2B6C2]/60 hover:text-[#F8EDEB] transition-colors p-1"
                          aria-label={`Remove prompt ${idx + 1}`}
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <select
                        id={`edit-prompt-q-${idx}`}
                        className={`${INPUT_CLS} appearance-none pr-10`}
                        style={INPUT_STYLE}
                        value={p.prompt}
                        onChange={e => setField("prompts", form.prompts.map((item, i) => i === idx ? { ...item, prompt: e.target.value } : item))}
                      >
                        <option value="" className="bg-[#1A0F13] text-[#F8EDEB]">Choose a prompt question...</option>
                        {CURATED_PROMPTS.filter(q => q === p.prompt || !form.prompts.some(x => x.prompt === q)).map(q => (
                          <option key={q} value={q} className="bg-[#1A0F13] text-[#F8EDEB]">{q}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#F2B6C2]/50 pointer-events-none" />
                    </div>

                    <div>
                      <textarea
                        id={`edit-prompt-a-${idx}`}
                        className={INPUT_CLS}
                        style={{ ...INPUT_STYLE, resize: "none" }}
                        rows={2}
                        value={p.answer}
                        maxLength={300}
                        onChange={e => setField("prompts", form.prompts.map((item, i) => i === idx ? { ...item, answer: e.target.value } : item))}
                        placeholder="Share your authentic answer..."
                      />
                      <p className="text-[10px] text-[#F2B6C2]/50 text-right mt-1 font-medium">{p.answer.length} / 300</p>
                    </div>
                  </div>
                ))}

                {form.prompts.length < 3 && (
                  <button
                    type="button"
                    onClick={() => setField("prompts", [...form.prompts, { prompt: "", answer: "" }])}
                    className="w-full py-3 rounded-xl border border-dashed border-[#F2B6C2]/25 hover:border-[#F2B6C2]/50 text-xs font-semibold text-[#F2B6C2] hover:text-[#F8EDEB] hover:bg-[#8B1E3F]/15 flex items-center justify-center gap-2 transition-all duration-200"
                  >
                    <Plus size={15} /> Add Another Prompt
                  </button>
                )}
              </div>
            </Section>
          </motion.div>

          {/* ===================== Section: Preferences ===================== */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Section icon={Heart} title="Matching Preferences" subtitle="Who you wish to discover in your feeds.">
              <div className="space-y-6">
                <div>
                  <label className={LABEL_CLS}>
                    <Heart size={13} className="text-[#F2B6C2]" /> Interested In
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                          className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all duration-200 flex items-center justify-center gap-1.5 ${
                            selected
                              ? "bg-[#8B1E3F]/80 border-[#F2B6C2]/60 text-[#FDE7E9] shadow-sm"
                              : "bg-[#1A0F13]/60 border-[#F2B6C2]/15 text-[#F2B6C2]/80 hover:border-[#F2B6C2]/30"
                          }`}
                        >
                          {selected && <Check size={12} />}
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1A0F13]/50 border border-[#F2B6C2]/15 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className={`${LABEL_CLS} mb-0`}>
                      <Sparkles size={13} className="text-[#F2B6C2]" /> Age Preference
                    </label>
                    <span className="text-xs font-semibold text-[#D4AF97] px-2.5 py-0.5 rounded-full bg-[#3A0D1A]/60 border border-[#F2B6C2]/20">
                      {form.preferences.ageRange.min} – {form.preferences.ageRange.max} years
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="text-[11px] text-[#F2B6C2]/70 block mb-1.5 font-medium">Minimum Age: {form.preferences.ageRange.min}</span>
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
                        className="w-full accent-[#8B1E3F] h-2 rounded-full cursor-pointer bg-[#3A0D1A]"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-[#F2B6C2]/70 block mb-1.5 font-medium">Maximum Age: {form.preferences.ageRange.max}</span>
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
                        className="w-full accent-[#8B1E3F] h-2 rounded-full cursor-pointer bg-[#3A0D1A]"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1A0F13]/50 border border-[#F2B6C2]/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className={`${LABEL_CLS} mb-0`}>
                      <MapPin size={13} className="text-[#F2B6C2]" /> Discovery Radius
                    </label>
                    <span className="text-xs font-semibold text-[#D4AF97] px-2.5 py-0.5 rounded-full bg-[#3A0D1A]/60 border border-[#F2B6C2]/20">
                      {form.preferences.distanceKm} km
                    </span>
                  </div>
                  <input
                    id="edit-distance"
                    type="range"
                    min={5}
                    max={500}
                    value={form.preferences.distanceKm}
                    onChange={e => setField("preferences", { ...form.preferences, distanceKm: Number(e.target.value) })}
                    className="w-full accent-[#8B1E3F] h-2 rounded-full cursor-pointer bg-[#3A0D1A]"
                  />
                  <p className="text-[10px] text-[#F2B6C2]/50 italic">
                    Location filtering dynamically calibrates candidate feeds within your designated radius.
                  </p>
                </div>
              </div>
            </Section>
          </motion.div>

          {/* ===================== Bottom Save Actions ===================== */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="flex justify-end pt-3">
            <button
              id="save-profile-bottom"
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-11 px-8 rounded-full inline-flex items-center gap-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
              style={{
                background: saved ? "rgba(74,222,128,0.25)" : "linear-gradient(135deg, #8B1E3F 0%, #5C1228 100%)",
                color: saved ? "#86efac" : "#FDE7E9",
                border: saved ? "1px solid rgba(134,239,172,0.4)" : "1px solid rgba(242,182,194,0.3)",
                boxShadow: saved ? "none" : "0 8px 24px rgba(139,30,63,0.45)",
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : saved ? (
                <>
                  <CheckCircle size={16} />
                  <span>All Changes Saved!</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
