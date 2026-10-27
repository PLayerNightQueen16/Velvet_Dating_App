import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
import { connectDB } from "../utils/connectDB.js";
import { User } from "../models/user.model.js";

const SEED_PROFILES = [
  /* =====================================================================
     WOMEN (3 Profiles)
     ===================================================================== */
  {
    name: "Camille Laurent",
    username: "camille_laurent",
    email: "camille@velvet.love",
    gender: "woman",
    dateOfBirth: new Date("2000-04-18"), // ~26 yrs
    bio: "Curator of contemporary Parisian art and collector of twilight conversations. I believe romantic connection should feel like stepping into an illuminated gallery after dark.",
    location: "Paris, France",
    occupation: "Contemporary Art Curator",
    education: "Sorbonne Université",
    languages: ["French", "English", "Italian"],
    relationshipIntent: "long-term",
    interests: ["Contemporary Art", "Museums & Galleries", "Wine Tasting", "French New Wave", "Fine Dining"],
    prompts: [
      {
        prompt: "A perfect Sunday looks like...",
        answer: "A flat white near the Canal Saint-Martin, browsing antique bookstores, and lost hours at the Palais de Tokyo."
      },
      {
        prompt: "The quickest way to my heart is...",
        answer: "A handwritten note folded inside a vintage art catalogue."
      }
    ],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80",
        isPrimary: true,
      },
      {
        url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
      {
        url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
    ],
  },
  {
    name: "Elena Rostova",
    username: "elena_rostova",
    email: "elena@velvet.love",
    gender: "woman",
    dateOfBirth: new Date("1998-09-12"), // ~28 yrs
    bio: "Classical violinist with an unrepentant weakness for jazz cellars and vinyl grooves. Looking for someone whose laughter echoes in quiet rooms.",
    location: "Vienna, Austria",
    occupation: "Classical Violinist & Composer",
    education: "Vienna Music Conservatory",
    languages: ["German", "English", "Russian"],
    relationshipIntent: "long-term",
    interests: ["Classical Music", "Vinyl Records", "Vintage Fashion", "Fine Dining", "Midnight Talks"],
    prompts: [
      {
        prompt: "My ideal first date...",
        answer: "An intimate rooftop chamber concert, followed by warm mulled wine under city lights."
      },
      {
        prompt: "A hill I'll die on...",
        answer: "Vinyl analog warmth will always tell a truer story than digital streaming."
      }
    ],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=80",
        isPrimary: true,
      },
      {
        url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
      {
        url: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
    ],
  },
  {
    name: "Maya Chen",
    username: "maya_chen",
    email: "maya@velvet.love",
    gender: "woman",
    dateOfBirth: new Date("2001-02-24"), // ~25 yrs
    bio: "Designing sensory digital experiences by day, practicing slow coffee brewing and evening yoga by dusk. Seeking depth, warmth, and shared horizons.",
    location: "San Francisco, CA",
    occupation: "Design Architect",
    education: "Stanford University",
    languages: ["English", "Mandarin"],
    relationshipIntent: "long-term",
    interests: ["Artisanal Coffee", "Philosophy", "Cozy Games", "Pilates & Yoga", "Matcha & Tea"],
    prompts: [
      {
        prompt: "The best conversation starter is...",
        answer: "What is a small, quiet moment this week that made you feel completely alive?"
      },
      {
        prompt: "Together, we could...",
        answer: "Rent a secluded cabin on the coast and cook risotto while the fog rolls in."
      }
    ],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=80",
        isPrimary: true,
      },
      {
        url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
      {
        url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
    ],
  },

  /* =====================================================================
     MEN (3 Profiles)
     ===================================================================== */
  {
    name: "Julian Vance",
    username: "julian_vance",
    email: "julian@velvet.love",
    gender: "man",
    dateOfBirth: new Date("1997-07-04"), // ~29 yrs
    bio: "Sustainable architecture, Scandinavian minimalism, and late-night jazz on vinyl. Looking for someone who notices the quiet poetry of spaces and shadows.",
    location: "London, UK",
    occupation: "Architect & Spatial Designer",
    education: "Architectural Association London",
    languages: ["English", "Danish"],
    relationshipIntent: "long-term",
    interests: ["Architecture", "Jazz & Blues", "Road Trips", "Midnight Talks", "Photography"],
    prompts: [
      {
        prompt: "A hill I'll die on...",
        answer: "Good lighting is 90% of romance in any room."
      },
      {
        prompt: "I'll fall for you if...",
        answer: "You can talk effortlessly about brutalism, old records, or the best pasta shape."
      }
    ],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80",
        isPrimary: true,
      },
      {
        url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
      {
        url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
    ],
  },
  {
    name: "Leo Silva",
    username: "leo_silva",
    email: "leo@velvet.love",
    gender: "man",
    dateOfBirth: new Date("1999-11-20"), // ~27 yrs
    bio: "Cinematographer and documentary filmmaker. Obsessed with natural light, midnight street photography, and Spanish tapas. Let's make ordinary evenings memorable.",
    location: "Barcelona, Spain",
    occupation: "Cinematographer & Director",
    education: "ESCAC Barcelona",
    languages: ["Spanish", "Catalan", "English"],
    relationshipIntent: "long-term",
    interests: ["Arthouse Cinema", "French New Wave", "Mixology", "Stargazing", "Photography"],
    prompts: [
      {
        prompt: "My ideal first date...",
        answer: "An outdoor cinema screening in a courtyard with chilled vermouth and deep conversation."
      },
      {
        prompt: "A green flag I look for...",
        answer: "Kindness to waiters and a genuine fascination with the world."
      }
    ],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80",
        isPrimary: true,
      },
      {
        url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
      {
        url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
    ],
  },
  {
    name: "Alexander Kim",
    username: "alexander_kim",
    email: "alexander@velvet.love",
    gender: "man",
    dateOfBirth: new Date("2000-08-15"), // ~26 yrs
    bio: "Creative Director between Seoul and Manhattan. Enthusiast of indie rock, gallery openings, and quiet rooftop speakeasies. Let's share an unhurried dinner.",
    location: "New York, NY",
    occupation: "Creative Director",
    education: "Columbia University",
    languages: ["Korean", "English"],
    relationshipIntent: "long-term",
    interests: ["Indie Rock", "Boutique Hotels", "Contemporary Art", "Midnight Talks", "Street Food"],
    prompts: [
      {
        prompt: "The quickest way to my heart is...",
        answer: "Taking me to a hole-in-the-wall dumpling place you swore to keep secret."
      },
      {
        prompt: "Together, we could...",
        answer: "Spontaneously book weekend train tickets to nowhere in particular."
      }
    ],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=80",
        isPrimary: true,
      },
      {
        url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
      {
        url: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
    ],
  },

  /* =====================================================================
     NON-BINARY (3 Profiles)
     ===================================================================== */
  {
    name: "Rowan Reed",
    username: "rowan_reed",
    email: "rowan@velvet.love",
    gender: "non-binary",
    dateOfBirth: new Date("2001-06-30"), // ~25 yrs
    bio: "Editorial stylist, poet, and curator of botanical sanctuaries. Fluent in thrifted velvet coats, vintage prints, and melancholic indie playlists.",
    location: "Brooklyn, NY",
    occupation: "Editorial Stylist & Poet",
    education: "Pratt Institute",
    languages: ["English"],
    relationshipIntent: "long-term",
    interests: ["Poetry", "Vintage Fashion", "Indie Rock", "Botanical Gardens", "Midnight Talks"],
    prompts: [
      {
        prompt: "A hill I'll die on...",
        answer: "Poetry is not dead, people just forgot how to slow down and listen."
      },
      {
        prompt: "The quickest way to my heart is...",
        answer: "A pressed flower in an old paperback book."
      }
    ],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=1000&q=80",
        isPrimary: true,
      },
      {
        url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
      {
        url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
    ],
  },
  {
    name: "Kai Sterling",
    username: "kai_sterling",
    email: "kai@velvet.love",
    gender: "non-binary",
    dateOfBirth: new Date("1998-03-22"), // ~28 yrs
    bio: "Electronic sound designer and stargazing enthusiast. I explore ambient soundscapes, philosophical treatises, and dark coffee. Looking for genuine wavelengths.",
    location: "Berlin, Germany",
    occupation: "Ambient Sound Sculptor",
    education: "Humboldt-Universität zu Berlin",
    languages: ["German", "English"],
    relationshipIntent: "long-term",
    interests: ["Electronic & Techno", "Philosophy", "Astronomy", "Lo-Fi", "Stargazing"],
    prompts: [
      {
        prompt: "My most controversial opinion...",
        answer: "Silence is often the most profound music two people can share."
      },
      {
        prompt: "Together, we could...",
        answer: "Drive out to the countryside during a meteor shower with warm tea and synth records."
      }
    ],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1000&q=80",
        isPrimary: true,
      },
      {
        url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
      {
        url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
    ],
  },
  {
    name: "Samira Bloom",
    username: "samira_bloom",
    email: "samira@velvet.love",
    gender: "non-binary",
    dateOfBirth: new Date("2002-01-14"), // ~24 yrs
    bio: "Ceramics artisan and herbal tea connoisseur. Spending weekends shaping stoneware clay, tending terrariums, and playing cozy pixel games.",
    location: "Montreal, Canada",
    occupation: "Ceramicist & Botanical Designer",
    education: "Concordia University",
    languages: ["French", "English"],
    relationshipIntent: "long-term",
    interests: ["Candle Making", "Interior Design", "Matcha & Tea", "Cozy Games", "Botanical Gardens"],
    prompts: [
      {
        prompt: "The best conversation starter is...",
        answer: "If you could create a room in your house dedicated to one specific feeling, what would it be?"
      },
      {
        prompt: "A perfect Sunday looks like...",
        answer: "Spinning clay at the wheel while cinnamon tea brews, followed by rain tapping on the window."
      }
    ],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80",
        isPrimary: true,
      },
      {
        url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
      {
        url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1000&q=80",
        isPrimary: false,
      },
    ],
  },
];

