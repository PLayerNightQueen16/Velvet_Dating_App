import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Filter, RotateCcw, Check, Sparkles } from "lucide-react";

const GENDER_OPTIONS = [
  { value: "woman", label: "Women" },
  { value: "man", label: "Men" },
  { value: "non-binary", label: "Non-binary" },
  { value: "other", label: "Other Identities" },
];

const INTENT_OPTIONS = [
  { value: "long-term", label: "Long-Term Partner" },
  { value: "short-term", label: "Short-Term Connection" },
  { value: "casual", label: "Casual Dating" },
  { value: "friendship", label: "Deep Friendship" },
  { value: "figuring-it-out", label: "Figuring It Out" },
];

const POPULAR_INTERESTS = [
  "Artisanal Coffee",
  "Contemporary Art",
  "Fine Dining",
  "Jazz & Blues",
  "Live Concerts",
  "Midnight Talks",
  "Museums & Galleries",
  "Photography",
  "Pilates & Yoga",
  "Road Trips",
  "Stargazing",
  "Wine Tasting",
];

export default function DiscoveryFiltersModal({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
}) {
  const [minAge, setMinAge] = useState(filters.minAge || 18);
  const [maxAge, setMaxAge] = useState(filters.maxAge || 60);
  const [genders, setGenders] = useState(filters.genders || []);
  const [relationshipIntents, setRelationshipIntents] = useState(
    filters.relationshipIntent ? [filters.relationshipIntent] : []
  );
  const [interests, setInterests] = useState(filters.interests || []);
  const [ageError, setAgeError] = useState("");

  useEffect(() => {
    setMinAge(filters.minAge || 18);
    setMaxAge(filters.maxAge || 60);
    setGenders(filters.genders || []);
    setRelationshipIntents(
      filters.relationshipIntent ? [filters.relationshipIntent] : []
    );
    setInterests(filters.interests || []);
    setAgeError("");
  }, [filters, isOpen]);

  const toggleGender = (val) => {
    setGenders((prev) =>
      prev.includes(val) ? prev.filter((g) => g !== val) : [...prev, val]
    );
  };

  const toggleIntent = (val) => {
    setRelationshipIntents((prev) =>
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]
    );
  };

  const toggleInterest = (item) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleApply = (e) => {
    e.preventDefault();
    if (Number(minAge) < 18) {
      setAgeError("Minimum age cannot be below 18.");
      return;
    }
    if (Number(minAge) > Number(maxAge)) {
      setAgeError("Minimum age cannot be greater than maximum age.");
      return;
    }
    setAgeError("");

    onApply({
      minAge: Number(minAge),
      maxAge: Number(maxAge),
      genders,
      relationshipIntent:
        relationshipIntents.length > 0 ? relationshipIntents.join(",") : undefined,
      interests,
    });
    onClose();
  };

  const handleReset = () => {
    setMinAge(18);
    setMaxAge(60);
    setGenders([]);
    setRelationshipIntents([]);
    setInterests([]);
    setAgeError("");
    onReset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-7 backdrop-blur-2xl border shadow-2xl z-10 space-y-6"
            style={{
              background: "rgba(30, 10, 18, 0.95)",
              borderColor: "rgba(242, 182, 194, 0.25)",
              boxShadow: "0 32px 96px rgba(0, 0, 0, 0.8), 0 0 48px rgba(139, 30, 63, 0.25)",
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F2B6C2]/15">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center border"
                  style={{
                    background: "linear-gradient(135deg, #8B1E3F 0%, #3A0D1A 100%)",
                    borderColor: "rgba(212, 175, 151, 0.4)",
                  }}
                >
                  <Filter size={18} className="text-[#FDE7E9]" />
                </div>
                <h3 id="filter-modal-title" className="font-display text-xl font-semibold text-[#F8EDEB]">
                  Filter Potential Matches
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-[#F2B6C2]/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-6">
              {/* Age Range Filter */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-[#D4AF97] mb-2.5">
                  Age Range (18 - 100)
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="block text-[11px] text-[#F2B6C2]/60 mb-1">Min Age</span>
                    <input
                      type="number"
                      min={18}
                      max={100}
                      value={minAge}
                      onChange={(e) => setMinAge(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-black/40 border border-[#F2B6C2]/20 text-[#F8EDEB] outline-none focus:border-[#D4AF97]"
                      aria-label="Minimum age"
                    />
                  </div>
                  <span className="text-[#F2B6C2]/50 pt-5">—</span>
                  <div className="flex-1">
                    <span className="block text-[11px] text-[#F2B6C2]/60 mb-1">Max Age</span>
                    <input
                      type="number"
                      min={18}
                      max={100}
                      value={maxAge}
                      onChange={(e) => setMaxAge(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-black/40 border border-[#F2B6C2]/20 text-[#F8EDEB] outline-none focus:border-[#D4AF97]"
                      aria-label="Maximum age"
                    />
                  </div>
                </div>
                {ageError && (
                  <p className="text-xs text-red-400 mt-2 font-medium">{ageError}</p>
                )}
              </div>

              {/* Gender Filter */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-[#D4AF97] mb-2">
                  Gender Identity (select multiple)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_OPTIONS.map((opt) => {
                    const isSelected = genders.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleGender(opt.value)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? "bg-[#8B1E3F]/40 border-[#D4AF97] text-[#FDE7E9]"
                            : "bg-black/30 border-[#F2B6C2]/15 text-[#F2B6C2]/70 hover:bg-black/50"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check size={14} className="text-[#D4AF97]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Relationship Intention Filter */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-[#D4AF97] mb-2">
                  Relationship Intention
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTENT_OPTIONS.map((intent) => {
                    const isSelected = relationshipIntents.includes(intent.value);
                    return (
                      <button
                        key={intent.value}
                        type="button"
                        onClick={() => toggleIntent(intent.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? "bg-[#8B1E3F]/50 border-[#D4AF97] text-[#FDE7E9]"
                            : "bg-black/30 border-[#F2B6C2]/15 text-[#F2B6C2]/70 hover:bg-black/50"
                        }`}
                      >
                        {intent.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interests Filter (Matches Any Selected Interest) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#D4AF97]">
                    Interests & Passions
                  </label>
                  <span className="text-[11px] text-[#F2B6C2]/50 italic">
                    Matches candidates with any selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                  {POPULAR_INTERESTS.map((interest) => {
                    const isSelected = interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? "bg-[#8B1E3F] border-[#D4AF97] text-[#F8EDEB]"
                            : "bg-black/30 border-[#F2B6C2]/15 text-[#F2B6C2]/70 hover:bg-black/50"
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#F2B6C2]/15 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#F2B6C2]/20 text-[#F2B6C2] hover:bg-white/5 transition-colors"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#F2B6C2]/70 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-transform hover:scale-102 active:scale-98"
                    style={{
                      background: "linear-gradient(135deg, #8B1E3F 0%, #3A0D1A 100%)",
                      border: "1px solid rgba(212, 175, 151, 0.4)",
                      color: "#FDE7E9",
                      boxShadow: "0 4px 16px rgba(139, 30, 63, 0.4)",
                    }}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
