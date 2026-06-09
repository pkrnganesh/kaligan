# 02 — Data Model (Postgres + pgvector)

## 2.1 Principles

- **ORM: Prisma.** Models below are expressed as SQL for clarity, but implement them in `schema.prisma`. Prisma owns migrations (`prisma migrate`). **Exception:** the `vector` column and all similarity queries.
  - pgvector has no native Prisma scalar. Declare the embedding column with `Unsupported("vector(384)")` in `schema.prisma` (enable `postgresqlExtensions` + add `vector` to `extensions`), OR add it via a manual SQL migration after `prisma migrate`. Either way, **insert and search the vector with `prisma.$executeRaw` / `prisma.$queryRaw`** — Prisma's typed client can't express `<=>`.
  - Everything else (workspaces, users, agents, conversations, messages, leads, kb_documents) uses the normal type-safe Prisma client.
- **One Postgres database.** Multi-tenancy by `workspace_id` column on every tenant-owned table (shared-schema, row-scoped). This is simplest and adequate for the target scale.
- **Enforce `workspace_id` scoping in a NestJS Guard + a thin repository layer**, not by trusting each handler. A global `WorkspaceGuard` puts `workspaceId` on the request; services must use it. Add a regression test that fails if any tenant table is queried without a workspace filter.
- **UUID primary keys** (`gen_random_uuid()`, requires `pgcrypto` or `uuid-ossp`).
- **`pgvector` extension** for embeddings.
- **Timestamps:** `created_at timestamptz default now()`, `updated_at` maintained by trigger or app.
- **Soft delete** where useful (`deleted_at timestamptz null`); hard-delete KB chunks on document delete.

## 2.2 Extensions & global config

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
```

`EMBEDDING_DIM = 384` (bge-small-en-v1.5). The `kb_chunks.embedding` column dimension MUST equal this constant. If the embedding model changes, change the column type and re-embed.

## 2.3 Tables

### workspaces (the tenant)
```sql
CREATE TABLE workspaces (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  website_url   text,
  brand_color   text DEFAULT '#0E7A5F',
  public_key    text UNIQUE NOT NULL,          -- used by widget; e.g. 'ws_' + random
  plan          text NOT NULL DEFAULT 'starter', -- starter|growth|agency
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```
`public_key` is safe to expose in the embed snippet. It only authorizes public chat/voice for that workspace; it cannot read owner data.

### users
```sql
CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email          citext UNIQUE NOT NULL,        -- citext for case-insensitive
  password_hash  text NOT NULL,                 -- bcrypt/argon2
  name           text,
  role           text NOT NULL DEFAULT 'owner', -- owner|member
  created_at     timestamptz NOT NULL DEFAULT now()
);
```
> v1: one workspace per user at signup (signup creates both). Multiple members per workspace is allowed by schema but UI can defer it.

### refresh_tokens
```sql
CREATE TABLE refresh_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   text NOT NULL,                   -- store hash, not raw
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
```

### kb_documents (a source)
```sql
CREATE TABLE kb_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type          text NOT NULL,                  -- pdf|txt|url|faq
  name          text NOT NULL,
  source_uri    text,                           -- url, or original filename
  status        text NOT NULL DEFAULT 'processing', -- processing|ready|failed
  error         text,
  chunk_count   int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON kb_documents (workspace_id, status);
```

### kb_chunks (the vectors)
```sql
CREATE TABLE kb_chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id   uuid NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
  chunk_index   int NOT NULL,
  content       text NOT NULL,
  embedding     vector(384) NOT NULL,           -- = EMBEDDING_DIM
  token_len     int,
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- ANN index. Use HNSW for quality/latency; cosine distance.
CREATE INDEX kb_chunks_embedding_idx ON kb_chunks
  USING hnsw (embedding vector_cosine_ops);
