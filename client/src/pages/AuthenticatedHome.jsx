import { motion } from "framer-motion";
import {
  LogOut, User, Mail, AtSign, Calendar, Sparkles, Edit3, Heart, Camera,
  CheckCircle, AlertCircle, MapPin, Briefcase, BookOpen,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

/**
 * AuthenticatedHome — post-onboarding dashboard.
 * Shows the authenticated user's profile summary with quick navigation.
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
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "Today";

  const primaryPhoto = user?.photos?.find(p => p.isPrimary) || user?.photos?.[0];
  const isComplete = user?.profileCompleted;

  return (
    <div className="min-h-screen pt-28 pb-16 px-4 flex items-start justify-center relative z-10">
      <div className="w-full max-w-2xl mx-auto space-y-5">

        {/* Profile hero card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="rounded-3xl overflow-hidden backdrop-blur-2xl border"
          style={{
            background: "rgba(58, 13, 26, 0.45)",
            borderColor: "rgba(242, 182, 194, 0.18)",
            boxShadow: "0 32px 96px rgba(0,0,0,0.6), 0 0 48px rgba(139,30,63,0.2)",
          }}
        >
          {/* Top gradient banner */}
          <div className="h-28 relative" style={{ background: "linear-gradient(135deg, #3A0D1A 0%, #8B1E3F 60%, #D4AF97 100%)" }}>
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgba(242,182,194,0.4) 0%, transparent 60%)" }} />
          </div>

          <div className="px-8 pb-8">
            {/* Avatar + actions row */}
            <div className="flex items-end justify-between -mt-14 mb-5">
              {primaryPhoto ? (
                <img src={primaryPhoto.url} alt={user?.name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 shadow-2xl"
                  style={{ borderColor: "#1A0F13" }} />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-4 flex items-center justify-center shadow-2xl"
                  style={{ background: "linear-gradient(135deg, #8B1E3F 0%, #3A0D1A 100%)", borderColor: "#1A0F13" }}>
                  <User size={36} style={{ color: "#F2B6C2" }} />
                </div>
              )}
              <div className="flex items-center gap-3 pb-1">
                <Link to="/profile/edit" id="btn-edit-profile"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 hover:bg-[#3A0D1A]/60"
                  style={{ color: "#F2B6C2", borderColor: "rgba(242,182,194,0.25)", background: "rgba(26,15,19,0.5)" }}>
                  <Edit3 size={13} /> Edit Profile
                </Link>
                <button onClick={handleLogout} id="btn-signout"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200 hover:bg-[#8B1E3F]/30"
                  style={{ color: "#F2B6C2", borderColor: "rgba(242,182,194,0.2)", background: "rgba(26,15,19,0.4)" }}>
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            </div>

            {/* Name and status */}
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-display text-2xl font-semibold text-[#F8EDEB]">{user?.name}</h1>
                {isComplete ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-400/20">
                    <CheckCircle size={10} /> Complete
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#8B1E3F]/25 text-[#F2B6C2] border border-[#F2B6C2]/20">
                    <AlertCircle size={10} /> Incomplete
                  </span>
                )}
              </div>
              <p className="text-sm text-[#F2B6C2]/60">@{user?.username}</p>
            </div>

            {/* Bio */}
            {user?.bio && (
              <p className="text-sm text-[#F8EDEB]/80 leading-relaxed mb-5 italic">
                "{user.bio}"
              </p>
            )}

            {/* Quick info row */}
            <div className="flex flex-wrap gap-3">
              {user?.location && (
                <div className="flex items-center gap-1.5 text-xs text-[#F2B6C2]/70">
                  <MapPin size={12} className="text-[#D4AF97]" /> {user.location}
                </div>
              )}
              {user?.occupation && (
                <div className="flex items-center gap-1.5 text-xs text-[#F2B6C2]/70">
                  <Briefcase size={12} className="text-[#D4AF97]" /> {user.occupation}
                </div>
              )}
              {user?.education && (
                <div className="flex items-center gap-1.5 text-xs text-[#F2B6C2]/70">
                  <BookOpen size={12} className="text-[#D4AF97]" /> {user.education}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-[#F2B6C2]/70">
                <Calendar size={12} className="text-[#D4AF97]" /> Member since {formattedDate}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Photos grid */}
        {user?.photos?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl p-6 backdrop-blur-xl border"
            style={{ background: "rgba(58,13,26,0.4)", borderColor: "rgba(242,182,194,0.15)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#F8EDEB] flex items-center gap-2">
                <Camera size={15} className="text-[#F2B6C2]" /> Photos
                <span className="text-xs text-[#D4AF97]">({user.photos.length}/5)</span>
              </h2>
              <Link to="/profile/edit" className="text-xs text-[#F2B6C2]/60 hover:text-[#F2B6C2] transition-colors">Manage →</Link>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {user.photos.map(photo => (
                <div key={photo._id} className="aspect-square rounded-xl overflow-hidden border relative"
                  style={{ borderColor: photo.isPrimary ? "rgba(212,175,151,0.6)" : "rgba(242,182,194,0.15)" }}>
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Interests */}
        {user?.interests?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl p-6 backdrop-blur-xl border"
            style={{ background: "rgba(58,13,26,0.4)", borderColor: "rgba(242,182,194,0.15)" }}>
            <h2 className="text-sm font-semibold text-[#F8EDEB] flex items-center gap-2 mb-4">
              <Heart size={15} className="text-[#F2B6C2]" /> Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {user.interests.map(interest => (
                <span key={interest} className="px-3 py-1.5 rounded-full text-xs border"
                  style={{ background: "rgba(139,30,63,0.3)", borderColor: "rgba(242,182,194,0.25)", color: "#FDE7E9" }}>
                  {interest}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Prompts */}
        {user?.prompts?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl p-6 backdrop-blur-xl border space-y-3"
            style={{ background: "rgba(58,13,26,0.4)", borderColor: "rgba(242,182,194,0.15)" }}>
            <h2 className="text-sm font-semibold text-[#F8EDEB] flex items-center gap-2 mb-1">
              <Sparkles size={15} className="text-[#F2B6C2]" /> Prompts
            </h2>
            {user.prompts.map((p, i) => (
              <div key={i} className="p-4 rounded-xl border"
                style={{ background: "rgba(26,15,19,0.45)", borderColor: "rgba(242,182,194,0.12)" }}>
                <p className="text-[11px] uppercase tracking-wider text-[#D4AF97] font-semibold mb-1.5">{p.prompt}</p>
                <p className="text-sm text-[#F8EDEB]/80">{p.answer}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Account details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl p-6 backdrop-blur-xl border"
          style={{ background: "rgba(58,13,26,0.4)", borderColor: "rgba(242,182,194,0.15)" }}>
          <h2 className="text-xs uppercase tracking-wider text-[#D4AF97] font-semibold mb-4">Account</h2>
          <div className="space-y-3">
            {[
              { icon: User, label: "Name", value: user?.name },
              { icon: AtSign, label: "Username", value: `@${user?.username}` },
              { icon: Mail, label: "Email", value: user?.email },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-[#F2B6C2]/60"><Icon size={14} /> {label}</span>
                <span className="font-medium text-[#F8EDEB]">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Incomplete profile nudge */}
        {!isComplete && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl p-5 border flex items-start gap-4"
            style={{ background: "rgba(139,30,63,0.18)", borderColor: "rgba(242,182,194,0.2)" }}>
            <AlertCircle size={18} className="text-[#F2B6C2] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#F8EDEB] mb-1">Profile Incomplete</p>
              <p className="text-xs text-[#F2B6C2]/70 mb-3">Complete your profile to start discovering matches on VELVET.</p>
              <Link to="/onboarding"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg"
                style={{ background: "linear-gradient(135deg, #8B1E3F, #5C1228)", color: "#FDE7E9" }}>
                Finish Setup <Sparkles size={12} />
              </Link>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
