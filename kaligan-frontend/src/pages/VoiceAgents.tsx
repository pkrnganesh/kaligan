import { Link } from "react-router-dom";
import { PageHead } from "../components/ui";
import * as I from "../components/icons";
import { voiceAgents } from "../data/mock";

export default function VoiceAgents() {
  return (
    <>
      <PageHead title="Voice Agents" subtitle="Build AI agents that talk to callers — using your knowledge base."
        right={<Link to="/app/voice/v1" className="btn btn-primary"><I.Plus width={15} height={15} /> New voice agent</Link>} />
      <div className="grid grid-cols-3 gap-4">
        {voiceAgents.map((v) => (
          <Link key={v.id} to="/app/voice/v1" className="card p-5 hover:-translate-y-0.5 hover:shadow-lift hover:border-mint-300 transition block fadeup">
            <div className="flex items-center justify-between">
              <span className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center"><I.Mic width={20} height={20} /></span>
              <span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full ${v.status === "Live" ? "bg-emerald-50 text-success" : "bg-[#f0efe2] text-ink-muted"}`}>{v.status === "Live" ? "● Live" : "Draft"}</span>
            </div>
            <h3 className="font-display text-[17px] font-bold mt-3.5">{v.name}</h3>
            <p className="text-ink-muted text-[13px] mt-1">Voice: {v.voice} · {v.kb} sources · {v.channel}</p>
            <div className="border-t border-line mt-4 pt-3 text-[13px] text-ink-muted">{v.calls} calls handled</div>
          </Link>
        ))}
        <Link to="/app/voice/v1" className="rounded-xl2 border-2 border-dashed border-line grid place-items-center text-ink-muted hover:border-mint-300 hover:text-emerald-600 transition min-h-[180px]">
          <span className="flex flex-col items-center gap-2"><I.Plus /> <span className="text-sm font-semibold">New voice agent</span></span>
        </Link>
      </div>
    </>
  );
}
