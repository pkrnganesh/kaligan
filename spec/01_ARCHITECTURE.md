# 01 — Architecture & Merge Plan

## 1.1 Target system (one product, three runtimes)

```
                          ┌─────────────────────────────────────────────┐
                          │              POSTGRES + pgvector             │
                          │  workspaces, users, kb_documents, kb_chunks  │
                          │  agents, conversations, messages, leads      │
                          └───────────────▲─────────────────────────────┘
                                          │ SQL (every query scoped by workspace_id)
                          ┌───────────────┴─────────────────────────────┐
                          │          NESTJS API (the brain)              │
                          │  • JWT auth (access+refresh)                 │
                          │  • RAG: ingest / embed / retrieve            │
                          │  • Chat completion (Gemini text + RAG)       │
                          │  • Voice: mint ephemeral Live tokens         │
                          │  • Lead scoring + capture                    │
                          │  • Widget config + verify                    │
                          └──▲────────────▲───────────────▲──────────────┘
                             │            │               │
        ┌────────────────────┘            │               └────────────────────┐
        │ (authenticated, owner)          │ (public, per-workspace)             │ (public, direct to Google)
┌───────┴────────┐            ┌───────────┴───────────┐          ┌──────────────┴─────────────┐
│ APP DASHBOARD  │            │  EMBEDDABLE WIDGET     │          │  GEMINI LIVE (voice)       │
│ (kaligan app)  │            │  w.js on customer site │          │  browser ↔ Google, using   │
│ owner manages  │            │  visitor chat + voice  │          │  a short-lived token minted │
│ KB, agents,    │            │  → creates conversations│         │  by our backend w/ locked   │
│ leads, config  │            │  + leads               │          │  config (sys prompt, tools) │
└────────────────┘            └────────────────────────┘          └────────────────────────────┘
```

**Three frontend runtimes, one backend:**

1. **App dashboard** — the authenticated owner UI. This *is* `kaligan-frontend/src/pages/*` today (mock). Wire it to the API.
2. **Embeddable widget (`w.js`)** — the visitor-facing chat+voice bubble that loads on the customer's website. **Does not exist yet.** Must be built. It is what actually produces conversations and leads.
3. **Gemini Live voice** — runs inside both the widget (visitor voice) and the builder's "Test" panel (owner preview). Ported from `Voice/`.

## 1.2 The merge plan (Voice/ → kaligan)

| From `Voice/` | Destination in kaligan | Transform |
|---------------|------------------------|-----------|
| `services/audioUtils.ts` | `src/lib/voice/audioUtils.ts` | Keep as-is (PCM encode/decode, AudioWorklet helpers). |
| `src/components/ui/VoicePoweredOrb.tsx` | `src/components/voice/Orb.tsx` | Re-theme: replace red/copper shader colors with emerald (`#0E7A5F`/`#5FC9B0`). Keep the WebGL/voice-reactive logic. |
| `src/components/ui/LightRays.tsx` | `src/components/voice/LightRays.tsx` | Optional; re-theme to emerald or drop. |
| `src/pages/AgentInterface.tsx` (the working Gemini Live session logic) | `src/lib/voice/useLiveSession.ts` (a hook) | **Fix the broken vars first (07).** Extract the connect/disconnect/onmessage/tool-call logic into a reusable hook. Replace client-side key with ephemeral-token fetch. Make system prompt + tools come from the agent config, not a hard-coded constant. |
| `server/databaseServer.js` | `server/src/` (NestJS app) | Rewrite as Nest modules. Replace flat-file KB with Postgres/Prisma. Replace Express routes with controllers. |
| `server/services/ragService.js` | `server/src/rag/*` (RagModule) | Replace Pinecone + JSON with pgvector (`$queryRaw`). Replace Gemini embeddings with fastembed. |
| `server/services/geminiService.js` | `server/src/llm/*` (LlmModule) | Keep Gemini for chat completion + voice token mint; remove embedding use. |

**Do NOT keep:** `Voice/server/local_knowledge_base.json`, Pinecone deps, the red/black `index.css` theme, `metadata.json`, the standalone `Voice/server/public/index.html` demo.

## 1.3 Repo layout (target)

