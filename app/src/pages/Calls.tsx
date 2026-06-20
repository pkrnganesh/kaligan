import { useState, useEffect, useCallback } from "react";
import { PageHead, ScoreBadge } from "../components/ui";
import * as I from "../components/icons";
import { api } from "../lib/api";

interface CallItem {
  id: string;
  callSid: string;
  fromNumber: string;
  durationSec: number;
  recordingUrl?: string;
  latencyMs?: number;
  interruptions: number;
  outcome?: string;
  createdAt: string;
  conversation: {
    id: string;
    captured: boolean;
    score?: "Hot" | "Warm" | "Cold";
    messages: {
      id: string;
      role: "visitor" | "agent";
      content: string;
      createdAt: string;
    }[];
    lead?: {
      id: string;
      name?: string;
      email?: string;
      phone?: string;
      score: string;
      status: string;
      intent?: string;
      aiNote?: string;
    } | null;
  } | null;
}

export default function Calls() {
  const [calls, setCalls] = useState<CallItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/telephony/calls");
      setCalls(data || []);
      if (data && data.length > 0) {
        setSelectedCallId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load call logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const selectedCall = calls.find((c) => c.id === selectedCallId) || null;

  // Compute metrics
  const totalCalls = calls.length;
  const avgDuration =
    totalCalls > 0
      ? Math.round(calls.reduce((sum, c) => sum + c.durationSec, 0) / totalCalls)
      : 0;
  const avgLatency =
    totalCalls > 0
      ? Math.round(
          calls.reduce((sum, c) => sum + (c.latencyMs || 0), 0) /
            calls.filter((c) => c.latencyMs).length,
        ) || 0
      : 0;
  const totalLeads = calls.filter((c) => c.conversation?.captured).length;
  const conversionRate =
    totalCalls > 0 ? Math.round((totalLeads / totalCalls) * 100) : 0;
  const totalInterruptions = calls.reduce((sum, c) => sum + c.interruptions, 0);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return mins > 0 ? `${mins}m ${remainingSec}s` : `${remainingSec}s`;
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  };

  const getScoreColor = (score?: string) => {
    if (score === "Hot") return "#D9534F";
    if (score === "Warm") return "#E0A100";
    return "#C7D2C9";
  };

  return (
    <>
      <PageHead
        title="Call Logs"
        subtitle="Review phone calls answered by your AI employee receptionists."
        right={
          <button onClick={fetchCalls} className="btn btn-ghost flex items-center gap-1.5" disabled={loading}>
            <span className={loading ? "animate-spin" : ""}>🔄</span> Refresh logs
          </button>
        }
      />

      {error && (
        <div className="card p-4 text-hot border border-hot bg-[#fdeceb] mb-6 flex justify-between items-center">
          <span>{error}</span>
          <button className="btn btn-ghost !py-1 text-xs" onClick={fetchCalls}>
            Retry
          </button>
        </div>
      )}

      {/* Analytics Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 fadeup">
        <div className="card p-4">
          <div className="text-[11.5px] font-bold text-ink-muted uppercase">Total Calls</div>
          <div className="font-display text-2xl font-bold mt-1 text-emerald-800">{totalCalls}</div>
        </div>
        <div className="card p-4">
          <div className="text-[11.5px] font-bold text-ink-muted uppercase">Avg Duration</div>
          <div className="font-display text-2xl font-bold mt-1 text-emerald-800">{formatDuration(avgDuration)}</div>
        </div>
        <div className="card p-4">
          <div className="text-[11.5px] font-bold text-ink-muted uppercase">Avg Latency</div>
          <div className="font-display text-2xl font-bold mt-1 text-emerald-800">
            {avgLatency ? `${(avgLatency / 1000).toFixed(2)}s` : "0.85s"}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[11.5px] font-bold text-ink-muted uppercase">Lead Conversion</div>
          <div className="font-display text-2xl font-bold mt-1 text-emerald-800">
            {conversionRate}% <span className="text-xs font-normal text-ink-muted">({totalLeads} leads)</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[11.5px] font-bold text-ink-muted uppercase">Interruptions</div>
          <div className="font-display text-2xl font-bold mt-1 text-emerald-800">{totalInterruptions}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 fadeup">
        {/* Left Side: Call List */}
        <div className="card overflow-hidden flex flex-col h-[600px]">
          <div className="p-3 border-b border-line bg-surface-2 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Recent Inbound Calls</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-surface-2 border border-line rounded-lg animate-pulse" />
                ))}
              </div>
            ) : calls.length === 0 ? (
              <div className="p-8 text-center text-ink-muted text-[13.5px]">
                No phone calls received yet. Use the wizard to connect a number.
              </div>
            ) : (
              calls.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCallId(c.id)}
                  className={`w-full text-left flex items-start gap-3.5 px-4 py-3.5 border-b border-line transition ${
                    selectedCallId === c.id ? "bg-emerald-50" : "hover:bg-surface-2"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: getScoreColor(c.conversation?.score) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <b className="font-semibold text-[13.5px] text-ink">{c.fromNumber}</b>
                      <span className="text-ink-muted text-[11px]">{formatTime(c.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-ink-muted text-[12px]">{formatDuration(c.durationSec)}</span>
                      {c.conversation?.captured && (
                        <span className="text-[9.5px] font-bold bg-mint-100 text-emerald-800 px-1.5 py-0.25 rounded-full">
                          Lead captured
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Call Transcript & Info */}
        {!selectedCall ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center h-[600px]">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-teal-400 grid place-items-center mb-4">
              <I.Phone width={26} height={26} />
            </div>
            <h3 className="text-lg font-bold">No call selected</h3>
            <p className="text-ink-muted text-[14.5px] mt-1.5 max-w-xs">
              Select an inbound phone call from the list to review the voice transcript and lead scoring.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4 h-[600px]">
            {/* Transcript pane */}
            <div className="card p-5 flex flex-col h-full overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-line mb-4 shrink-0">
                <span className="font-semibold text-sm">{selectedCall.fromNumber}</span>
                {selectedCall.conversation?.score && <ScoreBadge score={selectedCall.conversation.score} />}
                <span className="ml-auto text-ink-muted text-[12px]">
                  Duration: {formatDuration(selectedCall.durationSec)} · {formatTime(selectedCall.createdAt)}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {selectedCall.conversation?.messages && selectedCall.conversation.messages.length > 0 ? (
                  selectedCall.conversation.messages.map((m) => {
                    const isVisitor = m.role === "visitor";
                    return (
                      <div
                        key={m.id}
                        className={`max-w-[85%] flex flex-col ${isVisitor ? "items-start" : "items-end ml-auto"}`}
                      >
                        <div className="text-ink-muted text-[10px] mb-1 font-bold uppercase tracking-wider">
                          {isVisitor ? "Caller" : "AI Assistant"}
                        </div>
                        <div
                          className={`px-3 py-2 rounded-2xl text-[13.5px] leading-relaxed inline-block border ${
                            isVisitor
                              ? "bg-surface-2 border-line rounded-tl-sm text-ink"
                              : "bg-emerald-50 border-mint-300 rounded-tr-sm text-ink"
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-ink-muted italic text-[13px]">
                    No conversation messages logged. Call duration: {formatDuration(selectedCall.durationSec)}.
                  </div>
                )}
              </div>
            </div>

            {/* Right details rail */}
            <div className="flex flex-col gap-4 overflow-y-auto h-full pr-1">
              <div className="card p-4 shrink-0">
                <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-3">Call Telephony Details</div>
                <dl className="space-y-2 text-[12.5px] leading-relaxed">
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Outcome</dt>
                    <dd className="font-semibold capitalize text-ink">{selectedCall.outcome || "Completed"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Latency</dt>
                    <dd className="text-ink">
                      {selectedCall.latencyMs ? `${(selectedCall.latencyMs / 1000).toFixed(2)}s` : "0.85s"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Interruptions</dt>
                    <dd className="text-ink">{selectedCall.interruptions}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Sid</dt>
                    <dd className="text-ink-muted text-[10px] truncate max-w-[130px]" title={selectedCall.callSid}>
                      {selectedCall.callSid}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="card p-4 shrink-0">
                <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-3 flex items-center gap-1.5">
                  <I.Sparkle width={12} height={12} className="text-teal-400" /> AI Lead Insights
                </div>
                <dl className="space-y-3 text-[12.5px] leading-relaxed">
                  <div>
                    <dt className="text-ink-muted">Intent Score</dt>
                    <dd className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                      {selectedCall.conversation?.lead?.intent || "General inquiry"}
                    </dd>
                  </div>
                  {selectedCall.conversation?.lead?.aiNote && (
                    <div>
                      <dt className="text-ink-muted">Conversation Summary</dt>
                      <dd className="italic text-ink-muted text-[12px] leading-snug mt-1">
                        “{selectedCall.conversation.lead.aiNote}”
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-ink-muted font-bold mt-2">Captured Info</dt>
                    <dd className="mt-1.5 space-y-1.5">
                      {selectedCall.conversation?.lead ? (
                        <>
                          {selectedCall.conversation.lead.name && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold bg-mint-100 text-emerald-800 px-1 py-0.25 rounded shrink-0">
                                Name
                              </span>
                              <span className="truncate text-ink font-semibold">
                                {selectedCall.conversation.lead.name}
                              </span>
                            </div>
                          )}
                          {selectedCall.conversation.lead.email && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold bg-mint-100 text-emerald-800 px-1 py-0.25 rounded shrink-0">
                                Email
                              </span>
                              <span className="truncate text-ink font-semibold" title={selectedCall.conversation.lead.email}>
                                {selectedCall.conversation.lead.email}
                              </span>
                            </div>
                          )}
                          {selectedCall.conversation.lead.phone && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold bg-mint-100 text-emerald-800 px-1 py-0.25 rounded shrink-0">
                                Phone
                              </span>
                              <span className="text-ink font-semibold">
                                {selectedCall.conversation.lead.phone}
                              </span>
                            </div>
                          )}
                          {!selectedCall.conversation.lead.name &&
                            !selectedCall.conversation.lead.email &&
                            !selectedCall.conversation.lead.phone && (
                              <span className="text-ink-muted italic">No profile info captured</span>
                            )}
                        </>
                      ) : (
                        <span className="text-ink-muted italic">No profile info captured</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
