import { NavLink, Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import * as I from "./icons";
import { useAuth } from "../lib/auth";

function Item({ to, icon, label, count, badge }:
  { to: string; icon: ReactNode; label: string; count?: number; badge?: string }) {
  return (
    <NavLink to={to} end
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition group ${
          isActive ? "bg-emerald-600 text-white font-semibold shadow-soft" : "text-ink hover:bg-emerald-50"
        }`}>
      {({ isActive }) => (
        <>
          <span className={isActive ? "text-white" : "text-ink-muted group-hover:text-emerald-600"}>{icon}</span>
          <span className="flex-1">{label}</span>
          {count !== undefined && (
            <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-mint-100 text-emerald-700"}`}>{count}</span>
          )}
          {badge && <span className="text-[10px] font-bold bg-teal-400 text-[#08332a] px-1.5 py-0.5 rounded-full tracking-wide">{badge}</span>}
        </>
      )}
    </NavLink>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <div className="text-[10.5px] font-bold tracking-[0.09em] uppercase text-ink-muted px-3 pb-1.5 pt-3">{children}</div>;
}

export default function AppShell() {
  const { workspace, logout } = useAuth();

  return (
    <div className="grid grid-cols-[248px_1fr] min-h-screen">
      <aside className="bg-surface-2 border-r border-line flex flex-col p-[14px] gap-1.5 sticky top-0 h-screen">
        <button className="flex items-center gap-3 p-2.5 border border-line rounded-2xl bg-surface hover:border-mint-300 transition mb-2.5 text-left">
          <span className="w-8 h-8 rounded-[9px] bg-emerald-600 grid place-items-center shrink-0"><I.Sparkle width={17} height={17} fill="#fff" /></span>
          <span className="flex-1 leading-tight"><span className="font-semibold text-sm block">{workspace?.name || "Acme Co"}</span><span className="text-ink-muted text-[11.5px]">kaliganai workspace</span></span>
          <I.Chevron className="text-ink-muted" />
        </button>

        <Label>Inbox</Label>
        <Item to="/app" icon={<I.Dashboard />} label="Dashboard" />
        <Item to="/app/conversations" icon={<I.Chat />} label="Conversations" count={5} />
        <Item to="/app/leads" icon={<I.Users />} label="Leads" count={9} />

        <Label>AI Setup</Label>
        <Item to="/app/knowledge" icon={<I.Book />} label="Knowledge Base" />
        <Item to="/app/chat-agent" icon={<I.Bot />} label="Chat Agent" />
        <Item to="/app/voice" icon={<I.Mic />} label="Voice Agents" badge="NEW" />
        <Item to="/app/widget" icon={<I.Code />} label="Widget" />

        <div className="mt-auto flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-50 border border-mint-300 text-[13px] font-semibold text-emerald-700">
            <I.Check width={15} height={15} /> Setup complete
            <span className="ml-auto flex gap-1">{[0,1,2,3,4].map(i => <i key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-600" />)}</span>
          </div>
          <Item to="/app/settings" icon={<I.Cog />} label="Settings" />
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium text-ink hover:bg-emerald-50 hover:text-emerald-700 transition w-full text-left"
          >
            <span className="text-ink-muted group-hover:text-emerald-600"><I.LogOut /></span>
            <span className="flex-1">Log out</span>
          </button>
        </div>
      </aside>

      <div className="flex flex-col min-w-0">
        <header className="flex items-center gap-3.5 px-8 py-3.5 border-b border-line bg-canvas/80 backdrop-blur sticky top-0 z-10">
          <label className="flex-1 max-w-[380px] flex items-center gap-2.5 bg-surface border border-line rounded-full px-4 py-2 text-ink-muted text-[13.5px]">
            <I.Search width={16} height={16} />
            <input className="border-none outline-none bg-transparent flex-1 text-ink placeholder:text-ink-muted" placeholder="Search conversations & leads" />
          </label>
          <div className="ml-auto flex items-center gap-3.5">
            <span className="inline-flex items-center gap-2 bg-surface border border-mint-300 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-emerald-700">
              <span className="w-[7px] h-[7px] rounded-full bg-success pulse-dot" /> AI Live
            </span>
            <button className="w-[38px] h-[38px] rounded-full grid place-items-center bg-surface border border-line text-ink-muted hover:border-mint-300 hover:text-emerald-600 transition"><I.Bell width={18} height={18} /></button>
            <div className="w-[38px] h-[38px] rounded-full bg-teal-400 grid place-items-center text-[#08332a] font-bold text-sm">RK</div>
          </div>
        </header>
        <main className="px-8 py-7 pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
