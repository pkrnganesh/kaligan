import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PageHead, Card } from "../components/ui";
import * as I from "../components/icons";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export function ChatAgent() {
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview chat state
  const [previewMsgs, setPreviewMsgs] = useState<{ role: string; content: string }[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [sending, setSending] = useState(false);

  const fetchAgent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/agents?kind=chat");
      if (data && data.length > 0) {
        setAgent(data[0]);
      } else {
        // Create initial default agent config
        const newAgent = await api.post("/agents", {
          kind: "chat",
          name: "Kali",
          persona: "Friendly",
          greeting: "Hi! I'm Kali 👋 How can I help you today?",
          goal: "qualify",
          captureFields: ["name", "email"],
        });
        setAgent(newAgent);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load chat agent settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  // Re-initialize preview chat window when agent loads or changes greeting
  useEffect(() => {
    if (agent) {
      setPreviewMsgs([
        {
          role: "agent",
          content: agent.greeting || `Hi! I'm ${agent.name} 👋 How can I help you today?`,
        },
      ]);
    }
  }, [agent]);

  const handleSave = async () => {
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
        captureFields: agent.captureFields,
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

  const toggleCaptureField = (field: string) => {
    if (!agent) return;
    const currentFields = [...(agent.captureFields || [])];
    const index = currentFields.indexOf(field);
    if (index > -1) {
      currentFields.splice(index, 1);
    } else {
      currentFields.push(field);
    }
    setAgent({ ...agent, captureFields: currentFields });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <PageHead title="Chat Agent" subtitle="Loading agent builder..." />
        <div className="grid grid-cols-[1fr_360px] gap-5">
          <div className="space-y-4">
            <div className="card h-48 bg-surface-2"></div>
            <div className="card h-48 bg-surface-2"></div>
          </div>
          <div className="card h-96 bg-surface-2"></div>
        </div>
      </div>
    );
  }

  const captureFields = agent?.captureFields || [];

  return (
    <>
      <PageHead title="Chat Agent" subtitle="Shape how your text AI talks. Changes preview live on the right." />
      
      {error && (
        <div className="card p-4 text-hot border border-hot bg-[#fdeceb] mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button className="btn btn-ghost !py-1 text-xs" onClick={fetchAgent}>Retry</button>
        </div>
      )}

      {saveSuccess && (
        <div className="card p-4 text-emerald-800 border border-emerald-300 bg-emerald-50 mb-4">
          Chat Agent configurations saved successfully!
        </div>
      )}

      <div className="grid grid-cols-[1fr_360px] gap-5 items-start fadeup" style={{ gap: 20 }}>
        {/* Left config side */}
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <label className="field-label font-semibold text-[13px] text-ink-muted">Agent name</label>
            <input
              className="input w-full mt-1 px-3 py-2 border border-line rounded-lg"
              value={agent.name || ""}
              onChange={(e) => setAgent({ ...agent, name: e.target.value })}
            />

            <label className="field-label font-semibold text-[13px] text-ink-muted mt-4 block">Greeting message</label>
            <textarea
              className="input w-full mt-1 px-3 py-2 border border-line rounded-lg text-sm"
              rows={2}
              value={agent.greeting || ""}
              onChange={(e) => setAgent({ ...agent, greeting: e.target.value })}
            />

            <label className="field-label font-semibold text-[13px] text-ink-muted mt-4 block">Goal description</label>
            <input
              className="input w-full mt-1 px-3 py-2 border border-line rounded-lg text-sm"
              value={agent.goal || ""}
              onChange={(e) => setAgent({ ...agent, goal: e.target.value })}
            />

            <label className="field-label mt-4 block font-semibold text-[13px] text-ink-muted">Personality</label>
            <div className="grid grid-cols-4 gap-2.5 mt-1">
              {["Friendly", "Professional", "Concise", "Enthusiastic"].map((p) => (
                <button
                  key={p}
                  onClick={() => setAgent({ ...agent, persona: p })}
                  className={`border-[1.5px] rounded-xl p-3 text-center text-[13px] font-semibold transition ${
                    agent.persona === p ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-line hover:border-mint-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-display font-bold text-[15px] mb-1">Lead qualification</h3>
            <p className="text-ink-muted text-[13px] mb-3">Ask for contact details once a visitor shows interest.</p>
            
            {["name", "email", "phone"].map((f) => {
              const isChecked = captureFields.includes(f);
              return (
                <label
                  key={f}
                  className="flex items-center justify-between py-3 border-t border-line text-[14px] cursor-pointer hover:bg-surface-2 px-1 transition rounded"
                >
                  <span className="capitalize">{f}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCaptureField(f)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                </label>
              );
            })}
          </Card>

          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving changes..." : "Save configurations"}
            </button>
          </div>
        </div>

        {/* Right Live Preview Rail */}
        <Card className="p-5 sticky flex flex-col h-[520px]" style={{ top: 96 }}>
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-3 shrink-0">
            Live preview
          </div>

          {/* Preview messages box */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-[13.5px] mb-4 scrollbar-thin">
            {previewMsgs.map((m, idx) => {
              const isVisitor = m.role === "visitor";
              return (
                <div key={idx} className={`max-w-[85%] ${isVisitor ? "ml-auto text-right" : ""}`}>
                  <div
                    className={`px-3 py-2 rounded-xl border leading-relaxed inline-block text-left ${
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
                <div className="bg-emerald-50 border border-mint-300 rounded-xl rounded-tl-[3px] px-3 py-2 inline-block">
                  <span className="animate-pulse">AI is typing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Preview Input form */}
          <form onSubmit={handleSendPreviewMessage} className="border-t border-line pt-3 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message to test..."
                className="input flex-1 px-3 py-2 border border-line rounded-lg text-sm"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                className="btn btn-primary bg-emerald-600 text-white rounded-lg p-2 flex items-center justify-center shrink-0"
                disabled={sending}
              >
                <I.Chevron className="rotate-90" />
              </button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

export function Settings() {
  const { user, workspace, refreshSession } = useAuth();
  const [tab, setTab] = useState("Workspace");
  const tabs = ["Workspace", "Billing & Plan", "Profile & Security"];

  // Form states
  const [workspaceName, setWorkspaceName] = useState(workspace?.name || "");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [brandColor, setBrandColor] = useState("#0E7A5F");

  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Sync state values when Auth Context resolves
  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name);
    }
    if (user) {
      setProfileName(user.name || "");
      setProfileEmail(user.email);
    }
  }, [user, workspace]);

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.patch("/workspace", {
        name: workspaceName,
        websiteUrl: websiteUrl || undefined,
        brandColor,
      });
      await refreshSession();
      setMessage({ text: "Workspace settings updated successfully!", success: true });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to update workspace", success: false });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.patch("/auth/me", {
        name: profileName,
        email: profileEmail,
      });
      await refreshSession();
      setMessage({ text: "Profile details updated successfully!", success: true });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to update profile", success: false });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setMessage({ text: "New password must be at least 8 characters long", success: false });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage({ text: "Password changed successfully!", success: true });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to change password", success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHead title="Settings" />
      
      <div className="flex gap-1.5 mb-5 fadeup">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setMessage(null);
            }}
            className={`text-[13.5px] font-semibold px-4 py-2 rounded-full transition ${
              tab === t
                ? "bg-emerald-600 text-white"
                : "bg-surface border border-line hover:border-mint-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {message && (
        <div
          className={`card p-4 mb-4 max-w-2xl text-sm border ${
            message.success
              ? "text-emerald-800 border-emerald-300 bg-emerald-50"
              : "text-hot border-hot bg-[#fdeceb]"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card className="p-6 max-w-2xl fadeup">
        {tab === "Workspace" && (
          <form onSubmit={handleSaveWorkspace} className="space-y-4">
            <div>
              <label className="field-label font-semibold text-[13px] text-ink-muted">Company name</label>
              <input
                className="input w-full mt-1 px-3 py-2 border border-line rounded-lg"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label font-semibold text-[13px] text-ink-muted">Website URL</label>
              <input
                className="input w-full mt-1 px-3 py-2 border border-line rounded-lg"
                placeholder="https://yourcompany.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label font-semibold text-[13px] text-ink-muted">Brand color</label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  className="w-16 h-10 rounded-lg border border-line cursor-pointer"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                />
                <span className="text-sm font-mono text-ink-muted">{brandColor}</span>
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        )}

        {tab === "Billing & Plan" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-ink-muted text-[12.5px]">Current plan</div>
                <div className="font-display text-xl font-bold capitalize">
                  {workspace?.plan || "Starter"}
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => alert("Billing & Staging upgrades coming soon!")}>
                Upgrade
              </button>
            </div>
            <div className="mt-5 bg-surface-2 border border-line rounded-xl p-4 text-[13.5px]">
              Plan status: <b>Active</b> · Includes local model grounding & lead capture pipelines.
            </div>
          </div>
        )}

        {tab === "Profile & Security" && (
          <div className="space-y-6">
            {/* Profile Info Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4 border-b border-line pb-6">
              <h3 className="font-display font-semibold text-[15px]">Profile Details</h3>
              <div>
                <label className="field-label font-semibold text-[13px] text-ink-muted">Name</label>
                <input
                  className="input w-full mt-1 px-3 py-2 border border-line rounded-lg"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label font-semibold text-[13px] text-ink-muted">Email</label>
                <input
                  className="input w-full mt-1 px-3 py-2 border border-line rounded-lg"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  required
                />
              </div>
              <div className="pt-2">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Saving..." : "Update Profile"}
                </button>
              </div>
            </form>

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h3 className="font-display font-semibold text-[15px]">Change Password</h3>
              <div>
                <label className="field-label font-semibold text-[13px] text-ink-muted">Current Password</label>
                <input
                  type="password"
                  className="input w-full mt-1 px-3 py-2 border border-line rounded-lg"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label font-semibold text-[13px] text-ink-muted">New Password</label>
                <input
                  type="password"
                  className="input w-full mt-1 px-3 py-2 border border-line rounded-lg"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="pt-2">
                <button type="submit" className="btn btn-primary bg-emerald-600 text-white" disabled={loading}>
                  {loading ? "Updating..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        )}
      </Card>
    </>
  );
}

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const labels = ["Teach", "Shape", "Meet", "Go live", "Live"];
  const [hasSources, setHasSources] = useState(false);
  const [agentName, setAgentName] = useState("Kali");
  const [agentPersona, setAgentPersona] = useState("Friendly");
  
  // Meet step preview state
  const [previewMsgs, setPreviewMsgs] = useState<{ role: string; content: string }[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [sending, setSending] = useState(false);

  // Poll or check if the workspace has ready documents in Step 1
  useEffect(() => {
    if (step !== 1) return;

    let active = true;
    const checkDocuments = async () => {
      try {
        const docs = await api.get("/kb/documents");
        const hasReady = docs.some((d: any) => d.status === "ready");
        if (active) {
          setHasSources(hasReady);
        }
      } catch (err) {
        console.error("Failed to check onboarding KB status", err);
      }
    };

    checkDocuments();
    const interval = setInterval(checkDocuments, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [step]);

  // Set up preview messaging greeting
  useEffect(() => {
    if (step === 3) {
      setPreviewMsgs([
        { role: "agent", content: `Hi! I'm ${agentName} 👋 How can I help you?` },
      ]);
    }
  }, [step, agentName]);

  const handleSaveShape = async () => {
    try {
      // Find chat agent and patch it
      const data = await api.get("/agents?kind=chat");
      let agentId = "";
      if (data && data.length > 0) {
        agentId = data[0].id;
      } else {
        const newAgent = await api.post("/agents", {
          kind: "chat",
          name: agentName,
          persona: agentPersona,
        });
        agentId = newAgent.id;
      }
      await api.patch(`/agents/${agentId}`, {
        name: agentName,
        persona: agentPersona,
        greeting: `Hi! I'm ${agentName} 👋 How can I help you?`,
      });
      setStep(3);
    } catch (err) {
      alert("Failed to save agent profile shape: " + err);
    }
  };

  const handleSendOnboardingMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || sending) return;

    const userMessage = inputMsg.trim();
    setInputMsg("");
    setSending(true);

    const updatedMsgs = [...previewMsgs, { role: "visitor", content: userMessage }];
    setPreviewMsgs(updatedMsgs);

    try {
      const history = updatedMsgs.slice(1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Find chat agent to test preview
      const agents = await api.get("/agents?kind=chat");
      const agentId = agents[0]?.id;

      const res = await api.post("/chat/preview", {
        agentId,
        message: userMessage,
        history,
      });

      setPreviewMsgs((prev) => [...prev, { role: "agent", content: res.reply }]);
    } catch (err) {
      setPreviewMsgs((prev) => [
        ...prev,
        { role: "agent", content: "Couldn't retrieve response. Ensure KB has ready sources." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const { workspace } = useAuth();
  const publicKey = workspace?.publicKey || "ws_your_public_key";
  const widgetSnippet = `<script src="${window.location.origin}/w.js" data-key="${publicKey}"></script>`;

  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="flex items-center justify-between mb-6 fadeup">
        <div className="flex gap-1.5">
          {labels.map((_, i) => (
            <span key={i} className={`h-1.5 w-12 rounded-full ${i < step ? "bg-emerald-600" : "bg-mint-300"}`} />
          ))}
        </div>
        <span className="text-[13px] font-semibold text-emerald-700">
          Step {step}/5 · {labels[step - 1]}
        </span>
      </div>

      <Card className="p-8 text-center fadeup">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-teal-400 grid place-items-center mx-auto mb-4">
          <I.Sparkle width={26} height={26} />
        </div>

        {/* STEP 1: Teach (Ingest documents) */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">Teach your AI employee</h2>
            <p className="text-ink-muted max-w-md mx-auto text-sm">
              Upload documents, import FAQs, or paste web page URLs in the **Knowledge Base** section so your AI assistant can ground answers accurately.
            </p>
            <div className="mt-4 p-4 border border-dashed border-line rounded-lg bg-surface-2 max-w-sm mx-auto text-sm text-ink-muted">
              {hasSources ? (
                <span className="text-emerald-700 font-semibold flex items-center justify-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-success"></span> Ingestion complete! Click next to continue.
                </span>
              ) : (
                <span>
                  No ready documents detected yet. Please open the **Knowledge Base** in another tab and add a resource, then return here.
                </span>
              )}
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <button className="btn border" onClick={() => navigate("/app/knowledge")}>
                Manage Knowledge Base
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setStep(2)}
                disabled={!hasSources}
                title={!hasSources ? "Please wait until at least one document is ready" : ""}
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Shape */}
        {step === 2 && (
          <div className="space-y-4 max-w-md mx-auto text-left">
            <h2 className="font-display text-2xl font-bold text-center">Shape agent settings</h2>
            <p className="text-ink-muted text-center text-sm mb-4">
              Set the name and default conversational persona of your brand's AI representative.
            </p>
            <div>
              <label className="field-label font-semibold text-[13px] text-ink-muted">Agent name</label>
              <input
                className="input w-full mt-1 px-3 py-2 border border-line rounded-lg"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label font-semibold text-[13px] text-ink-muted block mt-3">Persona</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {["Friendly", "Professional", "Concise", "Enthusiastic"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAgentPersona(p)}
                    className={`border rounded-lg p-2.5 text-center text-xs font-semibold ${
                      agentPersona === p ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-line"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-center gap-3 mt-8">
              <button className="btn border" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleSaveShape}>
                Save & Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Meet (Live Preview Chat) */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">Meet your AI assistant</h2>
            <p className="text-ink-muted max-w-md mx-auto text-sm">
              Send a test message to converse with your AI agent based on the knowledge base context you provided.
            </p>
            
            <div className="bg-surface-2 border border-line rounded-xl p-4 mt-5 text-left text-[13.5px] max-h-[220px] overflow-y-auto space-y-2.5 max-w-lg mx-auto">
              {previewMsgs.map((m, idx) => (
                <div key={idx} className={m.role === "visitor" ? "text-right" : ""}>
                  <div
                    className={`px-3 py-2 rounded-xl border leading-relaxed inline-block ${
                      m.role === "visitor"
                        ? "bg-surface border-line text-ink text-left"
                        : "bg-emerald-50 border-mint-300 text-ink text-left"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && <div className="text-ink-muted italic text-xs">AI typing reply...</div>}
            </div>

            <form onSubmit={handleSendOnboardingMessage} className="max-w-lg mx-auto mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Ask it a question about your knowledge..."
                className="input flex-1 px-3 py-2 border border-line rounded-lg text-sm"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                disabled={sending}
              />
              <button type="submit" className="btn btn-primary" disabled={sending}>
                Send
              </button>
            </form>

            <div className="flex justify-center gap-3 mt-8">
              <button className="btn border" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(4)}>
                Looks Good →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Go Live */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">Deploy your widget</h2>
            <p className="text-ink-muted max-w-md mx-auto text-sm">
              Embed this simple script tag into the HTML head of your website to go live.
            </p>
            <div className="max-w-lg mx-auto mt-4 text-left">
              <pre className="bg-surface-2 border border-line p-3 rounded-lg text-xs font-mono select-all overflow-x-auto">
                {widgetSnippet}
              </pre>
            </div>
            <p className="text-ink-muted text-xs max-w-md mx-auto mt-2">
              Once installed, the floating bubble chat assistant will interact with your visitor directly.
            </p>
            <div className="flex justify-center gap-3 mt-8">
              <button className="btn border" onClick={() => setStep(3)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(5)}>
                Proceed to Live
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Live */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">Agent is live!</h2>
            <p className="text-ink-muted max-w-md mx-auto text-sm">
              Your AI workspace agent is configured and active. Conversations will populate your dashboard as visitors interact.
            </p>
            <div className="flex justify-center gap-3 mt-8">
              <button className="btn border" onClick={() => setStep(4)}>
                Back
              </button>
              <button className="btn btn-primary bg-success text-white" onClick={() => navigate("/app")}>
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
