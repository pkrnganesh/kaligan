import type { SVGProps } from "react";

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 18, height: 18, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const, ...p,
});

export const Sparkle = (p: SVGProps<SVGSVGElement>) => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 0c.6 5.4 2.8 8 8 8.5-5.2.5-7.4 3.1-8 8.5-.6-5.4-2.8-8-8-8.5 5.2-.5 7.4-3.1 8-8.5z" />
  </svg>
);
export const Dashboard = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>);
export const Chat = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.2A8.5 8.5 0 1 1 21 11.5z"/></svg>);
export const Users = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/></svg>);
export const Book = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>);
export const Bot = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><rect x="4" y="7" width="16" height="13" rx="3"/><path d="M9 7V4h6v3M9 13h.01M15 13h.01M9 17h6"/></svg>);
export const Mic = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"/></svg>);
export const Code = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M20 15.5a4.5 4.5 0 0 0-1-8.9A6 6 0 0 0 4 9a4 4 0 0 0 .5 8H8"/><path d="M12 21v-8m0 0l-3 3m3-3l3 3"/></svg>);
export const Cog = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>);
export const Search = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>);
export const Bell = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>);
export const Chevron = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)} width={14} height={14}><path d="m6 9 6 6 6-6"/></svg>);
export const Check = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)} strokeWidth={2.4}><path d="M20 6 9 17l-5-5"/></svg>);
export const ArrowRight = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)} strokeWidth={2.1}><path d="M5 12h14M12 5l7 7-7 7"/></svg>);
export const Phone = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
export const Play = (p: SVGProps<SVGSVGElement>) => (<svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 5v14l11-7z"/></svg>);
export const Plus = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)} strokeWidth={2}><path d="M12 5v14M5 12h14"/></svg>);
export const Bolt = (p: SVGProps<SVGSVGElement>) => (<svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>);
