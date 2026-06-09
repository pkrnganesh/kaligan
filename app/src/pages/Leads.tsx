import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHead, Card, ScoreBadge, StateBlock } from "../components/ui";
import * as I from "../components/icons";
import { api, getAccessToken } from "../lib/api";

const statusStyle: Record<string, string> = {
  New: "bg-mint-100 text-emerald-700",
  Contacted: "bg-[#eaf2f7] text-cold",
  Qualified: "bg-[#fbf3df] text-warm",
  Won: "bg-emerald-50 text-success",
  Lost: "bg-[#f0efe2] text-ink-muted",
};

export function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [scoreFilter, setScoreFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const scoreOptions = ["All", "Hot", "Warm", "Cold"];
  const statusOptions = ["All", "New", "Contacted", "Won", "Lost"];

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = "";
      const params: string[] = [];
      if (scoreFilter !== "All") params.push(`score=${scoreFilter}`);
      if (statusFilter !== "All") params.push(`status=${statusFilter}`);
      if (params.length > 0) query = `?${params.join("&")}`;

      const data = await api.get(`/leads${query}`);
      setLeads(data);
    } catch (err: any) {
      setError(err.message || "Failed to load leads list");
    } finally {
      setLoading(false);
    }
  }, [scoreFilter, statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleExportCsv = async () => {
    try {
      const token = getAccessToken();
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api/v1';
      const response = await fetch(`${baseUrl}/leads/export`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to export CSV");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Failed to download CSV");
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  };

  return (
    <>
      <PageHead
        title="Leads"
        subtitle="Captured, scored, and ready to convert."
        right={
          <button className="btn btn-ghost" onClick={handleExportCsv}>
            Export CSV
          </button>
        }
      />

      {error && (
        <div className="card p-4 text-hot border border-hot bg-[#fdeceb] mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button className="btn btn-ghost !py-1 text-xs" onClick={fetchLeads}>Retry</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-6 items-center mb-4 text-[13px]">
        <div className="flex items-center gap-2">
          <span className="text-ink-muted font-medium">Score:</span>
          <div className="flex gap-1">
            {scoreOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setScoreFilter(opt)}
                className={`px-3 py-1 rounded-full font-semibold transition ${
                  scoreFilter === opt ? "bg-emerald-600 text-white" : "text-ink-muted hover:bg-emerald-50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-ink-muted font-medium">Status:</span>
          <div className="flex gap-1">
            {statusOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setStatusFilter(opt)}
                className={`px-3 py-1 rounded-full font-semibold transition ${
                  statusFilter === opt ? "bg-emerald-600 text-white" : "text-ink-muted hover:bg-emerald-50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="fadeup overflow-x-auto">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[1, 2, 3, 5].map((i) => (
              <div key={i} className="h-10 bg-surface-2 border border-line rounded"></div>
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <StateBlock
              title="No leads found"
              body="No leads match the selected score or status filters, or no leads have been captured yet."
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-ink-muted text-left text-[12.5px] font-semibold border-b border-line">
                {["Name", "Contact", "Score", "Status", "Source", "Date"].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l, i) => (
                <tr
                  key={l.id}
                  className={`${i > 0 ? "border-t border-line" : ""} hover:bg-surface-2 transition`}
                >
                  <td className="px-5 py-3.5">
                    <Link to={`/app/leads/${l.id}`} className="font-semibold hover:text-emerald-600 text-emerald-800">
                      {l.name || "Anonymous Lead"}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-ink-muted">
                    <span className="block">{l.email || "No email"}</span>
                    {l.phone && <span className="block text-xs text-ink-muted">{l.phone}</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <ScoreBadge score={l.score} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full ${
                        statusStyle[l.status] || "bg-[#f0efe2] text-ink-muted"
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-ink-muted capitalize">{l.source || "web"}</td>
                  <td className="px-5 py-3.5 text-ink-muted">{formatTime(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}

export function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/leads/${id}`);
      setLead(data);
    } catch (err: any) {
      setError(err.message || "Failed to load lead details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeadDetail();
  }, [fetchLeadDetail]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!lead || !id) return;
    try {
      // Optimistic update
      setLead((prev: any) => ({ ...prev, status: newStatus }));
      await api.patch(`/leads/${id}`, { status: newStatus });
    } catch (err: any) {
      alert(err.message || "Failed to update lead status");
      // Rollback
      fetchLeadDetail();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Copied "${text}" to clipboard!`);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-surface-2 rounded mb-6"></div>
        <div className="grid grid-cols-[1.3fr_1fr] gap-4">
          <div className="card h-96 bg-surface-2"></div>
          <div className="card h-64 bg-surface-2"></div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-8 text-center text-hot bg-[#fdeceb] border border-hot rounded">
        <p className="font-semibold">{error || "Lead not found"}</p>
        <Link to="/app/leads" className="btn btn-primary bg-hot mt-4 inline-block text-white">
          Back to Leads
        </Link>
      </div>
    );
  }

  // Determine what fields are captured
  const capturedFields: string[] = [];
  if (lead.name) capturedFields.push("Name");
  if (lead.email) capturedFields.push("Email");
  if (lead.phone) capturedFields.push("Phone");

  return (
    <>
      <div className="flex items-center gap-2.5 text-ink-muted text-[13.5px] font-semibold mb-5 fadeup">
        <Link to="/app/leads" className="hover:text-ink">
          ← Leads
        </Link>
        <span className="text-ink ml-1">{lead.name || "Anonymous Lead"}</span>
        <span className="ml-2">
          <ScoreBadge score={lead.score} />
        </span>
      </div>

      <div className="grid grid-cols-[1.3fr_1fr] gap-4 fadeup">
        {/* Conversation & Contact Information Card */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-6 pb-4 border-b border-line mb-4">
              <span className="text-[14px]">
                <span className="text-ink-muted text-[12.5px] block">Email</span>
                {lead.email ? (
                  <span className="flex items-center gap-1">
                    {lead.email}
                    <button className="text-emerald-600 hover:text-emerald-800" onClick={() => copyToClipboard(lead.email)}>
                      📋
                    </button>
                  </span>
                ) : (
                  <span className="text-ink-muted italic">Not provided</span>
                )}
              </span>
              
              <span className="text-[14px]">
                <span className="text-ink-muted text-[12.5px] block">Phone</span>
                {lead.phone ? (
                  <span className="flex items-center gap-1">
                    {lead.phone}
                    <button className="text-emerald-600 hover:text-emerald-800" onClick={() => copyToClipboard(lead.phone)}>
                      📋
                    </button>
                  </span>
                ) : (
                  <span className="text-ink-muted italic">Not provided</span>
                )}
              </span>
            </div>

            <h3 className="font-display font-bold mt-4 mb-3 text-[15px]">Conversation</h3>
            <div className="space-y-4 text-[13.5px] max-h-[320px] overflow-y-auto pr-1">
              {lead.conversation?.messages && lead.conversation.messages.length > 0 ? (
                lead.conversation.messages.map((m: any) => {
                  const isVisitor = m.role === "visitor";
                  return (
                    <div key={m.id} className={isVisitor ? "" : "bg-emerald-50 border border-mint-300 rounded-xl px-3 py-2"}>
                      <span className="text-ink-muted font-semibold mr-1">
                        {isVisitor ? "Visitor:" : "AI:"}
                      </span>
                      {m.content}
                    </div>
                  );
                })
              ) : (
                <div className="text-ink-muted italic py-4">No logged messages found for this lead session.</div>
              )}
            </div>
          </div>

          <div className="flex gap-2.5 mt-6 border-t border-line pt-4">
            <button
              className={`btn ${lead.status === "Contacted" ? "btn-primary" : "btn-ghost border"}`}
              onClick={() => handleUpdateStatus("Contacted")}
            >
              Mark Contacted
            </button>
            <button
              className={`btn ${lead.status === "Won" ? "btn-primary bg-success text-white" : "btn-ghost border"}`}
              onClick={() => handleUpdateStatus("Won")}
            >
              Won
            </button>
            <button
              className={`btn ${lead.status === "Lost" ? "btn-primary bg-ink-muted text-white" : "btn-ghost border"}`}
              onClick={() => handleUpdateStatus("Lost")}
            >
              Lost
            </button>
          </div>
        </Card>

        {/* AI Insights Card */}
        <Card className="p-5">
          <h3 className="font-display font-bold text-[15px] flex items-center gap-2 mb-4">
            <I.Sparkle width={15} height={15} className="text-teal-400" /> AI insights
          </h3>
          <dl className="space-y-4 text-[13.5px]">
            <div>
              <dt className="text-ink-muted text-[12.5px]">Intent Summary</dt>
              <dd className="font-semibold text-ink mt-0.5">{lead.intent || "No intent captured"}</dd>
            </div>
            <div>
              <dt className="text-ink-muted text-[12.5px]">Why {lead.score}</dt>
              <dd className="mt-0.5 leading-relaxed text-ink">{lead.aiNote || "No detail provided"}</dd>
            </div>
            <div>
              <dt className="text-ink-muted text-[12.5px]">Captured Fields</dt>
              <dd className="mt-0.5 font-semibold text-emerald-800">
                {capturedFields.length > 0 ? capturedFields.join(", ") : "None yet"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted text-[12.5px]">Source Channel</dt>
              <dd className="mt-0.5 capitalize text-ink-muted">{lead.source || "web"}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}
