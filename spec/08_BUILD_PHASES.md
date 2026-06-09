# 08 — Build Phases (execution plan — this is the task list)

Build in order. Do not advance until a phase's **Acceptance** passes. Each phase ends demoable.

---

## Phase 0 — Secure & scaffold
**Do**
- Rotate the leaked Turso token; remove all committed secrets; add a secret scanner to CI (`07.1`).
- Create repo layout (`01.3`): `app/` (from kaligan-frontend), `widget/` (new), `server/` (new, multi-tenant).
- Stand up Postgres locally + a Docker compose (postgres with `pgvector`). Add `pgcrypto`+`vector` extensions.
- Backend skeleton: **`nest new server`** — global `/api/v1` prefix, global `ValidationPipe`, global exception filter, CORS config, structured logging, `PrismaModule` + `PrismaService`, `.env.example` (`09`). Add `common/guards` (JwtAuthGuard, WorkspaceGuard, PublicKeyGuard) and `common/decorators` (@Public, @CurrentWorkspace) as empty stubs to be filled in Phase 2.

**Acceptance:** `docker compose up` gives Postgres+pgvector; `GET /api/v1/health` returns `{status:'ok'}`; no secrets in the tree (scanner clean).

---

## Phase 1 — Data model & migrations
**Do**
- Implement all models from `02` in `schema.prisma`; run `prisma migrate`. Add the `vector(384)` column + HNSW index via a manual SQL migration step.
- Prisma seed (`prisma db seed`): demo workspace + owner user + ingest `sample_policy.txt` through the real ingestion path (chunks embedded).
- A thin repository/service pattern + the `WorkspaceGuard` wiring that forces `workspaceId` scoping.

**Acceptance:** migrations run clean; seed creates a queryable demo tenant; the two-workspace isolation test harness exists and passes against seed data.

---

## Phase 2 — Auth (JWT)
**Do**
- **AuthModule:** `signup/login/refresh/logout/forgot-password/change-password` (`03.1`). argon2 hashing, refresh rotation, `JwtStrategy` + `JwtAuthGuard` + global `WorkspaceGuard`, `@Public()`/`@CurrentWorkspace()` decorators, `PublicKeyGuard` for `/public/*`.
- Frontend `lib/api.ts` + `lib/auth.ts` + `AuthProvider` + route guard (`05.0`). Wire Login/Signup/Forgot (`05.2`).

**Acceptance:** can sign up → get tokens → reach `/app`; refresh works; logout revokes; protected routes redirect when unauthenticated. Bad creds show errors.

---

## Phase 3 — RAG pipeline + Knowledge screen
**Do**
- Integrate `fastembed-js` (bge-small, 384-dim); `EMBEDDING_DIM` constant.
- Ingestion (parse→chunk+overlap→embed→insert) async with progress events (`04.2`); KB endpoints (`03.2`).
- Retrieval with pgvector cosine + threshold + workspace filter (`04.4`).
- Wire **Knowledge** screen (`05.7`): upload/url/faq, live processing %, status pills, retry, delete, status strip.

**Acceptance:** upload a PDF → watch it go processing→ready with chunk count; `POST /kb/query "refund timeline"` returns the right chunk grounded; absent query returns `grounded=false`; isolation test passes for `/kb/query`; re-ingest replaces (no duplicate explosion).

---

## Phase 4 — Chat completion + Chat Agent + Dashboard/Conversations/Leads
**Do**
- `POST /public/chat` and `POST /chat/preview` with grounded system prompt (`03.3`,`04.5`).
- Lead scoring + capture layer (`03.5`).
- Conversations/leads/dashboard endpoints (`03.4`).
- Wire **Chat Agent** (config + real preview), **Dashboard** (real metrics), **Conversations** (two-pane real), **Leads** (list/detail/status/export) (`05.4–05.8`).

**Acceptance:** in Chat Agent preview, asking a KB question gives a grounded answer; asking something absent → declines + offers capture; providing an email creates a lead + marks the conversation captured + scores it; that lead appears in Leads and the Dashboard "Needs you"/metrics; status changes persist.

---

## Phase 5 — Voice (ephemeral tokens + orb port)
**Do**
- `POST /(public/)voice/token` minting config-locked ephemeral tokens (`06.2`); `VOICE_MODEL` config.
- Port voice engine → `lib/voice/useLiveSession.ts`; fix the transcription bug (`07.3`); remove client key + vite key defines (`07.2`,`07.7`).
- Port + re-theme the **Orb** to emerald (`06.5`).
- Wire **Voice Agents** list + **Builder** incl. the real **Test** panel (`05.9`); KB tool loop → `/(public/)kb/query`.
- Token refresh / session-resumption handling (`06.3`).

**Acceptance:** in the builder Test panel, "Talk now" starts a real low-latency voice call; transcripts render; barge-in works; the agent answers only from this workspace's KB; no Gemini key in the bundle; tampering client config has no effect; a long call resumes or ends gracefully.

---

## Phase 6 — Widget runtime (`w.js`) + install/verify
**Do**
- Build the embeddable `w.js` with Shadow DOM isolation (`05.12`): chat mode (`/public/chat`), voice mode (`/public/voice/token` → live → `/public/voice/finalize`), load-time `/public/widget/ping`.
- `GET /public/widget/config` (brand/agents); wire **Widget** install screen snippet + real verify (`05.10`).

**Acceptance:** dropping the snippet (with a real `data-key`) on a test HTML page renders the bubble; a visitor chat creates a conversation + (on intent) a lead visible in the owner dashboard; a visitor voice call works and finalizes into a conversation; owner "Verify installation" flips to Installed after the page loads.

---

## Phase 7 — Onboarding, Settings, polish, hardening
**Do**
- Wire **Onboarding** 5-step flow (`05.3`); **Settings** workspace/profile (+ `/workspace`, `/auth/change-password`) (`05.11`); **Contact** form (`05.1`).
- Loading/empty/error states across all screens (`05.0`).
- Rate limiting on `/public/*`; CORS rules; input validation everywhere; consistent error shape (`03.9`).
- Final multi-tenant isolation test across KB, conversations, leads, voice. Secret-scan the production bundles.

**Acceptance:** full happy path works end-to-end (signup → onboarding teaches a doc → publish chat+voice → install widget → visitor converts → lead in dashboard); all isolation tests green; no secrets in bundles; rate limits enforced.

---

## Phase 8 — Deploy
**Do**
- Backend on Render (Node) with managed Postgres+pgvector; frontend app on Vercel; widget `w.js` on a CDN/static path (`09`).
- Health checks, the existing keep-alive cron pattern adapted, env/secrets via dashboard (not files).

**Acceptance:** production URLs live; a real signup + document upload + chat + voice + widget round-trip works against the deployed stack.

---

### Definition of done (whole product)
A new user can sign up, teach the AI a document, configure chat + voice agents grounded in that
document, install a single snippet on a website, and have real visitors converted into scored
leads over both chat and voice — with strict per-tenant isolation and no secrets exposed.
