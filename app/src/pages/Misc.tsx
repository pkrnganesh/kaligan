import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHead, Card } from "../components/ui";
import * as I from "../components/icons";

export function ChatAgent() {
  const [persona, setPersona] = useState("Friendly");
  return (
    <>
      <PageHead title="Chat Agent" subtitle="Shape how your text AI talks. Changes preview live on the right." />
      <div className="grid grid-cols-[1fr_360px] gap-5 items-start fadeup" style={{ gap: 20 }}>
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <label className="field-label">Agent name</label>
            <input className="input" defaultValue="Kali" />
            <label className="field-label mt-4">Personality</label>
            <div className="grid grid-cols-4 gap-2.5">
              {["Friendly", "Professional", "Concise", "Enthusiastic"].map((p) => (
                <button key={p} onClick={() => setPersona(p)} className={`border-[1.5px] rounded-xl p-3 text-center text-[13px] font-semibold transition ${persona === p ? "border-emerald-600 bg-emerald-50" : "border-line hover:border-mint-300"}`}>{p}</button>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-display font-bold text-[15px] mb-3">Lead qualification</h3>
            <p className="text-ink-muted text-[13px] mb-3">Ask for contact details once a visitor shows interest.</p>
            {["Name", "Email", "Phone"].map((f) => (
              <label key={f} className="flex items-center justify-between py-2 border-t border-line text-[14px]"><span>{f}</span><span className="text-emerald-600 font-semibold text-[13px]">Required</span></label>
            ))}
          </Card>
        </div>
        <Card className="p-5 sticky" style={{ top: 96 }}>
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-3">Live preview</div>
          <div className="space-y-2.5 text-[13.5px]">
            <div className="bg-emerald-50 border border-mint-300 rounded-xl rounded-tl-[3px] px-3 py-2">Hi! I'm Kali 👋 {persona === "Concise" ? "How can I help?" : "How can I help you today?"}</div>
            <div className="bg-surface-2 border border-line rounded-xl rounded-tr-[3px] px-3 py-2 ml-auto max-w-[80%] text-right">Do you work with agencies?</div>
            <div className="bg-emerald-50 border border-mint-300 rounded-xl rounded-tl-[3px] px-3 py-2">Absolutely — agencies are one of our favorite customers!</div>
          </div>
        </Card>
      </div>
    </>
  );
}

export function Settings() {
  const [tab, setTab] = useState("Workspace");
  const tabs = ["Workspace", "Billing & Plan", "Profile & Security"];
  return (
    <>
      <PageHead title="Settings" />
      <div className="flex gap-1.5 mb-5 fadeup">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`text-[13.5px] font-semibold px-4 py-2 rounded-full transition ${tab === t ? "bg-emerald-600 text-white" : "bg-surface border border-line hover:border-mint-300"}`}>{t}</button>
        ))}
      </div>
      <Card className="p-6 max-w-2xl fadeup">
        {tab === "Workspace" && <>
          <label className="field-label">Company name</label><input className="input" defaultValue="Acme Co" />
          <label className="field-label mt-4">Website URL</label><input className="input" defaultValue="https://acme.com" />
          <label className="field-label mt-4">Brand color</label><input type="color" className="w-16 h-10 rounded-lg border border-line" defaultValue="#0E7A5F" />
          <div className="mt-5"><button className="btn btn-primary">Save changes</button></div>
        </>}
        {tab === "Billing & Plan" && <>
          <div className="flex items-center justify-between"><div><div className="text-ink-muted text-[12.5px]">Current plan</div><div className="font-display text-xl font-bold">Growth</div></div><button className="btn btn-primary">Upgrade</button></div>
          <div className="mt-5 bg-surface-2 border border-line rounded-xl p-4 text-[13.5px]">Usage this month: <b>34 / unlimited leads</b></div>
        </>}
        {tab === "Profile & Security" && <>
          <label className="field-label">Name</label><input className="input" defaultValue="Ravi Kumar" />
          <label className="field-label mt-4">Email</label><input className="input" defaultValue="ravi@acme.com" />
          <div className="mt-5"><button className="btn btn-ghost">Change password</button></div>
        </>}
      </Card>
    </>
  );
}

export function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(3);
  const labels = ["Teach", "Shape", "Meet", "Go live", "Live"];
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 fadeup">
        <div className="flex gap-1.5">{labels.map((_, i) => <span key={i} className={`h-1.5 w-12 rounded-full ${i < step ? "bg-emerald-600" : "bg-mint-300"}`} />)}</div>
        <span className="text-[13px] font-semibold text-emerald-700">{step}/5 · {labels[step - 1]}</span>
      </div>
      <Card className="p-8 text-center fadeup">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-teal-400 grid place-items-center mx-auto mb-4"><I.Sparkle width={26} height={26} /></div>
        <h2 className="font-display text-2xl font-bold">Meet your AI</h2>
        <p className="text-ink-muted mt-2 max-w-md mx-auto">Try it now — ask it anything a customer might ask. This is exactly what your visitors will experience.</p>
        <div className="bg-surface-2 border border-line rounded-xl p-4 mt-5 text-left text-[13.5px] space-y-2">
          <div className="bg-emerald-50 border border-mint-300 rounded-xl px-3 py-2 inline-block">Hi! I'm Kali, here to help. What can I do for you?</div>
        </div>
        <div className="flex justify-center gap-3 mt-6">
          <button className="btn btn-ghost" onClick={() => setStep(Math.max(1, step - 1))}>Back</button>
          <button className="btn btn-primary" onClick={() => step < 5 ? setStep(step + 1) : nav("/app")}>{step < 5 ? "Looks good →" : "Go to Dashboard"}</button>
        </div>
      </Card>
    </div>
  );
}
