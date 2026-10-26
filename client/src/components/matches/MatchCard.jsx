import React from "react";
import { Link } from "react-router-dom";
import { UserX, Calendar, MapPin, Eye, Sparkles, MessageCircle } from "lucide-react";

/**
 * MatchCard
 *
 * Card component for an active mutual match.
 *
 * @param {object} match - { matchId, matchedAt, partner }
 * @param {function} onUnmatch - Callback when Unmatch button is clicked
 * @param {function} onViewProfile - Callback to view partner profile details
 */
export default function MatchCard({ match, onUnmatch, onViewProfile }) {
  const { matchId, matchedAt, partner } = match;

  const photoUrl =
    partner?.photos?.find((p) => p.isPrimary)?.url ||
    partner?.photos?.[0]?.url ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80";

  const formattedDate = matchedAt
    ? new Date(matchedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  return (
    <div
      data-testid={`match-card-${matchId}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#F2B6C2]/20 bg-[#1A0F13]/90 shadow-xl transition-all duration-300 hover:border-[#D4AF97]/40 hover:shadow-2xl"
    >
      {/* Photo Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#2D121B]">
        <img
          src={photoUrl}
          alt={partner?.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#1A0F13] via-[#1A0F13]/30 to-transparent"
          aria-hidden="true"
        />

        {/* Matched Date Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-[#3A0D1A]/85 px-3 py-1 text-xs font-medium text-[#D4AF97] backdrop-blur-sm border border-[#D4AF97]/30 shadow-md">
          <Calendar size={12} />
          <span>Matched {formattedDate}</span>
        </div>

        {/* Name and Info Overlay */}
        <div className="absolute bottom-3 left-3 right-3 text-left">
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl font-bold text-[#F8EDEB] drop-shadow-sm">
              {partner?.name}
            </h3>
            {partner?.age && (
              <span className="text-lg font-medium text-[#F2B6C2]">
                {partner.age}
              </span>
            )}
          </div>

          {partner?.location?.city && (
            <p className="flex items-center gap-1 text-xs text-[#F2B6C2]/90 mt-0.5">
              <MapPin size={12} className="text-[#D4AF97]" />
              <span>{partner.location.city}</span>
            </p>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-4">
        {/* Bio Snippet */}
        {partner?.bio && (
          <p className="line-clamp-2 text-xs text-[#F8EDEB]/80 text-left mb-3">
            {partner.bio}
          </p>
        )}

        {/* Interests */}
        {partner?.interests && partner.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {partner.interests.slice(0, 3).map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-[#3A0D1A]/70 px-2.5 py-0.5 text-[10px] font-medium text-[#F2B6C2] border border-[#F2B6C2]/15"
              >
                {interest}
              </span>
            ))}
          </div>
        )}

        {/* Actions: Chat, View Profile & Unmatch */}
        <div className="mt-auto pt-3 border-t border-[rgba(242,182,194,0.1)] flex flex-col gap-2">
          <Link
            to={`/chat/${matchId}`}
            aria-label={`Chat with ${partner?.name}`}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#8B1E3F] to-[#3A0D1A] hover:from-[#A2264B] hover:to-[#4A1122] text-[#F8EDEB] border border-[#F2B6C2]/30 shadow-md transition-all hover:shadow-[#8B1E3F]/30"
          >
            <MessageCircle size={14} className="text-[#F2B6C2]" />
            <span>Chat</span>
          </Link>

          <div className="flex items-center gap-2">
            {onViewProfile && (
              <button
                type="button"
                onClick={() => onViewProfile(partner)}
                aria-label={`View ${partner?.name}'s profile`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium border border-[#F2B6C2]/20 hover:border-[#F2B6C2]/40 bg-white/5 hover:bg-white/10 text-[#F8EDEB] transition-colors"
              >
                <Eye size={14} className="text-[#F2B6C2]" />
                <span>Profile</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onUnmatch && onUnmatch(match)}
              aria-label={`Unmatch ${partner?.name}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium border border-rose-900/40 hover:border-rose-700/60 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 transition-colors"
            >
              <UserX size={14} />
              <span>Unmatch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
