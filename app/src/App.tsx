import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import Conversations from "./pages/Conversations";
import { Leads, LeadDetail } from "./pages/Leads";
import Knowledge from "./pages/Knowledge";
import VoiceAgents from "./pages/VoiceAgents";
import VoiceAgentBuilder from "./pages/VoiceAgentBuilder";
import { Settings, Onboarding } from "./pages/Misc";
import ChatAgents from "./pages/ChatAgents";
import ChatAgentBuilder from "./pages/ChatAgentBuilder";
import Calls from "./pages/Calls";
import Docs from "./pages/Docs";
import { Login, Signup, Forgot, MarketingShell, Home, Features, Pricing, About, Contact, Compare, Blog, BlogPost } from "./Public";
import { AuthProvider, useAuth } from "./lib/auth";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [hadUserOnMount] = useState(!!user);

  if (loading) {
    return null;
  }

  if (hadUserOnMount) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* marketing */}
        <Route element={<MarketingShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/compare/:competitor" element={<Compare />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
        </Route>

        {/* auth */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route path="/forgot-password" element={<Forgot />} />

        {/* app */}
        <Route
          path="/app/onboarding"
          element={
            <PrivateRoute>
              <Onboarding />
            </PrivateRoute>
          }
        />
        <Route
          path="/app"
          element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="conversations" element={<Conversations />} />
          <Route path="conversations/:id" element={<Conversations />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="knowledge" element={<Knowledge />} />
          <Route path="chat-agent" element={<ChatAgents />} />
          <Route path="chat-agent/:id" element={<ChatAgentBuilder />} />
          <Route path="voice" element={<VoiceAgents />} />
          <Route path="voice/:id" element={<VoiceAgentBuilder />} />
          <Route path="calls" element={<Calls />} />
          <Route path="settings" element={<Settings />} />
          <Route path="docs" element={<Docs />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
