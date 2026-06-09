# Implementation Plan — Phase 4: Chat Completion + Leads Capture & Dashboard Wiring

This phase implements the dynamic AI interaction layers of KaliGanAI. We will build chat completion endpoints (public widget chat + authenticated owner previews) utilizing the official `GoogleGenAI` SDK (`gemini-2.0-flash`), implement a hybrid regex + LLM extraction system for lead qualification and scoring, and wire the front-end pages (Dashboard, Conversations list, Leads table/insights, and Agent preview).

## User Review Required

> [!IMPORTANT]
> - **Gemini 2.0 Integration:** We will use the modern `@google/genai` SDK and target the `gemini-2.0-flash` model for chat generation and structured JSON extraction.
> - **Structured Lead Classification:** Conversation scoring (`Hot`/`Warm`/`Cold`) and insights extraction are triggered asynchronously after each turn using Gemini's structured output capabilities (`responseMimeType: 'application/json'`).
> - **CSV Streaming:** The Leads CSV export will be generated dynamically on-the-fly and streamed with the proper headers to ensure scalability.

---

## Proposed Changes

### [Backend Modules]

We will build the `LlmModule`, `AgentModule`, `ConversationModule`, `LeadModule`, and `DashboardModule` in NestJS under the `server/src/` directory.

#### [NEW] [llm.service.ts](file:///c:/Users/potha/Desktop/kaligan/server/src/llm/llm.service.ts)
Manage Gemini 2.0 Flash chat completion and classification calls:
- **`generateChatReply(agent: Agent, context: string, history: Message[], message: string): Promise<string>`**: Composes the grounded system instructions (preamble + persona + context + capture fields) and requests a conversational answer. Short-circuits to decline answer if RAG retrieval returns `grounded = false` and prompt asks for non-grounded info.
- **`scoreConversation(history: Message[]): Promise<{ score: string; intent: string; aiNote: string; name?: string; email?: string; phone?: string }>`**: Requests structured JSON from Gemini to classify the user's intent, assign a score dot (`Hot`/`Warm`/`Cold`), compile an overview note, and optionally extract profile fields from context.

#### [NEW] [agent.controller.ts & agent.service.ts](file:///c:/Users/potha/Desktop/kaligan/server/src/agent/)
Expose CRUD endpoints for agent configurations:
- `GET /agents?kind=chat|voice` (Owner scoped) -> list.
- `POST /agents` (Owner scoped) -> create a draft.
- `GET /agents/:id` (Owner scoped) -> fetch single.
- `PATCH /agents/:id` (Owner scoped) -> save config updates.
- `POST /agents/:id/publish` (Owner scoped) -> publishes agent (`status = 'live'`).
- `DELETE /agents/:id` (Owner scoped) -> delete agent.

#### [NEW] [conversation.controller.ts & conversation.service.ts](file:///c:/Users/potha/Desktop/kaligan/server/src/conversation/)
Expose public and private chat routing:
- `POST /public/chat`: Public endpoint using `PublicKeyGuard`. Performs RAG lookup, calls `LlmService.generateChatReply`, saves messages, triggers regex scanners for email/phone, runs `LlmService.scoreConversation` asynchronously, and updates the `Lead` and `Conversation` records.
- `POST /chat/preview`: Authenticated preview endpoint. Performs RAG lookup and calls `LlmService.generateChatReply` dynamically without saving records (ephemeral).
- `GET /conversations?tab=...`: Retrieves threads filtered by category tab (All, Captured, Hot, Unread).
- `GET /conversations/:id`: Retrieves a single thread with message arrays, visitor metadata, and linked lead info.

#### [NEW] [lead.controller.ts & lead.service.ts](file:///c:/Users/potha/Desktop/kaligan/server/src/lead/)
Expose lead management endpoints:
- `GET /leads?score=&status=`: Lists workspace leads.
- `GET /leads/:id`: Gets lead profile + linked conversation.
- `PATCH /leads/:id`: Modifies lead stage status (`New`/`Contacted`/`Won`/`Lost`).
- `GET /leads/export`: Streams CSV export.

#### [NEW] [dashboard.controller.ts & dashboard.service.ts](file:///c:/Users/potha/Desktop/kaligan/server/src/dashboard/)
Compute metrics and sparklines:
- `GET /dashboard/metrics?range=7d|30d`: Computes counts (conversations, leads captured, hot leads, opportunities) and daily sparkline arrays over the range. Identifies "Needs you" leads and logs recent activities.

---

### [Frontend Dashboard & Management]

We will modify several frontend pages to consume real APIs.

#### [MODIFY] [Dashboard.tsx](file:///c:/Users/potha/Desktop/kaligan/app/src/pages/Dashboard.tsx)
- Fetches metrics from `GET /dashboard/metrics`.
- Feeds dynamic points to `Sparkline` component and handles the 7d/30d filter toggling.
- Populates the "Needs you" and "Recent activity" lists with link triggers.

#### [MODIFY] [Conversations.tsx](file:///c:/Users/potha/Desktop/kaligan/app/src/pages/Conversations.tsx)
- Connects list view to `GET /conversations?tab=...` and thread view to `GET /conversations/:id`.
- Populates the right-hand metadata drawer (visitor device, page visits, intent rating, extracted values).

#### [MODIFY] [Leads.tsx](file:///c:/Users/potha/Desktop/kaligan/app/src/pages/Leads.tsx)
- Connects `Leads` list to `GET /leads` with score/status query filters.
- Connects `LeadDetail` view to render transcripts and metadata.
- Integrates CSV Export link to direct to `/leads/export`.
- Plugs in Mark Contacted/Won/Lost buttons calling `PATCH /leads/:id`.

#### [MODIFY] [Misc.tsx](file:///c:/Users/potha/Desktop/kaligan/app/src/pages/Misc.tsx)
- **ChatAgent**: Loads/saves the chat agent settings (`GET /agents`, `PATCH /agents/:id`). Connects the right preview rail to `POST /chat/preview` so owners can chat with their live agent configuration.
- **Settings**: Integrates profile name/email updates, changing passwords, and workspace metadata edits.

---

## Verification Plan

### Automated Tests
- Create `server/src/conversation/conversation.service.spec.ts` testing:
  - System prompt generation with correct grounded boundaries.
  - Regex detection of email/phone formats.
  - LLM structured lead profiling and score categorization.
  - Workspace scoping (a visitor chat for Workspace A does not create messages in Workspace B).

### Manual Verification
- **Lead Capture Walkthrough**:
  1. Open Chat Agent preview in dashboard.
  2. Ask a question present in KB -> get grounded response.
  3. Ask something absent -> agent should decline answering and ask for contact info.
  4. Provide a sample email -> verify it creates a lead and categorizes it as `Hot` or `Warm`.
  5. Go to the Leads page and verify it is logged in the grid. Export CSV.
  6. Go to the Dashboard and verify the counts and sparkline update.
