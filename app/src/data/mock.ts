export type Score = "Hot" | "Warm" | "Cold";
export type Lead = {
  id: string; name: string; email: string; phone: string; score: Score;
  status: string; note: string; time: string; source: string;
};
export type Convo = { id: string; visitor: string; snippet: string; score?: Score; time: string; captured: boolean; messages: number };
export type Source = { id: string; type: "PDF" | "FAQ" | "URL"; name: string; status: "Synced" | "Processing" | "Failed"; updated: string; pct?: number };
export type VoiceAgent = { id: string; name: string; status: "Live" | "Draft"; voice: string; kb: number; channel: string; calls: number };

export const leads: Lead[] = [
  { id: "l1", name: "Jane Doe", email: "jane@brightco.com", phone: "+1 555-0192", score: "Hot", status: "New", note: "ready to buy, asked pricing", time: "4m ago", source: "Visitor 0291" },
  { id: "l2", name: "Samuel Lee", email: "sam@nimbus.io", phone: "+1 555-0148", score: "Hot", status: "New", note: "wants a demo this week", time: "22m ago", source: "Visitor 0289" },
  { id: "l3", name: "Priya Nair", email: "priya@stackline.co", phone: "+1 555-0177", score: "Hot", status: "Contacted", note: "comparing vendors, gave budget", time: "1h ago", source: "Voice call" },
  { id: "l4", name: "Marco Diaz", email: "marco@finchly.com", phone: "+1 555-0110", score: "Warm", status: "New", note: "early research, no timeline", time: "3h ago", source: "Visitor 0282" },
  { id: "l5", name: "Aisha Khan", email: "aisha@vellum.app", phone: "+1 555-0133", score: "Warm", status: "Qualified", note: "asked about integrations", time: "5h ago", source: "Visitor 0280" },
  { id: "l6", name: "Tom Park", email: "tom@grid.dev", phone: "+1 555-0166", score: "Cold", status: "New", note: "just browsing", time: "1d ago", source: "Visitor 0271" },
  { id: "l7", name: "Lena Voss", email: "lena@orbit.co", phone: "+1 555-0155", score: "Warm", status: "Won", note: "signed up Growth", time: "2d ago", source: "Voice call" },
  { id: "l8", name: "Raj Mehta", email: "raj@delta.io", phone: "+1 555-0188", score: "Cold", status: "Lost", note: "out of budget", time: "3d ago", source: "Visitor 0260" },
];

export const convos: Convo[] = [
  { id: "c1", visitor: "Visitor 0291", snippet: "Do you offer weekend appointments?", score: "Hot", time: "2m ago", captured: true, messages: 8 },
  { id: "c2", visitor: "Visitor 0289", snippet: "Can I see a demo of the voice agent?", score: "Hot", time: "22m ago", captured: true, messages: 6 },
  { id: "c3", visitor: "Visitor 0288", snippet: "What's the difference between plans?", time: "18m ago", captured: false, messages: 4 },
  { id: "c4", visitor: "Visitor 0286", snippet: "How long does setup take?", score: "Warm", time: "40m ago", captured: true, messages: 5 },
  { id: "c5", visitor: "Visitor 0282", snippet: "Is my data private?", score: "Warm", time: "3h ago", captured: false, messages: 3 },
  { id: "c6", visitor: "Visitor 0271", snippet: "Just looking around, thanks!", score: "Cold", time: "1d ago", captured: false, messages: 2 },
];

export const sources: Source[] = [
  { id: "s1", type: "PDF", name: "Services.pdf", status: "Synced", updated: "2m ago" },
  { id: "s2", type: "FAQ", name: "Pricing FAQ (12 questions)", status: "Processing", updated: "just now", pct: 40 },
  { id: "s3", type: "URL", name: "acme.com/about", status: "Synced", updated: "1h ago" },
  { id: "s4", type: "URL", name: "acme.com/pricing", status: "Failed", updated: "1h ago" },
];

export const voiceAgents: VoiceAgent[] = [
  { id: "v1", name: "Sales Voice Agent", status: "Live", voice: "Aria", kb: 3, channel: "Web + Phone", calls: 42 },
  { id: "v2", name: "Support Line", status: "Draft", voice: "Ravi", kb: 2, channel: "Phone", calls: 0 },
];
