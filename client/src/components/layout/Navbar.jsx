import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut } from "lucide-react";
import Logo from "../ui/Logo";
import { useAuth } from "../../context/AuthContext";

const navLinks = [
  { label: "Discover", to: "/discover" },
  { label: "How It Works", to: "/#how-it-works" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <>
      <header
        id="navbar"
        role="banner"
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled
            ? "rgba(26, 15, 19, 0.92)"
            : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(242, 182, 194, 0.12)" : "none",
          boxShadow: scrolled ? "0 4px 32px rgba(0, 0, 0, 0.5)" : "none",
        }}
      >
        <nav
          className="container-velvet flex items-center justify-between h-20"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop nav */}
          <ul
            className="hidden md:flex items-center gap-1 list-none m-0 p-0"
            role="list"
          >
            {navLinks.map((link) => (
              <li key={link.to}>
                {link.to.startsWith("/#") ? (
                  <a
                    href={link.to}
                    className="btn-ghost text-sm font-medium"
                    style={{ color: "#F2B6C2" }}
                  >
                    {link.label}
                  </a>
                ) : (
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `btn-ghost text-sm font-medium ${isActive ? "text-white" : ""}`
                    }
                    style={({ isActive }) => ({
                      color: isActive ? "#FDE7E9" : "#F2B6C2",
                    })}
                  >
                    {link.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>

          {/* Desktop CTA / Auth state */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/app"
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border border-[#F2B6C2]/20 bg-[#3A0D1A]/50 text-[#F8EDEB] hover:bg-[#3A0D1A] transition-colors"
                >
                  <User size={14} className="text-[#F2B6C2]" />
                  <span>{user.name.split(" ")[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  id="nav-logout"
                  className="btn-ghost text-sm flex items-center gap-1.5"
                  style={{ color: "#F2B6C2" }}
                  aria-label="Sign out"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  id="nav-login"
                  className="btn-ghost text-sm"
                  style={{ color: "#F8EDEB" }}
                  aria-label="Log in to VELVET"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  id="nav-join"
                  className="btn-primary text-sm"
                  aria-label="Join VELVET — create your profile"
                >
                  Join VELVET
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            id="mobile-menu-toggle"
            className="md:hidden p-2 rounded-lg transition-colors duration-200"
            style={{ color: "#F2B6C2", background: "transparent" }}
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile nav drawer */}
        <div
          id="mobile-nav"
          className="md:hidden transition-all duration-400 overflow-hidden"
          style={{
            maxHeight: mobileOpen ? "400px" : "0",
            background: "rgba(26, 15, 19, 0.97)",
            backdropFilter: "blur(24px)",
            borderBottom: mobileOpen ? "1px solid rgba(242, 182, 194, 0.15)" : "none",
          }}
          aria-hidden={!mobileOpen}
        >
          <ul
            className="container-velvet py-4 flex flex-col gap-1 list-none m-0"
            role="list"
          >
            {navLinks.map((link) => (
              <li key={link.to}>
                {link.to.startsWith("/#") ? (
                  <a
                    href={link.to}
                    className="block py-3 px-4 rounded-xl text-base font-medium transition-all duration-200"
                    style={{ color: "#F2B6C2" }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                ) : (
                  <NavLink
                    to={link.to}
                    className="block py-3 px-4 rounded-xl text-base font-medium transition-all duration-200"
                    style={{ color: "#F2B6C2" }}
                  >
                    {link.label}
                  </NavLink>
                )}
              </li>
            ))}
            {user ? (
              <>
                <li className="pt-2 border-t border-[rgba(242,182,194,0.12)] mt-2">
                  <Link
                    to="/app"
                    className="block py-3 px-4 rounded-xl text-base font-medium text-[#F8EDEB]"
                  >
                    Account ({user.name})
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-3 px-4 rounded-xl text-base font-medium text-[#F2B6C2] flex items-center gap-2"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="pt-2 border-t border-[rgba(242,182,194,0.12)] mt-2">
                  <Link
                    to="/login"
                    id="mobile-nav-login"
                    className="block py-3 px-4 rounded-xl text-base font-medium"
                    style={{ color: "#F8EDEB" }}
                  >
                    Login
                  </Link>
                </li>
                <li className="pb-2">
                  <Link
                    to="/register"
                    id="mobile-nav-join"
                    className="btn-primary w-full text-center block"
                  >
                    Join VELVET
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </header>
    </>
  );
}
