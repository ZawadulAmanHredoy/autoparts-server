# AutoParts Express — Server

Backend API for the AutoParts Express automotive parts e-commerce site
(MERN stack, TypeScript). Google OAuth, MongoDB, Stripe, Swagger docs.

## Stack

- Node.js 22, Express 4, TypeScript
- MongoDB with Mongoose
- Google OAuth (Passport) — the only sign-in method
- Stripe payments (dev mode: orders auto-confirm when no key is set)
- Swagger docs at `/api-docs`
- Vitest + supertest + mongodb-memory-server

## Getting started

```bash
npm install
cp .env.example .env   # add GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
npm run dev            # http://localhost:5000
```

Create an OAuth client at <https://console.cloud.google.com/apis/credentials>
and set `GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Watch-mode dev server (tsx) |
| `npm run build` | TypeScript compile to `dist/` |
| `npm start` | Run compiled server |
| `npm test` | Vitest suite |
| `npm run seed` | Seed catalog + demo data |
| `npm run seed:admin` | Create admin user |

The shared types/schemas/fitment logic live in `src/shared/` (inlined from the
former monorepo `@autoparts/shared` package).
