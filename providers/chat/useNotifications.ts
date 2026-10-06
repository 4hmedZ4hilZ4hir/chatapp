import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { api, previewOf } from "@/lib/api";
import { parseNote } from "@/components/notifications/Notifications";

type Options = {
  me: any;
  meRef: MutableRefObject<any>;
  activeId: number | null;
  activeRef: MutableRefObject<number | null>;
  convosRef: MutableRefObject<any[]>;
  membersRef: MutableRefObject<Record<number, any[]>>;
  load: () => Promise<any>;
  openConvo: (id: number) => void;
};

export function useNotifications({ me, meRef, activeId, activeRef, convosRef, membersRef, load, openConvo }: Options) {
  const [notes, setNotes] = useState<any[]>([]);
  const [toasts, setToasts] = useState<any[]>([]);
  const notesRef = useRef<any[]>([]);
  notesRef.current = notes;
  const dismissedRef = useRef<Set<string>>(new Set());

  const dismiss = useCallback((pred: (n: any) => boolean) => {
    const gone = notesRef.current.filter(pred);
    if (!gone.length) return;
    gone.forEach((n) => { if (n.id != null) dismissedRef.current.add(String(n.id)); });
    try { localStorage.setItem(`dismissed:${meRef.current?.friend_id}`, JSON.stringify(Array.from(dismissedRef.current).slice(-300))); } catch {}
    setNotes((x) => x.filter((n) => !pred(n)));
  }, []);

  const openNote = useCallback((it: any) => {
    dismiss((n) => it.notes.includes(n) || (it.convoId != null && parseNote(n).convoId === it.convoId));
    if (it.convoId != null) openConvo(it.convoId);
  }, [dismiss, openConvo]);

  useEffect(() => {
    if (activeId == null) return;
    const clear = () => { if (!document.hidden) dismiss((n) => parseNote(n).convoId === activeRef.current); };
    clear();
    document.addEventListener("visibilitychange", clear);
    return () => document.removeEventListener("visibilitychange", clear);
  }, [activeId, notes, dismiss]);

  useEffect(() => {
    if (!me) return;
    try { dismissedRef.current = new Set(JSON.parse(localStorage.getItem(`dismissed:${me.friend_id}`) || "[]")); } catch { dismissedRef.current = new Set(); }
    api("/notifications").then((r) => {
      const list: any[] = Array.isArray(r) ? r : r?.data ?? [];
      setNotes(list.filter((n) => n.id == null || !dismissedRef.current.has(String(n.id))));
    }).catch(() => {});
  }, [me?.id]);

  const addNote = useCallback((raw: any) => {
    console.debug("[notification]", raw);
    if (raw?.id != null && (dismissedRef.current.has(String(raw.id)) || notesRef.current.some((y) => y.id === raw.id))) return;
    const cid = parseNote(raw).convoId;
    if (cid != null && cid === activeRef.current && !document.hidden) return;
    if (cid != null && !convosRef.current.some((c) => c.id === cid)) load();
    const base = { ...raw, _at: new Date().toISOString() };
    const push = (n: any) => { setNotes((x) => [n, ...x]); setToasts((x) => [...x, n]); };
    const p = parseNote(base);
    if (p.actorId != null && !p.sender) {
      const react = p.kind === "like" || p.kind === "dislike";
      const find = (list: any[]) => list.find((u: any) => String(u.id) === String(p.actorId));
      const finish = (name?: string) => {
        const go = () => {
          const m = convosRef.current.find((c) => c.id === cid)?.last_message;
          const same = m && String(m.sender?.id) === String(p.actorId);
          push({ ...base, _ctx: { sender: name, ...(!react && same ? { preview: previewOf(m) } : {}) } });
        };
        if (react) go(); else setTimeout(go, 700);
      };
      const known = find([...(membersRef.current[cid as number] ?? []), ...(convosRef.current.find((c) => c.id === cid)?.members ?? []), ...Object.values(membersRef.current).flat()]);
      if (known?.name) return finish(known.name);
      if (cid == null) return finish();
      api(`/conversation/${cid}/members_in`).then((r) => {
        const c = Array.isArray(r) ? r[0] : r;
        finish(find([...(c?.members ?? []), ...(c?.all_members ?? [])])?.name);
      }).catch(() => finish());
      return;
    }
    if (p.sender && p.preview) return push(base);
    setTimeout(() => {
      const m = convosRef.current.find((c) => c.id === cid)?.last_message;
      const s = m?.sender;
      push(s && s.friend_id !== meRef.current?.friend_id ? { ...base, _ctx: { sender: s.name, preview: previewOf(m) } } : base);
    }, 700);
  }, [load]);

  return { notes, toasts, setToasts, addNote, openNote, dismiss };
}
