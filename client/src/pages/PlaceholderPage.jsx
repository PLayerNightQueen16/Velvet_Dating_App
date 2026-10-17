import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Construction, ArrowLeft } from "lucide-react";

/**
 * PlaceholderPage — well-styled coming-soon page for routes not yet implemented.
 */
export default function PlaceholderPage({
  title = "Coming Soon",
  description = "This section is being built and will be available in an upcoming batch.",
  icon = "✦",
  backTo = "/",
  backLabel = "Go Home",
}) {
  return (
    <div className="placeholder-page pt-20">
      <div className="container-velvet text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6 max-w-md mx-auto"
        >
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl"
            style={{
              background: "rgba(139, 34, 82, 0.12)",
              border: "1px solid rgba(194, 59, 114, 0.2)",
            }}
            aria-hidden="true"
          >
            {icon}
          </div>

          {/* Text */}
          <div>
            <h1
              className="font-display text-4xl font-semibold mb-3"
              style={{ color: "#faf0f2" }}
            >
              {title}
            </h1>
            <p className="text-base leading-relaxed" style={{ color: "#7a5a65" }}>
              {description}
            </p>
          </div>

          {/* Dev note */}
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs"
            style={{
              background: "rgba(139, 34, 82, 0.08)",
              border: "1px solid rgba(194, 59, 114, 0.12)",
              color: "#5a3d48",
            }}
          >
            <Construction size={13} aria-hidden="true" />
            <span>Under construction — will ship in the next batch</span>
          </div>

          {/* Back link */}
          <Link
            to={backTo}
            className="btn-secondary flex items-center gap-2"
            aria-label={backLabel}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            {backLabel}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
