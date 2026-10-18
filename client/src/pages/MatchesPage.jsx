import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Sparkles, RefreshCw, ChevronLeft, ChevronRight, Heart, X, MapPin } from "lucide-react";
import { getMatches, unmatchConnection } from "../services/api";
import MatchCard from "../components/matches/MatchCard";
import UnmatchConfirmModal from "../components/matches/UnmatchConfirmModal";

/**
 * MatchesPage
 *
 * Displays active mutual matches for the authenticated user.
 * Provides profile inspection and safe, durable unmatching.
 */
export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Unmatch confirmation modal state
  const [targetMatchToUnmatch, setTargetMatchToUnmatch] = useState(null);
  const [unmatching, setUnmatching] = useState(false);

  // Profile viewing modal state
  const [selectedPartner, setSelectedPartner] = useState(null);

  // Notification toast message
  const [notification, setNotification] = useState(null);

  const fetchMatches = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMatches({ page, limit: 12 });
      if (response.success && response.data) {
        setMatches(response.data.matches || []);
        setPagination(
          response.data.pagination || {
            page,
            limit: 12,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          }
        );
      } else {
        setMatches([]);
      }
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError(
        err.response?.data?.message || "Failed to load matches. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches(1);
  }, [fetchMatches]);

  const handleOpenUnmatchModal = (match) => {
    setTargetMatchToUnmatch(match);
  };

  const handleConfirmUnmatch = async () => {
    if (!targetMatchToUnmatch) return;

    setUnmatching(true);
    try {
      await unmatchConnection(targetMatchToUnmatch.matchId);
      // Remove the match from current state smoothly
      setMatches((prev) =>
        prev.filter((m) => m.matchId !== targetMatchToUnmatch.matchId)
      );
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));

      // Show subtle feedback
      setNotification(`Unmatched ${targetMatchToUnmatch.partner?.name || "connection"}.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error("Error unmatching:", err);
      setNotification("Failed to unmatch. Please try again.");
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setUnmatching(false);
      setTargetMatchToUnmatch(null);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D4AF97]/30 bg-[#3A0D1A]/60 text-[#D4AF97] text-xs font-medium uppercase tracking-wider mb-3">
          <Sparkles size={13} />
          <span>Mutual Affinity</span>
        </div>
        <h1
          className="text-3xl sm:text-4xl font-serif font-bold text-[#FDE7E9] tracking-tight mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Your Matches
        </h1>
        <p className="text-sm text-[#F2B6C2]/80">
          Connections born from genuine mutual attraction. Both of you have liked each other.
        </p>

        {/* Status notification toast */}
        {notification && (
          <div
            role="status"
            className="mt-4 inline-block px-4 py-2 rounded-xl bg-[#3A0D1A]/90 border border-[#F2B6C2]/30 text-xs font-medium text-[#FDE7E9] shadow-lg animate-fade-in"
          >
            {notification}
          </div>
        )}
      </div>

      {/* Main Grid or Status Views */}
      {loading ? (
        <div
          data-testid="matches-loading"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-96 rounded-2xl bg-white/5 border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div
          data-testid="matches-error"
          className="max-w-md mx-auto text-center py-16 px-4 rounded-3xl border border-rose-900/40 bg-[#1A0F13]/80"
        >
          <p className="text-sm text-rose-300 mb-4">{error}</p>
          <button
            onClick={() => fetchMatches(pagination.page)}
            className="btn-primary py-2 px-5 text-xs rounded-xl flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      ) : matches.length === 0 ? (
        <div
          data-testid="matches-empty"
          className="max-w-md mx-auto text-center py-20 px-6 rounded-3xl border border-[#F2B6C2]/15 bg-[#1A0F13]/60 backdrop-blur-sm"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#3A0D1A]/80 border border-[#D4AF97]/30 text-[#D4AF97]">
            <Heart size={26} className="fill-[#8B1E3F]" />
          </div>
          <h3
            className="text-xl font-serif font-bold text-[#FDE7E9] mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            No matches yet
          </h3>
          <p className="text-xs sm:text-sm text-[#F2B6C2]/70 mb-6 leading-relaxed">
            When you and another member like each other, your mutual connection will appear here.
          </p>
          <Link
            to="/discover"
            className="btn-primary inline-flex items-center gap-2 py-2.5 px-6 rounded-xl text-xs font-semibold shadow-lg"
          >
            <span>Start Swiping</span>
          </Link>
        </div>
      ) : (
        <>
          <div
            data-testid="matches-grid"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {matches.map((match) => (
              <MatchCard
                key={match.matchId}
                match={match}
                onUnmatch={handleOpenUnmatchModal}
                onViewProfile={(partner) => setSelectedPartner(partner)}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-12">
              <button
                type="button"
                onClick={() => fetchMatches(pagination.page - 1)}
                disabled={!pagination.hasPreviousPage}
                className="flex items-center gap-1 py-2 px-3.5 rounded-xl text-xs font-medium border border-[#F2B6C2]/20 hover:border-[#F2B6C2]/40 bg-white/5 disabled:opacity-30 disabled:pointer-events-none text-[#F8EDEB] transition-colors"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <span className="text-xs font-medium text-[#F2B6C2]/80 px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={() => fetchMatches(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className="flex items-center gap-1 py-2 px-3.5 rounded-xl text-xs font-medium border border-[#F2B6C2]/20 hover:border-[#F2B6C2]/40 bg-white/5 disabled:opacity-30 disabled:pointer-events-none text-[#F8EDEB] transition-colors"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Unmatch Confirmation Modal */}
      <UnmatchConfirmModal
        isOpen={Boolean(targetMatchToUnmatch)}
        onClose={() => setTargetMatchToUnmatch(null)}
        onConfirm={handleConfirmUnmatch}
        partnerName={targetMatchToUnmatch?.partner?.name || "this person"}
        loading={unmatching}
      />

      {/* Partner Profile Modal */}
      {selectedPartner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedPartner.name}'s Profile Details`}
        >
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedPartner(null)}
            aria-hidden="true"
          />

          <div
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-[#F2B6C2]/30 bg-[#1A0F13] p-6 shadow-2xl z-10 text-left"
            style={{
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.8), 0 0 40px rgba(139, 30, 63, 0.3)",
            }}
          >
            <button
              onClick={() => setSelectedPartner(null)}
              aria-label="Close profile details"
              className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[#F2B6C2] hover:bg-white/20 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Photos Carousel / Primary Photo */}
            <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden mb-5 bg-[#2D121B]">
              <img
                src={
                  selectedPartner.photos?.find((p) => p.isPrimary)?.url ||
                  selectedPartner.photos?.[0]?.url ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
                }
                alt={selectedPartner.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A0F13] via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-2xl font-bold text-white drop-shadow-md">
                  {selectedPartner.name}, {selectedPartner.age}
                </h3>
                {selectedPartner.location?.city && (
                  <p className="flex items-center gap-1 text-xs text-[#F2B6C2] mt-0.5">
                    <MapPin size={12} className="text-[#D4AF97]" />
                    <span>{selectedPartner.location.city}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            {selectedPartner.bio && (
              <div className="mb-4">
                <h4 className="text-xs uppercase tracking-wider text-[#D4AF97] font-semibold mb-1">
                  About
                </h4>
                <p className="text-sm text-[#F8EDEB]/90 leading-relaxed whitespace-pre-wrap">
                  {selectedPartner.bio}
                </p>
              </div>
            )}

            {/* Interests */}
            {selectedPartner.interests && selectedPartner.interests.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs uppercase tracking-wider text-[#D4AF97] font-semibold mb-2">
                  Interests
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPartner.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full bg-[#3A0D1A] px-3 py-1 text-xs font-medium text-[#F2B6C2] border border-[#F2B6C2]/20"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Prompts */}
            {selectedPartner.prompts && selectedPartner.prompts.length > 0 && (
              <div className="space-y-3 mb-4">
                {selectedPartner.prompts.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <p className="text-xs text-[#F2B6C2]/80 font-medium mb-1">
                      {p.question}
                    </p>
                    <p className="text-sm text-[#F8EDEB] italic">
                      "{p.answer}"
                    </p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setSelectedPartner(null)}
              className="w-full btn-primary py-2.5 rounded-xl text-xs font-semibold mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
