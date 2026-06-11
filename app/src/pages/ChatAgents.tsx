import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHead } from "../components/ui";
import * as I from "../components/icons";
import { api } from "../lib/api";

export default function ChatAgents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAgents = async () => {
    try {
      const data = await api.get("/agents?kind=chat");
      setAgents(data || []);
    } catch (err) {
      console.error("Failed to load chat agents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreateAgent = async () => {
    try {
      const newAgent = await api.post("/agents", {
        kind: "chat",
        name: "Support Chat Agent",
        persona: "Friendly",
        greeting: "Hi! How can I help you today?",
        goal: "support",
        connectedKbDocumentIds: [],
        captureFields: ["name", "email"],
      });
      navigate(`/app/chat-agent/${newAgent.id}`);
    } catch (err) {
      console.error("Failed to create chat agent:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <PageHead
        title="Chat Agents"
        subtitle="Build AI chat assistants that engage with visitors — using your knowledge base."
        right={
          <button onClick={handleCreateAgent} className="btn btn-primary">
            <I.Plus width={15} height={15} /> New chat agent
          </button>
        }
      />
      <div className="grid grid-cols-3 gap-4">
        {agents.map((v) => {
          const docCount = Array.isArray(v.connectedKbDocumentIds)
            ? v.connectedKbDocumentIds.length
            : 0;
          return (
            <Link
              key={v.id}
              to={`/app/chat-agent/${v.id}`}
              className="card p-5 hover:-translate-y-0.5 hover:shadow-lift hover:border-mint-300 transition block fadeup"
            >
              <div className="flex items-center justify-between">
                <span className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center">
                  <I.Bot width={20} height={20} />
                </span>
                <span
                  className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full ${
                    v.status === "live" ? "bg-emerald-50 text-success" : "bg-[#f0efe2] text-ink-muted"
                  }`}
                >
                  {v.status === "live" ? "● Live" : "Draft"}
                </span>
              </div>
              <h3 className="font-display text-[17px] font-bold mt-3.5">{v.name}</h3>
              <p className="text-ink-muted text-[13px] mt-1">
                Goal: {v.goal === "qualify" ? "Qualify leads" : v.goal === "support" ? "Support" : v.goal} · {docCount} sources connected
              </p>
              <div className="border-t border-line mt-4 pt-3 text-[13px] text-ink-muted">
                Chats handled: 0
              </div>
            </Link>
          );
        })}
        <button
          onClick={handleCreateAgent}
          className="rounded-xl2 border-2 border-dashed border-line grid place-items-center text-ink-muted hover:border-mint-300 hover:text-emerald-600 transition min-h-[180px] w-full text-center"
        >
          <span className="flex flex-col items-center gap-2">
            <I.Plus /> <span className="text-sm font-semibold">New chat agent</span>
          </span>
        </button>
      </div>
    </>
  );
}
