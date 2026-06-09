import { Link } from "react-router-dom";
import { PageHead, MetricCard, Card, ScoreBadge } from "../components/ui";
import * as I from "../components/icons";
import { leads, convos } from "../data/mock";

export default function Dashboard() {
  const hot = leads.filter((l) => l.score === "Hot");
  return (
    <>
      <PageHead title="Dashboard" subtitle="Good morning, Ravi — here's how your AI employee is doing."
        right={<div className="flex items-center gap-2 bg-surface border border-line rounded-full px-3.5 py-1.5 text-[13px] font-semibold cursor-pointer">Last 7 days <I.Chevron /></div>} />

      <section className="grid grid-cols-4 gap-4 mb-5.5" style={{ marginBottom: 22 }}>
        <div className="fadeup" style={{ animationDelay: ".04s" }}><MetricCard to="/app/conversations" label="Conversations" value="128" delta="▲ 12%" spark="0,20 12,17 24,18 36,11 48,13 60,6 70,4" /></div>
        <div className="fadeup" style={{ animationDelay: ".10s" }}><MetricCard to="/app/leads" label="Leads captured" value="34" delta="▲ 8%" spark="0,18 12,19 24,14 36,15 48,9 60,10 70,5" /></div>
        <div className="fadeup" style={{ animationDelay: ".16s" }}><MetricCard to="/app/leads" label="Hot leads" value="9" delta="▲ 3 new" color="#D9534F" dot="#D9534F" spark="0,21 12,18 24,19 36,13 48,12 60,8 70,3" /></div>
        <div className="fadeup" style={{ animationDelay: ".22s" }}><MetricCard to="/app/leads" label="Opportunities" value="6" delta="unworked" deltaTone="flat" color="#E0A100" spark="0,14 12,15 24,13 36,16 48,12 60,14 70,11" /></div>
      </section>

      <div className="grid grid-cols-[1.35fr_1fr] gap-4">
        <Card className="fadeup" >
          <div className="flex items-center gap-2.5 px-5 pt-[17px] pb-3.5">
            <I.Bolt className="text-warm" />
            <h2 className="font-display text-[16.5px] font-bold">Needs you</h2>
            <span className="text-xs font-bold bg-[#fdeceb] text-hot px-2.5 py-0.5 rounded-full">{hot.length} hot</span>
            <Link to="/app/leads" className="ml-auto text-[13px] font-semibold text-emerald-600 hover:underline">View all leads →</Link>
          </div>
          {hot.map((l) => (
            <Link key={l.id} to={`/app/leads/${l.id}`} className="flex items-center gap-3.5 px-5 py-3 border-t border-line hover:bg-surface-2 transition">
              <ScoreBadge score={l.score} />
              <span className="flex flex-col min-w-[128px]"><b className="font-semibold text-sm">{l.name}</b><small className="text-ink-muted text-[12.5px]">{l.email}</small></span>
              <span className="flex-1 text-ink-muted text-[13.5px]">AI note: <em className="not-italic text-ink bg-mint-100 px-1.5 py-0.5 rounded">“{l.note}”</em></span>
              <span className="text-ink-muted text-[12.5px] whitespace-nowrap">{l.time}</span>
              <span className="btn btn-ghost !py-1.5 !px-4 text-[13px]">Open</span>
            </Link>
          ))}
        </Card>

        <Card className="fadeup">
          <div className="flex items-center gap-2.5 px-5 pt-[17px] pb-3.5">
            <h2 className="font-display text-[16.5px] font-bold">Recent activity</h2>
            <Link to="/app/conversations" className="ml-auto text-[13px] font-semibold text-emerald-600 hover:underline">Conversations →</Link>
          </div>
          {convos.slice(0, 4).map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-5 py-3 border-t border-line">
              <span className="w-[30px] h-[30px] rounded-[9px] grid place-items-center shrink-0 bg-emerald-50 text-emerald-600"><I.Chat width={16} height={16} /></span>
              <span className="flex-1 text-[13.5px]">{c.visitor} finished a chat<small className="block text-ink-muted text-xs mt-0.5">{c.time} · {c.messages} messages</small></span>
              {c.captured && <span className="text-[11px] font-bold bg-mint-100 text-emerald-700 px-2.5 py-1 rounded-full whitespace-nowrap">Captured lead</span>}
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
