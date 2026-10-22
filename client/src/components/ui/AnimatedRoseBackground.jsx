import { memo } from "react";

/**
 * AnimatedRoseBackground
 * Global cinematic background featuring:
 * 1. Floating organic rose petals drifting and swaying gracefully (28 petals)
 * 2. Rose-gold and blush twinkling + swishing glitter particles (24 particles)
 * 3. Soft atmospheric burgundy/wine-red light blooms (4 orbs)
 *
 * Implemented with pure CSS animations and fixed pointer-events: none
 * to guarantee optimal 60fps performance and zero layout shifts.
 */

// 28 petals — dense, layered, cinematic
const PETALS = [
  // Small distant petals
  { id: 1,  left: "8%",   size: 14, duration: "18s", delay: "0s",    sway: "40px",  opacity: 0.55, blur: 0,   color: "wine" },
  { id: 2,  left: "24%",  size: 18, duration: "22s", delay: "5s",    sway: "-60px", opacity: 0.65, blur: 0,   color: "crimson" },
  { id: 3,  left: "42%",  size: 12, duration: "16s", delay: "9s",    sway: "35px",  opacity: 0.45, blur: 0,   color: "blush" },
  { id: 4,  left: "68%",  size: 16, duration: "20s", delay: "3s",    sway: "-45px", opacity: 0.6,  blur: 0,   color: "wine" },
  { id: 5,  left: "86%",  size: 14, duration: "24s", delay: "11s",   sway: "50px",  opacity: 0.5,  blur: 0,   color: "crimson" },
  // Mid-ground petals
  { id: 6,  left: "15%",  size: 24, duration: "15s", delay: "2s",    sway: "-55px", opacity: 0.75, blur: 0,   color: "crimson" },
  { id: 7,  left: "35%",  size: 28, duration: "19s", delay: "7s",    sway: "70px",  opacity: 0.8,  blur: 0,   color: "wine" },
  { id: 8,  left: "55%",  size: 22, duration: "17s", delay: "1s",    sway: "-65px", opacity: 0.7,  blur: 0,   color: "blush" },
  { id: 9,  left: "76%",  size: 26, duration: "21s", delay: "8s",    sway: "55px",  opacity: 0.75, blur: 0,   color: "crimson" },
  { id: 10, left: "92%",  size: 20, duration: "14s", delay: "12s",   sway: "-40px", opacity: 0.65, blur: 0,   color: "wine" },
  // Blurred foreground petals
  { id: 11, left: "5%",   size: 38, duration: "12s", delay: "4s",    sway: "80px",  opacity: 0.45, blur: 1.5, color: "crimson" },
  { id: 12, left: "82%",  size: 44, duration: "13s", delay: "10s",   sway: "-75px", opacity: 0.4,  blur: 2,   color: "wine" },
  // Dense extra coverage
  { id: 13, left: "3%",   size: 11, duration: "20s", delay: "6s",    sway: "30px",  opacity: 0.5,  blur: 0,   color: "blush" },
  { id: 14, left: "18%",  size: 19, duration: "25s", delay: "13s",   sway: "-50px", opacity: 0.6,  blur: 0,   color: "wine" },
  { id: 15, left: "30%",  size: 15, duration: "14s", delay: "1.5s",  sway: "60px",  opacity: 0.55, blur: 0,   color: "crimson" },
  { id: 16, left: "47%",  size: 30, duration: "18s", delay: "4.5s",  sway: "-80px", opacity: 0.7,  blur: 0,   color: "blush" },
  { id: 17, left: "62%",  size: 13, duration: "22s", delay: "9.5s",  sway: "45px",  opacity: 0.45, blur: 0,   color: "wine" },
  { id: 18, left: "74%",  size: 21, duration: "16s", delay: "2.8s",  sway: "-35px", opacity: 0.65, blur: 0,   color: "crimson" },
  { id: 19, left: "88%",  size: 17, duration: "23s", delay: "7.2s",  sway: "65px",  opacity: 0.55, blur: 0,   color: "blush" },
  { id: 20, left: "97%",  size: 25, duration: "15s", delay: "14s",   sway: "-55px", opacity: 0.6,  blur: 0,   color: "crimson" },
  // Deeply blurred large foreground petals
  { id: 21, left: "28%",  size: 52, duration: "11s", delay: "6.5s",  sway: "90px",  opacity: 0.3,  blur: 3,   color: "wine" },
  { id: 22, left: "65%",  size: 48, duration: "14s", delay: "3.5s",  sway: "-85px", opacity: 0.35, blur: 2.5, color: "blush" },
  // Very slow drifters for cinematic depth
  { id: 23, left: "50%",  size: 10, duration: "28s", delay: "0.5s",  sway: "25px",  opacity: 0.4,  blur: 0,   color: "blush" },
  { id: 24, left: "10%",  size: 16, duration: "30s", delay: "8.5s",  sway: "-30px", opacity: 0.45, blur: 0,   color: "crimson" },
  { id: 25, left: "40%",  size: 22, duration: "26s", delay: "16s",   sway: "55px",  opacity: 0.6,  blur: 0,   color: "wine" },
  { id: 26, left: "70%",  size: 14, duration: "24s", delay: "11.5s", sway: "-42px", opacity: 0.5,  blur: 0,   color: "crimson" },
  { id: 27, left: "58%",  size: 32, duration: "17s", delay: "5.5s",  sway: "75px",  opacity: 0.55, blur: 1,   color: "blush" },
  { id: 28, left: "80%",  size: 18, duration: "19s", delay: "0.8s",  sway: "-62px", opacity: 0.62, blur: 0,   color: "wine" },
];

