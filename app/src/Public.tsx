import { Link, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import type { ReactNode, CSSProperties } from "react";
import * as I from "./components/icons";
import { useAuth } from "./lib/auth";
import { api } from "./lib/api";
import { useLiveSession, ConnectionState } from "./lib/voice/useLiveSession";
import { Orb } from "./components/voice/Orb";

/* ============================== AUTH ============================== */
function AuthShell({ title, sub, cta, foot, to }: { title: string; sub: string; cta: string; foot: ReactNode; to: string }) {
  const nav = useNavigate();
  const { login, signup } = useAuth();

  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (to === "signup") {
        if (!companyName.trim()) {
          throw new Error("Company name is required");
        }
        if (!email.trim()) {
          throw new Error("Email is required");
        }
        if (!password.trim() || password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }
        await signup(companyName, websiteUrl, email, password);
        nav("/app/onboarding");
      } else if (to === "login") {
        if (!email.trim()) {
          throw new Error("Email is required");
        }
        if (!password.trim()) {
          throw new Error("Password is required");
        }
        await login(email, password);
        nav("/app");
      } else if (to === "forgot") {
        if (!email.trim()) {
          throw new Error("Email is required");
        }
        await api.post("/auth/forgot-password", { email });
        setSuccess("If that email is registered, we've logged a password reset link in the server console.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 relative overflow-hidden">
      <Glow className="-top-40 -right-32" />
      <div className="w-full max-w-sm relative">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <span className="w-9 h-9 rounded-[10px] bg-emerald-600 grid place-items-center shadow-soft"><I.Sparkle width={18} height={18} fill="#fff" /></span>
          <span className="font-display font-bold text-lg">KaliGanAI</span>
        </Link>
        <div className="card p-7">
          <h1 className="font-display text-xl font-bold">{title}</h1>
          <p className="text-ink-muted text-[14px] mt-1 mb-5">{sub}</p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[13px] font-medium leading-relaxed">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[13px] font-medium leading-relaxed">
                {success}
              </div>
            )}

            {to.includes("signup") && (
              <>
                <label className="field-label">Company name</label>
                <input
                  required
                  className="input mb-3"
                  placeholder="Acme Co"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={loading}
                />
                <label className="field-label">Website URL</label>
                <input
                  className="input mb-3"
                  placeholder="https://acme.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  disabled={loading}
                />
              </>
            )}

            <label className="field-label">Email</label>
            <input
              required
              type="email"
              className="input mb-3"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            {!to.includes("forgot") && (
              <>
                <label className="field-label">Password</label>
                <input
                  required
                  type="password"
                  className="input mb-4"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                cta
              )}
            </button>
          </form>

          <div className="text-center text-[13px] text-ink-muted mt-4">{foot}</div>
        </div>
        <p className="text-center text-[12px] text-ink-muted mt-4">No credit card required · Live in 5 minutes</p>
      </div>
    </div>
  );
}
export const Login = () => <AuthShell to="login" title="Welcome back" sub="Log in to your workspace." cta="Log in" foot={<><Link to="/forgot-password" className="text-emerald-600 font-semibold">Forgot password?</Link> · <Link to="/signup" className="text-emerald-600 font-semibold">Sign up</Link></>} />;
export const Signup = () => <AuthShell to="signup" title="Start free" sub="Your AI employee, live in minutes." cta="Start free" foot={<>Already have an account? <Link to="/login" className="text-emerald-600 font-semibold">Log in</Link></>} />;
export const Forgot = () => <AuthShell to="forgot" title="Reset password" sub="We'll email you a reset link." cta="Send reset link" foot={<Link to="/login" className="text-emerald-600 font-semibold">Back to login</Link>} />;

/* ============================ PRIMITIVES ========================== */
function Glow({ className = "", style, variant = 1 }: { className?: string; style?: CSSProperties; variant?: 1 | 2 }) {
  const anim = variant === 1 ? "glow-drift-1 14s ease-in-out infinite" : "glow-drift-2 18s ease-in-out infinite";
  return <div aria-hidden className={`absolute pointer-events-none -z-10 w-[580px] h-[580px] rounded-full blur-[100px] opacity-50 ${className}`}
    style={{ background: variant === 1
      ? "radial-gradient(circle,#BFE6CE 0%,rgba(95,201,176,.35) 45%,transparent 70%)"
      : "radial-gradient(circle,#CFF3E6 0%,rgba(178,228,206,.25) 50%,transparent 75%)",
      animation: anim,
      ...style }} />;
}
function Dots({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`absolute pointer-events-none -z-10 ${className}`}
    style={{ backgroundImage: "radial-gradient(#BFE6CE 1px,transparent 1px)", backgroundSize: "22px 22px",
      maskImage: "radial-gradient(ellipse at center,#000 30%,transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at center,#000 30%,transparent 75%)" }} />;
}
function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-2 bg-surface border border-mint-300 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-emerald-700">
    <I.Sparkle width={13} height={13} className="text-teal-400" />{children}</span>;
}
function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-10">
      <div className="flex justify-center mb-3"><Eyebrow>{eyebrow}</Eyebrow></div>
      <h2 className="font-display text-[34px] font-bold leading-[1.12]">{title}</h2>
      {sub && <p className="text-ink-muted text-[15.5px] mt-3">{sub}</p>}
    </div>
  );
}

