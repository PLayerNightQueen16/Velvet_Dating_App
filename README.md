# VELVET 🌹

> *"I once believed love would be burning red...then you turned my world crimson instead"*

VELVET is a full-stack MERN dating application designed for meaningful, compatibility-driven connections with a romantic aesthetic.

---

## Project Structure

```
velvet/
├── client/                     # React 19 + Vite + Tailwind CSS 4 frontend
│   ├── public/
│   │   ├── logo.png            # VELVET brand logo
│   │   └── vercel.json         # SPA routing for Vercel deployment
│   └── src/
│       ├── components/
│       │   ├── ui/             # AnimatedRoseBackground, Logo, Feedback
│       │   ├── layout/         # Navbar, Footer, ProtectedRoute
│       │   ├── cards/          # Profile display cards
│       │   └── discovery/      # DiscoveryProfileCard, DiscoveryFiltersModal
│       ├── pages/              # LandingPage, AuthPages, ProfileOnboarding, ProfileEdit, AuthenticatedHome, Discovery
│       ├── context/            # AuthContext (JWT auth, current user state)
│       ├── services/           # api.js (Axios client with withCredentials: true)
│       ├── App.jsx             # Smart routes and global rose-petal animation
│       ├── main.jsx
│       └── index.css           # VELVET design system
└── server/                     # Express 5 + MongoDB API
    ├── controllers/            # auth.controller.js, profile.controller.js, discovery.controller.js
    ├── models/                 # user.model.js, swipe.model.js, block.model.js
    ├── routes/                 # auth.routes.js, profile.routes.js, discovery.routes.js
    ├── middlewares/            # auth.middleware.js (JWT verification & user hydration)
    ├── utils/                  # ageValidator.js, cloudinary.js, compatibility.js, profileConstants.js, connectDB.js
    └── tests/                  # Vitest test suites (ageValidator, compatibility, discovery, profileController, userModel)
```

---

## Tech Stack

### Frontend
- **React 19** with **Vite 6**
- **Tailwind CSS 4** with curated VELVET color palette
- **Framer Motion 11** for animations & multi-step transitions
- **React Router DOM 7** with protected route guards
- **Axios 1** with credentials support
- **Lucide React** for icons
- **Vitest** & **React Testing Library** with jsdom for client tests

### Backend
- **Express 5** & Node.js
- **MongoDB Atlas** with **Mongoose 9**
- **Cloudinary SDK** for secure photo uploads & signatures
- **Multer** for memory-buffered image handling
- **JSON Web Tokens (JWT)** with HTTP-only cookies
- **bcrypt** for salted password hashing
- **Vitest** for automated unit and integration tests

---

## Getting Started

### 1. Environment Setup

#### Server Configuration (`server/.env`):
Create `server/.env` based on `server/.env.example`:
```env
PORT=8000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Atlas
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/velvet?retryWrites=true&w=majority

# JWT & Cookie
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
COOKIE_SECRET=your_cookie_signing_secret

# Optional Cloudinary Storage (Mandatory 3 photos, maximum 5 photos)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Client Configuration (`client/.env`):
```env
VITE_API_URL=http://localhost:8000/api
```

### 2. Running Locally

#### Run Backend Server:
```bash
cd server
npm install
npm run dev        # API running on http://localhost:8000
```

#### Run Frontend Client:
```bash
cd client
npm install
npm run dev        # Client running on http://localhost:5173
```

---

## Discovery & Swiping Rules (Batch 4)

### Eligibility & Exclusions:
1. **Profile Completion**: Requester must have completed onboarding (`profileCompleted: true`) to access Discovery.
2. **Self-Exclusion**: The acting user never appears in their own discovery feed and cannot like or pass themselves.
3. **Persistent Swipes**: Candidates already liked or passed by the requester (stored in `Swipe` collection) are excluded.
4. **Safety Block Exclusions**: Candidates blocked by the requester or who blocked the requester (stored in `Block` collection) are excluded in both directions.
5. **Real Cloudinary Photos**: Candidates must have at least 1 verified photo (`photos.0` exists).
6. **Strict 18+ Boundary**: Calendar-aware server age verification; underage profiles are permanently excluded.

### Compatibility Semantics:
- **Forward Compatibility**: Candidate's gender must match requester's `preferences.interestedIn` (or `"everyone"`).
- **Reciprocal Compatibility**: Requester's gender must also match candidate's `preferences.interestedIn`.
- **Age Filter**: Candidate birthdate must fall between inclusive `minAge` (≥ 18) and `maxAge` (≤ 100).
- **Interest Filter**: Candidate must share at least one selected interest (any-match convention).
- **Relationship Intention**: Candidates must match selected relationship intentions (`long-term`, `short-term`, `casual`, `friendship`, `figuring-it-out`).

---

## Discovery API Endpoints

All discovery endpoints require active JWT authentication:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/discovery` | Retrieve candidate profiles matching filters and compatibility rules (deterministic pagination) |
| `POST` | `/api/discovery/:userId/like` | Send a like to a candidate profile (persisted atomically in `Swipe` collection) |
| `POST` | `/api/discovery/:userId/pass` | Pass on a candidate profile (persisted atomically in `Swipe` collection) |
| `POST` | `/api/discovery/:userId/block` | Block a user (persisted atomically in `Block` collection) |
| `DELETE` | `/api/discovery/:userId/block` | Unblock a user |

