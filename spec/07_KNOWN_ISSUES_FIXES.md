# 07 — Known Issues & Required Fixes (do these first)

These are real defects and security problems in the current code. Fix them before/while building.

## 07.1 SECURITY — committed live secrets (fix immediately)

- **`Voice/server/render.yaml`** contains a **live Turso `TURSO_AUTH_TOKEN`** (a real JWT) and a database URL committed in plaintext. **Action:** treat as compromised → rotate the Turso credential now, remove it from the file and git history, move to environment variables / secret manager. (Note: the target stack is Postgres+pgvector, so Turso likely goes away entirely — but the leaked token must still be rotated.)
- **`Voice/Lumina Support/.env.production`** commits `VITE_API_BASE_URL` and an (empty but present) `VITE_GEMINI_API_KEY` slot. Client-exposed Gemini keys must never ship. **Action:** remove client key usage (see 07.2); keep only non-secret public config in client env.
- **General:** scan both repos for any other committed keys/tokens before deploy. Add a secret-scanner to CI.

## 07.2 SECURITY — Gemini key used in the browser

`Voice/Lumina Support/src/pages/AgentInterface.tsx` reads `import.meta.env.VITE_GEMINI_API_KEY` and connects to Gemini Live directly with it. **Action:** replace with the ephemeral-token flow in `06`. No long-lived key in any client or widget bundle.

## 07.3 BUG — `AgentInterface.tsx` will not compile

In the `onmessage` handler, the transcription section references variables that are **never declared**:
- `inputTxStart` (used in `if (inputTxStart?.text) { ... }`)
- `inputTx` (referenced in a comment/logic around input transcription)

The output transcription path declares `outputTx` correctly, but the **input** transcription path is broken — there is no `const inputTx = message.serverContent?.inputTranscription;`. **Action:** when extracting this logic into `useLiveSession.ts`, declare:
```ts
const inputTx = message.serverContent?.inputTranscription;
if (inputTx?.text) {
  currentInputTranscriptionRef.current += inputTx.text;
  addMessage('user', currentInputTranscriptionRef.current, false);
}
```
and remove the dangling `inputTxStart` references. Verify the full message handler compiles and that both input and output transcripts render.

## 07.4 ARCHITECTURE — RAG silently degrades to keyword search

`Voice/server/services/ragService.js` falls back to substring keyword matching over a JSON file
whenever embeddings fail, and embeddings frequently fail (the local KB has empty `values: []`).
This means "RAG" is often just `String.includes`. **Action:** replace with the real pgvector +
fastembed pipeline (`04`). Embeddings must succeed at ingest or the document is marked failed.
Do not ship keyword-substitution as primary retrieval.

## 07.5 ARCHITECTURE — single-tenant everywhere

The Voice backend has no concept of a workspace; the KB is global. **Action:** every table and
query becomes workspace-scoped (`02`). The widget and voice token endpoints resolve the workspace
from the public key; owner endpoints from the JWT.

## 07.6 STACK — frontend reconciliation + new backend

- `kaligan-frontend`: React 19, Vite, **Tailwind 3**, emerald tokens, `npm`.
- `Voice/Lumina Support`: React 19, Tailwind 4, red/black theme, extra deps (three, ogl, gsap, framer-motion).
**Action (frontend):** the merged app uses kaligan's stack (Tailwind 3 + emerald). When porting the orb, bring only the deps it needs (`ogl`); drop gsap/framer/three unless actually used. The orb's GLSL is self-contained and doesn't depend on Tailwind utilities, so it ports cleanly.
**Action (backend):** the old `Voice/server` was plain Express. The target is a fresh **NestJS** app (`server/`) — most of the old code is rewritten anyway (multi-tenant + pgvector + fastembed). Reuse only the *logic* worth keeping: the `chunkText` algorithm, `pdf-parse` usage, and the Gemini Live session/tool-call patterns. Do not port the Express routing, Pinecone branches, or the flat-file store.

## 07.7 CONFIG — `vite.config.ts` injects keys into `process.env`

`Voice/Lumina Support/vite.config.ts` does `define: { 'process.env.GEMINI_API_KEY': JSON.stringify(...) }` — baking secrets into the bundle. **Action:** remove these defines; the client never needs the Gemini/Murf keys after the ephemeral-token migration.

## 07.8 DEAD CODE / unused

- `Voice/Lumina Support/services/murfService.ts` (Murf TTS) — unused in the native-audio flow; the README/QUICK_START mention Murf but the actual `AgentInterface` uses Gemini native audio. **Action:** drop Murf entirely (native audio replaces it).
- Empty placeholder files: `components/ui/loading-screen.tsx`, `spiral-animation.tsx`, `voice-powered-orb.tsx` (empty) — ignore/remove.
- `Voice/server/aiController.js` (TOON-format Gemini 2.0 path) and `server/public/index.html` (old WebSocket demo) — not part of the target architecture. **Action:** do not port; the chat path is the new `/public/chat` in `03`.

## 07.9 Fix order

1. Rotate + remove committed secrets (07.1).
2. Stand up the new backend skeleton + Postgres (so nothing depends on the leaked Turso token).
3. Remove client key usage; build ephemeral-token mint (07.2 / 06).
4. Fix `AgentInterface` transcription bug during the port (07.3).
5. Replace RAG (07.4) and make everything multi-tenant (07.5).
