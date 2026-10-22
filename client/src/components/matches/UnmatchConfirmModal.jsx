import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, UserX } from "lucide-react";

/**
 * UnmatchConfirmModal
 *
 * Prompts user for explicit confirmation before ending a mutual match connection.
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {function} onConfirm
 * @param {string} partnerName
 * @param {boolean} loading
 */
export default function UnmatchConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  partnerName = "this person",
  loading = false,
}) {
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 100);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unmatch-title"
        aria-describedby="unmatch-desc"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => !loading && onClose()}
          aria-hidden="true"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm rounded-2xl border border-[#F2B6C2]/20 bg-[#1A0F13] p-6 text-center shadow-2xl z-10"
          style={{
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(58, 13, 26, 0.5)",
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Close unmatch dialog"
            className="absolute top-4 right-4 text-[#F2B6C2]/60 hover:text-[#F2B6C2] transition-colors"
          >
            <X size={18} />
          </button>

          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#8B1E3F]/20 text-[#F2B6C2] border border-[#8B1E3F]/40">
            <UserX size={24} />
          </div>

          <h3
            id="unmatch-title"
            className="text-lg font-serif font-bold text-[#FDE7E9] mb-2"
          >
            Unmatch {partnerName}?
          </h3>

          <p id="unmatch-desc" className="text-sm text-[#F2B6C2]/75 mb-6">
            You’ll no longer see this connection in your Matches.
          </p>

          <div className="flex gap-3">
            <button
              ref={cancelBtnRef}
              type="button"
              id="unmatch-cancel-btn"
              onClick={onClose}
              disabled={loading}
              className="flex-1 btn-ghost py-2.5 px-4 rounded-xl text-sm border border-[#F2B6C2]/20 hover:border-[#F2B6C2]/40 text-[#F8EDEB]"
            >
              Cancel
            </button>
            <button
              type="button"
              id="unmatch-confirm-btn"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#8B1E3F] hover:bg-[#A32349] text-white transition-colors disabled:opacity-50"
            >
              {loading ? "Unmatching..." : "Unmatch"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
