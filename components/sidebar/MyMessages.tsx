"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, lastSeenText } from "@/lib/api";

const textOf = (m: any) => {
  if (typeof m.body === "string") return m.body;
  const f = Array.isArray(m.body) ? m.body[0] : null;
  return f?.file_name ? `${m.type === "image" ? "📷" : "📎"} ${f.file_name}` : m.type === "image" ? "📷 Photo" : "📎 File";
};

export default function MyMessages({ titleOf, onOpen, onClose }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load(c?: string | null) {
    setLoading(true); setErr("");
    try {
      const r = await api(`/message?attachments${c ? `&cursor=${encodeURIComponent(c)}` : ""}`);
      setItems((x) => (c ? [...x, ...(r.data ?? [])] : r.data ?? []));
      setCursor(r.meta?.next_cursor ?? null);
    } catch (x: any) { setErr(x.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4">
      <motion.div initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full max-w-md flex-col gap-3 rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">My messages</h2>
          <button onClick={onClose} className="rounded-lg px-2 text-mute hover:bg-surface" aria-label="Close">×</button>
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {!loading && items.length === 0 && !err && <p className="px-2 py-3 text-sm text-mute">You haven't sent any messages yet.</p>}
          {items.map((m) => {
            const title = titleOf(m.conversation_id);
            return (
              <button key={m.id} disabled={!title} onClick={() => { onOpen(m.conversation_id); onClose(); }} className="block w-full rounded-lg px-2 py-2 text-left hover:bg-surface disabled:opacity-60">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{title ?? "Conversation no longer available"}</span>
                  <span className="shrink-0 text-[10px] text-faint">{m.created_at ? lastSeenText(m.created_at) : ""}</span>
                </span>
                <span className="block truncate text-sm text-mute">{textOf(m)}</span>
                {m.replies?.length > 0 && <span className="block text-xs text-faint">{m.replies.length} {m.replies.length === 1 ? "reply" : "replies"}</span>}
              </button>
            );
          })}
          {cursor && <button onClick={() => load(cursor)} disabled={loading} className="w-full rounded-lg py-2 text-sm text-mute hover:bg-surface disabled:opacity-50">{loading ? "Loading…" : "Load more"}</button>}
          {loading && items.length === 0 && <p className="px-2 py-3 text-sm text-mute">Loading…</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}
