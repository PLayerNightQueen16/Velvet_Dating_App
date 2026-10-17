import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Heart,
  MessageCircle,
  Star,
  Shield,
  Zap,
  Users,
} from "lucide-react";
import SampleProfileCard from "../components/cards/SampleProfileCard";

/* ============================================================
   Sample profiles — marketing illustrations only, not DB data
   ============================================================ */
const sampleProfiles = [
  {
    name: "Isabelle",
    age: 24,
    location: "New York, NY",
    bio: "Lover of jazz bars, philosophy, and midnight conversations that change everything.",
    photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=85&auto=format&fit=crop",
    tags: ["Jazz", "Philosophy", "Art"],
    compatibility: 94,
  },
  {
    name: "Amara",
    age: 26,
    location: "San Francisco, CA",
    bio: "Chasing sunsets and building meaningful things. Always up for an adventure.",
    photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=600&q=85&auto=format&fit=crop",
    tags: ["Travel", "Tech", "Yoga"],
    compatibility: 88,
  },
  {
    name: "Sofia",
    age: 23,
    location: "Chicago, IL",
    bio: "Film student. Storyteller. Looking for someone who actually reads the credits.",
    photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=85&auto=format&fit=crop",
    tags: ["Cinema", "Books", "Coffee"],
    compatibility: 91,
  },
  {
    name: "Maya",
    age: 25,
    location: "Los Angeles, CA",
    bio: "Dancer by day, dreamer by night. Searching for someone who makes the playlist.",
    photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&q=85&auto=format&fit=crop",
    tags: ["Dance", "Music", "Wellness"],
    compatibility: 86,
  },
];

/* ============================================================
   How It Works steps
   ============================================================ */
const steps = [
  {
    num: "01",
    icon: Users,
    title: "Create Your Profile",
    desc: "Tell your story through curated photos, interests, and a profile that reflects who you truly are — not just your best angle.",
  },
  {
    num: "02",
    icon: Sparkles,
    title: "Discover People",
    desc: "Explore carefully curated profiles matched to your compatibility preferences. Every card is a potential story.",
  },
  {
    num: "03",
    icon: Heart,
    title: "Mutual Matches",
    desc: "When attraction is mutual, sparks fly. Match with someone who's equally interested, then let the conversation begin.",
  },
];

/* ============================================================
   Feature highlights
   ============================================================ */
const features = [
  {
    icon: Zap,
    title: "Compatibility Engine",
    desc: "Our preference-based matching considers values, lifestyle, and personality to surface connections that actually resonate.",
  },
  {
    icon: Heart,
    title: "Mutual Matches",
    desc: "No one-sided pressure. Conversations only open when both of you feel the spark — making every chat meaningful from the start.",
  },
  {
    icon: MessageCircle,
    title: "Private Conversations",
    desc: "Thoughtfully designed messaging that feels intimate. Share voice notes, reactions, and moments — all in a safe space.",
  },
  {
    icon: Shield,
    title: "Verified & Safe",
    desc: "Every profile is reviewed. Your privacy is protected. Because real connection starts with feeling secure.",
  },
  {
    icon: Star,
    title: "Curated Experiences",
    desc: "From icebreaker prompts to date ideas, VELVET helps you move from matching to meeting with confidence.",
  },
  {
    icon: Sparkles,
    title: "Premium Aesthetics",
    desc: "A platform that respects your time and taste. No ads, no noise — just beautifully designed moments of discovery.",
  },
];

/* ============================================================
   Fade-up animation variant
   ============================================================ */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.4, 0, 0.2, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ============================================================
   Constellation background particles
   ============================================================ */
