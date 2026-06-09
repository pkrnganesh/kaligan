# 06 — Voice Integration (Gemini Live, multi-tenant, secure)

Port the working voice engine from `Voice/src/pages/AgentInterface.tsx` into the kaligan app and
the widget, made multi-tenant and secure. Keep the parts that already work; fix what's broken;
change the auth model.

## 06.1 What to keep from the existing voice code

These work and should be preserved (moved into `app/src/lib/voice/`):
- **AudioWorklet PCM capture** (`WORKLET_CODE`) — 16kHz mic → Float32 buffers.
- **PCM playback scheduler** (`playPCMChunk`, `nextPlayTimeRef`) — 24kHz Gemini output, gapless scheduling.
- **Barge-in / interruption** handling (`serverContent.interrupted` → stop playback, reset context, clear queues).
- **Tool-call loop** for `query_knowledge_base` (`message.toolCall.functionCalls` → fetch KB → `sendToolResponse`).
- **Transcription handling** (input/output transcription → UI messages) — but fix the broken variables (07).
- **`createBlob`/`decode`/`encode`/`decodeAudioData`** in `audioUtils.ts`.
- The reactive **WebGL orb** (`VoicePoweredOrb.tsx`) — re-themed to emerald.

## 06.2 What changes: client-side key → ephemeral token

**Current (insecure):** the browser reads `VITE_GEMINI_API_KEY` and calls `ai.live.connect({ apiKey })`. In multi-tenant production this exposes your key to every visitor and bills all tenants to it.

**Target:** ephemeral tokens with server-locked config.

### Server: mint the token (`server/src/llm/voiceToken.js`)
On `POST /api/v1/(public/)voice/token { agentId }`:
1. Resolve workspace (JWT or public key) and load the voice `agent`.
2. Compose the **system instruction** (grounding preamble + persona/goal/greeting/capture — see `04.5`) and the **tools** (`query_knowledge_base` declaration, identical shape to the current `tools` array in `AgentInterface`).
3. Mint an ephemeral token using the GenAI SDK with `v1alpha`, locked to this config:
   ```js
   // pseudocode — match @google/genai Node SDK
   const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions:{ apiVersion:'v1alpha' }});
   const now = Date.now();
   const token = await client.authTokens.create({
     config: {
       uses: 1,                                   // single new session
       expireTime:  new Date(now + 30*60*1000),   // ~30 min to send messages
       newSessionExpireTime: new Date(now + 60*1000), // ~1 min to start session
       liveConnectConstraints: {
         model: VOICE_MODEL,                       // e.g. 'gemini-2.5-flash-native-audio-preview-09-2025'
         config: {
           responseModalities: ['AUDIO'],
           speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: agent.voice_name }}},
           systemInstruction: composedSystemInstruction,
           tools,
           inputAudioTranscription: {}, outputAudioTranscription: {}
         }
       }
     }
   });
   return { token: token.name, expireTime: token.expireTime, model: VOICE_MODEL };
   ```
4. Return only `{ token, expireTime, model }`. The system prompt and tools stay server-side (the constraint locks them so the client can't override).

> Locking config via `liveConnectConstraints` is what makes client-to-server safe: the visitor's browser cannot change the model, the system prompt, or the tools. Without locking, even an ephemeral token would let a tampered client alter behavior.

### Client: connect with the token (`app/src/lib/voice/useLiveSession.ts`)
```ts
const { token, model } = await api.post('/voice/token', { agentId });   // or /public/voice/token
const ai = new GoogleGenAI({ apiKey: token, httpOptions:{ apiVersion:'v1alpha' }});
const session = await ai.live.connect({ model, callbacks:{ onopen, onmessage, onclose, onerror }});
```
The connection is direct browser ↔ Google (low latency). The only thing our backend does at call
time is (a) mint the token up front, and (b) answer `query_knowledge_base` tool calls.

## 06.3 Session limits, refresh & resumption (must handle)

Gemini Live constraints to design around:
- The token gives ~1 minute to **start** a session and ~30 minutes to **send messages**.
- Audio-only sessions are capped (~15 minutes) unless session management is configured.

Implement:
- **Token TTL guard:** if a call approaches the message-expiry window, mint a fresh token and reconnect transparently, or end gracefully with a message.
- **Session resumption / context compression:** enable Gemini Live session resumption so a long call survives the audio cap; on a `GoAway`/limit signal, resume with the prior context. (Reference the Live API "Session Management" capability.) For v1, at minimum detect session end and show "call ended — start again," but prefer resumption.
- **Idle/timeout cleanup:** reuse the existing robust `disconnect()` teardown (stops worklet, media tracks, both audio contexts, clears queues). Keep it.

## 06.4 The KB tool loop (per-tenant grounding)

Keep the existing pattern but point it at the multi-tenant endpoint:
- On `query_knowledge_base` tool call → the client (app builder = authenticated `/kb/query`; widget = `/public/kb/query` with the public key) fetches grounded context for the workspace and returns it via `sendToolResponse`.
- If `grounded=false`, return a short "no info found" so the model declines and offers capture (consistent with chat).
- Keep the 5s timeout/AbortController the current code uses.

## 06.5 Orb port (re-theme to emerald)

`VoicePoweredOrb.tsx` → `app/src/components/voice/Orb.tsx`:
- Replace the red/copper shader constants (`baseColor1=#fa5252`, `cyanHighlight=#ff3333`, `warmCopper`, etc.) with emerald-family colors derived from the design tokens (`#0E7A5F`, `#15916F`, `#5FC9B0`, charcoal→a dark emerald/ink base). Keep the noise/flare/rim math.
- Keep voice-reactivity (mic RMS → rotation/hover). In the builder Test panel and widget, drive it from the **same** mic stream used for the Live session (or a lightweight analyser) so it pulses with the speaker.
- Keep the mobile perf guards (lower DPR/FPS, disable AA on mobile).

## 06.6 Where voice runs

1. **Builder "Test" panel** (`VoiceAgentBuilder` right rail): authenticated owner preview. "Talk now" → `/voice/token` → live session → real transcript in the existing transcript card.
2. **Widget** (`/widget` voice mode): visitor-facing. `/public/voice/token` → live session → on end `/public/voice/finalize` to persist the conversation + run scoring/capture.

Both share the `useLiveSession` core logic (the hook for React, a vanilla wrapper for the widget).

## 06.7 Acceptance checks

- No `VITE_GEMINI_API_KEY` anywhere in client/widget bundles (grep the build output).
- Network tab shows the browser connecting to `generativelanguage.googleapis.com` with the ephemeral token, not the real key.
- Two workspaces with different KBs: a voice call in each only retrieves its own workspace's chunks.
- Barge-in still interrupts playback within ~real-time.
- A call exceeding the audio cap either resumes or ends gracefully (no hard crash).
- Tampering the client to change the system prompt has no effect (config is locked server-side).
