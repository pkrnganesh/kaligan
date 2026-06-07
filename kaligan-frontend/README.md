# KaliGanAI — Frontend (V1)

An AI employee that converts website visitors into qualified leads automatically — over **chat and voice**.

This is the **frontend application** (Phase 1): a fully clickable React app with realistic mock data and no backend yet. It's the design-locked foundation you build the FastAPI + Gemini + pgvector backend behind.

## Stack
React 19 · TypeScript · Vite · Tailwind CSS · React Router. No backend — all data is mocked in `src/data/mock.ts`.

## Run it locally
```bash
npm install
npm run dev      # open the printed localhost URL
npm run build    # production build into /dist
```
You need Node.js 18+ installed (https://nodejs.org).

## Routes
**Marketing** (`/`) — home, features, pricing, about, contact
**Auth** — `/login`, `/signup`, `/forgot-password`
**App** (`/app`)
- `/app` — Dashboard (outcome metrics + "Needs you" hot leads)
- `/app/conversations` — chat review, two-pane
- `/app/leads` + `/app/leads/:id` — pipeline + lead detail
- `/app/knowledge` — knowledge sources with sync states
- `/app/chat-agent` — chat AI config with live preview
- `/app/voice` + `/app/voice/:id` — Voice Agents list + builder (links to knowledge base)
- `/app/widget` — widget install flow (copy snippet, verify)
- `/app/settings` — workspace, billing, profile
- `/app/onboarding` — 5-step activation flow

Try the click-path: Signup -> Onboarding -> Dashboard -> a Hot lead -> Voice Agents -> build an agent -> Widget install.

## Design system
Tokens in `tailwind.config.js` and `src/index.css`. Emerald `#0B6E54` on canvas `#F5F9E6`; Schibsted Grotesk (display) + Hanken Grotesk (body). Shared components in `src/components/ui.tsx`; app shell in `src/components/AppShell.tsx`.

## Next steps to a real product
1. Backend: FastAPI + PostgreSQL + pgvector on Railway. Replace `src/data/mock.ts` with API calls.
2. AI chat: Gemini for answers + embeddings; pgvector retrieval (RAG).
3. Knowledge pipeline: upload -> S3/R2 -> parse -> chunk -> embed -> store.
4. Widget: ship the embeddable `w.js` snippet.
5. Voice agent: connect Retell AI or Vapi; point it at the same RAG endpoint.
6. Auth / billing / deploy: JWT (or Clerk) · Stripe · Vercel + Railway.

Build the backend in Cursor to keep this exact stack with full control.
