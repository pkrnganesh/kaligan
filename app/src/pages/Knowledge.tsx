import { useEffect, useState } from "react";
import { PageHead, Card } from "../components/ui";
import * as I from "../components/icons";
import { api } from "../lib/api";

interface DocSource {
  id: string;
  type: string;
  name: string;
  status: string;
  chunkCount: number;
  pct: number;
  updatedAt: string;
  error?: string | null;
}

interface KbMetrics {
  sources: number;
  ready: number;
  topicsApprox: number;
  lastTrainedAt: string;
}

const typeIcon: Record<string, string> = { PDF: "📄", TXT: "📄", FAQ: "❓", URL: "🔗" };
const statusStyle: Record<string, string> = {
  ready: "bg-emerald-50 text-success",
  processing: "bg-[#fbf3df] text-warm",
  failed: "bg-[#fdeceb] text-hot",
};

export default function Knowledge() {
  const [sources, setSources] = useState<DocSource[]>([]);
  const [metrics, setMetrics] = useState<KbMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [sourceType, setSourceType] = useState<"file" | "url" | "faq">("file");

  // Form states
  const [urlInput, setUrlInput] = useState("");
  const [urlName, setUrlName] = useState("");
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [faqName, setFaqName] = useState("");
  const [faqItems, setFaqItems] = useState<{ q: string; a: string }[]>([{ q: "", a: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchSources = async () => {
    try {
      const docs = await api.get("/kb/documents");
      setSources(docs || []);
    } catch (err) {
      console.error("Failed to fetch sources:", err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const data = await api.get("/kb/status");
      setMetrics(data);
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
    }
  };

  // Poll while any document is processing
  useEffect(() => {
    const loadInit = async () => {
      await fetchSources();
      await fetchMetrics();
      setLoading(false);
    };
    loadInit();
  }, []);

  useEffect(() => {
    const isProcessing = sources.some(s => s.status === "processing");
    if (!isProcessing) return;

    const interval = setInterval(() => {
      fetchSources();
      fetchMetrics();
    }, 3000);

    return () => clearInterval(interval);
  }, [sources]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this source? All associated vector chunks will be permanently removed.")) return;
    try {
      await api.del(`/kb/documents/${id}`);
      fetchSources();
      fetchMetrics();
    } catch (err: any) {
      alert(err.message || "Failed to delete document.");
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await api.post(`/kb/documents/${id}/retry`);
      fetchSources();
    } catch (err: any) {
      alert(err.message || "Failed to retry ingestion.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      if (sourceType === "file") {
        if (!fileInput) throw new Error("Please select a file to upload.");
        await api.upload("/kb/documents", fileInput);
      } else if (sourceType === "url") {
        if (!urlInput.trim()) throw new Error("Please enter a URL.");
        await api.post("/kb/documents", {
          type: "url",
          url: urlInput.trim(),
          name: urlName.trim() || undefined,
        });
      } else if (sourceType === "faq") {
        const validItems = faqItems.filter(item => item.q.trim() && item.a.trim());
        if (validItems.length === 0) throw new Error("Please fill in at least one Q&A pair.");
        await api.post("/kb/documents", {
          type: "faq",
          name: faqName.trim() || undefined,
          items: JSON.stringify(validItems),
        });
      }

      // Reset states and close modal
      setUrlInput("");
      setUrlName("");
      setFileInput(null);
      setFaqName("");
      setFaqItems([{ q: "", a: "" }]);
      setModalOpen(false);
      
      // Refresh list
      fetchSources();
      fetchMetrics();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to ingest source.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatUpdateDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const handleFaqChange = (idx: number, field: "q" | "a", value: string) => {
    const newItems = [...faqItems];
    newItems[idx][field] = value;
    setFaqItems(newItems);
  };

  const addFaqField = () => setFaqItems([...faqItems, { q: "", a: "" }]);
  const removeFaqField = (idx: number) => setFaqItems(faqItems.filter((_, i) => i !== idx));

  return (
    <>
      <PageHead
        title="Knowledge Base"
        subtitle="The source of your AI's intelligence — files, FAQs, and pages it learns from."
        right={
          <button className="btn btn-primary animate-pulse-soft" onClick={() => setModalOpen(true)}>
            <I.Plus width={15} height={15} /> Add source
          </button>
        }
      />

      {metrics && (
        <div className="flex items-center gap-2.5 bg-mint-100 rounded-xl px-4 py-3 text-[13.5px] text-emerald-700 font-medium mb-4 fadeup">
          <I.Sparkle width={16} height={16} /> Your AI knows ~{metrics.topicsApprox} topics from {metrics.sources} source{metrics.sources !== 1 ? "s" : ""} · last trained {formatUpdateDate(metrics.lastTrainedAt)}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-ink-muted">Loading documents...</div>
      ) : sources.length === 0 ? (
        <div className="text-center py-16 card p-8 fadeup">
          <span className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center mx-auto mb-4">
            <I.Book width={24} height={24} />
          </span>
          <h3 className="font-display text-lg font-bold">No knowledge sources</h3>
          <p className="text-ink-muted text-sm mt-1 max-w-sm mx-auto">
            Upload policies, paste Q&As, or link webpage documentation so your AI can answer visitors.
          </p>
          <button className="btn btn-primary mt-5" onClick={() => setModalOpen(true)}>
            Add your first source
          </button>
        </div>
      ) : (
        <Card className="fadeup">
          {sources.map((s, i) => (
            <div key={s.id} className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-line" : ""} hover:bg-surface-2 transition`}>
              <span className="text-xl">{typeIcon[s.type.toUpperCase()] || "📄"}</span>
              <span className="flex-1 min-w-0">
                <b className="font-semibold text-sm block truncate">{s.name}</b>
                {s.status === "failed" && (
                  <small className="block text-hot text-[12.5px] mt-0.5 font-medium">
                    {s.error || "Failed to parse content."}
                  </small>
                )}
                {s.status === "ready" && (
                  <small className="block text-ink-muted text-[12px] mt-0.5">
                    {s.chunkCount} vector chunks generated
                  </small>
                )}
              </span>
              <span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full ${statusStyle[s.status]}`}>
                {s.status === "processing" ? `Processing ${s.pct}%` : s.status === "ready" ? "● Synced" : "✕ Failed"}
              </span>
              <span className="text-ink-muted text-[12.5px] w-20 text-right">{formatUpdateDate(s.updatedAt)}</span>
              <div className="flex items-center gap-2">
                {s.status === "failed" ? (
                  <button onClick={() => handleRetry(s.id)} className="btn btn-ghost !py-1.5 !px-4 text-[13px]">
                    Retry
                  </button>
                ) : (
                  <button onClick={() => handleDelete(s.id)} className="text-ink-muted hover:text-red-600 transition px-2 py-1">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* POPUP MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-canvas/80 backdrop-blur z-50 grid place-items-center p-4">
          <div className="card max-w-md w-full p-6 relative shadow-lift animate-fadeup">
            <button
              onClick={() => {
                setModalOpen(false);
                setSubmitError(null);
              }}
              className="absolute top-4 right-4 text-ink-muted hover:text-ink transition"
            >
              ✕
            </button>
            <h2 className="font-display text-lg font-bold mb-4">Add knowledge source</h2>
            
            <div className="flex gap-2 mb-4 border-b border-line pb-2">
              {(["file", "url", "faq"] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setSourceType(tab);
                    setSubmitError(null);
                  }}
                  className={`text-[13px] font-semibold px-3 py-1.5 rounded-lg transition ${
                    sourceType === tab ? "bg-emerald-600 text-white" : "hover:bg-surface-2"
                  }`}
                >
                  {tab === "file" ? "Upload File" : tab === "url" ? "Web URL" : "FAQ Q&As"}
                </button>
              ))}
            </div>

            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[12.5px] font-medium leading-relaxed">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {sourceType === "file" && (
                <div className="mb-4">
                  <label className="field-label">File (.txt, .pdf under 10MB)</label>
                  <input
                    required
                    type="file"
                    accept=".pdf,.txt"
                    onChange={(e) => setFileInput(e.target.files?.[0] || null)}
                    className="w-full text-sm text-ink-muted border border-dashed border-line rounded-xl p-6 text-center cursor-pointer hover:border-mint-300 transition"
                  />
                  {fileInput && (
                    <div className="text-[12.5px] font-semibold text-emerald-700 mt-2">
                      Selected: {fileInput.name} ({(fileInput.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
              )}

              {sourceType === "url" && (
                <>
                  <div className="mb-3">
                    <label className="field-label">Source name (optional)</label>
                    <input
                      className="input"
                      placeholder="Pricing info, refund policy..."
                      value={urlName}
                      onChange={(e) => setUrlName(e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="field-label">Webpage URL</label>
                    <input
                      required
                      type="url"
                      className="input"
                      placeholder="https://acme.com/pricing"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                  </div>
                </>
              )}

              {sourceType === "faq" && (
                <>
                  <div className="mb-3">
                    <label className="field-label">FAQ Name (optional)</label>
                    <input
                      className="input"
                      placeholder="General FAQ, Support FAQs..."
                      value={faqName}
                      onChange={(e) => setFaqName(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[220px] overflow-y-auto mb-4 pr-1">
                    <label className="field-label">FAQ Q&A Pairs</label>
                    {faqItems.map((item, idx) => (
                      <div key={idx} className="mb-3 border border-line rounded-xl p-3 bg-surface-2 relative">
                        {faqItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFaqField(idx)}
                            className="absolute top-2 right-2 text-xs text-ink-muted hover:text-red-600 transition"
                          >
                            Remove
                          </button>
                        )}
                        <input
                          required
                          className="input !py-1.5 !px-2.5 text-[13px] mb-2"
                          placeholder="Question"
                          value={item.q}
                          onChange={(e) => handleFaqChange(idx, "q", e.target.value)}
                        />
                        <textarea
                          required
                          className="input !py-1.5 !px-2.5 text-[13px] min-h-[60px] resize-none"
                          placeholder="Answer"
                          value={item.a}
                          onChange={(e) => handleFaqChange(idx, "a", e.target.value)}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addFaqField}
                      className="btn btn-ghost w-full !py-1.5 text-[12px] font-semibold"
                    >
                      + Add Question
                    </button>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Ingesting...
                  </>
                ) : (
                  "Add knowledge source"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
