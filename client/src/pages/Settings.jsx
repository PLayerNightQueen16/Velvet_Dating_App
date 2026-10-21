import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  KeyRound,
  UserX,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getPrivacySettings,
  updatePrivacySettings,
  changePassword,
  getBlockedUsers,
  unblockUser,
  deleteAccount,
} from "../services/api";
import ConfirmationModal from "../components/ui/ConfirmationModal";

export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("privacy");

  // ── Privacy State ───────────────────────────────────────────────────────────
  const [privacy, setPrivacy] = useState({
    discoverable: true,
    showOnlineStatus: true,
    showLastActive: true,
  });
  const [loadingPrivacy, setLoadingPrivacy] = useState(true);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [privacySuccess, setPrivacySuccess] = useState(false);
  const [privacyError, setPrivacyError] = useState(null);

  // ── Security / Password State ───────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState(null);

  // ── Blocked Users State ─────────────────────────────────────────────────────
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [blocksError, setBlocksError] = useState(null);
  const [userToUnblock, setUserToUnblock] = useState(null);
  const [unblocking, setUnblocking] = useState(false);

  // ── Account Deletion State ──────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Load privacy settings
  const loadPrivacy = async () => {
    try {
      setLoadingPrivacy(true);
      setPrivacyError(null);
      const res = await getPrivacySettings();
      if (res?.success && res?.privacy) {
        setPrivacy(res.privacy);
      }
    } catch (err) {
      console.error("Failed to load privacy settings:", err);
      setPrivacyError("Could not retrieve privacy settings. Please try again.");
    } finally {
      setLoadingPrivacy(false);
    }
  };

  // Load blocked users
  const loadBlocks = async () => {
    try {
      setLoadingBlocks(true);
      setBlocksError(null);
      const res = await getBlockedUsers();
      if (res?.success && res?.data?.blockedUsers) {
        setBlockedUsers(res.data.blockedUsers);
      }
    } catch (err) {
      console.error("Failed to load blocked users:", err);
      setBlocksError("Could not retrieve blocked users list. Please try again.");
    } finally {
      setLoadingBlocks(false);
    }
  };

  useEffect(() => {
    loadPrivacy();
  }, []);

  useEffect(() => {
    if (activeTab === "blocked") {
      loadBlocks();
    }
  }, [activeTab]);

  // Handle Privacy Save
  const handleSavePrivacy = async (e) => {
    e.preventDefault();
    try {
      setSavingPrivacy(true);
      setPrivacyError(null);
      setPrivacySuccess(false);

      const res = await updatePrivacySettings(privacy);
      if (res?.success && res?.privacy) {
        setPrivacy(res.privacy);
        updateUser((prev) => ({ ...prev, privacy: res.privacy }));
        setPrivacySuccess(true);
        setTimeout(() => setPrivacySuccess(false), 4000);
      }
    } catch (err) {
      console.error("Privacy update error:", err);
      setPrivacyError(
        err.response?.data?.message || "Failed to update privacy settings."
      );
    } finally {
      setSavingPrivacy(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    if (!currentPassword) {
      setPassError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setPassError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPassError("New password cannot be the same as your current password.");
      return;
    }

    try {
      setChangingPass(true);
      const res = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res?.success) {
        setPassSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPassSuccess(false), 5000);
      }
    } catch (err) {
      console.error("Change password error:", err);
      setPassError(
        err.response?.data?.message || "Failed to update password."
      );
    } finally {
      setChangingPass(false);
    }
  };

  // Handle Unblock Action
  const handleConfirmUnblock = async () => {
    if (!userToUnblock) return;
    try {
      setUnblocking(true);
      await unblockUser(userToUnblock.id);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userToUnblock.id));
      setUserToUnblock(null);
    } catch (err) {
      console.error("Unblock user error:", err);
      alert("Failed to unblock user. Please try again.");
    } finally {
      setUnblocking(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim() !== "DELETE") {
      setDeleteError("Please type DELETE to confirm.");
      return;
    }

    if (!deletePassword) {
      setDeleteError("Please enter your account password to confirm.");
      return;
    }

    try {
      setDeleting(true);
      setDeleteError(null);

      await deleteAccount({
        password: deletePassword,
        confirmation: deleteConfirmationText.trim(),
      });

      setShowDeleteModal(false);
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Delete account error:", err);
      setDeleteError(
        err.response?.data?.message ||
          "Failed to delete account. Please verify your password and try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <span className="text-xs uppercase tracking-widest text-[#F2B6C2]/70 font-semibold">
          Account Sanctuary
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#FDE7E9] mt-1">
          Settings & Privacy
        </h1>
        <p className="text-sm text-[#F2B6C2]/80 mt-1 max-w-xl">
          Control your romantic discoverability, account security, and sanctuary
          boundaries with complete peace of mind.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#F2B6C2]/20 mb-8 overflow-x-auto no-scrollbar gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("privacy")}
          className={`flex items-center gap-2 py-3 px-4 font-serif text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === "privacy"
              ? "border-[#F2B6C2] text-[#FDE7E9] bg-white/5 rounded-t-xl"
              : "border-transparent text-[#F2B6C2]/60 hover:text-[#FDE7E9] hover:bg-white/[0.02]"
          }`}
        >
          <Shield size={16} />
          <span>Privacy & Discovery</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 py-3 px-4 font-serif text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === "security"
              ? "border-[#F2B6C2] text-[#FDE7E9] bg-white/5 rounded-t-xl"
              : "border-transparent text-[#F2B6C2]/60 hover:text-[#FDE7E9] hover:bg-white/[0.02]"
          }`}
        >
          <KeyRound size={16} />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("blocked")}
          className={`flex items-center gap-2 py-3 px-4 font-serif text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === "blocked"
              ? "border-[#F2B6C2] text-[#FDE7E9] bg-white/5 rounded-t-xl"
              : "border-transparent text-[#F2B6C2]/60 hover:text-[#FDE7E9] hover:bg-white/[0.02]"
          }`}
        >
          <UserX size={16} />
          <span>Blocked Users ({blockedUsers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-2 py-3 px-4 font-serif text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === "account"
              ? "border-rose-400 text-rose-300 bg-rose-950/20 rounded-t-xl"
              : "border-transparent text-[#F2B6C2]/60 hover:text-rose-300 hover:bg-white/[0.02]"
          }`}
        >
          <Trash2 size={16} />
          <span>Account Deletion</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-[#1A0F13]/80 border border-[#F2B6C2]/20 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
        {/* ── 1. PRIVACY TAB ─────────────────────────────────────────────── */}
        {activeTab === "privacy" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-serif font-bold text-[#FDE7E9]">
                Privacy & Discoverability
              </h2>
              <p className="text-xs text-[#F2B6C2]/70 mt-1">
                Decide when and how your profile appears to other members on VELVET.
              </p>
            </div>

            {loadingPrivacy ? (
              <div className="py-12 flex justify-center items-center gap-3 text-[#F2B6C2]/60">
                <span className="w-5 h-5 border-2 border-[#F2B6C2]/30 border-t-[#F2B6C2] rounded-full animate-spin" />
                <span>Loading privacy settings...</span>
              </div>
            ) : (
              <form onSubmit={handleSavePrivacy} className="space-y-6">
                {privacySuccess && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-sm">
                    <CheckCircle size={18} className="shrink-0" />
                    <span>Privacy preferences saved successfully.</span>
                  </div>
                )}

                {privacyError && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{privacyError}</span>
                  </div>
                )}

                {/* Discoverability Toggle */}
                <div className="flex items-start justify-between p-4 rounded-xl bg-[#2D0B14]/40 border border-[#F2B6C2]/10 hover:border-[#F2B6C2]/20 transition-colors">
                  <div className="pr-4">
                    <label
                      htmlFor="discoverable-toggle"
                      className="font-serif font-semibold text-[#FDE7E9] text-base cursor-pointer"
                    >
                      Show my profile in Discovery feed
                    </label>
                    <p className="text-xs text-[#F2B6C2]/75 mt-1 leading-relaxed">
                      When active, eligible matches can discover your profile and send
                      likes. Turning this off hides you from new discovery and new likes.
                      Existing matches and ongoing chats remain accessible.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="discoverable-toggle"
                    role="switch"
                    aria-checked={privacy.discoverable}
                    onClick={() =>
                      setPrivacy((prev) => ({
                        ...prev,
                        discoverable: !prev.discoverable,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      privacy.discoverable ? "bg-[#8B1E3F]" : "bg-neutral-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#F8EDEB] shadow ring-0 transition duration-200 ease-in-out ${
                        privacy.discoverable ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Online Status Toggle */}
                <div className="flex items-start justify-between p-4 rounded-xl bg-[#2D0B14]/40 border border-[#F2B6C2]/10 hover:border-[#F2B6C2]/20 transition-colors">
                  <div className="pr-4">
                    <label
                      htmlFor="online-status-toggle"
                      className="font-serif font-semibold text-[#FDE7E9] text-base cursor-pointer"
                    >
                      Show online presence
                    </label>
                    <p className="text-xs text-[#F2B6C2]/75 mt-1 leading-relaxed">
                      Displays a subtle indicator when you are actively using VELVET.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="online-status-toggle"
                    role="switch"
                    aria-checked={privacy.showOnlineStatus}
                    onClick={() =>
                      setPrivacy((prev) => ({
                        ...prev,
                        showOnlineStatus: !prev.showOnlineStatus,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      privacy.showOnlineStatus ? "bg-[#8B1E3F]" : "bg-neutral-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#F8EDEB] shadow ring-0 transition duration-200 ease-in-out ${
                        privacy.showOnlineStatus ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Last Active Toggle */}
                <div className="flex items-start justify-between p-4 rounded-xl bg-[#2D0B14]/40 border border-[#F2B6C2]/10 hover:border-[#F2B6C2]/20 transition-colors">
                  <div className="pr-4">
                    <label
                      htmlFor="last-active-toggle"
                      className="font-serif font-semibold text-[#FDE7E9] text-base cursor-pointer"
                    >
                      Show last active timestamp
                    </label>
                    <p className="text-xs text-[#F2B6C2]/75 mt-1 leading-relaxed">
                      Allows mutual matches to see when you were recently active.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="last-active-toggle"
                    role="switch"
                    aria-checked={privacy.showLastActive}
                    onClick={() =>
                      setPrivacy((prev) => ({
                        ...prev,
                        showLastActive: !prev.showLastActive,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      privacy.showLastActive ? "bg-[#8B1E3F]" : "bg-neutral-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#F8EDEB] shadow ring-0 transition duration-200 ease-in-out ${
                        privacy.showLastActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPrivacy}
                    className="py-2.5 px-6 rounded-xl font-semibold text-sm bg-[#8B1E3F] hover:bg-[#A32349] text-white shadow-lg shadow-[#8B1E3F]/30 transition-all disabled:opacity-50"
                  >
                    {savingPrivacy ? "Saving Settings..." : "Save Privacy Preferences"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── 2. SECURITY TAB ────────────────────────────────────────────── */}
        {activeTab === "security" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-serif font-bold text-[#FDE7E9]">
                Password & Authentication
              </h2>
              <p className="text-xs text-[#F2B6C2]/70 mt-1">
                Protect your account with a strong, secure passphrase. Updating your
                password will securely rotate your session.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              {passSuccess && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-sm">
                  <CheckCircle size={18} className="shrink-0" />
                  <span>Password updated successfully.</span>
                </div>
              )}

              {passError && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label
                  htmlFor="current-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#F2B6C2]/80 mb-1"
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="current-password"
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={changingPass}
                    placeholder="Enter your current password"
                    className="w-full rounded-xl bg-[#2D0B14]/60 border border-[#F2B6C2]/20 px-3.5 py-2.5 pr-10 text-sm text-[#F8EDEB] placeholder-[#F2B6C2]/30 focus:border-[#F2B6C2]/60 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-3 text-[#F2B6C2]/50 hover:text-[#F2B6C2]"
                    aria-label={showCurrentPass ? "Hide password" : "Show password"}
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#F2B6C2]/80 mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={changingPass}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl bg-[#2D0B14]/60 border border-[#F2B6C2]/20 px-3.5 py-2.5 pr-10 text-sm text-[#F8EDEB] placeholder-[#F2B6C2]/30 focus:border-[#F2B6C2]/60 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-3 text-[#F2B6C2]/50 hover:text-[#F2B6C2]"
                    aria-label={showNewPass ? "Hide password" : "Show password"}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#F2B6C2]/80 mb-1"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={changingPass}
                    placeholder="Re-type new password"
                    className="w-full rounded-xl bg-[#2D0B14]/60 border border-[#F2B6C2]/20 px-3.5 py-2.5 pr-10 text-sm text-[#F8EDEB] placeholder-[#F2B6C2]/30 focus:border-[#F2B6C2]/60 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-3 text-[#F2B6C2]/50 hover:text-[#F2B6C2]"
                    aria-label={showConfirmPass ? "Hide password" : "Show password"}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={changingPass}
                  className="py-2.5 px-6 rounded-xl font-semibold text-sm bg-[#8B1E3F] hover:bg-[#A32349] text-white shadow-lg shadow-[#8B1E3F]/30 transition-all disabled:opacity-50"
                >
                  {changingPass ? "Updating Password..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── 3. BLOCKED USERS TAB ────────────────────────────────────────── */}
        {activeTab === "blocked" && (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#FDE7E9]">
                  Blocked Sanctuary
                </h2>
                <p className="text-xs text-[#F2B6C2]/70 mt-1">
                  Profiles you have blocked cannot discover you, view your profile, or
                  send you messages.
                </p>
              </div>
              <button
                type="button"
                onClick={loadBlocks}
                disabled={loadingBlocks}
                className="flex items-center gap-1.5 text-xs text-[#F2B6C2]/70 hover:text-[#FDE7E9] self-start sm:self-auto"
              >
                <RotateCcw size={14} className={loadingBlocks ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingBlocks ? (
              <div className="py-12 flex justify-center items-center gap-3 text-[#F2B6C2]/60">
                <span className="w-5 h-5 border-2 border-[#F2B6C2]/30 border-t-[#F2B6C2] rounded-full animate-spin" />
                <span>Loading blocked profiles...</span>
              </div>
            ) : blocksError ? (
              <div className="p-6 text-center">
                <p className="text-sm text-rose-300 mb-3">{blocksError}</p>
                <button
                  type="button"
                  onClick={loadBlocks}
                  className="py-2 px-4 rounded-xl text-xs font-semibold bg-[#8B1E3F] text-white"
                >
                  Retry Loading
                </button>
              </div>
            ) : blockedUsers.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#8B1E3F]/20 text-[#F2B6C2] border border-[#8B1E3F]/30">
                  <Sparkles size={22} />
                </div>
                <h3 className="font-serif font-semibold text-[#FDE7E9] text-base mb-1">
                  Your Sanctuary is Peaceful
                </h3>
                <p className="text-xs text-[#F2B6C2]/70 max-w-sm mx-auto">
                  You have not blocked anyone. You can block any profile anytime
                  from their profile card or chat header.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F2B6C2]/10">
                {blockedUsers.map((person) => (
                  <div
                    key={person.id}
                    className="py-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-neutral-900 border border-[#F2B6C2]/30 shrink-0">
                        {person.photoUrl ? (
                          <img
                            src={person.photoUrl}
                            alt={person.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-sm font-serif font-bold text-[#F2B6C2]">
                            {person.name?.[0] || "?"}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-serif font-semibold text-[#FDE7E9] text-sm">
                          {person.name}
                          {person.age ? `, ${person.age}` : ""}
                        </h4>
                        <p className="text-xs text-[#F2B6C2]/50">
                          @{person.username || "user"} • Blocked on{" "}
                          {person.blockedAt
                            ? new Date(person.blockedAt).toLocaleDateString()
                            : "recently"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUserToUnblock(person)}
                      className="py-1.5 px-3.5 rounded-lg text-xs font-medium border border-[#F2B6C2]/30 text-[#F8EDEB] hover:bg-white/5 transition-colors"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 4. ACCOUNT DELETION TAB ─────────────────────────────────────── */}
        {activeTab === "account" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-serif font-bold text-rose-300">
                Permanent Account Deletion
              </h2>
              <p className="text-xs text-[#F2B6C2]/70 mt-1">
                Permanently delete your profile, photos, matches, and messages.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-200 text-sm space-y-3 mb-6">
              <div className="flex items-center gap-2 font-semibold text-rose-300">
                <AlertCircle size={18} />
                <span>This action cannot be undone.</span>
              </div>
              <p className="text-xs text-rose-200/80 leading-relaxed">
                By deleting your account:
              </p>
              <ul className="list-disc list-inside text-xs text-rose-200/80 space-y-1 pl-1">
                <li>Your profile and photos will be removed from Cloudinary and MongoDB.</li>
                <li>All active matches will be permanently deactivated.</li>
                <li>All direct chat history and messages will be permanently deleted.</li>
                <li>Your incoming and outgoing likes will be wiped.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(true);
                setDeleteConfirmationText("");
                setDeletePassword("");
                setDeleteError(null);
              }}
              className="py-2.5 px-6 rounded-xl font-semibold text-sm bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50 transition-colors shadow-lg"
            >
              Begin Account Deletion
            </button>
          </div>
        )}
      </div>

      {/* ── Unblock Confirmation Modal ────────────────────────────────────── */}
      <ConfirmationModal
        isOpen={Boolean(userToUnblock)}
        onClose={() => setUserToUnblock(null)}
        onConfirm={handleConfirmUnblock}
        loading={unblocking}
        title={`Unblock ${userToUnblock?.name}?`}
        description="They will be able to discover your profile again in the future. Previous matches or chats will not be automatically restored."
        confirmLabel="Unblock"
        isDestructive={false}
      />

      {/* ── Delete Account Confirmation Modal ─────────────────────────────── */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => !deleting && setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        loading={deleting}
        title="Permanently Delete Account?"
        description="All your profile data, photos, likes, matches, and messages will be permanently destroyed."
        confirmLabel="Delete Everything Forever"
        cancelLabel="Keep My Account"
        isDestructive={true}
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
              {deleteError}
            </div>
          )}

          <div>
            <label
              htmlFor="delete-confirm-text"
              className="block text-xs font-semibold uppercase tracking-wider text-[#F2B6C2]/80 mb-1"
            >
              Type <span className="text-white font-mono font-bold">DELETE</span> to confirm
            </label>
            <input
              id="delete-confirm-text"
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-xl bg-[#2D0B14]/80 border border-rose-500/30 p-2.5 text-sm text-[#F8EDEB] focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="delete-password-input"
              className="block text-xs font-semibold uppercase tracking-wider text-[#F2B6C2]/80 mb-1"
            >
              Account Password
            </label>
            <input
              id="delete-password-input"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl bg-[#2D0B14]/80 border border-rose-500/30 p-2.5 text-sm text-[#F8EDEB] focus:border-rose-500 focus:outline-none"
            />
          </div>
        </div>
      </ConfirmationModal>
    </div>
  );
}
