import { useState } from "react";
import { Card } from "../components/ui";
import * as I from "../components/icons";

const presets = [
  "Handle customer support questions for my company",
  "Create a Deep research blog writer",
  "Create a Personal Wealth goal tracker"
];

export default function AgentStudio() {
  const [prompt, setPrompt] = useState("");
  const [email, setEmail] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePresetClick = (pText: string) => {
    setPrompt(pText);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubmitting(true);
    // Simulate brief network latency for premium feel
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmitting(false);
    setIsRegistered(true);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-8 fadeup">
      {/* Top Banner Badge */}
      <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold shadow-soft select-none">
        <span>✨</span> AI Employee Studio Beta
      </div>

      {/* Hero Title */}
      <h1 className="text-center font-bold text-slate-800 text-3xl md:text-4xl tracking-tight leading-tight max-w-2xl mt-1 select-none">
        Build agents. Automate your work.
        <span className="block mt-1 bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
          Reclaim your life.
        </span>
      </h1>

      <p className="text-center text-xs text-ink-muted mt-3 mb-8 max-w-md select-none font-medium">
        Describe the AI employee you want to build for your company and eliminate boring tasks. We will compile and deploy them to your workspace instantly.
      </p>

      {/* Prompt Composer Box */}
      <Card className="w-full max-w-2xl p-5 border border-line bg-white shadow-soft relative overflow-hidden mb-5">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to build. We'll bring it to life..."
          className="w-full h-24 bg-transparent border-none outline-none resize-none text-[13.5px] text-slate-800 placeholder:text-slate-400 font-medium leading-relaxed"
        />

        <div className="flex items-center justify-between border-t border-line/60 pt-3 mt-1.5 select-none">
          {/* Left Actions */}
          <div className="flex items-center gap-2 text-slate-400">
            <button className="p-1.5 hover:bg-slate-50 hover:text-slate-600 rounded-lg transition-colors cursor-pointer" title="Attach knowledge file">
              <span className="text-sm">📎</span>
            </button>
            <button className="p-1.5 hover:bg-slate-50 hover:text-slate-600 rounded-lg transition-colors cursor-pointer" title="Voice instructions">
              <I.Mic width={15} height={15} />
            </button>
          </div>

          {/* Right Generate Button */}
          <button
            onClick={() => {
              if (prompt.trim() !== "") {
                const element = document.getElementById("beta-form");
                element?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-soft transition-all active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <span>Generate</span>
            <I.ArrowRight width={12} height={12} />
          </button>
        </div>
      </Card>

      {/* Preset Suggestions */}
      <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-xl select-none">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => handlePresetClick(preset)}
            className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-line rounded-full text-[11.5px] font-bold text-slate-600 hover:text-slate-800 transition-all cursor-pointer active:scale-95"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Waitlist Callout Form */}
      <div id="beta-form" className="w-full max-w-lg mt-4 scroll-mt-24">
        <Card className="p-6 border border-emerald-100 bg-emerald-50/20 text-center shadow-soft relative overflow-hidden">
          {/* Sparkles background effect */}
          <div className="absolute top-0 right-0 p-3 text-emerald-600/10 pointer-events-none select-none">
            <I.Sparkle className="w-24 h-24" />
          </div>

          {!isRegistered ? (
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col items-center gap-4 relative z-10">
              <div className="flex flex-col gap-1 select-none">
                <h3 className="font-bold text-slate-800 text-[14.5px]">
                  Join AI Employee Studio Private Beta
                </h3>
                <p className="text-[12px] text-slate-500 leading-relaxed px-4">
                  The custom AI Employee Studio is currently in private preview. Join the waitlist to receive access to custom building, orchestrating, and automation pipelines.
                </p>
              </div>

              <div className="w-full max-w-md flex items-stretch gap-2 mt-1">
                <input
                  type="email"
                  required
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-white border border-line rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 text-slate-800 placeholder:text-slate-400 font-medium"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-soft transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  {submitting ? "Joining..." : "Join Waitlist"}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 gap-2 relative z-10">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 grid place-items-center text-sm font-semibold select-none shadow-soft animate-bounce">
                ✓
              </div>
              <h4 className="font-bold text-emerald-800 text-[14px] select-none">
                Added to Developer Waitlist!
              </h4>
              <p className="text-[11.5px] text-emerald-700/80 leading-relaxed select-none max-w-xs">
                Thank you! We will notify you at <strong className="text-emerald-800">{email}</strong> as soon as the custom compiler and automation builder modules are ready.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
