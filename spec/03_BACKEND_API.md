# 03 — Backend API (NestJS)

Base path: `/api/v1` (set a global prefix in `main.ts`). JSON in/out. NestJS + Prisma.

## 3.1 Auth model & request scoping (NestJS Guards)

This is where multi-tenancy is enforced structurally — do not rely on per-handler discipline.

- **JWT auth (owner endpoints):** use `@nestjs/passport` + `@nestjs/jwt` with a `JwtStrategy`. A `JwtAuthGuard` validates the access token and populates `req.user = { userId, workspaceId, role }` from the token payload. **Tenant queries always use `req.user.workspaceId`** — never a workspace id from the request body.
- **`WorkspaceGuard` (global):** applied app-wide. For JWT routes it confirms `workspaceId` is present; expose it to services via a `@CurrentWorkspace()` param decorator. This guarantees every owner query is scoped.
- **`PublicKeyGuard` (for `/public/*`):** resolves the `workspaces.public_key` (from body or query) to a workspace and attaches it. Public routes are marked with a `@Public()` decorator so `JwtAuthGuard` skips them, and `PublicKeyGuard` runs instead. Public routes may ONLY create conversations/leads and query KB for that workspace — never read owner data.
- **Tokens:** access JWT ~15 min (signed with `JWT_ACCESS_SECRET`); refresh ~30 days, stored hashed in `refresh_tokens`, rotated on use.
- **Validation:** global `ValidationPipe` (`whitelist:true, forbidNonWhitelisted:true`) + DTOs (class-validator) or zod via a pipe. Reject unknown fields.

### AuthModule endpoints (controller routes)
```
POST /api/v1/auth/signup
  body: { companyName, websiteUrl?, email, password }
  → creates workspace (+ public_key) and owner user; returns { accessToken, refreshToken, user, workspace }

POST /api/v1/auth/login
  body: { email, password } → { accessToken, refreshToken, user, workspace }

POST /api/v1/auth/refresh
  body: { refreshToken } → { accessToken, refreshToken }   (rotates refresh)

POST /api/v1/auth/logout
  body: { refreshToken } → revokes it. 204.

POST /api/v1/auth/forgot-password
  body: { email } → 202 always (don't leak existence). (Email sending may be stubbed in v1; log the link.)

POST /api/v1/auth/change-password   (JwtAuthGuard)
  body: { currentPassword, newPassword } → 204
```
Hash passwords with **argon2** (Nest-friendly; or bcrypt). Validate email; min password length 8. Put auth logic in `AuthService`; keep the controller thin.

## 3.2 Knowledge base (owner)

```
GET    /api/v1/kb/documents
  → [{ id, type, name, status, chunkCount, updatedAt, error? }]   (workspace-scoped)

POST   /api/v1/kb/documents            (multipart/form-data)
  field: file (.pdf|.txt, ≤10MB)  OR  body { type:'url', url } / { type:'faq', items:[{q,a}] }
  → creates kb_documents row (status=processing), kicks off async ingest (04), returns the row.

GET    /api/v1/kb/documents/:id        → single doc with live status/progress
DELETE /api/v1/kb/documents/:id        → deletes doc + its chunks (cascade)
POST   /api/v1/kb/documents/:id/retry  → re-ingest a failed doc

GET    /api/v1/kb/status               → { sources: n, ready: n, topicsApprox: n, lastTrainedAt }
```
Ingestion is async; the Knowledge screen polls `GET /kb/documents` (or subscribe via SSE `GET /kb/events`) to animate `processing → ready/failed`.

### Internal RAG query (used by chat + voice tool)
```
POST /api/v1/kb/query           (JwtAuthGuard — used by Chat Agent live preview / Test)
POST /api/v1/public/kb/query    (public key — used by widget voice tool + widget chat)
  body: { q, topK?=5 }
  → { context: string, chunks: [{ content, documentName, score }], grounded: boolean }
```
`grounded=false` when no chunk passes the similarity threshold (see `04`). Callers must honor it.

## 3.3 Chat completion

```
POST /api/v1/public/chat
  body: { workspacePublicKey, agentId?, conversationId?, message, visitorMeta? }
  → {
      conversationId,
      reply: string,
      captured?: { fields: [...] },     // if a lead was captured/updated this turn
      score?: 'Hot'|'Warm'|'Cold'
    }
```
Server logic per turn:
1. Resolve workspace from public key; load chat agent (or default).
2. RAG retrieve context for `message`.
3. Compose system prompt (grounding preamble + persona + goal + capture rules) and call Gemini text model with context + recent history.
4. Run lead-intent + capture logic (3.5); update/create lead + conversation score.
5. Persist visitor + ai messages; increment `message_count`; return reply.

> Owner-side **Chat Agent live preview** can call the same logic via an authenticated `POST /api/v1/chat/preview` that does NOT persist a conversation (ephemeral), so the owner can test safely.

