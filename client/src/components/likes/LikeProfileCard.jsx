import React from "react";
import { Heart, X, Undo2, MapPin, Sparkles } from "lucide-react";

/**
 * LikeProfileCard
 *
 * Card display for profiles in Incoming (received) or Outgoing (sent) lists.
 *
 * @param {object} profile - Discovery serialized profile
 * @param {"received" | "sent"} type - Type of like list
 * @param {function} onLikeBack - Callback when "Like Back" is clicked
 * @param {function} onPass - Callback when "Pass" is clicked
 * @param {function} onWithdraw - Callback when "Withdraw" is clicked
 * @param {boolean} actionLoading - If this card is currently performing an API action
 */
export default function LikeProfileCard({
  profile,
  type = "received",
  onLikeBack,
  onPass,
  onWithdraw,
  actionLoading = false,
}) {
  const photoUrl =
    profile.photos?.find((p) => p.isPrimary)?.url ||
    profile.photos?.[0]?.url ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80";

  const formattedDate = profile.likedAt
    ? new Date(profile.likedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
      data-testid={`like-card-${profile.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#F2B6C2]/20 bg-[#1A0F13]/90 shadow-lg transition-all duration-300 hover:border-[#F2B6C2]/40 hover:shadow-2xl"
    >
      {/* Photo Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#2D121B]">
        <img
          src={photoUrl}
          alt={profile.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient Overlay for Text Legibility */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#1A0F13] via-[#1A0F13]/30 to-transparent"
          aria-hidden="true"
        />

        {/* Date Badge */}
        {formattedDate && (
          <div className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-[#FDE7E9] backdrop-blur-sm border border-white/10">
            {type === "received" ? `Liked you ${formattedDate}` : `Liked ${formattedDate}`}
          </div>
        )}

        {/* Name and Basic Info Overlay */}
        <div className="absolute bottom-3 left-3 right-3 text-left">
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl font-bold text-[#F8EDEB] drop-shadow-sm">
              {profile.name}
            </h3>
            {profile.age && (
              <span className="text-lg font-medium text-[#F2B6C2]">
                {profile.age}
              </span>
            )}
          </div>

          {profile.location?.city && (
            <p className="flex items-center gap-1 text-xs text-[#F2B6C2]/90 mt-0.5">
              <MapPin size={12} className="text-[#D4AF97]" />
              <span>{profile.location.city}</span>
            </p>
          )}
        </div>
      </div>

      {/* Content & Details */}
      <div className="flex flex-1 flex-col justify-between p-4">
        {/* Bio Snippet */}
        {profile.bio && (
          <p className="line-clamp-2 text-xs text-[#F8EDEB]/80 text-left mb-3">
            {profile.bio}
          </p>
        )}

        {/* Interests Badges */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {profile.interests.slice(0, 3).map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-[#3A0D1A]/70 px-2.5 py-0.5 text-[10px] font-medium text-[#F2B6C2] border border-[#F2B6C2]/15"
              >
                {interest}
              </span>
            ))}
            {profile.interests.length > 3 && (
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[#F2B6C2]/60">
                +{profile.interests.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Card Actions */}
        <div className="mt-auto pt-2 border-t border-[rgba(242,182,194,0.1)]">
          {type === "received" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPass && onPass(profile)}
                disabled={actionLoading}
                aria-label={`Pass on ${profile.name}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-[#F8EDEB] transition-colors disabled:opacity-50"
              >
                <X size={15} className="text-[#F2B6C2]/70" />
                <span>Pass</span>
              </button>

              <button
                type="button"
                onClick={() => onLikeBack && onLikeBack(profile)}
                disabled={actionLoading}
                aria-label={`Like back ${profile.name}`}
                className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#8B1E3F] to-[#A32349] hover:from-[#A32349] hover:to-[#B82B54] text-white shadow-md transition-all disabled:opacity-50"
              >
                <Heart size={15} className="fill-white" />
                <span>Like Back</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onWithdraw && onWithdraw(profile)}
              disabled={actionLoading}
              aria-label={`Withdraw like to ${profile.name}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border border-[#F2B6C2]/20 hover:border-[#8B1E3F] hover:bg-[#3A0D1A]/50 text-[#F2B6C2] transition-colors disabled:opacity-50"
            >
              <Undo2 size={14} />
              <span>Withdraw Like</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
