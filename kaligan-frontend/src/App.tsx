import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import Conversations from "./pages/Conversations";
import { Leads, LeadDetail } from "./pages/Leads";
import Knowledge from "./pages/Knowledge";
import VoiceAgents from "./pages/VoiceAgents";
import VoiceAgentBuilder from "./pages/VoiceAgentBuilder";
import Widget from "./pages/Widget";
import { ChatAgent, Settings, Onboarding } from "./pages/Misc";
import { Login, Signup, Forgot, MarketingShell, Home, MarketingPage } from "./Public";

export default function App() {
  return (
    <Routes>
      {/* marketing */}
      <Route element={<MarketingShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<MarketingPage title="Features" />} />
        <Route path="/pricing" element={<MarketingPage title="Pricing" />} />
        <Route path="/about" element={<MarketingPage title="About" />} />
        <Route path="/contact" element={<MarketingPage title="Contact" />} />
      </Route>

      {/* auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<Forgot />} />

      {/* app */}
      <Route path="/app/onboarding" element={<Onboarding />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="conversations" element={<Conversations />} />
        <Route path="conversations/:id" element={<Conversations />} />
        <Route path="leads" element={<Leads />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        <Route path="knowledge" element={<Knowledge />} />
        <Route path="chat-agent" element={<ChatAgent />} />
        <Route path="voice" element={<VoiceAgents />} />
        <Route path="voice/:id" element={<VoiceAgentBuilder />} />
        <Route path="widget" element={<Widget />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
