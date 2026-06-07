import { Link, useParams } from "react-router-dom";
import { PageHead, Card, ScoreBadge } from "../components/ui";
import * as I from "../components/icons";
import { leads } from "../data/mock";

const statusStyle: Record<string, string> = {
  New: "bg-mint-100 text-emerald-700", Contacted: "bg-[#eaf2f7] text-cold",
  Qualified: "bg-[#fbf3df] text-warm", Won: "bg-emerald-50 text-success", Lost: "bg-[#f0efe2] text-ink-muted",
};

export function Leads() {
  return (
    <>
      <PageHead title="Leads" subtitle="Captured, scored, and ready to convert."
        right={<button className="btn btn-ghost">Export CSV</button>} />
      <Card className="fadeup overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-ink-muted text-left text-[12.5px] font-semibold">
            {["Name", "Contact", "Score", "Status", "Source", "Date"].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}
          </tr></thead>
          <tbody>
            {leads.map((l, i) => (
              <tr key={l.id} className={`${i > 0 ? "border-t border-line" : "border-t border-line"} hover:bg-surface-2 transition`}>
                <td className="px-5 py-3.5"><Link to={`/app/leads/${l.id}`} className="font-semibold hover:text-emerald-600">{l.name}</Link></td>
                <td className="px-5 py-3.5 text-ink-muted">{l.email}</td>
                <td className="px-5 py-3.5"><ScoreBadge score={l.score} /></td>
                <td className="px-5 py-3.5"><span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full ${statusStyle[l.status]}`}>{l.status}</span></td>
                <td className="px-5 py-3.5 text-ink-muted">{l.source}</td>
                <td className="px-5 py-3.5 text-ink-muted">{l.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

export function LeadDetail() {
  const { id } = useParams();
  const l = leads.find((x) => x.id === id) || leads[0];
  return (
    <>
      <div className="flex items-center gap-2.5 text-ink-muted text-[13.5px] font-semibold mb-5 fadeup">
        <Link to="/app/leads" className="hover:text-ink">← Leads</Link>
        <span className="text-ink ml-1">{l.name}</span>
        <span className="ml-2"><ScoreBadge score={l.score} /></span>
      </div>
      <div className="grid grid-cols-[1.3fr_1fr] gap-4 fadeup">
        <Card className="p-5">
          <div className="flex items-center gap-6 pb-4 border-b border-line">
            <span className="text-[14px]"><span className="text-ink-muted text-[12.5px] block">Email</span>{l.email} <button className="text-emerald-600 ml-1">📋</button></span>
            <span className="text-[14px]"><span className="text-ink-muted text-[12.5px] block">Phone</span>{l.phone} <button className="text-emerald-600 ml-1">📋</button></span>
          </div>
          <h3 className="font-display font-bold mt-4 mb-2 text-[15px]">Conversation</h3>
          <div className="space-y-2.5 text-[13.5px]">
            <div><span className="text-ink-muted">Visitor:</span> Hi, do you offer this for agencies?</div>
            <div className="bg-emerald-50 border border-mint-300 rounded-xl px-3 py-2">AI: Yes! Agencies are one of our core users. Can I grab your email to send details?</div>
            <div><span className="text-ink-muted">Visitor:</span> Sure, {l.email}</div>
          </div>
          <div className="flex gap-2.5 mt-5">
            <button className="btn btn-primary">Mark Contacted</button>
            <button className="btn btn-ghost">Won</button>
            <button className="btn btn-ghost">Lost</button>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-display font-bold text-[15px] flex items-center gap-2 mb-3"><I.Sparkle width={15} height={15} className="text-teal-400" /> AI insights</h3>
          <dl className="space-y-3 text-[13.5px]">
            <div><dt className="text-ink-muted text-[12.5px]">Intent</dt><dd className="font-semibold">High</dd></div>
            <div><dt className="text-ink-muted text-[12.5px]">Why {l.score}</dt><dd>{l.note}</dd></div>
            <div><dt className="text-ink-muted text-[12.5px]">Captured</dt><dd>Name, Email, Phone</dd></div>
            <div><dt className="text-ink-muted text-[12.5px]">Source</dt><dd>{l.source}</dd></div>
          </dl>
        </Card>
      </div>
    </>
  );
}
