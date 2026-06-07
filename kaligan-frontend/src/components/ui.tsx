import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkle } from "./icons";

export function StatusChip({ live = true, label }: { live?: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 bg-surface border border-mint-300 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-emerald-700">
      <span className={`w-[7px] h-[7px] rounded-full ${live ? "bg-success pulse-dot" : "bg-ink-muted"}`} />
      {label}
    </span>
  );
}

const scoreStyles: Record<string, string> = {
  Hot: "bg-[#fdeceb] text-hot", Warm: "bg-[#fbf3df] text-warm", Cold: "bg-[#eaf2f7] text-cold",
};
const scoreDot: Record<string, string> = { Hot: "bg-hot", Warm: "bg-warm", Cold: "bg-cold" };
export function ScoreBadge({ score }: { score: "Hot" | "Warm" | "Cold" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1 rounded-full ${scoreStyles[score]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${scoreDot[score]}`} /> {score}
    </span>
  );
}

export function Sparkline({ points, color = "#15916F" }: { points: string; color?: string }) {
  return (
    <svg width="70" height="26" viewBox="0 0 70 26" fill="none">
      <polyline points={points} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MetricCard({ label, value, delta, deltaTone = "up", spark, color, to, dot }:
  { label: string; value: string; delta: string; deltaTone?: "up" | "flat"; spark: string; color?: string; to: string; dot?: string }) {
  return (
    <Link to={to} className="card p-[18px] pb-3.5 transition hover:-translate-y-0.5 hover:shadow-lift hover:border-mint-300 block">
      <div className="text-[13px] font-semibold text-ink-muted flex items-center gap-2">
        {dot && <span className="w-2 h-2 rounded-full" style={{ background: dot }} />}{label}
      </div>
      <div className="font-display text-[34px] font-bold mt-2.5 leading-none" style={color ? { color } : undefined}>{value}</div>
      <div className="flex items-center justify-between mt-3">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${deltaTone === "up" ? "bg-emerald-50 text-success" : "bg-[#f0efe2] text-ink-muted"}`}>{delta}</span>
        <Sparkline points={spark} color={color || "#15916F"} />
      </div>
    </Link>
  );
}

export function StateBlock({ title, body, action, onAction }:
  { title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <div className="card p-12 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-teal-400 grid place-items-center mb-4">
        <Sparkle width={26} height={26} />
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-ink-muted text-[14.5px] mt-1.5 max-w-sm">{body}</p>
      {action && <button className="btn btn-primary mt-5" onClick={onAction}>{action}</button>}
    </div>
  );
}

export function PageHead({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 fadeup">
      <div>
        <h1 className="text-[30px] font-bold leading-tight">{title}</h1>
        {subtitle && <p className="text-ink-muted text-[14.5px] mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Card({ children, className = "", style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return <section className={`card overflow-hidden ${className}`} style={style}>{children}</section>;
}
