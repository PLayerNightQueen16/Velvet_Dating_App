# VELVET 🌹

> *"I once believed love would be burning red...then you turned my world crimson instead"*

VELVET is an intimate, cinematic dating platform built for meaningful, compatibility-driven romantic connections. Blending rich crimson aesthetics, dynamic ambient particle effects, and rigorous engineering, VELVET delivers a modern dating experience featuring calendar-accurate age verification, real-time messaging, intelligent discovery matching, and uncompromising privacy safeguards.

---

## 🌟 Key Highlights & Features

### 🌹 Romantic & Cinematic Interface
- **Velvet Design System**: Deep crimson, dark rose, and midnight charcoal tones (`#12080C`, `#3A0D1A`, `#8B1E3F`, `#E05370`, `#FDE7E9`).
- **Ambient Visual Effects**: Flowing canvas particle system featuring floating crimson rose petals, ambient light motes, and shimmering glitter.
- **Glassmorphic Components**: Polished translucent cards with glowing borders and micro-interactions powered by Framer Motion.

### 👤 Profile Studio & Adult Verification
- **Calendar-Aware Age Validation**: Server-enforced boundary ensuring all accounts are 18+ (leap-year compliant, strictly evaluated on birthdate).
- **Curated Media Uploads**: Integrated with Cloudinary for fast, optimized image delivery (minimum 3, maximum 5 photos per profile).
- **Romantic Prompts & Interests**: Deep personal storytelling with structured prompts, lifestyle tags, relationship intentions, languages, and education.

### 🔍 Intelligent Discovery Deck
- **Reciprocal Compatibility Matching**: Bidirectional filtering ensuring users only see candidates whose preferences align mutually with their own.
- **Dynamic Filters**: Real-time filtering by age range, distance, shared interests, and relationship goals.
- **Intuitive Swipe Interface**: Fluid Tinder-style card gestures, keyboard navigation (arrow keys), and persistent like/pass actions.

### 💫 Atomic Mutual Matching
- **Concurrency-Safe Matching**: Race-condition resilient mutual like resolution using MongoDB canonical pairs (`[user1, user2]`) and unique indexes (`E11000` handling).
- **Likes & Matches Hub**: Dedicated views for sent likes, incoming likes with instant "Like Back" mutual matching, and active matches.
- **Match Celebration**: Immersive modal celebration when mutual affection is sparked.

### 💬 Real-Time Crimson Chat
- **Socket.IO Real-Time Engine**: Instant messaging with live typing events, read receipts, and real-time conversation previews.
- **Robust REST Fallback**: Seamless polling and message persistence in MongoDB when WebSockets reconnect or disconnect.
- **Strict Authorization**: Chat access is strictly restricted to active, non-blocked match participants.

### 🛡️ Privacy & Safety Guardian
- **Bidirectional Blocking**: Instantly revokes discovery visibility, existing matches, and active chat access in both directions.
- **Confidential Reporting**: Secure submission of moderation reports with categorization and optional blocking.
- **Privacy Controls**: Granular toggles for profile discoverability, online presence, and last-active timestamps.
- **Account Deletion & Security**: Multi-step password rotation with session token version invalidation and full GDPR-compliant data cleanup.

---

## 🏗️ Architecture & Tech Stack

```
velvet/
├── client/                     # React 19 Single Page Application
│   ├── public/                 # Static assets & brand logos
│   │   ├── logo.png            # VELVET brand mark
│   │   └── vercel.json         # SPA routing fallback for Vercel
│   ├── src/
│   │   ├── components/         # Reusable UI, layout, discovery, chat, and modal components
│   │   ├── context/            # AuthContext (authentication & session management)
│   │   ├── pages/              # Landing, Auth, Onboarding, Discovery, Likes, Matches, Chat, Settings
│   │   ├── services/           # Axios API client (credentials enabled) & Socket.IO client
│   │   ├── index.css           # Tailwind CSS 4 theme tokens & custom animations
│   │   └── setupTests.js       # Vitest + React Testing Library setup
│   ├── package.json
│   ├── vercel.json             # Vercel deployment configuration
│   └── vite.config.js          # Vite 6 configuration with Tailwind CSS 4
│
├── server/                     # Express 5 REST & WebSocket API
│   ├── controllers/            # Auth, Profile, Discovery, Likes, Matches, Chat, Safety, Account
│   ├── middlewares/            # JWT verification & session authentication middleware
│   ├── models/                 # Mongoose schemas (User, Swipe, Like, Match, Message, Block, Report)
│   ├── routes/                 # Express API route modules
│   ├── scripts/                # Demo profile seeding with safety gates
│   ├── socket/                 # Socket.IO connection handling & authenticated chat rooms
│   ├── tests/                  # Vitest backend unit & integration test suites
│   ├── utils/                  # Age validator, compatibility engine, Cloudinary, DB connection, JWT
│   ├── package.json
│   ├── render.yaml             # Render web service blueprint
│   └── index.js                # Server entry point with trust-proxy & multi-origin CORS
│
└── render.yaml                 # Root Render deployment blueprint
```