```
/                      (monorepo root)
├── app/               ← was kaligan-frontend (owner dashboard + marketing + auth)
│   └── src/
│       ├── pages/         (existing screens, now wired to API)
│       ├── components/    (+ components/voice/ ported orb)
│       ├── lib/
│       │   ├── api.ts         (typed fetch client, attaches JWT)
│       │   ├── auth.ts        (token storage, refresh)
│       │   └── voice/         (useLiveSession, audioUtils)
│       └── data/mock.ts   (kept for empty-state fallbacks only)
├── widget/            ← NEW. The embeddable w.js (chat + voice bubble)
│   └── src/
│       ├── widget.ts      (entry, builds the bubble, isolates styles via shadow DOM)
│       ├── chat.ts
│       └── voice.ts       (reuses the same useLiveSession logic, vanilla)
├── server/            ← was Voice/server, rewritten as a NestJS app (multi-tenant)
│   ├── prisma/
│   │   ├── schema.prisma   (all models from 02; vector column via Unsupported/raw)
│   │   └── migrations/
│   └── src/
│       ├── main.ts                (bootstrap, global pipes/guards, CORS)
│       ├── app.module.ts
│       ├── prisma/                (PrismaModule + PrismaService)
│       ├── common/
│       │   ├── guards/            (JwtAuthGuard, WorkspaceGuard, PublicKeyGuard)
│       │   ├── decorators/        (@CurrentWorkspace(), @Public())
│       │   └── filters/           (global exception filter)
│       ├── auth/                  (AuthModule: controller, service, JWT strategy)
│       ├── kb/                    (KbModule: documents, ingest, retrieve)
│       ├── rag/                   (RagModule: chunk, embed [fastembed], search)
│       ├── llm/                   (LlmModule: Gemini chat + voice token mint)
│       ├── agents/                (AgentsModule)
│       ├── conversations/         (ConversationsModule)
│       ├── leads/                 (LeadsModule: incl. scoring)
│       ├── widget/                (WidgetModule: public config, ping, verify)
│       └── voice/                 (VoiceModule: token mint endpoints, finalize)
└── spec/              ← this folder
```

> If a monorepo restructure is too invasive in one pass, keep `kaligan-frontend/`, `widget/`, and `server/` as sibling folders. The names above are the intent, not a hard requirement — but **do** introduce `widget/` and the rewritten `server/`.

## 1.4 Core request flows

**A. Visitor asks the chat widget a question**
```
widget → POST /api/v1/public/chat {workspacePublicKey, conversationId?, message}
  → backend resolves workspace from public key
  → RAG: embed(message) → pgvector top-k over workspace's chunks → context
  → Gemini chat completion (system prompt + context + history)  [grounded]
  → if buying intent detected → ask for contact / create/update lead + score
  → persist message(s) + conversation; return reply
```

**B. Visitor starts a voice call in the widget**
```
widget → POST /api/v1/public/voice/token {workspacePublicKey, agentId}
  → backend mints ephemeral Gemini Live token, config locked to that agent
    (model, system instruction, voice, tools=[query_knowledge_base])
  → returns {token, expireTime}
widget → opens Gemini Live WS directly with token (low latency)
  → on tool call query_knowledge_base → widget calls
    POST /api/v1/public/kb/query {workspacePublicKey, q} → returns grounded context
  → transcripts streamed; on end, conversation + lead persisted via /public/voice/finalize
```

**C. Owner uploads a document**
```
app → POST /api/v1/kb/documents (multipart, JWT)
  → parse (pdf-parse/txt) → chunk → embed each chunk → insert kb_chunks (workspace_id)
  → document status: processing → ready (or failed)
  → SSE/poll updates the Knowledge screen's sync state
```

## 1.5 Why ephemeral tokens (not a backend audio proxy)

The whole appeal of Gemini Live native audio is sub-second latency from direct browser↔Google
streaming. Proxying audio through our Node server adds a hop and kills that. Ephemeral tokens
keep the direct connection **and** keep the long-lived key + system prompt server-side. The token
is minted per session, single-use, config-locked. Full detail and the refresh/resumption flow are
in `06_VOICE_INTEGRATION.md`.
