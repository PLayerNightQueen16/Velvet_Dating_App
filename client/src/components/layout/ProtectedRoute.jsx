import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PageLoader } from "../ui/Feedback";

/**
 * ProtectedRoute component:
 * - Displays loading indicator while verifying authentication session
 * - Redirects unauthenticated users to /login preserving intended destination
 * - Renders children or <Outlet /> for authenticated users
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    // Preserve attempted destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}
