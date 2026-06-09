# 05 — Frontend Screens (pin-to-pin)

Source of truth: `kaligan-frontend`. Keep the emerald design system, components in
`src/components/ui.tsx` and `icons.tsx`, the `AppShell`, and all visual styling. The work is
**wiring each screen to the real API**, building the **missing runtime pieces**, and adding
**loading / empty / error** states (the mock has none).

## 05.0 Shared foundation (build first)

**`src/lib/api.ts`** — typed fetch client:
- Base URL from `VITE_API_BASE_URL`.
- Attaches `Authorization: Bearer <access>` for owner calls.
- On 401 → try `/auth/refresh`; on failure → redirect to `/login`.
- Helpers: `api.get/post/patch/del`, `api.upload` (multipart), `api.sse` (EventSource).

**`src/lib/auth.ts`** — token storage (in-memory + refresh token in `localStorage`), `useAuth()` context exposing `{ user, workspace, login, signup, logout }`. Wrap `<App/>` in `<AuthProvider>`.

**Route guard:** `/app/*` requires auth; redirect to `/login` if no valid session. `/app/onboarding` is reachable right after signup.

**Global UI states (add to every data screen):**
- *Loading:* skeleton rows reusing card styling (not a spinner-only screen).
- *Empty:* reuse `StateBlock` from `ui.tsx`.
- *Error:* inline retry banner (emerald/`hot` styled).

**Keep `mock.ts`** only as the data shape reference and for Storybook/empty previews. Production screens must not import it.

---

## 05.1 Marketing (Home, Features, Pricing, About, Contact)

Status: **visually done** (`src/Public.tsx`). Minimal work:
- **Contact form** → `POST /api/v1/public/contact` (new tiny endpoint; store or email; stub email OK). Show success state.
- **Signup/Login CTAs** already route correctly. No redesign.
- Leave copy/layout as-is.

---

## 05.2 Auth — Login / Signup / Forgot (`Public.tsx` → `AuthShell`)

Currently `onClick={() => nav("/app")}` with no real auth. Wire:
- **Signup:** collect `companyName`, `websiteUrl`, `email`, `password` (fields already conditionally render). Call `auth.signup(...)` → on success store tokens, route to `/app/onboarding`.
- **Login:** `auth.login(email,password)` → `/app`.
- **Forgot:** `POST /auth/forgot-password` → show "check your email" (works even if email is stubbed/logged).
- Add: inline validation, submit loading state, error message on bad creds. Disable button while submitting.

---

## 05.3 Onboarding (`Misc.tsx` → `Onboarding`, 5 steps)

Currently a static stepper starting at step 3. Make it a real activation flow:
1. **Teach** — upload a doc or paste a URL → calls KB upload; show ingestion progress; "Next" enabled when ≥1 source is `ready`.
2. **Shape** — set chat agent name + persona → `PATCH /agents/:id` (chat).
3. **Meet** — live chat preview (reuse Chat Agent preview, calls `/chat/preview`).
4. **Go live** — show the widget snippet (from `05.9`) + "I've installed it" → verify.
5. **Live** — confetti/done → `/app`.
Persist step progress on the workspace (optional `onboarding_step` column) so refresh resumes.

---

## 05.4 Dashboard (`pages/Dashboard.tsx`)

Currently maps `leads`/`convos` from mock. Wire to **`GET /dashboard/metrics?range=7d`**.
- **4 MetricCards** (Conversations, Leads captured, Hot leads, Opportunities): values, delta chips, and `spark` polyline points all come from the metrics payload. The range pill ("Last 7 days") toggles `range=7d|30d`.
- **"Needs you"** panel: `metrics.needsYou` (hot leads). Each row links to `/app/leads/:id`. Show count badge.
- **"Recent activity"** panel: `metrics.recentActivity` (latest conversations). "Captured lead" badge from `captured`.
- Greeting uses `auth.user.name`.
- Empty state: if no conversations yet, show `StateBlock` prompting widget install.

