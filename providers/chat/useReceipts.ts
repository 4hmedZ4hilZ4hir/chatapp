import { useCallback, useEffect, useState } from "react";
import type { MutableRefObject } from "react";

export function useReceipts(me: any, meRef: MutableRefObject<any>) {
  const [receipts, setReceipts] = useState<Record<number, Record<number, number>>>({});

  useEffect(() => {
    if (!me?.friend_id) return;
    try { setReceipts(JSON.parse(localStorage.getItem(`receipts:${me.friend_id}`) || "{}")); } catch {}
  }, [me?.friend_id]);

  const markReceipts = useCallback((cid: number, ids: number[], level: number) => setReceipts((p) => {
    const cur = { ...(p[cid] ?? {}) };
    let changed = false;
    ids.forEach((i) => { if ((cur[i] ?? 0) < level) { cur[i] = level; changed = true; } });
    if (!changed) return p;
    const keep: Record<number, number> = {};
    Object.keys(cur).map(Number).sort((a, b) => b - a).slice(0, 300).forEach((k) => (keep[k] = cur[k]));
    const x = { ...p, [cid]: keep };
    try { localStorage.setItem(`receipts:${meRef.current?.friend_id}`, JSON.stringify(x)); } catch {}
    return x;
  }), []);

  return { receipts, markReceipts };
}
