import React, { useState } from "react";
import { Search, MessageSquare, Sparkles } from "lucide-react";

/**
 * Formats a message timestamp into a compact relative string.
 */
function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/**
 * ConversationList
 * Displays list of active matches with last-message previews and unread badges.
 *
 * @param {Array} conversations - Array of conversation items
 * @param {string} selectedMatchId - ID of currently selected match
 * @param {function} onSelectMatch - Callback when a conversation is clicked
 * @param {boolean} loading
 */
export default function ConversationList({
  conversations = [],
  selectedMatchId = null,
  activeMatchId = null,
  onSelectMatch,
  onSelectConversation,
  loading = false,
}) {
  const currentSelectedId = selectedMatchId || activeMatchId;
  const handleSelect = onSelectMatch || onSelectConversation;
  const [searchTerm, setSearchTerm] = useState("");

  const filteredConversations = conversations.filter((c) => {
    if (!searchTerm.trim()) return true;
    const name = c.partner?.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase().trim());
  });

  return (
    <div className="flex flex-col h-full bg-[#1A0F13]/90 border-r border-[rgba(242,182,194,0.15)]">
      {/* Header and Search */}
      <div className="p-4 border-b border-[rgba(242,182,194,0.12)]">
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-xl font-serif font-bold text-[#FDE7E9]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Messages
          </h2>
          <span className="text-xs text-[#F2B6C2]/70 font-medium">
            {conversations.length} {conversations.length === 1 ? "match" : "matches"}
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F2B6C2]/50"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations…"
            aria-label="Search conversations"
            className="w-full rounded-xl bg-white/5 border border-[#F2B6C2]/15 py-2 pl-9 pr-4 text-xs text-[#F8EDEB] placeholder-[#F2B6C2]/40 focus:outline-none focus:border-[#F2B6C2]/50 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[rgba(242,182,194,0.06)]">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-white/10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                  <div className="h-2.5 bg-white/5 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-[#F2B6C2]/70">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#3A0D1A]/60 text-[#D4AF97]">
              <MessageSquare size={22} />
            </div>
            <p className="text-sm font-medium text-[#F8EDEB] mb-1">
              {searchTerm ? "No matches found" : "No conversations yet"}
            </p>
            <p className="text-xs text-[#F2B6C2]/60">
              {searchTerm
                ? "Try searching with a different name."
                : "Explore your matches and send the first tender message."}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = currentSelectedId === conv.matchId;
            const partnerPhoto =
              conv.partner?.photos?.find((p) => p.isPrimary)?.url ||
              conv.partner?.photos?.[0]?.url ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

            return (
              <button
                key={conv.matchId}
                type="button"
                data-testid={`conversation-item-${conv.matchId}`}
                onClick={() => handleSelect && handleSelect(conv.matchId)}
                className={`w-full flex items-center gap-3.5 p-3.5 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#3A0D1A]/70 border-l-4 border-l-[#8B1E3F]"
                    : "hover:bg-white/5"
                }`}
              >
                {/* Partner Avatar with Unread Glow */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-[#F2B6C2]/20 bg-[#2D121B]">
                  <img
                    src={partnerPhoto}
                    alt={conv.partner?.name || "Partner"}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info & Last Message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-[#F8EDEB] truncate">
                      {conv.partner?.name || "Match"}{" "}
                      {conv.partner?.age && (
                        <span className="font-normal text-xs text-[#F2B6C2]/70">
                          {conv.partner.age}
                        </span>
                      )}
                    </h3>
                    {conv.lastMessage?.createdAt && (
                      <span className="text-[10px] text-[#F2B6C2]/60 shrink-0 ml-1">
                        {formatRelativeTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs truncate ${
                        conv.unreadCount > 0
                          ? "font-semibold text-[#FDE7E9]"
                          : "text-[#F2B6C2]/70"
                      }`}
                    >
                      {conv.lastMessage?.text || (
                        <span className="italic text-[#D4AF97]/90 flex items-center gap-1">
                          <Sparkles size={11} /> Start the conversation
                        </span>
                      )}
                    </p>

                    {/* Unread Badge */}
                    {conv.unreadCount > 0 && (
                      <span
                        data-testid={`unread-badge-${conv.matchId}`}
                        className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-[#8B1E3F] text-[10px] font-bold text-white shadow-sm shrink-0"
                      >
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
