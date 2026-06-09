# 09 — Environment, Secrets & Deploy

## 9.1 Environment variables

### Backend (`server/.env`) — all secret, never in client (NestJS reads via @nestjs/config)
```
# Server
PORT=3005
NODE_ENV=production
APP_ORIGIN=https://app.<yourdomain>        # for owner CORS
PUBLIC_CORS=*                              # /public/* allows any origin (widget on customer sites)

# Database (Prisma reads DATABASE_URL)
DATABASE_URL=postgres://user:pass@host:5432/kaligan
# pgvector dim must match embedding model
EMBEDDING_DIM=384

# Auth
JWT_ACCESS_SECRET=<random 32+ bytes>
JWT_REFRESH_SECRET=<random 32+ bytes>
ACCESS_TTL=900            # 15 min (seconds)
REFRESH_TTL=2592000       # 30 days

# Gemini (server-side ONLY — used for chat completion + minting voice ephemeral tokens)
GEMINI_API_KEY=<server secret>
GEMINI_TEXT_MODEL=gemini-2.0-flash         # chat completion (tune)
VOICE_MODEL=gemini-2.5-flash-native-audio-preview-09-2025

# Embeddings (fastembed runs locally; no key). If using managed Gemini embeddings instead:
# EMBEDDINGS_PROVIDER=fastembed|gemini

# Misc
MAX_UPLOAD_MB=10
RAG_TOP_K=5
RAG_THRESHOLD=0.35
```

### Frontend app (`app/.env`) — NON-secret only
```
VITE_API_BASE_URL=https://api.<yourdomain>/api/v1
# NO GEMINI KEY HERE. NO SECRETS HERE.
```

### Widget build — NON-secret
```
WIDGET_API_BASE_URL=https://api.<yourdomain>/api/v1
# workspace public_key comes from the host page's data-key attribute, not env
```

> Generate secrets with `openssl rand -base64 48`. Rotate the previously-leaked Turso token regardless (it must be considered compromised).

## 9.2 Secret handling rules
- Secrets live only in the platform's env/secret store (Render/Vercel dashboards), never in committed files.
- `.env.example` is committed with **placeholder** values; real `.env` is git-ignored (the existing `.gitignore`s already ignore `.env`).
- Client/widget bundles must contain **zero** secrets — add a CI step that greps the built JS for key patterns and fails on match.

## 9.3 Deploy targets
- **Backend:** Render Web Service (Node, NestJS). Managed Postgres with `pgvector` (enable the extension; Render Postgres supports it, or use Neon/Supabase which ship pgvector). `buildCommand: npm install && npx prisma generate && npm run build && npx prisma migrate deploy`; `startCommand: node dist/main.js`. Health check at `/api/v1/health` (a simple `HealthController`).
- **Frontend app:** Vercel (Vite static build + SPA rewrite). The existing `vercel.json` rewrite-to-`index.html` pattern works.
- **Widget `w.js`:** build to a single minified file; serve from a CDN/static host (Vercel static, or a `cdn.<yourdomain>` bucket). Long cache + versioned filename or cache-busting.

## 9.4 Keep-alive
Reuse the existing GitHub Actions keep-alive pattern (`Voice/.github/workflows/keep-alive.yml`) pointed at the new backend health endpoint to prevent free-tier cold starts. Update the URL.

## 9.5 Migrations & seed on deploy
- Run migrations on deploy (build or release step). Forward-only.
- Provide a `seed` script for staging/demo only (creates demo tenant + ingests sample policy). Never auto-seed production.

## 9.6 Local development
```
docker compose up -d            # postgres + pgvector
cd server && npm i && npx prisma migrate dev && npm run seed && npm run start:dev   # Nest :3005
cd app && npm i && npm run dev                                                      # :3000 (proxy /api → 3005)
cd widget && npm i && npm run dev                                                   # serves w.js + a test host page
```
Keep the existing Vite dev proxy idea (`/api` → backend) so the app talks to the local Nest server without CORS friction.

## 9.7 Cost & quota notes
- Embeddings are free (local fastembed). Gemini text + Live audio are billed to the server's key — add per-public-key rate limiting (`03.9`) so one tenant/visitor can't exhaust quota.
- Voice session caps (≈15 min audio) and token windows are handled in `06.3`; surface friendly "call ended" UX rather than silent failures.
