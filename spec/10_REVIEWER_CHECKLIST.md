# 10 — Reviewer's Checklist (your phase-gate cheat sheet)

Use this to supervise Antigravity. **Never accept "I built Phase X" — make it *demonstrate* the
check.** For each phase: paste the "Make it show you" line, confirm the "Pass bar," and watch for
the "Red flags." If a red flag appears, stop and correct before approving the next phase.

> Approve a phase only when every Pass-bar item is demonstrated live (screen share, a real request,
> a passing test) — not described.

---

## Phase 0 — Secure & scaffold
**Make it show you:** the repo tree (`app/ widget/ server/ spec/`); `GET /api/v1/health` returning ok; the secret-scanner CI step running clean; `docker compose up` bringing up Postgres with the `vector` extension enabled.
**Pass bar:** health endpoint responds; pgvector extension exists (`SELECT * FROM pg_extension WHERE extname='vector'` returns a row); **no secrets anywhere in the tree**; NestJS skeleton boots.
**Red flags:** the old Turso token still present anywhere; scaffolding in plain Express instead of NestJS; pgvector not actually installed (just "will add later").

---

## Phase 1 — Data model & migrations (Prisma)
**Make it show you:** `schema.prisma`; `npx prisma migrate dev` running clean; the seed creating a demo workspace + user; `SELECT count(*) FROM kb_chunks` after seed > 0 (sample doc embedded).
**Pass bar:** every table from `02` exists; the `embedding` column is `vector(384)` with an HNSW index; seed produces real embedded chunks; the isolation test harness exists.
**Red flags:** it tried to make Prisma's typed client express `<=>` instead of using `$queryRaw`; the embedding column is a plain array/json instead of `vector`; no HNSW index; seed inserts chunks with empty/zero embeddings.

---

## Phase 2 — Auth (NestJS Guards)
**Make it show you:** a live signup → returns tokens; hitting a protected route with the token (works) and without it (401); refresh rotating the token; the global `WorkspaceGuard` and `PublicKeyGuard` in `common/guards`.
**Pass bar:** signup creates workspace + owner + public_key; passwords hashed with argon2/bcrypt (NOT plaintext — check the DB); protected routes reject missing/invalid tokens; refresh works and rotates; app Login/Signup screens reach `/app`.
**Red flags:** any hand-rolled token signing or password hashing instead of `@nestjs/jwt` + argon2/bcrypt; `workspaceId` read from the request body anywhere; passwords visible in the DB; no `WorkspaceGuard` (scoping done ad-hoc per handler).

---

## Phase 3 — RAG pipeline + Knowledge screen
**Make it show you:** upload a PDF in the Knowledge screen → watch status go **processing → ready** with a chunk count; query **"refund timeline"** → returns the refund chunk, `grounded:true`; query **"do you sell cars?"** → `grounded:false`; the two-workspace isolation test passing for `/kb/query`.
**Pass bar:** embeddings come from fastembed (bge-small, 384-dim), generated at ingest; retrieval is pgvector cosine with the threshold + workspace filter; failed docs show `failed`, not silent success; re-ingesting a doc replaces its chunks (no duplicate explosion).
**Red flags:** retrieval falling back to substring/keyword matching (the old bug); embeddings generated at query time with a different model than ingest; any query returning another workspace's chunk; "processing" that never resolves.

---

## Phase 4 — Chat + Chat Agent + Dashboard/Conversations/Leads
**Make it show you:** in Chat Agent preview, ask a KB question → grounded answer; ask something absent → it declines + offers to take your details; type an email → a lead is created, the conversation is marked captured + scored; that lead appears in **Leads** and in the Dashboard **"Needs you"**; change its status → persists.
**Pass bar:** answers are grounded (no invented facts); lead capture + scoring works end-to-end; dashboard metrics are real (not mock); status changes persist; screens read from the API, not `mock.ts`.
**Red flags:** the AI answering from general knowledge when `grounded:false`; any screen still importing `mock.ts`; scoring that's random/unexplained; captured lead not linked to its conversation.

---

## Phase 5 — Voice (ephemeral tokens + orb)
**Make it show you:** in the Voice Builder **Test** panel, "Talk now" → a real low-latency call; the transcript appearing; interrupting the bot mid-sentence (barge-in) stops it; the **Network tab** showing the browser connecting to Google with a *token*, not your API key; `grep` of the built JS for the Gemini key → nothing.
**Pass bar:** real voice call works; barge-in works; **no Gemini key in any client/widget bundle**; the agent answers only from this workspace's KB; the orb is emerald (not red); a long call resumes or ends gracefully.
**Red flags:** `VITE_GEMINI_API_KEY` (or any long-lived key) anywhere in client code or the bundle; system prompt sent from the client instead of locked server-side; the orb still red/copper; tampering the client changes the agent's behavior (config not locked).

---

## Phase 6 — Widget runtime (`w.js`) + install/verify
**Make it show you:** drop the real snippet (with a real `data-key`) onto a plain test HTML page → the bubble appears; a visitor **chat** creates a conversation + (on intent) a lead visible in the owner dashboard; a visitor **voice** call works and finalizes into a conversation; the owner's **"Verify installation"** flips to *Installed* after the test page loads.
**Pass bar:** widget loads via one script tag; styles isolated (Shadow DOM — doesn't break the host page's CSS); chat + voice both produce real conversations/leads for the correct workspace; verify works off a real ping.
**Red flags:** widget CSS leaking into / clashing with the host page; conversations landing in the wrong workspace; voice in the widget using a key instead of `/public/voice/token`; verify that's faked (passes without a real ping).

---

## Phase 7 — Onboarding, Settings, polish, hardening
**Make it show you:** the full happy path in one sitting — signup → onboarding teaches a doc → publish chat + voice → install widget on a test page → act as a visitor and convert → see the lead in the dashboard; loading/empty/error states on each screen; rate limiting rejecting a flood on `/public/*`; the full isolation test suite green; secret-scan of production bundles clean.
**Pass bar:** end-to-end path works without manual DB pokes; every data screen has loading/empty/error states; rate limits enforced; all isolation tests pass; no secrets in bundles.
**Red flags:** any step of the happy path needing a manual workaround; screens that white-screen on empty data or error; `/public/*` with no rate limit; isolation test skipped or failing.

---

## Phase 8 — Deploy
**Make it show you:** the live production URLs; a real signup + doc upload + chat + voice + widget round-trip against the **deployed** stack (not localhost); env/secrets set in the platform dashboards (not in files); the keep-alive cron pointed at the new health endpoint.
**Pass bar:** production works end-to-end; migrations ran on deploy; no secrets in committed files; health + keep-alive live.
**Red flags:** secrets in `render.yaml`/`.env` committed; migrations not run (empty prod DB); CORS misconfigured so the widget can't reach `/public/*`; "works on localhost" presented as "deployed."

---

## Cross-phase rules to enforce every time
- **Demonstrate, don't describe.** A claim isn't a checkpoint.
- **No `mock.ts` in production paths.** Allowed only for empty-state fallbacks.
- **Every tenant query scoped by `workspaceId`** via the guard — never from a request body.
- **No secrets client-side, ever.** Re-grep the bundle whenever client code changes.
- **Grounded or it declines.** The AI must never invent facts/prices/policies.
- **One phase at a time.** If it jumps ahead, pull it back; partial half-built phases are how this kind of build rots.
