import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Heart, Send, Sparkles, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getIncomingLikes,
  getOutgoingLikes,
  likeProfile,
  passProfile,
  withdrawLike,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import LikeProfileCard from "../components/likes/LikeProfileCard";
import MatchCelebrationModal from "../components/matches/MatchCelebrationModal";

/**
 * LikesPage
 *
 * Authenticated page allowing users to view:
 * 1. "Likes You" (Incoming / Received Likes) with Like Back and Pass actions.
 * 2. "Sent Likes" (Outgoing Likes) with Withdraw action.
 */
export default function LikesPage({ defaultTab }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Determine active tab from prop, pathname, or default to "received"
  const getInitialTab = () => {
    if (defaultTab) return defaultTab;
    if (location.pathname.includes("/sent")) return "sent";
    return "received";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [profiles, setProfiles] = useState([]);
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
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Match celebration state
  const [celebrationPartner, setCelebrationPartner] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Sync tab with URL if pathname changes
  useEffect(() => {
    if (location.pathname.includes("/sent")) {
      setActiveTab("sent");
    } else if (location.pathname.includes("/received")) {
      setActiveTab("received");
    }
  }, [location.pathname]);

  const fetchLikes = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const response =
          activeTab === "received"
            ? await getIncomingLikes({ page, limit: 12 })
            : await getOutgoingLikes({ page, limit: 12 });

        if (response.success && response.data) {
          setProfiles(response.data.profiles || []);
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
          setProfiles([]);
        }
      } catch (err) {
        console.error("Error fetching likes:", err);
        setError(
          err.response?.data?.message || "Failed to load likes. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    fetchLikes(1);
  }, [fetchLikes]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(tab === "sent" ? "/likes/sent" : "/likes/received", {
      replace: true,
    });
  };

  // Like Back handler
  const handleLikeBack = async (profile) => {
    setActionLoadingId(profile.id);
    try {
      const response = await likeProfile(profile.id);
      // Remove from list immediately
      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));

      // If a genuine new mutual match is established, trigger celebration modal
      if (response.data?.isNewMatch && response.data?.match) {
        setCelebrationPartner(profile);
        setShowCelebration(true);
      }
    } catch (err) {
      console.error("Error liking back:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Pass handler
  const handlePass = async (profile) => {
    setActionLoadingId(profile.id);
    try {
      await passProfile(profile.id);
      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
    } catch (err) {
      console.error("Error passing on profile:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Withdraw Like handler
  const handleWithdraw = async (profile) => {
    setActionLoadingId(profile.id);
    try {
      await withdrawLike(profile.id);
      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
    } catch (err) {
      console.error("Error withdrawing like:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#F2B6C2]/20 bg-[#3A0D1A]/60 text-[#F2B6C2] text-xs font-medium uppercase tracking-wider mb-3">
          <Sparkles size={13} className="text-[#D4AF97]" />
          <span>Romantic Expressions</span>
        </div>
        <h1
          className="text-3xl sm:text-4xl font-serif font-bold text-[#FDE7E9] tracking-tight mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {activeTab === "received" ? "People Who Like You" : "People You’ve Liked"}
        </h1>
        <p className="text-sm text-[#F2B6C2]/80">
          {activeTab === "received"
            ? "These members have shown romantic interest in your profile. Like back to create an instant match!"
            : "Members you have expressed interest in during your discovery journey."}
        </p>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 mt-6 rounded-2xl bg-[#1A0F13]/90 border border-[#F2B6C2]/20 shadow-inner">
          <button
            type="button"
            id="tab-likes-received"
            onClick={() => handleTabChange("received")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "received"
                ? "bg-gradient-to-r from-[#8B1E3F] to-[#A32349] text-white shadow-md"
                : "text-[#F2B6C2]/70 hover:text-[#FDE7E9]"
            }`}
          >
            <Heart size={15} className={activeTab === "received" ? "fill-white" : ""} />
            <span>Likes You</span>
          </button>

          <button
            type="button"
            id="tab-likes-sent"
            onClick={() => handleTabChange("sent")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "sent"
                ? "bg-gradient-to-r from-[#8B1E3F] to-[#A32349] text-white shadow-md"
                : "text-[#F2B6C2]/70 hover:text-[#FDE7E9]"
            }`}
          >
            <Send size={15} />
            <span>Sent Likes</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        /* Loading Skeleton */
        <div
          data-testid="likes-loading"
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
        /* Error State */
        <div
          data-testid="likes-error"
          className="max-w-md mx-auto text-center py-16 px-4 rounded-3xl border border-rose-900/40 bg-[#1A0F13]/80"
        >
          <p className="text-sm text-rose-300 mb-4">{error}</p>
          <button
            onClick={() => fetchLikes(pagination.page)}
            className="btn-primary py-2 px-5 text-xs rounded-xl flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      ) : profiles.length === 0 ? (
        /* Empty State */
        <div
          data-testid="likes-empty"
          className="max-w-md mx-auto text-center py-20 px-6 rounded-3xl border border-[#F2B6C2]/15 bg-[#1A0F13]/60 backdrop-blur-sm"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#3A0D1A]/80 border border-[#F2B6C2]/20 text-[#F2B6C2]">
            {activeTab === "received" ? <Heart size={26} /> : <Send size={26} />}
          </div>
          <h3
            className="text-xl font-serif font-bold text-[#FDE7E9] mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {activeTab === "received"
              ? "No incoming likes yet"
              : "You haven't liked anyone yet"}
          </h3>
          <p className="text-xs sm:text-sm text-[#F2B6C2]/70 mb-6 leading-relaxed">
            {activeTab === "received"
              ? "Keep your profile up to date and explore new connections in Discover to attract admirers."
              : "Begin swiping in Discovery to express romantic interest and uncover potential mutual sparks."}
          </p>
          <Link
            to="/discover"
            className="btn-primary inline-flex items-center gap-2 py-2.5 px-6 rounded-xl text-xs font-semibold shadow-lg"
          >
            <span>Explore Discovery</span>
          </Link>
        </div>
      ) : (
        /* Cards Grid */
        <>
          <div
            data-testid="likes-grid"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {profiles.map((profile) => (
              <LikeProfileCard
                key={profile.id}
                profile={profile}
                type={activeTab}
                onLikeBack={handleLikeBack}
                onPass={handlePass}
                onWithdraw={handleWithdraw}
                actionLoading={actionLoadingId === profile.id}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-12">
              <button
                type="button"
                onClick={() => fetchLikes(pagination.page - 1)}
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
                onClick={() => fetchLikes(pagination.page + 1)}
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

      {/* Match Celebration Modal */}
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
