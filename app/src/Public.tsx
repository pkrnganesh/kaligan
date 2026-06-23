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
            <NavLink to="/compare/sintra" className={link}>Compare</NavLink>
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
              <NavLink to="/compare/sintra" className={mobileLink} onClick={() => setMobileMenuOpen(false)}>Compare</NavLink>
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
            ["Compare", ["vs AI Marketplaces", "/compare/sintra"], ["vs Voice APIs", "/compare/vapi"], ["vs Legacy Chatbots", "/compare/generic"]],
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

const AI_EMPLOYEES = [
  {
    id: "maya",
    name: "Maya",
    title: "Maya — Sales Teammate",
    role: "Sales & Growth",
    desc: "Grounded lead capture assistant.",
    vertical: "saas",
    avatar: "/maya_astronaut.png",
    color: "from-emerald-600 to-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    avatarBg: "bg-emerald-100 text-emerald-800",
    badgeColor: "bg-emerald-100 text-emerald-800",
    greeting: "Hi! I'm Maya, your Sales Assistant. I help turn website visitors into qualified leads. Want to see how I score leads or try a voice call?",
    suggestions: [
      { q: "💬 How does lead capture work?", text: "How does lead capture work?" },
      { q: "📞 Can we make voice calls?", text: "Can we use voice calls?" },
      { q: "💰 What are the pricing plans?", text: "What is the pricing?" }
    ]
  },
  {
    id: "dexter",
    name: "Dexter",
    title: "Dexter — Services Teammate",
    role: "Local Services",
    desc: "24/7 service & faq coordinator.",
    vertical: "services",
    avatar: "/dexter_astronaut.png",
    color: "from-blue-600 to-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    avatarBg: "bg-blue-100 text-blue-800",
    badgeColor: "bg-blue-100 text-blue-800",
    greeting: "Hello! I'm Dexter. I coordinate house and commercial cleaning services. Ask me about pricing or booking slots!",
    suggestions: [
      { q: "🧹 What services do you offer?", text: "What services do you offer?" },
      { q: "💰 Show me your pricing FAQ", text: "What is your pricing?" },
      { q: "📅 How do I book a cleaning slot?", text: "How do I book a cleaning?" }
    ]
  },
  {
    id: "milli",
    name: "Milli",
    title: "Milli — Agency Scout",
    role: "Marketing Agency",
    desc: "Prospect qualification expert.",
    vertical: "agency",
    avatar: "/milli_astronaut.png",
    color: "from-violet-600 to-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    avatarBg: "bg-violet-100 text-violet-800",
    badgeColor: "bg-violet-100 text-violet-800",
    greeting: "Hello! I'm Milli, representing Apex Digital. I identify prospective client needs. Want to check out our packages?",
    suggestions: [
      { q: "📈 What digital marketing packages do you have?", text: "What marketing packages do you offer?" },
      { q: "⚡ How do I book a strategy session?", text: "How do I book a strategy session?" },
      { q: "💼 Can you route leads to my CRM?", text: "How are leads captured?" }
    ]
  }
];

