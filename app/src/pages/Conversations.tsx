import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHead, ScoreBadge } from "../components/ui";
import * as I from "../components/icons";
import { api } from "../lib/api";

interface ConvoItem {
  id: string;
  visitorLabel: string;
  snippet: string;
  score: "Hot" | "Warm" | "Cold";
  captured: boolean;
  messageCount: number;
  startedAt: string;
}

interface MessageItem {
  id: string;
  role: "visitor" | "agent";
  content: string;
  createdAt: string;
}

interface LeadInfo {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  score: string;
  status: string;
  intent?: string;
  aiNote?: string;
}

interface ConvoDetail {
  id: string;
  channel: string;
  visitorLabel?: string;
  visitorMeta?: any;
  captured: boolean;
  score?: "Hot" | "Warm" | "Cold";
  messageCount: number;
  startedAt: string;
  messages: MessageItem[];
  lead: LeadInfo | null;
}

export default function Conversations() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const tabs = ["All", "Captured", "Hot", "Unread"];
  const [activeTab, setActiveTab] = useState("All");
  const [list, setList] = useState<ConvoItem[]>([]);
  const [detail, setDetail] = useState<ConvoDetail | null>(null);
  
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversations list based on active tab
  const fetchList = useCallback(async () => {
    setListLoading(true);
    try {
      const tabQuery = activeTab.toLowerCase();
      const data = await api.get(`/conversations?tab=${tabQuery}`);
      setList(data);
      
      // If we have no active id in URL, navigate to the first one
      if (data.length > 0 && !id) {
        navigate(`/app/conversations/${data[0].id}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load conversations");
    } finally {
      setListLoading(false);
    }
  }, [activeTab, id, navigate]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Load active conversation detail
  useEffect(() => {
    if (!id) {
      setDetail(null);
      return;
    }

    let isSubscribed = true;
    const fetchDetail = async () => {
      setDetailLoading(true);
      try {
        const data = await api.get(`/conversations/${id}`);
        if (isSubscribed) {
          setDetail(data);
        }
      } catch (err: any) {
        console.error("Failed to load thread details", err);
      } finally {
        if (isSubscribed) {
          setDetailLoading(false);
        }
      }
    };

    fetchDetail();
    return () => {
      isSubscribed = false;
    };
  }, [id]);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = new Date().getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
      <PageHead title="Conversations" subtitle="Every chat your AI has had with a visitor." />
      
      {error && (
        <div className="card p-4 text-hot border border-hot bg-[#fdeceb] mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button className="btn btn-ghost !py-1 text-xs" onClick={fetchList}>Retry</button>
        </div>
      )}

      <div className="grid grid-cols-[340px_1fr] gap-4 fadeup">
        {/* Left Side: Threads List */}
        <div className="card overflow-hidden flex flex-col h-[620px]">
          <div className="flex gap-1.5 p-3 border-b border-line shrink-0">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`text-[12.5px] font-semibold px-3 py-1.5 rounded-full transition ${
                  activeTab === t ? "bg-emerald-600 text-white" : "text-ink-muted hover:bg-emerald-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {listLoading ? (
              <div className="p-4 space-y-3 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-surface-2 border border-line rounded-lg"></div>
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="p-8 text-center text-ink-muted text-sm">
                No threads found in this category.
              </div>
            ) : (
              list.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/app/conversations/${c.id}`)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-line transition ${
                    id === c.id ? "bg-emerald-50" : "hover:bg-surface-2"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: getScoreColor(c.score) }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2">
                      <b className="font-semibold text-[13.5px]">{c.visitorLabel}</b>
                      {c.captured && (
                        <span className="text-[10px] font-bold bg-mint-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                          captured
                        </span>
                      )}
                    </span>
                    <span className="block text-ink-muted text-[12.5px] truncate mt-0.5">{c.snippet}</span>
                  </span>
                  <span className="text-ink-muted text-[11.5px] whitespace-nowrap">{formatTime(c.startedAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Conversation Window */}
        {detailLoading && !detail ? (
          <div className="card p-12 flex items-center justify-center h-[620px] animate-pulse bg-surface-2">
            <span className="text-ink-muted text-sm">Loading thread transcript...</span>
          </div>
        ) : !detail ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center h-[620px]">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-teal-400 grid place-items-center mb-4">
              <I.Chat width={26} height={26} />
            </div>
            <h3 className="text-lg font-bold">No conversation selected</h3>
            <p className="text-ink-muted text-[14.5px] mt-1.5 max-w-xs">
              Select a chat thread from the left rail to view its message details and visitor intelligence.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_240px] gap-4 h-[620px]">
            {/* Thread Chat Transcript */}
            <div className="card p-5 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2.5 pb-3 border-b border-line mb-4 shrink-0">
                <b className="font-semibold">{detail.visitorLabel || "Visitor"}</b>
                {detail.score && <ScoreBadge score={detail.score} />}
                <span className="ml-auto text-ink-muted text-[12.5px]">
                  {detail.messages.length} messages · {formatTime(detail.startedAt)}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {detail.messages.map((m) => {
                  const isVisitor = m.role === "visitor";
                  return (
                    <div key={m.id} className={`max-w-[80%] flex flex-col ${isVisitor ? "items-start" : "items-end ml-auto"}`}>
                      <div className="text-ink-muted text-[11px] mb-1 tracking-wide">
                        {isVisitor ? "VISITOR" : "AI"}
                      </div>
                      <div
                        className={`px-3 py-2 rounded-xl text-[13.5px] leading-relaxed inline-block border ${
                          isVisitor
                            ? "bg-surface-2 border-line rounded-tl-[3px] text-ink"
                            : "bg-emerald-50 border-mint-300 rounded-tr-[3px] text-ink"
                        }`}
                      >
                        {m.content}
                      </div>
                      <span className="text-[10px] text-ink-muted mt-1 px-1">
                        {formatTime(m.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Information Rail */}
            <div className="flex flex-col gap-4 overflow-y-auto h-full">
              {/* Visitor metadata */}
              <div className="card p-4 shrink-0">
                <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-3">
                  Visitor info
                </div>
                <dl className="space-y-2 text-[13px]">
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Location</dt>
                    <dd>{detail.visitorMeta?.city || detail.visitorMeta?.ip || "Unknown"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Platform</dt>
                    <dd>{detail.visitorMeta?.device || detail.visitorMeta?.os || "Web Client"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Channel</dt>
                    <dd className="capitalize">{detail.channel}</dd>
                  </div>
                </dl>
              </div>

              {/* AI insights & Lead Details */}
              <div className="card p-4 shrink-0">
                <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-3 flex items-center gap-1.5">
                  <I.Sparkle width={12} height={12} className="text-teal-400" /> AI insights
                </div>
                
                <dl className="space-y-3 text-[13px]">
                  <div>
                    <dt className="text-ink-muted">Lead Intent</dt>
                    <dd className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                      {detail.lead?.intent || "Casual browsing"}
                    </dd>
                  </div>
                  {detail.lead?.aiNote && (
                    <div>
                      <dt className="text-ink-muted">Reasoning</dt>
                      <dd className="italic text-ink-muted leading-tight mt-0.5">
                        “{detail.lead.aiNote}”
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-ink-muted">Captured Profile</dt>
                    <dd className="mt-1 space-y-1">
                      {detail.lead ? (
                        <>
                          {detail.lead.name && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] bg-mint-100 text-emerald-800 px-1.5 rounded">Name</span>
                              <span className="truncate">{detail.lead.name}</span>
                            </div>
                          )}
                          {detail.lead.email && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] bg-mint-100 text-emerald-800 px-1.5 rounded">Email</span>
                              <span className="truncate" title={detail.lead.email}>{detail.lead.email}</span>
                            </div>
                          )}
                          {detail.lead.phone && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] bg-mint-100 text-emerald-800 px-1.5 rounded">Phone</span>
                              <span>{detail.lead.phone}</span>
                            </div>
                          )}
                          {!detail.lead.name && !detail.lead.email && !detail.lead.phone && (
                            <span className="text-ink-muted italic">None yet</span>
                          )}
                        </>
                      ) : (
                        <span className="text-ink-muted italic">None yet</span>
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
