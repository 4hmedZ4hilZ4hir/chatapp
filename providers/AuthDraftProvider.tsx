"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type Draft = { name: string; email: string; password: string };
type DraftContextValue = {
  f: Draft;
  setF: (f: Draft) => void;
  wait: number;
  setWait: (n: number | ((w: number) => number)) => void;
};

const DraftContext = createContext<DraftContextValue | null>(null);

export function useAuthDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useAuthDraft must be used inside <AuthDraftProvider>");
  return ctx;
}

export default function AuthDraftProvider({ children }: { children: ReactNode }) {
  const [f, setF] = useState<Draft>({ name: "", email: "", password: "" });
  const [wait, setWait] = useState(0);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  return <DraftContext.Provider value={{ f, setF, wait, setWait }}>{children}</DraftContext.Provider>;
}
