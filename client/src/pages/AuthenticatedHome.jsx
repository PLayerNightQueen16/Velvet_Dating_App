import { motion } from "framer-motion";
import { LogOut, ShieldCheck, User, Mail, AtSign, Calendar, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * AuthenticatedHome — Protected route view for verifying Batch 2 authentication.
 * Displays real authenticated account identity retrieved from MongoDB via /api/auth/me.
 * No dummy profiles, fake photos, or seeded matches.
 */
export default function AuthenticatedHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Today";

  return (
    <div className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-xl mx-auto"
      >
        <div
          className="rounded-3xl p-8 md:p-10 backdrop-blur-2xl border"
          style={{
            background: "rgba(58, 13, 26, 0.45)",
            borderColor: "rgba(242, 182, 194, 0.2)",
            boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(139, 30, 63, 0.25)",
          }}
        >
          {/* Header Status */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-[rgba(242,182,194,0.15)]">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #8B1E3F 0%, #3A0D1A 100%)",
                  border: "1px solid rgba(242, 182, 194, 0.3)",
                }}
              >
                <ShieldCheck size={26} style={{ color: "#F2B6C2" }} />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest font-semibold text-[#D4AF97] flex items-center gap-1.5">
                  <Sparkles size={13} />
                  Authenticated Session
                </span>
                <h1 className="font-display text-2xl font-semibold text-[#F8EDEB]">
                  Welcome, {user?.name}
                </h1>
              </div>
            </div>

            <button
              onClick={handleLogout}
              id="btn-signout"
              className="px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 flex items-center gap-2 border hover:bg-[#8B1E3F]/40"
              style={{
                color: "#F2B6C2",
                borderColor: "rgba(242, 182, 194, 0.25)",
                background: "rgba(26, 15, 19, 0.6)",
              }}
              aria-label="Sign out of VELVET"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>

          {/* Account Details Card */}
          <div className="space-y-4 mb-8">
            <h2 className="text-xs uppercase tracking-wider text-[#D4AF97] font-semibold">
              Verified MongoDB Account Identity
            </h2>

            <div
              className="p-5 rounded-2xl space-y-3.5 border"
              style={{
                background: "rgba(26, 15, 19, 0.55)",
                borderColor: "rgba(242, 182, 194, 0.12)",
              }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2.5 text-[#F2B6C2]/70">
                  <User size={16} /> Name
                </span>
                <span className="font-medium text-[#F8EDEB]">{user?.name}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2.5 text-[#F2B6C2]/70">
                  <AtSign size={16} /> Username
                </span>
                <span className="font-medium text-[#F8EDEB]">@{user?.username}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2.5 text-[#F2B6C2]/70">
                  <Mail size={16} /> Email Address
                </span>
                <span className="font-medium text-[#F8EDEB]">{user?.email}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2.5 text-[#F2B6C2]/70">
                  <Calendar size={16} /> Member Since
                </span>
                <span className="font-medium text-[#F8EDEB]">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Architecture info callout */}
          <div
            className="p-4 rounded-xl text-xs leading-relaxed border"
            style={{
              background: "rgba(139, 30, 63, 0.15)",
              borderColor: "rgba(242, 182, 194, 0.2)",
              color: "#FDE7E9",
            }}
          >
            <p className="font-medium text-[#D4AF97] mb-1">
              🌹 Batch 2 Authentication Verified
            </p>
            <p className="text-[#F8EDEB]/80">
              Your session is securely authenticated via HTTP-only JWT cookies. Session automatically restores on refresh. Profile onboarding, photo management, and compatibility matching will be built in Batch 3.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
