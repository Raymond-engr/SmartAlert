"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, setAccessToken } from "@/lib/api";
import { closeSocket } from "@/lib/socket";
import type { AppUser } from "@/types";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "student" | "lecturer";
  department: string;
  matricNumber?: string;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  login(email: string, password: string): Promise<AppUser>;
  register(payload: RegisterPayload): Promise<AppUser>;
  logout(): Promise<void>;
  refreshUser(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const res = await api.get<{ success: boolean; user: AppUser }>("/auth/me");
    setUser(res.data.user);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const res = await api.post<{ success: boolean; accessToken: string }>(
          "/auth/refresh-token"
        );
        setAccessToken(res.data.accessToken);
        const me = await api.get<{ success: boolean; user: AppUser }>(
          "/auth/me"
        );
        if (!cancelled) {
          setUser(me.data.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{
      success: boolean;
      accessToken: string;
      user: AppUser;
    }>("/auth/login", { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await api.post<{
      success: boolean;
      accessToken: string;
      user: AppUser;
    }>("/auth/register", payload);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
      closeSocket();
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
