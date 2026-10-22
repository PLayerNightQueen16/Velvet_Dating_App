import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * MatchCelebrationModal
 *
 * Appears exclusively when a newly established mutual match occurs (`isNewMatch: true`).
 * Romantic VELVET styling featuring dual photo portraits, heart motif, and graceful velvet glow.
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {object} partner - The newly matched candidate profile { id, name, age, photos }
 * @param {object} currentUser - The authenticated user profile { name, photos }
 */
export default function MatchCelebrationModal({
  isOpen,
  onClose,
  partner,
  currentUser,
}) {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Trap focus and handle Escape key for accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Autofocus close or primary button
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !partner) return null;

  const currentPhoto =
    currentUser?.photos?.find((p) => p.isPrimary)?.url ||
    currentUser?.photos?.[0]?.url ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";

  const partnerPhoto =
    partner?.photos?.find((p) => p.isPrimary)?.url ||
    partner?.photos?.[0]?.url ||
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80";

  const partnerName = partner?.name || "Your Connection";

  const handleViewMatches = () => {
    onClose();
    navigate("/matches");
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-celebration-title"
        aria-describedby="match-celebration-desc"
      >
        {/* Backdrop with rich velvet vignette */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Card */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#F2B6C2]/30 p-8 text-center shadow-2xl z-10"
          style={{
            background:
              "radial-gradient(circle at 50% 20%, #3A0D1A 0%, #1A0F13 70%, #120A0E 100%)",
            boxShadow:
              "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(139, 30, 63, 0.35)",
          }}
        >
          {/* Subtle ambient bloom */}
          <div
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-40 bg-[#8B1E3F]"
            aria-hidden="true"
          />

          {/* Close button */}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close celebration modal"
            id="close-match-modal"
            className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#F2B6C2] transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-[#F2B6C2]"
          >
            <X size={18} />
          </button>

          {/* Romantic Header Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 350 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-[#D4AF97]/40 bg-[#3A0D1A]/80 text-[#D4AF97] text-xs font-medium uppercase tracking-widest mb-4 shadow-sm"
          >
            <Sparkles size={13} className="text-[#D4AF97]" />
            <span>Mutual Connection</span>
          </motion.div>

          {/* Headline */}
          <h2
            id="match-celebration-title"
            className="text-3xl sm:text-4xl font-serif font-bold text-[#FDE7E9] tracking-tight mb-2 drop-shadow-md"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            It's a Match!
          </h2>

          <p
            id="match-celebration-desc"
            className="text-sm text-[#F2B6C2]/85 mb-8 max-w-xs mx-auto"
          >
            You and <span className="font-semibold text-[#F8EDEB]">{partnerName}</span> have expressed mutual interest in each other.
          </p>

          {/* Dual Photos Arrangement */}
          <div className="relative flex items-center justify-center gap-2 mb-8 py-2">
            {/* Current User Photo */}
            <motion.div
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-[#8B1E3F] via-[#D4AF97] to-[#F2B6C2] shadow-xl"
            >
              <img
                src={currentPhoto}
                alt={currentUser?.name || "Your photo"}
                className="w-full h-full object-cover rounded-full bg-[#1A0F13]"
              />
            </motion.div>

            {/* Heart Motif Badge in Center */}
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 400, damping: 15 }}
              className="absolute z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#8B1E3F] to-[#3A0D1A] border-2 border-[#D4AF97] shadow-lg text-[#FDE7E9]"
              aria-hidden="true"
            >
              <Heart size={22} className="fill-[#F2B6C2] text-[#F2B6C2]" />
            </motion.div>

            {/* Partner Photo */}
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-[#F2B6C2] via-[#D4AF97] to-[#8B1E3F] shadow-xl"
            >
              <img
                src={partnerPhoto}
                alt={`${partnerName}'s photo`}
                className="w-full h-full object-cover rounded-full bg-[#1A0F13]"
              />
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <button
              type="button"
              id="match-view-matches-btn"
              onClick={handleViewMatches}
              className="w-full sm:w-auto flex-1 btn-primary py-3 px-5 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl transition-all"
            >
              <span>View Matches</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              id="match-keep-discovering-btn"
              onClick={onClose}
              className="w-full sm:w-auto flex-1 btn-ghost py-3 px-5 text-sm font-medium border border-[#F2B6C2]/20 hover:border-[#F2B6C2]/40 rounded-xl transition-all"
              style={{ color: "#F2B6C2" }}
            >
              Keep Discovering
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
