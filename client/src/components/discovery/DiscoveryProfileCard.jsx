import { useState, useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";
import {
  Heart,
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  User,
  Quote,
} from "lucide-react";
import ReportModal from "../ui/ReportModal";

/**
 * Format relationship intent for display
 */
function formatIntent(intent) {
  if (!intent) return null;
  const map = {
    "long-term": "Long-Term Partner",
    "short-term": "Short-Term Connection",
    casual: "Casual Dating",
    friendship: "Deep Friendship",
    "figuring-it-out": "Figuring It Out",
  };
  return map[intent] || intent;
}

export default function DiscoveryProfileCard({
  profile,
  onLike,
  onPass,
  onBlock,
  isActionPending = false,
  isTopCard = true,
}) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [imageError, setImageError] = useState({});
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isDraggingOut, setIsDraggingOut] = useState(false);

  const shouldReduceMotion = useReducedMotion();
  const controls = useAnimation();

  // Motion physics values for dragging
  const x = useMotionValue(0);
  const rotate = useTransform(
    x,
    [-300, 0, 300],
    shouldReduceMotion ? [0, 0, 0] : [-16, 0, 16]
  );
  const likeOpacity = useTransform(x, [30, 120], [0, 1]);
  const passOpacity = useTransform(x, [-30, -120], [0, 1]);

  const photos = profile.photos && profile.photos.length > 0 ? profile.photos : [];
  const currentPhoto = photos[activePhotoIdx];
  const hasMultiplePhotos = photos.length > 1;

  // Reset drag position if action failed or was canceled while card remains mounted
  useEffect(() => {
    if (!isActionPending && isDraggingOut) {
      controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 350, damping: 25 },
      });
      setIsDraggingOut(false);
    }
  }, [isActionPending, isDraggingOut, controls]);

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handleImageError = (photoId) => {
    setImageError((prev) => ({ ...prev, [photoId]: true }));
  };

  // ── Drag Gesture Handlers ──────────────────────────────────────────────────
  const handleDragEnd = async (event, info) => {
    if (isActionPending || isDraggingOut || !isTopCard) return;

    const offsetThreshold = 110;
    const velocityThreshold = 400;

    if (info.offset.x > offsetThreshold || info.velocity.x > velocityThreshold) {
      // Swiped Right -> Like
      setIsDraggingOut(true);
      onLike(profile.id);
      controls.start({
        x: 600,
        opacity: 0,
        rotate: shouldReduceMotion ? 0 : 20,
        transition: { duration: 0.35, ease: "easeOut" },
      });
    } else if (
      info.offset.x < -offsetThreshold ||
      info.velocity.x < -velocityThreshold
    ) {
      // Swiped Left -> Pass
      setIsDraggingOut(true);
      onPass(profile.id);
      controls.start({
        x: -600,
        opacity: 0,
        rotate: shouldReduceMotion ? 0 : -20,
        transition: { duration: 0.35, ease: "easeOut" },
      });
    } else {
      // Snap smoothly back to center
      controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        transition: { type: "spring", stiffness: 400, damping: 25 },
      });
    }
  };

  // ── Button Triggered Swipes ────────────────────────────────────────────────
  const triggerLike = (e) => {
    e?.stopPropagation();
    if (isActionPending || isDraggingOut) return;
    setIsDraggingOut(true);
    onLike(profile.id);
    controls.start({
      x: 600,
      opacity: 0,
      rotate: shouldReduceMotion ? 0 : 20,
      transition: { duration: 0.35, ease: "easeOut" },
    });
  };

  const triggerPass = (e) => {
    e?.stopPropagation();
    if (isActionPending || isDraggingOut) return;
    setIsDraggingOut(true);
    onPass(profile.id);
    controls.start({
      x: -600,
      opacity: 0,
      rotate: shouldReduceMotion ? 0 : -20,
      transition: { duration: 0.35, ease: "easeOut" },
    });
  };

  // ── Keyboard Shortcuts (ArrowRight = Like, ArrowLeft = Pass) ───────────────
  useEffect(() => {
    if (!isTopCard) return;

    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        triggerLike();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        triggerPass();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTopCard, isActionPending, isDraggingOut, profile.id]);

  const formattedIntent = formatIntent(profile.relationshipIntent);

  return (
    <motion.article
      animate={controls}
      style={{
        x,
        rotate,
        touchAction: "pan-y",
        background: "rgba(35, 12, 20, 0.78)",
        borderColor: "rgba(242, 182, 194, 0.18)",
        boxShadow:
          "0 24px 64px rgba(0, 0, 0, 0.6), 0 0 32px rgba(139, 30, 63, 0.15)",
      }}
      drag={isTopCard && !isActionPending && !isDraggingOut ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02, cursor: "grabbing" }}
      className="relative rounded-3xl overflow-hidden backdrop-blur-2xl border transition-shadow duration-300 shadow-2xl flex flex-col justify-between max-w-lg w-full mx-auto select-none cursor-grab active:cursor-grabbing"
      aria-label={`Discovery candidate: ${profile.name}, ${profile.age || ""}`}
      tabIndex={isTopCard ? 0 : -1}
    >
      {/* ── Visual Feedback Drag Stamps (LIKE / PASS) ─────────────────────── */}
      {isTopCard && (
        <>
          {/* LIKE Stamp (Swipe Right) */}
          <motion.div
            style={{
              opacity: likeOpacity,
              borderColor: "#D4AF97",
              color: "#FDE7E9",
              background: "rgba(139, 30, 63, 0.9)",
              boxShadow: "0 0 32px rgba(212, 175, 151, 0.6)",
            }}
            className="absolute top-10 left-8 z-50 px-5 py-2 rounded-2xl border-2 font-display text-2xl font-bold tracking-wider pointer-events-none select-none uppercase shadow-2xl -rotate-12 backdrop-blur-md"
          >
            <span className="flex items-center gap-2">
              <span>LIKE</span> 🌹
            </span>
          </motion.div>

          {/* PASS Stamp (Swipe Left) */}
          <motion.div
            style={{
              opacity: passOpacity,
              borderColor: "rgba(242, 182, 194, 0.6)",
              color: "#F2B6C2",
              background: "rgba(26, 15, 19, 0.9)",
              boxShadow: "0 0 32px rgba(0, 0, 0, 0.7)",
            }}
            className="absolute top-10 right-8 z-50 px-5 py-2 rounded-2xl border-2 font-display text-2xl font-bold tracking-wider pointer-events-none select-none uppercase shadow-2xl rotate-12 backdrop-blur-md"
          >
            <span className="flex items-center gap-2">
              ✕ <span>PASS</span>
            </span>
          </motion.div>
        </>
      )}

      {/* ── Photo Section with Carousel Controls ─────────────────────────── */}
      <div className="relative aspect-[4/5] sm:aspect-[3/4] w-full overflow-hidden bg-[#1A0F13]">
        {currentPhoto && !imageError[currentPhoto.id || activePhotoIdx] ? (
          <img
            src={currentPhoto.url}
            alt={`${profile.name} - photo ${activePhotoIdx + 1}`}
            className="w-full h-full object-cover transition-transform duration-700 select-none pointer-events-none"
            loading="lazy"
            onError={() => handleImageError(currentPhoto.id || activePhotoIdx)}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none"
            style={{
              background: "linear-gradient(135deg, #3A0D1A 0%, #1A0F13 100%)",
            }}
          >
            <User size={64} className="text-[#F2B6C2]/40 mb-3" />
            <p className="text-xs text-[#F2B6C2]/60 font-medium">
              Image unavailable
            </p>
          </div>
        )}

        {/* Ambient Dark Gradient Overlays for contrast */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(26,15,19,0.4) 0%, transparent 25%, transparent 60%, rgba(26,15,19,0.95) 100%)",
          }}
          aria-hidden="true"
        />

        {/* Photo Index Indicator Dots (Top) */}
        {hasMultiplePhotos && (
          <div
            className="absolute top-3 left-0 right-0 flex items-center justify-center gap-1.5 z-20 px-4"
            aria-label={`Photo ${activePhotoIdx + 1} of ${photos.length}`}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActivePhotoIdx(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activePhotoIdx
                    ? "w-7 bg-[#FDE7E9] shadow-sm"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Photo Navigation Touch Arrows (Left / Right) */}
        {hasMultiplePhotos && (
          <>
            <button
              type="button"
              onClick={handlePrevPhoto}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/70 text-white/90 backdrop-blur-md transition-colors z-20 border border-white/10"
              aria-label="Previous photo"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={handleNextPhoto}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/70 text-white/90 backdrop-blur-md transition-colors z-20 border border-white/10"
              aria-label="Next photo"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Floating Quick Badges (Intent & Safety) */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          {formattedIntent && (
            <span
              className="px-3 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md border shadow-sm"
              style={{
                background: "rgba(58, 13, 26, 0.75)",
                borderColor: "rgba(212, 175, 151, 0.4)",
                color: "#FDE7E9",
              }}
            >
              ✦ {formattedIntent}
            </span>
          )}
        </div>

        {/* Safety Block Trigger (Top Right) */}
        <div className="absolute top-4 right-4 z-20" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setShowBlockConfirm((prev) => !prev)}
            className="p-2 rounded-full bg-black/40 hover:bg-black/70 text-[#F2B6C2]/70 hover:text-red-400 backdrop-blur-md transition-colors border border-white/10"
            title="Safety options / Block user"
            aria-label="Safety options"
          >
            <ShieldAlert size={16} />
          </button>
        </div>

        {/* Block Confirmation Popup */}
        <AnimatePresence>
          {showBlockConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-4 rounded-2xl z-30 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl border border-red-500/30"
              style={{ background: "rgba(26, 15, 19, 0.95)" }}
            >
              <ShieldAlert size={36} className="text-red-400 mb-2" />
              <h4 className="font-display text-base font-semibold text-[#F8EDEB] mb-1">
                Block {profile.name}?
              </h4>
              <p className="text-xs text-[#F2B6C2]/80 mb-5 max-w-xs">
                They will no longer appear in your discovery and cannot interact with you.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setShowBlockConfirm(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#F2B6C2]/20 text-[#F8EDEB] hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBlockConfirm(false);
                    setShowReportModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-amber-500/40 text-amber-300 hover:bg-amber-950/20 transition-colors"
                >
                  Report
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBlockConfirm(false);
                    onBlock?.(profile.id);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-600/80 hover:bg-red-600 text-white shadow-lg transition-colors"
                >
                  Block
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Hero Overlay Information */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#F8EDEB] drop-shadow-md">
              {profile.name}
            </h3>
            {profile.age && (
              <span className="font-sans text-xl sm:text-2xl font-light text-[#D4AF97] drop-shadow-sm">
                {profile.age}
              </span>
            )}
          </div>

          {/* Quick info row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#F2B6C2]/90 font-medium">
            {profile.gender && (
              <span className="capitalize">{profile.gender}</span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-[#D4AF97]" />
                {profile.location}
              </span>
            )}
            {profile.occupation && (
              <span className="flex items-center gap-1">
                <Briefcase size={12} className="text-[#D4AF97]" />
                {profile.occupation}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile Details Section ───────────────────────────────────────── */}
      <div className="p-5 sm:p-6 space-y-4 flex-1">
        {/* Bio */}
        {profile.bio && (
          <p className="text-sm leading-relaxed text-[#F8EDEB]/90 font-serif italic border-l-2 pl-3.5 border-[#8B1E3F]">
            &ldquo;{profile.bio}&rdquo;
          </p>
        )}

        {/* Education & Languages (if present) */}
        {(profile.education || (profile.languages && profile.languages.length > 0)) && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#F2B6C2]/80">
            {profile.education && (
              <span className="flex items-center gap-1.5">
                <GraduationCap size={13} className="text-[#D4AF97]" />
                {profile.education}
              </span>
            )}
            {profile.languages && profile.languages.length > 0 && (
              <span className="text-[11px] text-[#F2B6C2]/60">
                Speaks: {profile.languages.join(", ")}
              </span>
            )}
          </div>
        )}

        {/* Interests Tags */}
        {profile.interests && profile.interests.length > 0 && (
          <div>
            <h5 className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF97] mb-2">
              Passions & Interests
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((interest, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border"
                  style={{
                    background: "rgba(58, 13, 26, 0.45)",
                    borderColor: "rgba(242, 182, 194, 0.2)",
                    color: "#FDE7E9",
                  }}
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Prompts Answers (if present) */}
        {profile.prompts && profile.prompts.length > 0 && (
          <div className="space-y-2.5 pt-1">
            {profile.prompts.map((p, idx) => (
              <div
                key={p.id || idx}
                className="rounded-2xl p-3.5 border backdrop-blur-md"
                style={{
                  background: "rgba(26, 15, 19, 0.6)",
                  borderColor: "rgba(242, 182, 194, 0.12)",
                }}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D4AF97] mb-1">
                  <Quote size={12} className="rotate-180 text-[#8B1E3F]" />
                  <span>{p.prompt}</span>
                </div>
                <p className="text-xs text-[#F8EDEB]/90 pl-4 font-medium leading-relaxed">
                  {p.answer}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Action Buttons Footer (Pass / Like) ────────────────────────────── */}
      <div
        className="px-6 py-4 border-t flex items-center justify-around gap-6 backdrop-blur-xl"
        style={{
          background: "rgba(26, 15, 19, 0.8)",
          borderColor: "rgba(242, 182, 194, 0.12)",
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Pass Button */}
        <button
          type="button"
          onClick={triggerPass}
          disabled={isActionPending || isDraggingOut}
          className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-400/40"
          style={{
            borderColor: "rgba(242, 182, 194, 0.3)",
            background: "rgba(26, 15, 19, 0.8)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
          }}
          aria-label={`Pass on ${profile.name}`}
        >
          {isActionPending ? (
            <Loader2 size={24} className="animate-spin text-[#F2B6C2]" />
          ) : (
            <X
              size={28}
              className="text-[#F2B6C2] group-hover:text-white transition-colors duration-200"
            />
          )}
        </button>

        {/* Like Button */}
        <button
          type="button"
          onClick={triggerLike}
          disabled={isActionPending || isDraggingOut}
          className="group relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-[#8B1E3F]/60"
          style={{
            background: "linear-gradient(135deg, #8B1E3F 0%, #3A0D1A 100%)",
            border: "2px solid rgba(212, 175, 151, 0.6)",
            boxShadow:
              "0 12px 32px rgba(139, 30, 63, 0.45), 0 0 24px rgba(212, 175, 151, 0.2)",
          }}
          aria-label={`Like ${profile.name}`}
        >
          {isActionPending ? (
            <Loader2 size={30} className="animate-spin text-[#FDE7E9]" />
          ) : (
            <Heart
              size={32}
              className="fill-current text-[#FDE7E9] group-hover:scale-110 transition-transform duration-200"
            />
          )}
        </button>
      </div>

      {/* Confidential Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetUser={profile}
        onReportSuccess={({ alsoBlock }) => {
          if (alsoBlock) {
            onBlock?.(profile.id);
          }
        }}
      />
    </motion.article>
  );
}
