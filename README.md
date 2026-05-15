# MUS Welfare Organization — Login & Signup (Phase 1)

Full-stack authentication system with a React frontend and Node.js/Express backend.

---

## Project Structure

```
mus-app/
├── frontend/                   ← React + Vite
│   ├── src/
│   │   ├── App.jsx             ← Router + route guards
│   │   ├── main.jsx            ← Entry point
│   │   ├── styles/
│   │   │   └── global.css      ← Design system (fonts, buttons, forms)
│   │   ├── api/
│   │   │   └── index.js        ← Axios API client
│   │   ├── context/
│   │   │   └── AuthContext.jsx ← Global auth state (login/logout)
│   │   └── pages/
│   │       ├── Login.jsx       ← Split-layout login page
│   │       └── Signup.jsx      ← Multi-step signup (3 steps)
│   ├── index.html
│   └── package.json
│
└── backend/                    ← Node.js + Express
    ├── src/
    │   ├── server.js           ← Express app entry
    │   ├── db/
    │   │   └── db.js           ← JSON file-based database
    │   ├── middleware/
    │   │   └── auth.js         ← JWT verify middleware
    │   └── routes/
    │       └── auth.js         ← /register, /login, /me
    ├── data/                   ← Auto-created: users.json etc.
    ├── .env                    ← Environment variables
    └── package.json
```

---

## Prerequisites

Make sure you have these installed:

| Tool    | Version  | Check command        | Download                     |
|---------|----------|----------------------|------------------------------|
| Node.js | 18+      | `node -v`            | https://nodejs.org           |
| npm     | 8+       | `npm -v`             | Comes with Node.js           |

> **Tip:** Use [nvm](https://github.com/nvm-sh/nvm) to manage Node versions on Mac/Linux.

---

## Setup & Run

You need **two terminal windows** — one for backend, one for frontend.

### Terminal 1 — Backend (API Server)

```bash
# 1. Enter backend folder
cd mus-app/backend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

You should see:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🟢  MUS Welfare API
  ➜   http://localhost:5000
  ➜   Health: http://localhost:5000/api/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Terminal 2 — Frontend (React App)

```bash
# 1. Enter frontend folder
cd mus-app/frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

**Open:** http://localhost:5173 in your browser.

---

## Environment Variables

The backend reads from `backend/.env`:

```env
PORT=5000
JWT_SECRET=mus_welfare_jwt_secret_2026
NODE_ENV=development
```

> ⚠️ Change `JWT_SECRET` to a long random string in production!

---

## API Endpoints

### Auth Routes (no authentication needed)

| Method | Endpoint              | Body                                                  | Returns                    |
|--------|-----------------------|-------------------------------------------------------|----------------------------|
| POST   | `/api/auth/register`  | `{ fullName, email, password, phone, memberType, castFamily }` | `{ token, user }`  |
| POST   | `/api/auth/login`     | `{ email, password }`                                 | `{ token, user }`          |
| GET    | `/api/auth/me`        | *(Header: `Authorization: Bearer <token>`)*           | `{ user object }`          |
| GET    | `/api/health`         | —                                                     | `{ status: "ok" }`         |

### Member Types

| Value        | Description        | Min Contribution |
|--------------|--------------------|-----------------|
| `job_holder` | Employed member    | PKR 500/month   |
| `student`    | Student member     | PKR 100/month   |

---

## Testing the API (without frontend)

You can test with `curl` or any REST client (Postman, Insomnia, Bruno).

### Register a new member
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Ahmad Khan",
    "email": "ahmad@example.com",
    "password": "password123",
    "memberType": "job_holder",
    "phone": "+92 300 1234567",
    "castFamily": "Yousafzai"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmad@example.com",
    "password": "password123"
  }'
```

### Get own profile (use token from login response)
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## How Authentication Works

```
  USER           FRONTEND           BACKEND          DATABASE (JSON)
   │                │                  │                   │
   │ Login form     │                  │                   │
   │──────────────►│                  │                   │
   │                │ POST /login      │                   │
   │                │─────────────────►│                   │
   │                │                  │ Read users.json   │
   │                │                  │──────────────────►│
   │                │                  │◄──────────────────│
   │                │                  │ bcrypt.compare()  │
   │                │  { token, user } │                   │
   │                │◄─────────────────│                   │
   │                │ localStorage     │                   │
   │                │  .setItem(token) │                   │
   │ Redirect to    │                  │                   │
   │  /dashboard   ◄│                  │                   │
```

- Passwords are **hashed with bcrypt** (12 rounds) before storing.
- JWT tokens expire in **7 days**.
- Tokens are stored in `localStorage` and sent as `Bearer` headers.

---

## Signup Flow (3 Steps)

```
Step 1: Choose Membership Type
  ┌─────────────────┐   ┌─────────────────┐
  │  💼 Job Holder  │   │   🎓 Student    │
  │  Min PKR 500    │   │  Min PKR 100    │
  └─────────────────┘   └─────────────────┘

Step 2: Personal Information
  Full Name, Email, Phone, Cast/Family

Step 3: Create Password
  Password + Confirm + Strength Indicator + Account Summary
  → Submit → JWT token → Redirect to /dashboard
```

---

## Data Storage

User data is stored as plain JSON in `backend/data/users.json`:

```json
[
  {
    "id": "uuid-here",
    "fullName": "Ahmad Khan",
    "email": "ahmad@example.com",
    "password": "$2a$12$hashedpassword...",
    "phone": "+92 300 1234567",
    "memberType": "job_holder",
    "castFamily": "Yousafzai",
    "role": "member",
    "status": "active",
    "joinedAt": "2026-05-11T10:00:00.000Z",
    "totalContributed": 0
  }
]
```

---

## Available Scripts

### Backend
```bash
npm run dev    # Start with auto-reload (--watch)
npm start      # Start without auto-reload (production)
```

### Frontend
```bash
npm run dev     # Start Vite dev server (hot reload)
npm run build   # Build for production → dist/
npm run preview # Preview production build locally
```

---

## Tech Stack

| Layer    | Technology              | Purpose                        |
|----------|-------------------------|--------------------------------|
| Frontend | React 19                | UI framework                   |
| Frontend | React Router v7         | Client-side routing            |
| Frontend | Axios                   | HTTP client                    |
| Frontend | Vite                    | Build tool + dev server        |
| Frontend | Fraunces + Sora (Google)| Typography                     |
| Backend  | Node.js + Express       | REST API server                |
| Backend  | bcryptjs                | Password hashing               |
| Backend  | jsonwebtoken            | JWT auth tokens                |
| Backend  | dotenv                  | Environment config             |
| Database | JSON files              | Lightweight file-based storage |

---

## Coming Next (Phase 2)

- [ ] Dashboard page with contribution history
- [ ] Monthly contribution submission form
- [ ] Announcements board
- [ ] Admin panel for managing members
- [ ] Committee member profiles

---

## Executive Committee 2026–2027

| Name              | Role              |
|-------------------|-------------------|
| Sadam ullah Jan   | Chairman          |
| Aftab Shaban      | President         |
| Basharat Hassan   | General Secretary |
| Ehtisham Bulbul   | Vice President    |
| Akram ullah       | Finance Secretary |
| Zahid Ali         | Coordinator       |