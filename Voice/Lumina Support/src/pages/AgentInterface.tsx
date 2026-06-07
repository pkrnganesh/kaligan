import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ChatMessage, ConnectionState } from '../../types';
import { createBlob } from '../../services/audioUtils';
import { VoicePoweredOrb } from '../components/ui/VoicePoweredOrb';
import { LightRays } from '../components/ui/LightRays';

// --- API Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';

// --- Configuration ---
const SYSTEM_INSTRUCTION = `You are a helpful, polite, and professional customer support voice agent for "KaaliganAI".
Your tone must be warm, empathetic, and direct. Since you are speaking over a phone call, keep your sentences brief, clear, and conversational.

CRITICAL INSTRUCTIONS:
1. Speak in a natural call center/phone call manner. Start with a greeting and ask how you can help.
2. If the user asks a question about policies, procedures, products, shipping, returns, or other documentation, you MUST use the tool 'query_knowledge_base' to retrieve the official guidelines.
3. Once information is retrieved from the knowledge base, summarize it clearly. Keep response length conversational (under 30 words per turn).
4. Do NOT use markdown formatting (no bold, no lists, no italics, no bullet points) in your speech, as it is converted to voice. Speak in full plain-text sentences.
5. If the user asks about an order status, refund status, or other specific inquiries not found in the documents, explain that you can check the knowledge base guidelines or escalate to a human representative.

=== SAMPLE CALL TRANSCRIPTS ===
Transcript 1 (General Support Inquiry):
Agent: "Thank you for calling KaaliganAI support. My name is Alex. How can I help you today?"
User: "Hi, I wanted to check if you guys offer free shipping to Delhi?"
Agent: [Calls query_knowledge_base with query "free shipping Delhi"]
Agent: "Yes, we do! We offer free shipping on all orders above 499 rupees. For Delhi, the delivery time is usually one to three days."
User: "Awesome, thank you!"
Agent: "You're welcome. Is there anything else I can help you with today?"

Transcript 2 (Return Policy Check):
Agent: "Thank you for calling KaaliganAI support. My name is Alex. How can I help you today?"
User: "I received a damaged shirt yesterday. Can I return it?"
Agent: [Calls query_knowledge_base with query "return shirt return policy"]
Agent: "I am very sorry to hear that. Yes, we have a thirty-day easy return policy. We can arrange a free pickup and replacement for you."
User: "How long will the refund take?"
Agent: [Calls query_knowledge_base with query "refund timeline"]
Agent: "Once we receive the returned item, it typically takes seven to ten business days for the refund to reflect in your bank account."
User: "Okay, got it. Thanks."
Agent: "It is my pleasure. Have a wonderful day!"

Transcript 3 (Escalation):
Agent: "Thank you for calling KaaliganAI support. My name is Alex. How can I help you today?"
User: "I need to speak with your manager immediately. The delivery agent was very rude."
Agent: "I am deeply sorry to hear about your experience. I will escalate this complaint to our support manager right away so they can look into it."
User: "Please do. Thank you."
Agent: "Of course. Is there anything else I can do for you in the meantime?"
`;

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

interface AudioQueueItem {
  id: string;
  audioPromise: Promise<HTMLAudioElement | null>;
}

// --- AudioWorklet Processor Code ---
// This runs on a separate thread for low-latency processing, similar to WebRTC internals.


