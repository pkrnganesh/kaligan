# KaliGanAI\ — Launch Spec for Antigravity
### Landing Page · Widget Commerce · Bring-Your-Own-Number Voice

**Who this is for:** Antigravity, executing against the existing KaliGanAI repo.
**Goal of this document:** get to a state where we can (1) put the best possible landing page in front of buyers, (2) let a customer create, deploy, and pay for an AI employee widget that does **chat + in-browser voice**, and (3) let a customer connect **their own phone number** so the same AI employee answers real calls.
**Design system (locked, do not invent new tokens):** primary emerald `#0B6E54`, canvas `#F5F9E6`, Schibsted Grotesk (display), Hanken Grotesk (body), pill buttons, rounded-2xl cards.
**Stack (locked):** Vite + React 19 + TS + Tailwind v3 + React Router (frontend), NestJS + Prisma (backend), Supabase Postgres + pgvector (prod DB), Render (hosting), Gemini (text + Live audio), fastembed BAAI/bge-small-en-v1.5.

---

## 0. Kickoff protocol — READ BEFORE WRITING ANY CODE

1. **Read the repo and plan back first.** Before building, produce a short written plan per phase mapping each requirement below to the files you will touch. Do not start coding until the plan is acknowledged.
2. **Build phase by phase, gated.** A phase is *done* only when its Acceptance Criteria are demonstrable by a test or command output — not asserted. Stop at each phase boundary for review.
3. **Do not rebuild working subsystems.** The chat widget, RAG pipeline, web-voice path, auth, and dashboard already exist. Extend them. If you believe a rewrite is needed, raise it as a flag with reasoning — do not silently rewrite.
4. **Non-negotiable gates (run these first; carry forward from the audit):**
   - **G-1 Secrets:** `grep -rE "VITE_(GEMINI|GOOGLE|API_KEY)" app/ widget/` returns nothing; the compiled `w.js` contains no key-shaped string. The Gemini credential lives server-side only.
   - **G-2 RAG is semantic:** breaking the embedding model makes retrieval fail *loudly*, never silently fall back to keyword/empty. A known KB question returns the right chunk (score > 0.35); an out-of-KB question returns `grounded=false`.
   - **G-3 Tenant isolation:** every raw-SQL path (pgvector insert/query) is `workspace_id`-scoped; a Workspace-A request can never read Workspace-B rows.
   - **G-4 Public endpoints metered:** every `/public/*` and `/kb/public/*` route is behind a working per-key + per-IP rate limiter (not scaffolded — enforced).

If any gate fails, fix it before building new surface on top.

---

## 1. What we are projecting (positioning + the two references, distilled)

**One-line positioning:** *"An AI employee that turns your website visitors and callers into qualified leads — over chat and voice."* Target: agencies, consultants, SaaS, real estate, and service businesses. The value metric is **qualified leads**, never "messages."

**Differentiator to hammer everywhere:** one employee, **both chat and voice**, **grounded in the customer's own business** (answers only from their knowledge base), that **captures + qualifies leads** — and now **answers their phone number too**. Few chat tools do voice; few voice tools do chat; almost none package both grounded on one object for this buyer.

**What to take from Rhythmiq (the closer model):**
- Outcome-first, concrete hero copy (their "never lose a cover" → our "never lose a lead").
- **Interactive demo as the hero**, not a marketing video. Visitor does a tiny bit of input and *watches the product work* before signing up.
- A "**try it live on your own number**" path — the BYON model.
- Scenario framing that sells the *pain* (the call/visitor that slips through) and then the resolution.
- "Compare vs [competitor]" pages for SEO and positioning.

**What to take from ElevenLabs (the polish layer):**
- "Agents that **talk, type, and take action**" — omnichannel framing (our analog: chat + voice + lead-routing/booking).
- A **social-proof logo wall** (start with pilot logos / "trusted by early teams" — never fake logos).
- **Embedded live mini-demos** inside feature sections, not static screenshots.
- A **"Safety / grounding, built in"** section — for us this is "answers only from your data, never makes things up."

**What is OURS, not theirs:** we are not an enterprise voice-research lab (ElevenLabs) and not restaurant-only (Rhythmiq). We are the **lead-capture AI employee for SMB/agency**, chat-first with voice attached, BYON telephony. Keep the site lean and conversion-focused, not a sprawling product catalog.

---

## Phase L — Marketing Landing Page & Public Site

> Can be built in parallel with everything else; it has no backend dependency except the live demo (which reuses the existing KB scraper + chat endpoint). Ship this early — it is what buyers see.

