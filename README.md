# 🔧 FlatFix - On‑Demand Tire Services PWA

FlatFix is a MERN PWA for roadside tire help. It runs a React TypeScript client on Vercel and a hardened Express API on Render with MongoDB Atlas.

Key updates in this version:
- No WebSockets/maps; realtime UX via lightweight polling
- GPS capture + OpenStreetMap (Nominatim + Overpass) shop suggestions
- Unified pricing with $20 base across services and jumpstart cap
- Profile page with avatar presets, technician equipment, and online toggle
- Customer request details modal and shop‑coordination estimates

## 🚗 Features

### For customers
- Request help with GPS, pick a nearby shop (optional)
- Service types: air inflation, spare replacement, shop coordination, lockout, jumpstart, fuel delivery
- Live estimates: shop coordination uses round‑trip miles; jumpstart caps at $45
- View your requests and details (pricing breakdown, selected shop)

### For technicians
- Job marketplace (first‑come, first‑serve) with polling refresh
- Online/offline toggle and equipment flags (lockout kit, jump starter, fuel can)
- Only see jobs you can perform based on equipment

### Technical
- React + TypeScript PWA, mobile‑first
- Express 5 API with CORS allowlist, rate limiting, Joi validation, Winston logging
- JWT auth (login/register/profile) and consistent JSON error handling
- OSM geosearch for nearby shops (no keys)

## 🧾 Pricing
- Base fee: $20 for all services
- Spare replacement: +$15 service
- Shop coordination: +$30 labor + $1.50/mi (round‑trip miles), customer pays the shop directly for tires
- Lockout: +$25 service
- Jumpstart: $20 base includes first jump; up to 2 extra attempts at $12.50 each; total capped at $45
- Fuel delivery: +$10/gal (max 2)

## 🛠 Tech stack

Frontend
- React 19 + TypeScript, CRA
- React Router
- PWA with service worker

Backend
- Node 18 + Express 5
- MongoDB (Mongoose)
- JWT auth, Joi validation, express‑rate‑limit, Winston

Infra
- Client: Vercel (rewrites /api to API)
- API: Render

## 🌐 Live URLs
- App (Vercel): https://flat-fix.vercel.app
- API (Render): https://flatfix.onrender.com

## 🚀 Quick start (local)

Prereqs: Node 18+, npm 9+, MongoDB Atlas (or local Mongo), a JWT secret

1) Clone
```bash
git clone https://github.com/dguma/FlatFix.git
cd FlatFix
```

2) Server env (server/.env)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/flatfix?retryWrites=true&w=majority
JWT_SECRET=replace_me
# Optional CORS for Vercel preview/prod (comma‑separated)
FRONTEND_URLS=https://flat-fix.vercel.app
```

3) Install deps
```bash
npm --prefix server install
npm --prefix client install
```

4) Run
```bash
# Terminal A (API)
npm run dev --prefix server

# Terminal B (client)
npm start --prefix client
```
Client: http://localhost:3000  API: http://localhost:5000

## 📂 Structure
```
FlatFix/
├─ client/                      # React app (CRA)
│  ├─ public/                   # index.html, manifest, icons
│  └─ src/
│     ├─ components/            # Header, ProtectedRoute, CustomerServiceView, etc.
│     ├─ pages/                 # Home, ServiceRequest, Dashboards, Profile, etc.
│     ├─ contexts/              # AuthContext, SocketContext (placeholder)
│     └─ hooks/                 # useGeolocation
├─ server/                      # Express API
│  ├─ routes/                   # auth, services, profile, users
│  ├─ models/                   # User, ServiceRequest
│  ├─ middleware/               # authenticateToken, validate
│  └─ index.js                  # API bootstrap
├─ vercel.json                  # /api rewrites to Render
└─ README.md
```

## 🔌 API (high‑level)

Auth
- POST /api/auth/register
- POST /api/auth/login
- GET  /api/auth/profile

Services
- POST /api/services/request
- GET  /api/services/available           (tech)
- POST /api/services/claim/:requestId    (tech)
- GET  /api/services/my-requests         (customer)
- GET  /api/services/my-jobs             (tech)
- PATCH /api/services/status/:requestId  (tech)
- GET  /api/services/:requestId          (owner/assigned)
- GET  /api/services/shops/suggestions   (OSM: postal or lat/lon)

Profile
- GET  /api/profile/me
- PATCH /api/profile/avatar               { avatarUrl }
- PATCH /api/profile/equipment            { lockoutKit?, jumpStarter?, fuelCan? }
- PATCH /api/profile/online               { online: boolean }
- GET  /api/profile/technicians/online-count

Notes
- Shop‑pickup estimates: base + labor + per‑mile × round‑trip miles; tires are paid directly to the shop
- Jumpstart estimate caps at $45

## 🧪 Tests
Server uses Jest + Supertest.
```bash
npm test --prefix server
```

## 🏗️ Deploy

Vercel (client)
- vercel.json rewrites /api/* to the Render API

Render (API)
- Node 18, install server deps (Joi in production deps)
- Set env vars (MONGODB_URI, JWT_SECRET, FRONTEND_URLS)

## 📱 PWA
- Installable (CRA service worker)
- Responsive design
- Hero image uses CDN with fallback for reliability in production

## 📄 License
ISC

---

FlatFix — fixing tires, one call at a time 🚗💨
