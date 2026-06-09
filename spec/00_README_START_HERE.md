# KaliGanAI — Build Specification (START HERE)

> **Audience:** the agentic coding tool (Antigravity) that will build this product.
> **Goal:** turn two disconnected codebases into one production-ready, multi-tenant
> AI lead-capture product with chat **and** voice, grounded in a real RAG pipeline.

---

## 0.1 What exists today (read before doing anything)

There are **two separate repos** in the working tree. They do not currently talk to each other.

| Repo | What it is | State |
|------|-----------|-------|
| `kaligan-frontend/` | The product UI: marketing site, auth, and the full app shell (Dashboard, Conversations, Leads, Knowledge, Chat Agent, Voice Agents, Widget, Settings, Onboarding). Emerald/canvas theme, React 19 + Vite + Tailwind 3. | **Pixel-complete but 100% mock.** Every screen reads from `src/data/mock.ts`. There are **no** network calls anywhere. |
| `Voice/` | A working **single-tenant** voice agent ("KaaliganAI", red/black orb). Browser ↔ Gemini Live native audio, barge-in, a `query_knowledge_base` tool, and an Express backend with a Pinecone-or-local RAG service. | **Functional demo**, but single-tenant, wrong brand/theme, key exposed client-side, and `AgentInterface.tsx` has uncompilable code (see `07_KNOWN_ISSUES_FIXES.md`). |

**The job is NOT "build a frontend."** The job is:

1. Make `kaligan-frontend` the visual source of truth (emerald theme stays).
2. Build a **real NestJS + PostgreSQL + pgvector** backend behind it (Prisma ORM).
3. Port the **voice engine** out of `Voice/` into the kaligan app, re-themed and **multi-tenant**.
4. Build the **production RAG pipeline** (ingestion → chunk → embed → store → retrieve).
5. Build the **missing runtime pieces** that the mock UI implies but that do not exist:
   the embeddable widget (`w.js`), the visitor-facing chat runtime, lead scoring, and the
   conversation/lead capture loop.

---

## 0.2 Locked architectural decisions (do not relitigate)

- **Frontend source of truth:** `kaligan-frontend` (emerald theme). Voice screen keeps an orb, re-themed to emerald.
- **Backend:** **NestJS** (on Node) + PostgreSQL + `pgvector`. The existing `Voice/server` Express code is rewritten into Nest modules (most of it changes anyway for multi-tenancy + pgvector + fastembed).
- **ORM:** **Prisma** (schema-first migrations, type-safe client). Vector similarity (`embedding <=> $vec`) is done via `$queryRaw` — same in any ORM, so Prisma's clean DX wins.
- **Multi-tenancy:** every row is scoped to a `workspace`. Hard isolation. See `02_DATA_MODEL.md`.
- **Auth:** email + password, JWT (access + refresh), built in-house. No third-party auth provider.
- **RAG embeddings:** `fastembed-js` with `BAAI/bge-small-en-v1.5` (384-dim), in-process, CPU-only. Free/OSS. Vector dimension is a single config constant (`EMBEDDING_DIM`).
- **Voice security:** **ephemeral tokens with server-locked config** (NOT a client-side API key, NOT full backend audio proxy). Backend mints a single-use Gemini Live token with model + system instruction + tools + voice baked in; browser streams directly to Gemini. See `06_VOICE_INTEGRATION.md`.
- **Knowledge base storage:** Postgres + pgvector. **Remove** the `local_knowledge_base.json` flat-file store and the Pinecone dependency.

---

## 0.3 How to use this spec set

Build in the order given by `08_BUILD_PHASES.md`. Each phase is independently verifiable.
Do not start a phase until the previous phase's acceptance checks pass.

| File | Purpose |
|------|---------|
| `01_ARCHITECTURE.md` | Target system, the merge plan, request/data flow, repo layout. |
| `02_DATA_MODEL.md` | Full Postgres schema, multi-tenant rules, pgvector, migrations. |
| `03_BACKEND_API.md` | Every endpoint: auth, KB, conversations, leads, agents, voice token, widget. |
| `04_RAG_PIPELINE.md` | Ingestion, chunking, embeddings, retrieval, grounding, anti-hallucination. |
| `05_FRONTEND_SCREENS.md` | **Pin-to-pin** spec for every screen, wired to the real API. |
| `06_VOICE_INTEGRATION.md` | Ephemeral tokens, orb port, barge-in, session resumption, multi-tenant config. |
| `07_KNOWN_ISSUES_FIXES.md` | Broken code + committed secrets that must be fixed first. |
| `08_BUILD_PHASES.md` | Ordered, checkable execution plan. **This is your task list.** |
| `09_ENV_AND_DEPLOY.md` | Env vars, secret handling, Render/Vercel config, local dev. |

---

## 0.4 Ground rules

1. **Security first.** There are live secrets committed in the existing repo. Rotate and remove them before anything else (`07`). Never put a long-lived Gemini key in client code.
2. **No mock data in production paths.** `mock.ts` may stay as a fallback for Storybook/empty states only; all screens must read from the real API.
3. **Multi-tenant by default.** Every query filters by `workspace_id`. No endpoint may return cross-tenant data. Add an automated test that proves isolation.
4. **Grounded answers only.** The AI (chat and voice) must answer only from the tenant's knowledge base. If no relevant context is retrieved, it must say so and offer to capture the lead — never invent facts. This is the core product promise.
5. **Keep the emerald design system.** Use the existing tokens in `kaligan-frontend/tailwind.config.js` and `src/index.css`. Do not introduce the red/black theme.
6. **TypeScript everywhere.** Frontend and the NestJS backend are both TS. Use Nest's module/controller/service structure and decorators idiomatically.
7. **Every phase ends with a runnable, demoable state.**