### Technology Matrix

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 6, Tailwind CSS 4, Framer Motion 11, React Router 7, Axios, Lucide Icons |
| **Backend** | Node.js, Express 5, Socket.IO 4, Mongoose 9, JWT, bcrypt, Cookie-Parser, Multer |
| **Database & Media** | MongoDB Atlas, Cloudinary CDN |
| **Testing** | Vitest, React Testing Library, JSDOM, Supertest-compatible unit tests |
| **Hosting** | Vercel (Frontend), Render (Backend), MongoDB Atlas (Database) |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/velvet_dev`) or a MongoDB Atlas cluster URI
- **Cloudinary Account** *(optional for local testing)*: Cloud name, API key, and secret for photo uploads

---

### Step 1: Clone & Configure

```bash
git clone https://github.com/PLayerNightQueen16/Velvet_Dating_App.git
cd Velvet_Dating_App
```

#### Backend Environment Setup
Create `server/.env` using the provided template:
```bash
cp server/.env.example server/.env
```

Configure `server/.env`:
```env
PORT=8000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/velvet_dev
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
JWT_EXPIRES_IN=7d
COOKIE_SECRET=your_cookie_signing_secret_key
CLIENT_URL=http://localhost:5173

# Cloudinary (Optional for demo seeding, required for real photo uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Demo Seeding Controls
SEED_DEMO_PROFILES=true
ALLOW_PRODUCTION_DEMO_SEED=false
```

#### Frontend Environment Setup
Create `client/.env` using the template:
```bash
cp client/.env.example client/.env
```

Configure `client/.env`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_SERVER_URL=http://localhost:8000
```

---

### Step 2: Install Dependencies

```bash
# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

---

### Step 3: Seed Demo Profiles (Optional)

VELVET includes a safe, deterministic seeding script providing 9 diverse fictional adult profiles (3 women, 3 men, 3 non-binary) with high-definition portraits, rich prompts, and varied relationship intentions:

```bash
cd server
npm run seed:demo
```
> **Safety Guard**: The script requires `SEED_DEMO_PROFILES=true`. It executes idempotently (running multiple times updates rather than duplicates accounts) and tags all created records with `isDemo: true`.

---

### Step 4: Run the Application

In terminal 1 (Backend API):
```bash
cd server
npm run dev
# Server starts on http://localhost:8000
# Health check available at http://localhost:8000/health
```

In terminal 2 (Frontend Client):
```bash
cd client
npm run dev
# Frontend starts on http://localhost:5173
```

Open your browser to `http://localhost:5173` to experience VELVET.

---

## 🧪 Automated Testing

Both client and server have comprehensive automated test suites using **Vitest**:

### Backend Tests (117 tests across 8 test suites)
```bash
cd server
npm test
```
- `tests/ageValidator.test.js`: Strict calendar-aware 18+ age checks and leap-year boundaries.
- `tests/compatibility.test.js`: Bidirectional gender compatibility and age-range verification.
- `tests/userModel.test.js`: User schema validation, photo limits, prompt limits, and password hashing.
- `tests/profileController.test.js`: Profile update allowlists, completion checks, and upload authorization.
- `tests/discovery.test.js`: Discovery feed filters, exclusions, pagination, and swipe persistence.
- `tests/likesAndMatches.test.js`: Atomic mutual matching, race conditions, like withdrawals, and unmatch lifecycle.
- `tests/chat.test.js`: Message persistence, unread counters, match authorization, and participant verification.
- `tests/safetyAndAccount.test.js`: Blocking, unblocking, moderation reports, privacy settings, and account deletion.

### Frontend Tests (70 tests across 13 test suites)
```bash
cd client
npm test
```
- Component tests for Discovery Cards, Filter Modals, Match Celebrations, Unmatch Confirmations, Report Modals, Settings, Likes, and Chat.

### Production Build Verification
```bash
cd client
npm run build
```
Generates an optimized, minified bundle in `client/dist` ready for static CDN deployment.