## 05.5 Conversations (`pages/Conversations.tsx`)

Two-pane (list + thread). Currently mock.
- **List:** `GET /conversations?tab=...`. Tabs All/Captured/Hot/Unread map to the query. Each item: visitor label, snippet, score dot, captured badge, time. Selecting loads detail.
- **Thread:** `GET /conversations/:id` → render real `messages` (role visitor/ai), score badge, `messageCount · time`.
- **Right rail:** "Visitor info" from `visitor_meta` (location/pages/device); "AI insights" from conversation score + captured fields + lead intent.
- Add loading skeletons for both panes; empty state when no conversations.
- Optional: live updates via SSE `GET /conversations/events` so new visitor chats appear without refresh.

## 05.6 Leads — list + detail (`pages/Leads.tsx`)

- **`Leads`** table → `GET /leads?score=&status=`. Columns already match (`name, email, score, status, source, time`). Wire **Export CSV** → `GET /leads/export`. Add filters for score/status (chips reusing the conversations tab style).
- **`LeadDetail`** → `GET /leads/:id`. Render contact fields (copy buttons functional via `navigator.clipboard`), the linked **conversation transcript** (real messages, not the hard-coded sample), and **AI insights** (`intent`, `aiNote`/why-score, captured fields, source).
- **Status buttons** (Mark Contacted / Won / Lost) → `PATCH /leads/:id { status }`; reflect new status badge immediately (optimistic update + reconcile).

## 05.7 Knowledge Base (`pages/Knowledge.tsx`) — major wiring

The product's brain. Currently mock `sources`.
- **List:** `GET /kb/documents`. Row shows type icon, name, status pill (`● Synced` / `Processing %` / `✕ Failed`), updated time. Failed rows show "Couldn't process" + **Retry** → `POST /kb/documents/:id/retry`. Kebab menu → delete (`DELETE /kb/documents/:id`).
- **Add source** button → modal with three modes:
  - **Upload** (.pdf/.txt, ≤10MB) → `POST /kb/documents` multipart. (Reuse the upload UX already present in `Voice/AgentInterface` `handleFileUpload` as reference, but point at the new endpoint and the kaligan styling.)
  - **URL** → `POST /kb/documents {type:'url', url}`.
  - **FAQ** → repeatable Q/A fields → `POST /kb/documents {type:'faq', items}`.
- **Live processing:** after add, the new row shows `Processing X%`. Subscribe to SSE `GET /kb/events` (or poll `GET /kb/documents` every ~2s) and animate the percentage → `Synced`. This is what makes the "Processing 40%" mock real.
- **Header strip** ("Your AI knows ~8 topics from 3 sources · last trained 2m ago") → `GET /kb/status`.
- States: empty (no sources) → `StateBlock` "Add your first source"; per-row error.

## 05.8 Chat Agent (`Misc.tsx` → `ChatAgent`)

Config + live preview, currently local state only.
- **Load/save:** `GET /agents?kind=chat` (create on first save). Name, personality (4 options), and lead-qualification required fields (`capture_fields`) → `PATCH /agents/:id`. Add a Save button + saved toast.
- **Live preview (right rail):** make it a **real** mini-chat calling `POST /chat/preview` (authenticated, non-persisting). Sends the typed message, shows the grounded reply. This proves the RAG works before going live. Persona change updates the system prompt used by preview.

## 05.9 Voice Agents — list + builder (`pages/VoiceAgents.tsx`, `VoiceAgentBuilder.tsx`)

