import { Link } from "react-router-dom";
import logoImg from "../../assets/logo.png";

/**
 * VELVET Logo — uses the official logo.png branding asset with luxury typography.
 */
export default function Logo({ size = "md", showText = true, linkTo = "/" }) {
  const sizes = {
    sm: { img: 32, text: "text-lg" },
    md: { img: 42, text: "text-2xl" },
    lg: { img: 56, text: "text-3xl" },
  };

  const s = sizes[size] || sizes.md;

  return (
    <Link
      to={linkTo}
      className="inline-flex items-center gap-2.5 no-underline group"
      aria-label="VELVET — Home"
    >
      <img
        src={logoImg}
        alt="VELVET logo"
        width={s.img}
        height={s.img}
        className="rounded-xl object-cover transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-[0_0_12px_rgba(194,59,114,0.85)] shadow-md"
        style={{ flexShrink: 0 }}
      />
      {showText && (
        <span
          className={`font-serif tracking-[0.2em] uppercase font-bold ${s.text} text-gradient-rose transition-all duration-300 group-hover:brightness-125`}
        >
          VELVET
        </span>
      )}
    </Link>
  );
}
