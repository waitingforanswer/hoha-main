import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppUser {
  id: string;
  username: string;
  phone: string;
  full_name: string;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

interface Session {
  token: string;
  expires_at: string;
}

interface AppAuthContextType {
  user: AppUser | null;
  session: Session | null;
  permissions: string[] | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string; field?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string; error?: string; field?: string }>;
  logout: () => void;
}

interface RegisterData {
  username: string;
  password: string;
  full_name: string;
  phone: string;
}

const AppAuthContext = createContext<AppAuthContextType | undefined>(undefined);

const STORAGE_KEY = 'app_auth_session';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedSession = localStorage.getItem(STORAGE_KEY);
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        const expiresAt = new Date(parsed.session.expires_at);
        
        if (expiresAt > new Date()) {
          setUser(parsed.user);
          setSession(parsed.session);
          setPermissions(parsed.permissions ?? []);
        } else {
          // Session expired, clear storage
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error('Failed to parse stored session:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/custom-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!data?.success) {
        return { success: false, error: data?.error, field: data?.field };
      }

      // Store session with permissions
      setUser(data.user);
      setSession(data.session);
      setPermissions(data.permissions ?? []);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user: data.user,
          session: data.session,
          permissions: data.permissions ?? [],
        })
      );

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Lỗi kết nối. Vui lòng thử lại.' };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/custom-auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result?.success) {
        return { success: false, error: result?.error, field: result?.field };
      }

      return { success: true, message: result.message };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Lỗi kết nối. Vui lòng thử lại.' };
    }
  };

  const logout = () => {
    setUser(null);
    setSession(null);
    setPermissions(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AppAuthContext.Provider value={{ user, session, permissions, loading, login, register, logout }}>
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AppAuthContext);
  if (context === undefined) {
    throw new Error('useAppAuth must be used within an AppAuthProvider');
  }
  return context;
}
