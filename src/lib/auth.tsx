import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from './supabase';
import { env } from './env';

interface AuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const SESSION_KEY = 'pain_auth_session';
const SESSION_DURATION = 30 * 60 * 1000; // 30 นาที

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  userEmail: null,
  loading: true,
  login: async () => ({ error: null }),
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function getLocalSession(): { email: string; expiresAt: number } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function setLocalSession(email: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    email,
    expiresAt: Date.now() + SESSION_DURATION,
  }));
}

function clearLocalSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Admin credentials from environment variables

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      // Try Supabase auth first
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsAuthenticated(true);
          setUserEmail(session.user.email || null);
          setLoading(false);
          return;
        }
      }

      // Fallback: check local session
      const localSession = getLocalSession();
      if (localSession) {
        setIsAuthenticated(true);
        setUserEmail(localSession.email);
      }
      setLoading(false);
    };

    checkSession();

    // Listen for Supabase auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setIsAuthenticated(true);
          setUserEmail(session.user.email || null);
        } else {
          // Don't auto-logout if we have local session
          const local = getLocalSession();
          if (!local) {
            setIsAuthenticated(false);
            setUserEmail(null);
          }
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  // Auto-expire session after 30 min
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const session = getLocalSession();
      if (!session) {
        setIsAuthenticated(false);
        setUserEmail(null);
      }
    }, 60 * 1000); // check every 1 min

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const normalizedEmail = email.trim().toLowerCase();

    // Try Supabase auth first
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (!error) {
        setIsAuthenticated(true);
        setUserEmail(normalizedEmail);
        setLocalSession(normalizedEmail);
        return { error: null };
      }
      // If Supabase auth fails, fall through to local check
    }

    // Local auth fallback — ใช้ env variables
    if (env.adminEmail && normalizedEmail === env.adminEmail && password === env.adminPassword) {
      setIsAuthenticated(true);
      setUserEmail(normalizedEmail);
      setLocalSession(normalizedEmail);
      return { error: null };
    }

    return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearLocalSession();
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
