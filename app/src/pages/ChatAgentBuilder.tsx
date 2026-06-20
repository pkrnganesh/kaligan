import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import * as I from "../components/icons";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

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

export default function ChatAgentBuilder() {
  const { id } = useParams<{ id: string }>();
  const { workspace } = useAuth();
  const [agent, setAgent] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat Preview state
  const [previewMsgs, setPreviewMsgs] = useState<{ role: string; content: string }[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedFloating, setCopiedFloating] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);

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

  // Re-initialize preview chat when agent greeting or name changes
  useEffect(() => {
    if (agent) {
      setPreviewMsgs([
        {
          role: "agent",
          content: agent.greeting || `Hi! I'm ${agent.name} 👋 How can I help you today?`,
        },
      ]);
    }
  }, [agent?.greeting, agent?.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [previewMsgs]);

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
      let updated;
      if (publish) {
        // Save the fields as draft first, then publish it
        await api.patch(`/agents/${agent.id}`, {
          name: agent.name,
          persona: agent.persona,
          greeting: agent.greeting,
          goal: agent.goal,
          connectedKbDocumentIds: agent.connectedKbDocumentIds,
          captureFields: agent.captureFields,
        });
        updated = await api.post(`/agents/${agent.id}/publish`);
      } else {
        updated = await api.patch(`/agents/${agent.id}`, {
          name: agent.name,
          persona: agent.persona,
          greeting: agent.greeting,
          goal: agent.goal,
          connectedKbDocumentIds: agent.connectedKbDocumentIds,
          captureFields: agent.captureFields,
        });
      }
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
      let updated;
      if (newStatus === 'live') {
        updated = await api.post(`/agents/${agent.id}/publish`);
      } else {
        updated = await api.patch(`/agents/${agent.id}`, { status: newStatus });
      }
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

  const toggleCaptureField = (field: string) => {
    if (!agent) return;
    const currentFields = Array.isArray(agent.captureFields) ? [...agent.captureFields] : [];
    const index = currentFields.indexOf(field);
    if (index > -1) {
      currentFields.splice(index, 1);
    } else {
      currentFields.push(field);
    }
    updateField('captureFields', currentFields);
  };

  const handleSendPreviewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || sending || !agent) return;

    const userMessage = inputMsg.trim();
    setInputMsg("");
    setSending(true);

    const updatedMsgs = [...previewMsgs, { role: "visitor", content: userMessage }];
    setPreviewMsgs(updatedMsgs);

    try {
      // Map history omitting the first greeting message
      const history = updatedMsgs.slice(1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.post("/chat/preview", {
        agentId: agent.id,
        message: userMessage,
        history,
      });

      setPreviewMsgs((prev) => [...prev, { role: "agent", content: res.reply }]);
    } catch (err: any) {
      setPreviewMsgs((prev) => [
        ...prev,
        { role: "agent", content: "Error: Failed to fetch live agent response. Make sure model is configured." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleResetPreview = () => {
    if (agent) {
      setPreviewMsgs([
        {
          role: "agent",
          content: agent.greeting || `Hi! I'm ${agent.name} 👋 How can I help you today?`,
        },
      ]);
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

  const activeConnectedKbDocIds = Array.isArray(agent.connectedKbDocumentIds)
    ? agent.connectedKbDocumentIds
    : typeof agent.connectedKbDocumentIds === 'string'
      ? JSON.parse(agent.connectedKbDocumentIds)
      : [];

  const captureFields = Array.isArray(agent.captureFields) ? agent.captureFields : [];

  // Integration snippets
  const floatingSnippet = `<script src="${window.location.origin}/w.js" data-key="${workspace?.publicKey || ""}" data-agent="${agent.id}"></script>`;
  const iframeSnippet = `<iframe src="${window.location.origin}/w-frame.html?key=${workspace?.publicKey || ""}&agent=${agent.id}" width="100%" height="600" style="border:none; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1);"></iframe>`;

  const copyFloating = () => {
    navigator.clipboard?.writeText(floatingSnippet);
    setCopiedFloating(true);
    setTimeout(() => setCopiedFloating(false), 1800);
  };

  const copyIframe = () => {
    navigator.clipboard?.writeText(iframeSnippet);
    setCopiedIframe(true);
    setTimeout(() => setCopiedIframe(false), 1800);
  };

  return (
    <>
      {/* top bar */}
      <div className="flex items-center gap-3.5 -mt-1 mb-6 fadeup">
        <div className="flex items-center gap-2.5 text-ink-muted text-[13.5px] font-semibold">
          <Link to="/app/chat-agent" className="hover:text-ink">Chat Agents</Link>
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
        {/* LEFT CONFIGURATION RAIL */}
        <div className="flex flex-col gap-[18px] min-w-0">
          {/* Identity & Personality */}
          <Section icon={<I.Bot width={16} height={16} />} title="Identity & Personality" hint="Set the name, greeting message, and persona type of your chat assistant.">
            <label className="field-label">Agent name</label>
            <input className="input" value={agent.name || ""} onChange={(e) => updateField('name', e.target.value)} />
            
            <label className="field-label mt-4">Greeting message</label>
            <textarea
              className="input min-h-[74px] resize-y"
              value={agent.greeting || ""}
              onChange={(e) => updateField('greeting', e.target.value)}
            />
            
            <label className="field-label mt-4">Personality type</label>
            <div className="grid grid-cols-4 gap-2.5">
              {["Friendly", "Professional", "Concise", "Enthusiastic"].map((p) => (
                <button
                  key={p}
                  onClick={() => updateField('persona', p)}
                  className={`border-[1.5px] rounded-[13px] p-3 text-center transition ${
                    agent.persona === p ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold" : "border-line hover:border-mint-300"
                  }`}
                >
                  <span className="text-[13px]">{p}</span>
                </button>
              ))}
            </div>

            <label className="field-label mt-4">Primary Goal</label>
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { id: "support", label: "Support" },
                { id: "qualify", label: "Qualify" },
                { id: "sales", label: "Sales" },
                { id: "general", label: "General" }
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => updateField('goal', g.id)}
                  className={`border-[1.5px] rounded-[13px] p-3 text-center transition ${
                    agent.goal === g.id ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold" : "border-line hover:border-mint-300"
                  }`}
                >
                  <span className="text-[13px]">{g.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Connected Knowledge */}
          <Section icon={<I.Book width={16} height={16} />} title="Connected Knowledge" hint="Choose which knowledge documents this specific agent has access to. Restricts context for RAG boundary.">
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

          {/* Lead Qualification */}
          <Section icon={<I.Users width={16} height={16} />} title="Lead Qualification" hint="Fields to capture when visitor exhibits high intent during chat conversation.">
            <div className="space-y-1">
              {["name", "email", "phone"].map((f) => {
                const isChecked = captureFields.includes(f);
                return (
                  <label key={f} className="flex items-center justify-between py-3 border-t border-line text-[14px] cursor-pointer hover:bg-surface-2 px-1 transition rounded">
                    <span className="capitalize font-semibold">{f}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCaptureField(f)}
                      className="w-4 h-4 accent-emerald-600"
                    />
                  </label>
                );
              })}
            </div>
          </Section>

          {/* Integration & Embed Snippets */}
          <Section icon={<I.Code width={16} height={16} />} title="Embed & Integration" hint="Integrate this specific assistant directly on your website using a script or an inline iframe.">
            <div className="space-y-4">
              {/* Standard Widget */}
              <div>
                <label className="field-label flex justify-between items-center">
                  <span>Standard Floating Chat Widget</span>
                  <button onClick={copyFloating} className={`text-xs font-bold hover:underline ${copiedFloating ? "text-success" : "text-emerald-700"}`}>
                    {copiedFloating ? "✓ Copied" : "📋 Copy code"}
                  </button>
                </label>
                <code className="block bg-ink text-mint-100 text-[12px] rounded-xl px-4 py-3 font-mono overflow-x-auto select-all leading-relaxed whitespace-pre mt-1.5">
                  {floatingSnippet}
                </code>
              </div>

              {/* Inline Iframe */}
              <div className="border-t border-line pt-4">
                <label className="field-label flex justify-between items-center">
                  <span>Inline Iframe Widget (Embed in page)</span>
                  <button onClick={copyIframe} className={`text-xs font-bold hover:underline ${copiedIframe ? "text-success" : "text-emerald-700"}`}>
                    {copiedIframe ? "✓ Copied" : "📋 Copy code"}
                  </button>
                </label>
                <code className="block bg-ink text-mint-100 text-[12px] rounded-xl px-4 py-3 font-mono overflow-x-auto select-all leading-relaxed whitespace-pre mt-1.5">
                  {iframeSnippet}
                </code>
              </div>
            </div>
          </Section>
        </div>

        {/* RIGHT RAIL: TEST CHAT PANEL */}
        <div className="sticky flex flex-col gap-4" style={{ top: 96 }}>
          <div className="card p-[22px] flex flex-col h-[560px]">
            <div className="flex items-center justify-between border-b border-line pb-3.5 mb-3.5 shrink-0">
              <div>
                <h4 className="font-display text-[15px] font-bold flex items-center gap-2">
                  <I.Sparkle width={15} height={15} fill="#0E7A5F" /> Test Agent
                </h4>
                <span className="text-[11.5px] text-ink-muted mt-0.5 block">Chat turns test RAG source settings</span>
              </div>
              <button onClick={handleResetPreview} className="text-ink-muted hover:text-ink text-[12.5px] font-semibold flex items-center gap-1.5" title="Restart conversation">
                🔄 Clear
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-[13px] mb-4 scrollbar-thin">
              {previewMsgs.map((m, idx) => {
                const isVisitor = m.role === "visitor";
                return (
                  <div key={idx} className={`max-w-[85%] ${isVisitor ? "ml-auto text-right" : ""}`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-xl border leading-relaxed inline-block text-left ${
                        isVisitor
                          ? "bg-surface-2 border-line rounded-tr-[3px] text-ink ml-auto"
                          : "bg-emerald-50 border-mint-300 rounded-tl-[3px] text-ink"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })}
              {sending && (
                <div className="max-w-[80%]">
                  <div className="bg-emerald-50 border border-mint-300 rounded-xl rounded-tl-[3px] px-3.5 py-2.5 inline-block text-[13px]">
                    <span className="animate-pulse flex items-center gap-1.5 text-ink-muted">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-600 [animation-delay:-0.3s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-600 [animation-delay:-0.15s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-600"></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Form */}
            <form onSubmit={handleSendPreviewMessage} className="border-t border-line pt-3.5 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message to test..."
                  className="input flex-1 px-3.5 py-2.5 border border-line rounded-xl text-sm"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl p-3 flex items-center justify-center shrink-0"
                  disabled={sending || !inputMsg.trim()}
                >
                  <I.Chevron className="rotate-90" width={16} height={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
