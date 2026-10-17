import { MapPin, Heart } from "lucide-react";

/**
 * SampleProfileCard — marketing-only profile illustration card for the landing page.
 * Not connected to any database.
 */
export default function SampleProfileCard({ profile, className = "" }) {
  const {
    name,
    age,
    location,
    bio,
    photo,
    tags = [],
    compatibility,
  } = profile;

  return (
    <article
      className={`card-profile group cursor-pointer ${className}`}
      aria-label={`Sample profile: ${name}, ${age}`}
    >
      {/* Photo area */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
        <img
          src={photo}
          alt={`Photo of ${name}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
          style={{ transform: "scale(1)" }}
          loading="lazy"
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(0deg, rgba(13,4,8,0.95) 0%, rgba(13,4,8,0.3) 45%, transparent 75%)",
          }}
          aria-hidden="true"
        />

        {/* Compatibility badge */}
        {compatibility && (
          <div
            className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(194, 59, 114, 0.25)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(194, 59, 114, 0.4)",
              color: "#f4859e",
            }}
            aria-label={`${compatibility}% compatibility`}
          >
            ✦ {compatibility}% match
          </div>
        )}

        {/* Like button */}
        <button
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100"
          style={{
            background: "rgba(194, 59, 114, 0.2)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(194, 59, 114, 0.4)",
            color: "#f4859e",
          }}
          aria-label={`Like ${name}'s profile`}
          tabIndex={0}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(194, 59, 114, 0.5)";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(194, 59, 114, 0.2)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <Heart size={16} />
        </button>

        {/* Bottom profile info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h3
                className="font-display font-semibold text-xl leading-tight"
                style={{ color: "#faf0f2" }}
              >
                {name}, <span style={{ color: "#e8c4d0" }}>{age}</span>
              </h3>
              {location && (
                <p
                  className="flex items-center gap-1 text-xs mt-0.5"
                  style={{ color: "#a08898" }}
                >
                  <MapPin size={11} aria-hidden="true" />
                  {location}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {bio && (
          <p
            className="text-sm leading-relaxed mb-3 line-clamp-2"
            style={{ color: "#a08898" }}
          >
            {bio}
          </p>
        )}

        {/* Interest tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Interests">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                role="listitem"
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  background: "rgba(139, 34, 82, 0.15)",
                  border: "1px solid rgba(195, 59, 114, 0.2)",
                  color: "#c8b8c0",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