// 24 glitter particles: 16 twinkling + 8 swishing drift
const PARTICLES = [
  // Twinkling gold/blush
  { id: "p1",  top: "18%", left: "12%",  size: 3,   duration: "4s",   delay: "0s",    color: "#D4AF97", drift: false },
  { id: "p2",  top: "32%", left: "28%",  size: 2.5, duration: "5s",   delay: "1.2s",  color: "#F2B6C2", drift: false },
  { id: "p3",  top: "15%", left: "62%",  size: 3.5, duration: "4.5s", delay: "2.4s",  color: "#D4AF97", drift: false },
  { id: "p4",  top: "45%", left: "84%",  size: 2,   duration: "6s",   delay: "0.8s",  color: "#FDE7E9", drift: false },
  { id: "p5",  top: "68%", left: "18%",  size: 3,   duration: "5.5s", delay: "3.1s",  color: "#D4AF97", drift: false },
  { id: "p6",  top: "82%", left: "44%",  size: 2.5, duration: "4.2s", delay: "1.7s",  color: "#F2B6C2", drift: false },
  { id: "p7",  top: "75%", left: "72%",  size: 3,   duration: "4.8s", delay: "2.8s",  color: "#D4AF97", drift: false },
  { id: "p8",  top: "88%", left: "90%",  size: 2,   duration: "5.2s", delay: "0.5s",  color: "#FDE7E9", drift: false },
  { id: "p9",  top: "5%",  left: "35%",  size: 2,   duration: "4.8s", delay: "1.5s",  color: "#e8537f", drift: false },
  { id: "p10", top: "22%", left: "48%",  size: 1.5, duration: "6.5s", delay: "3.8s",  color: "#D4AF97", drift: false },
  { id: "p11", top: "40%", left: "5%",   size: 2.5, duration: "3.8s", delay: "0.3s",  color: "#F2B6C2", drift: false },
  { id: "p12", top: "55%", left: "57%",  size: 3,   duration: "5.8s", delay: "2.1s",  color: "#D4AF97", drift: false },
  { id: "p13", top: "10%", left: "80%",  size: 2,   duration: "4.4s", delay: "4.5s",  color: "#FDE7E9", drift: false },
  { id: "p14", top: "60%", left: "92%",  size: 2.5, duration: "6.2s", delay: "1s",    color: "#F2B6C2", drift: false },
  { id: "p15", top: "93%", left: "22%",  size: 2,   duration: "5.1s", delay: "3.4s",  color: "#D4AF97", drift: false },
  { id: "p16", top: "78%", left: "68%",  size: 1.5, duration: "4.6s", delay: "0.9s",  color: "#e8537f", drift: false },
  // Swishing drift glitter — arc through the screen
  { id: "d1",  top: "8%",  left: "52%",  size: 4,   duration: "8s",   delay: "0s",    color: "#D4AF97", drift: true },
  { id: "d2",  top: "38%", left: "20%",  size: 3.5, duration: "9s",   delay: "2s",    color: "#F2B6C2", drift: true },
  { id: "d3",  top: "62%", left: "76%",  size: 4,   duration: "7.5s", delay: "1s",    color: "#D4AF97", drift: true },
  { id: "d4",  top: "25%", left: "95%",  size: 3,   duration: "10s",  delay: "3.5s",  color: "#e8537f", drift: true },
  { id: "d5",  top: "85%", left: "40%",  size: 4.5, duration: "8.5s", delay: "1.8s",  color: "#FDE7E9", drift: true },
  { id: "d6",  top: "50%", left: "3%",   size: 3.5, duration: "9.5s", delay: "4s",    color: "#F2B6C2", drift: true },
  { id: "d7",  top: "70%", left: "60%",  size: 3,   duration: "7s",   delay: "0.5s",  color: "#D4AF97", drift: true },
  { id: "d8",  top: "14%", left: "87%",  size: 4,   duration: "11s",  delay: "2.5s",  color: "#e8537f", drift: true },
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
      {/* 1. Atmospheric Bloom Orbs */}
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
      {/* Extra bloom — bottom right accent */}
      <div
        className="absolute bottom-[5%] right-[5%] w-[35vw] h-[35vw] max-w-[420px] max-h-[420px] rounded-full bloom-pulse"
        style={{
          background: "radial-gradient(circle, rgba(194, 59, 114, 0.14) 0%, transparent 70%)",
          filter: "blur(55px)",
          "--bloom-duration": "18s",
        }}
      />

      {/* 2. Floating Rose Petals (28) */}
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

      {/* 3. Glitter particles — twinkling + swishing (24 total) */}
      {PARTICLES.map((particle) => (
        <div
          key={particle.id}
          className={`absolute rounded-full ${particle.drift ? "glitter-swish" : "particle-shimmer"}`}
          style={{
            top: particle.top,
            left: particle.left,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.drift ? "14px 5px" : "6px 2px"} ${particle.color}`,
            "--particle-duration": particle.duration,
            "--particle-delay": particle.delay,
          }}
        />
      ))}
    </div>
  );
}

export default memo(AnimatedRoseBackground);