-- Critical: retrieval filters by workspace_id first.
CREATE INDEX kb_chunks_ws_idx ON kb_chunks (workspace_id);
```
> Retrieval query pattern: filter `workspace_id = $1` then ORDER BY `embedding <=> $queryVec` LIMIT k. With HNSW + a workspace filter, for large tenants consider partial/partitioned indexes later; fine for v1.

### agents (chat agent + voice agents share config shape)
```sql
CREATE TABLE agents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  kind            text NOT NULL,                -- chat|voice
  name            text NOT NULL,
  status          text NOT NULL DEFAULT 'draft',-- draft|live
  persona         text DEFAULT 'Friendly',      -- Friendly|Professional|Concise|Enthusiastic
  greeting        text,
  goal            text DEFAULT 'qualify',       -- qualify|book|answer
  -- voice-specific (null for chat):
  voice_name      text,                         -- Gemini prebuilt voice, e.g. 'Kore','Aria'
  language        text DEFAULT 'en-US',
  speaking_speed  text DEFAULT 'natural',
  channels        jsonb DEFAULT '{"web":true,"phone":false}'::jsonb,
  -- lead capture requirements:
  capture_fields  jsonb DEFAULT '["name","email"]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON agents (workspace_id, kind);
```
The agent's effective **system instruction** is composed at runtime from persona + goal + greeting + capture rules + a fixed grounding preamble (see `04`). Do not store the full system prompt; compose it so updates are consistent.

### conversations
```sql
CREATE TABLE conversations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id       uuid REFERENCES agents(id) ON DELETE SET NULL,
  channel        text NOT NULL,                 -- chat|voice
  visitor_label  text,                          -- 'Visitor 0291'
  visitor_meta   jsonb,                         -- {location, device, pages}
  captured       boolean NOT NULL DEFAULT false,
  score          text,                          -- Hot|Warm|Cold|null
  message_count  int NOT NULL DEFAULT 0,
  started_at     timestamptz NOT NULL DEFAULT now(),
  ended_at       timestamptz
);
CREATE INDEX ON conversations (workspace_id, started_at DESC);
```

### messages
```sql
CREATE TABLE messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            text NOT NULL,                -- visitor|ai|system
  content         text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON messages (conversation_id, created_at);
```

### leads
```sql
CREATE TABLE leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  name            text,
  email           text,
  phone           text,
  score           text NOT NULL DEFAULT 'Cold', -- Hot|Warm|Cold
  status          text NOT NULL DEFAULT 'New',  -- New|Contacted|Qualified|Won|Lost
  intent          text,                         -- High|Medium|Low
  ai_note         text,                         -- short reason string
  source          text,                         -- 'Visitor 0291' | 'Voice call'
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON leads (workspace_id, created_at DESC);
CREATE INDEX ON leads (workspace_id, score);
```

## 2.4 Mapping mock → real

The mock types in `kaligan-frontend/src/data/mock.ts` map almost 1:1:

| mock type | table | notes |
|-----------|-------|-------|
| `Lead` | `leads` | `time` → derive from `created_at`; `note` → `ai_note`. |
| `Convo` | `conversations` | `snippet` → first/last visitor message; `messages` → `message_count`. |
| `Source` | `kb_documents` | `pct` → derive from chunk progress during processing. |
| `VoiceAgent` | `agents` (kind='voice') | `kb` count → count of `kb_documents` ready; `calls` → count of voice conversations. |

Keep the API response shapes close to these mock shapes so the screens need minimal rewiring.

## 2.5 Migrations

Use **Prisma Migrate**. The `vector` column + the HNSW index go in a manual SQL step (a `prisma migrate` custom migration or a follow-up SQL file run by the migrate script), since Prisma can't model them. Order: enable extensions → create tables (Prisma) → add `vector` column + HNSW index (raw SQL). Seed via a Prisma seed script (`prisma db seed`) that creates a demo workspace + user and ingests `sample_policy.txt` (from `Voice/server/documents/`) through the real ingestion path so embeddings are produced exactly as in production.

## 2.6 Multi-tenant isolation test (required)

Add an automated test: create two workspaces, ingest a distinct doc into each, run a KB query as workspace A, assert **zero** chunks from workspace B are ever returned. Repeat for leads and conversations endpoints. CI must run this.