---

## Mutual Matching, Likes & Matches Lifecycle (Batch 5)

### Source of Truth & Synchronization:
- **Canonical Action History**: `Swipe` collection tracks discovery decisions (`like` or `pass`).
- **Active Romantic Intent**: `Like` collection contains active one-sided expressions of interest.
  - Compound unique index `{ liker: 1, liked: 1 }` prevents duplicates.
  - Passing on a profile atomically removes any active outgoing like from `Like`.
  - Withdrawing a like deletes the active `Like` and resets the `Swipe` decision.
- **Durable Match Lifecycle**: `Match` collection records established connections.
  - Canonical pair ordering helper `getCanonicalPair(idA, idB)` guarantees deterministic representation (`[user1, user2]`).
  - Database-enforced compound unique index `{ user1: 1, user2: 1 }` ensures exactly one match record per unordered user pair.
  - Concurrency safety: simultaneous reciprocal likes catch MongoDB `E11000` duplicate key errors, returning the persisted match with `isNewMatch: false` so at most one request reports a newly created match.
  - Safety & Unmatching: Unmatching transitions status to `unmatched`, sets `unmatchedAt`/`unmatchedBy`, and deletes active likes between both participants so old likes cannot recreate matches without fresh mutual interest. Blocking deactivates active matches and removes active likes in both directions.

---

## Likes & Matches API Endpoints

All likes and matches endpoints require active JWT authentication:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/discovery` | Candidate profiles matching filters and compatibility rules |
| `POST` | `/api/discovery/:userId/like` | Send like; triggers atomic mutual match creation if reciprocal interest exists |
| `POST` | `/api/discovery/:userId/pass` | Pass on profile; clears active outgoing like (requires explicit unmatch if already matched) |
| `POST` | `/api/discovery/:userId/block` | Block user; deactivates match and removes active likes in both directions |
| `DELETE` | `/api/discovery/:userId/block` | Unblock user |
| `GET` | `/api/likes/received` | Active incoming likes (excluding self, blocked, and already matched profiles) |
| `GET` | `/api/likes/sent` | Active outgoing likes sent by the authenticated user |
| `DELETE` | `/api/likes/:userId` | Withdraw active outgoing like (rejected if active match exists) |
| `GET` | `/api/matches` | Active mutual matches for authenticated user, sorted by `matchedAt: -1` |
| `DELETE` | `/api/matches/:matchId` | Durable unmatch operation; idempotent and safe |

---

## Running Automated Tests

### Backend Tests:
```bash
cd server
npm test
```
*81 tests passed across 6 test suites:*
- `tests/ageValidator.test.js`: Calendar-aware adult 18+ age validation (11 tests).
- `tests/compatibility.test.js`: Gender forward/reciprocal matching and birthdate bounds (7 tests).
- `tests/discovery.test.js`: Route authorization, parameter validation, exclusions, like/pass persistence, privacy serialization, and model indexes (22 tests).
- `tests/likesAndMatches.test.js`: Genuine mutual matching, canonical pair uniqueness, concurrency race condition E11000 handling, incoming/outgoing likes pagination, unmatch idempotency, block safety cleanup (20 tests).
- `tests/profileController.test.js`: Profile update allowlist, completion checks, Cloudinary signature generation (9 tests).
- `tests/userModel.test.js`: User model constraints, photo limits, prompt limits, safe serialization (12 tests).

### Frontend Tests:
```bash
cd client
npm test
```
*33 tests passed across 6 test suites:*
- `DiscoveryProfileCard.test.jsx`: Photo carousel, profile rendering, Like/Pass interaction callbacks, disabled pending states, and keyboard shortcuts (10 tests).
- `DiscoveryFiltersModal.test.jsx`: Filter modal rendering, filter submission, range validation, and reset behavior (4 tests).
- `MatchCelebrationModal.test.jsx`: Rendering on new match confirmation, dual portraits, close/dismissal actions, accessible focus trap (5 tests).
- `UnmatchConfirmModal.test.jsx`: Confirmation dialog, cancel/unmatch actions, accessible dismissal (5 tests).
- `LikesPage.test.jsx`: Received/sent tab navigation, loading, empty states, Like Back mutual match trigger, and like withdrawal (5 tests).
- `MatchesPage.test.jsx`: Matches grid, partner profile details modal, unmatch flow, and cancellation (4 tests).

---

## Batch Progress

- [x] **Batch 1** — UI foundation, VELVET design system, animated background, landing page
- [x] **Batch 2** — Authentication, MongoDB connectivity, JWT cookies, protected routes
- [x] **Batch 3** — Real profiles, multi-step onboarding, profile editing, Cloudinary uploads (min 3, max 5 photos)
- [x] **Batch 4** — MongoDB-backed discovery, filters, persistent likes, passes, safety blocks, Tinder-style swipe cards
- [x] **Batch 5** — Genuine mutual matching, likes pages (received & sent), matches page, unmatching, and celebration modal
- [ ] **Batch 6** — Real-time private chat with Socket.IO
- [ ] **Batch 7** — Final polish, end-to-end integration, deployment

---

*Built with ♥ — VELVET End-Term Project*
