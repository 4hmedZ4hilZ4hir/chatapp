import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { snippet } from "@/lib/messages";

export function useTrash(me: any, id: number, setMsgs: (fn: (cur: any[]) => any[]) => void) {
  const key = `trash:${me.friend_id}:${id}`;
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(key) || "[]")); } catch { setItems([]); }
    setShow(false); setErr("");
  }, [key]);

  const add = (m: any) => setItems((cur) => {
    if (!m?.id || cur.some((x) => x.id === m.id)) return cur;
    const next = [{ id: m.id, text: snippet(m), sender: m.sender?.name, senderObj: m.sender, at: m.deleted_at ?? new Date().toISOString() }, ...cur].slice(0, 100);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
    return next;
  });
  const drop = (mid: number) => setItems((cur) => {
    const next = cur.filter((x) => x.id !== mid);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
    return next;
  });

  async function restore(t: any) {
    setBusy(t.id); setErr("");
    try {
      const m = await api(`/message/${t.id}/restore`);
      drop(t.id);
      setMsgs((cur) => (cur.find((x) => x.id === m.id) ? cur : [...cur, { ...m, sender: m.sender ?? t.senderObj }].sort((a, b) => a.id - b.id)));
    } catch (x: any) { setErr(x.status === 403 ? "Only the owner or an admin can restore messages." : x.status === 404 ? "This message no longer exists." : x.message); }
    finally { setBusy(null); }
  }
  async function purge(t: any) {
    if (!confirm("Permanently delete this message? This can't be undone.")) return;
    setBusy(t.id); setErr("");
    try {
      await api(`/message/${t.id}/force_delete`, { method: "DELETE" });
      drop(t.id);
      setMsgs((cur) => cur.filter((x) => x.id !== t.id));
    } catch (x: any) { setErr(x.status === 403 ? "Only the owner or an admin can delete permanently." : x.status === 404 ? "This message no longer exists." : x.message); }
    finally { setBusy(null); }
  }

  return { items, show, setShow, busy, err, add, drop, restore, purge };
}
