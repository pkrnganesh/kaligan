import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import * as I from "./components/icons";

/* ---------- AUTH ---------- */
function AuthShell({ title, sub, cta, foot, to }: { title: string; sub: string; cta: string; foot: React.ReactNode; to: string }) {
  const nav = useNavigate();
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-6">
          <span className="w-9 h-9 rounded-[10px] bg-emerald-600 grid place-items-center"><I.Sparkle width={18} height={18} fill="#fff" /></span>
          <span className="font-display font-bold text-lg">KaliGanAI</span>
        </div>
        <div className="card p-7">
          <h1 className="font-display text-xl font-bold">{title}</h1>
          <p className="text-ink-muted text-[14px] mt-1 mb-5">{sub}</p>
          {to.includes("signup") && <><label className="field-label">Company name</label><input className="input mb-3" placeholder="Acme Co" /><label className="field-label">Website URL</label><input className="input mb-3" placeholder="https://acme.com" /></>}
          <label className="field-label">Email</label><input className="input mb-3" placeholder="you@company.com" />
          {!to.includes("forgot") && <><label className="field-label">Password</label><input type="password" className="input mb-4" placeholder="••••••••" /></>}
          <button className="btn btn-primary w-full" onClick={() => nav("/app")}>{cta}</button>
          <div className="text-center text-[13px] text-ink-muted mt-4">{foot}</div>
        </div>
      </div>
    </div>
  );
}
export const Login = () => <AuthShell to="login" title="Welcome back" sub="Log in to your workspace." cta="Log in" foot={<><Link to="/forgot-password" className="text-emerald-600 font-semibold">Forgot password?</Link> · <Link to="/signup" className="text-emerald-600 font-semibold">Sign up</Link></>} />;
export const Signup = () => <AuthShell to="signup" title="Start free" sub="Your AI employee, live in minutes." cta="Start free" foot={<>Already have an account? <Link to="/login" className="text-emerald-600 font-semibold">Log in</Link></>} />;
export const Forgot = () => <AuthShell to="forgot" title="Reset password" sub="We'll email you a reset link." cta="Send reset link" foot={<Link to="/login" className="text-emerald-600 font-semibold">Back to login</Link>} />;

/* ---------- MARKETING ---------- */
export function MarketingShell() {
  const link = ({ isActive }: { isActive: boolean }) => `text-[14px] font-medium ${isActive ? "text-emerald-700" : "text-ink hover:text-emerald-600"}`;
  return (
    <div>
      <header className="flex items-center gap-6 px-8 py-4 max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2 mr-2"><span className="w-8 h-8 rounded-[9px] bg-emerald-600 grid place-items-center"><I.Sparkle width={16} height={16} fill="#fff" /></span><span className="font-display font-bold">KaliGanAI</span></Link>
        <NavLink to="/features" className={link}>Features</NavLink>
        <NavLink to="/pricing" className={link}>Pricing</NavLink>
        <NavLink to="/about" className={link}>About</NavLink>
        <NavLink to="/contact" className={link}>Contact</NavLink>
        <div className="ml-auto flex items-center gap-3">
          <Link to="/login" className="text-[14px] font-semibold">Log in</Link>
          <Link to="/signup" className="btn btn-primary !py-2">Start free</Link>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-line mt-20 py-10 text-center text-ink-muted text-[13px]">© 2026 KaliGanAI · Privacy · Terms</footer>
    </div>
  );
}

export function Home() {
  return (
    <main className="max-w-6xl mx-auto px-8">
      <section className="text-center pt-16 pb-12">
        <h1 className="font-display text-5xl font-bold leading-[1.08] max-w-3xl mx-auto">Turn website visitors into qualified leads — automatically.</h1>
        <p className="text-ink-muted text-lg mt-5 max-w-xl mx-auto">An AI employee that answers from your business knowledge and captures leads 24/7 — over chat and voice.</p>
        <div className="flex justify-center gap-3 mt-7">
          <Link to="/signup" className="btn btn-primary !px-7 !py-3">Start free</Link>
          <a href="#how" className="btn btn-ghost !px-7 !py-3">See it work →</a>
        </div>
        <div className="card max-w-2xl mx-auto mt-12 p-6 text-left">
          <div className="flex items-center gap-3 text-[13.5px] font-semibold text-emerald-700 flex-wrap">
            Visitor <I.ArrowRight width={16} height={16} /> AI conversation <I.ArrowRight width={16} height={16} /> Lead captured <I.ArrowRight width={16} height={16} /> Dashboard
          </div>
        </div>
      </section>

      <section id="how" className="py-12">
        <h2 className="font-display text-3xl font-bold text-center mb-8">How it works</h2>
        <div className="grid grid-cols-3 gap-5">
          {[["Upload knowledge", "PDFs, FAQs, and your website."], ["Install widget", "One snippet — chat + voice go live."], ["Capture leads", "Qualified leads land in your dashboard."]].map(([t, d], i) => (
            <div key={t} className="card p-6"><div className="w-9 h-9 rounded-full bg-emerald-600 text-white grid place-items-center font-bold mb-3">{i + 1}</div><h3 className="font-display font-bold text-lg">{t}</h3><p className="text-ink-muted text-[14px] mt-1.5">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="py-12">
        <h2 className="font-display text-3xl font-bold text-center mb-8">Everything you need to convert</h2>
        <div className="grid grid-cols-3 gap-5">
          {["Knowledge-based AI", "Lead capture", "Lead qualification", "Conversation tracking", "Voice agents", "Easy setup"].map((f) => (
            <div key={f} className="card p-5 flex items-center gap-3"><span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center"><I.Sparkle width={18} height={18} /></span><b className="font-semibold">{f}</b></div>
          ))}
        </div>
      </section>

      <section className="my-16 rounded-[24px] text-white text-center py-14 px-6" style={{ background: "linear-gradient(135deg,#0E7A5F,#0B5A45)" }}>
        <h2 className="font-display text-3xl font-bold">Your AI employee is one snippet away.</h2>
        <Link to="/signup" className="btn bg-white text-emerald-700 hover:bg-[#eafaf3] !px-7 !py-3 mt-6 inline-flex">Start free</Link>
      </section>
    </main>
  );
}

export function MarketingPage({ title }: { title: string }) {
  return (
    <main className="max-w-3xl mx-auto px-8 py-20 text-center">
      <h1 className="font-display text-4xl font-bold">{title}</h1>
      <p className="text-ink-muted mt-4">This page is scaffolded and ready to fill in. Reuses the marketing shell, nav, and footer.</p>
      <Link to="/signup" className="btn btn-primary mt-6 inline-flex">Start free</Link>
    </main>
  );
}
