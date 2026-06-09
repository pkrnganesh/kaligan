import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHead, MetricCard, Card, ScoreBadge, StateBlock } from "../components/ui";
import * as I from "../components/icons";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

interface Metric {
  value: string;
  deltaPct: string;
  deltaTone?: "up" | "flat";
  spark: string;
}

interface NeedsYouLead {
  id: string;
  score: "Hot" | "Warm" | "Cold";
  name: string;
  email: string;
  note: string;
  time: string;
}

interface RecentActivityItem {
  id: string;
  visitor: string;
  time: string;
  messages: number;
  captured: boolean;
}

interface DashboardMetrics {
  conversations: Metric;
  leadsCaptured: Metric;
  hotLeads: Metric;
  opportunities: Metric;
  needsYou: NeedsYouLead[];
  recentActivity: RecentActivityItem[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/dashboard/metrics?range=${range}`);
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const userName = user?.name || "there";

  const toggleRange = () => {
    setRange((prev) => (prev === "7d" ? "30d" : "7d"));
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <PageHead
          title="Dashboard"
          subtitle={`Good morning, ${userName} — here's how your AI employee is doing.`}
          right={
            <div className="flex items-center gap-2 bg-surface border border-line rounded-full px-3.5 py-1.5 text-[13px] font-semibold cursor-wait">
              Loading...
            </div>
          }
        />
        <div className="grid grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6 h-32 bg-surface-2 border border-line"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHead
          title="Dashboard"
          subtitle="An error occurred while loading dashboard metrics."
        />
        <div className="card p-6 border-hot border text-hot bg-[#fdeceb] flex flex-col items-center">
          <p className="font-semibold">{error}</p>
          <button className="btn btn-primary bg-hot hover:bg-hot-hover text-white mt-4" onClick={fetchMetrics}>
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const isEmpty =
    metrics &&
    metrics.conversations.value === "0" &&
    metrics.leadsCaptured.value === "0" &&
    metrics.recentActivity.length === 0;

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <PageHead
          title="Dashboard"
          subtitle={`Good morning, ${userName} — here's how your AI employee is doing.`}
          right={
            <div
              className="flex items-center gap-2 bg-surface border border-line rounded-full px-3.5 py-1.5 text-[13px] font-semibold cursor-pointer select-none hover:bg-surface-2"
              onClick={toggleRange}
            >
              {range === "7d" ? "Last 7 days" : "Last 30 days"} <I.Chevron />
            </div>
          }
        />
        <StateBlock
          title="Install your chat widget"
          body="No conversations have been recorded yet. Embed the chat widget on your website to start capturing leads and qualified opportunities."
          action="Go to Widget Integration"
          onAction={() => navigate("/app/widget")}
        />
      </div>
    );
  }

  return (
    <>
      <PageHead
        title="Dashboard"
        subtitle={`Good morning, ${userName} — here's how your AI employee is doing.`}
        right={
          <div
            className="flex items-center gap-2 bg-surface border border-line rounded-full px-3.5 py-1.5 text-[13px] font-semibold cursor-pointer select-none hover:bg-surface-2"
            onClick={toggleRange}
          >
            {range === "7d" ? "Last 7 days" : "Last 30 days"} <I.Chevron />
          </div>
        }
      />

      {metrics && (
        <>
          <section className="grid grid-cols-4 gap-4 mb-5.5" style={{ marginBottom: 22 }}>
            <div className="fadeup" style={{ animationDelay: ".04s" }}>
              <MetricCard
                to="/app/conversations"
                label="Conversations"
                value={metrics.conversations.value}
                delta={metrics.conversations.deltaPct}
                deltaTone={metrics.conversations.deltaTone}
                spark={metrics.conversations.spark}
              />
            </div>
            <div className="fadeup" style={{ animationDelay: ".10s" }}>
              <MetricCard
                to="/app/leads"
                label="Leads captured"
                value={metrics.leadsCaptured.value}
                delta={metrics.leadsCaptured.deltaPct}
                deltaTone={metrics.leadsCaptured.deltaTone}
                spark={metrics.leadsCaptured.spark}
              />
            </div>
            <div className="fadeup" style={{ animationDelay: ".16s" }}>
              <MetricCard
                to="/app/leads"
                label="Hot leads"
                value={metrics.hotLeads.value}
                delta={metrics.hotLeads.deltaPct}
                deltaTone={metrics.hotLeads.deltaTone}
                color="#D9534F"
                dot="#D9534F"
                spark={metrics.hotLeads.spark}
              />
            </div>
            <div className="fadeup" style={{ animationDelay: ".22s" }}>
              <MetricCard
                to="/app/leads"
                label="Opportunities"
                value={metrics.opportunities.value}
                delta={metrics.opportunities.deltaPct}
                deltaTone={metrics.opportunities.deltaTone}
                color="#E0A100"
                spark={metrics.opportunities.spark}
              />
            </div>
          </section>

          <div className="grid grid-cols-[1.35fr_1fr] gap-4">
            <Card className="fadeup">
              <div className="flex items-center gap-2.5 px-5 pt-[17px] pb-3.5">
                <I.Bolt className="text-warm" />
                <h2 className="font-display text-[16.5px] font-bold">Needs you</h2>
                <span className="text-xs font-bold bg-[#fdeceb] text-hot px-2.5 py-0.5 rounded-full">
                  {metrics.needsYou.length} hot
                </span>
                <Link to="/app/leads" className="ml-auto text-[13px] font-semibold text-emerald-600 hover:underline">
                  View all leads →
                </Link>
              </div>
              {metrics.needsYou.length === 0 ? (
                <div className="p-8 text-center text-ink-muted text-sm border-t border-line">
                  No active hot leads needing response at this time.
                </div>
              ) : (
                metrics.needsYou.map((l) => (
                  <Link
                    key={l.id}
                    to={`/app/leads/${l.id}`}
                    className="flex items-center gap-3.5 px-5 py-3 border-t border-line hover:bg-surface-2 transition"
                  >
                    <ScoreBadge score={l.score} />
                    <span className="flex flex-col min-w-[128px]">
                      <b className="font-semibold text-sm">{l.name}</b>
                      <small className="text-ink-muted text-[12.5px]">{l.email}</small>
                    </span>
                    <span className="flex-1 text-ink-muted text-[13.5px] truncate max-w-[280px]">
                      AI note: <em className="not-italic text-ink bg-mint-100 px-1.5 py-0.5 rounded">“{l.note}”</em>
                    </span>
                    <span className="text-ink-muted text-[12.5px] whitespace-nowrap">{l.time}</span>
                    <span className="btn btn-ghost !py-1.5 !px-4 text-[13px]">Open</span>
                  </Link>
                ))
              )}
            </Card>

            <Card className="fadeup">
              <div className="flex items-center gap-2.5 px-5 pt-[17px] pb-3.5">
                <h2 className="font-display text-[16.5px] font-bold">Recent activity</h2>
                <Link to="/app/conversations" className="ml-auto text-[13px] font-semibold text-emerald-600 hover:underline">
                  Conversations →
                </Link>
              </div>
              {metrics.recentActivity.length === 0 ? (
                <div className="p-8 text-center text-ink-muted text-sm border-t border-line">
                  No conversation activity yet.
                </div>
              ) : (
                metrics.recentActivity.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3 border-t border-line">
                    <span className="w-[30px] h-[30px] rounded-[9px] grid place-items-center shrink-0 bg-emerald-50 text-emerald-600">
                      <I.Chat width={16} height={16} />
                    </span>
                    <span className="flex-1 text-[13.5px]">
                      {c.visitor} finished a chat
                      <small className="block text-ink-muted text-xs mt-0.5">
                        {c.time} · {c.messages} messages
                      </small>
                    </span>
                    {c.captured && (
                      <span className="text-[11px] font-bold bg-mint-100 text-emerald-700 px-2.5 py-1 rounded-full whitespace-nowrap">
                        Captured lead
                      </span>
                    )}
                  </div>
                ))
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
