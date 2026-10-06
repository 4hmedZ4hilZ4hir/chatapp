import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const clean = (q: string) => q.replace(/[^a-zA-Z ]/g, "").trim();

const url = (search: string, cursor?: string | null) => {
  const p: string[] = [];
  if (search) p.push(`search=${encodeURIComponent(search)}`);
  if (cursor) p.push(`cursor=${encodeURIComponent(cursor)}`);
  return `/user${p.length ? `?${p.join("&")}` : ""}`;
};

export function usePeople(query: string, enabled = true) {
  const [list, setList] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => {
      api(url(clean(query))).then((r) => { setList(r.data ?? []); setCursor(r.meta?.next_cursor ?? null); }).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [query, enabled]);

  async function more() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const r = await api(url(clean(query), cursor));
      setList((x) => [...x, ...(r.data ?? []).filter((u: any) => !x.some((y) => y.id === u.id))]);
      setCursor(r.meta?.next_cursor ?? null);
    } catch {}
    finally { setLoading(false); }
  }

  return { list, hasMore: !!cursor, loading, more };
}