import mongoose from "mongoose";

async function seedProfiles() {
  const isOptedIn = process.env.SEED_DEMO_PROFILES === "true";
  const isProduction = process.env.NODE_ENV === "production";
  const isProductionAllowed = process.env.ALLOW_PRODUCTION_DEMO_SEED === "true";

  if (!isOptedIn) {
    console.error("🛑 Seeding Refused: SEED_DEMO_PROFILES=true must be explicitly set in environment.");
    process.exit(1);
  }

  if (isProduction && !isProductionAllowed) {
    console.error("🛑 Seeding Refused: In production, ALLOW_PRODUCTION_DEMO_SEED=true is required to execute demo seeding.");
    process.exit(1);
  }

  try {
    console.log("🌹 Connecting to VELVET Database...");
    await connectDB();

    const defaultPassword = "Password123!";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    console.log(`\n🌱 Seeding ${SEED_PROFILES.length} discovery candidate profiles (3 Women, 3 Men, 3 Non-Binary)...\n`);

    let addedCount = 0;
    let updatedCount = 0;

    for (const p of SEED_PROFILES) {
      const existingUser = await User.findOne({
        $or: [{ email: p.email }, { username: p.username }],
      });

      const profilePayload = {
        name: p.name,
        username: p.username,
        email: p.email,
        password: hashedPassword,
        gender: p.gender,
        dateOfBirth: p.dateOfBirth,
        bio: p.bio,
        location: p.location,
        occupation: p.occupation,
        education: p.education,
        languages: p.languages,
        relationshipIntent: p.relationshipIntent,
        interests: p.interests,
        prompts: p.prompts,
        photos: p.photos,
        profileCompleted: true,
        isDemo: true,
        preferences: {
          interestedIn: ["everyone"],
          ageRange: { min: 18, max: 50 },
          distanceKm: 100,
        },
        privacy: {
          discoverable: true,
          showOnlineStatus: true,
          showLastActive: true,
        },
      };

      if (existingUser) {
        Object.assign(existingUser, profilePayload);
        await existingUser.save();
        console.log(`  ✓ Updated profile: ${p.name} (@${p.username}) — [${p.gender}]`);
        updatedCount++;
      } else {
        await User.create(profilePayload);
        console.log(`  + Created profile: ${p.name} (@${p.username}) — [${p.gender}]`);
        addedCount++;
      }
    }

    console.log(`\n✨ Seeding Complete! ${addedCount} created, ${updatedCount} updated.`);
    console.log(`🔑 All seed profiles password: "${defaultPassword}"`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
}

seedProfiles();
