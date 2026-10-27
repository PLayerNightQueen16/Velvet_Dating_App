import { Link } from "react-router-dom";
import Logo from "../ui/Logo";
import { Heart, Instagram, Twitter, Youtube } from "lucide-react";

const footerLinks = {
  Discover: [
    { label: "Browse Profiles", to: "/discover" },
    { label: "My Matches", to: "/matches" },
    { label: "Messages", to: "/chat" },
    { label: "Likes", to: "/likes" },
  ],
  Account: [
    { label: "Create Profile", to: "/register" },
    { label: "Sign In", to: "/login" },
    { label: "Edit Profile", to: "/profile/edit" },
    { label: "Settings", to: "/settings" },
  ],
  Company: [
    { label: "About VELVET", to: "/#how-it-works" },
    { label: "Privacy Policy", to: "#" },
    { label: "Terms of Service", to: "#" },
    { label: "Safety", to: "#" },
  ],
};

const socialLinks = [
  { Icon: Instagram, href: "#", label: "VELVET on Instagram" },
  { Icon: Twitter, href: "#", label: "VELVET on Twitter" },
  { Icon: Youtube, href: "#", label: "VELVET on YouTube" },
];

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      className="relative border-t"
      style={{
        borderColor: "rgba(195, 59, 114, 0.1)",
        background: "linear-gradient(180deg, #0d0408 0%, #120810 100%)",
      }}
    >
      {/* Top glow line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-px"
        style={{
          width: "60%",
          background: "linear-gradient(90deg, transparent, rgba(194, 59, 114, 0.4), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="container-velvet py-16">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          {/* Brand block */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Logo size="lg" />
            <p
              className="text-sm font-display italic leading-relaxed max-w-sm"
              style={{ color: "#D4AF97" }}
            >
              &ldquo;I once believed love would be burning red...then you turned my world crimson instead&rdquo;
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 mt-2">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    background: "rgba(195, 59, 114, 0.08)",
                    border: "1px solid rgba(195, 59, 114, 0.15)",
                    color: "#7a5a65",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(195, 59, 114, 0.2)";
                    e.currentTarget.style.borderColor = "rgba(195, 59, 114, 0.5)";
                    e.currentTarget.style.color = "#e8537f";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(195, 59, 114, 0.08)";
                    e.currentTarget.style.borderColor = "rgba(195, 59, 114, 0.15)";
                    e.currentTarget.style.color = "#7a5a65";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: "#8b2252" }}
              >
                {category}
              </h3>
              <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm transition-colors duration-200"
                      style={{ color: "#7a5a65" }}
                      onMouseEnter={(e) => (e.target.style.color = "#e8c4d0")}
                      onMouseLeave={(e) => (e.target.style.color = "#7a5a65")}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="divider-velvet mb-6" aria-hidden="true" />

        {/* Bottom row */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ color: "#3d2830" }}
        >
          <p>
            © {new Date().getFullYear()} VELVET. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5">
            Made with{" "}
            <Heart
              size={11}
              fill="rgba(194,59,114,0.8)"
              stroke="none"
              aria-hidden="true"
            />{" "}
            for meaningful connections.
          </p>
        </div>
      </div>
    </footer>
  );
}
