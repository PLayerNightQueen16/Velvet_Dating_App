import { Link } from "react-router-dom";
import logoImg from "../../assets/logo.png";

/**
 * VELVET Logo — uses the official logo.png branding asset with luxury typography.
 * Sizes bumped up for stronger brand presence.
 */
export default function Logo({ size = "md", showText = true, linkTo = "/" }) {
  const sizes = {
    sm: { img: 38,  text: "text-xl",  spacing: "tracking-[0.22em]" },
    md: { img: 52,  text: "text-2xl", spacing: "tracking-[0.22em]" },
    lg: { img: 68,  text: "text-3xl", spacing: "tracking-[0.24em]" },
    xl: { img: 84,  text: "text-4xl", spacing: "tracking-[0.26em]" },
  };

  const s = sizes[size] || sizes.md;

  return (
    <Link
      to={linkTo}
      className="inline-flex items-center gap-3 no-underline group"
      aria-label="VELVET — Home"
    >
      <img
        src={logoImg}
        alt="VELVET logo"
        width={s.img}
        height={s.img}
        className="rounded-xl object-cover transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-[0_0_16px_rgba(194,59,114,0.9)] shadow-lg"
        style={{ flexShrink: 0 }}
      />
      {showText && (
        <span
          className={`font-serif ${s.spacing} uppercase font-bold ${s.text} text-gradient-rose transition-all duration-300 group-hover:brightness-125`}
          style={{ letterSpacing: "0.22em" }}
        >
          VELVET
        </span>
      )}
    </Link>
  );
}
