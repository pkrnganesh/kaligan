import { useState } from "react";
import { Link } from "react-router-dom";
import * as I from "../components/icons";

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
  const [voice, setVoice] = useState("aria");
  const [goal, setGoal] = useState("qualify");
  const [persona, setPersona] = useState("Friendly");
  const [draft, setDraft] = useState(true);
  const [web, setWeb] = useState(true);

  return (
    <>
      {/* top bar */}
      <div className="flex items-center gap-3.5 -mt-1 mb-6 fadeup">
        <div className="flex items-center gap-2.5 text-ink-muted text-[13.5px] font-semibold">
          <Link to="/app/voice" className="hover:text-ink">Voice Agents</Link>
          <I.Chevron className="rotate-[-90deg]" width={14} height={14} />
          <span className="text-ink">Sales Voice Agent</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-surface border border-line rounded-full pl-3.5 pr-1.5 py-1 text-[13px] font-semibold">
            {draft ? "Draft" : "Live"} <Switch on={!draft} onClick={() => setDraft(!draft)} />
          </div>
          <button className="btn btn-ghost">Test</button>
          <button className="btn btn-primary"><I.ArrowRight width={15} height={15} /> Publish agent</button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_372px] gap-5.5 items-start" style={{ gap: 22 }}>
        {/* LEFT */}
        <div className="flex flex-col gap-[18px]">
          <Section icon={<I.Mic width={16} height={16} />} title="Identity & voice" hint="Give your agent a name and pick how it sounds. Tap a voice to preview.">
            <label className="field-label">Agent name</label>
            <input className="input" defaultValue="Sales Voice Agent" />
            <label className="field-label mt-4">Voice</label>
            <div className="grid grid-cols-3 gap-2.5">
              {voices.map((v) => (
                <button key={v.id} onClick={() => setVoice(v.id)}
                  className={`border-[1.5px] rounded-2xl p-3.5 text-left transition ${voice === v.id ? "border-emerald-600 bg-emerald-50" : "border-line hover:border-mint-300"}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${voice === v.id ? "text-emerald-700" : "text-ink-muted"}`}>{v.g} {v.name}</span>
                    <span className={`w-[30px] h-[30px] rounded-full grid place-items-center border ${voice === v.id ? "bg-emerald-600 text-white border-emerald-600" : "bg-surface text-emerald-600 border-line"}`}><I.Play /></span>
                  </div>
                  <b className="block text-sm font-semibold mt-2">{v.name}</b>
                  <small className="text-ink-muted text-xs">{v.desc}</small>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3.5 mt-4">
              <div><label className="field-label">Language</label><select className="input"><option>English (US)</option><option>English (India)</option><option>Hindi</option><option>Telugu</option><option>Spanish</option></select></div>
              <div><label className="field-label">Speaking speed</label><select className="input"><option>Natural</option><option>Slightly slower</option><option>Slightly faster</option></select></div>
            </div>
          </Section>

          <Section icon={<I.Book width={16} height={16} />} title="Connected knowledge" hint="Your voice agent speaks only from these sources — the same brain as your chat AI.">
            <div className="flex items-center gap-2.5 bg-mint-100 rounded-xl px-3.5 py-3 text-[13px] text-emerald-700 font-medium mb-3.5">
              <I.Check width={15} height={15} /> Synced with your Knowledge Base · last trained 2m ago
            </div>
            <div className="flex flex-wrap gap-2.5">
              {["📄 Services.pdf", "❓ Pricing FAQ", "🔗 acme.com/about"].map((c) => (
                <span key={c} className="inline-flex items-center gap-2 bg-surface border border-line rounded-full px-3 py-1.5 text-[13px] font-medium"><span className="w-[7px] h-[7px] rounded-full bg-success" /> {c}</span>
              ))}
              <Link to="/app/knowledge" className="inline-flex items-center gap-2 border border-dashed border-line text-emerald-600 font-semibold rounded-full px-3 py-1.5 text-[13px] hover:border-mint-300">+ Manage sources</Link>
            </div>
          </Section>

          <Section icon={<I.Sparkle width={15} height={15} />} title="Goal & personality" hint="What should every call try to achieve?">
            <div className="grid grid-cols-3 gap-2.5">
              {goals.map((g) => (
                <button key={g.id} onClick={() => setGoal(g.id)} className={`border-[1.5px] rounded-[13px] p-3 text-center transition ${goal === g.id ? "border-emerald-600 bg-emerald-50" : "border-line hover:border-mint-300"}`}>
                  <div className="text-emerald-600 mb-1.5 grid place-items-center">{g.icon}</div>
                  <b className="text-[13.5px] font-semibold block">{g.label}</b>
                  <small className="text-[11.5px] text-ink-muted">{g.sub}</small>
                </button>
              ))}
            </div>
            <label className="field-label mt-4">Greeting</label>
            <textarea className="input min-h-[74px] resize-y" defaultValue="Hi, thanks for calling Acme! I'm Aria. Are you looking for help choosing a plan, or do you have a quick question?" />
            <label className="field-label mt-4">Personality</label>
            <div className="grid grid-cols-3 gap-2.5">
              {["Friendly", "Professional", "Concise"].map((p) => (
                <button key={p} onClick={() => setPersona(p)} className={`border-[1.5px] rounded-[13px] p-3 text-center transition ${persona === p ? "border-emerald-600 bg-emerald-50" : "border-line hover:border-mint-300"}`}><b className="text-[13.5px] font-semibold">{p}</b></button>
              ))}
            </div>
          </Section>

          <Section icon={<I.Phone width={16} height={16} />} title="Where it answers" hint="Turn on the channels your callers will use.">
            <div className="flex items-center gap-3.5 py-3.5">
              <span className="w-[38px] h-[38px] rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0"><I.Mic width={18} height={18} /></span>
              <span className="flex-1"><b className="text-sm font-semibold">Web voice button</b><small className="block text-ink-muted text-[12.5px]">A “talk to us” mic button on your website</small></span>
              <Switch on={web} onClick={() => setWeb(!web)} />
            </div>
            <div className="flex items-center gap-3.5 py-3.5 border-t border-line">
              <span className="w-[38px] h-[38px] rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0"><I.Phone width={18} height={18} /></span>
              <span className="flex-1"><b className="text-sm font-semibold">Phone number</b><small className="block text-ink-muted text-[12.5px]">A real number callers can dial</small></span>
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
            <div className="w-32 h-32 mx-auto my-5 relative grid place-items-center">
              <div className="absolute rounded-full border-2 border-white/35" style={{ width: 128, height: 128, animation: "ring 2.6s ease-out infinite" }} />
              <div className="absolute rounded-full border-2 border-white/35" style={{ width: 128, height: 128, animation: "ring 2.6s ease-out infinite 1.3s" }} />
              <div className="w-[74px] h-[74px] rounded-full grid place-items-center border border-white/30" style={{ background: "rgba(255,255,255,.16)" }}>
                <div className="flex items-end gap-[3px] h-[26px]">
                  {[0, .15, .3, .45, .2].map((d, i) => <i key={i} className="w-[3px] rounded bg-[#CFF3E6]" style={{ animation: "eq .9s ease-in-out infinite", animationDelay: `${d}s`, height: 7 }} />)}
                </div>
              </div>
            </div>
            <div className="flex gap-2.5 mt-2">
              <button className="btn flex-1 bg-white text-emerald-700 hover:bg-[#eafaf3]"><I.Mic width={15} height={15} /> Talk now</button>
              <button className="btn flex-1 text-white border border-white/30" style={{ background: "rgba(255,255,255,.16)" }}><I.Phone width={15} height={15} /> Call me</button>
            </div>
            <div className="text-[11px] opacity-80 text-center mt-3.5">Avg. response latency ~0.8s · powered by your knowledge base</div>
          </div>

          <div className="card p-4">
            <div className="text-[11px] font-bold tracking-wider uppercase text-ink-muted mb-3">Live transcript</div>
            <div className="text-[13px] leading-snug mb-2.5 max-w-[90%]">
              <div className="text-[10.5px] font-bold tracking-wide uppercase text-ink-muted mb-1">Aria</div>
              <div className="bg-emerald-50 border border-mint-300 rounded-xl rounded-bl-[3px] px-3 py-2.5">Hi, thanks for calling Acme! Are you looking for help choosing a plan?</div>
            </div>
            <div className="text-[13px] leading-snug mb-2.5 ml-auto text-right">
              <div className="text-[10.5px] font-bold tracking-wide uppercase text-ink-muted mb-1">Caller</div>
              <div className="bg-surface-2 border border-line rounded-xl rounded-br-[3px] px-3 py-2.5 inline-block text-left">What's the difference between Starter and Growth?</div>
            </div>
            <div className="text-[13px] leading-snug max-w-[90%]">
              <div className="text-[10.5px] font-bold tracking-wide uppercase text-ink-muted mb-1">Aria <span className="text-teal-400">✦</span></div>
              <div className="bg-emerald-50 border border-mint-300 rounded-xl rounded-bl-[3px] px-3 py-2.5">Starter covers up to 200 leads a month, Growth is unlimited and adds the voice agent. Want me to email you the details?</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
