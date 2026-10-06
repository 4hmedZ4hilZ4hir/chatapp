"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { api, tok } from "@/lib/api";

type AuthContextValue = {
  me: any;
  setMe: Dispatch<SetStateAction<any>>;
  ready: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tok.get()) return setReady(true);
    api("/me").then((r) => setMe(r.data)).catch(() => tok.clear()).finally(() => setReady(true));
  }, []);

  const logout = useCallback(async () => {
    await api("/logout").catch(() => {});
    tok.clear();
    setMe(null);
    localStorage.removeItem("names");
  }, []);

  useEffect(() => {
    if (!me) return;
    const t = setTimeout(() => { tok.clear(); logout(); }, tok.expiresIn());
    return () => clearTimeout(t);
  }, [me?.id, logout]);

  return <AuthContext.Provider value={{ me, setMe, ready, logout }}>{children}</AuthContext.Provider>;
}
