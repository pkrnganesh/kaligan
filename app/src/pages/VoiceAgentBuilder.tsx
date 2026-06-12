import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import * as I from "../components/icons";
import { api } from "../lib/api";
import { Orb } from "../components/voice/Orb";
import { useLiveSession, ConnectionState } from "../lib/voice/useLiveSession";

const voices = [
  { id: "aria", name: "Aria", desc: "warm, friendly", g: "♀" },
  { id: "ravi", name: "Ravi", desc: "calm, professional", g: "♂" },
  { id: "maya", name: "Maya", desc: "upbeat, energetic", g: "♀" },
];
const goals = [
  { id: "qualify", label: "Qualify leads", sub: "capture & score", icon: <I.Users width={20} height={20} /> },
  { id: "book", label: "Book a call", sub: "schedule", icon: <I.Chat width={20} height={20} /> },
  { id: "answer", label: "Answer Qs", sub: "support", icon: <I.Chat width={20} height={20} /> },
];

function Section({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="card p-[22px] fadeup">
      <h3 className="flex items-center gap-2.5 font-display text-base font-bold mb-1">
        <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 grid place-items-center">{icon}</span>{title}
      </h3>
      <p className="text-ink-muted text-[13px] mb-4">{hint}</p>
      {children}
    </section>
  );
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-[38px] h-[22px] rounded-full relative transition ${on ? "bg-emerald-600" : "bg-mint-300"}`}>
      <i className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

export default function VoiceAgentBuilder() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live session hook
  const {
    connectionState,
    messages,
    error: sessionError,
    isBotSpeaking,
    microphoneLevel,
    startSession,
    disconnect,
  } = useLiveSession();

  const [orbVoiceLevel, setOrbVoiceLevel] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchAgent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/agents/${id}`);
      setAgent(data);
      const docs = await api.get('/kb/documents');
      setDocuments(docs || []);
    } catch (err: any) {
      setError(err.message || "Failed to load agent");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  // Drive orb voice level animation when bot is speaking
  useEffect(() => {
    let interval: any;
    if (isBotSpeaking) {
      interval = setInterval(() => {
        setOrbVoiceLevel(0.15 + 0.45 * Math.sin(Date.now() / 80) * Math.random());
      }, 50);
    } else {
      setOrbVoiceLevel(microphoneLevel);
    }
    return () => clearInterval(interval);
  }, [isBotSpeaking, microphoneLevel]);

  // Scroll to bottom of transcripts automatically
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateField = (key: string, val: any) => {
    setAgent((prev: any) => {
      if (!prev) return prev;
      return { ...prev, [key]: val };
    });
  };

  const handleSave = async (publish = false) => {
    if (!agent) return;
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const updated = await api.patch(`/agents/${agent.id}`, {
        name: agent.name,
        persona: agent.persona,
        greeting: agent.greeting,
        goal: agent.goal,
        voiceName: agent.voiceName,
        language: agent.language,
        speakingSpeed: agent.speakingSpeed,
        channels: agent.channels,
        connectedKbDocumentIds: agent.connectedKbDocumentIds,
        status: publish ? 'live' : agent.status,
      });
      setAgent(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save agent updates");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!agent) return;
    const newStatus = agent.status === 'live' ? 'draft' : 'live';
    updateField('status', newStatus);
    setSaving(true);
    try {
      const updated = await api.patch(`/agents/${agent.id}`, { status: newStatus });
      setAgent(updated);
    } catch (err: any) {
      setError(err.message || "Failed to update agent status");
    } finally {
      setSaving(false);
    }
  };

  const toggleDocConnection = (docId: string) => {
    if (!agent) return;
    const currentIds = Array.isArray(agent.connectedKbDocumentIds)
      ? [...agent.connectedKbDocumentIds]
      : typeof agent.connectedKbDocumentIds === 'string'
        ? JSON.parse(agent.connectedKbDocumentIds)
        : [];
    const index = currentIds.indexOf(docId);
    if (index > -1) {
      currentIds.splice(index, 1);
    } else {
      currentIds.push(docId);
    }
    updateField('connectedKbDocumentIds', currentIds);
  };

  const toggleWebChannel = () => {
    if (!agent) return;
    const currentChannels = typeof agent.channels === 'string' ? JSON.parse(agent.channels) : agent.channels;
    const updatedChannels = { ...currentChannels, web: !currentChannels.web };
    updateField('channels', updatedChannels);
  };

  const handleTalkToggle = () => {
    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) {
      disconnect();
    } else {
      startSession(id!);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald border-t-transparent"></div>
      </div>
    );
  }

  if (error && !agent) {
    return (
      <div className="p-8 text-center text-error">
        <p>{error}</p>
        <button onClick={fetchAgent} className="btn btn-primary mt-4">Retry</button>
      </div>
    );
  }

  const channelsObj = typeof agent?.channels === 'string' ? JSON.parse(agent.channels) : agent?.channels || { web: true, phone: false };

  const activeConnectedKbDocIds = Array.isArray(agent.connectedKbDocumentIds)
    ? agent.connectedKbDocumentIds
    : typeof agent.connectedKbDocumentIds === 'string'
      ? JSON.parse(agent.connectedKbDocumentIds)
      : [];

  return (
    <>
      {/* top bar */}
      <div className="flex items-center gap-3.5 -mt-1 mb-6 fadeup">
        <div className="flex items-center gap-2.5 text-ink-muted text-[13.5px] font-semibold">
          <Link to="/app/voice" className="hover:text-ink">Voice Agents</Link>
          <I.Chevron className="rotate-[-90deg]" width={14} height={14} />
          <span className="text-ink">{agent.name}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {saveSuccess && <span className="text-success text-xs font-semibold">✓ Saved</span>}
          {error && <span className="text-error text-xs font-semibold">⚠ {error}</span>}
          <div className="flex items-center gap-2.5 bg-surface border border-line rounded-full pl-3.5 pr-1.5 py-1 text-[13px] font-semibold">
            {agent.status === 'live' ? "Live" : "Draft"} <Switch on={agent.status === 'live'} onClick={toggleStatus} />
          </div>
          <button onClick={() => handleSave(false)} disabled={saving} className="btn btn-ghost">
            Save Draft
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} className="btn btn-primary">
            <I.ArrowRight width={15} height={15} /> Publish agent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_372px] gap-5 items-start" style={{ gap: 22 }}>
        {/* LEFT */}
        <div className="flex flex-col gap-[18px] min-w-0">
          <Section icon={<I.Mic width={16} height={16} />} title="Identity & voice" hint="Give your agent a name and pick how it sounds. Tap a voice to preview.">
            <label className="field-label">Agent name</label>
            <input className="input" value={agent.name || ""} onChange={(e) => updateField('name', e.target.value)} />
            
            <label className="field-label mt-4">Voice</label>
            <div className="grid grid-cols-3 gap-2.5">
              {voices.map((v) => (
                <button
                  key={v.id}
                  onClick={() => updateField('voiceName', v.id)}
                  className={`border-[1.5px] rounded-2xl p-3.5 text-left transition ${
                    (agent.voiceName || "aria") === v.id ? "border-emerald-600 bg-emerald-50" : "border-line hover:border-mint-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${(agent.voiceName || "aria") === v.id ? "text-emerald-700" : "text-ink-muted"}`}>{v.g} {v.name}</span>
                    <span className={`w-[30px] h-[30px] rounded-full grid place-items-center border ${(agent.voiceName || "aria") === v.id ? "bg-emerald-600 text-white border-emerald-600" : "bg-surface text-emerald-600 border-line"}`}><I.Play /></span>
                  </div>
                  <b className="block text-sm font-semibold mt-2">{v.name}</b>
                  <small className="text-ink-muted text-xs">{v.desc}</small>
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-3.5 mt-4">
              <div>
                <label className="field-label">Language</label>
                <select className="input" value={agent.language || "en-US"} onChange={(e) => updateField('language', e.target.value)}>
                  <option value="en-US">English (US)</option>
                  <option value="en-IN">English (India)</option>
                  <option value="hi-IN">Hindi</option>
                  <option value="te-IN">Telugu</option>
                  <option value="es-ES">Spanish</option>
                </select>
              </div>
              <div>
                <label className="field-label">Speaking speed</label>
                <select className="input" value={agent.speakingSpeed || "natural"} onChange={(e) => updateField('speakingSpeed', e.target.value)}>
                  <option value="natural">Natural</option>
                  <option value="slow">Slightly slower</option>
                  <option value="fast">Slightly faster</option>
                </select>
              </div>
            </div>
          </Section>

          <Section icon={<I.Book width={16} height={16} />} title="Connected knowledge" hint="Choose which knowledge documents this voice agent has access to. Only selected sources will be used during calls.">
            <div className="space-y-2.5">
              {documents.filter(d => d.status === 'ready' || d.status === 'processing').map((d) => {
                const isChecked = activeConnectedKbDocIds.includes(d.id);
                return (
                  <label key={d.id} className="flex items-center justify-between border border-line hover:border-mint-300 rounded-xl p-3.5 hover:bg-surface-2 transition cursor-pointer">
                    <span className="flex items-center gap-2.5 text-sm font-semibold">
                      <span className={`w-2 h-2 rounded-full ${d.status === 'ready' ? 'bg-success' : 'bg-warning animate-pulse'}`} />
                      {d.type === 'PDF' ? '📄' : d.type === 'FAQ' ? '❓' : '🔗'} {d.name}
                    </span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDocConnection(d.id)}
                      className="w-4.5 h-4.5 accent-emerald-600"
                    />
                  </label>
                );
              })}
              {documents.length === 0 && (
                <div className="text-ink-muted text-[13.5px] py-2">No documents found. Visit the Knowledge page to upload documents.</div>
              )}
            </div>
            <div className="mt-4 pt-3.5 border-t border-line flex justify-between items-center">
              <span className="text-xs text-ink-muted">{activeConnectedKbDocIds.length} of {documents.length} sources selected</span>
              <Link to="/app/knowledge" className="text-emerald-700 text-xs font-bold hover:underline">
                + Manage sources
              </Link>
            </div>
          </Section>

          <Section icon={<I.Sparkle width={15} height={15} />} title="Goal & personality" hint="What should every call try to achieve?">
            <div className="grid grid-cols-3 gap-2.5">
              {goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => updateField('goal', g.id)}
                  className={`border-[1.5px] rounded-[13px] p-3 text-center transition ${
                    agent.goal === g.id ? "border-emerald-600 bg-emerald-50" : "border-line hover:border-mint-300"
                  }`}
                >
                  <div className="text-emerald-600 mb-1.5 grid place-items-center">{g.icon}</div>
                  <b className="text-[13.5px] font-semibold block">{g.label}</b>
                  <small className="text-[11.5px] text-ink-muted">{g.sub}</small>
                </button>
              ))}
            </div>
            
            <label className="field-label mt-4">Greeting</label>
            <textarea
              className="input min-h-[74px] resize-y"
              value={agent.greeting || ""}
              onChange={(e) => updateField('greeting', e.target.value)}
            />
            
            <label className="field-label mt-4">Personality</label>
            <div className="grid grid-cols-3 gap-2.5">
              {["Friendly", "Professional", "Concise"].map((p) => (
                <button
                  key={p}
                  onClick={() => updateField('persona', p)}
                  className={`border-[1.5px] rounded-[13px] p-3 text-center transition ${
                    agent.persona === p ? "border-emerald-600 bg-emerald-50" : "border-line hover:border-mint-300"
                  }`}
                >
                  <b className="text-[13.5px] font-semibold">{p}</b>
                </button>
              ))}
            </div>
          </Section>

          <Section icon={<I.Phone width={16} height={16} />} title="Where it answers" hint="Turn on the channels your callers will use.">
            <div className="flex items-center gap-3.5 py-3.5">
              <span className="w-[38px] h-[38px] rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0"><I.Mic width={18} height={18} /></span>
              <span className="flex-1">
                <b className="text-sm font-semibold">Web voice button</b>
                <small className="block text-ink-muted text-[12.5px]">A “talk to us” mic button on your website</small>
              </span>
              <Switch on={channelsObj.web} onClick={toggleWebChannel} />
            </div>
            <div className="flex items-center gap-3.5 py-3.5 border-t border-line">
              <span className="w-[38px] h-[38px] rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0"><I.Phone width={18} height={18} /></span>
              <span className="flex-1">
                <b className="text-sm font-semibold">Phone number</b>
                <small className="block text-ink-muted text-[12.5px]">A real number callers can dial (Add-on)</small>
              </span>
              <span className="font-display font-semibold text-sm bg-surface-2 border border-line rounded-lg px-3 py-1.5">+1 (415) 555‑0142</span>
            </div>
          </Section>
        </div>

        {/* RIGHT: test call */}
        <div className="sticky flex flex-col gap-4" style={{ top: 96 }}>
          <div className="rounded-[20px] p-[22px] pt-6 text-white shadow-lift relative overflow-hidden" style={{ background: "linear-gradient(165deg,#0E7A5F,#0B5A45)" }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(120px 120px at 80% 12%,rgba(95,201,176,.35),transparent 70%)" }} />
            <h4 className="font-display text-[15px] font-bold flex items-center gap-2"><I.Sparkle width={15} height={15} fill="#CFF3E6" /> Test your agent</h4>
            <div className="text-[12.5px] opacity-80 mt-1">Talk to it right now — this is exactly what callers hear.</div>
            
            {/* Visual WebGL Orb */}
            <div className="relative w-32 h-32 mx-auto my-5 grid place-items-center bg-emerald-950/40 rounded-full border border-emerald-800/50">
              <Orb
                className="w-28 h-28"
                voiceLevel={connectionState === ConnectionState.CONNECTED ? orbVoiceLevel : undefined}
                enableVoiceControl={false}
              />
            </div>
            
            <div className="flex gap-2.5 mt-2">
              <button
                onClick={handleTalkToggle}
                className={`btn flex-1 bg-white font-semibold ${
                  connectionState === ConnectionState.CONNECTED ? "text-error hover:bg-red-50" : "text-emerald-700 hover:bg-[#eafaf3]"
                }`}
              >
                <I.Mic width={15} height={15} />
                {connectionState === ConnectionState.CONNECTED ? "Stop talking" : connectionState === ConnectionState.CONNECTING ? "Connecting..." : "Talk now"}
              </button>
              <button className="btn flex-1 text-white border border-white/30 cursor-not-allowed opacity-55" style={{ background: "rgba(255,255,255,.16)" }} disabled>
                <I.Phone width={15} height={15} /> Call me
              </button>
            </div>
            
            {sessionError && (
              <div className="text-[11px] text-red-200 text-center mt-2.5 font-medium">⚠ {sessionError}</div>
            )}
            
            <div className="text-[11px] opacity-80 text-center mt-3.5">Avg. response latency ~0.8s · powered by your knowledge base</div>
          </div>

          <div className="card p-4">
            <div className="text-[11px] font-bold tracking-wider uppercase text-ink-muted mb-3">Live transcript</div>
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <div className="text-[13px] text-ink-muted text-center py-6">No transcript yet. Tap "Talk now" to start.</div>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className={`text-[13px] leading-snug flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="text-[10.5px] font-bold tracking-wide uppercase text-ink-muted mb-1">
                      {m.role === 'user' ? 'Caller' : (agent.name || 'Agent')} {!m.isFinal && <span className="animate-pulse">...</span>}
                    </div>
                    <div className={`px-3 py-2.5 rounded-xl text-[13px] ${
                      m.role === 'user' 
                        ? "bg-surface-2 border border-line rounded-br-[3px] text-left inline-block" 
                        : "bg-emerald-50 border border-mint-300 rounded-bl-[3px] text-left inline-block"
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
