# 04 — RAG Pipeline (production, free/OSS)

The current `Voice/server` RAG silently degrades: embeddings often fail and it falls back to
substring keyword matching over a flat JSON file. That is not production-grade. Replace it.

## 4.1 Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Vector store | Postgres + `pgvector` (HNSW, cosine) | Already chose Postgres; one fewer service than Pinecone; free. |
| Embeddings | `fastembed-js` running `BAAI/bge-small-en-v1.5` (384-dim) | Free, OSS, CPU-only, in-process, no API/rate limits, strong quality/size ratio. Most production-stable single-service option. |
| Chunking | Recursive, paragraph→sentence, ~800–1000 chars, ~100 char overlap | Coherent chunks, overlap preserves context across boundaries. |
| Parsing | `pdf-parse` (already a dep) for PDF; UTF-8 for txt; readability/strip for URL | Reuse existing. |
| Completion | Gemini text model (chat) / Gemini Live (voice) | Already integrated; grounding done via injected context. |

> `EMBEDDING_DIM = 384` is a single exported constant used by the schema and the embedder. Swapping to a larger model (e.g. `bge-base`, 768-dim) = change the constant, the column type, and re-embed. Keep it isolated.

> Optional managed alternative (documented, not default): Gemini `text-embedding-004`. If chosen, set `EMBEDDING_DIM=768` and route through `server/src/llm/gemini.js`. Do not mix dimensions in one table.

## 4.2 Ingestion pipeline (async, per document)

```
1. Receive document (upload/url/faq) → insert kb_documents (status='processing').
2. Extract text:
     pdf  → pdf-parse(buffer).text
     txt  → buffer.toString('utf-8')
     url  → fetch + extract main content (strip nav/scripts)
     faq  → join each {q,a} into "Q: ...\nA: ..." blocks
3. Normalize whitespace; reject if empty → status='failed', error.
4. Chunk (4.3).
5. Embed each chunk with fastembed (batch). Embedding MUST succeed; on hard failure,
     retry once, then status='failed' with a clear error. NO silent keyword fallback at
     ingest time — a document is either embedded or marked failed.
6. Insert kb_chunks rows (workspace_id, document_id, chunk_index, content, embedding, token_len).
7. Update kb_documents: chunk_count, status='ready', updated_at.
8. Emit progress events (SSE) so the UI animates processing %.
```
Run ingestion off the request thread (a simple in-process queue/worker is fine for v1; a job table or BullMQ later). The POST returns immediately with `processing`.

## 4.3 Chunking

```
chunkText(text, target=900, overlap=120):
  split into paragraphs on /\n\n+/
  greedily accumulate paragraphs up to ~target chars
  if a single paragraph > target → split on sentence boundaries [^.!?]+[.!?]
  carry `overlap` trailing chars from the previous chunk into the next
  trim; drop empties
```
This is the existing `chunkText` logic in `databaseServer.js`/`ingest.js` plus overlap. Keep the structure, add overlap, make `target`/`overlap` config.

## 4.4 Retrieval

```
query(workspaceId, q, topK=5, threshold=0.35):
  qv = embed(q)                          // same model as ingest — non-negotiable
  rows = SELECT content, document_id, 1 - (embedding <=> qv) AS score
         FROM kb_chunks
         WHERE workspace_id = $workspaceId
         ORDER BY embedding <=> qv
         LIMIT topK
  kept = rows.filter(r => r.score >= threshold)
  return { chunks: kept, context: kept.map(c=>c.content).join('\n\n'), grounded: kept.length>0 }
```
- Cosine distance operator `<=>`; score = `1 - distance`.
- `threshold` tunable (start 0.35 for bge-small; calibrate with the seed doc). If nothing passes, `grounded=false`.
- Always filter `workspace_id` **before** ranking — this is both correctness (isolation) and a perf win.
- Cap total injected context (e.g. ~1500 chars) to control prompt size, like the current `.substring(0,1000)` but higher.

## 4.5 Grounding & anti-hallucination (the product promise)

Compose the system instruction for chat/voice as:

```
[FIXED GROUNDING PREAMBLE]
You are {agentName}, a {persona} assistant for {workspace.name}.
Answer ONLY using the CONTEXT provided. If the context does not contain the answer,
say you don't have that information and offer to take the visitor's details so the team
can follow up. NEVER invent facts, prices, policies, or features.
Goal: {goal}. When the visitor shows interest, collect: {capture_fields}.
Keep replies concise and conversational. No markdown.

[PER-TURN]
CONTEXT:
{retrieved context, or "No relevant information found."}

CONVERSATION:
{recent history}
VISITOR: {message}
```

- When `grounded=false`, the model must not answer from general knowledge. The preamble enforces it; additionally, if `grounded=false`, the backend may short-circuit to a templated "I don't have that in my notes — can I grab your email so the team can help?" to be safe.
- For **voice**, the same preamble is baked into the ephemeral token's locked config, and the `query_knowledge_base` tool returns the same retrieval result. The voice tool MUST hit `/public/kb/query` (grounded), exactly as the current `AgentInterface` does — keep that loop.

## 4.6 What to delete from the old code

- `Voice/server/local_knowledge_base.json` (flat store).
- `@pinecone-database/pinecone` dependency and all Pinecone branches in `ragService.js`.
- Gemini embedding calls in `geminiService.js` (`text-embedding-004`) — replaced by fastembed, unless the managed alternative is explicitly chosen.
- The "keyword fallback" search path as a *substitute* for embeddings. (You may keep a lightweight keyword filter as an optional re-ranker, but never as the primary retrieval when embeddings exist.)

## 4.7 Acceptance checks

- Ingest the seed `sample_policy.txt`; querying "refund timeline" returns the refund chunk with score above threshold.
- Querying something absent ("do you sell cars?") returns `grounded=false` and the agent declines + offers capture.
- Two-workspace isolation test (from `02_DATA_MODEL.md`) passes for `/kb/query`.
- Re-ingesting the same document does not duplicate-explode chunks (replace doc's chunks on re-ingest).
