/**
 * LoadingSpinner — reusable loading state component
 */
export function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 min-h-[200px]"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {/* Animated ring */}
      <div className="relative w-12 h-12">
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
          style={{
            borderTopColor: "#c23b72",
            borderRightColor: "rgba(194, 59, 114, 0.3)",
            animationDuration: "0.8s",
          }}
          aria-hidden="true"
        />
        {/* Inner glow dot */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#e8537f" }}
          />
        </div>
      </div>
      <p
        className="text-sm font-medium tracking-wide"
        style={{ color: "#7a5a65" }}
      >
        {message}
      </p>
    </div>
  );
}

/**
 * PageLoader — full-page loading overlay
 */
export function PageLoader() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999]"
      style={{ background: "#0d0408" }}
      role="status"
      aria-label="Loading VELVET"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Pulsing logo mark */}
        <div className="relative">
          <div
            className="w-20 h-20 rounded-full animate-pulse-glow"
            style={{
              background: "radial-gradient(circle, rgba(194,59,114,0.3) 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 24 C14 24 3 16 3 9.5 C3 6 5.5 4 8 4 C10 4 12 5.5 14 8 C16 5.5 18 4 20 4 C22.5 4 25 6 25 9.5 C25 16 14 24 14 24Z"
                fill="url(#loadHeartGrad)"
              />
              <circle cx="8" cy="4" r="1.5" fill="#f4859e" />
              <circle cx="20" cy="4" r="1.5" fill="#f4859e" />
              <defs>
                <linearGradient id="loadHeartGrad" x1="3" y1="4" x2="25" y2="24" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#c23b72" />
                  <stop offset="100%" stopColor="#8b2252" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <p
          className="font-display text-2xl tracking-[0.3em] uppercase"
          style={{ color: "#e8537f", letterSpacing: "0.3em" }}
        >
          VELVET
        </p>
      </div>
    </div>
  );
}

/**
 * ErrorMessage — inline error display
 */
export function ErrorMessage({ message = "Something went wrong.", onRetry }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl text-center"
      style={{
        background: "rgba(139, 34, 82, 0.08)",
        border: "1px solid rgba(139, 34, 82, 0.2)",
      }}
      role="alert"
      aria-live="assertive"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
        style={{ background: "rgba(139, 34, 82, 0.15)" }}
        aria-hidden="true"
      >
        ✦
      </div>
      <p className="text-sm" style={{ color: "#c8b8c0" }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary text-sm"
          aria-label="Retry the failed action"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