## 3.4 Conversations & leads (owner)

```
GET  /api/v1/conversations?tab=all|captured|hot|unread
  → [{ id, visitorLabel, snippet, score?, captured, messageCount, startedAt }]
GET  /api/v1/conversations/:id
  → { ...conversation, visitorMeta, messages:[{role,content,createdAt}], lead? }

GET  /api/v1/leads?score=&status=
  → [{ id, name, email, phone, score, status, source, aiNote, createdAt }]
GET  /api/v1/leads/:id   → full lead + linked conversation summary + ai insights
PATCH /api/v1/leads/:id  body: { status }   → update status (New→Contacted→Won/Lost)
GET  /api/v1/leads/export → CSV stream

GET  /api/v1/dashboard/metrics?range=7d|30d
  → { conversations:{value,deltaPct,spark:[...]},
      leadsCaptured:{...}, hotLeads:{...}, opportunities:{...},
      needsYou:[lead...], recentActivity:[convo...] }
```
`spark` arrays feed the existing `Sparkline` component (polyline points). Compute deltas vs previous period.

## 3.5 Lead scoring & capture

A small deterministic layer + an LLM assist, run server-side each chat/voice turn:

- **Intent signals** (rule-based, fast): mentions of pricing, demo, "buy", "sign up", timeline words, providing contact info → raise intent. "just browsing", "thanks" → lower.
- **LLM scoring** (cheap call or reuse the completion): classify the conversation so far into `Hot|Warm|Cold` with a one-line `ai_note` ("ready to buy, asked pricing"). Cache per conversation; only re-score on meaningful new info.
- **Capture**: when intent is Medium+ and required `capture_fields` are missing, the agent asks for them (driven by the system prompt). When the visitor provides an email/phone/name (extract with a strict regex + LLM confirmation), create/update the `leads` row, set `conversations.captured=true`, set `score`.

Scoring thresholds and the scoring prompt live in `server/src/lib/scoring.js`. Keep it explainable.

## 3.6 Agents (owner)

```
GET   /api/v1/agents?kind=chat|voice
POST  /api/v1/agents            body: { kind, name, ... }   → create (draft)
GET   /api/v1/agents/:id
PATCH /api/v1/agents/:id        body: partial agent config  → update
POST  /api/v1/agents/:id/publish → status=live
DELETE /api/v1/agents/:id
```
Chat Agent screen edits the single chat agent (create on first save if none). Voice Agents list + builder edit `kind='voice'` agents.

## 3.7 Voice token mint (the security-critical endpoint)

```
POST /api/v1/voice/token            (JwtAuthGuard — for the builder "Test" panel)
POST /api/v1/public/voice/token     (PublicKeyGuard — for the widget)
  body: { agentId }
  → { token: string, expireTime: string, model: string }
```
Server: load the voice agent for the workspace, compose its system instruction + tools + voice, then call Gemini to mint an **ephemeral token locked to that config** (`uses:1`, constrained model/sysprompt/tools). Return only the token + expiry. **Never** return the real API key. Detail + SDK call in `06`.

```
POST /api/v1/public/voice/finalize
  body: { workspacePublicKey, agentId, conversationId?, transcript:[{role,content}], visitorMeta? }
  → persists conversation + messages + runs scoring/capture; returns { conversationId, captured?, score? }
```
The widget calls this when a voice call ends (Gemini Live transcripts are assembled client-side and posted once, since audio went direct to Google).

## 3.8 Widget config & verify

```
GET  /api/v1/public/widget/config?workspacePublicKey=...
  → { brandColor, chatAgent:{name,greeting,persona}, voice:{enabled, agentId, voiceName} }
  (drives the widget's appearance + which agents are live)

POST /api/v1/widget/verify          (owner JWT)
  → { installed: boolean, lastSeenAt? }
  (set by the widget pinging POST /api/v1/public/widget/ping with the public key on load)
```

## 3.9 Cross-cutting (NestJS)

- **Map endpoints to modules:** KbModule, AgentsModule, ConversationsModule, LeadsModule, VoiceModule, WidgetModule, AuthModule (see `01.3`). Controllers thin, services hold logic.
- **CORS:** owner API restricted to `APP_ORIGIN`; `/public/*` allows any origin (widget runs on customer sites) but is limited to public, workspace-scoped actions. Configure in `main.ts` (consider two CORS policies or per-route handling).
- **Rate limiting:** `@nestjs/throttler`, stricter on `/public/*` (per-IP + per-public-key) to protect a tenant's Gemini quota.
- **Validation:** global `ValidationPipe` + DTOs. Reject unknown fields.
- **Errors:** global exception filter → consistent `{ error: { code, message } }`. Never leak stack traces in prod.
- **Logging:** structured logs with `workspaceId` + `conversationId` correlation; never log secrets or full PII.