**Why it exists.** Today there is a dashboard but no public storefront. Buyers need a page that explains the product in 5 seconds, lets them experience it, and pushes them to sign up.

**User stories.**
- As a visitor I land, understand in one sentence what this does for me, and within 30 seconds *watch an AI employee answer a question about a business like mine*.
- As an interested visitor I can paste my own website URL and see the AI answer questions about *my* business, then sign up to deploy it.
- As an evaluator I can see pricing, how it works, and how it compares — without talking to sales.

**Screens / sections (in order).**
1. **Top nav** — logo, Product, Pricing, Compare, Blog (stub), `Log in`, `Start free` (emerald pill). Sticky, minimal.
2. **Hero** — headline + subhead + primary CTA + the **interactive live demo** (below). Headline direction: *"Your website's hardest-working employee."* Subhead: *"An AI that chats, talks, and turns visitors into qualified leads — grounded in your business, live in minutes."*
3. **Interactive hero demo (the centerpiece).** Two modes in one widget:
   - **Mode A — "Try it on a sample business":** pick a vertical (Agency / Real estate / SaaS / Services). Loads a pre-seeded KB and runs a real chat (and an optional "play a voice sample" button using the existing web-voice path) showing the AI answering + capturing a lead.
   - **Mode B — "Try it on *your* site":** visitor pastes their URL → backend runs the **existing KB scrape + ingest** into a short-lived demo workspace → visitor chats with an AI grounded in their own site. End the demo with: *"Like what you see? Deploy this on your site →"* (signup). This reuses code you already have and is the single highest-converting element on the page.
