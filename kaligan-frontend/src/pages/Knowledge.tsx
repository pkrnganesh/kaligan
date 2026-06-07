import { PageHead, Card } from "../components/ui";
import * as I from "../components/icons";
import { sources } from "../data/mock";

const typeIcon: Record<string, string> = { PDF: "📄", FAQ: "❓", URL: "🔗" };
const statusStyle: Record<string, string> = {
  Synced: "bg-emerald-50 text-success", Processing: "bg-[#fbf3df] text-warm", Failed: "bg-[#fdeceb] text-hot",
};

export default function Knowledge() {
  return (
    <>
      <PageHead title="Knowledge Base" subtitle="The source of your AI's intelligence — files, FAQs, and pages it learns from."
        right={<button className="btn btn-primary"><I.Plus width={15} height={15} /> Add source</button>} />

      <div className="flex items-center gap-2.5 bg-mint-100 rounded-xl px-4 py-3 text-[13.5px] text-emerald-700 font-medium mb-4 fadeup">
        <I.Sparkle width={16} height={16} /> Your AI knows ~8 topics from 3 sources · last trained 2m ago
      </div>

      <Card className="fadeup">
        {sources.map((s, i) => (
          <div key={s.id} className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-line" : ""} hover:bg-surface-2 transition`}>
            <span className="text-xl">{typeIcon[s.type]}</span>
            <span className="flex-1 min-w-0">
              <b className="font-semibold text-sm">{s.name}</b>
              {s.status === "Failed" && <small className="block text-hot text-[12.5px] mt-0.5">Couldn't reach this page.</small>}
            </span>
            <span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full ${statusStyle[s.status]}`}>
              {s.status === "Processing" ? `Processing ${s.pct}%` : s.status === "Synced" ? "● Synced" : "✕ Failed"}
            </span>
            <span className="text-ink-muted text-[12.5px] w-20 text-right">{s.updated}</span>
            {s.status === "Failed"
              ? <button className="btn btn-ghost !py-1.5 !px-4 text-[13px]">Retry</button>
              : <button className="text-ink-muted hover:text-emerald-600 px-2">⋮</button>}
          </div>
        ))}
      </Card>
    </>
  );
}
