import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAccessToken, setRefreshToken, getRefreshToken } from './api';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface Workspace {
  id: string;
  name: string;
  publicKey: string;
  plan?: string;
}

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (companyName: string, websiteUrl: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res && res.user && res.workspace) {
        setUser(res.user);
        setWorkspace(res.workspace);
      }
    } catch (err) {
      console.error('Session refresh failed:', err);
    }
  };

  useEffect(() => {
    async function restoreSession() {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        setLoading(false);
        return;
      }

      try {
        // Fetch current user details. api client automatically handles initial refresh to acquire access token.
        const res = await api.get('/auth/me');
        if (res && res.user && res.workspace) {
          setUser(res.user);
          setWorkspace(res.workspace);
        }
      } catch (err) {
        console.error('Session restoration failed:', err);
        setAccessToken(null);
        setRefreshToken(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res && res.accessToken && res.refreshToken) {
      setAccessToken(res.accessToken);
      setRefreshToken(res.refreshToken);
      setUser(res.user);
      setWorkspace(res.workspace);
    }
  };

  const signup = async (companyName: string, websiteUrl: string, email: string, password: string) => {
    const res = await api.post('/auth/signup', {
      companyName,
      websiteUrl: websiteUrl || undefined,
      email,
      password,
    });
    if (res && res.accessToken && res.refreshToken) {
      setAccessToken(res.accessToken);
      setRefreshToken(res.refreshToken);
      setUser(res.user);
      setWorkspace(res.workspace);
    }
  };

  const logout = async () => {
    const rToken = getRefreshToken();
    if (rToken) {
      try {
        await api.post('/auth/logout', { refreshToken: rToken });
      } catch (err) {
        console.error('Logout request failed:', err);
      }
    }
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setWorkspace(null);
  };

  return (
    <AuthContext.Provider value={{ user, workspace, loading, login, signup, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
