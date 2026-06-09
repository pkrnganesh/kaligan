import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { ReactNode, CSSProperties } from "react";
import * as I from "./components/icons";
import { useAuth } from "./lib/auth";
import { api } from "./lib/api";

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
function Glow({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden className={`absolute pointer-events-none -z-10 w-[520px] h-[520px] rounded-full blur-[90px] opacity-60 ${className}`}
    style={{ background: "radial-gradient(circle,#BFE6CE 0%,rgba(95,201,176,.35) 45%,transparent 70%)", ...style }} />;
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
  const link = ({ isActive }: { isActive: boolean }) => `text-[14px] font-medium transition ${isActive ? "text-emerald-700" : "text-ink hover:text-emerald-600"}`;
  return (
    <div className="min-h-screen flex flex-col">
      <style>{`@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}@keyframes floaty2{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}`}</style>
      <header className="sticky top-0 z-30 backdrop-blur bg-canvas/75 border-b border-line/70">
        <div className="flex items-center gap-6 px-6 md:px-8 py-3.5 max-w-6xl mx-auto">
          <Link to="/" className="flex items-center gap-2 mr-2"><span className="w-8 h-8 rounded-[9px] bg-emerald-600 grid place-items-center shadow-soft"><I.Sparkle width={16} height={16} fill="#fff" /></span><span className="font-display font-bold">KaliGanAI</span></Link>
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/features" className={link}>Features</NavLink>
            <NavLink to="/pricing" className={link}>Pricing</NavLink>
            <NavLink to="/about" className={link}>About</NavLink>
            <NavLink to="/contact" className={link}>Contact</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/login" className="text-[14px] font-semibold hidden sm:inline">Log in</Link>
            <Link to="/signup" className="btn btn-primary !py-2">Start free</Link>
          </div>
        </div>
      </header>
      <div className="flex-1"><Outlet /></div>
      <footer className="border-t border-line bg-surface-2">
        <div className="max-w-6xl mx-auto px-8 py-12 grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3"><span className="w-7 h-7 rounded-lg bg-emerald-600 grid place-items-center"><I.Sparkle width={14} height={14} fill="#fff" /></span><span className="font-display font-bold">KaliGanAI</span></div>
            <p className="text-ink-muted text-[13.5px] max-w-[230px]">The AI employee that turns website visitors into qualified leads — over chat and voice.</p>
          </div>
          {[["Product", ["Features", "/features"], ["Pricing", "/pricing"], ["Log in", "/login"]],
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

/* =============================== HOME ============================= */
export function Home() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <Glow className="-top-44 right-[-120px]" />
        <Dots className="inset-0" />
        <div className="max-w-6xl mx-auto px-6 md:px-8 pt-16 md:pt-20 pb-16 grid md:grid-cols-[1.05fr_.95fr] gap-12 items-center">
          <div>
            <div className="fadeup"><Eyebrow>AI employee · chat + voice</Eyebrow></div>
            <h1 className="font-display text-[40px] md:text-[54px] font-bold leading-[1.05] mt-5 fadeup" style={{ animationDelay: ".05s" }}>
              Turn website visitors into <span className="text-emerald-600">qualified leads</span> — automatically.
            </h1>
            <p className="text-ink-muted text-[16.5px] leading-relaxed mt-5 max-w-lg fadeup" style={{ animationDelay: ".1s" }}>
              KaliGanAI answers from your own business knowledge, qualifies interest, and captures the lead — 24/7, over chat and voice. No made-up answers. No missed visitors.
            </p>
            <div className="flex flex-wrap gap-3 mt-7 fadeup" style={{ animationDelay: ".15s" }}>
              <Link to="/signup" className="btn btn-primary !px-7 !py-3 text-[15px]">Start free <I.ArrowRight width={16} height={16} /></Link>
              <a href="#how" className="btn btn-ghost !px-7 !py-3 text-[15px]">See how it works</a>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 text-[13px] text-ink-muted fadeup" style={{ animationDelay: ".2s" }}>
              {["No code — one snippet", "Live in 5 minutes", "Cancel anytime"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5"><I.Check width={14} height={14} className="text-success" />{t}</span>
              ))}
            </div>
          </div>

          {/* product visual */}
          <div className="relative fadeup" style={{ animationDelay: ".18s" }}>
            <div className="card p-5 relative z-10" style={{ animation: "floaty 6s ease-in-out infinite" }}>
              <div className="flex items-center gap-2 pb-3 border-b border-line">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 grid place-items-center"><I.Sparkle width={14} height={14} fill="#fff" /></span>
                <b className="text-[13.5px] font-semibold">Kali</b>
                <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-700"><span className="w-[7px] h-[7px] rounded-full bg-success pulse-dot" /> Online</span>
              </div>
              <div className="space-y-2.5 text-[13px] py-3.5">
                <div className="bg-surface-2 border border-line rounded-xl rounded-tl-[3px] px-3 py-2 inline-block max-w-[85%]">Do you work with agencies?</div>
                <div className="bg-emerald-50 border border-mint-300 rounded-xl rounded-tr-[3px] px-3 py-2 ml-auto max-w-[88%] text-left">Absolutely — agencies are one of our core users! Can I grab your email to send details?</div>
                <div className="bg-surface-2 border border-line rounded-xl rounded-tl-[3px] px-3 py-2 inline-block">jane@brightco.com</div>
              </div>
              <div className="flex items-center gap-2.5 bg-mint-100 rounded-xl px-3 py-2.5 mt-1">
                <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1 rounded-full bg-[#fdeceb] text-hot"><span className="w-1.5 h-1.5 rounded-full bg-hot" /> Hot</span>
                <span className="text-[13px] font-semibold">Lead captured</span>
                <span className="ml-auto text-[12px] text-emerald-700 font-semibold">→ Dashboard</span>
              </div>
            </div>
            {/* floating chips */}
            <div className="card px-3.5 py-2.5 absolute -left-5 top-24 z-20 hidden sm:flex items-center gap-2 shadow-lift" style={{ animation: "floaty2 5s ease-in-out infinite" }}>
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white grid place-items-center"><I.Mic width={14} height={14} /></span>
              <span className="text-[12px] font-semibold leading-tight">Voice agent<br /><span className="text-ink-muted font-normal">answering a call</span></span>
            </div>
            <div className="card px-4 py-3 absolute -right-3 -bottom-4 z-20 hidden sm:block shadow-lift" style={{ animation: "floaty 7s ease-in-out infinite" }}>
              <div className="text-[11px] text-ink-muted font-semibold">Leads this week</div>
              <div className="font-display text-2xl font-bold leading-none mt-0.5">34 <span className="text-success text-[12px] font-semibold align-middle">▲ 8%</span></div>
            </div>
          </div>
        </div>

        {/* trust strip */}
        <div className="border-y border-line bg-surface-2/60">
          <div className="max-w-5xl mx-auto px-8 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-ink-muted">
            <span className="text-[12.5px] font-semibold uppercase tracking-wide">Built for</span>
            {["Agencies", "Consultants", "SaaS", "Real estate", "Local services"].map((t) => (
              <span key={t} className="font-display font-semibold text-[15px] text-ink/70">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-6xl mx-auto px-6 md:px-8 py-20">
        <SectionHead eyebrow="3 steps · 5 minutes" title="From visitor to lead, on autopilot" sub="No engineers, no long setup. Teach it once and it works around the clock." />
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { t: "Teach it", d: "Upload PDFs, FAQs, or point it at your website. It learns only from what you give it.", icon: <I.Book width={20} height={20} /> },
            { t: "Install it", d: "Paste one snippet on your site. Chat and voice go live instantly — nothing to configure.", icon: <I.Code width={20} height={20} /> },
            { t: "Capture leads", d: "It answers, qualifies, and drops every captured lead — scored — into your dashboard.", icon: <I.Users width={20} height={20} /> },
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
        <div className="grid md:grid-cols-3 gap-4">
          {/* big tile */}
          <div className="card p-6 md:col-span-2 fadeup">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center"><I.Sparkle width={20} height={20} /></span>
              <h3 className="font-display font-bold text-lg">Answers only from your knowledge</h3>
            </div>
            <p className="text-ink-muted text-[14.5px] max-w-md">Grounded in your own documents and pages. If it doesn't know, it says so and offers to take details — it never invents answers.</p>
            <div className="grid grid-cols-3 gap-2.5 mt-5">
              {["📄 Services.pdf", "❓ Pricing FAQ", "🔗 acme.com"].map((c) => (
                <span key={c} className="inline-flex items-center gap-2 bg-surface-2 border border-line rounded-full px-3 py-1.5 text-[12.5px] font-medium justify-center"><span className="w-[7px] h-[7px] rounded-full bg-success" />{c}</span>
              ))}
            </div>
          </div>
          {/* voice tile */}
          <div className="card p-6 fadeup" style={{ animationDelay: ".06s" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center"><I.Mic width={20} height={20} /></span>
              <span className="text-[10px] font-bold bg-teal-400 text-[#08332a] px-2 py-0.5 rounded-full tracking-wide">NEW</span>
            </div>
            <h3 className="font-display font-bold text-lg">Talks, not just types</h3>
            <p className="text-ink-muted text-[14.5px] mt-1.5">A real-time voice agent that speaks with visitors using the same knowledge base.</p>
          </div>
          {/* lead scoring tile */}
          <div className="card p-6 fadeup" style={{ animationDelay: ".06s" }}>
            <h3 className="font-display font-bold text-lg flex items-center gap-2"><I.Bolt width={18} height={18} className="text-warm" /> Scored automatically</h3>
            <p className="text-ink-muted text-[14.5px] mt-1.5 mb-4">Every lead is graded so you know who to call first.</p>
            <div className="flex gap-2">
              {[["Hot", "bg-[#fdeceb] text-hot", "bg-hot"], ["Warm", "bg-[#fbf3df] text-warm", "bg-warm"], ["Cold", "bg-[#eaf2f7] text-cold", "bg-cold"]].map(([l, s, d]) => (
                <span key={l} className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1 rounded-full ${s}`}><span className={`w-1.5 h-1.5 rounded-full ${d}`} />{l}</span>
              ))}
            </div>
          </div>
          {/* dashboard tile */}
          <div className="card p-6 md:col-span-2 fadeup" style={{ animationDelay: ".06s" }}>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center"><I.Dashboard width={20} height={20} /></span>
              <h3 className="font-display font-bold text-lg">One clean dashboard</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[["Conversations", "128"], ["Leads captured", "34"], ["Hot leads", "9"]].map(([k, v]) => (
                <div key={k} className="bg-surface-2 border border-line rounded-xl px-3 py-3">
                  <div className="text-[11.5px] text-ink-muted font-semibold">{k}</div>
                  <div className="font-display text-2xl font-bold mt-1 leading-none">{v}</div>
                </div>
              ))}
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
  { name: "Starter", price: "$39", tag: "For getting your first leads", cta: "Start free", popular: false,
    features: ["Chat AI on your website", "Answers from your knowledge base", "Lead capture + scoring", "1 knowledge base", "~500 conversations / mo", "Email support"] },
  { name: "Growth", price: "$129", tag: "Voice included — most popular", cta: "Start free", popular: true,
    features: ["Everything in Starter", "Voice agent included (web)", "Unlimited chat conversations", "Multiple agents", "Remove KaliGanAI branding", "Priority support"] },
  { name: "Agency", price: "Custom", tag: "For teams & resellers", cta: "Talk to us", popular: false,
    features: ["Everything in Growth", "Multiple workspaces", "White-label", "Phone numbers", "Volume usage", "Onboarding & SLA"] },
];

export function PricingGrid() {
  return (
    <div className="grid md:grid-cols-3 gap-4 items-start">
      {tiers.map((t, i) => (
        <div key={t.name}
          className={`card p-6 relative fadeup ${t.popular ? "border-emerald-600 border-[1.5px] shadow-lift md:-mt-2" : ""}`}
          style={{ animationDelay: `${i * 0.06}s` }}>
          {t.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold bg-emerald-600 text-white px-3 py-1 rounded-full tracking-wide">MOST POPULAR</span>}
          <div className="font-display font-bold text-lg">{t.name}</div>
          <div className="text-ink-muted text-[12.5px] mt-0.5">{t.tag}</div>
          <div className="mt-4 mb-5 flex items-end gap-1">
            <span className="font-display text-[38px] font-bold leading-none">{t.price}</span>
            {t.price !== "Custom" && <span className="text-ink-muted text-[13px] mb-1">/mo</span>}
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
      ))}
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
          <div className="card p-6">
            <label className="field-label">Name</label><input className="input mb-3" placeholder="Jane Doe" />
            <label className="field-label">Work email</label><input className="input mb-3" placeholder="you@company.com" />
            <label className="field-label">Company website</label><input className="input mb-3" placeholder="https://acme.com" />
            <label className="field-label">How can we help?</label>
            <textarea className="input min-h-[110px] resize-y mb-4" placeholder="I run an agency and want to white-label this for clients…" />
            <button className="btn btn-primary w-full">Send message <I.ArrowRight width={15} height={15} /></button>
          </div>
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