- **List:** `GET /agents?kind=voice`. Cards show status (Live/Draft), voice, source count, channel, calls handled. "New voice agent" → create draft → builder. (`kb` count = ready docs; `calls` = voice conversations count.)
- **Builder** (`VoiceAgentBuilder.tsx`) — the most feature-rich screen. Wire each section:
  - **Identity & voice:** name, voice picker (Aria/Ravi/Maya → map to Gemini prebuilt voices like `Kore`, etc.), language, speed → `PATCH /agents/:id`. Voice "Play" preview can use a short Gemini TTS sample or a canned clip (v1 may stub preview).
  - **Connected knowledge:** show the workspace's ready KB sources (`GET /kb/documents`). "Manage sources" links to `/app/knowledge`. This is read-only here.
  - **Goal & personality:** goal (qualify/book/answer), greeting text, persona → `PATCH /agents/:id`.
  - **Where it answers:** Web voice toggle (sets `channels.web`); Phone is **out of scope for v1** — show as "coming soon / Agency plan" and keep the static number as display-only.
  - **Draft/Live toggle + Publish** → `POST /agents/:id/publish`.
  - **Test panel (right rail) — the real voice call.** This is the live integration. The "Talk now" button starts a real Gemini Live session using an **ephemeral token** for this agent (see `06`). The animated orb + equalizer become the actual `Orb` component reacting to mic input. The "Live transcript" renders the real streamed transcripts. "Call me" (phone) is hidden/disabled in v1.

## 05.10 Widget install (`pages/Widget.tsx`)

- **Snippet:** the real per-workspace snippet using `workspace.public_key`:
  ```html
  <script src="https://cdn.<yourdomain>/w.js" data-key="ws_xxxx"></script>
  ```
  `data-key` = the workspace's `public_key` (from `auth.workspace`). Copy button works (already wired to clipboard).
- **Platform tabs:** keep the per-platform instructions (static copy is fine).
- **Verify installation:** `POST /widget/verify` → polls whether the widget has pinged from the live site. Show "Installed" only when a real ping is recorded (the widget calls `/public/widget/ping` on load).
- "Send steps to developer" → optional email/copy.

## 05.11 Settings (`Misc.tsx` → `Settings`)

- **Workspace:** name, website, brand color → `PATCH` a `/workspace` endpoint (add it). Brand color feeds the widget config.
- **Billing & Plan:** show `workspace.plan`; "Upgrade" can be a stub/Stripe-later (out of scope for build, but leave the button + a TODO).
- **Profile & Security:** name/email update; "Change password" → `POST /auth/change-password` (add).

---

## 05.12 The Widget runtime (`/widget` — NEW, does not exist)

This is the single biggest missing piece. Build a standalone embeddable script.
- **Entry `w.js`:** reads `data-key`, fetches `GET /public/widget/config`, injects a floating bubble. **Isolate styles with Shadow DOM** so it never collides with the host site's CSS. Match emerald branding (or `brandColor`).
- **Chat mode:** message UI → `POST /public/chat` (streams or returns reply). Creates/continues a `conversation`; lead capture happens server-side. Show captured confirmation subtly.
- **Voice mode:** a mic button → `POST /public/voice/token` → open Gemini Live directly (reuse the `useLiveSession` logic from the port, in vanilla form) → on end, `POST /public/voice/finalize` with the transcript. Re-themed orb optional in the widget; a simple animated mic indicator is acceptable for v1.
- **Ping:** on load, `POST /public/widget/ping` so the owner's "Verify installation" succeeds.
- Build output: a single minified `w.js` (+ optional `w.css` inlined) served from a CDN/static path. Keep payload small.

---

## 05.13 Visual/UX consistency checklist

- Use existing tokens (`emerald`, `mint`, `teal`, `canvas`, `surface`, `ink`, `hot/warm/cold/success`) and components (`MetricCard`, `ScoreBadge`, `Card`, `PageHead`, `StateBlock`, `StatusChip`, `Sparkline`).
- All async actions: disabled+spinner while pending, success/error feedback.
- No layout shift between mock and real (response shapes mirror `mock.ts`).
- Mobile: app shell is desktop-first; ensure the **widget** is fully responsive (it runs on phones).