4. **"How it works"** — 3 steps: Connect your knowledge (paste URL / upload docs) → Configure your employee (persona, goal, voice) → Deploy (embed widget + connect your number). One emerald-accented card each.
5. **Capabilities** — three feature blocks with embedded mini-demos: **Grounded chat** ("answers only from your data, never invents"), **Web + phone voice** ("talks on your site and answers your number"), **Lead capture & qualification** ("every conversation scored Hot/Warm/Cold and routed to you").
6. **Social proof** — pilot/early-customer logos or testimonials. Real only. If none yet, use a metric/outcome strip instead (never fabricate logos).
7. **Pricing** — Starter $39 / Growth $129 / Agency (contact). Show what each includes (message caps, voice minutes, # employees, BYON voice on Growth+). Annual toggle.
8. **Compare** (separate routes `/compare/[competitor]`) — honest, factual comparison pages; stubs are fine at launch.
9. **Final CTA band** + footer (Product / Pricing / Compare / Blog / Privacy / Terms / Contact).

**Backend.**
- Demo endpoints: `POST /public/demo/ingest { url }` (rate-limited, reuses KB scrape into an ephemeral, auto-expiring demo workspace) and `POST /public/demo/chat { demoId, message }` (reuses grounded chat). Aggressively rate-limit and TTL-expire demo workspaces (e.g. 1 hour) to control cost and abuse — this is a public, unauthenticated surface, so G-4 applies hard.
- SEO: SSR or static pre-render for marketing routes, meta/OG tags per page, sitemap, robots.

**DB delta.** `DemoWorkspace` (or reuse `Workspace` with `isDemo:true, expiresAt`) + a cron/worker to purge expired demos and their chunks.

**Edge cases.** URL that won't scrape (JS-only site, 403, paywall) → graceful "we couldn't read that site, try the sample mode"; huge site → cap pages/chunks for the demo; abusive paste of many URLs → rate-limit per IP; demo must never write a real `Lead` or count against a real workspace.

**Acceptance criteria.**
- Lighthouse: performance ≥ 90, accessibility ≥ 95 on the landing route; passes mobile.
- A visitor can paste a real URL and get a grounded answer about that site in the demo within ~15s, with no auth.
- Demo workspaces auto-expire and are purged; no demo data leaks into real workspaces (extends G-3).
- All CTAs route to signup; pricing matches the billing config in Phase S.
- On-brand: emerald tokens, Schibsted/Hanken fonts, pill buttons, rounded-2xl cards throughout.

---

## Phase W — Create & Deploy the AI Employee Widget (chat + web voice)

> Depends on the gates (§0). This makes the *create → configure → embed* flow clean and trustworthy so a customer can stand up an employee and put it on their site.

**Why it exists.** The pieces exist (agent builder, widget, web-voice) but the end-to-end "create an employee and deploy it" flow needs to be polished, validated, and obviously sellable.

**User stories.**
- As an owner I create an AI employee in a guided wizard: name, role/persona, goal, greeting, capture fields, voice on/off, and the knowledge it uses.
- As an owner I preview the employee (chat + voice) before publishing.
- As an owner I copy a one-line embed snippet and verify it's live on my site.
- As a visitor on the customer's site, I chat *and* can click "talk" to speak with the same employee in-browser.

**UX / screens.**
- **Employee creation wizard** (multi-step, on-brand): Identity (name/avatar/role) → Personality (persona/tone/goal) → Knowledge (connect KB docs/URLs — reuse ingestion with live progress via the existing SSE) → Channels (chat on; web-voice toggle; pick voice/language/speed) → Capture (fields: name/email/phone/custom) → Review & Publish.
- **Preview pane** runs the real grounded chat and real web-voice against the configured agent before publish.
- **Deploy screen** — copy embed snippet `<script src="https://cdn.kaligan.ai/w.js" data-key="...">`, plus the existing **installation ping** flipping status to "Installed ✓".
- **Empty/loading/error states** for every step (no KB yet, ingestion failing, voice not configured).
- **Versioning:** publishing snapshots the agent config; show version history + one-click rollback so a live employee's behavior never changes without a record.

**Backend.**
- Harden the agent CRUD + publish flow; validate all DTOs; ensure web-voice ephemeral-token minting keeps the key server-side (G-1).
- Snapshot agent config on publish (`AgentVersion`).
- Ensure the widget loads chat + voice from one config endpoint.

**DB delta.** `AgentVersion(agentId, workspaceId, configSnapshot JSON, publishedAt, publishedBy)`.

**API contract.**
```
POST /agents                      -> create
PATCH /agents/{id}                -> update (draft)
POST /agents/{id}/publish         -> snapshots version, marks live
GET  /agents/{id}/versions        -> history
POST /agents/{id}/rollback {ver}  -> restore snapshot
GET  /public/agent/config?key=... -> widget bootstrap (chat + voice config)
POST /public/voice/token          -> ephemeral token (key server-side)  [existing, verify G-1]
```

**Edge cases.** Publish with empty KB → warn, allow but flag "ungrounded"; voice enabled but no KB → still works conversationally; widget on http host → enforce https; concurrent edits → last-write-wins with a version trail; rollback must restore exact prior behavior.

**Acceptance criteria.**
- A new user can go signup → wizard → publish → paste snippet → see "Installed ✓" → chat *and* talk to the employee on a test page, end-to-end.
- Publishing creates a version row; rollback restores identical behavior.
- No client-exposed credentials anywhere in the shipped widget (G-1 re-verified).
- Every wizard step has validated inputs and designed empty/loading/error states.

---

## Phase S — Billing & Plan Gating (make it sellable)

> Depends on Phase W. This is the line between "demo" and "business." Without it, nothing can be charged for.

**Why it exists.** No path to take money or enforce limits exists today.

**User stories.**
- As an owner I subscribe to Starter/Growth via Stripe Checkout and manage billing in a portal.
- As the system I enforce plan limits (message caps, voice minutes, # employees, BYON voice availability by tier) and meter usage.
- As the founder I can read MRR and per-workspace usage.

**Backend.**
- Stripe Checkout + Customer Portal + signature-verified webhooks (`checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed`), idempotent handlers.
- **Usage as events:** every chat message, **voice minute** (web *and* phone), and lead writes a `UsageEvent`; monthly counters and analytics derive from events (one source of truth).
- Plan-gate guard: over-cap actions return `402 {code:'PLAN_LIMIT', upgrade:{...}}`; the widget shows a graceful "assistant paused" message, never an error.
- Dunning: payment_failed → grace → soft-lock (read-only) → hard-lock. Never delete customer data on downgrade.
- **Gate BYON voice (Phase V) to Growth+** in plan config.

**DB delta.**
```
Subscription(workspaceId, stripeCustomerId, stripeSubId, plan, status, currentPeriodEnd, cancelAtPeriodEnd)
UsageEvent(workspaceId, type[chat_message|voice_minute_web|voice_minute_phone|lead|kb_doc], quantity, agentId?, createdAt)
PlanLimit (config/seed)
```

**API contract.**
```
POST /billing/checkout { plan } -> { checkoutUrl }
POST /billing/portal            -> { portalUrl }
POST /webhooks/stripe           -> 200 (idempotent, signature-verified)
GET  /billing/usage             -> { plan, period, usage, limits }
```

**Edge cases.** Webhook replay/out-of-order (idempotency keys); downgrade exceeding new caps (grace, keep data); failed payment mid-conversation (don't drop the live session; soft-lock at session end); tax (Stripe Tax).

**Acceptance criteria.**
- Test card → active `Subscription` → caps enforced within one request cycle.
- Over-cap chat returns 402; widget shows graceful paused state.
- Webhook handler is idempotent (replaying an event changes nothing).
- `GET /billing/usage` equals summed `UsageEvent`s exactly, including voice minutes.

---

## Phase V — BYON Voice: Connect-Your-Number + Media Bridge + Call Logs

> The heaviest phase. Depends on Phases W + S. This is **new architecture** — it is NOT an extension of the in-browser voice path. Build it as a separate service.

**Model decision (locked for V1): Bring Your Own Number (BYON), inbound only.** The customer brings their own Twilio number; we provide the facility to connect it. This is the right V1 because it offloads number provisioning, telephony billing, and A2P 10DLC / STIR-SHAKEN registration onto the customer's own Twilio account. KaliGanAI-provisioned ("managed") numbers and outbound calling are explicitly **out of scope for V1** (outbound triggers TCPA/FCC AI-disclosure obligations and is a separate project).

**Why a new architecture (state this to yourself before coding).** The browser voice path works because a *browser* holds an ephemeral token and streams directly to Gemini. A phone call has no browser and cannot hold a token. Therefore the **server** must hold the Gemini Live session per call and bridge the audio.

**Architecture.**
```
Caller ──PSTN──► Customer's Twilio number ──Media Streams WS (G.711 μ-law 8kHz)──►
   KaliGanAI Media Bridge (separate Render service) ──WS (PCM 16kHz in / 24kHz out)──► Gemini Live
```
- The **media bridge is a separate deployable service** (its own Render service, own crash domain, own scaling — long-lived stateful connections, CPU for resampling).
- **Audio transcoding is the hard part.** Twilio = G.711 μ-law @ 8kHz in 20ms frames; Gemini = 16-bit PCM @ 16kHz in / 24kHz out. Use **stateful** resampling (libsoxr / `samplerate`-class), never naive chunk-by-chunk — that is the documented #1 cause of audible artifacts. Prefer keeping the bridge in Node to stay single-language; **only** move it to a Python sidecar if a resampling-quality spike proves Node lossy. Evaluate LiveKit/Pipecat as a managed shortcut if hand-rolling stalls.
- **RAG tool moves server-side.** On the web path the *widget* intercepts Gemini's `query_knowledge_base` call. On the phone there is no widget — the **bridge** intercepts the `FunctionCall`, runs the existing `/kb` vector retrieval, and returns the `FunctionResponse`. Reuse the retrieval service; relocate only the interception glue.

**Connect-your-number flow (the facility we provide).**
1. Owner creates/picks a Voice Agent (Phase W) and opens **"Connect a phone number."**
2. KaliGanAI shows a unique, unguessable webhook URL:
   `https://api.kaligan.ai/telephony/twilio/incoming/{agentToken}`
3. Owner logs into **their own Twilio console**, and on their number's Voice config sets **"A call comes in" → Webhook (HTTP POST)** to that URL. (Provide step-by-step screenshots in-app.)
4. Owner clicks **"Verify"** and places a test call; we detect the incoming webhook and flip status to **"Connected ✓"** (same pattern as the widget install ping).
5. (Optional) Owner pastes their Twilio Auth Token to enable `X-Twilio-Signature` validation. If not provided, the unguessable `agentToken` in the URL is the auth — note this tradeoff in-app.

**Call lifecycle (bridge).**
- Twilio POSTs the incoming-call webhook → we respond with TwiML `<Connect><Stream url="wss://bridge.kaligan.ai/twilio/{callId}"/></Connect>`.
- Bridge opens Gemini Live session configured from the agent (persona/voice/language/system instruction).
- **Play AI disclosure** at call start (e.g. "Hi, you're speaking with an AI assistant for {business}…") and store consent — required even inbound.
- Converse with barge-in/interruption preserved; intercept `query_knowledge_base` server-side for grounded answers; optionally book/handoff.
- On hangup → **finalize**: transcript → existing lead scoring → write `Conversation` + `Lead` (identical schema to web-voice) + `UsageEvent(voice_minute_phone)` for billing.
- **Call recording** is an opt-in toggle with a retention policy; off by default.

**DB delta.**
```
PhoneNumber(workspaceId, agentId, provider['twilio'], e164, agentToken, status[pending|connected], authTokenEnc?, recordingEnabled, connectedAt)
Conversation += channel:'phone', callSid, durationSec
Call(workspaceId, agentId, callSid, fromNumber, durationSec, recordingUrl?, latencyMs, interruptions, outcome, createdAt)
```

**API contract.**
```
POST /telephony/numbers/connect { agentId }        -> { webhookUrl, agentToken, instructions }
POST /telephony/numbers/verify  { agentId }         -> { status }
POST /telephony/twilio/incoming/{agentToken}        -> TwiML <Connect><Stream/>   (Twilio → us)
WS   wss://bridge.kaligan.ai/twilio/{callId}        -> media stream (Twilio ⟷ bridge ⟷ Gemini)
GET  /telephony/calls?agentId=...                   -> call logs + analytics
```

**Dashboard.** A **Calls** view: call log (time, from, duration, outcome, lead created, recording if enabled, transcript), plus voice analytics (avg latency, duration, interruption count, completion rate, lead conversion). Same look as the existing conversations reader.

**Edge cases (the ones that bite).**
- Resampling artifacts → stateful DSP, verify by ear on a real call.
- Concurrent-call limits / Gemini Live session caps → queue or scale the bridge; surface "all agents busy" gracefully.
- Mid-call Gemini disconnect → reconnect via resumption handle; never drop the caller silently.
- Silence/no-input timeout; DTMF handling; caller hangs up mid-sentence.
- Cross-account webhook auth → unguessable `agentToken` primary; optional Twilio signature if auth token provided.
- Cost: customer's Twilio bill covers telephony minutes; **our** Gemini cost is metered as `voice_minute_phone` and billed via plan minutes (Phase S). Make this split explicit in-app so customers aren't surprised by their Twilio bill.

**Acceptance criteria.**
- A real inbound PSTN call to a customer's connected Twilio number reaches the workspace's AI employee, plays the AI disclosure, answers a **KB-grounded** question via the server-side tool, captures/qualifies a lead, and on hangup writes a `Call` + `Conversation` + `Lead` + `UsageEvent(voice_minute_phone)` — identical lead pipeline to web-voice.
- No audible resampling artifacts on a real call.
- Connect → Verify flow flips to "Connected ✓" after a test call.
- BYON voice is unavailable on Starter and available on Growth+ (Phase S gating enforced).
- Outbound calling is confirmed *not* present (out of scope V1).

---

## Sequencing & dependencies

```
Phase L (landing) ──── parallel, ship early (only depends on existing scraper+chat for the demo)
        gates G-1..G-4 ──► Phase W (create+deploy widget) ──► Phase S (billing) ──► Phase V (BYON voice)
```

- **Run the gates first.** Then Phase W, then Phase S. Phase L can run alongside from day one.
- **Sellable milestone = L + W + S.** At that point you can charge for the chat + web-voice AI employee widget. That is the moment to start selling.
- **Phase V (BYON voice) comes after the widget is sellable.** It is the heaviest build and depends on billing (to meter phone minutes) and the agent/version model (Phase W). Don't start it before L+W+S are done unless a near-closing customer specifically requires phone answering — in which case it's de-risked by real demand.

## Cross-cutting standards (every phase inherits)

- **Security:** secrets only in env/secret manager; CI secret-scan (gitleaks) blocks merges; no `VITE_` credentials ever; all raw SQL `workspace_id`-scoped; signed + idempotent webhooks (Stripe, Twilio, outbound).
- **Observability:** structured logs with `requestId`/`workspaceId`; Sentry on API, dashboard, widget, **and the media bridge**; deep `/health`; usage-as-events is the single source for billing + analytics.
- **Testing:** the isolation (G-3) and RAG-grounding (G-2) checks are required CI gates that block deploy; one end-to-end happy-path test per surface (demo chat, widget chat+voice, billing checkout, inbound call).
- **AI hygiene:** centralize Gemini model IDs and system-prompt templates in one versioned config module; log `grounded` + retrieved chunk IDs/scores in dev so silent RAG degradation can never recur.
- **Done means demonstrable.** Each phase ends with command/test output proving its Acceptance Criteria, gated by the founder's reviewer checklist. "It should work" is not done.

## Appendix — confirm before building
1. Run gates G-1..G-4 against the real repo and paste results.
2. Confirm Gemini model strings are current (text + audio preview are versioned and move monthly); centralize them.
3. Confirm Stripe account + price IDs for Starter/Growth and the voice-minute meter.
4. Confirm the media-bridge language decision (Node default; Python only if a resampling spike proves necessary) — decide *after* the spike, not before.
5. Confirm the cost-split messaging for BYON (customer pays Twilio; we meter Gemini minutes) is acceptable for the target price points.
