import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, RefreshCw, Sparkles, User, AlertCircle } from "lucide-react";
import { getChatHistory, sendMessageRest, markChatRead } from "../../services/api";
import { getSocket } from "../../services/socket";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";
import ChatConnectionStatus from "./ChatConnectionStatus";

/**
 * ChatWindow
 * Active conversation view combining real-time Socket.IO and REST fallback.
 *
 * @param {string} matchId
 * @param {object} currentUser
 * @param {function} onBack - Mobile back button handler
 * @param {function} onConversationUpdated - Callback to update parent conversation preview
 */
export default function ChatWindow({
  matchId,
  currentUser,
  onBack,
  onConversationUpdated,
}) {
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError] = useState(null);
  const [socketStatus, setSocketStatus] = useState(() =>
    getSocket()?.connected ? "connected" : "connecting"
  );

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = (behavior = "smooth") => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // ── Load Conversation History via REST ──────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!matchId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await getChatHistory(matchId, { limit: 30 });
      if (res.success) {
        setMessages(res.messages || []);
        setHasMore(res.hasMore || false);
        setNextCursor(res.nextCursor || null);
        setPartner(res.partner || null);

        // Mark unread messages as read
        try {
          await markChatRead(matchId);
          const socket = getSocket();
          if (socket?.connected) {
            socket.emit("chat:read", { matchId });
          }
        } catch (e) {
          console.error("Mark read error:", e);
        }
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
      setError(
        err.response?.data?.message || "Failed to load conversation history."
      );
    } finally {
      setLoading(false);
      setTimeout(() => scrollToBottom("auto"), 50);
    }
  }, [matchId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ── Load Older Messages (Cursor Pagination) ─────────────────────────────────
  const handleLoadOlder = async () => {
    if (!hasMore || !nextCursor || loadingOlder) return;

    setLoadingOlder(true);
    const scrollContainer = messagesContainerRef.current;
    const previousScrollHeight = scrollContainer ? scrollContainer.scrollHeight : 0;

    try {
      const res = await getChatHistory(matchId, {
        before: nextCursor,
        limit: 30,
      });

      if (res.success && res.messages?.length) {
        setMessages((prev) => {
          // Prepend older messages avoiding duplicates
          const existingIds = new Set(prev.map((m) => m.id));
          const newOlder = res.messages.filter((m) => !existingIds.has(m.id));
          return [...newOlder, ...prev];
        });
        setHasMore(res.hasMore || false);
        setNextCursor(res.nextCursor || null);

        // Preserve scroll position
        setTimeout(() => {
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight - previousScrollHeight;
          }
        }, 10);
      }
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setLoadingOlder(false);
    }
  };

  // ── Socket.IO Real-Time Listeners & Room Management ─────────────────────────
  useEffect(() => {
    if (!matchId) return;

    const socket = getSocket();

    const onConnect = () => setSocketStatus("connected");
    const onDisconnect = () => setSocketStatus("disconnected");
    const onConnectError = () => setSocketStatus("connecting");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    if (socket.connected) {
      setSocketStatus("connected");
    }

    // Join room for this conversation
    socket.emit("chat:join", { matchId }, (response) => {
      if (response && !response.success) {
        console.warn("Socket chat:join failed:", response.message);
      }
    });

    // Listen for incoming messages
    const handleIncomingMessage = (messageDTO) => {
      if (messageDTO.matchId === matchId) {
        setMessages((prev) => {
          // Deduplicate by id or clientMessageId
          const isExisting = prev.some(
            (m) =>
              (m.id && m.id === messageDTO.id) ||
              (m.clientMessageId && m.clientMessageId === messageDTO.clientMessageId)
          );
          if (isExisting) {
            // Update existing message (e.g. replace pending state with confirmed server ID)
            return prev.map((m) =>
              m.clientMessageId === messageDTO.clientMessageId || m.id === messageDTO.id
                ? messageDTO
                : m
            );
          }
          return [...prev, messageDTO];
        });

        // If recipient is current user, acknowledge read
        if (messageDTO.recipientId === currentUser?.id || messageDTO.recipientId === currentUser?._id) {
          socket.emit("chat:read", { matchId });
          markChatRead(matchId).catch(() => {});
        }

        if (onConversationUpdated) {
          onConversationUpdated(matchId, messageDTO);
        }

        setTimeout(() => scrollToBottom("smooth"), 50);
      }
    };

    // Listen for read receipts
    const handleReadReceipt = ({ matchId: receiptMatchId, readAt }) => {
      if (receiptMatchId === matchId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === (currentUser?.id || currentUser?._id)
              ? { ...m, isRead: true, readAt }
              : m
          )
        );
      }
    };

    socket.on("chat:message", handleIncomingMessage);
    socket.on("chat:read:receipt", handleReadReceipt);

    return () => {
      socket.emit("chat:leave", { matchId });
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("chat:message", handleIncomingMessage);
      socket.off("chat:read:receipt", handleReadReceipt);
    };
  }, [matchId, currentUser, onConversationUpdated]);

  // ── Send Message Handler (Socket with REST Fallback) ─────────────────────────
  const handleSendMessage = async ({ text }) => {
    const clientMessageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const currentUserId = currentUser?.id || currentUser?._id || "me";

    // Optimistic message
    const optimisticMessage = {
      id: clientMessageId,
      matchId,
      senderId: currentUserId,
      recipientId: partner?.id || "partner",
      text,
      clientMessageId,
      isPending: true,
      isRead: false,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom("smooth"), 20);

    const socket = getSocket();

    // 1. Try sending via Socket.IO if connected
    if (socket?.connected) {
      try {
        const socketPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Socket timeout")), 4000);
          socket.emit("chat:send", { matchId, text, clientMessageId }, (res) => {
            clearTimeout(timeout);
            if (res && res.success) {
              resolve(res.message);
            } else {
              reject(new Error(res?.message || "Socket send failed"));
            }
          });
        });

        const confirmedMessage = await socketPromise;
        setMessages((prev) =>
          prev.map((m) =>
            m.clientMessageId === clientMessageId ? confirmedMessage : m
          )
        );
        if (onConversationUpdated) {
          onConversationUpdated(matchId, confirmedMessage);
        }
        return;
      } catch (socketErr) {
        console.warn("Socket send timed out or failed; falling back to REST:", socketErr.message);
      }
    }

    // 2. REST Fallback
    try {
      const restRes = await sendMessageRest(matchId, { text, clientMessageId });
      if (restRes.success && restRes.data) {
        setMessages((prev) =>
          prev.map((m) =>
            m.clientMessageId === clientMessageId ? restRes.data : m
          )
        );
        if (onConversationUpdated) {
          onConversationUpdated(matchId, restRes.data);
        }
      }
    } catch (restErr) {
      console.error("REST send also failed:", restErr);
      // Mark as failed for retry option
      setMessages((prev) =>
        prev.map((m) =>
          m.clientMessageId === clientMessageId
            ? { ...m, isPending: false, isFailed: true }
            : m
        )
      );
      throw restErr;
    }
  };

  const partnerPhoto =
    partner?.photos?.find((p) => p.isPrimary)?.url ||
    partner?.photos?.[0]?.url ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

  return (
    <div className="flex flex-col h-full bg-[#1A0F13] relative overflow-hidden">
      {/* ── Chat Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-[rgba(242,182,194,0.12)] bg-[#1A0F13]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to conversations list"
              className="md:hidden p-1.5 rounded-full text-[#F2B6C2] hover:bg-white/10"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          {/* Partner Photo & Details */}
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#F2B6C2]/20 bg-[#2D121B]">
            <img
              src={partnerPhoto}
              alt={partner?.name || "Partner"}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-[#F8EDEB] leading-tight">
              {partner?.name || "Your Connection"}{" "}
              {partner?.age && (
                <span className="font-normal text-xs text-[#F2B6C2]/70">
                  {partner.age}
                </span>
              )}
            </h2>
            <p className="text-[10px] text-[#F2B6C2]/60 mt-0.5">
              Active Connection
            </p>
          </div>
        </div>
      </div>

      {/* Connection warning bar if disconnected */}
      <ChatConnectionStatus status={socketStatus} />

      {/* ── Message History Stream ────────────────────────────────────────────── */}
      <div
        ref={messagesContainerRef}
        data-testid="chat-messages-container"
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <RefreshCw size={24} className="animate-spin text-[#F2B6C2]/60" />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6">
            <AlertCircle size={32} className="text-rose-400 mb-2" />
            <p className="text-sm text-rose-300 mb-4">{error}</p>
            <button
              onClick={loadHistory}
              className="btn-primary py-2 px-4 text-xs rounded-xl flex items-center gap-2"
            >
              <RefreshCw size={13} />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <>
            {/* Load Older Messages Button */}
            {hasMore && (
              <div className="text-center pb-4">
                <button
                  type="button"
                  onClick={handleLoadOlder}
                  disabled={loadingOlder}
                  className="px-3 py-1 rounded-full text-xs font-medium border border-[#F2B6C2]/20 hover:border-[#F2B6C2]/40 bg-white/5 text-[#F2B6C2] transition-colors disabled:opacity-50"
                >
                  {loadingOlder ? "Loading older messages…" : "Load older messages"}
                </button>
              </div>
            )}

            {/* Empty Conversation Prompt */}
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3A0D1A]/70 text-[#D4AF97] mb-3 border border-[#F2B6C2]/20 shadow-md">
                  <Sparkles size={24} />
                </div>
                <h3
                  className="text-lg font-serif font-bold text-[#FDE7E9] mb-1"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  You matched with {partner?.name || "each other"}!
                </h3>
                <p className="text-xs text-[#F2B6C2]/70 max-w-xs leading-relaxed">
                  Break the ice with something genuine. The beginning of every great love story starts with a simple hello.
                </p>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => {
              const currentUserId = currentUser?.id || currentUser?._id;
              const isOutgoing =
                message.senderId === currentUserId ||
                message.senderId?.toString() === currentUserId?.toString();

              return (
                <MessageBubble
                  key={message.id || message.clientMessageId}
                  message={message}
                  isOutgoing={isOutgoing}
                  onRetry={() => handleSendMessage({ text: message.text })}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ── Bottom Composer ───────────────────────────────────────────────────── */}
      <MessageComposer
        onSend={handleSendMessage}
        disabled={loading || Boolean(error)}
      />
    </div>
  );
}
