import React, { useState, useRef } from "react";
import { Send } from "lucide-react";

/**
 * MessageComposer
 * Accessible text input with keyboard submission and draft preservation.
 *
 * @param {function} onSend - ({ text }) => Promise<void>
 * @param {boolean} disabled
 */
export default function MessageComposer({ onSend, disabled = false }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;

    setSending(true);
    try {
      await onSend({ text: trimmed });
      setText("");
      // Reset textarea height if resized
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      // Draft remains intact in textarea so user doesn't lose text
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 sm:p-4 border-t border-[rgba(242,182,194,0.15)] bg-[#1A0F13]/95 flex items-end gap-2"
    >
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a tender message…"
          maxLength={2000}
          rows={1}
          disabled={disabled || sending}
          aria-label="Message text"
          className="w-full resize-none rounded-2xl bg-white/5 border border-[#F2B6C2]/20 py-2.5 px-4 text-sm text-[#F8EDEB] placeholder-[#F2B6C2]/45 focus:outline-none focus:border-[#F2B6C2]/60 focus:ring-1 focus:ring-[#F2B6C2]/40 transition-all max-h-32"
          style={{ minHeight: "44px" }}
        />
        {text.length > 1500 && (
          <span className="absolute right-3 bottom-1.5 text-[10px] text-[#F2B6C2]/60">
            {text.length} / {2000}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={disabled || sending || !text.trim()}
        aria-label="Send message"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#8B1E3F] to-[#A32349] hover:from-[#A32349] hover:to-[#B82B54] text-white shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <Send size={18} />
      </button>
    </form>
  );
}
