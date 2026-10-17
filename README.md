# VELVET 💜

> *Some connections are written in the stars.*

VELVET is a premium full-stack MERN dating application designed for meaningful, compatibility-driven connections.

---

## Project Structure

```
velvet/
├── client/               # React 19 + Vite + Tailwind CSS 4 frontend
│   ├── public/
│   │   └── vercel.json   # SPA routing for Vercel deployment
│   └── src/
│       ├── components/
│       │   ├── ui/       # Logo, Feedback (loading/error)
│       │   ├── layout/   # Navbar, Footer
│       │   └── cards/    # SampleProfileCard
│       ├── pages/        # LandingPage, AuthPages, PlaceholderPage
│       ├── context/      # React context (Batch 2+)
│       ├── services/
│       │   └── axiosCalls/  # API call functions (Batch 2+)
│       ├── assets/
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css     # VELVET design system
└── server/               # Express 5 + MongoDB API (Batch 2+)
    ├── controllers/
    ├── models/
    ├── routes/
    ├── middlewares/
    ├── utils/
    ├── sockets/
    ├── scripts/
    └── tests/
```

---

## Tech Stack

### Frontend
| Library | Version |
|---|---|
| React | 19 |
| Vite | 6 |
| Tailwind CSS | 4 |
| React Router DOM | 7 |
| Framer Motion | 11 |
| Axios | 1 |
| Lucide React | latest |

### Backend (Batch 2+)
| Library | Version |
|---|---|
| Express | 5 |
| Mongoose | 9 |
| jsonwebtoken | 9 |
| bcrypt | 5 |
| cors | 2 |
| cookie-parser | 1 |
| dotenv | 16 |
| nodemon | 3 |

---

## Getting Started

### Frontend

```bash
cd client
npm install
npm run dev       # Development server → http://localhost:5173
npm run build     # Production build
npm run preview   # Preview production build
```

### Backend (coming in Batch 2)

```bash
cd server
npm install
cp .env.example .env   # Fill in your secrets
npm run dev
```

---

## Routes

| Path | Page |
|---|---|
| `/` | Landing page |
| `/login` | Login |
| `/register` | Register |
| `/discover` | Browse profiles |
| `/profile/setup` | Create profile |
| `/profile/edit` | Edit profile |
| `/likes` | Who liked you |
| `/matches` | Your matches |
| `/chat` | Messages list |
| `/chat/:matchId` | Conversation |
| `/settings` | Account settings |

---

## Design System

- **Palette**: Deep burgundy, wine-red, blush pink, warm cream, near-black
- **Display font**: Cormorant Garamond (serif)
- **Body font**: Inter (sans-serif)
- **Style**: Glassmorphism, soft gradients, constellation motifs, editorial layouts
- **Animations**: Framer Motion for page transitions and scroll reveals

---

## Deployment

The frontend is configured for Vercel SPA routing via `client/public/vercel.json`.

```bash
# Vercel CLI
cd client
vercel --prod
```

---

## Batch Progress

- [x] **Batch 1** — Project scaffold, design system, landing page, route placeholders
- [ ] **Batch 2** — Authentication (register/login, JWT, cookies)
- [ ] **Batch 3** — Profile setup and editing
- [ ] **Batch 4** — Discover (swipe/like)
- [ ] **Batch 5** — Matching and messaging
- [ ] **Batch 6** — Real-time chat with Socket.IO
- [ ] **Batch 7** — Polish, testing, deployment

---

*Built with ♥ — VELVET End-Term Project*
