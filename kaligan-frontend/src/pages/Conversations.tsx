import { useState } from "react";
import { PageHead, ScoreBadge } from "../components/ui";
import * as I from "../components/icons";
import { convos } from "../data/mock";

export default function Conversations() {
  const [active, setActive] = useState(convos[0].id);
  const cur = convos.find((c) => c.id === active)!;
  const tabs = ["All", "Captured", "Hot", "Unread"];
  const [tab, setTab] = useState("All");

  return (
    <>
      <PageHead title="Conversations" subtitle="Every chat your AI has had with a visitor." />
      <div className="grid grid-cols-[340px_1fr] gap-4 fadeup">
        {/* list */}
        <div className="card overflow-hidden">
          <div className="flex gap-1.5 p-3 border-b border-line">
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`text-[12.5px] font-semibold px-3 py-1.5 rounded-full transition ${tab === t ? "bg-emerald-600 text-white" : "text-ink-muted hover:bg-emerald-50"}`}>{t}</button>
            ))}
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {convos.map((c) => (
              <button key={c.id} onClick={() => setActive(c.id)} className={`w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-line transition ${active === c.id ? "bg-emerald-50" : "hover:bg-surface-2"}`}>
                <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: c.score === "Hot" ? "#D9534F" : c.score === "Warm" ? "#E0A100" : "#C7D2C9" }} />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2"><b className="font-semibold text-[13.5px]">{c.visitor}</b>{c.captured && <span className="text-[10px] font-bold bg-mint-100 text-emerald-700 px-1.5 py-0.5 rounded-full">captured</span>}</span>
                  <span className="block text-ink-muted text-[12.5px] truncate mt-0.5">{c.snippet}</span>
                </span>
                <span className="text-ink-muted text-[11.5px] whitespace-nowrap">{c.time}</span>
              </button>
            ))}
          </div>
        </div>

        {/* thread */}
        <div className="grid grid-cols-[1fr_240px] gap-4">
          <div className="card p-5 flex flex-col">
            <div className="flex items-center gap-2.5 pb-3 border-b border-line mb-4">
              <b className="font-semibold">{cur.visitor}</b>{cur.score && <ScoreBadge score={cur.score} />}
              <span className="ml-auto text-ink-muted text-[12.5px]">{cur.messages} messages · {cur.time}</span>
            </div>
            <div className="space-y-3 text-[13.5px] flex-1">
              <div className="max-w-[80%]"><div className="text-ink-muted text-[11px] mb-1">VISITOR</div><div className="bg-surface-2 border border-line rounded-xl rounded-tl-[3px] px-3 py-2 inline-block">{cur.snippet}</div></div>
              <div className="max-w-[80%] ml-auto text-right"><div className="text-ink-muted text-[11px] mb-1">AI</div><div className="bg-emerald-50 border border-mint-300 rounded-xl rounded-tr-[3px] px-3 py-2 inline-block text-left">Great question! Let me help with that — can I grab your email so I can follow up with details?</div></div>
              {cur.captured && <div className="max-w-[80%]"><div className="bg-surface-2 border border-line rounded-xl px-3 py-2 inline-block">Sure — here you go.</div></div>}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="card p-4">
              <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-3">Visitor info</div>
              <dl className="space-y-2 text-[13px]">
                <div className="flex justify-between"><dt className="text-ink-muted">Location</dt><dd>Austin, TX</dd></div>
                <div className="flex justify-between"><dt className="text-ink-muted">Pages</dt><dd>4 viewed</dd></div>
                <div className="flex justify-between"><dt className="text-ink-muted">Device</dt><dd>Desktop</dd></div>
              </dl>
            </div>
            <div className="card p-4">
              <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-3 flex items-center gap-1.5"><I.Sparkle width={12} height={12} className="text-teal-400" /> AI insights</div>
              <dl className="space-y-2 text-[13px]">
                <div><dt className="text-ink-muted">Intent</dt><dd className="font-semibold">{cur.score === "Hot" ? "High" : cur.score === "Warm" ? "Medium" : "Low"}</dd></div>
                <div><dt className="text-ink-muted">Captured</dt><dd>{cur.captured ? "Name, Email" : "None yet"}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
