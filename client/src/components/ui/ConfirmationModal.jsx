import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

/**
 * Reusable accessible ConfirmationModal for destructive or sensitive actions.
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {function} onConfirm
 * @param {string} title
 * @param {string|React.ReactNode} description
 * @param {string} confirmLabel
 * @param {string} cancelLabel
 * @param {boolean} isDestructive
 * @param {boolean} loading
 * @param {React.ReactNode} icon
 * @param {React.ReactNode} children - optional extra inputs (e.g. password, confirmation phrase)
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = true,
  loading = false,
  icon,
  children,
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
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => !loading && onClose()}
          aria-hidden="true"
        />

        {/* Modal card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md rounded-2xl border border-[#F2B6C2]/20 bg-[#1A0F13] p-6 text-center shadow-2xl z-10 overflow-hidden"
          style={{
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 35px rgba(58, 13, 26, 0.6)",
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            className="absolute top-4 right-4 text-[#F2B6C2]/60 hover:text-[#F2B6C2] transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <X size={18} />
          </button>

          {/* Icon */}
          <div
            className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border ${
              isDestructive
                ? "bg-[#8B1E3F]/20 text-[#F2B6C2] border-[#8B1E3F]/40"
                : "bg-[#D4AF97]/20 text-[#D4AF97] border-[#D4AF97]/40"
            }`}
          >
            {icon || <AlertTriangle size={24} />}
          </div>

          {/* Title */}
          <h3
            id="confirm-modal-title"
            className="text-xl font-serif font-bold text-[#FDE7E9] mb-2"
          >
            {title}
          </h3>

          {/* Description */}
          <div id="confirm-modal-desc" className="text-sm text-[#F2B6C2]/75 mb-6 text-left leading-relaxed">
            {typeof description === "string" ? <p className="text-center">{description}</p> : description}
          </div>

          {/* Optional custom children (e.g. form inputs) */}
          {children && <div className="mb-6 text-left">{children}</div>}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border border-[#F2B6C2]/20 hover:border-[#F2B6C2]/40 text-[#F8EDEB] hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                isDestructive
                  ? "bg-[#8B1E3F] hover:bg-[#A32349] text-white shadow-lg shadow-[#8B1E3F]/40"
                  : "bg-gradient-to-r from-[#8B1E3F] to-[#5C1329] hover:from-[#A32349] hover:to-[#731833] text-white"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