const constellationDots = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 2.5 + 1,
  delay: Math.random() * 4,
  duration: Math.random() * 4 + 3,
}));

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ======================================================
          HERO SECTION
          ====================================================== */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 65% 50%, rgba(139, 34, 82, 0.22) 0%, rgba(107, 32, 64, 0.08) 40%, #0d0408 70%)",
        }}
        aria-label="Hero section"
      >
        {/* Constellation dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          {constellationDots.map((dot) => (
            <div
              key={dot.id}
              className="absolute rounded-full"
              style={{
                top: dot.top,
                left: dot.left,
                width: dot.size,
                height: dot.size,
                background: "rgba(194, 59, 114, 0.7)",
                boxShadow: "0 0 6px rgba(194, 59, 114, 0.9)",
                animation: `constellation-twinkle ${dot.duration}s ease-in-out ${dot.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Ambient glow orbs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute rounded-full"
            style={{
              top: "20%",
              right: "10%",
              width: "500px",
              height: "500px",
              background: "radial-gradient(circle, rgba(139, 34, 82, 0.12) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              bottom: "20%",
              left: "5%",
              width: "400px",
              height: "400px",
              background: "radial-gradient(circle, rgba(107, 32, 64, 0.1) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
        </div>

        <div className="container-velvet pt-24 pb-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <div className="flex flex-col gap-7">
              {/* Tagline pill with exact brand tagline */}
              <motion.div
                initial="hidden"
                animate="visible"
                custom={0}
                variants={fadeUp}
              >
                <span
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-serif italic tracking-wide border shadow-md"
                  style={{
                    background: "rgba(139, 30, 63, 0.25)",
                    borderColor: "rgba(242, 182, 194, 0.35)",
                    color: "#D4AF97",
                  }}
                >
                  <Sparkles size={14} className="text-[#F2B6C2]" aria-hidden="true" />
                  &ldquo;I once believed love would be burning red...then you turned my world crimson instead&rdquo;
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial="hidden"
                animate="visible"
                custom={0.1}
                variants={fadeUp}
                className="font-display font-semibold leading-[1.1]"
                style={{
                  fontSize: "clamp(2.8rem, 6vw, 5rem)",
                  color: "#F8EDEB",
                }}
              >
                Some connections
                <br />
                <span className="text-gradient-velvet">are written</span>
                <br />
                in the stars.
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial="hidden"
                animate="visible"
                custom={0.2}
                variants={fadeUp}
                className="text-base md:text-lg leading-relaxed max-w-lg"
                style={{ color: "#F2B6C2" }}
              >
                A space for real people, meaningful conversations and unforgettable connections. VELVET pairs thoughtful compatibility matching with a beautifully intimate crimson experience.
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial="hidden"
                animate="visible"
                custom={0.3}
                variants={fadeUp}
                className="flex flex-wrap items-center gap-4"
              >
                <Link
                  to="/register"
                  id="hero-cta-primary"
                  className="btn-primary"
                  aria-label="Create your free VELVET profile"
                >
                  Create Your Profile
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <a
                  href="#how-it-works"
                  id="hero-cta-secondary"
                  className="btn-secondary"
                  aria-label="See how VELVET works"
                >
                  See How It Works
                </a>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial="hidden"
                animate="visible"
                custom={0.4}
                variants={fadeUp}
                className="flex items-center gap-6 pt-2"
              >
                {[
                  { value: "50K+", label: "Members" },
                  { value: "12K+", label: "Matches" },
                  { value: "4.9★", label: "Rating" },
                ].map(({ value, label }) => (
                  <div key={label} className="flex flex-col">
                    <span
                      className="font-display text-2xl font-semibold"
                      style={{ color: "#e8537f" }}
                    >
                      {value}
                    </span>
                    <span className="text-xs" style={{ color: "#7a5a65" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — profile card collage */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="relative flex justify-center items-center"
              aria-label="Sample profile cards for illustration"
              aria-hidden="false"
            >
              {/* Glow behind cards */}
              <div
                className="absolute inset-0 rounded-3xl"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(139, 34, 82, 0.15) 0%, transparent 70%)",
                  filter: "blur(20px)",
                }}
                aria-hidden="true"
              />

              {/* Stacked cards layout */}
              <div className="relative w-full max-w-sm">
                {/* Back card */}
                <div
                  className="absolute"
                  style={{
                    top: "10px",
                    right: "-20px",
                    width: "70%",
                    transform: "rotate(5deg)",
                    opacity: 0.7,
                  }}
                  aria-hidden="true"
                >
                  <SampleProfileCard profile={sampleProfiles[1]} />
                </div>
                {/* Back left card */}
                <div
                  className="absolute"
                  style={{
                    top: "20px",
                    left: "-20px",
                    width: "55%",
                    transform: "rotate(-5deg)",
                    opacity: 0.5,
                  }}
                  aria-hidden="true"
                >
                  <SampleProfileCard profile={sampleProfiles[2]} />
                </div>
                {/* Front card */}
                <div className="relative z-10 animate-float">
                  <SampleProfileCard profile={sampleProfiles[0]} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: "linear-gradient(0deg, #0d0408 0%, transparent 100%)",
          }}
          aria-hidden="true"
        />
      </section>

      {/* ======================================================
          SAMPLE PROFILES ROW
          ====================================================== */}
      <section
        id="profiles-preview"
        className="section-padding bg-section-gradient"
        aria-label="Featured profiles"
      >
        <div className="container-velvet">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#8b2252" }}
            >
              ✦ Discover
            </p>
            <h2
              className="font-display font-semibold mb-4"
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                color: "#faf0f2",
              }}
            >
              Meet someone remarkable
            </h2>
            <p className="max-w-md mx-auto text-base" style={{ color: "#7a5a65" }}>
              Every profile is a new story. Browse genuine people looking for genuine connection.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          >
            {sampleProfiles.map((profile, i) => (
              <motion.div key={profile.name} variants={fadeUp} custom={i * 0.08}>
                <SampleProfileCard profile={profile} />
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0.4}
            className="text-center mt-10"
          >
            <Link
              to="/register"
              id="profiles-cta"
              className="btn-secondary"
              aria-label="See all profiles on VELVET"
            >
              See All Profiles
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ======================================================
          HOW IT WORKS
          ====================================================== */}
      <section
        id="how-it-works"
        className="section-padding"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(74, 24, 48, 0.2) 0%, #0d0408 65%)",
        }}
        aria-label="How VELVET works"
      >
        <div className="container-velvet">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#8b2252" }}
            >
              ✦ The Process
            </p>
            <h2
              className="font-display font-semibold"
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                color: "#faf0f2",
              }}
            >
              Three steps to your story
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div
              className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(194, 59, 114, 0.25), transparent)",
              }}
              aria-hidden="true"
            />

            {steps.map(({ num, icon: Icon, title, desc }, i) => (
              <motion.div
                key={num}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.15}
                className="card-feature flex flex-col items-start gap-5 relative"
              >
                {/* Step number */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className="font-display text-5xl font-semibold"
                    style={{ color: "rgba(139, 34, 82, 0.25)" }}
                    aria-hidden="true"
                  >
                    {num}
                  </span>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "rgba(139, 34, 82, 0.15)",
                      border: "1px solid rgba(194, 59, 114, 0.25)",
                      color: "#c23b72",
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={22} />
                  </div>
                </div>
                <div>
                  <h3
                    className="font-display text-2xl font-semibold mb-3"
                    style={{ color: "#faf0f2" }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#7a5a65" }}>
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          FEATURES
          ====================================================== */}
      <section
        id="features"
        className="section-padding bg-section-gradient"
        aria-label="VELVET features"
      >
        <div className="container-velvet">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#8b2252" }}
            >
              ✦ Why VELVET
            </p>
            <h2
              className="font-display font-semibold mb-4"
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                color: "#faf0f2",
              }}
            >
              Built for real connection
            </h2>
            <p
              className="max-w-lg mx-auto text-base"
              style={{ color: "#7a5a65" }}
            >
              Every feature is designed to bring you closer to someone who truly matters.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                variants={fadeUp}
                custom={i * 0.08}
                className="card-feature"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: "rgba(139, 34, 82, 0.15)",
                    border: "1px solid rgba(194, 59, 114, 0.2)",
                    color: "#c23b72",
                  }}
                  aria-hidden="true"
                >
                  <Icon size={20} />
                </div>
                <h3
                  className="font-display text-xl font-semibold mb-2"
                  style={{ color: "#faf0f2" }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#7a5a65" }}>
                  {desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ======================================================
          FINAL CTA SECTION
          ====================================================== */}
      <section
        id="signup-cta"
        className="section-padding relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 90% 90% at 50% 50%, rgba(107, 32, 64, 0.3) 0%, #0d0408 65%)",
        }}
        aria-label="Sign up call to action"
      >
        {/* Ambient lines */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                top: `${20 + i * 20}%`,
                left: 0,
                right: 0,
                height: "1px",
                background: `linear-gradient(90deg, transparent ${i % 2 === 0 ? "20%" : "60%"}, rgba(194, 59, 114, ${0.04 + i * 0.02}) 50%, transparent ${i % 2 === 0 ? "80%" : "40%"})`,
              }}
            />
          ))}
        </div>

        <div className="container-velvet text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="flex flex-col items-center gap-6"
          >
            {/* Star icon */}
            <motion.div
              variants={fadeUp}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(139, 34, 82, 0.15)",
                border: "1px solid rgba(194, 59, 114, 0.3)",
              }}
              aria-hidden="true"
            >
              <Sparkles size={28} style={{ color: "#c23b72" }} />
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="font-display font-semibold"
              style={{
                fontSize: "clamp(2.2rem, 5vw, 4rem)",
                color: "#faf0f2",
                lineHeight: 1.15,
              }}
            >
              Your story is waiting
              <br />
              <span className="text-gradient-velvet">to be written.</span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="max-w-md text-base leading-relaxed"
              style={{ color: "#7a5a65" }}
            >
              Join thousands of people who found something real on VELVET.
              Create your profile — it takes less than two minutes.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap justify-center gap-4"
            >
              <Link
                to="/register"
                id="final-cta-primary"
                className="btn-primary"
                aria-label="Get started with VELVET for free"
              >
                Get Started Free
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                to="/login"
                id="final-cta-login"
                className="btn-secondary"
                aria-label="Log in to your VELVET account"
              >
                Sign In
              </Link>
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="text-xs"
              style={{ color: "#3d2830" }}
            >
              Free to join. No credit card required. Always private.
            </motion.p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
