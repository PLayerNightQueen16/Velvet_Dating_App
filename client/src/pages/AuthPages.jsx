import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, User, AtSign, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const EXACT_TAGLINE =
  "I once believed love would be burning red...then you turned my world crimson instead";

/**
 * Shared AuthCard wrapper for Login and Registration
 */
function AuthCard({ title, subtitle, children, error, clearError }) {
  return (
    <div className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md mx-auto"
      >
        <div
          className="rounded-3xl p-8 md:p-10 backdrop-blur-2xl border"
          style={{
            background: "rgba(58, 13, 26, 0.5)",
            borderColor: "rgba(242, 182, 194, 0.2)",
            boxShadow:
              "0 24px 80px rgba(0, 0, 0, 0.65), 0 0 35px rgba(139, 30, 63, 0.3)",
          }}
        >
          {/* Official VELVET Logo */}
          <div className="flex flex-col items-center mb-6">
            <Link to="/" className="group" aria-label="VELVET Home">
              <img
                src="/logo.png"
                alt="VELVET logo"
                className="w-16 h-16 rounded-2xl object-cover transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-[0_0_16px_rgba(242,182,194,0.7)] shadow-lg"
              />
            </Link>
            <span
              className="mt-3 font-display text-xl tracking-[0.25em] uppercase font-bold text-gradient-velvet"
            >
              VELVET
            </span>
          </div>

          {/* Heading */}
          <h1
            className="font-display text-2xl md:text-3xl font-semibold text-center mb-1.5"
            style={{ color: "#F8EDEB" }}
          >
            {title}
          </h1>

          {/* Subtitle */}
          <p
            className="text-xs text-center mb-6 leading-relaxed"
            style={{ color: "#F2B6C2" }}
          >
            {subtitle}
          </p>

          {/* Error banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 mb-5 rounded-xl flex items-start gap-2.5 text-xs border"
              style={{
                background: "rgba(139, 30, 63, 0.35)",
                borderColor: "rgba(242, 182, 194, 0.4)",
                color: "#FDE7E9",
              }}
              role="alert"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#F2B6C2]" />
              <div className="flex-1">
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          {children}

          {/* Exact Brand Tagline Footer */}
          <div className="mt-8 pt-6 border-t border-[rgba(242,182,194,0.12)] text-center">
            <p
              className="font-display italic text-xs leading-relaxed"
              style={{ color: "#D4AF97" }}
            >
              &ldquo;{EXACT_TAGLINE}&rdquo;
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * LoginPage Component
 */
export function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const destination = location.state?.from?.pathname || "/app";
      navigate(destination, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!emailOrUsername.trim()) {
      setLocalError("Please enter your email or username.");
      return;
    }

    if (!password) {
      setLocalError("Please enter your password.");
      return;
    }

    try {
      setSubmitting(true);
      const loggedInUser = await login({
        emailOrUsername: emailOrUsername.trim(),
        password,
      });
      // Smart redirect: incomplete profile goes to onboarding
      const intendedPath = location.state?.from?.pathname;
      if (intendedPath && intendedPath !== "/login" && intendedPath !== "/register") {
        navigate(intendedPath, { replace: true });
      } else if (loggedInUser?.profileCompleted === false) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/app", { replace: true });
      }
    } catch (err) {
      setLocalError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue your journey on VELVET"
      error={localError}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit}
        aria-label="Login form"
        noValidate
      >
        <div>
          <label
            htmlFor="login-identifier"
            className="block text-xs font-medium mb-1.5"
            style={{ color: "#F2B6C2" }}
          >
            Email or Username
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#F2B6C2]/60">
              <Mail size={16} />
            </span>
            <input
              id="login-identifier"
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="you@example.com or username"
              className="input-velvet pl-10"
              autoComplete="username"
              required
              disabled={submitting}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-medium mb-1.5"
            style={{ color: "#F2B6C2" }}
          >
            Password
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#F2B6C2]/60">
              <Lock size={16} />
            </span>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-velvet pl-10"
              autoComplete="current-password"
              required
              disabled={submitting}
            />
          </div>
        </div>

        <button
          id="login-submit"
          type="submit"
          disabled={submitting}
          className="btn-primary w-full mt-2 justify-center py-3 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Sign in to VELVET"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Sign In
              <ArrowRight size={15} />
            </span>
          )}
        </button>
      </form>

      <p className="text-center text-xs mt-6" style={{ color: "#D4AF97" }}>
        New to VELVET?{" "}
        <Link
          to="/register"
          className="font-medium underline transition-colors duration-200 hover:text-[#F8EDEB]"
          style={{ color: "#F2B6C2" }}
        >
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

/**
 * RegisterPage Component
 */
export function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const destination = location.state?.from?.pathname || "/app";
      navigate(destination, { replace: true });
    }
  }, [user, navigate, location]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (localError) setLocalError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    const { name, username, email, password } = formData;

    if (!name.trim()) {
      setLocalError("Please enter your full name.");
      return;
    }
    if (!username.trim()) {
      setLocalError("Please choose a username.");
      return;
    }
    if (username.trim().length < 3) {
      setLocalError("Username must be at least 3 characters long.");
      return;
    }
    if (!email.trim()) {
      setLocalError("Please enter your email address.");
      return;
    }
    if (!password) {
      setLocalError("Please create a password.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setSubmitting(true);
      await register({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
      });
      // New users always need to complete profile onboarding
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setLocalError(err.message || "Failed to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Start your story"
      subtitle="Join VELVET for meaningful, intimate connections"
      error={localError}
    >
      <form
        className="flex flex-col gap-3.5"
        onSubmit={handleSubmit}
        aria-label="Registration form"
        noValidate
      >
        <div>
          <label
            htmlFor="reg-name"
            className="block text-xs font-medium mb-1.5"
            style={{ color: "#F2B6C2" }}
          >
            Full Name
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#F2B6C2]/60">
              <User size={16} />
            </span>
            <input
              id="reg-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Valerie Crimson"
              className="input-velvet pl-10"
              autoComplete="name"
              required
              disabled={submitting}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="reg-username"
            className="block text-xs font-medium mb-1.5"
            style={{ color: "#F2B6C2" }}
          >
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#F2B6C2]/60">
              <AtSign size={16} />
            </span>
            <input
              id="reg-username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="valerie_crimson"
              className="input-velvet pl-10"
              autoComplete="username"
              required
              disabled={submitting}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="reg-email"
            className="block text-xs font-medium mb-1.5"
            style={{ color: "#F2B6C2" }}
          >
            Email Address
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#F2B6C2]/60">
              <Mail size={16} />
            </span>
            <input
              id="reg-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="valerie@example.com"
              className="input-velvet pl-10"
              autoComplete="email"
              required
              disabled={submitting}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="reg-password"
            className="block text-xs font-medium mb-1.5"
            style={{ color: "#F2B6C2" }}
          >
            Password (min 6 characters)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#F2B6C2]/60">
              <Lock size={16} />
            </span>
            <input
              id="reg-password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-velvet pl-10"
              autoComplete="new-password"
              required
              disabled={submitting}
            />
          </div>
        </div>

        <button
          id="reg-submit"
          type="submit"
          disabled={submitting}
          className="btn-primary w-full mt-2 justify-center py-3 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Create your VELVET account"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Creating account...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Create Account
              <ArrowRight size={15} />
            </span>
          )}
        </button>
      </form>

      <p className="text-center text-xs mt-6" style={{ color: "#D4AF97" }}>
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium underline transition-colors duration-200 hover:text-[#F8EDEB]"
          style={{ color: "#F2B6C2" }}
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
