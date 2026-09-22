import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AdminProfile } from "@/types";
import { apiGet, apiPost, getToken, setToken } from "@/services/api";

interface LoginResult {
  ok: boolean;
  error?: string;
}

interface AuthContextValue {
  user: AdminProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await apiGet<{
        success: true;
        data: { admin: { id: string; name: string; email: string; role: string } };
      }>("/auth/me");
      setUser({
        name: res.data.admin.name,
        email: res.data.admin.email,
      });
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await apiPost<{
        success: true;
        data: {
          token: string;
          admin: { id: string; name: string; email: string; role: string };
        };
      }>("/auth/login", { email, password });

      setToken(res.data.token);
      setUser({
        name: res.data.admin.name,
        email: res.data.admin.email,
      });
      localStorage.setItem(
        "rnb-admin-auth",
        JSON.stringify({
          name: res.data.admin.name,
          email: res.data.admin.email,
        }),
      );
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error?.message || "Login failed" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getToken()) {
        await apiPost("/auth/logout");
      }
    } catch {
      // ignore
    }
    setToken(null);
    localStorage.removeItem("rnb-admin-auth");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      logout,
      refresh,
    }),
    [user, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
