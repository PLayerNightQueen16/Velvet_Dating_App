import React from "react";
import { Check, CheckCheck, AlertCircle, RotateCcw } from "lucide-react";

/**
 * MessageBubble
 * Renders an individual text message with timestamp and delivery/read indicator.
 *
 * @param {object} message - { id, text, senderId, readAt, isRead, createdAt, isPending, isFailed }
 * @param {boolean} isOutgoing - True if sent by current user
 * @param {function} onRetry - Optional callback to retry failed message
 */
export default function MessageBubble({ message, isOutgoing, onRetry }) {
  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      data-testid={`message-bubble-${message.id || message.clientMessageId}`}
      className={`flex flex-col mb-3 ${isOutgoing ? "items-end" : "items-start"}`}
    >
      <div
        className={`relative max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-md break-words ${
          isOutgoing
            ? "bg-gradient-to-br from-[#8B1E3F] to-[#5C142B] text-[#F8EDEB] rounded-br-xs border border-[#F2B6C2]/20"
            : "bg-[#2A1620] text-[#F8EDEB] rounded-bl-xs border border-[#F2B6C2]/15 shadow-sm"
        }`}
      >
        {/* Message Text (safe string rendering) */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap select-text">
          {message.text}
        </p>

        {/* Footer: Timestamp and Status */}
        <div
          className={`flex items-center gap-1.5 mt-1 text-[10px] ${
            isOutgoing ? "justify-end text-[#FDE7E9]/75" : "justify-start text-[#F2B6C2]/70"
          }`}
        >
          {formattedTime && <span>{formattedTime}</span>}

          {isOutgoing && (
            <>
              {message.isFailed ? (
                <button
                  type="button"
                  onClick={() => onRetry && onRetry(message)}
                  className="flex items-center gap-1 text-rose-300 hover:text-white"
                  title="Retry sending"
                  aria-label="Retry sending"
                >
                  <AlertCircle size={12} />
                  <span>Retry</span>
                </button>
              ) : message.isPending ? (
                <span className="italic opacity-70">Sending…</span>
              ) : message.isRead || message.readAt ? (
                <span className="flex items-center gap-0.5 text-[#D4AF97]" title="Read">
                  <CheckCheck size={13} />
                  <span className="sr-only">Read</span>
                </span>
              ) : (
                <span className="flex items-center gap-0.5 opacity-80" title="Sent">
                  <Check size={13} />
                  <span className="sr-only">Sent</span>
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
