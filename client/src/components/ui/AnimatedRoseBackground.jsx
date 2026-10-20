import { memo } from "react";

/**
 * AnimatedRoseBackground
 * Global cinematic background featuring:
 * 1. Floating organic rose petals drifting and swaying gracefully
 * 2. Rose-gold and blush twinkling ambient glitter particles
 * 3. Soft atmospheric burgundy/wine-red light blooms
 *
 * Implemented with pure CSS animations and fixed pointer-events: none
 * to guarantee optimal 60fps performance and zero layout shifts.
 */

// Predefined set of varied petals (mix of distant, mid, and foreground)
const PETALS = [
  // Small distant petals
  { id: 1, left: "8%", size: 14, duration: "18s", delay: "0s", sway: "40px", opacity: 0.55, blur: 0, color: "wine" },
  { id: 2, left: "24%", size: 18, duration: "22s", delay: "5s", sway: "-60px", opacity: 0.65, blur: 0, color: "crimson" },
  { id: 3, left: "42%", size: 12, duration: "16s", delay: "9s", sway: "35px", opacity: 0.45, blur: 0, color: "blush" },
  { id: 4, left: "68%", size: 16, duration: "20s", delay: "3s", sway: "-45px", opacity: 0.6, blur: 0, color: "wine" },
  { id: 5, left: "86%", size: 14, duration: "24s", delay: "11s", sway: "50px", opacity: 0.5, blur: 0, color: "crimson" },

  // Mid-ground petals
  { id: 6, left: "15%", size: 24, duration: "15s", delay: "2s", sway: "-55px", opacity: 0.75, blur: 0, color: "crimson" },
  { id: 7, left: "35%", size: 28, duration: "19s", delay: "7s", sway: "70px", opacity: 0.8, blur: 0, color: "wine" },
  { id: 8, left: "55%", size: 22, duration: "17s", delay: "1s", sway: "-65px", opacity: 0.7, blur: 0, color: "blush" },
  { id: 9, left: "76%", size: 26, duration: "21s", delay: "8s", sway: "55px", opacity: 0.75, blur: 0, color: "crimson" },
  { id: 10, left: "92%", size: 20, duration: "14s", delay: "12s", sway: "-40px", opacity: 0.65, blur: 0, color: "wine" },

  // Softly blurred foreground petals
  { id: 11, left: "5%", size: 38, duration: "12s", delay: "4s", sway: "80px", opacity: 0.45, blur: 1.5, color: "crimson" },
  { id: 12, left: "82%", size: 44, duration: "13s", delay: "10s", sway: "-75px", opacity: 0.4, blur: 2, color: "wine" },
];

// Predefined set of shimmering ambient particles
const PARTICLES = [
  { id: "p1", top: "18%", left: "12%", size: 3, duration: "4s", delay: "0s", color: "#D4AF97" },
  { id: "p2", top: "32%", left: "28%", size: 2.5, duration: "5s", delay: "1.2s", color: "#F2B6C2" },
  { id: "p3", top: "15%", left: "62%", size: 3.5, duration: "4.5s", delay: "2.4s", color: "#D4AF97" },
  { id: "p4", top: "45%", left: "84%", size: 2, duration: "6s", delay: "0.8s", color: "#FDE7E9" },
  { id: "p5", top: "68%", left: "18%", size: 3, duration: "5.5s", delay: "3.1s", color: "#D4AF97" },
  { id: "p6", top: "82%", left: "44%", size: 2.5, duration: "4.2s", delay: "1.7s", color: "#F2B6C2" },
  { id: "p7", top: "75%", left: "72%", size: 3, duration: "4.8s", delay: "2.8s", color: "#D4AF97" },
  { id: "p8", top: "88%", left: "90%", size: 2, duration: "5.2s", delay: "0.5s", color: "#FDE7E9" },
];

