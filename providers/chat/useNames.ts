import { useCallback, useEffect, useState } from "react";
import type { MutableRefObject } from "react";

export function useNames(me: any, meRef: MutableRefObject<any>) {
  const [names, setNames] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!me?.friend_id) return;
    try { setNames(JSON.parse(localStorage.getItem(`names:${me.friend_id}`) || "{}")); } catch {}
  }, [me?.friend_id]);

  const setName = useCallback((id: number, n: string) => setNames((p) => {
    if (p[id] === n) return p;
    const x = { ...p, [id]: n };
    try { localStorage.setItem(`names:${meRef.current?.friend_id}`, JSON.stringify(x)); } catch {}
    return x;
  }), []);

  return { names, setName };
}
