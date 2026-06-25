import { useState } from "react";
import { PageHead, Card } from "../components/ui";
import * as I from "../components/icons";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

const platforms = ["HTML", "React", "Next.js", "WordPress", "Shopify"];

export default function Docs() {
  const { workspace } = useAuth();
  const [activeTab, setActiveTab] = useState<"widget" | "knowledge" | "chat" | "voice">("widget");
  const [plat, setPlat] = useState("WordPress");
  const [copied, setCopied] = useState(false);
  const [verify, setVerify] = useState<"idle" | "checking" | "ok">("idle");

  const snippet = `<script src="${window.location.origin}/w.js" data-key="${workspace?.publicKey || ""}"></script>`;

  const copySnippet = () => {
    navigator.clipboard?.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const doVerify = async () => {
    setVerify("checking");
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const res = await api.post("/widget/verify");
      if (res && res.installed) {
        setVerify("ok");
      } else {
        setVerify("idle");
      }
    } catch (err) {
      console.error("Verification failed:", err);
      setVerify("idle");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <PageHead 
        title="Documentation & Help Center" 
        subtitle="Learn how to install, configure, and customize your Kaligan AI Employee in minutes." 
      />

      <div className="flex gap-7 items-start">
        {/* Left Nav Menu */}
        <aside className="w-[260px] bg-white border border-line rounded-2xl p-4 shrink-0 shadow-sm flex flex-col gap-1.5 select-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 pb-2">
            Guides & Setup
          </span>
          <button
            onClick={() => setActiveTab("widget")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === "widget"
                ? "bg-emerald-50 text-emerald-800 border-l-2 border-emerald-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <span className="shrink-0"><I.Code width={14} height={14} /></span>
            <span>Widget Installation</span>
          </button>
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === "knowledge"
                ? "bg-emerald-50 text-emerald-800 border-l-2 border-emerald-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <span className="shrink-0"><I.Book width={14} height={14} /></span>
            <span>Knowledge Base Setup</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === "chat"
                ? "bg-emerald-50 text-emerald-800 border-l-2 border-emerald-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <span className="shrink-0"><I.Bot width={14} height={14} /></span>
            <span>Chat Agent Personality</span>
          </button>
          <button
            onClick={() => setActiveTab("voice")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === "voice"
                ? "bg-emerald-50 text-emerald-800 border-l-2 border-emerald-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <span className="shrink-0"><I.Mic width={14} height={14} /></span>
            <span>Voice & Twilio Phone Setup</span>
          </button>
        </aside>

        {/* Right Active Workspace Content Panel */}
        <div className="flex-1 min-w-0">
          {activeTab === "widget" && (
            <div className="flex flex-col gap-6">
              {/* Main Embed card */}
              <Card className="p-6 shadow-sm border border-line bg-white">
                <h2 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <span>💻</span> Widget Installation Code
                </h2>
                <p className="text-xs text-ink-muted leading-relaxed mb-4">
                  Get your AI live on your website in under 5 minutes. Copy the code block below and insert it into your site pages.
                </p>

                {/* Step indicator */}
                <div className="flex items-center gap-3 mb-6 text-[11px] font-bold text-emerald-700/80 bg-emerald-50/20 p-2.5 border border-emerald-100/50 rounded-xl max-w-xl">
                  {["Verify site", "Get code", "Install", "Verify"].map((s, i) => (
                    <span key={s} className="flex items-center gap-2 shrink-0">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white grid place-items-center text-[9px] font-sans">
                        {i + 1}
                      </span>
                      <span>{s}</span>
                      {i < 3 && <span className="text-slate-300">→</span>}
                    </span>
                  ))}
                </div>

                <label className="text-xs font-semibold text-slate-700 block mb-1">Your install code snippet</label>
                <div className="flex items-stretch gap-2 mb-2">
                  <code className="flex-1 bg-slate-950 text-emerald-300 text-[12px] rounded-xl px-4 py-3 font-mono overflow-x-auto select-all leading-relaxed align-middle">
                    {snippet}
                  </code>
                  <button 
                    onClick={copySnippet} 
                    className={`px-4 rounded-xl font-semibold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0 ${
                      copied ? "bg-emerald-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {copied ? <><I.Check width={13} height={13} /> Copied</> : <>📋 Copy</>}
                  </button>
                </div>
                <p className="text-slate-400 text-[11.5px] leading-relaxed mb-6">
                  Paste this snippet just before the closing <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono font-medium text-[11px]">&lt;/body&gt;</code> tag on your website pages.
                </p>

                {/* Platforms selection */}
                <label className="text-xs font-semibold text-slate-700 block mb-2">Select Platform Instructions</label>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {platforms.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlat(p)}
                      className={`text-[11.5px] font-bold px-3 py-1 rounded-full transition-all cursor-pointer ${
                        plat === p 
                          ? "bg-emerald-600 text-white" 
                          : "bg-slate-50 border border-line text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Platform detail */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-[13px] text-slate-600 leading-relaxed mb-6 font-medium">
                  {plat === "HTML" && (
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-700">Generic HTML Integration</span>
                      <span>Paste the script snippet directly at the bottom of your root HTML file (often `index.html`), right above the closing body tag. It will load asynchronously and initialize the bubble.</span>
                    </div>
                  )}
                  {plat === "React" && (
                    <div className="flex flex-col gap-1.5">
                      <span className="font-bold text-slate-700">React Hook Integration</span>
                      <span>Run this in your App root or inside a `useEffect` module:</span>
                      <pre className="bg-slate-900 text-slate-200 text-[11px] p-3 rounded-lg font-mono overflow-x-auto leading-relaxed my-1">
{`useEffect(() => {
  const script = document.createElement('script');
  script.src = '${window.location.origin}/w.js';
  script.setAttribute('data-key', '${workspace?.publicKey || ""}');
  document.body.appendChild(script);
  return () => { document.body.removeChild(script); };
}, []);`}
                      </pre>
                    </div>
                  )}
                  {plat === "Next.js" && (
                    <div className="flex flex-col gap-1.5">
                      <span className="font-bold text-slate-700">Next.js Script Component</span>
                      <span>Import the {'<Script>'} module and place it inside your root page or layout file:</span>
                      <pre className="bg-slate-900 text-slate-200 text-[11px] p-3 rounded-lg font-mono overflow-x-auto leading-relaxed my-1">
{`import Script from 'next/script';

export default function RootLayout() {
  return (
    <>
      <Script 
        src="${window.location.origin}/w.js" 
        data-key="${workspace?.publicKey || ""}"
        strategy="lazyOnload"
      />
    </>
  );
}`}
                      </pre>
                    </div>
                  )}
                  {plat === "WordPress" && (
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-700">WordPress Theme Editor</span>
                      <ol className="list-decimal ml-4 space-y-1 mt-1 text-slate-500">
                        <li>Log in to your WordPress dashboard.</li>
                        <li>Navigate to <strong className="text-slate-600">Appearance → Theme File Editor</strong>.</li>
                        <li>Locate and open your <strong className="text-slate-600">footer.php</strong> template script file.</li>
                        <li>Scroll to the bottom, paste your code snippet just above the `&lt;/body&gt;` line, and click save.</li>
                      </ol>
                    </div>
                  )}
                  {plat === "Shopify" && (
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-700">Shopify theme.liquid Setup</span>
                      <ol className="list-decimal ml-4 space-y-1 mt-1 text-slate-500">
                        <li>Log in to your Shopify Admin and go to <strong className="text-slate-600">Online Store → Themes</strong>.</li>
                        <li>Click the three dots and select <strong className="text-slate-600">Edit Code</strong>.</li>
                        <li>Open the file <strong className="text-slate-600">Layout / theme.liquid</strong>.</li>
                        <li>Find the closing `&lt;/body&gt;` tag, paste the snippet right above it, and save the document.</li>
                      </ol>
                    </div>
                  )}
                </div>

                <div className="border-t border-line pt-5 flex items-center gap-4">
                  <button 
                    onClick={doVerify} 
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    {verify === "checking" ? "Checking…" : verify === "ok" ? "Installed" : "Verify installation"}
                  </button>
                  {verify === "ok" && (
                    <span className="text-emerald-700 text-[12.5px] font-bold flex items-center gap-1">
                      ✓ Widget active · website connected · AI employee ready to converse
                    </span>
                  )}
                  {verify === "checking" && (
                    <span className="text-slate-400 text-[12.5px] font-semibold animate-pulse">
                      Looking for the widget on your site…
                    </span>
                  )}
                  {verify === "idle" && (
                    <span className="text-slate-400 text-[12.5px] font-semibold">
                      Click to check if the widget code is live on your website.
                    </span>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "knowledge" && (
            <Card className="p-6 bg-white border border-line shadow-sm">
              <h2 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <span>📚</span> Grounding & Knowledge Base Setup
              </h2>
              <p className="text-xs text-ink-muted leading-relaxed mb-5">
                Learn how your AI employee acquires knowledge and ensures factually accurate responses without hallucinating.
              </p>

              <div className="flex flex-col gap-5 text-[13px] text-slate-600 leading-relaxed font-medium">
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">1. Document Uploads</h3>
                  <span>
                    Upload standard PDF or plain text files in the **Knowledge Base** page. Our ingestion system runs on-the-fly parsing to extract texts, divide them into overlapping semantic chunks, and generate vector embeddings.
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">2. Website Crawling</h3>
                  <span>
                    Submit website URLs to crawl web pages instantly. The system maps all sub-links, parses public HTML text content, indexes them, and attaches them to your workspace.
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">3. Strict Grounding Protection (Anti-Hallucination)</h3>
                  <span>
                    Every visitor prompt undergoes a semantic vector similarity search via `pgvector` against your knowledge chunks. If the similarity score is below the strict safety threshold (`score &gt; 0.35`), the AI declines to formulate an answer and initiates the **Lead Capture** sequence instead. This prevents general model knowledge leakage and incorrect facts.
                  </span>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "chat" && (
            <Card className="p-6 bg-white border border-line shadow-sm">
              <h2 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <span>🤖</span> Configuring Chat Agent & Lead Capture
              </h2>
              <p className="text-xs text-ink-muted leading-relaxed mb-5">
                Configure your AI employee identity, capture rules, and customize target conversion criteria.
              </p>

              <div className="flex flex-col gap-5 text-[13px] text-slate-600 leading-relaxed font-medium">
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">1. Identity and Tone</h3>
                  <span>
                    Customize the name, avatar, and system prompts of your AI worker. Use strict role directives (e.g., "Act as a sales executive for Acme") to guide conversation style and output responses.
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">2. Lead Capture Fields</h3>
                  <span>
                    Define custom fields you want to collect (such as Name, Email, Phone Number, or Company size). The AI will dynamically steer the conversation to capture this information once the visitor shows buying intent.
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">3. Automated Lead Scoring</h3>
                  <span>
                    Captured contacts are automatically scored as **Hot**, **Warm**, or **Cold** based on buying signals in the conversation logs (e.g., timeline, budget, role decision authority). Scored leads are routed directly to your Leads inbox.
                  </span>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "voice" && (
            <div className="flex flex-col gap-6">
              <Card className="p-6 bg-white border border-line shadow-sm">
                <h2 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <span>📞</span> Connecting Your Twilio Phone Number (BYON)
                </h2>
                <p className="text-xs text-ink-muted leading-relaxed mb-5">
                  Connect your own Twilio phone numbers to let the same grounded AI worker answer phone calls.
                </p>

                <div className="flex flex-col gap-5 text-[13px] text-slate-600 leading-relaxed font-medium">
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">Step 1: Get your webhook configuration URL</h3>
                    <span>
                      Each configured voice agent generates a unique, unguessable incoming webhook URL. Generate your webhook URL in the Voice Agent builder under "Connect Number":
                    </span>
                    <pre className="bg-slate-900 text-slate-200 text-[11px] p-3 rounded-lg font-mono overflow-x-auto leading-relaxed my-2">
{`${window.location.origin}/api/v1/telephony/twilio/incoming/agent_${workspace?.id?.substring(0, 8) || "workspace"}`}
                    </pre>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">Step 2: Add Webhook to Twilio console</h3>
                    <span>
                      Log in to your Twilio console, navigate to Phone Numbers, select your number, and locate the **"A call comes in"** config field. Paste your webhook URL and select **HTTP POST**.
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">Step 3: Verification</h3>
                    <span>
                      Click "Verify" inside the portal and make a test call. We will parse the incoming webhook event and link your Twilio number instantly.
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