function PetalShape({ color }) {
  if (color === "blush") {
    return (
      <svg viewBox="0 0 30 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_2px_8px_rgba(242,182,194,0.3)]">
        <path
          d="M15 2 C22 2 29 9 28 19 C27 27 20 34 15 35 C10 34 3 27 2 19 C1 9 8 2 15 2 Z"
          fill="url(#blushPetalGrad)"
        />
        <defs>
          <linearGradient id="blushPetalGrad" x1="2" y1="2" x2="28" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F2B6C2" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#8B1E3F" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#3A0D1A" stopOpacity="0.9" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (color === "wine") {
    return (
      <svg viewBox="0 0 30 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_2px_8px_rgba(139,30,63,0.35)]">
        <path
          d="M15 2 C23 3 29 11 28 21 C27 29 19 35 15 35 C11 35 3 29 2 21 C1 11 7 3 15 2 Z"
          fill="url(#winePetalGrad)"
        />
        <defs>
          <linearGradient id="winePetalGrad" x1="2" y1="2" x2="28" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8B1E3F" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#3A0D1A" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1A0F13" stopOpacity="0.95" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // Crimson (default)
  return (
    <svg viewBox="0 0 30 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_2px_8px_rgba(194,59,114,0.35)]">
      <path
        d="M15 1 C24 3 29 12 28 22 C26 30 18 35 15 35 C12 35 4 30 2 22 C1 12 6 3 15 1 Z"
        fill="url(#crimsonPetalGrad)"
      />
      <defs>
        <linearGradient id="crimsonPetalGrad" x1="2" y1="1" x2="28" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a8224c" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#8B1E3F" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#3A0D1A" stopOpacity="0.9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AnimatedRoseBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* 1. Atmospheric Deep Crimson & Burgundy Light Blooms */}
      <div
        className="absolute -top-[20%] left-[10%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full bloom-pulse"
        style={{
          background: "radial-gradient(circle, rgba(139, 30, 63, 0.22) 0%, rgba(58, 13, 26, 0.12) 50%, transparent 75%)",
          filter: "blur(40px)",
          "--bloom-duration": "12s",
        }}
      />
      <div
        className="absolute top-[40%] -right-[10%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full bloom-pulse"
        style={{
          background: "radial-gradient(circle, rgba(58, 13, 26, 0.28) 0%, rgba(26, 15, 19, 0.15) 50%, transparent 75%)",
          filter: "blur(50px)",
          "--bloom-duration": "15s",
        }}
      />
      <div
        className="absolute -bottom-[15%] left-[30%] w-[45vw] h-[45vw] max-w-[550px] max-h-[550px] rounded-full bloom-pulse"
        style={{
          background: "radial-gradient(circle, rgba(139, 30, 63, 0.18) 0%, transparent 70%)",
          filter: "blur(45px)",
          "--bloom-duration": "10s",
        }}
      />

      {/* 2. Floating Rose Petals */}
      {PETALS.map((petal) => (
        <div
          key={petal.id}
          className="absolute top-0 petal-drift"
          style={{
            left: petal.left,
            width: `${petal.size}px`,
            height: `${Math.round(petal.size * 1.2)}px`,
            filter: petal.blur ? `blur(${petal.blur}px)` : "none",
            "--petal-duration": petal.duration,
            "--petal-delay": petal.delay,
            "--petal-sway": petal.sway,
            "--petal-opacity": petal.opacity,
          }}
        >
          <PetalShape color={petal.color} />
        </div>
      ))}

      {/* 3. Rose Gold & Blush Glitter / Ambient Particles */}
      {PARTICLES.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full particle-shimmer"
          style={{
            top: particle.top,
            left: particle.left,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            boxShadow: `0 0 6px 1px ${particle.color}`,
            "--particle-duration": particle.duration,
            "--particle-delay": particle.delay,
          }}
        />
      ))}
    </div>
  );
}

export default memo(AnimatedRoseBackground);