/* ============================ MARKETING SHELL ===================== */
export function MarketingShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const link = ({ isActive }: { isActive: boolean }) => `text-[14px] font-medium transition ${isActive ? "text-emerald-700" : "text-ink hover:text-emerald-600"}`;
  const mobileLink = ({ isActive }: { isActive: boolean }) => `block py-3 px-4 text-base font-semibold border-b border-line/50 transition ${isActive ? "text-emerald-700 bg-emerald-50/50" : "text-ink hover:bg-surface-2"}`;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/w.js";
    script.setAttribute("data-key", "ws_hello_key");
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
      const container = document.getElementById("kaligan-widget-container");
      if (container) {
        container.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <style>{`
        @keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes floaty2{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}
        @keyframes glow-drift-1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,-50px) scale(1.15)}}
        @keyframes glow-drift-2{0%,100%{transform:translate(0,0) scale(1.1)}50%{transform:translate(-50px,30px) scale(0.9)}}
        @keyframes bounce-once{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
        .animate-bounce-once{animation:bounce-once 0.6s ease-in-out 1}
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
      `}</style>
      <header className="sticky top-0 z-30 backdrop-blur-md bg-canvas/80 border-b border-line/75">
        <div className="flex items-center gap-6 px-6 md:px-8 py-3.5 max-w-6xl mx-auto">
          <Link to="/" className="flex items-center gap-2 mr-2">
            <span className="w-8 h-8 rounded-[9px] bg-emerald-600 grid place-items-center shadow-soft">
              <I.Sparkle width={16} height={16} fill="#fff" />
            </span>
            <span className="font-display font-bold text-lg tracking-tight">KaliGanAI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/features" className={link}>Product</NavLink>
            <NavLink to="/pricing" className={link}>Pricing</NavLink>
            <NavLink to="/compare/chatgpt" className={link}>Compare</NavLink>
            <NavLink to="/blog" className={link}>Blog</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/login" className="text-[14px] font-semibold hidden sm:inline-block text-ink hover:text-emerald-700 transition">Log in</Link>
            <Link to="/signup" className="btn btn-primary !py-2 px-4">Start free</Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-ink hover:text-emerald-700 transition rounded-lg hover:bg-surface-2 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-line bg-canvas/95 backdrop-blur-md absolute top-full left-0 right-0 z-20 shadow-md">
            <nav className="py-2 flex flex-col">
              <NavLink to="/features" className={mobileLink} onClick={() => setMobileMenuOpen(false)}>Product</NavLink>
              <NavLink to="/pricing" className={mobileLink} onClick={() => setMobileMenuOpen(false)}>Pricing</NavLink>
              <NavLink to="/compare/chatgpt" className={mobileLink} onClick={() => setMobileMenuOpen(false)}>Compare</NavLink>
              <NavLink to="/blog" className={mobileLink} onClick={() => setMobileMenuOpen(false)}>Blog</NavLink>
              <div className="p-4 flex flex-col gap-3">
                <Link to="/login" className="text-center font-semibold py-2 text-sm text-ink hover:text-emerald-700" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                <Link to="/signup" className="btn btn-primary text-center !py-2.5 text-sm" onClick={() => setMobileMenuOpen(false)}>Start free</Link>
              </div>
            </nav>
          </div>
        )}
      </header>
      <div className="flex-1"><Outlet /></div>
      <footer className="border-t border-line bg-surface-2">
        <div className="max-w-6xl mx-auto px-8 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3"><span className="w-7 h-7 rounded-lg bg-emerald-600 grid place-items-center"><I.Sparkle width={14} height={14} fill="#fff" /></span><span className="font-display font-bold">KaliGanAI</span></div>
            <p className="text-ink-muted text-[13px] leading-relaxed max-w-[230px]">The AI employee that turns website visitors into qualified leads — over chat and voice.</p>
          </div>
          {[["Product", ["Features", "/features"], ["Pricing", "/pricing"], ["Log in", "/login"]],
            ["Compare", ["vs Wrappers", "/compare/chatgpt"], ["vs Voice APIs", "/compare/vapi"], ["vs Legacy Chatbots", "/compare/generic"]],
            ["Company", ["About", "/about"], ["Contact", "/contact"]],
            ["Legal", ["Privacy", "/"], ["Terms", "/"]]].map((col) => (
            <div key={col[0] as string}>
              <div className="font-semibold text-[13px] mb-3">{col[0] as string}</div>
              <ul className="space-y-2">
                {(col.slice(1) as [string, string][]).map(([label, href]) => (
                  <li key={label}><Link to={href} className="text-ink-muted text-[13.5px] hover:text-emerald-600">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-line py-5 text-center text-ink-muted text-[12.5px]">© 2026 KaliGanAI · Made for small teams that want to grow.</div>
      </footer>
    </div>
  );
}

function InteractiveDemo() {
  const [isOpen, setIsOpen] = useState(true);
  const [mode, setMode] = useState<"A" | "B">("A");
  const [url, setUrl] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [demoId, setDemoId] = useState<string | null>(null);
  const [demoAgentId, setDemoAgentId] = useState<string | null>(null);
  const [demoPublicKey, setDemoPublicKey] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: "visitor" | "agent"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loadingReply, setLoadingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedLead, setCapturedLead] = useState<any>(null);

  const {
    connectionState,
    messages: voiceMessages,
    error: voiceError,
    isBotSpeaking,
    microphoneLevel,
    startSession,
    disconnect,
  } = useLiveSession();

  const [orbVoiceLevel, setOrbVoiceLevel] = useState(0);
  const lastProcessedLenRef = useRef(0);

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

  const finalizeVoiceDemoCall = async () => {
    if (!demoAgentId || !demoPublicKey || voiceMessages.length === 0) return;
    try {
      const payload: any = {
        workspacePublicKey: demoPublicKey,
        agentId: demoAgentId,
        transcript: voiceMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'agent',
          content: m.content
        })),
        visitorMeta: { device: "Web Browser", location: "Demo Sandbox" }
      };
      if (conversationId) {
        payload.conversationId = conversationId;
      }
      const res = await api.post("/public/demo/finalize", payload);
      if (res.conversationId) {
        setConversationId(res.conversationId);
      }
      if (res.captured) {
        setCapturedLead({ fields: res.captured.fields, score: res.score });
      }
    } catch (err) {
      console.warn("Failed to finalize voice demo call:", err);
    }
  };

  useEffect(() => {
    if (connectionState === ConnectionState.DISCONNECTED) {
      if (voiceMessages.length > 0 && voiceMessages.length > lastProcessedLenRef.current) {
        finalizeVoiceDemoCall();
        lastProcessedLenRef.current = voiceMessages.length;
      }
    } else if (connectionState === ConnectionState.CONNECTING) {
      lastProcessedLenRef.current = 0;
    }
  }, [connectionState, voiceMessages]);

  const startDemo = async (payload: { vertical?: string; url?: string }) => {
    setIngesting(true);
    setError(null);
    setDemoId(null);
    setDemoAgentId(null);
    setDemoPublicKey(null);
    setConversationId(null);
    setMessages([]);
    setCapturedLead(null);
    try {
      const res = await api.post("/public/demo/ingest", payload);
      setDemoId(res.demoId);
      setDemoAgentId(res.agentId);
      setDemoPublicKey(res.publicKey);
      setMessages([{ role: "agent", content: res.greeting }]);
    } catch (err: any) {
      setError(err.message || "Failed to initialize demo. Please try again.");
    } finally {
      setIngesting(false);
    }
  };

  // Initialize default demo on mount ( KaliGanAI SaaS teammate )
  useEffect(() => {
    startDemo({ vertical: "saas" });
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !demoId || loadingReply) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "visitor", content: userMsg }]);
    setLoadingReply(true);

    try {
      const res = await api.post("/public/demo/chat", {
        demoId,
        message: userMsg,
        conversationId: conversationId || undefined,
      });
      if (res.conversationId) {
        setConversationId(res.conversationId);
      }
      setMessages((prev) => [...prev, { role: "agent", content: res.reply }]);
      if (res.captured) {
        setCapturedLead({ fields: res.captured.fields, score: res.score });
      }
    } catch (err: any) {
      setError(err.message || "Failed to get response");
    } finally {
      setLoadingReply(false);
    }
  };

  const handleSendSuggestion = async (text: string) => {
    if (!demoId || loadingReply) return;
    setMessages((prev) => [...prev, { role: "visitor", content: text }]);
    setLoadingReply(true);

    try {
      const res = await api.post("/public/demo/chat", {
        demoId,
        message: text,
        conversationId: conversationId || undefined,
      });
      if (res.conversationId) {
        setConversationId(res.conversationId);
      }
      setMessages((prev) => [...prev, { role: "agent", content: res.reply }]);
      if (res.captured) {
        setCapturedLead({ fields: res.captured.fields, score: res.score });
      }
    } catch (err: any) {
      setError(err.message || "Failed to get response");
    } finally {
      setLoadingReply(false);
    }
  };

  const handleVoiceToggle = () => {
    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) {
      disconnect();
    } else {
      if (demoAgentId && demoPublicKey) {
        startSession(demoAgentId, true, demoPublicKey);
      }
    }
  };

  const handleReset = () => {
    disconnect();
    setUrl("");
    setMode("A");
    setCapturedLead(null);
    startDemo({ vertical: "saas" });
  };

  return (
    <div className="relative w-full max-w-[460px] mx-auto">
      {/* Web browser mockup container */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl h-[470px] w-full relative overflow-hidden shadow-lift flex flex-col">
        
        {/* Browser Top Bar */}
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800/80 flex items-center gap-3 shrink-0 select-none">
          <div className="flex gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-0.5 text-[10px] text-slate-500 font-mono w-full max-w-[200px] mx-auto text-center truncate">
            {url ? url.replace(/https?:\/\/(www\.)?/, '') : "yourwebsite.com"}
          </div>
        </div>

        {/* Browser Viewport mock in background (faint dashboard visual) */}
        <div className="absolute inset-0 top-10 p-5 flex flex-col justify-between pointer-events-none opacity-[0.06] select-none z-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-600" />
              <span className="h-3.5 w-16 bg-slate-700 rounded" />
            </div>
            <div className="flex gap-2">
              <span className="h-2 w-8 bg-slate-800 rounded" />
              <span className="h-2 w-8 bg-slate-800 rounded" />
            </div>
          </div>
          <div className="my-auto space-y-3.5 max-w-[260px]">
            <div className="h-5 w-40 bg-slate-600 rounded-lg" />
            <div className="h-3 w-52 bg-slate-800 rounded" />
            <div className="h-3 w-44 bg-slate-800 rounded" />
            <div className="flex gap-2 pt-1">
              <span className="h-7 w-20 bg-emerald-700 rounded-lg" />
              <span className="h-7 w-16 bg-slate-800 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-slate-800 bg-slate-900 rounded-xl p-3.5 h-12" />
            <div className="border border-slate-800 bg-slate-900 rounded-xl p-3.5 h-12" />
            <div className="border border-slate-800 bg-slate-900 rounded-xl p-3.5 h-12" />
          </div>
        </div>

        {/* Floating Chat Panel overlay */}
        <div
          className={`absolute bottom-16 right-4 w-[285px] sm:w-[305px] h-[345px] rounded-2xl border border-line bg-surface shadow-lift flex flex-col overflow-hidden z-20 origin-bottom-right transition-all duration-300 ${
            isOpen
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-90 opacity-0 pointer-events-none translate-y-4"
          }`}
        >
          {/* Chat Panel Header */}
          <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 px-3.5 py-2.5 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-success rounded-full animate-pulse border border-white" />
              <div className="text-left">
                <div className="text-[11.5px] font-bold font-display leading-tight">KaliGanAI Sales Agent</div>
                <div className="text-[9px] text-emerald-100/90 leading-none">Online & ready to qualify</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {mode === "A" ? (
                <button
                  onClick={() => setMode("B")}
                  className="text-[9.5px] font-bold bg-white/10 hover:bg-white/20 border border-white/25 px-2.5 py-0.5 rounded-full transition-colors flex items-center gap-0.5 text-white focus:outline-none"
                >
                  🔗 Scan Site
                </button>
              ) : (
                <button
                  onClick={() => setMode("A")}
                  className="text-[9.5px] font-bold bg-white/10 hover:bg-white/20 border border-white/25 px-2.5 py-0.5 rounded-full transition-colors flex items-center gap-0.5 text-white focus:outline-none"
                >
                  💬 Back
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-emerald-100 transition-colors focus:outline-none"
                aria-label="Minimize chat"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Website Scan Overlay inside Widget Panel */}
          {mode === "B" && !ingesting && (
            <div className="flex-1 flex flex-col justify-center p-5 text-center bg-surface-2/30">
              <div className="space-y-3">
                <span className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 grid place-items-center mx-auto shadow-soft">
                  <I.Code width={18} height={18} />
                </span>
                <h4 className="font-display font-bold text-[13px] text-ink">Train AI on your live site</h4>
                <p className="text-ink-muted text-[10.5px] leading-relaxed max-w-[200px] mx-auto">
                  Paste your URL. Our crawler will index your home page to ground this chat widget.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!url.trim()) return;
                    setMode("A");
                    startDemo({ url: url.trim() });
                  }}
                  className="space-y-2 max-w-[190px] mx-auto pt-1"
                >
                  <input
                    required
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="input text-center text-xs !py-1.5 bg-white"
                  />
                  <button
                    type="submit"
                    className="btn btn-primary w-full !py-1.5 text-[10.5px] font-bold"
                  >
                    Scan & Build Teammate
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Crawler / Ingestion Loader screen */}
          {ingesting && (
            <div className="flex-1 flex flex-col justify-center items-center p-5 text-center bg-surface-2/30">
              <div className="space-y-3">
                <span className="w-9 h-9 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin flex items-center justify-center mx-auto" />
                <h4 className="font-display font-bold text-[12px] text-ink">Ingesting & Grounding...</h4>
                <p className="text-ink-muted text-[9.5px] leading-relaxed max-w-[180px] mx-auto">
                  {url ? `Crawling homepage details...` : "Initializing Sales Teammate..."}
                </p>
              </div>
            </div>
          )}

          {/* Active Voice Call Overlay screen */}
          {(connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) && (
            <div className="flex-1 flex flex-col justify-between bg-slate-950 text-white p-3.5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-emerald-950/20 -z-10" />
              
              <div className="text-center shrink-0">
                <div className="text-[7.5px] uppercase tracking-[0.15em] text-slate-400 font-bold leading-none">Web Voice Demo</div>
                <div className="text-[11px] font-bold text-white mt-1 leading-none">KaliGanAI Sales Agent</div>
                <div className="text-[9px] text-emerald-400 mt-1 flex items-center justify-center gap-1 leading-none">
                  <span className="w-1 h-1 rounded-full bg-success animate-pulse" />
                  <span className="font-semibold text-slate-300">
                    {connectionState === ConnectionState.CONNECTING ? "Connecting..." : "Active voice call"}
                  </span>
                </div>
              </div>

              <div className="relative w-18 h-18 mx-auto my-1.5 grid place-items-center bg-emerald-950/40 rounded-full border border-emerald-800/40 shrink-0">
                <Orb
                  className="w-14 h-14"
                  voiceLevel={connectionState === ConnectionState.CONNECTED ? orbVoiceLevel : undefined}
                  enableVoiceControl={false}
                />
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 space-y-2 text-left text-[10px] leading-relaxed scrollbar-none mb-2.5 max-h-[85px]">
                {voiceError ? (
                  <div className="text-red-400 text-center py-2">⚠ {voiceError}</div>
                ) : voiceMessages.length === 0 ? (
                  <div className="text-slate-400 text-center py-2 text-[9.5px]">Connecting... Try speaking once visualizer moves.</div>
                ) : (
                  voiceMessages.map((line, i) => (
                    <div key={i} className="space-y-0.5">
                      <div className={`font-bold uppercase text-[7.5px] tracking-wider ${
                        line.role === 'model' ? "text-emerald-400" : "text-slate-400"
                      }`}>
                        {line.role === 'model' ? "AI Agent" : "You"}
                      </div>
                      <div className="text-slate-200">{line.content}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="pb-0.5 shrink-0 flex justify-center">
                <button
                  onClick={handleVoiceToggle}
                  className="w-8.5 h-8.5 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lift transition-all hover:scale-105"
                  aria-label="Hang up call"
                >
                  <svg className="w-4 h-4 transform rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Active Chat Conversation Log */}
          {demoId && !ingesting && mode === "A" && connectionState === ConnectionState.DISCONNECTED && (
            <div className="flex-1 flex flex-col overflow-hidden bg-surface">
              {/* Context subheader */}
              <div className="bg-surface-2/80 px-3 py-1.5 border-b border-line flex items-center justify-between text-[9.5px] shrink-0 select-none">
                <div className="flex items-center gap-1 text-ink-muted">
                  <span className="w-1.5 h-1.5 bg-success rounded-full pulse-dot" />
                  <span className="truncate max-w-[120px]">
                    {url ? `Grounded: ${url.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}` : "General Sandbox (SaaS)"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVoiceToggle}
                    className="font-bold px-2 py-0.5 rounded-full text-[9px] text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-0.5 focus:outline-none"
                  >
                    <I.Mic width={8} height={8} fill="#fff" />
                    Call AI
                  </button>
                  <button
                    onClick={handleReset}
                    className="text-emerald-700 hover:underline font-bold"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Scrollable messages container */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 scrollbar-none flex flex-col text-left">
                {error && (
                  <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[10px] rounded-lg mb-2">
                    ⚠ {error}
                  </div>
                )}
                
                {messages.map((m, idx) => {
                  const isAgent = m.role === "agent";
                  return (
                    <div key={idx} className={`max-w-[85%] flex flex-col ${isAgent ? "items-start" : "items-end ml-auto"}`}>
                      <div className="text-[8px] text-ink-muted mb-0.5 uppercase tracking-wider font-bold">
                        {isAgent ? "Teammate" : "You"}
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-2xl text-[11px] leading-relaxed inline-block border ${
                          isAgent
                            ? "bg-emerald-50 border-mint-300 rounded-tl-sm text-ink"
                            : "bg-surface-2 border-line rounded-tr-sm text-ink"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}

                {loadingReply && (
                  <div className="max-w-[85%] flex flex-col items-start">
                    <div className="text-[8px] text-ink-muted mb-0.5 uppercase font-bold">Teammate</div>
                    <div className="px-2.5 py-1.5 rounded-2xl bg-emerald-50 border border-mint-300 rounded-tl-sm flex items-center gap-0.5">
                      <span className="w-1 h-1 bg-emerald-700 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                      <span className="w-1 h-1 bg-emerald-700 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <span className="w-1 h-1 bg-emerald-700 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                )}

                {/* Lead Captured Alert Banner */}
                {capturedLead && (
                  <div className="p-2 bg-emerald-50 border border-mint-300 rounded-xl flex items-start gap-2 animate-bounce-once mt-1 select-none">
                    <span className="text-[11px]">🎯</span>
                    <div className="text-left">
                      <b className="text-[9.5px] text-emerald-800 font-bold block">Autopilot: Lead Captured!</b>
                      <span className="text-[9px] text-ink-muted leading-tight block">
                        AI identified buying intent ({capturedLead.score}) and qualified the contact.
                      </span>
                    </div>
                  </div>
                )}

                {/* In-chat suggestion chips (Only show under first message greeting) */}
                {messages.length === 1 && !loadingReply && (
                  <div className="pt-2 flex flex-col gap-1.5 max-w-[220px]">
                    <div className="text-[8.5px] font-bold text-ink-muted uppercase tracking-wider mb-0.5">Suggested Questions:</div>
                    {[
                      { q: "💬 How does it capture leads?", text: "How does lead capture work?" },
                      { q: "📞 Can we make voice calls?", text: "Can we use voice calls?" },
                      { q: "💰 What are the pricing plans?", text: "What is the pricing?" }
                    ].map((s) => (
                      <button
                        key={s.q}
                        onClick={() => handleSendSuggestion(s.q)}
                        className="text-left text-[10px] font-semibold text-emerald-800 bg-emerald-50/50 hover:bg-emerald-50 border border-mint-200 hover:border-mint-300 rounded-xl px-2.5 py-1.5 transition-all hover:scale-[1.02] duration-200 focus:outline-none"
                      >
                        {s.q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Panel Footer Input Form */}
              <form onSubmit={handleSendMessage} className="p-2 border-t border-line flex gap-2 bg-surface-2 shrink-0 select-none">
                <input
                  required
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loadingReply}
                  className="input !bg-white text-[11px] !py-1.5 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loadingReply}
                  className="btn btn-primary !py-1.5 text-[10px] font-bold px-2.5"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Circular Floating Launcher Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute bottom-5 right-5 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lift cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 z-30 focus:outline-none"
          aria-label="Toggle chat widget"
        >
          {isOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
/* =============================== HOME ============================= */
export function Home() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-br from-canvas via-[#EDF5DE] to-[#E5EED1]">
      {/* HERO */}
      <section className="relative pt-16 md:pt-20 pb-16">
        <Glow className="-top-44 right-[-120px] opacity-60" variant={1} />
        <Glow className="top-1/3 left-[-200px] opacity-40" variant={2} />
        <Dots className="inset-0 opacity-70" />
        <div className="max-w-6xl mx-auto px-6 md:px-8 grid md:grid-cols-[1.05fr_.95fr] gap-12 items-center relative z-10">
          <div>
            <div className="fadeup"><Eyebrow>AI employee · chat + voice</Eyebrow></div>
            <h1 className="font-display text-[42px] md:text-[58px] font-bold leading-[1.03] mt-5 fadeup text-ink" style={{ animationDelay: ".05s" }}>
              Your website's <span className="text-emerald-700 font-extrabold relative inline-block">hardest-working employee.<span className="absolute bottom-1 left-0 w-full h-[6px] bg-teal-200/60 -z-10 rounded-full" /></span>
            </h1>
            <p className="text-ink-muted text-[17px] leading-relaxed mt-5 max-w-lg fadeup" style={{ animationDelay: ".1s" }}>
              An AI that chats, talks, and turns visitors into qualified leads — grounded in your business, live in minutes.
            </p>
            <div className="flex flex-wrap gap-3 mt-8 fadeup" style={{ animationDelay: ".15s" }}>
              <Link to="/signup" className="btn btn-primary !px-8 !py-3.5 text-[15.5px] shadow-lift hover:translate-y-[-1px] transition-transform duration-200">Start free <I.ArrowRight width={16} height={16} /></Link>
              <a href="#how" className="btn btn-ghost !px-8 !py-3.5 text-[15.5px] hover:translate-y-[-1px] transition-transform duration-200">See how it works</a>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-7 text-[13px] text-ink-muted/90 fadeup" style={{ animationDelay: ".2s" }}>
              {["No code — one snippet", "Live in 5 minutes", "Cancel anytime"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 font-medium"><I.Check width={14} height={14} className="text-success" strokeWidth={2.5} />{t}</span>
              ))}
            </div>
          </div>

          {/* product visual */}
          <div className="relative fadeup" style={{ animationDelay: ".18s" }}>
            <InteractiveDemo />
          </div>
        </div>


      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-6xl mx-auto px-6 md:px-8 py-20">
        <SectionHead eyebrow="3 steps · 5 minutes" title="From visitor to lead, on autopilot" sub="No engineers, no long setup. Teach it once and it works around the clock." />
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { t: "Connect your knowledge", d: "Paste your website URL, upload documents, PDFs, or sync text files. The AI learns your business details instantly.", icon: <I.Book width={20} height={20} /> },
            { t: "Configure your employee", d: "Give your AI teammate a role, customize its goal (sales, support, routing), and select its conversational voice.", icon: <I.Cog width={20} height={20} /> },
            { t: "Deploy", d: "Embed the chat widget with one line of code, and connect a dedicated phone number to start receiving voice calls.", icon: <I.Code width={20} height={20} /> },
          ].map((s, i) => (
            <div key={s.t} className="card p-6 relative fadeup" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="flex items-center justify-between mb-4">
                <span className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center">{s.icon}</span>
                <span className="font-display text-[28px] font-bold text-line">0{i + 1}</span>
              </div>
              <h3 className="font-display font-bold text-lg">{s.t}</h3>
              <p className="text-ink-muted text-[14px] mt-1.5 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURE BENTO */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 pb-20">
        <SectionHead eyebrow="Everything in one place" title="An employee, not just a chatbot" sub="It doesn't just chat — it knows your business, talks out loud, and brings you customers." />
        <div className="grid md:grid-cols-3 gap-5">
          {/* Block 1: Grounded chat */}
          <div className="card p-6 md:col-span-2 flex flex-col justify-between min-h-[300px] border border-line bg-surface relative overflow-hidden group hover:border-emerald-600/40 transition duration-300">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center"><I.Sparkle width={20} height={20} /></span>
                <h3 className="font-display font-bold text-lg text-ink">Grounded chat</h3>
              </div>
              <p className="text-ink-muted text-[14.5px] leading-relaxed max-w-lg">
                Answers only from your data, never invents. Grounded in your own documents, files, and web pages. If it doesn't know the answer, it gracefully takes details so a team member can follow up.
              </p>
            </div>
            
            <div className="mt-6">
              <div className="text-[11px] font-bold text-ink-muted/80 uppercase tracking-wider mb-2">Synced Knowledge Sources</div>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { name: "📄 Services.pdf", size: "1.2 MB" },
                  { name: "❓ Pricing FAQ", size: "24 entries" },
                  { name: "🔗 acme.com", size: "12 pages" },
                  { name: "📂 onboarding_guide.md", size: "15 KB" }
                ].map((c) => (
                  <span key={c.name} className="inline-flex items-center gap-2 bg-white border border-line rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-ink shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    {c.name}
                    <span className="text-[10px] text-ink-muted font-normal">({c.size})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Block 2: Web + phone voice */}
          <div className="card p-6 flex flex-col justify-between min-h-[300px] border border-line bg-surface relative overflow-hidden group hover:border-emerald-600/40 transition duration-300">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center"><I.Mic width={20} height={20} /></span>
                <span className="text-[10px] font-bold bg-teal-400 text-[#08332a] px-2 py-0.5 rounded-full tracking-wide">WEB & PHONE</span>
              </div>
              <h3 className="font-display font-bold text-lg text-ink">Web + phone voice</h3>
              <p className="text-ink-muted text-[14.5px] mt-2.5 leading-relaxed">
                Talks on your site and answers your number. A natural, real-time voice experience using the exact same knowledge base as your chat.
              </p>
            </div>
            
            <div className="mt-6 bg-emerald-950 text-white rounded-xl p-3 flex items-center justify-between border border-emerald-800/40 shadow-inner">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-900 grid place-items-center text-emerald-300">
                  <I.Phone width={14} height={14} fill="currentColor" />
                </span>
                <div className="text-left">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active Phone Line</div>
                  <div className="text-[12.5px] font-semibold text-white font-mono leading-none mt-0.5">+1 (800) KALI-GAN</div>
                </div>
              </div>
              <span className="flex items-center gap-1.5 bg-emerald-900 border border-emerald-700 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                Live
              </span>
            </div>
          </div>

          {/* Block 3: Lead capture & qualification */}
          <div className="card p-6 md:col-span-3 flex flex-col justify-between min-h-[300px] border border-line bg-surface relative overflow-hidden group hover:border-emerald-600/40 transition duration-300">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center"><I.Users width={20} height={20} /></span>
                <h3 className="font-display font-bold text-lg text-ink">Lead capture & qualification</h3>
              </div>
              <p className="text-ink-muted text-[14.5px] leading-relaxed max-w-2xl">
                Every conversation scored Hot/Warm/Cold and routed to you. The AI identifies buying signals, asks for key details at the perfect conversational moment, and drops the parsed lead profile straight into your workspace.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-surface-2 border border-line rounded-xl p-3 text-[12px] space-y-2">
                <div className="flex justify-between items-center text-[10px] text-ink-muted font-bold uppercase">
                  <span>Chat Conversation</span>
                  <span>Live Extract</span>
                </div>
                <div className="space-y-1.5 text-left">
                  <div>
                    <span className="text-emerald-700 font-bold">Visitor: </span>
                    <span className="text-ink-muted">Can I get a demo? My name is Sarah, email sarah@acme.com, phone 555-0199.</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 font-bold">AI Employee: </span>
                    <span className="text-ink-muted">Got it, Sarah! I've scheduled your demo and routed this to our team.</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-line rounded-xl p-3 flex flex-col justify-between shadow-soft">
                <div className="flex justify-between items-start">
                  <div className="text-left">
                    <div className="font-bold text-[13px] text-ink">Sarah Jenkins</div>
                    <div className="text-[11px] text-ink-muted">sarah@acme.com · acme.com</div>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-[#fdeceb] text-hot text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-hot animate-pulse" />
                    Hot Lead
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-line/60 flex justify-between items-center text-[11px]">
                  <span className="text-ink-muted">Intent: <b className="text-ink font-semibold">Demo Request</b></span>
                  <span className="text-ink-muted">Captured via: <b className="text-ink font-semibold">Website Chat</b></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VOICE HIGHLIGHT BAND */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 pb-20">
        <div className="rounded-[24px] text-white overflow-hidden relative grid md:grid-cols-[1fr_.8fr] gap-8 items-center p-8 md:p-12"
          style={{ background: "linear-gradient(150deg,#0E7A5F,#0B5A45)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(220px 220px at 88% 10%,rgba(95,201,176,.4),transparent 70%)" }} />
          <div className="relative">
            <span className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-1.5 text-[12.5px] font-semibold"><I.Mic width={13} height={13} /> Voice agent</span>
            <h2 className="font-display text-[30px] md:text-[36px] font-bold leading-[1.1] mt-4">Your visitors can just talk to it.</h2>
            <p className="text-white/85 text-[15.5px] mt-3 max-w-md">A natural, real-time voice conversation — answering instantly from your knowledge base and capturing leads, the same as chat. The thing no plain chatbot does.</p>
            <Link to="/signup" className="btn bg-white text-emerald-700 hover:bg-[#eafaf3] !px-6 !py-3 mt-6 inline-flex">Try the voice agent</Link>
          </div>
          <div className="relative grid place-items-center py-2">
            <div className="absolute rounded-full border-2 border-white/30" style={{ width: 150, height: 150, animation: "ring 2.6s ease-out infinite" }} />
            <div className="absolute rounded-full border-2 border-white/30" style={{ width: 150, height: 150, animation: "ring 2.6s ease-out infinite 1.3s" }} />
            <div className="w-[92px] h-[92px] rounded-full grid place-items-center border border-white/30" style={{ background: "rgba(255,255,255,.16)" }}>
              <div className="flex items-end gap-[3px] h-[28px]">
                {[0, .15, .3, .45, .2].map((d, i) => <i key={i} className="w-[3px] rounded bg-[#CFF3E6]" style={{ animation: "eq .9s ease-in-out infinite", animationDelay: `${d}s`, height: 7 }} />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 pb-20">
        <SectionHead eyebrow="Simple pricing" title="Start free. Upgrade when it's working." sub="Most tools make you pay extra for everything. Voice is included on Growth." />
        <PricingGrid />
        <p className="text-center text-ink-muted text-[12.5px] mt-5">Prices in USD per month · cancel anytime · voice usage may apply on high volume.</p>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 md:px-8 pb-20">
        <SectionHead eyebrow="Good questions" title="The things people ask first" />
        <FaqList />
      </section>

      {/* FINAL CTA */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 pb-24">
        <div className="rounded-[24px] text-center py-16 px-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#0E7A5F,#0B5A45)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(260px 200px at 50% 0%,rgba(95,201,176,.35),transparent 70%)" }} />
          <h2 className="font-display text-[32px] md:text-[40px] font-bold text-white relative">Your AI employee is one snippet away.</h2>
          <p className="text-white/85 mt-3 relative max-w-md mx-auto">Set it up in five minutes and let it start capturing leads tonight.</p>
          <Link to="/signup" className="btn bg-white text-emerald-700 hover:bg-[#eafaf3] !px-7 !py-3 mt-7 inline-flex relative">Start free <I.ArrowRight width={16} height={16} /></Link>
        </div>
      </section>
    </main>
  );
}

/* ====================== SHARED: PRICING + FAQ ===================== */
const tiers = [
  {
    name: "Starter",
    priceMonthly: "$39",
    priceYearly: "$31",
    tag: "For getting your first leads",
    cta: "Start free",
    popular: false,
    features: [
      "Chat AI on your website",
      "Answers from your knowledge base",
      "Lead capture + scoring",
      "Up to 500 messages / mo",
      "Voice calls not included",
      "Email support"
    ]
  },
  {
    name: "Growth",
    priceMonthly: "$129",
    priceYearly: "$99",
    tag: "Voice included — most popular",
    cta: "Start free",
    popular: true,
    features: [
      "Everything in Starter",
      "Real-time voice agent (web)",
      "120 voice minutes / mo included",
      "Unlimited chat conversations",
      "BYON (Bring Your Own Number) option",
      "Remove KaliGanAI branding",
      "Priority email/chat support"
    ]
  },
  {
    name: "Agency",
    priceMonthly: "Custom",
    priceYearly: "Custom",
    tag: "For teams & resellers",
    cta: "Talk to us",
    popular: false,
    features: [
      "Everything in Growth",
      "Unlimited voice minutes (volume billing)",
      "Dedicated phone numbers included",
      "Full white-label dashboard & widget",
      "Multi-workspace team access",
      "BYON support & custom integrations",
      "Dedicated account manager & SLA"
    ]
  },
];

export function PricingGrid() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  return (
    <div className="space-y-10">
      {/* Billing toggle */}
      <div className="flex justify-center items-center gap-3">
        <span className={`text-sm font-semibold transition ${billing === "monthly" ? "text-ink font-bold" : "text-ink-muted"}`}>Monthly</span>
        <button
          onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-emerald-600"
          role="switch"
          aria-checked={billing === "yearly"}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              billing === "yearly" ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className={`text-sm font-semibold transition ${billing === "yearly" ? "text-ink font-bold" : "text-ink-muted"} flex items-center gap-1.5`}>
          Yearly <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Save 20%</span>
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-4 items-start">
        {tiers.map((t, i) => {
          const price = billing === "yearly" ? t.priceYearly : t.priceMonthly;
          return (
            <div key={t.name}
              className={`card p-6 relative fadeup ${t.popular ? "border-emerald-600 border-[1.5px] shadow-lift md:-mt-2" : ""}`}
              style={{ animationDelay: `${i * 0.06}s` }}>
              {t.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold bg-emerald-600 text-white px-3 py-1 rounded-full tracking-wide">MOST POPULAR</span>}
              <div className="font-display font-bold text-lg">{t.name}</div>
              <div className="text-ink-muted text-[12.5px] mt-0.5">{t.tag}</div>
              <div className="mt-4 mb-5 flex items-end gap-1">
                <span className="font-display text-[38px] font-bold leading-none">{price}</span>
                {price !== "Custom" && <span className="text-ink-muted text-[13px] mb-1">/mo</span>}
              </div>
              <Link to={t.name === "Agency" ? "/contact" : "/signup"} className={`btn w-full ${t.popular ? "btn-primary" : "btn-ghost"}`}>{t.cta}</Link>
              <ul className="mt-5 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13.5px]">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center mt-0.5 shrink-0"><I.Check width={11} height={11} /></span>{f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const faqs: [string, string][] = [
  ["How is this different from a normal chatbot?", "It answers only from your own business knowledge — no generic or made-up replies — and it actively captures and scores leads. It can also speak over voice, not just type."],
  ["Will it make things up?", "No. It's grounded in the sources you upload. If it doesn't know something, it says so and offers to take the visitor's details or hand off to you."],
  ["Do I need a developer?", "No. You paste one script tag on your site. We can also email the steps to your developer if you'd prefer they do it."],
  ["How long does setup take?", "Most people are live in under five minutes — upload your docs, paste the snippet, done."],
  ["What about voice?", "Growth includes a web voice agent that speaks with visitors using the same knowledge base. Real phone numbers are available on the Agency plan."],
  ["Is my data private?", "Your knowledge base is scoped to your workspace and used only to answer your own visitors."],
];

export function FaqList() {
  return (
    <div className="flex flex-col gap-2.5">
      {faqs.map(([q, a], i) => (
        <details key={q} className="card p-0 group fadeup" style={{ animationDelay: `${i * 0.04}s` }}>
          <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none font-semibold text-[15px]">
            {q}
            <I.Chevron className="ml-auto text-ink-muted transition-transform group-open:rotate-180" />
          </summary>
          <p className="px-5 pb-4 -mt-1 text-ink-muted text-[14px] leading-relaxed">{a}</p>
        </details>
      ))}
    </div>
  );
}

/* ============================== FEATURES ========================== */
export function Features() {
  const rows = [
    { icon: <I.Book width={20} height={20} />, t: "Knowledge-grounded answers", d: "Upload PDFs, paste FAQs, or point it at your site. Your AI answers strictly from those sources — accurate, on-brand, and honest when it doesn't know." },
    { icon: <I.Users width={20} height={20} />, t: "Lead capture & scoring", d: "It recognises buying intent, asks for contact details at the right moment, and grades every lead Hot, Warm, or Cold so you call the right people first." },
    { icon: <I.Mic width={20} height={20} />, t: "Voice agent", d: "A real-time voice conversation on your website, powered by the same knowledge base as chat. Visitors can simply talk — and still become tracked, scored leads." },
    { icon: <I.Chat width={20} height={20} />, t: "Conversation tracking", d: "Every chat and call is saved, searchable, and tied to the lead it produced, so nothing slips through the cracks." },
    { icon: <I.Code width={20} height={20} />, t: "Five-minute install", d: "One snippet works on any site — WordPress, Shopify, React, plain HTML. No code, no engineers, no waiting." },
    { icon: <I.Dashboard width={20} height={20} />, t: "Outcome dashboard", d: "See conversations, captured leads, and hot opportunities at a glance — the numbers that actually grow revenue." },
  ];
  return (
    <main>
      <section className="relative overflow-hidden">
        <Glow className="-top-40 right-[-100px]" />
        <div className="max-w-3xl mx-auto px-6 md:px-8 pt-20 pb-12 text-center relative">
          <div className="flex justify-center mb-4"><Eyebrow>Features</Eyebrow></div>
          <h1 className="font-display text-[42px] font-bold leading-[1.08]">Everything it takes to convert a visitor</h1>
          <p className="text-ink-muted text-[16px] mt-4">Chat, voice, knowledge, and lead capture — working together as one employee.</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 md:px-8 pb-16">
        <div className="grid md:grid-cols-2 gap-4">
          {rows.map((r, i) => (
            <div key={r.t} className="card p-6 flex gap-4 fadeup" style={{ animationDelay: `${i * 0.05}s` }}>
              <span className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0">{r.icon}</span>
              <div>
                <h3 className="font-display font-bold text-[16.5px]">{r.t}</h3>
                <p className="text-ink-muted text-[14px] mt-1.5 leading-relaxed">{r.d}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link to="/signup" className="btn btn-primary !px-7 !py-3">Start free <I.ArrowRight width={16} height={16} /></Link>
        </div>
      </section>
    </main>
  );
}

/* ============================== PRICING =========================== */
export function Pricing() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <Glow className="-top-40 left-[-100px]" />
        <div className="max-w-3xl mx-auto px-6 md:px-8 pt-20 pb-10 text-center relative">
          <div className="flex justify-center mb-4"><Eyebrow>Pricing</Eyebrow></div>
          <h1 className="font-display text-[42px] font-bold leading-[1.08]">Pricing that pays for itself</h1>
          <p className="text-ink-muted text-[16px] mt-4">One captured customer usually covers the month. Start free and upgrade when it's working.</p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 md:px-8 pb-12">
        <PricingGrid />
        <p className="text-center text-ink-muted text-[12.5px] mt-5">Prices in USD per month · cancel anytime · voice usage may apply on high volume.</p>
      </section>
      <section className="max-w-3xl mx-auto px-6 md:px-8 pb-24">
        <SectionHead eyebrow="Questions" title="Pricing FAQ" />
        <FaqList />
      </section>
    </main>
  );
}

/* =============================== ABOUT ============================ */
export function About() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <Glow className="-top-40 right-[-100px]" />
        <div className="max-w-3xl mx-auto px-6 md:px-8 pt-20 pb-10 relative">
          <div className="mb-4"><Eyebrow>About</Eyebrow></div>
          <h1 className="font-display text-[42px] font-bold leading-[1.1]">We think every small business deserves a full-time employee that never sleeps.</h1>
          <p className="text-ink-muted text-[16px] mt-5 leading-relaxed">Most websites are silent at the exact moment a visitor is ready to buy. KaliGanAI fills that gap — an AI that knows your business, talks to visitors over chat and voice, and hands you qualified leads instead of letting them slip away. No call centre, no big team, no missed opportunities.</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 md:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { t: "Grounded, not guessy", d: "It only speaks from your knowledge. Trust comes first." },
            { t: "Built for non-technical teams", d: "If you can paste one line of text, you can run it." },
            { t: "Outcomes over vanity metrics", d: "We measure success in captured customers, not chat volume." },
          ].map((v, i) => (
            <div key={v.t} className="card p-6 fadeup" style={{ animationDelay: `${i * 0.06}s` }}>
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center mb-3"><I.Sparkle width={18} height={18} /></span>
              <h3 className="font-display font-bold text-[16px]">{v.t}</h3>
              <p className="text-ink-muted text-[14px] mt-1.5">{v.d}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12"><Link to="/signup" className="btn btn-primary !px-7 !py-3">Start free</Link></div>
      </section>
    </main>
  );
}

/* ============================== CONTACT =========================== */
export function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!name.trim()) throw new Error("Name is required");
      if (!email.trim()) throw new Error("Email is required");
      if (!message.trim()) throw new Error("Message is required");

      await api.post("/public/contact", {
        name,
        email,
        websiteUrl: websiteUrl || undefined,
        message,
      });

      setSuccess("Thank you! We've received your note and our team will get back to you shortly.");
      setName("");
      setEmail("");
      setWebsiteUrl("");
      setMessage("");
    } catch (err: any) {
      setError(err.message || "Failed to submit message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="relative overflow-hidden">
        <Glow className="-top-40 left-[-100px]" />
        <div className="max-w-5xl mx-auto px-6 md:px-8 pt-20 pb-16 grid md:grid-cols-2 gap-10 items-start relative">
          <div>
            <div className="mb-4"><Eyebrow>Contact</Eyebrow></div>
            <h1 className="font-display text-[40px] font-bold leading-[1.1]">Let's get your AI employee live.</h1>
            <p className="text-ink-muted text-[16px] mt-4 leading-relaxed">Questions about plans, voice, or white-label for your agency? Send a note and we'll get back within a day.</p>
            <div className="mt-6 space-y-3 text-[14px]">
              <div className="flex items-center gap-3"><span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center"><I.Chat width={16} height={16} /></span> hello@kaligan.ai</div>
              <div className="flex items-center gap-3"><span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center"><I.Bolt width={16} height={16} /></span> Avg. reply time under 24 hours</div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="card p-6 w-full">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[13px] font-medium leading-relaxed">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[13px] font-medium leading-relaxed">
                {success}
              </div>
            )}
            <label className="field-label">Name</label>
            <input
              required
              className="input mb-3"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            <label className="field-label">Work email</label>
            <input
              required
              type="email"
              className="input mb-3"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <label className="field-label">Company website</label>
            <input
              className="input mb-3"
              placeholder="https://acme.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              disabled={loading}
            />
            <label className="field-label">How can we help?</label>
            <textarea
              required
              className="input min-h-[110px] resize-y mb-4"
              placeholder="I run an agency and want to white-label this for clients…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>Send message <I.ArrowRight width={15} height={15} /></>
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

/* Kept for backward compatibility / any unfinished route. */
export function MarketingPage({ title }: { title: string }) {
  return (
    <main className="max-w-3xl mx-auto px-8 py-20 text-center">
      <h1 className="font-display text-4xl font-bold">{title}</h1>
      <p className="text-ink-muted mt-4">This page is scaffolded and ready to fill in.</p>
      <Link to="/signup" className="btn btn-primary mt-6 inline-flex">Start free</Link>
    </main>
  );
}

/* ============================ ADDITIONAL COMPONENTS ============================ */

export function LiveLeadsTicker() {
  const [leads, setLeads] = useState([
    { name: "Sarah K.", business: "Acme SaaS", value: "$499/mo", score: "Hot", time: "just now", scoreVal: 98 },
    { name: "James L.", business: "Apex Agency", value: "$1,200/mo", score: "Hot", time: "2 min ago", scoreVal: 94 },
    { name: "Elena R.", business: "West Real Estate", value: "$2,500/mo", score: "Warm", time: "5 min ago", scoreVal: 82 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLeads((prev) => {
        const next = [...prev];
        const names = ["Marcus T.", "Dianne W.", "Robert C.", "Sofia B.", "Vikram S."];
        const businesses = ["GrowthX", "Prime Properties", "SaaSify", "SolarTech", "Apex Retail"];
        const values = ["$399/mo", "$899/mo", "$1,500/mo", "$3,000/mo", "$600/mo"];
        const isHot = Math.random() > 0.3;
        const score = isHot ? "Hot" : "Warm";
        const scoreVal = isHot ? Math.floor(Math.random() * 15) + 85 : Math.floor(Math.random() * 15) + 70;

        next.unshift({
          name: names[Math.floor(Math.random() * names.length)],
          business: businesses[Math.floor(Math.random() * businesses.length)],
          value: values[Math.floor(Math.random() * values.length)],
          score,
          time: "just now",
          scoreVal
        });

        for (let i = 1; i < next.length; i++) {
          if (i === 1) next[i].time = "1 min ago";
          else if (i === 2) next[i].time = "4 min ago";
          else next[i].time = `${i * 3} min ago`;
        }

        if (next.length > 3) {
          next.pop();
        }
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2.5">
      {leads.map((lead, idx) => (
        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-line/60 shadow-soft transition-all duration-500 hover:scale-[1.02] hover:bg-white text-left">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
              {lead.name.split(" ").map(n => n[0]).join("")}
            </span>
            <div className="text-left leading-tight">
              <div className="text-[12.5px] font-bold text-ink leading-none">{lead.name}</div>
              <div className="text-[10.5px] text-ink-muted mt-1">{lead.business} ┬╖ {lead.value}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10.5px] text-ink-muted/80">{lead.time}</span>
            <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
              lead.score === "Hot" ? "bg-red-50 text-hot" : "bg-amber-50 text-warm"
            }`}>
              <span className={`w-1 h-1 rounded-full ${lead.score === "Hot" ? "bg-hot" : "bg-warm"} animate-pulse`} />
              {lead.scoreVal}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DialerMockup() {
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "connected" | "completed">("idle");
  const [transcript, setTranscript] = useState<{ role: "ai" | "caller"; text: string }[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<"ai" | "caller" | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  const script = [
    { role: "ai", text: "Thanks for calling Acme SaaS. I'm your AI sales assistant. How can I help you today?" },
    { role: "caller", text: "Hi, I need a tool that automatically captures website leads. Does your software support custom grounding?" },
    { role: "ai", text: "Yes! KaliGanAI grounds its answers entirely on your specific website or docs. If it doesn't know the answer, it asks for customer info rather than making it up." },
    { role: "caller", text: "That's exactly what we need. How much is the Growth plan?" },
    { role: "ai", text: "The Growth plan is $129/mo and includes unlimited chat conversations and voice support. Can I send a signup link to your email?" },
    { role: "caller", text: "Sure, my email is hello@acme.com." },
    { role: "ai", text: "Perfect! I've sent the signup link to hello@acme.com. Lead captured! Talk to you soon." }
  ];

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript]);

  const handleStartCall = () => {
    setCallStatus("calling");
    setTranscript([]);
    setActiveSpeaker(null);
    timerRef.current = setTimeout(() => {
      setCallStatus("connected");
      playDialogue(0);
    }, 1500);
  };

  const playDialogue = (index: number) => {
    if (index >= script.length) {
      timerRef.current = setTimeout(() => {
        setCallStatus("completed");
        setActiveSpeaker(null);
      }, 2000);
      return;
    }

    const item = script[index];
    setActiveSpeaker(item.role as "ai" | "caller");
    setTranscript((prev) => [...prev, { role: item.role as "ai" | "caller", text: item.text }]);

    timerRef.current = setTimeout(() => {
      playDialogue(index + 1);
    }, 3800);
  };

  const handleHangUp = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCallStatus("idle");
    setTranscript([]);
    setActiveSpeaker(null);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="w-[280px] h-[360px] bg-slate-900 rounded-[36px] border-[6px] border-slate-800 shadow-2xl relative flex flex-col justify-between overflow-hidden text-white font-sans">
      <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 rounded-b-xl z-20 flex items-center justify-center gap-1.5">
        <span className="w-8 h-1 bg-slate-700 rounded-full" />
        <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-emerald-950/40 -z-10" />

      <div className="pt-7 text-center shrink-0">
        <div className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold">Simulated Inbound Call</div>
        <div className="text-base font-bold text-white mt-0.5">KaliGanAI Sales Agent</div>
        <div className="text-[11px] text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
          {callStatus === "idle" && <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />}
          {callStatus === "calling" && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />}
          {callStatus === "connected" && <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />}
          {callStatus === "completed" && <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />}
          <span className="capitalize font-semibold text-xs text-slate-300">
            {callStatus === "idle" && "Ready to simulate"}
            {callStatus === "calling" && "Ringing..."}
            {callStatus === "connected" && "Active Session"}
            {callStatus === "completed" && "Call Ended"}
          </span>
        </div>
      </div>

      <div className="flex-1 px-4 py-3 overflow-hidden flex flex-col justify-center">
        {callStatus === "idle" && (
          <div className="text-center space-y-4">
            <button
              onClick={handleStartCall}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lift transition-all hover:scale-105"
            >
              <I.Phone width={22} height={22} fill="#fff" className="animate-pulse" />
            </button>
            <p className="text-[11.5px] text-slate-400 max-w-[180px] mx-auto leading-relaxed">
              Test how the AI assistant answers and captures lead information.
            </p>
          </div>
        )}

        {callStatus === "calling" && (
          <div className="text-center py-6 relative">
            <div className="absolute rounded-full border-2 border-emerald-500/30 inset-0 m-auto animate-ping" style={{ width: 100, height: 100 }} />
            <div className="absolute rounded-full border border-emerald-500/20 inset-0 m-auto animate-ping" style={{ width: 130, height: 130, animationDelay: "0.5s" }} />
            <div className="w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-lift relative z-10">
              <I.Phone width={22} height={22} fill="#fff" />
            </div>
          </div>
        )}

        {callStatus === "connected" && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="h-10 flex items-center justify-center gap-1 shrink-0 mb-2">
              {[...Array(9)].map((_, i) => {
                const isTalking = activeSpeaker === "ai" || activeSpeaker === "caller";
                const delay = `${i * 0.1}s`;
                let animName = "none";
                if (activeSpeaker === "ai") animName = "eq";
                else if (activeSpeaker === "caller") animName = "eq-soft";

                return (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      activeSpeaker === "ai" ? "bg-emerald-400" : "bg-slate-400"
                    }`}
                    style={{
                      height: isTalking ? "12px" : "4px",
                      animation: isTalking ? `${animName} 0.8s ease-in-out infinite` : "none",
                      animationDelay: delay
                    }}
                  />
                );
              })}
            </div>

            <style>{`
              @keyframes eq-soft { 0%,100% { height:6px } 50% { height:14px } }
            `}</style>

            <div className="flex-1 overflow-y-auto bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2.5 space-y-2 text-left text-[11px] leading-relaxed scrollbar-none">
              {transcript.map((line, i) => (
                <div key={i} className="space-y-0.5">
                  <div className={`font-bold uppercase text-[9px] tracking-wider ${
                    line.role === "ai" ? "text-emerald-400" : "text-slate-400"
                  }`}>
                    {line.role === "ai" ? "AI Agent" : "Caller"}
                  </div>
                  <div className="text-slate-200">{line.text}</div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}

        {callStatus === "completed" && (
          <div className="text-center space-y-3">
            <span className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <I.Check width={20} height={20} />
            </span>
            <div>
              <div className="text-[12px] font-bold text-white">Call Successful</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Qualifying result:</div>
            </div>
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl max-w-[200px] mx-auto text-left shadow-inner">
              <span className="block text-[8px] font-bold uppercase tracking-wider text-emerald-400">Lead Captured</span>
              <span className="block text-[11px] font-semibold text-slate-200 mt-0.5 truncate">hello@acme.com</span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-hot mt-1 bg-red-950/40 px-2 py-0.5 rounded-full border border-red-500/20">
                <span className="w-1.5 h-1.5 bg-hot rounded-full animate-ping" />
                Hot Lead (98%)
              </span>
            </div>
            <button
              onClick={handleStartCall}
              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline mt-1 focus:outline-none"
            >
              Simulate Again
            </button>
          </div>
        )}
      </div>

      <div className="pb-5 shrink-0 flex justify-center">
        {callStatus !== "idle" && callStatus !== "completed" ? (
          <button
            onClick={handleHangUp}
            className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lift transition-all hover:scale-105"
            aria-label="Hang up call"
          >
            <svg className="w-5 h-5 transform rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
        ) : (
          <span className="text-[10px] text-slate-500 tracking-wide font-medium">Powered by Gemini Live Audio</span>
        )}
      </div>
    </div>
  );
}

const competitorData: Record<string, {
  name: string;
  tagline: string;
  desc: string;
  strength: string;
  weakness: string;
  features: { name: string; kaligan: boolean | string; competitor: boolean | string; desc: string }[];
  summary: string;
}> = {
  chatgpt: {
    name: "ChatGPT & LLM Wrappers",
    tagline: "Why generic wrappers fall short of a dedicated lead employee.",
    desc: "LLM wrappers simply pipe user inputs to ChatGPT. They lack session state, business RAG grounding, lead scoring pipelines, and multi-channel voice integrations.",
    strength: "Cheap to spin up initially.",
    weakness: "Hallucinates answers, does not capture structured lead data, requires custom coding for voice, zero database integrations.",
    features: [
      { name: "Chat Widget", kaligan: "Included (One snippet)", competitor: "Custom code / No widget", desc: "Out-of-the-box chat embed that works on any website." },
      { name: "Voice Integration", kaligan: "Built-in (Web + BYON Phone)", competitor: "Requires Vapi/Twilio coding", desc: "Grounded voice conversations over browser and phone." },
      { name: "Lead Qualification", kaligan: "Auto-Scored (Hot/Warm/Cold)", competitor: "None (Raw transcript)", desc: "AI automatically rates intent and routes leads." },
      { name: "KB Grounding (RAG)", kaligan: "Yes (PDF, Crawler, FAQ)", competitor: "Manual prompt context only", desc: "Guaranteed business context with strict safety limits." },
      { name: "Stripe Billing/Gating", kaligan: "Built-in limits", competitor: "None", desc: "Easy team billing limits and usage metering." },
    ],
    summary: "ChatGPT is a generic calculator; KaliGanAI is a trained sales employee."
  },
  vapi: {
    name: "Vapi & Developer Voice APIs",
    tagline: "A complete leads platform, not just a developer endpoint.",
    desc: "Voice APIs provide excellent raw audio connections, but they leave RAG ingestion, database logging, lead scoring, and web chat widgets completely to you.",
    strength: "Great voice latency for developers.",
    weakness: "No built-in chat widget, no lead qualification dashboard, requires complex backend coding to connect data.",
    features: [
      { name: "Unified Chat + Voice", kaligan: "Yes (One KB template)", competitor: "Voice only (Separate tools)", desc: "Maintain single knowledge base for both text and voice agents." },
      { name: "Built-in RAG / Crawler", kaligan: "Yes (Scrapes instantly)", competitor: "No (Build your own vector DB)", desc: "Index websites or docs without coding database connections." },
      { name: "Lead Dashboard", kaligan: "Included (Full CRM sync)", competitor: "None (Developer logs)", desc: "View transcripts, outcomes, and contacts out-of-the-box." },
      { name: "Setup Difficulty", kaligan: "Zero Code (5 minutes)", competitor: "High (Websockets, Node, Python)", desc: "Go live without setting up servers or media bridges." },
      { name: "BYON Telephony", kaligan: "Included (Twilio webhook)", competitor: "Included", desc: "Connect your own phone number directly." },
    ],
    summary: "Why write thousands of lines of server orchestration when KaliGanAI does it all?"
  },
  generic: {
    name: "Legacy Chatbots (Intercom / Drift)",
    tagline: "Ditch the rigid rule-builders for intelligent reasoning.",
    desc: "Legacy chatbots rely on complex drag-and-drop decision trees that frustrate visitors. They charge premium enterprise rates and do not support voice calls.",
    strength: "Mature legacy integrations.",
    weakness: "Extremely expensive, rule-based trees that break, no voice support, painful manual configuration.",
    features: [
      { name: "Reasoning Model", kaligan: "Generative AI + Grounding", competitor: "Rigid Rule-Tree / Extra charge", desc: "AI dynamically answers questions instead of forcing paths." },
      { name: "Voice Support", kaligan: "Built-in Web + Phone", competitor: "None", desc: "Let customers speak directly to your agent." },
      { name: "Setup Time", kaligan: "5 minutes (Automatic)", competitor: "Weeks of flow chart building", desc: "AI learns directly from your site docs instantly." },
      { name: "Price Point", kaligan: "Sane pricing ($39/mo)", competitor: "Enterprise bloat ($400+/mo)", desc: "Pricing designed to scale with your team." },
      { name: "Lead Scoring", kaligan: "AI-based intent analysis", competitor: "Manual form-fields only", desc: "Determine lead temperature based on semantic dialogue." },
    ],
    summary: "Upgrade from 2018 decision-trees to a 2026 AI teammate."
  }
};

export function Compare() {
  const { competitor } = useParams<{ competitor: string }>();
  const compId = competitor && competitorData[competitor] ? competitor : "chatgpt";
  const data = competitorData[compId];

  return (
    <main className="relative overflow-hidden bg-gradient-to-br from-canvas via-[#EDF5DE] to-[#E5EED1] pb-24 min-h-[70vh]">
      <Glow className="-top-44 right-[-100px] opacity-60" />
      <Dots className="inset-0 opacity-60" />

      <div className="max-w-4xl mx-auto px-6 md:px-8 pt-16 md:pt-20 relative z-10">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="text-center md:text-left mb-12">
          <span className="inline-flex items-center gap-2 bg-emerald-50 border border-mint-300 rounded-full px-3 py-1.5 text-[11.5px] font-bold text-emerald-800 uppercase tracking-wider mb-4">
            KaliGanAI vs {data.name}
          </span>
          <h1 className="font-display text-[36px] md:text-[46px] font-bold leading-[1.1] text-ink">
            {data.tagline}
          </h1>
          <p className="text-ink-muted text-[16px] leading-relaxed mt-4 max-w-2xl">
            {data.desc}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-mint-300/50 backdrop-blur-sm">
            <div className="font-display font-bold text-emerald-800 text-[12px] uppercase tracking-wider mb-2">Our Advantage</div>
            <p className="text-ink text-[14px] leading-relaxed">
              We sync both website chat and voice calls to a single, easily trained knowledge base. No coding servers or designing decision charts.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white/40 border border-line/60 backdrop-blur-sm">
            <div className="font-display font-bold text-ink-muted text-[12px] uppercase tracking-wider mb-2">{data.name} Limits</div>
            <p className="text-ink-muted text-[14px] leading-relaxed">
              {data.weakness}
            </p>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-line shadow-lift overflow-hidden mb-12">
          <div className="p-5 border-b border-line bg-surface-2/40">
            <h3 className="font-display font-bold text-base text-ink">Feature Comparison Matrix</h3>
            <p className="text-[12px] text-ink-muted">A clear breakdown of capabilities and setup time.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13.5px]">
              <thead>
                <tr className="bg-surface-2 border-b border-line">
                  <th className="p-4 font-bold text-ink">Capability</th>
                  <th className="p-4 font-bold text-emerald-700">KaliGanAI</th>
                  <th className="p-4 font-bold text-ink-muted">{data.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {data.features.map((f, i) => (
                  <tr key={i} className="hover:bg-white/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-ink">{f.name}</div>
                      <div className="text-[11.5px] text-ink-muted mt-0.5 leading-normal">{f.desc}</div>
                    </td>
                    <td className="p-4 font-semibold text-emerald-800">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {f.kaligan}
                      </span>
                    </td>
                    <td className="p-4 text-ink-muted font-medium">
                      {f.competitor === "None" || f.competitor.toString().includes("No") || f.competitor.toString().includes("Custom") ? (
                        <span className="flex items-center gap-1.5 text-ink-muted/70">
                          <svg className="w-3.5 h-3.5 text-ink-muted/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {f.competitor}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          {f.competitor}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-7 rounded-2xl bg-emerald-900 text-white text-center shadow-lift relative overflow-hidden mb-12">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(300px 300px at 50% 0%,rgba(95,201,176,.2),transparent 75%)" }} />
          <span className="text-[20px] mb-2 block font-display italic">"{data.summary}"</span>
          <div className="text-[12.5px] text-emerald-200/90 font-bold uppercase tracking-wider">Bottom Line</div>
        </div>

        <div className="bg-white/40 border border-line/60 rounded-3xl p-8 text-center backdrop-blur-md">
          <h2 className="font-display text-2xl font-bold text-ink">Ready to deploy a true AI employee?</h2>
          <p className="text-ink-muted text-sm mt-2 max-w-md mx-auto">Get live in 5 minutes with a single script embed. Start your free trial today, no credit card required.</p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/signup" className="btn btn-primary px-6 py-2.5">Start Free Trial</Link>
            <Link to="/contact" className="btn btn-ghost px-6 py-2.5">Talk to Us</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
