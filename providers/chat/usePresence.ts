import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function usePresence(me: any) {
  const [presence, setPresence] = useState<Record<number, { online: boolean; lastSeen?: string }>>({});

  useEffect(() => {
    if (!me) return;
    const pull = () => api("/active-users").then((r) => {
      const ids: number[] = (r?.users ?? []).map((u: any) => u.id).filter(Boolean);
      setPresence((p) => { const x = { ...p }; ids.forEach((i) => { if (!x[i]) x[i] = { online: true }; }); return x; });
    }).catch(() => {});
    pull();
    const t = setInterval(pull, 60000);
    return () => clearInterval(t);
  }, [me]);

  return { presence, setPresence };
}