const WORKLET_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 512; // ~32ms at 16kHz
    this.buffer = new Float32Array(this.bufferSize);
    this.index = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];

    // Buffer audio for transmission to Gemini
    // Let Gemini handle voice activity detection natively
    for (let i = 0; i < channel.length; i++) {
      this.buffer[this.index++] = channel[i];
      if (this.index >= this.bufferSize) {
        this.port.postMessage({ type: 'audio', data: this.buffer });
        this.index = 0;
      }
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

// --- Tool Definitions ---
// --- Tool Definitions ---
const tools = [
  {
    functionDeclarations: [
      {
        name: "query_knowledge_base",
        description: "Query the company's knowledge base for policies, terms of service, shipping information, FAQs, and general customer guidelines.",
        parameters: {
          type: "OBJECT" as any,
          properties: {
            query: { type: "STRING" as any, description: "The customer's question or search query (e.g., 'refund timeline', 'shipping regions')" }
          },
          required: ["query"]
        }
      }
    ]
  }
];

const AgentInterface: React.FC = () => {
  // --- State ---
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false); // Track when bot is playing audio
  const [isMobile, setIsMobile] = useState(false); // Mobile detection for performance
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Refs for Audio & API ---
  const connectionStateRef = useRef<ConnectionState>(ConnectionState.DISCONNECTED);
  const isBotSpeakingRef = useRef<boolean>(false); // Ref for tracking bot speaking state
  const isDisconnectingRef = useRef<boolean>(false); // Prevent multiple simultaneous disconnects
  const isMountedRef = useRef<boolean>(false); // Prevent React StrictMode double-mount issues

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const playbackAudioContextRef = useRef<AudioContext | null>(null); // Separate context for playback
  const inputWorkletNodeRef = useRef<AudioWorkletNode | null>(null); // Replaces ScriptProcessor
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Ref to hold the currently playing HTML5 Audio object
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- Refs for Queueing & Latency Reduction ---
  const ttsBufferRef = useRef<string>(''); // Accumulates text until a sentence is found
  const audioQueueRef = useRef<AudioQueueItem[]>([]); // Queue of pending audio clips
  const isPlayingRef = useRef<boolean>(false); // Mutex for playback loop

  // Transcription buffers for UI
  const currentInputTranscriptionRef = useRef<string>('');
  const currentOutputTranscriptionRef = useRef<string>('');

  // UI Scroll Ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to update both state and ref
  const updateConnectionState = (state: ConnectionState) => {
    setConnectionState(state);
    connectionStateRef.current = state;
  };

  // Helper to update bot speaking state (for barge-in access)
  const updateBotSpeaking = (speaking: boolean) => {
    setIsBotSpeaking(speaking);
    isBotSpeakingRef.current = speaking;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadState('error');
      setUploadMessage('File size exceeds 10MB limit.');
      return;
    }

    setUploadState('uploading');
    setUploadMessage('Ingesting document...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/kb/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setUploadState('success');
        setUploadMessage(`Successfully ingested: ${file.name}`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => {
          setUploadState('idle');
          setUploadMessage(null);
        }, 4000);
      } else {
        throw new Error(data.error || 'Failed to ingest file');
      }
    } catch (err: any) {
      console.error('[Upload Error]', err);
      setUploadState('error');
      setUploadMessage(err.message || 'Error uploading file.');
      setTimeout(() => {
        setUploadState('idle');
        setUploadMessage(null);
      }, 4000);
    }
  };



  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSynthesizing]);

  // Detect mobile devices for performance optimization
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(mobile);
      console.log('[Performance] Mobile detected:', mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;
    console.log('[Component] Mounted - isMountedRef set to true');
    
    return () => {
      console.log('[Component] Unmounting - calling disconnect');
      isMountedRef.current = false;
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMessage = useCallback((role: 'user' | 'model' | 'system', text: string, isFinal: boolean) => {
    setMessages((prev) => {
      let existingIndex = -1;
      // Search backwards to find the most recent non-final message for this role
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].role === role && !prev[i].isFinal) {
          existingIndex = i;
          break;
        }
      }

      if (existingIndex !== -1) {
        const newMessages = [...prev];
        newMessages[existingIndex] = {
          ...newMessages[existingIndex],
          text,
          isFinal
        };
        return newMessages;
      }

      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          role,
          text,
          isFinal,
          timestamp: new Date()
        }
      ];
    });
  }, []);

  const handleTestAudio = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = 440; // A4
      gainNode.gain.value = 0.1;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        ctx.close();
      }, 500);
    } catch (e) {
      console.error("Test audio failed", e);
      setError("Could not play test audio. Please check your system settings.");
    }
  }, []);

  // --- Gemini Native Audio Playback ---
  const nextPlayTimeRef = useRef<number>(0);

  const playPCMChunk = async (base64PCM: string) => {
    try {
      const binaryString = atob(base64PCM);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Gemini sends 16-bit PCM (Int16), Little Endian
      const int16Data = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(int16Data.length);

      // Convert Int16 to Float32 [-1.0, 1.0]
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
      }

      // Use the playback context (system default rate)
      let ctx = playbackAudioContextRef.current;
      
      // If context is closed or missing, create a new one
      if (!ctx || ctx.state === 'closed') {
        console.log('[PlayPCM] Creating new playback context...');
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        ctx = new AudioContextClass();
        playbackAudioContextRef.current = ctx;
        nextPlayTimeRef.current = 0;
      }

      // Ensure context is running - this is CRITICAL for reconnection
      if (ctx.state === 'suspended') {
        console.log('[PlayPCM] Resuming suspended playback context...');
        await ctx.resume();
      }

      const buffer = ctx.createBuffer(1, float32Data.length, 24000); // Gemini is 24kHz
      buffer.getChannelData(0).set(float32Data);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      // Schedule next chunk to play after the current one finishes
      const startTime = Math.max(now, nextPlayTimeRef.current);
      source.start(startTime);

      // Update next available play time
      nextPlayTimeRef.current = startTime + buffer.duration;

    } catch (e) {
      console.error("[PlayPCM] Error playing PCM chunk:", e);
    }
  };

  const connect = async () => {
    console.log('[Connect] ========== STARTING CONNECTION ==========');
    
    // Prevent connection if component is unmounting (StrictMode cleanup)
    if (!isMountedRef.current) {
      console.log('[Connect] Component not mounted, aborting connection');
      return;
    }
    
    // Prevent multiple simultaneous connections
    if (connectionStateRef.current === ConnectionState.CONNECTING || 
        connectionStateRef.current === ConnectionState.CONNECTED) {
      console.log('[Connect] Already connecting/connected, aborting');
      return;
    }
    
    try {
      updateConnectionState(ConnectionState.CONNECTING);
      setError(null);
      console.log('[Connect] State updated to CONNECTING');

      // Reset audio scheduling state
      nextPlayTimeRef.current = 0;
      ttsBufferRef.current = '';
      currentInputTranscriptionRef.current = '';
      currentOutputTranscriptionRef.current = '';

      // 1. Initialize Input Audio Context (16kHz for Mic)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      inputAudioContextRef.current = inputCtx;
      console.log('[Connect] Input audio context created');

      // 1b. Initialize Playback Audio Context (System Default Rate)
      // IMPORTANT: Create fresh context and ensure it's running
      const playbackCtx = new AudioContextClass();
      playbackAudioContextRef.current = playbackCtx;
      
      // Resume playback context immediately and on user interaction
      if (playbackCtx.state === 'suspended') {
        console.log('[Connect] Resuming playback context...');
        await playbackCtx.resume();
      }
      console.log('[Connect] Playback context state:', playbackCtx.state);

      // 2. Load AudioWorklet (Low-latency processing)
      const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      await inputCtx.audioWorklet.addModule(workletUrl);
      console.log('[Connect] AudioWorklet loaded');

      // 3. Request Mic Permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      console.log('[Connect] Microphone access granted');

      // 4. Initialize Gemini Client
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment.');
      }
      console.log('[Connect] Gemini API key loaded, key starts with:', apiKey.substring(0, 10) + '...');
      const ai = new GoogleGenAI({ apiKey });
      console.log('[Connect] GoogleGenAI client initialized');

      // 5. Start Live Session
      console.log('[Connect] Initiating Gemini Live session connection...');
      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,

        callbacks: {
          onopen: () => {
            console.log('[Session] ========== ONOPEN FIRED ==========');
            console.log('[Session] Connection state before ONOPEN:', connectionStateRef.current);
            console.log('Gemini Live Session Opened');
            updateConnectionState(ConnectionState.CONNECTED);
            console.log('[Session] Connection state after update:', connectionStateRef.current);

            // Setup Input Streaming via AudioWorklet
            if (inputAudioContextRef.current && mediaStreamRef.current) {
              console.log('[Session] Setting up audio worklet...');
              const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
              const workletNode = new AudioWorkletNode(inputAudioContextRef.current, 'pcm-processor');
              console.log('[Session] Audio worklet node created');

              workletNode.port.onmessage = (e) => {
                // First check: If not connected, don't even process the message
                if (connectionStateRef.current !== ConnectionState.CONNECTED) {
                  return; // Early exit - don't process audio if not connected
                }
                
                const message = e.data;
                
                // Send audio data to Gemini - let Gemini handle VAD natively
                if (message.type === 'audio') {
                  const inputData = message.data as Float32Array;
                  const pcmBlob = createBlob(inputData);

                  if (sessionPromiseRef.current && connectionStateRef.current === ConnectionState.CONNECTED) {
                    sessionPromiseRef.current.then((session) => {
                      // Double-check connection state before sending
                      if (connectionStateRef.current === ConnectionState.CONNECTED) {
                        try {
                          session.sendRealtimeInput({ media: pcmBlob });
                        } catch (e: any) {
                          // Silently ignore if session is closing
                          if (!e.message?.includes('CLOSING') && !e.message?.includes('CLOSED')) {
                            console.warn('[Audio] Send error:', e);
                          }
                        }
                      }
                    }).catch(() => {
                      // Session promise rejected, ignore
                    });
                  }
                } else {
                  // Backward compatibility: if no type, treat as audio
                  const inputData = e.data as Float32Array;
                  const pcmBlob = createBlob(inputData);

                  if (sessionPromiseRef.current && connectionStateRef.current === ConnectionState.CONNECTED) {
                    sessionPromiseRef.current.then((session) => {
                      // Double-check connection state before sending
                      if (connectionStateRef.current === ConnectionState.CONNECTED) {
                        try {
                          session.sendRealtimeInput({ media: pcmBlob });
                        } catch (e: any) {
                          // Silently ignore if session is closing
                          if (!e.message?.includes('CLOSING') && !e.message?.includes('CLOSED')) {
                            console.warn('[Audio] Send error:', e);
                          }
                        }
                      }
                    }).catch(() => {
                      // Session promise rejected, ignore
                    });
                  }
                }
              };

              source.connect(workletNode);
              workletNode.connect(inputAudioContextRef.current.destination); // Connect to dest to keep active
              inputWorkletNodeRef.current = workletNode;
              console.log('[Session] Audio worklet fully connected and ready');
            } else {
              console.warn('[Session] Could not set up worklet - missing audio context or stream');
            }
            console.log('[Session] ========== ONOPEN COMPLETE ==========');
          },
          onmessage: async (message: LiveServerMessage) => {
            console.log('Raw Server Message:', JSON.stringify(message));


            // Handle Interruptions from Gemini (user started speaking)
            if (message.serverContent?.interrupted) {
              console.log('[Interrupt] Gemini detected user interruption - stopping playback');

              // 1. Stop current HTML5 audio playback immediately
              if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current.currentTime = 0;
                currentAudioRef.current = null;
              }
              
              // 2. Reset the playback audio context to stop all scheduled audio
              if (playbackAudioContextRef.current) {
                try {
                  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                  const oldContext = playbackAudioContextRef.current;
                  
                  // Create new context FIRST so we're ready for new audio
                  const newContext = new AudioContextClass();
                  playbackAudioContextRef.current = newContext;
                  
                  // Reset scheduling time for new context
                  nextPlayTimeRef.current = 0;
                  
                  // Then close old context (fire and forget)
                  if (oldContext.state !== 'closed') {
                    oldContext.close().catch(() => {});
                  }
                  
                  console.log('[Interrupt] Audio context reset successfully, new context state:', newContext.state);
                } catch (err) {
                  console.warn('[Interrupt] Error resetting audio context:', err);
                }
              }
              
              // 3. Clear all queues and buffers
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              ttsBufferRef.current = '';
              currentOutputTranscriptionRef.current = '';
              
              // 4. Update UI state
              setIsSynthesizing(false);
              updateBotSpeaking(false);

              // 5. Finalize pending UI message
              setMessages((prev) => {
                const newMsgs = [...prev];
                for (let i = newMsgs.length - 1; i >= 0; i--) {
                  if (newMsgs[i].role === 'model' && !newMsgs[i].isFinal) {
                    newMsgs[i] = { ...newMsgs[i], isFinal: true };
                    break;
                  }
                }
                return newMsgs;
              });
            }
            



            // Handle Tool Calls - Check both possible locations
            if (message.toolCall?.functionCalls) {
              // Handle new format: message.toolCall.functionCalls (array)
              for (const functionCall of message.toolCall.functionCalls) {
                const { name, args } = functionCall;
                console.log(`[Tool] Calling ${name} with args:`, args);

                let result: any = {};

                try {
                  if (name === "query_knowledge_base") {
                    const query = (args as any).query;
                    console.log(`[Tool] Querying RAG system for: ${query}`);
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    try {
                      const response = await fetch(`${API_BASE_URL}/api/kb/query?q=${encodeURIComponent(query)}`, {
                        signal: controller.signal
                      });
                      result = await response.json();
                    } finally {
                      clearTimeout(timeoutId);
                    }
                  }
                } catch (e) {
                  console.error("[Tool] Execution failed:", e);
                  result = { status: "error", message: "Failed to execute tool" };
                }

                console.log(`[Tool] Execution Result:`, result);

                // Convert result to plain text for Gemini Live API
                let responseText = '';
                if (name === "query_knowledge_base") {
                  responseText = result.context || "No specific information was found in the guidelines.";
                }

                // Send Tool Response
                if (sessionPromiseRef.current) {
                  console.log("[Tool] Sending response to Gemini:", responseText);
                  try {
                    const session = await sessionPromiseRef.current;
                    await session.sendToolResponse({
                      functionResponses: [{
                        id: functionCall.id,
                        name: name,  // Required by Gemini Live API
                        response: {
                          result: responseText
                        }
                      }]
                    });
                    console.log("[Tool] Response sent successfully!");
                  } catch (err) {
                    console.error("[Tool] Failed to send response:", err);
                  }
                } else {
                  console.error("[Tool] Session Promise is null!");
                }
              }
            }

            // Handle Gemini Native Audio (Low Latency)
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/pcm')) {
                  const pcmData = part.inlineData.data;
                  if (pcmData) {
                    updateBotSpeaking(true); // Bot is speaking
                    playPCMChunk(pcmData);
                  }
                }
              }
            }

            // Handle Transcription
            const outputTx = message.serverContent?.outputTranscription;
            // inputTx already checked above for product clearing

            if (outputTx?.text) {
              // Strip markdown to ensure clean TTS
              const textChunk = outputTx.text.replace(/[\*\[\]]/g, '');
              currentOutputTranscriptionRef.current += textChunk;
              addMessage('model', currentOutputTranscriptionRef.current, false);

              // Low Latency Streaming: Accumulate text and split by sentence
              ttsBufferRef.current += textChunk;

              // Aggressive streaming regex: Match sentence endings followed by whitespace OR end-of-string.
              const sentenceRegex = /(.+?[.!?])(?:\s+|$)/;
              const fallbackRegex = /(.+?[,;])(?:\s+|$)/;

              while (true) {
                let match = ttsBufferRef.current.match(sentenceRegex);

                // Safety valve: if buffer is too long (>50 chars), accept commas/semicolons to avoid stalling
                if (!match && ttsBufferRef.current.length > 50) {
                  match = ttsBufferRef.current.match(fallbackRegex);
                }

                if (match) {
                  const sentence = match[1].trim();
                  const fullMatchLength = match[0].length;
                  ttsBufferRef.current = ttsBufferRef.current.slice(fullMatchLength).trimStart();
                  // Sentence extracted - Gemini handles audio natively, no TTS needed
                } else {
                  break;
                }
              }
            }

            // Handle user input transcription (inputTxStart already used above for clearing products)
            if (inputTxStart?.text) {
              currentInputTranscriptionRef.current += inputTxStart.text;
              addMessage('user', currentInputTranscriptionRef.current, false);
            }

            // Handle Turn Complete
            if (message.serverContent?.turnComplete) {
              updateBotSpeaking(false); // Bot finished speaking
              
              // Finalize user message
              if (currentInputTranscriptionRef.current) {
                addMessage('user', currentInputTranscriptionRef.current, true);
                currentInputTranscriptionRef.current = '';
              }
              // Finalize model message
              if (currentOutputTranscriptionRef.current) {
                addMessage('model', currentOutputTranscriptionRef.current, true);
                currentOutputTranscriptionRef.current = '';
              }

              // Clear buffer - Gemini handles audio natively
              ttsBufferRef.current = '';
            }
          },
          onclose: (event) => {
            console.log('[Session] ========== ONCLOSE FIRED ==========');
            console.log('[Session] Close event:', event);
            console.log('[Session] Close code:', event?.code);
            console.log('[Session] Close reason:', event?.reason || '(no reason provided)');
            console.log('[Session] Close wasClean:', event?.wasClean);
            console.log('[Session] Connection state at close:', connectionStateRef.current);
            
            // Stop worklet immediately
            if (inputWorkletNodeRef.current) {
              console.log('[Session] Disconnecting worklet due to session close');
              try {
                inputWorkletNodeRef.current.disconnect();
                inputWorkletNodeRef.current = null;
              } catch (e) {
                console.warn('[Session Close] Worklet disconnect error:', e);
              }
            }
            
            updateConnectionState(ConnectionState.DISCONNECTED);
            setIsSynthesizing(false);
            console.log('[Session] ========== ONCLOSE COMPLETE ==========');
          },
          onerror: (err) => {
            console.log('[Session] ========== ONERROR FIRED ==========');
            console.error('[Session] Error details:', err);
            console.error('[Session] Error message:', err.message);
            console.error('[Session] Error type:', err.type);
            console.error('[Session] Error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
            
            // Stop worklet on error
            if (inputWorkletNodeRef.current) {
              console.log('[Session] Disconnecting worklet due to error');
              try {
                inputWorkletNodeRef.current.disconnect();
                inputWorkletNodeRef.current = null;
              } catch (e) {
                console.warn('[Session Error] Worklet disconnect error:', e);
              }
            }
            
            setError(`Connection error: ${err.message || 'Unknown error'}`);
            updateConnectionState(ConnectionState.ERROR);
            setIsSynthesizing(false);
            console.log('[Session] ========== ONERROR COMPLETE ==========');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Kore"
              }
            }
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: tools, // Add tools here
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        }
      });

      console.log('[Connect] Session promise created, storing reference...');
      sessionPromiseRef.current = sessionPromise;
      console.log('[Connect] Waiting for session to connect...');

    } catch (e: any) {
      console.error('[Connect] ========== CONNECTION FAILED ==========');
      console.error(e);
      console.error('[Connect] Error message:', e.message);
      console.error('[Connect] Error stack:', e.stack);
      updateConnectionState(ConnectionState.ERROR);
      setError(`Failed to initialize: ${e.message}`);
      setIsSynthesizing(false);
    }
  };

  const disconnect = () => {
    console.log('[Disconnect] Called - isMountedRef:', isMountedRef.current, 'isDisconnectingRef:', isDisconnectingRef.current);
    
    // Prevent multiple simultaneous disconnect calls
    if (isDisconnectingRef.current) {
      console.log('[Disconnect] Already disconnecting, skipping...');
      return;
    }
    
    // Allow disconnect even if unmounted (for cleanup)
    // but log it for debugging
    if (!isMountedRef.current) {
      console.log('[Disconnect] Component unmounted, proceeding with cleanup...');
    }
    
    isDisconnectingRef.current = true;
    console.log('[Disconnect] Starting cleanup...');
    
    // 1. Close session first (stops any incoming audio)
    if (sessionPromiseRef.current) {
      const sessionPromise = sessionPromiseRef.current;
      sessionPromiseRef.current = null; // Clear reference first to prevent multiple calls
      
      sessionPromise.then(session => {
        try {
          // Check if session is still open before closing
          if (session && typeof session.close === 'function') {
            session.close();
          }
        } catch (e: any) {
          // Silently ignore if already closed
          if (e.message && !e.message.includes('CLOSING') && !e.message.includes('CLOSED')) {
            console.warn('[Disconnect] Session close error:', e);
          }
        }
      }).catch((e: any) => {
        if (e.message && !e.message.includes('CLOSING') && !e.message.includes('CLOSED')) {
          console.warn('[Disconnect] Session promise error:', e);
        }
      });
    }

    // 2. Stop and disconnect input worklet
    if (inputWorkletNodeRef.current) {
      try {
        inputWorkletNodeRef.current.disconnect();
      } catch (e) {
        console.warn('[Disconnect] Worklet disconnect error:', e);
      }
      inputWorkletNodeRef.current = null;
    }

    // 3. Stop media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }

    // 4. Close input audio context
    if (inputAudioContextRef.current) {
      try {
        if (inputAudioContextRef.current.state !== 'closed') {
          inputAudioContextRef.current.close();
        }
      } catch (e) {
        console.warn('[Disconnect] Input context close error:', e);
      }
      inputAudioContextRef.current = null;
    }

    // 5. Close playback audio context
    if (playbackAudioContextRef.current) {
      try {
        if (playbackAudioContextRef.current.state !== 'closed') {
          playbackAudioContextRef.current.close();
        }
      } catch (e) {
        console.warn('[Disconnect] Playback context close error:', e);
      }
      playbackAudioContextRef.current = null;
    }

    // 6. Stop any current HTML5 audio playback
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';
      } catch (e) {
        console.warn('[Disconnect] Audio element cleanup error:', e);
      }
      currentAudioRef.current = null;
    }

    // 7. Clear audio queue and buffers
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    ttsBufferRef.current = '';
    nextPlayTimeRef.current = 0;

    // 8. Clear transcription buffers
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';

    console.log('[Disconnect] Cleanup complete');
    updateConnectionState(ConnectionState.DISCONNECTED);
    setIsSynthesizing(false);
    
    // Reset disconnecting flag after a short delay
    setTimeout(() => {
      isDisconnectingRef.current = false;
    }, 500);
  };

  const handleToggleConnection = () => {
    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-charcoal-900 text-white font-sans overflow-hidden">
      {/* Light Rays Background Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-50">
        <LightRays
          raysOrigin="top-center"
          raysColor="#fa5252"
          raysSpeed={0.6}
          lightSpread={0.2}
          rayLength={0.9}
          fadeDistance={0.6}
          saturation={1.0}
          followMouse={true}
          mouseInfluence={0.25}
          noiseAmount={0.03}
          distortion={0.01}
          pulsating={false}
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-3 border-b border-white/5 backdrop-blur-xl bg-charcoal-900/50">
        <div 
          className="flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-copper-400 to-copper-600 flex items-center justify-center shadow-lg shadow-copper-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
              <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
              <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
            </svg>
          </div>
          <div>
            <h1 className="font-semibold text-base tracking-tight text-white font-heading">KaaliganAI</h1>
            <p className="text-[10px] text-copper-400/70">Voice agent</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Document Uploader */}
          <div className="flex items-center gap-2 relative">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".txt,.pdf" 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadState === 'uploading'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-300 ${
                uploadState === 'uploading'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 cursor-not-allowed animate-pulse'
                  : uploadState === 'success'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : uploadState === 'error'
                      ? 'bg-red-500/20 border-red-500/40 text-red-400'
                      : 'bg-charcoal-800/40 border-charcoal-700/50 text-copper-300/80 hover:bg-charcoal-700/60 hover:text-white cursor-pointer'
              }`}
            >
              {uploadState === 'uploading' ? (
                <>
                  <svg className="animate-spin w-3 h-3 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Ingesting...</span>
                </>
              ) : uploadState === 'success' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Ingested!</span>
                </>
              ) : uploadState === 'error' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <span>Failed</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                  <span>Upload PDF/TXT</span>
                </>
              )}
            </button>
            {uploadMessage && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-charcoal-900/95 border border-charcoal-700/80 rounded-lg p-2 text-[10px] text-copper-300 shadow-xl z-50 animate-fade-in backdrop-blur-md">
                {uploadMessage}
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-charcoal-800/50 border border-charcoal-700/50">
            <span className={`w-2 h-2 rounded-full ${
              connectionState === ConnectionState.CONNECTED 
                ? 'bg-copper-400 shadow-lg shadow-copper-400/50 animate-pulse' 
                : connectionState === ConnectionState.CONNECTING
                  ? 'bg-copper-500 animate-pulse'
                  : 'bg-charcoal-700'
            }`} />
            <span className="text-xs font-medium text-copper-300/70 uppercase tracking-wider">
              {connectionState === ConnectionState.CONNECTED ? 'Live' : connectionState === ConnectionState.CONNECTING ? 'Connecting' : 'Offline'}
            </span>
          </div>
        </div>
      </header>



      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Top Section - Voice Orb with Context */}
        <div className="flex-shrink-0 h-[55%] flex flex-col items-center justify-center relative px-8 pt-4">
          {/* Decorative rings around orb */}
          <div className="absolute w-[340px] h-[340px] rounded-full border border-copper-500/10 animate-pulse-slow" />
          <div className="absolute w-[380px] h-[380px] rounded-full border border-copper-500/5" />
          
          {/* Glow Effects Behind Orb - Simplified on mobile */}
          {!isMobile && (
            <div className={`absolute w-72 h-72 rounded-full transition-all duration-700 ${
              connectionState === ConnectionState.CONNECTED 
                ? 'bg-copper-500/25 blur-3xl scale-110' 
                : 'bg-copper-500/10 blur-2xl scale-100'
            }`} />
          )}

          {/* Voice Powered Orb - Clickable with mic icon */}
          <button 
            onClick={handleToggleConnection}
            className="w-80 h-80 relative cursor-pointer group"
          >
            <VoicePoweredOrb 
              enableVoiceControl={connectionState === ConnectionState.CONNECTED && !isMobile}
              voiceSensitivity={isMobile ? 1.0 : 2.0}
              maxRotationSpeed={isMobile ? 0.5 : 1.5}
              maxHoverIntensity={isMobile ? 0.3 : 0.9}
              className="rounded-full overflow-hidden"
            />
            
            {/* Mic Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`transition-all duration-500 ${
                connectionState === ConnectionState.CONNECTED 
                  ? 'opacity-30 scale-90' 
                  : connectionState === ConnectionState.CONNECTING
                    ? 'opacity-50 scale-95 animate-pulse'
                    : 'opacity-60 group-hover:opacity-80 group-hover:scale-110'
              }`}>
                {connectionState === ConnectionState.CONNECTING ? (
                  <svg className="animate-spin w-16 h-16 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : connectionState === ConnectionState.CONNECTED ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14 text-white drop-shadow-lg">
                    <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                    <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-white drop-shadow-2xl">
                    <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                    <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                  </svg>
                )}
              </div>
            </div>
          </button>

          {/* Status Text - Below the orb */}
          <div className="mt-4 text-center">
            <p className={`text-base font-medium transition-colors font-heading ${
              connectionState === ConnectionState.CONNECTED 
                ? isBotSpeaking ? 'text-cyan-400' : 'text-copper-400/80'
                : 'text-copper-500/50'
            }`}>
              {connectionState === ConnectionState.CONNECTED 
                ? isBotSpeaking ? 'Speaking...' : 'Listening...'
                : connectionState === ConnectionState.CONNECTING 
                  ? 'Connecting...' 
                  : 'Ready to assist'}
            </p>
            <p className="text-[11px] text-copper-500/60 mt-1">
              {connectionState === ConnectionState.CONNECTED 
                ? 'Speak naturally, I\'m here to help'
                : 'Click the orb to start'}
            </p>
          </div>
        </div>



        {/* Bottom Section - Chat Window */}
        <div className="flex-1 flex flex-col overflow-hidden mx-6 mb-4 rounded-2xl bg-charcoal-800/20 backdrop-blur-sm">
          {/* Chat Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-charcoal-700/20">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-copper-500/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-copper-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-copper-300/80">Conversation Transcript</span>
              {messages.length > 0 && (
                <span className="text-[10px] text-charcoal-700 bg-charcoal-800 px-1.5 py-0.5 rounded-full">{messages.length}</span>
              )}
            </div>
            {messages.length > 0 && (
              <button 
                onClick={() => setMessages([])}
                className="text-[10px] text-copper-500/50 hover:text-copper-400 transition-colors px-2 py-1 rounded hover:bg-charcoal-800/50"
              >
                Clear
              </button>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-charcoal-700 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-charcoal-800/50 flex items-center justify-center border border-charcoal-700/30">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-6 h-6 text-copper-500/30">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-xs text-copper-500/40">No messages yet</p>
                  <p className="text-[10px] text-charcoal-700 mt-1">Start a conversation to see the transcript</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-copper-500 to-copper-600 text-white rounded-br-sm'
                        : 'bg-cyan-500/60 text-white rounded-bl-sm'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[9px] uppercase tracking-wider font-semibold ${
                        msg.role === 'user' ? 'text-copper-200' : 'text-cyan-100'
                      }`}>
                        {msg.role === 'user' ? 'You' : 'KaaliganAI'}
                      </span>
                      {!msg.isFinal && (
                        <span className="flex gap-0.5">
                          <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                          <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Error Banner */}
      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-80 bg-red-900/90 border border-red-700/50 text-red-100 px-4 py-3 rounded-xl shadow-lg text-sm z-50 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="font-medium text-xs">Connection Error</p>
              <p className="text-red-200 text-[10px] mt-0.5">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-300 hover:text-white transition-colors ml-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}


    </div>
  );
};

export default AgentInterface;