---

## 🌐 Production Deployment Guide

Deploying VELVET to production utilizes a decoupled architecture:
- **Frontend**: Hosted on **Vercel** (Global Edge CDN with SPA rewrites).
- **Backend**: Hosted on **Render** (Node.js Web Service with WebSockets and reverse proxy trust).
- **Database**: **MongoDB Atlas** (Managed Cloud Database).
- **Storage**: **Cloudinary** (Secure image uploads).

```
                      ┌────────────────────────┐
                      │   Vercel (Frontend)    │
                      │  https://app.velvet... │
                      └───────────┬────────────┘
                                  │ HTTPS / WSS
                                  ▼
                      ┌────────────────────────┐
                      │    Render (Backend)    │
                      │  https://api.velvet... │
                      └───────┬────────┬───────┘
                              │        │
                     MongoDB  │        │ Cloudinary API
                              ▼        ▼
                      ┌──────────────┐ ┌──────────────┐
                      │MongoDB Atlas │ │  Cloudinary  │
                      └──────────────┘ └──────────────┘
```

---

### Part 1: MongoDB Atlas Setup

1. Create a free M0 cluster or dedicated cluster at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas).
2. **Database Access**: Under *Security > Database Access*, create a database user (e.g., `velvet_admin`) with read and write permissions to the database.
3. **Network Access**: Under *Security > Network Access*, add IP address `0.0.0.0/0` (Allow access from anywhere) so that Render's dynamic outbound IPs can connect.
4. **Connection String**: Click *Connect > Drivers*, copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/velvet_prod?retryWrites=true&w=majority
   ```
   *(Ensure special characters in your password are URL-encoded).*

---

### Part 2: Render Backend Deployment

VELVET includes a native `render.yaml` blueprint for one-click setup.

#### Option A: Deploy via Render Blueprint (Recommended)
1. Push your repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New + > Blueprint**.
3. Select your `Velvet_Dating_App` repository.
4. Render will detect `render.yaml` and configure the web service automatically.
5. In the environment configuration, supply your real `MONGO_URI`, `CLIENT_URL`, and Cloudinary keys.

#### Option B: Manual Web Service Setup
1. In the Render Dashboard, click **New + > Web Service**.
2. Connect your GitHub repository.
3. Configure the following service settings:
   - **Name**: `velvet-api`
   - **Region**: Oregon or Ohio (closest to your Atlas cluster)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
4. Add the following **Environment Variables**:

| Variable | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production cookie security & optimizations |
| `PORT` | `10000` | Port automatically assigned by Render |
| `MONGO_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection URI |
| `JWT_SECRET` | *(generate 64-char string)* | Strong secret key for signing auth tokens |
| `JWT_EXPIRES_IN` | `7d` | Token expiration period |
| `COOKIE_SECRET` | *(generate 64-char string)* | Key for signing HTTP-only session cookies |
| `CLIENT_URL` | `https://your-velvet-app.vercel.app` | Vercel production URL (CORS allowlist) |
| `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Cloudinary credentials |
| `CLOUDINARY_API_KEY` | `your_api_key` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `your_api_secret` | Cloudinary API secret |
| `SEED_DEMO_PROFILES` | `false` | Disabled by default in production |

5. Click **Create Web Service**. Once deployed, Render will provide a service URL (e.g. `https://velvet-api.onrender.com`).
6. Verify deployment by visiting `https://velvet-api.onrender.com/health` in your browser. You should receive:
   ```json
   {
     "status": "ok",
     "service": "VELVET Dating App API",
     "uptime": 12.4,
     "env": "production"
   }
   ```

---

### Part 3: Vercel Frontend Deployment

