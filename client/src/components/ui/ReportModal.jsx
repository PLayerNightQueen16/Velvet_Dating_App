import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X, CheckCircle, AlertCircle } from "lucide-react";
import { submitReport, blockUser } from "../../services/api";

const REASONS = [
  { value: "harassment", label: "Harassment or abusive behavior" },
  { value: "fake_profile", label: "Fake or misleading profile" },
  { value: "inappropriate_content", label: "Inappropriate content or photos" },
  { value: "spam", label: "Spam or scam" },
  { value: "underage", label: "Underage user" },
  { value: "safety_concerns", label: "Threats or safety concerns" },
  { value: "other", label: "Other issue" },
];

/**
 * ReportModal
 * Confidential user reporting flow with validation, optional block, and safe feedback.
 */
export default function ReportModal({
  isOpen,
  onClose,
  targetUser,
  onReportSuccess,
}) {
  const [reason, setReason] = useState("harassment");
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason("harassment");
      setDetails("");
      setAlsoBlock(false);
      setError(null);
      setSubmitted(false);
    }
  }, [isOpen]);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError("Please select a reason for reporting.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await submitReport(targetUser.id || targetUser._id, {
        reason,
        details: details.trim(),
      });

      if (alsoBlock) {
        try {
          await blockUser(targetUser.id || targetUser._id);
        } catch (blockErr) {
          console.warn("Optional block failed:", blockErr.message);
        }
      }

      setSubmitted(true);
      if (onReportSuccess) {
        onReportSuccess({ targetId: targetUser.id || targetUser._id, alsoBlock });
      }

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Report submission error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to submit report. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
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
          className="relative w-full max-w-lg rounded-2xl border border-[#F2B6C2]/20 bg-[#1A0F13] p-6 shadow-2xl z-10 overflow-hidden"
          style={{
            boxShadow:
              "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 35px rgba(58, 13, 26, 0.6)",
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close report modal"
            className="absolute top-4 right-4 text-[#F2B6C2]/60 hover:text-[#F2B6C2] transition-colors p-1 rounded-lg"
          >
            <X size={18} />
          </button>

          {submitted ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#FDE7E9] mb-2">
                Report Submitted
              </h3>
              <p className="text-sm text-[#F2B6C2]/80 max-w-sm mx-auto">
                Thank you for helping keep VELVET safe and tender. Your report is
                confidential and will be reviewed by our safety team.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8B1E3F]/20 border border-[#8B1E3F]/40 text-[#F2B6C2]">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3
                    id="report-modal-title"
                    className="text-lg font-serif font-bold text-[#FDE7E9]"
                  >
                    Report {targetUser.name || "User"}
                  </h3>
                  <p className="text-xs text-[#F2B6C2]/60">
                    Your report is strictly private and anonymous to this person.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="report-reason"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#F2B6C2]/80 mb-1.5"
                  >
                    Reason for report
                  </label>
                  <select
                    id="report-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl bg-[#2D0B14]/60 border border-[#F2B6C2]/20 px-3.5 py-2.5 text-sm text-[#F8EDEB] focus:border-[#F2B6C2]/60 focus:outline-none transition-colors"
                  >
                    {REASONS.map((r) => (
                      <option
                        key={r.value}
                        value={r.value}
                        className="bg-[#1A0F13] text-[#F8EDEB]"
                      >
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label
                      htmlFor="report-details"
                      className="text-xs font-semibold uppercase tracking-wider text-[#F2B6C2]/80"
                    >
                      Additional details (optional)
                    </label>
                    <span className="text-[11px] text-[#F2B6C2]/50">
                      {details.length} / 1000
                    </span>
                  </div>
                  <textarea
                    id="report-details"
                    rows={4}
                    value={details}
                    onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
                    disabled={loading}
                    placeholder="Provide any context that helps our safety team understand what occurred..."
                    className="w-full rounded-xl bg-[#2D0B14]/60 border border-[#F2B6C2]/20 p-3 text-sm text-[#F8EDEB] placeholder-[#F2B6C2]/30 focus:border-[#F2B6C2]/60 focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="report-also-block"
                    checked={alsoBlock}
                    onChange={(e) => setAlsoBlock(e.target.checked)}
                    disabled={loading}
                    className="mt-1 h-4 w-4 rounded border-[#F2B6C2]/30 bg-[#2D0B14] text-[#8B1E3F] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label
                    htmlFor="report-also-block"
                    className="text-xs text-[#F2B6C2]/80 cursor-pointer leading-relaxed"
                  >
                    Also block {targetUser.name || "this user"} immediately so
                    they cannot see your profile, send likes, or message you.
                  </label>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border border-[#F2B6C2]/20 text-[#F8EDEB] hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#8B1E3F] hover:bg-[#A32349] text-white shadow-lg shadow-[#8B1E3F]/40 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
