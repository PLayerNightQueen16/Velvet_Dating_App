import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  Sparkles,
  RotateCcw,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Layers,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getDiscovery, likeProfile, passProfile, blockUser } from "../services/api";
import DiscoveryProfileCard from "../components/discovery/DiscoveryProfileCard";
import DiscoveryFiltersModal from "../components/discovery/DiscoveryFiltersModal";
import MatchCelebrationModal from "../components/matches/MatchCelebrationModal";

export default function Discovery() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Filter State synchronized with URL Search Params ─────────────────────────
  const [filters, setFilters] = useState(() => {
    const minAge = searchParams.get("minAge");
    const maxAge = searchParams.get("maxAge");
    const genders = searchParams.get("genders");
    const interests = searchParams.get("interests");
    const relationshipIntent = searchParams.get("relationshipIntent");

    return {
      minAge: minAge ? Number(minAge) : 18,
      maxAge: maxAge ? Number(maxAge) : 60,
      genders: genders ? genders.split(",") : [],
      interests: interests ? interests.split(",") : [],
      relationshipIntent: relationshipIntent || "",
    };
  });

  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page"), 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });

  // ── Presentation Mode: Deck (Tinder Stack) vs Grid ───────────────────────────
  const [viewMode, setViewMode] = useState("deck"); // "deck" | "grid"

  // ── Component State ──────────────────────────────────────────────────────────
  const [profiles, setProfiles] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [actionPendingId, setActionPendingId] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [celebrationPartner, setCelebrationPartner] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // ── Sync URL Search Params when filters or page change ───────────────────────
  const updateQueryParams = useCallback(
    (newFilters, newPage) => {
      const params = new URLSearchParams();
      if (newPage > 1) params.set("page", newPage);
      if (newFilters.minAge && newFilters.minAge !== 18)
        params.set("minAge", newFilters.minAge);
      if (newFilters.maxAge && newFilters.maxAge !== 60)
        params.set("maxAge", newFilters.maxAge);
      if (newFilters.genders && newFilters.genders.length > 0)
        params.set("genders", newFilters.genders.join(","));
      if (newFilters.interests && newFilters.interests.length > 0)
        params.set("interests", newFilters.interests.join(","));
      if (newFilters.relationshipIntent)
        params.set("relationshipIntent", newFilters.relationshipIntent);

      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  // ── Fetch Candidates from MongoDB Discovery API ─────────────────────────────
  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        limit: 12,
        minAge: filters.minAge,
        maxAge: filters.maxAge,
      };

      if (filters.genders && filters.genders.length > 0) {
        params.genders = filters.genders.join(",");
      }
      if (filters.interests && filters.interests.length > 0) {
        params.interests = filters.interests.join(",");
      }
      if (filters.relationshipIntent) {
        params.relationshipIntent = filters.relationshipIntent;
      }

      const res = await getDiscovery(params);
      if (res.success && res.data) {
        setProfiles(res.data.profiles || []);
        setPagination(
          res.data.pagination || {
            page: 1,
            limit: 12,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          }
        );
      } else {
        throw new Error(res.message || "Failed to load profiles.");
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Please complete your profile to unlock Discovery.");
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to reach VELVET discovery. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // ── Show subtle feedback toast ───────────────────────────────────────────────
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // ── Auto-advance to next page when deck is exhausted ────────────────────────
  useEffect(() => {
    if (!loading && profiles.length === 0 && pagination.hasNextPage) {
      setPage((prev) => prev + 1);
      updateQueryParams(filters, page + 1);
    }
  }, [profiles.length, loading, pagination.hasNextPage, page, filters, updateQueryParams]);

  // ── Handle Like Action ───────────────────────────────────────────────────────
  const handleLike = async (profileId) => {
    if (actionPendingId) return; // Prevent double submits
    setActionPendingId(profileId);

    try {
      const candidate = profiles.find((p) => p.id === profileId);
      const res = await likeProfile(profileId);
      showToast("Interest sent 🌹");
      // Remove candidate card from the feed ONLY on success
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));

      // Trigger celebration modal only if this like confirmed a new mutual match
      if (res.data?.isNewMatch && res.data?.match) {
        setCelebrationPartner(candidate);
        setShowCelebration(true);
      }
    } catch (err) {
      console.error("Like error:", err);
      showToast("Could not send like. Please retry.");
    } finally {
      setActionPendingId(null);
    }
  };

  // ── Handle Pass Action ───────────────────────────────────────────────────────
  const handlePass = async (profileId) => {
    if (actionPendingId) return;
    setActionPendingId(profileId);

    try {
      await passProfile(profileId);
      showToast("Passed");
      // Remove candidate card from the feed ONLY on success
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    } catch (err) {
      console.error("Pass error:", err);
      showToast("Could not record pass. Please retry.");
    } finally {
      setActionPendingId(null);
    }
  };

  // ── Handle Safety Block Action ──────────────────────────────────────────────
  const handleBlock = async (profileId) => {
    if (actionPendingId) return;
    setActionPendingId(profileId);

    try {
      await blockUser(profileId);
      showToast("Profile blocked.");
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    } catch (err) {
      console.error("Block error:", err);
      showToast("Could not block user.");
    } finally {
      setActionPendingId(null);
    }
  };

  // ── Filter Controls Callbacks ───────────────────────────────────────────────
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
    updateQueryParams(newFilters, 1);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      minAge: 18,
      maxAge: 60,
      genders: [],
      interests: [],
      relationshipIntent: "",
    };
    setFilters(defaultFilters);
    setPage(1);
    updateQueryParams(defaultFilters, 1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    updateQueryParams(filters, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasActiveFilters =
    filters.minAge !== 18 ||
    filters.maxAge !== 60 ||
    filters.genders.length > 0 ||
    filters.interests.length > 0 ||
    Boolean(filters.relationshipIntent);

  const topCard = profiles[0];
  const subCard = profiles[1];

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 relative z-10 flex flex-col items-center">
      {/* ── Toast Notification ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 z-50 px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-xl border flex items-center gap-2 text-xs font-semibold"
            style={{
              background: "rgba(35, 12, 20, 0.95)",
              borderColor: "rgba(212, 175, 151, 0.4)",
              color: "#FDE7E9",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            }}
          >
            <Sparkles size={14} className="text-[#D4AF97]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* ── Page Header & Filter Controls ─────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F2B6C2]/15">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8EDEB]">
                Discover
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#8B1E3F]/30 text-[#F2B6C2] border border-[#F2B6C2]/20 font-medium">
                {viewMode === "deck" ? "Swipe Deck" : "Grid View"}
              </span>
            </div>
            <p className="text-xs text-[#F2B6C2]/70 font-serif italic">
              &ldquo;Some connections are written in the stars.&rdquo;
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Switcher (Deck vs Grid) */}
            <div className="flex items-center bg-black/30 p-1 rounded-xl border border-[#F2B6C2]/15">
              <button
                type="button"
                onClick={() => setViewMode("deck")}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === "deck"
                    ? "bg-[#8B1E3F] text-white shadow-sm"
                    : "text-[#F2B6C2]/70 hover:text-white"
                }`}
                title="Swipe Deck View (Tinder style)"
                aria-label="Swipe Deck View"
              >
                <Layers size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === "grid"
                    ? "bg-[#8B1E3F] text-white shadow-sm"
                    : "text-[#F2B6C2]/70 hover:text-white"
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#F2B6C2]/80 hover:text-white bg-black/20 hover:bg-black/40 border border-[#F2B6C2]/15 transition-all"
                title="Reset all filters"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              id="btn-open-filters"
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur-md transition-all hover:scale-102 active:scale-98 border"
              style={{
                background: hasActiveFilters
                  ? "linear-gradient(135deg, #8B1E3F 0%, #3A0D1A 100%)"
                  : "rgba(58, 13, 26, 0.5)",
                borderColor: hasActiveFilters
                  ? "rgba(212, 175, 151, 0.5)"
                  : "rgba(242, 182, 194, 0.2)",
                color: "#FDE7E9",
                boxShadow: hasActiveFilters
                  ? "0 4px 16px rgba(139, 30, 63, 0.35)"
                  : "none",
              }}
              aria-label="Open discovery filters"
            >
              <Filter size={14} className="text-[#D4AF97]" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#D4AF97] animate-pulse" />
              )}
            </button>
          </div>
        </header>

        {/* ── Main Feed Body ─────────────────────────────────────────────────── */}
        {loading ? (
          /* Loading Skeleton */
          <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
            <div className="w-16 h-16 rounded-full border-2 border-[#8B1E3F] border-t-[#D4AF97] animate-spin flex items-center justify-center">
              <Sparkles size={20} className="text-[#F2B6C2]/60 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-[#F2B6C2]/80">
              Reading the stars for compatible souls...
            </p>
          </div>
        ) : error ? (
          /* Error State */
          <div
            className="rounded-3xl p-8 sm:p-12 text-center backdrop-blur-xl border border-red-500/20 max-w-md mx-auto space-y-4"
            style={{ background: "rgba(35, 12, 20, 0.8)" }}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertCircle size={24} />
            </div>
            <h3 className="font-display text-lg font-semibold text-[#F8EDEB]">
              Discovery Interrupted
            </h3>
            <p className="text-xs text-[#F2B6C2]/80 leading-relaxed">{error}</p>
            {error.includes("complete your profile") ? (
              <button
                type="button"
                onClick={() => navigate("/onboarding")}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-transform hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #8B1E3F 0%, #3A0D1A 100%)",
                }}
              >
                Complete Profile Setup
              </button>
            ) : (
              <button
                type="button"
                onClick={fetchProfiles}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#F8EDEB] border border-[#F2B6C2]/20 hover:bg-white/5 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        ) : profiles.length === 0 ? (
          /* Empty State (No Candidates Remaining) */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl p-8 sm:p-14 text-center backdrop-blur-2xl border max-w-lg mx-auto space-y-5"
            style={{
              background: "rgba(35, 12, 20, 0.75)",
              borderColor: "rgba(242, 182, 194, 0.18)",
              boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6)",
            }}
          >
            <div
              className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center border shadow-inner"
              style={{
                background: "linear-gradient(135deg, #8B1E3F 0%, #3A0D1A 100%)",
                borderColor: "rgba(212, 175, 151, 0.3)",
              }}
            >
              <Heart size={28} className="text-[#FDE7E9]" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-[#F8EDEB] mb-2">
                You’re All Caught Up
              </h3>
              <p className="text-xs sm:text-sm text-[#F2B6C2]/80 max-w-sm mx-auto leading-relaxed">
                No more candidate profiles currently match your preferences and filters.
                Try widening your age range or resetting filters to see more profiles.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold border border-[#D4AF97]/40 text-[#FDE7E9] hover:bg-[#8B1E3F]/30 transition-colors"
                >
                  <RotateCcw size={14} />
                  Reset Filters
                </button>
              )}
              <button
                type="button"
                onClick={fetchProfiles}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-[#F8EDEB] border border-[#F2B6C2]/15 transition-colors"
              >
                Refresh Feed
              </button>
            </div>
          </motion.div>
        ) : viewMode === "deck" ? (
          /* ── Tinder-Style Stacked Swipe Deck ───────────────────────────────── */
          <div className="flex flex-col items-center space-y-4">
            {/* Gesture Hint Badge */}
            <div className="flex items-center gap-2 text-[11px] text-[#F2B6C2]/70 font-medium px-4 py-1.5 rounded-full bg-black/30 border border-[#F2B6C2]/15 backdrop-blur-sm">
              <span className="text-[#F2B6C2]/90">Swipe Left / ← to Pass</span>
              <span>•</span>
              <span className="text-[#D4AF97]">Swipe Right / → to Like</span>
            </div>

            {/* Deck Card Area */}
            <div className="relative w-full max-w-md min-h-[580px] sm:min-h-[640px] flex items-center justify-center">
              {/* Peeked Underneath Card (depth stack effect) */}
              {subCard && (
                <div
                  key={subCard.id}
                  className="absolute inset-0 w-full flex justify-center pointer-events-none select-none transition-transform duration-300"
                  style={{
                    transform: "scale(0.96) translateY(14px)",
                    opacity: 0.65,
                    filter: "blur(0.5px)",
                  }}
                  aria-hidden="true"
                >
                  <DiscoveryProfileCard
                    profile={subCard}
                    onLike={() => {}}
                    onPass={() => {}}
                    onBlock={() => {}}
                    isTopCard={false}
                  />
                </div>
              )}

              {/* Active Top Card (Draggable with full Physics) */}
              {topCard && (
                <div key={topCard.id} className="relative w-full z-20 flex justify-center">
                  <DiscoveryProfileCard
                    profile={topCard}
                    onLike={handleLike}
                    onPass={handlePass}
                    onBlock={handleBlock}
                    isActionPending={actionPendingId === topCard.id}
                    isTopCard={true}
                  />
                </div>
              )}
            </div>

            {/* Deck Stack Counter */}
            <div className="text-xs text-[#F2B6C2]/60 pt-2 font-medium">
              Profile 1 of {profiles.length} in this batch
            </div>
          </div>
        ) : (
          /* ── Grid View Mode ─────────────────────────────────────────────────── */
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 justify-items-center">
              <AnimatePresence mode="popLayout">
                {profiles.map((candidate) => (
                  <motion.div
                    key={candidate.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
                    className="w-full flex justify-center"
                  >
                    <DiscoveryProfileCard
                      profile={candidate}
                      onLike={handleLike}
                      onPass={handlePass}
                      onBlock={handleBlock}
                      isActionPending={actionPendingId === candidate.id}
                      isTopCard={true}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Deterministic Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-[#F2B6C2]/15 text-xs text-[#F2B6C2]/80">
                <span>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} compatible souls)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#F2B6C2]/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#F2B6C2]/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
                    aria-label="Next page"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Filters Modal ────────────────────────────────────────────────────── */}
      <DiscoveryFiltersModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* ── Match Celebration Modal ───────────────────────────────────────────── */}
      <MatchCelebrationModal
        isOpen={showCelebration}
        onClose={() => {
          setShowCelebration(false);
          setCelebrationPartner(null);
        }}
        partner={celebrationPartner}
        currentUser={user}
      />
    </div>
  );
}