1. Navigate to the [Vercel Dashboard](https://vercel.com) and click **Add New... > Project**.
2. Import your GitHub repository: `PLayerNightQueen16/Velvet_Dating_App`.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables**:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://velvet-api.onrender.com/api` |
| `VITE_SERVER_URL` | `https://velvet-api.onrender.com` |

5. Click **Deploy**. Vercel will install dependencies, build the client, and deploy the application to a high-speed CDN URL (e.g. `https://velvet-dating.vercel.app`).
6. **Final CORS Sync**: If your final Vercel domain differs from what you entered in Render, update `CLIENT_URL` in your Render Environment Variables to match your Vercel domain, and trigger a redeploy of Render.

---

## 🔒 Production Security & Cookie Architecture

VELVET adheres to strict modern web security practices:

1. **Cross-Origin HTTP-Only Authentication**:
   - In production (`NODE_ENV=production`), session cookies are marked with `SameSite=None; Secure=true; HttpOnly=true; Path=/`.
   - Express enables `app.set("trust proxy", 1)` so that HTTPS forwarded through Render's reverse proxy correctly satisfies the `Secure` attribute.
2. **Strict CORS Policy**:
   - Access-Control headers are restricted exclusively to the configured `CLIENT_URL` (and Vercel preview domains). Permissive wildcards (`*`) are disallowed for credentialed endpoints.
3. **Socket.IO Session Synchronization**:
   - WebSocket handshakes inspect the signed HTTP-only cookie to authenticate clients, rejecting unauthenticated socket connections before any room join.
4. **Token Invalidation Versioning**:
   - Changing passwords or updating critical security settings increments the user's `tokenVersion`, instantly invalidating all active web and WebSocket sessions across all devices.

---

## 📡 API Reference

All requests and responses use standard `application/json` payloads. Authenticated routes require the `velvet_token` HTTP-only cookie.

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/register` | Register new account (name, username, email, password) | No |
| `POST` | `/api/auth/login` | Authenticate with credentials and receive HTTP-only cookie | No |
| `POST` | `/api/auth/logout` | Clear authentication cookie and terminate session | Yes |
| `GET` | `/api/auth/me` | Fetch currently authenticated user session | Yes |

### Profile (`/api/profile`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/profile/me` | Retrieve own complete profile | Yes |
| `PATCH` | `/api/profile/me` | Partially update profile details | Yes |
| `PUT` | `/api/profile/me/onboarding` | Save onboarding step progress | Yes |
| `POST` | `/api/profile/me/complete` | Validate criteria and mark profile as complete | Yes |
| `POST` | `/api/profile/me/photos` | Upload a photo file (multipart/form-data or URL) | Yes |
| `PATCH` | `/api/profile/me/photos/:id/primary` | Set designated primary photo | Yes |
| `DELETE` | `/api/profile/me/photos/:id` | Remove a photo from profile | Yes |
| `GET` | `/api/profile/me/photos/upload-signature` | Retrieve Cloudinary signature for direct upload | Yes |

### Discovery & Swiping (`/api/discovery`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/discovery` | Paginated candidate profiles matching preferences | Yes |
| `POST` | `/api/discovery/:userId/like` | Send like; creates mutual match if reciprocal interest exists | Yes |
| `POST` | `/api/discovery/:userId/pass` | Pass on candidate profile | Yes |
| `POST` | `/api/discovery/:userId/block` | Block user from discovery and deactivate matches | Yes |
| `DELETE` | `/api/discovery/:userId/block` | Unblock a previously blocked user | Yes |

### Likes & Matches (`/api/likes`, `/api/matches`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/likes/received` | List users who have liked the authenticated user | Yes |
| `GET` | `/api/likes/sent` | List profiles the authenticated user has liked | Yes |
| `DELETE` | `/api/likes/:userId` | Withdraw an active outgoing like | Yes |
| `GET` | `/api/matches` | Retrieve all active mutual matches with preview data | Yes |
| `DELETE` | `/api/matches/:matchId` | Safely and durably unmatch a connection | Yes |

### Real-Time Chat (`/api/chat`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/chat/conversations` | List all active match conversations with latest messages | Yes |
| `GET` | `/api/chat/messages/:matchId` | Fetch message history for a specific match | Yes |
| `POST` | `/api/chat/messages/:matchId` | Send message via REST API (fallback for WebSocket) | Yes |
| `POST` | `/api/chat/read/:matchId` | Mark conversation messages as read | Yes |
| `GET` | `/api/chat/unread` | Get unread message counts across all conversations | Yes |

### Safety, Privacy & Account (`/api/blocks`, `/api/reports`, `/api/privacy`, `/api/account`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/blocks` | List currently blocked users | Yes |
| `POST` | `/api/reports` | Submit a safety moderation report | Yes |
| `GET` | `/api/privacy` | Retrieve current privacy and discoverability settings | Yes |
| `PATCH` | `/api/privacy` | Update discoverability or activity visibility | Yes |
| `POST` | `/api/account/change-password` | Update password and invalidate other sessions | Yes |
| `DELETE` | `/api/account` | Permanently delete account and execute data cleanup | Yes |

---

## 📄 License & Attribution

Designed and engineered with passion for the **VELVET** Dating Platform.

All demo imagery used in development is sourced from copyright-free Unsplash collections with royalty-free licensing.