function InteractiveDemo() {
  const [selectedEmployee, setSelectedEmployee] = useState(AI_EMPLOYEES[0]);
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

  const startDemo = async (payload: { vertical?: string; url?: string }, customGreeting?: string) => {
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
      setMessages([{ role: "agent", content: customGreeting || res.greeting }]);
    } catch (err: any) {
      setError(err.message || "Failed to initialize demo. Please try again.");
    } finally {
      setIngesting(false);
    }
  };

  // Initialize default demo on mount (Maya - SaaS Sales Teammate)
  useEffect(() => {
    startDemo({ vertical: "saas" }, AI_EMPLOYEES[0].greeting);
  }, []);

  const handleSelectEmployee = (emp: typeof AI_EMPLOYEES[0]) => {
    disconnect();
    setSelectedEmployee(emp);
    setUrl("");
    setMode("A");
    setCapturedLead(null);
    startDemo({ vertical: emp.vertical }, emp.greeting);
  };

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
    startDemo({ vertical: selectedEmployee.vertical }, selectedEmployee.greeting);
  };

  return (
    <div className="relative w-full max-w-[460px] mx-auto">
      {/* Web browser mockup container - LIGHT THEME */}
      <div className="bg-white border border-slate-200 rounded-3xl h-[470px] w-full relative overflow-hidden shadow-lift flex flex-col">
        
        {/* Browser Top Bar */}
        <div className="bg-slate-50 px-4 py-2 flex items-center gap-3 shrink-0 select-none border-b border-slate-200/60">
          <div className="flex gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="bg-white border border-slate-200/80 rounded-lg px-3 py-0.5 text-[9.5px] text-slate-400 font-mono w-full max-w-[200px] mx-auto text-center truncate">
            {url ? url.replace(/https?:\/\/(www\.)?/, '') : `${selectedEmployee.id}-website.com`}
          </div>
        </div>

        {/* Flex Split Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar AI Employee Directory */}
          <div className="w-[145px] sm:w-[155px] bg-slate-50 border-r border-slate-200/60 p-2.5 flex flex-col gap-2 shrink-0 select-none text-left">
            <div className="text-[8.5px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
              AI Employees
            </div>
            <div className="flex flex-col gap-2">
              {AI_EMPLOYEES.map((emp) => {
                const isSelected = selectedEmployee.id === emp.id;
                return (
                  <button
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp)}
                    className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all duration-200 hover:scale-[1.02] focus:outline-none ${
                      isSelected
                        ? "bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500/10"
                        : "bg-slate-50 border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${emp.color} text-white font-bold flex items-center justify-center text-[10.5px] shrink-0 relative shadow-sm overflow-hidden`}>
                      <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-success border border-white pulse-dot" />
                    </span>
                    <div className="truncate">
                      <div className="text-[10px] font-bold text-slate-800 leading-tight truncate">{emp.name}</div>
                      <div className="text-[7.5px] text-slate-400 leading-none truncate mt-0.5">{emp.role.split(" & ")[0]}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Main Web Viewport */}
          <div className="flex-1 bg-white relative overflow-hidden flex flex-col justify-end">
            
            {/* Viewport Grid Lines */}
            <div 
              className="absolute inset-0 opacity-[0.22] pointer-events-none" 
              style={{
                backgroundImage: "linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)",
                backgroundSize: "16px 16px"
              }}
            />
            
            {/* Mock website content inside viewport (extremely faint) */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none opacity-[0.06] select-none z-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-emerald-600" />
                  <span className="h-2.5 w-12 bg-slate-700 rounded" />
                </div>
              </div>
              <div className="my-auto space-y-2 max-w-[150px] pl-1">
                <div className="h-3 w-28 bg-slate-600 rounded" />
                <div className="h-2 w-36 bg-slate-800 rounded" />
                <div className="h-2 w-32 bg-slate-800 rounded" />
              </div>
            </div>

            {/* Floating Chat Panel overlay */}
            <div
              className={`absolute bottom-11 right-3.5 w-[225px] sm:w-[245px] h-[310px] rounded-2xl border border-line bg-surface shadow-lift flex flex-col overflow-hidden z-20 origin-bottom-right transition-all duration-300 ${
                isOpen
                  ? "scale-100 opacity-100 translate-y-0"
                  : "scale-90 opacity-0 pointer-events-none translate-y-4"
              }`}
            >
              {/* Chat Panel Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 py-2 text-white flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-6 h-6 rounded-full bg-white/20 overflow-hidden relative border border-white/10 shrink-0">
                    <img src={selectedEmployee.avatar} alt={selectedEmployee.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold font-display leading-tight">{selectedEmployee.name} — AI Teammate</div>
                    <div className="text-[8px] text-emerald-100/90 leading-none">Online & ready</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {mode === "A" ? (
                    <button
                      onClick={() => setMode("B")}
                      className="text-[8.5px] font-bold bg-white/10 hover:bg-white/20 border border-white/25 px-2 py-0.5 rounded-full transition-colors flex items-center gap-0.5 text-white focus:outline-none"
                    >
                      🔗 Scan
                    </button>
                  ) : (
                    <button
                      onClick={() => setMode("A")}
                      className="text-[8.5px] font-bold bg-white/10 hover:bg-white/20 border border-white/25 px-2 py-0.5 rounded-full transition-colors flex items-center gap-0.5 text-white focus:outline-none"
                    >
                      💬 Back
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:text-emerald-100 transition-colors focus:outline-none"
                    aria-label="Minimize chat"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Website Scan Overlay inside Widget Panel */}
              {mode === "B" && !ingesting && (
                <div className="flex-1 flex flex-col justify-center p-4 text-center bg-surface-2/30">
                  <div className="space-y-2">
                    <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center mx-auto shadow-soft">
                      <I.Code width={14} height={14} />
                    </span>
                    <h4 className="font-display font-bold text-[11px] text-ink">Train AI on your live site</h4>
                    <p className="text-ink-muted text-[9px] leading-relaxed max-w-[170px] mx-auto">
                      Paste your URL. Our crawler will index your home page to ground this chat widget.
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!url.trim()) return;
                        setMode("A");
                        startDemo({ url: url.trim() });
                      }}
                      className="space-y-1.5 max-w-[160px] mx-auto pt-1"
                    >
                      <input
                        required
                        type="url"
                        placeholder="https://yourwebsite.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="input text-center text-[10px] !py-1 bg-white"
                      />
                      <button
                        type="submit"
                        className="btn btn-primary w-full !py-1 text-[9.5px] font-bold"
                      >
                        Scan & Build Teammate
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Crawler / Ingestion Loader screen */}
              {ingesting && (
                <div className="flex-1 flex flex-col justify-center items-center p-4 text-center bg-surface-2/30">
                  <div className="space-y-2">
                    <span className="w-7 h-7 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin flex items-center justify-center mx-auto" />
                    <h4 className="font-display font-bold text-[11px] text-ink">Ingesting & Grounding...</h4>
                    <p className="text-ink-muted text-[8.5px] leading-relaxed max-w-[160px] mx-auto">
                      {url ? `Crawling homepage...` : "Initializing AI Teammate..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Active Voice Call Overlay screen */}
              {(connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) && (
                <div className="flex-1 flex flex-col justify-between bg-slate-950 text-white p-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-emerald-950/20 -z-10" />
                  
                  <div className="text-center shrink-0">
                    <div className="text-[6.5px] uppercase tracking-[0.15em] text-slate-400 font-bold leading-none">Web Voice Demo</div>
                    <div className="text-[10px] font-bold text-white mt-1 leading-none">{selectedEmployee.name} — AI Teammate</div>
                    <div className="text-[8px] text-emerald-400 mt-1 flex items-center justify-center gap-1 leading-none">
                      <span className="w-1 h-1 rounded-full bg-success animate-pulse" />
                      <span className="font-semibold text-slate-300">
                        {connectionState === ConnectionState.CONNECTING ? "Connecting..." : "Active voice call"}
                      </span>
                    </div>
                  </div>

                  <div className="relative w-14 h-14 mx-auto my-1 grid place-items-center bg-emerald-950/40 rounded-full border border-emerald-800/40 shrink-0">
                    <Orb
                      className="w-10 h-10"
                      voiceLevel={connectionState === ConnectionState.CONNECTED ? orbVoiceLevel : undefined}
                      enableVoiceControl={false}
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto bg-slate-900/60 border border-slate-800/80 rounded-xl p-2 space-y-1.5 text-left text-[9px] leading-relaxed scrollbar-none mb-2 max-h-[75px]">
                    {voiceError ? (
                      <div className="text-red-400 text-center py-1">⚠ {voiceError}</div>
                    ) : voiceMessages.length === 0 ? (
                      <div className="text-slate-400 text-center py-1 text-[8.5px]">Connecting... Speak once visualizer moves.</div>
                    ) : (
                      voiceMessages.map((line, i) => (
                        <div key={i} className="space-y-0.5">
                          <div className={`font-bold uppercase text-[7px] tracking-wider ${
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
                      className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lift transition-all hover:scale-105"
                      aria-label="Hang up call"
                    >
                      <svg className="w-3.5 h-3.5 transform rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
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
                  <div className="bg-surface-2/80 px-2.5 py-1 border-b border-line flex items-center justify-between text-[8.5px] shrink-0 select-none">
                    <div className="flex items-center gap-1 text-ink-muted">
                      <span className="w-1 h-1 bg-success rounded-full pulse-dot" />
                      <span className="truncate max-w-[100px]">
                        {url ? `Grounded: ${url.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}` : `Active: ${selectedEmployee.role}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleVoiceToggle}
                        className="font-bold px-1.5 py-0.5 rounded-full text-[8px] text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-0.5 focus:outline-none"
                      >
                        <I.Mic width={7} height={7} fill="#fff" />
                        Call
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
                  <div className="flex-1 p-2.5 overflow-y-auto space-y-2.5 scrollbar-none flex flex-col text-left">
                    {error && (
                      <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[9px] rounded-lg mb-1.5">
                        ⚠ {error}
                      </div>
                    )}
                    
                    {messages.map((m, idx) => {
                      const isAgent = m.role === "agent";
                      return (
                        <div key={idx} className={`max-w-[90%] flex gap-2 ${isAgent ? "items-start text-left" : "items-start ml-auto flex-row-reverse text-right"}`}>
                          {isAgent ? (
                            <div className="w-5.5 h-5.5 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-300 shrink-0 mt-1 shadow-sm">
                              <img src={selectedEmployee.avatar} alt={selectedEmployee.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-5.5 h-5.5 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 mt-1 flex items-center justify-center text-[9px] font-bold text-slate-500 shadow-sm font-display">
                              You
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <div className="text-[7.5px] text-ink-muted mb-0.5 uppercase tracking-wider font-bold">
                              {isAgent ? selectedEmployee.name : "You"}
                            </div>
                            <div
                              className={`px-2.5 py-1.5 rounded-xl text-[10px] leading-relaxed inline-block border ${
                                isAgent
                                  ? "bg-emerald-50 border-mint-300 rounded-tl-none text-ink text-left"
                                  : "bg-surface-2 border-line rounded-tr-none text-ink text-left"
                              }`}
                            >
                              {m.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {loadingReply && (
                      <div className="max-w-[90%] flex gap-2 items-start text-left">
                        <div className="w-5.5 h-5.5 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-300 shrink-0 mt-1 shadow-sm">
                          <img src={selectedEmployee.avatar} alt={selectedEmployee.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <div className="text-[7.5px] text-ink-muted mb-0.5 uppercase font-bold">{selectedEmployee.name}</div>
                          <div className="px-2 py-1.5 rounded-xl bg-emerald-50 border border-mint-300 rounded-tl-none flex items-center gap-0.5">
                            <span className="w-1 h-1 bg-emerald-700 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                            <span className="w-1 h-1 bg-emerald-700 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                            <span className="w-1 h-1 bg-emerald-700 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lead Captured Alert Banner */}
                    {capturedLead && (
                      <div className="p-2 bg-emerald-50 border border-mint-300 rounded-xl flex items-start gap-1.5 animate-bounce-once mt-1 select-none text-left">
                        <span className="text-[10px]">🎯</span>
                        <div className="text-left">
                          <b className="text-[9px] text-emerald-800 font-bold block">Autopilot: Lead Captured!</b>
                          <span className="text-[8.5px] text-ink-muted leading-tight block">
                            AI identified buying intent ({capturedLead.score}) and qualified the contact.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* In-chat suggestion chips (Only show under first message greeting) */}
                    {messages.length === 1 && !loadingReply && (
                      <div className="pt-1.5 flex flex-col gap-1 max-w-[210px]">
                        <div className="text-[8px] font-bold text-ink-muted uppercase tracking-wider mb-0.5">Suggested Questions:</div>
                        {selectedEmployee.suggestions.map((s) => (
                          <button
                            key={s.q}
                            onClick={() => handleSendSuggestion(s.q)}
                            className="text-left text-[9.5px] font-semibold text-emerald-800 bg-emerald-50/50 hover:bg-emerald-50 border border-mint-200 hover:border-mint-300 rounded-xl px-2 py-1 transition-all hover:scale-[1.02] duration-200 focus:outline-none"
                          >
                            {s.q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chat Panel Footer Input Form */}
                  <form onSubmit={handleSendMessage} className="p-2 border-t border-line flex gap-1.5 bg-surface-2 shrink-0 select-none">
                    <input
                      required
                      placeholder="Type a message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={loadingReply}
                      className="input !bg-white text-[10px] !py-1 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={loadingReply}
                      className="btn btn-primary !py-1 text-[9px] font-bold px-2"
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
              className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lift cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 z-30 focus:outline-none"
              aria-label="Toggle chat widget"
            >
              {isOpen ? (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export function Home() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-br from-canvas via-[#EDF5DE] to-[#E5EED1]">
      {/* HERO SECTION */}
      <section className="relative pt-20 md:pt-28 pb-16 text-center">
        <Glow className="-top-44 left-1/2 -translate-x-1/2 opacity-60" variant={1} />
        <Dots className="inset-0 opacity-70" />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="fadeup inline-flex justify-center"><Eyebrow>Introducing AI Employees</Eyebrow></div>
          <h1 className="font-display text-[46px] md:text-[68px] font-bold leading-[1.03] mt-5 fadeup text-ink">
            Hire AI Employees That <br className="hidden md:inline" />
            <span className="text-emerald-700 font-extrabold relative inline-block">Work Around the Clock.<span className="absolute bottom-2 left-0 w-full h-[8px] bg-teal-200/50 -z-10 rounded-full" /></span>
          </h1>
          <p className="text-ink-muted text-lg md:text-xl leading-relaxed mt-6 max-w-2xl mx-auto fadeup" style={{ animationDelay: ".1s" }}>
            Search, hire, and deploy pre-trained AI employees to capture leads, answer customer questions, and sync immediately with HubSpot, Slack, and Zapier.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-10 fadeup" style={{ animationDelay: ".15s" }}>
            <Link to="/signup" className="btn btn-primary !px-10 !py-4 text-[16px] shadow-lift hover:translate-y-[-1px] transition-all duration-200 bg-gradient-to-r from-emerald-600 to-emerald-700 border-none hover:shadow-lg">
              Hire AI Employee <I.ArrowRight className="ml-1.5" width={18} height={18} />
            </Link>
            <a href="#marketplace" className="btn btn-ghost !px-10 !py-4 text-[16px] border border-line hover:translate-y-[-1px] transition-all duration-200 bg-white hover:bg-slate-50">
              Browse Directory
            </a>
          </div>
          <div className="flex justify-center items-center gap-6 mt-8 text-[13.5px] text-ink-muted/95 fadeup" style={{ animationDelay: ".2s" }}>
            {["Start free", "No code required", "Cancel anytime"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 font-medium"><I.Check width={14} height={14} className="text-success" strokeWidth={2.5} />{t}</span>
            ))}
          </div>
        </div>

        {/* Sintra.ai styled premium group visual banner */}
        <div className="max-w-5xl mx-auto px-6 mt-16 relative z-10 fadeup" style={{ animationDelay: ".25s" }}>
          <div className="bg-white/40 backdrop-blur-md border border-white/60 p-3 rounded-[32px] shadow-lift">
            <div className="rounded-[24px] overflow-hidden shadow-soft border border-slate-200 bg-white relative group">
              <img 
                src="/hero_astronauts.png" 
                alt="KaliGanAI space-suit AI employees group" 
                className="w-full h-auto object-cover max-h-[380px] md:max-h-[460px] transform hover:scale-[1.01] transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEMO SANDBOX */}
      <section id="demo" className="max-w-6xl mx-auto px-6 md:px-8 py-16 relative z-10 border-t border-slate-100">
        <div className="grid md:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div className="text-left">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-mint-200 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
              Live Sandbox Test
            </span>
            <h2 className="font-display text-[36px] md:text-[44px] font-bold leading-tight mt-4 text-ink">
              Test drive your next <br />
              <span className="text-emerald-700">AI teammate right now</span>
            </h2>
            <p className="text-ink-muted text-[16px] leading-relaxed mt-4">
              Click on Maya, Dexter, or Milli in the mockup sidebar to swap their pre-trained profiles. Have a conversation over text chat, try calling them directly over voice, or crawl your own site live to test grounding.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex gap-3 items-start">
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center font-bold shrink-0 mt-0.5 shadow-sm">1</span>
                <div>
                  <h4 className="font-bold text-ink text-[15px]">Cosmetic Vertical Grounding</h4>
                  <p className="text-ink-muted text-[13.5px]">Swaps context templates instantly. Test local cleanings (Dexter) or SaaS sales questions (Maya).</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center font-bold shrink-0 mt-0.5 shadow-sm">2</span>
                <div>
                  <h4 className="font-bold text-ink text-[15px]">Real-Time Voice Viz</h4>
                  <p className="text-ink-muted text-[13.5px]">Click "Call" to speak out loud. Natural speech-to-speech engine with instant custom responses.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-emerald-500/5 rounded-[40px] blur-2xl -z-10" />
            <InteractiveDemo />
          </div>
        </div>
      </section>

      {/* READY-TO-HIRE AI EMPLOYEE DIRECTORY */}
      <section id="marketplace" className="max-w-6xl mx-auto px-6 md:px-8 py-20 relative z-10 border-t border-slate-100">
        <SectionHead 
          eyebrow="Marketplace Directory" 
          title="Ready-to-Hire pre-trained employees" 
          sub="Choose from our standard roster of specialized AI Workers. They sync with integrations and load in 5 minutes." 
        />
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {AI_EMPLOYEES.map((emp, i) => (
            <div 
              key={emp.id} 
              className="card p-6 flex flex-col justify-between border border-line bg-surface relative overflow-hidden group hover:border-emerald-600/40 hover:shadow-lift transition-all duration-300 rounded-[24px] text-left"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 overflow-hidden relative shadow-sm shrink-0">
                    <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform" />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${emp.badgeColor}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Active Roster
                  </span>
                </div>
                
                <h3 className="font-display font-bold text-xl text-ink mt-4">{emp.name}</h3>
                <p className="text-emerald-700 text-xs font-bold font-mono tracking-wide uppercase mt-0.5">{emp.role}</p>
                <p className="text-ink-muted text-[13.5px] mt-2.5 leading-relaxed">{emp.desc}</p>
                
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-extrabold text-ink-muted uppercase tracking-wider">Grounding Vertical</div>
                  <div className="inline-block bg-slate-100 text-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded-md mt-1 font-mono">
                    {emp.vertical}.yaml
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-[10px] font-extrabold text-ink-muted uppercase tracking-wider mb-1.5">Core Skills</div>
                  <div className="flex flex-wrap gap-1">
                    {(emp.id === "maya" 
                      ? ["Lead Qualification", "Auto-Scoring", "CRM sync", "Meeting Booking"] 
                      : emp.id === "dexter"
                      ? ["Cleaner Dispatch", "Slot Booking", "FAQ Answering", "Google Cal Sync"]
                      : ["Agency Scout", "Package Details", "Strategy Booking", "Client Routing"]
                    ).map(skill => (
                      <span key={skill} className="bg-emerald-50/50 text-emerald-800 text-[10.5px] font-semibold border border-mint-100 rounded-lg px-2 py-0.5">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="text-left">
                    <span className="text-[9px] text-ink-muted block uppercase font-bold tracking-wider leading-none">Compatible integrations</span>
                    <div className="flex gap-1.5 mt-1">
                      {(emp.id === "maya" 
                        ? ["HubSpot", "Slack", "Zapier"] 
                        : emp.id === "dexter"
                        ? ["Calendar", "Stripe", "WhatsApp"]
                        : ["Salesforce", "Calendly", "Notion"]
                      ).map(tag => (
                        <span key={tag} className="text-[10px] text-slate-500 font-semibold bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 leading-none">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Link 
                  to="/signup" 
                  className={`btn w-full !py-2.5 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 transition-all group-hover:translate-y-[-1px] ${
                    emp.id === 'maya' ? 'btn-primary' : 'btn-ghost border border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  Hire {emp.name} <I.ArrowRight width={13} height={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PLATFORM CAPABILITIES BENTO SECTION */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 py-20 relative z-10 border-t border-slate-100">
        <SectionHead 
          eyebrow="Core Platform Capabilities" 
          title="Everything it takes to deploy AI workers" 
          sub="No engineers, no long setup. Teach it once and let it work around the clock." 
        />
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {/* Bento Item 1: Grounded Chat & Lead Ingestion */}
          <div className="card p-6 md:col-span-2 flex flex-col justify-between border border-line bg-surface relative overflow-hidden group hover:border-emerald-600/40 transition duration-300 rounded-[24px] text-left">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shadow-sm">
                  <I.Sparkle width={20} height={20} />
                </span>
                <h3 className="font-display font-bold text-lg text-ink">Grounded Chat & Auto Lead Capture</h3>
              </div>
              <p className="text-ink-muted text-[14.5px] leading-relaxed max-w-lg">
                Grounded strictly in your docs, files, and website text. If it doesn't know the answer, it collects visitor details and scores them as Hot, Warm, or Cold based on buying intent signals.
              </p>
            </div>
            
            <div className="mt-8">
              <div className="text-[10px] font-bold text-ink-muted/80 uppercase tracking-wider mb-2 text-left">Grounded Data Source Sync</div>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { name: "📄 Services_pricing.pdf", size: "1.2 MB" },
                  { name: "❓ Pricing FAQ Entries", size: "24 articles" },
                  { name: "🔗 website_home.com", size: "12 pages" }
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

          {/* Bento Item 2: Real-time Voice Agents */}
          <div className="card p-6 flex flex-col justify-between border border-line bg-surface relative overflow-hidden group hover:border-emerald-600/40 transition duration-300 rounded-[24px] text-left">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shadow-sm">
                  <I.Mic width={20} height={20} />
                </span>
                <span className="text-[9px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full tracking-wide">PHONE & WEB</span>
              </div>
              <h3 className="font-display font-bold text-lg text-ink">Speech Voice Agents</h3>
              <p className="text-ink-muted text-[14.5px] mt-2.5 leading-relaxed">
                Giving voice to the AI employees. Let site visitors call them directly over WebRTC, or buy dedicated phone lines to receive client calls automatically.
              </p>
            </div>
            
            <div className="mt-6 bg-emerald-950 text-white rounded-xl p-3 flex items-center justify-between border border-emerald-800/40 shadow-inner">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-900 grid place-items-center text-emerald-300">
                  <I.Phone width={14} height={14} fill="currentColor" />
                </span>
                <div className="text-left">
                  <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Voice Agent Number</div>
                  <div className="text-[12.5px] font-semibold text-white font-mono leading-none mt-0.5">+1 (800) KALI-GAN</div>
                </div>
              </div>
              <span className="flex items-center gap-1 bg-emerald-900 border border-emerald-700 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                Live
              </span>
            </div>
          </div>

          {/* Bento Item 3: Built-in Leads Dashboard */}
          <div className="card p-6 md:col-span-3 flex flex-col justify-between border border-line bg-surface relative overflow-hidden group hover:border-emerald-600/40 transition duration-300 rounded-[24px] text-left">
            <div className="grid md:grid-cols-[1.1fr_1fr] gap-8 items-center">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shadow-sm">
                    <I.Dashboard width={20} height={20} />
                  </span>
                  <h3 className="font-display font-bold text-lg text-ink">Built-in Workspace Dashboard</h3>
                </div>
                <p className="text-ink-muted text-[14.5px] leading-relaxed">
                  Every captured lead is stored inside a highly detailed, local dashboard. Browse conversational histories, analyze lead buying intent scores, and sync contacts seamlessly with third-party integrations.
                </p>
                <div className="mt-4 flex gap-4 text-[13px] text-ink-muted">
                  <span>🎯 Score Hot/Warm/Cold</span>
                  <span>⚡ Live transcript parsing</span>
                </div>
              </div>

              <div className="bg-white border border-line rounded-xl p-3 flex flex-col justify-between shadow-soft">
                <div className="flex justify-between items-start">
                  <div className="text-left">
                    <div className="font-bold text-[13px] text-ink">Sarah Jenkins</div>
                    <div className="text-[11px] text-ink-muted">sarah@acme.com · acme.com</div>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-red-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    Hot Lead (Score: 92)
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-line/60 flex justify-between items-center text-[10.5px]">
                  <span className="text-ink-muted">Intent: <b className="text-ink font-semibold">Demo Request</b></span>
                  <span className="text-ink-muted">Captured via: <b className="text-ink font-semibold">Maya (Chat)</b></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING INTEGRATIONS LOGO GRID */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 py-16 relative z-10 border-t border-slate-100">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">1000+ Integrations Supported</h3>
          <p className="text-ink-muted text-sm mt-1">Connect your AI employees with the software your team already uses.</p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 items-center justify-items-center">
          {[
            { name: "HubSpot", icon: "https://cdn.worldvectorlogo.com/logos/hubspot.svg" },
            { name: "Slack", icon: "https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg" },
            { name: "Zapier", icon: "https://cdn.worldvectorlogo.com/logos/zapier.svg" },
            { name: "Salesforce", icon: "https://cdn.worldvectorlogo.com/logos/salesforce-2.svg" },
            { name: "Stripe", icon: "https://cdn.worldvectorlogo.com/logos/stripe-4.svg" },
            { name: "Shopify", icon: "https://cdn.worldvectorlogo.com/logos/shopify.svg" }
          ].map((logo) => (
            <div key={logo.name} className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-center h-16 w-full shadow-soft hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
              <img src={logo.icon} alt={logo.name} className="h-7 w-auto object-contain grayscale group-hover:grayscale-0 opacity-70 group-hover:opacity-100 transition-all duration-200" />
            </div>
          ))}
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 pb-20 border-t border-slate-100 pt-16">
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
    <main className="relative overflow-hidden bg-gradient-to-br from-canvas via-[#EDF5DE] to-[#E5EED1] pb-24 min-h-[80vh]">
      <Glow className="-top-40 right-[-100px] opacity-60" />
      <Dots className="inset-0 opacity-60" />
      
      <section className="relative">
        <div className="max-w-3xl mx-auto px-6 md:px-8 pt-20 pb-12 text-center relative z-10">
          <div className="flex justify-center mb-4"><Eyebrow>Features</Eyebrow></div>
          <h1 className="font-display text-[42px] font-bold leading-[1.08] text-ink">Everything it takes to convert a visitor</h1>
          <p className="text-ink-muted text-[16px] mt-4">Chat, voice, knowledge, and lead capture — working together as one employee.</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 md:px-8 pb-16 relative z-10">
        {/* Visual mini-showcase of the three astronauts representing features */}
        <div className="bg-white/40 border border-white/60 p-6 rounded-[28px] shadow-soft mb-12 flex flex-col md:flex-row items-center gap-8 text-left">
          <div className="flex -space-x-4 shrink-0">
            {["/maya_astronaut.png", "/dexter_astronaut.png", "/milli_astronaut.png"].map((src, i) => (
              <div key={i} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-white overflow-hidden shadow-md">
                <img src={src} alt="astronaut" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-ink">Pre-Trained Employees Ready for Action</h3>
            <p className="text-ink-muted text-sm mt-1 leading-relaxed">
              Every feature listed below is pre-packaged and pre-trained into our space-suit employees. Choose Maya, Dexter, or Milli to get full multi-channel capabilities live in under 5 minutes.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {rows.map((r, i) => (
            <div key={r.t} className="card p-6 flex gap-4 bg-white/60 backdrop-blur-sm hover:border-emerald-600/40 hover:bg-white hover:shadow-soft transition-all duration-300 rounded-[20px] text-left" style={{ animationDelay: `${i * 0.05}s` }}>
              <span className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0 shadow-sm">{r.icon}</span>
              <div>
                <h3 className="font-display font-bold text-[16.5px] text-ink">{r.t}</h3>
                <p className="text-ink-muted text-[14px] mt-1.5 leading-relaxed">{r.d}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link to="/signup" className="btn btn-primary !px-8 !py-3">Start free <I.ArrowRight className="ml-1" width={16} height={16} /></Link>
        </div>
      </section>
    </main>
  );
}

/* ============================== PRICING =========================== */
export function Pricing() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-br from-canvas via-[#EDF5DE] to-[#E5EED1] pb-24 min-h-[80vh]">
      <Glow className="-top-40 right-[-100px] opacity-60" />
      <Dots className="inset-0 opacity-60" />

      <section className="relative">
        <div className="max-w-3xl mx-auto px-6 md:px-8 pt-20 pb-10 text-center relative z-10">
          <div className="flex justify-center mb-4"><Eyebrow>Pricing</Eyebrow></div>
          <h1 className="font-display text-[42px] font-bold leading-[1.08] text-ink">Pricing that pays for itself</h1>
          <p className="text-ink-muted text-[16px] mt-4">One captured customer usually covers the month. Start free and upgrade when it's working.</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 md:px-8 pb-20 relative z-10">
        <PricingGrid />

        {/* Pre-Trained Roster Value section inside Pricing */}
        <div className="mt-16 bg-white/60 border border-line p-8 rounded-[28px] shadow-soft flex flex-col md:flex-row items-center justify-between gap-8 text-left">
          <div className="flex-1">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[10.5px] font-extrabold px-3 py-1 rounded-full border border-mint-200 shadow-sm uppercase tracking-wider">
              Roster Templates Included
            </span>
            <h3 className="font-display font-bold text-xl text-ink mt-3">Full Access to Pre-Trained Employees</h3>
            <p className="text-ink-muted text-sm mt-2 leading-relaxed">
              Every plan includes complete access to our space-suit roster: Maya (Sales), Dexter (Services), and Milli (Marketing). You don't have to build agents from scratch—just select your template, map your website URL, and deploy in minutes.
            </p>
          </div>
          <div className="flex gap-4 shrink-0 justify-center">
            {[
              { name: "Maya", src: "/maya_astronaut.png", color: "border-emerald-500" },
              { name: "Dexter", src: "/dexter_astronaut.png", color: "border-blue-500" },
              { name: "Milli", src: "/milli_astronaut.png", color: "border-violet-500" }
            ].map((emp) => (
              <div key={emp.name} className="flex flex-col items-center gap-1">
                <div className={`w-14 h-14 rounded-2xl bg-white border-2 ${emp.color} overflow-hidden shadow-sm`}>
                  <img src={emp.src} alt={emp.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[11px] font-bold text-ink-muted">{emp.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-20">
          <SectionHead eyebrow="Questions" title="Pricing FAQ" />
          <FaqList />
        </div>
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
  sintra: {
    name: "Sintra.ai & AI Worker Marketplaces",
    tagline: "Why dedicated lead-capture AI employees beat prompt-template directories.",
    desc: "AI worker directories offer generic prompt templates and trigger sequences. They lack live WebRTC web calls, local lead qualification dashboards, and integrated safety-first RAG grounding built directly into your website widgets.",
    strength: "Broad variety of predefined prompt roles.",
    weakness: "No real-time phone/web voice lines, no unified chat widget, requires external automation tools (Zapier/Make) to route and view captured leads.",
    features: [
      { name: "Live Web & Phone Voice", kaligan: "Built-in (WebRTC + BYON Phone)", competitor: "None (Text only / prompts)", desc: "Interact via real-time speech lines on web or phone." },
      { name: "Zero-Code Website Widget", kaligan: "Included (One-line script)", competitor: "Requires third-party chat tools", desc: "Embed and run the employee directly on your frontend." },
      { name: "Structured Lead Dashboard", kaligan: "Included (Auto-scores intent)", competitor: "External (Must sync via Make/Zapier)", desc: "View hot/warm leads and transcripts instantly in one place." },
      { name: "Doc-Grounded Safety", kaligan: "Strict RAG (Zero hallucinations)", competitor: "Prompt-based context only", desc: "Ensures the worker only references your official docs." },
      { name: "Setup Simplicity", kaligan: "5 minutes (Url scan)", competitor: "Complex trigger/flow mapping", desc: "No complex node-based flow builders needed." },
    ],
    summary: "Don't pay for prompt libraries. Get a fully integrated voice and text employee."
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
  const compId = competitor && competitorData[competitor] ? competitor : "sintra";
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

        <div className="grid md:grid-cols-2 gap-4 mb-8">
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

        {/* Maya's Quote Callout Banner */}
        <div className="flex gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm mb-12 items-center text-left">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-slate-100 overflow-hidden shrink-0">
            <img src="/maya_astronaut.png" alt="Maya" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-[11px] font-extrabold uppercase text-emerald-700 tracking-wider">Maya's Take</div>
            <p className="text-[13px] text-ink-muted leading-relaxed mt-0.5">
              "{data.name.includes("Sintra.ai") 
                ? "Sintra has a huge library of prompt templates, but they cannot answer browser voice calls, host inline chat widgets, or grade qualified contacts automatically in a local dashboard. KaliGanAI is built for active leads execution." 
                : "Why build custom integrations or manage complex automation tools when you can get a single pre-trained employee live in 5 minutes?"}"
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

/* ============================== BLOG SECTION ========================== */

export const BLOG_POSTS = [
  {
    id: "ai-employees-replacing-forms",
    title: "Why AI Employees are Replacing Traditional Lead Capture Forms",
    excerpt: "Static contact forms are silent at the exact moment a buyer is ready to convert. Learn how grounded, conversational AI widgets are increasing lead conversion rates by 40%.",
    content: `
      <p class="mb-4">For the last two decades, the standard way to collect contact information from website visitors was the static contact form. A user lands on your homepage, reads your copy, and if they are interested enough, they type their name, email, and request into a box, then click "Submit".</p>
      <p class="mb-4">But there's a problem: static forms are passive. They don't answer immediate objections, they don't explain pricing nuances, and they certainly don't engage visitors in real-time. If a buyer has a quick question before they feel comfortable giving you their email, a static form fails them.</p>
      <h3 class="font-display font-bold text-lg text-ink mt-6 mb-3">The Rise of Conversational Lead Capture</h3>
      <p class="mb-4">This is where pre-trained AI Employees come in. Instead of a silent form waiting in the corner of your page, an AI teammate like Maya can actively greet the visitor, guide them through your features, answer grounding-verified FAQs, and smoothly request their contact details when buying intent is identified.</p>
      <p class="mb-4">According to recent user data, websites that replace or supplement their static contact forms with grounded conversational agents see an average 40% increase in lead submission rates. This is because users feel they are getting value—real, instant answers to their questions—in exchange for their contact information.</p>
      <h3 class="font-display font-bold text-lg text-ink mt-6 mb-3">Auto-Scoring Lead Quality</h3>
      <p class="mb-4">Another massive advantage is automatic lead scoring. Unlike a form where every submission looks the same, an AI Employee analyzes the conversation transcript semantically. By measuring the specificity of a visitor's questions and their urgency, KaliGanAI automatically grades leads as Hot, Warm, or Cold, placing them into your dashboard and notifying your sales team accordingly.</p>
      <p class="mb-4">The bottom line? Stop letting visitors leave because your website is silent. Deploying an active AI Worker ensures you capture every single opportunity, 24/7.</p>
    `,
    category: "AI Strategy",
    readTime: "4 min read",
    date: "June 24, 2026",
    author: "KaliGanAI Team",
    avatar: "/maya_astronaut.png",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "giving-voice-to-ai-employees",
    title: "Giving Voice to AI Employees: WebRTC and Dedicated Phone Lines",
    excerpt: "Text chat is only half the battle. Discover how combining instant browser voice widgets with phone numbers creates a unified lead generation powerhouse.",
    content: `
      <p class="mb-4">While text-based chat has become standard, the telephone remains the highest-converting sales channel for small and medium businesses. But answering calls manually is expensive, and legacy IVR systems (press 1 for sales, press 2 for support) frustrate customers.</p>
      <p class="mb-4">By giving a voice to your AI Employees, you bridge the gap between digital convenience and human connection. Visitors can simply click a mic button in their browser or dial a direct phone number to speak with a pre-trained agent in natural speech.</p>
      <h3 class="font-display font-bold text-lg text-ink mt-6 mb-3">How WebRTC Speech Agents Scale Customer Engagement</h3>
      <p class="mb-4">With WebRTC technology, high-fidelity audio streams directly through the web browser. Customers can ask pricing questions, book slot cleanings, or qualify themselves for service programs out loud. There is no software to install or number to dial—just immediate speech-to-speech reasoning with sub-second response latency.</p>
      <h3 class="font-display font-bold text-lg text-ink mt-6 mb-3">Telephony & Bring Your Own Number (BYON)</h3>
      <p class="mb-4">For businesses with existing phone systems, voice capabilities extend to standard telephone lines. By mapping incoming Twilio webhooks directly to your KaliGanAI workspace, inbound calls are intercepted by your AI worker. Whether a client calls from their phone or chats on your homepage, they converse with the exact same knowledge base.</p>
      <p class="mb-4">All call transcripts, lead scores, and customer contacts are automatically saved to your workspace dashboard. This creates a unified pipeline where text and voice leads are collected, categorized, and synced to your favorite CRM tools without manual double-entry.</p>
    `,
    category: "Voice Tech",
    readTime: "5 min read",
    date: "June 22, 2026",
    author: "KaliGanAI Team",
    avatar: "/dexter_astronaut.png",
    image: "https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "grounded-rag-vs-hallucinations",
    title: "Grounded RAG vs Generative Hallucinations: Building a Safe AI Worker",
    excerpt: "Why custom prompt engineering is not enough for customer-facing applications. Learn how strict vector database grounding guarantees accurate, on-brand responses.",
    content: `
      <p class="mb-4">We've all seen the headlines about customer service chatbots going off-script—recommending competitors, giving away free products, or hallucinating false policy pricing. These issues arise when builders rely solely on prompt engineering to guide behavior.</p>
      <p class="mb-4">For a customer-facing AI employee, safety and accuracy are non-negotiable. If an AI doesn't know a pricing detail, it should offer to take the customer's contact info rather than making up a number.</p>
      <h3 class="font-display font-bold text-lg text-ink mt-6 mb-3">What is Grounded RAG?</h3>
      <p class="mb-4">Retrieval-Augmented Generation (RAG) is a technique that limits the LLM's workspace. Instead of letting the AI search its entire training data for answers, the system first retrieves relevant snippets from the official knowledge base files you upload (like PDF price sheets, FAQ guides, or website scans).</p>
      <p class="mb-4">The AI model is then explicitly instructed: <i>"Answer this query using only the provided facts. If the facts do not contain the answer, say that you don't know and offer to collect details."</i></p>
      <h3 class="font-display font-bold text-lg text-ink mt-6 mb-3">Ensuring Brand Safety</h3>
      <p class="mb-4">By employing strict vector database grounding, KaliGanAI keeps your AI employees inside secure boundaries. You get the reasoning power of modern generative intelligence, coupled with the reliability of a deterministic database. This gives small teams the confidence to put AI workers live on their homepage without constant supervision.</p>
    `,
    category: "AI Safety",
    readTime: "3 min read",
    date: "June 20, 2026",
    author: "KaliGanAI Team",
    avatar: "/milli_astronaut.png",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
  }
];

export function Blog() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-br from-canvas via-[#EDF5DE] to-[#E5EED1] pb-24 min-h-[70vh]">
      <Glow className="-top-44 left-1/2 -translate-x-1/2 opacity-60" />
      <Dots className="inset-0 opacity-60" />

      <div className="max-w-6xl mx-auto px-6 md:px-8 pt-16 md:pt-20 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex justify-center mb-4"><Eyebrow>KaliGanAI Blog</Eyebrow></div>
          <h1 className="font-display text-[42px] font-bold leading-[1.08] text-ink">Insight for small teams that want to scale</h1>
          <p className="text-ink-muted text-[16px] mt-4">Read about AI employees, grounded website widgets, voice caller integrations, and automated lead scoring.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          {BLOG_POSTS.map((post) => (
            <Link 
              key={post.id} 
              to={`/blog/${post.id}`} 
              className="card p-0 flex flex-col justify-between border border-line bg-white/70 backdrop-blur-sm overflow-hidden group hover:border-emerald-600/40 hover:shadow-lift hover:bg-white transition-all duration-300 rounded-[24px]"
            >
              <div>
                <div className="aspect-[16/10] overflow-hidden bg-slate-100 border-b border-line relative">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-4 left-4 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">{post.category}</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-ink-muted text-[12.5px] font-medium mb-3">
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 className="font-display font-bold text-[18px] text-ink leading-snug group-hover:text-emerald-700 transition">{post.title}</h3>
                  <p className="text-ink-muted text-[13.5px] mt-3 leading-relaxed line-clamp-3">{post.excerpt}</p>
                </div>
              </div>
              <div className="p-6 pt-0 border-t border-slate-50/50 mt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-slate-200 overflow-hidden relative">
                  <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
                </div>
                <span className="text-[12.5px] font-bold text-ink">{post.author}</span>
                <span className="ml-auto text-emerald-700 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Read article <I.ArrowRight width={12} height={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

export function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const post = BLOG_POSTS.find(p => p.id === id) || BLOG_POSTS[0];

  return (
    <main className="relative overflow-hidden bg-gradient-to-br from-canvas via-[#EDF5DE] to-[#E5EED1] pb-24 min-h-[70vh]">
      <Glow className="-top-44 right-[-100px] opacity-60" />
      <Dots className="inset-0 opacity-60" />

      <div className="max-w-3xl mx-auto px-6 md:px-8 pt-16 md:pt-20 relative z-10 text-left">
        <div className="mb-6">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
        </div>

        <div className="mb-8">
          <span className="inline-flex items-center bg-emerald-50 border border-mint-300 rounded-full px-3 py-1 text-[11.5px] font-bold text-emerald-800 uppercase tracking-wider mb-4">
            {post.category}
          </span>
          <h1 className="font-display text-[32px] md:text-[44px] font-bold leading-[1.12] text-ink">
            {post.title}
          </h1>
          <div className="flex items-center gap-3.5 mt-6 pt-4 border-t border-line/60">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-slate-200 overflow-hidden relative">
              <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
            </div>
            <div className="leading-tight">
              <div className="text-[13.5px] font-bold text-ink">{post.author}</div>
              <div className="text-[11.5px] text-ink-muted mt-0.5">{post.date} · {post.readTime}</div>
            </div>
          </div>
        </div>

        <div className="aspect-[16/9] overflow-hidden rounded-[24px] bg-slate-100 border border-line shadow-soft mb-10">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        </div>

        {/* Article content */}
        <article className="prose prose-slate max-w-none text-ink/90 text-[15px] leading-relaxed mb-16"
          dangerouslySetInnerHTML={{ __html: post.content }} />

        {/* CTA Card */}
        <div className="bg-emerald-900 text-white rounded-3xl p-8 text-center shadow-lift relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(300px 300px at 50% 0%,rgba(95,201,176,.25),transparent 75%)" }} />
          <h2 className="font-display text-2xl font-bold text-white relative z-10">Deploy a grounded AI employee on your website</h2>
          <p className="text-emerald-100 text-sm mt-2 max-w-md mx-auto relative z-10">Get live in 5 minutes with a single script embed. Start your free trial today, no credit card required.</p>
          <div className="mt-6 flex justify-center gap-4 relative z-10">
            <Link to="/signup" className="btn bg-white text-emerald-900 hover:bg-[#eafaf3] px-6 py-2.5 font-bold rounded-xl text-sm">Start Free Trial</Link>
            <Link to="/contact" className="btn border border-white/20 hover:bg-white/10 text-white px-6 py-2.5 font-bold rounded-xl text-sm">Talk to Us</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
