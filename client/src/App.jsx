import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import LandingPage from "./pages/LandingPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import PlaceholderPage from "./pages/PlaceholderPage";
import AuthenticatedHome from "./pages/AuthenticatedHome";
import ProfileOnboarding from "./pages/ProfileOnboarding";
import ProfileEdit from "./pages/ProfileEdit";
import Discovery from "./pages/Discovery";
import LikesPage from "./pages/LikesPage";
import MatchesPage from "./pages/MatchesPage";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AnimatedRoseBackground from "./components/ui/AnimatedRoseBackground";
import { AuthProvider, useAuth } from "./context/AuthContext";

/* ============================================================
   Smart root redirect after login/register:
   - if not authenticated → /login
   - if authenticated but profile incomplete → /onboarding
   - if authenticated and profile complete → /app
   ============================================================ */
function SmartRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.profileCompleted) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/app" replace />;
}

/* ============================================================
   Route placeholder definitions (future batches)
   ============================================================ */
const placeholderRoutes = [];

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

            {/* Smart post-auth redirect */}
            <Route path="/redirect" element={<SmartRedirect />} />

            {/* Protected: multi-step onboarding (shown when profileCompleted = false) */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <ProfileOnboarding />
                </ProtectedRoute>
              }
            />

            {/* Protected: profile viewing / editing */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <ProfileEdit />
                </ProtectedRoute>
              }
            />

            {/* Protected: authenticated home / dashboard */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AuthenticatedHome />
                </ProtectedRoute>
              }
            />

            {/* Protected: discovery feed */}
            <Route
              path="/discover"
              element={
                <ProtectedRoute>
                  <Discovery />
                </ProtectedRoute>
              }
            />

            {/* Protected: likes pages (received & sent) */}
            <Route
              path="/likes"
              element={
                <ProtectedRoute>
                  <LikesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/likes/received"
              element={
                <ProtectedRoute>
                  <LikesPage defaultTab="received" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/likes/sent"
              element={
                <ProtectedRoute>
                  <LikesPage defaultTab="sent" />
                </ProtectedRoute>
              }
            />

            {/* Protected: matches page */}
            <Route
              path="/matches"
              element={
                <ProtectedRoute>
                  <MatchesPage />
                </ProtectedRoute>
              }
            />

            {/* Protected: chat conversations & direct message thread */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:matchId"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />

            {/* Protected: settings & safety */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
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
