import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import LandingPage from "./pages/LandingPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import PlaceholderPage from "./pages/PlaceholderPage";
import AuthenticatedHome from "./pages/AuthenticatedHome";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AnimatedRoseBackground from "./components/ui/AnimatedRoseBackground";
import { AuthProvider } from "./context/AuthContext";

/* ============================================================
   Route placeholder definitions
   ============================================================ */
const placeholderRoutes = [
  {
    path: "/discover",
    props: {
      title: "Discover",
      description: "Browse and swipe through curated profiles matched to your preferences.",
      icon: "✦",
      backLabel: "Back Home",
    },
  },
  {
    path: "/profile/setup",
    props: {
      title: "Profile Setup",
      description: "Complete your profile with photos, interests, and preferences.",
      icon: "👤",
      backLabel: "Back Home",
    },
  },
  {
    path: "/profile/edit",
    props: {
      title: "Edit Profile",
      description: "Update your photos, bio, and compatibility preferences.",
      icon: "✏️",
      backLabel: "Back Home",
    },
  },
  {
    path: "/likes",
    props: {
      title: "Your Likes",
      description: "See who's been interested in your profile and make your move.",
      icon: "♥",
      backLabel: "Back Home",
    },
  },
  {
    path: "/matches",
    props: {
      title: "Your Matches",
      description: "People you've mutually liked. The conversation starts here.",
      icon: "💫",
      backLabel: "Back Home",
    },
  },
  {
    path: "/chat",
    props: {
      title: "Messages",
      description: "Private conversations with your matches — intimate and secure.",
      icon: "💬",
      backLabel: "Back Home",
    },
  },
  {
    path: "/chat/:matchId",
    props: {
      title: "Conversation",
      description: "Your private conversation with your match.",
      icon: "💬",
      backTo: "/chat",
      backLabel: "Back to Messages",
    },
  },
  {
    path: "/settings",
    props: {
      title: "Settings",
      description: "Manage your account, privacy, notifications, and preferences.",
      icon: "⚙️",
      backLabel: "Back Home",
    },
  },
];

/* ============================================================
   Inner app — contains global animated background and routes
   ============================================================ */
function AppInner() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen relative bg-[#1A0F13] text-[#F8EDEB] selection:bg-[#8B1E3F] selection:text-[#F8EDEB]">
      {/* Global Animated Rose-Petal, Particles & Bloom Background */}
      <AnimatedRoseBackground />

      {/* Global Navigation */}
      <Navbar />

      {/* Main Content View */}
      <main className="flex-1 relative z-10" id="main-content" role="main">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected authenticated routes */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AuthenticatedHome />
                </ProtectedRoute>
              }
            />

            {/* Placeholder routes */}
            {placeholderRoutes.map(({ path, props }) => (
              <Route
                key={path}
                path={path}
                element={<PlaceholderPage {...props} />}
              />
            ))}

            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <PlaceholderPage
                  title="Page Not Found"
                  description="This page doesn't exist, but your story on VELVET does."
                  icon="🌟"
                  backLabel="Return Home"
                />
              }
            />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

/* ============================================================
   App root with AuthProvider and BrowserRouter
   ============================================================ */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  );
}
