"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import { ArrowUp, Plus } from "@/components/ui/Icons";
import { snippet } from "@/lib/messages";

type Props = {
  convoId: number;
  isDirect: boolean;
  people: any[];
  reply: any;
  ov: (u: any) => any;
  err: string;
  onCancelReply: () => void;
  onSend: (data: { text: string; file?: File; mentions: any[] }) => Promise<boolean>;
};

export default function Composer({ convoId, isDirect, people, reply, ov, err, onCancelReply, onSend }: Props) {
  const [text, setText] = useState("");
  const [caret, setCaret] = useState(0);
  const [sel, setSel] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [mentions, setMentions] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const lastPing = useRef(0);
  const typingSent = useRef(false);
  const idle = useRef<any>(null);

  const at = !isDirect ? text.slice(0, caret).match(/(?:^|\s)@(\w*(?: \w*){0,3})$/) : null;
  const q = (at?.[1] ?? "").toLowerCase();
  const suggestions = at && !dismissed ? people.filter((p) => { const n = p.name.toLowerCase(); return n.startsWith(q) || n.split(" ").some((w: string) => w.startsWith(q)); }).slice(0, 8) : [];

  function stopTyping() {
    clearTimeout(idle.current);
    if (!typingSent.current) return;
    typingSent.current = false; lastPing.current = 0;
    api(`/conversation/${convoId}/stopped-typing`, { method: "POST" }).catch(() => {});
  }
  useEffect(() => () => stopTyping(), []);

  function onType(v: string) {
    setText(v); setDismissed(false); setSel(0);
    if (!v) return stopTyping();
    typingSent.current = true;
    clearTimeout(idle.current); idle.current = setTimeout(stopTyping, 3000);
    if (Date.now() - lastPing.current > 3000) { lastPing.current = Date.now(); api(`/conversation/${convoId}/typing`, { method: "POST" }).catch(() => {}); }
  }

  function pick(u: any) {
    const start = text.slice(0, caret).lastIndexOf("@");
    const next = text.slice(0, start) + `@${u.name} ` + text.slice(caret);
    const pos = start + u.name.length + 2;
    setText(next); setMentions((m) => (m.some((x) => x.id === u.id) ? m : [...m, u])); setSel(0); setCaret(pos); setDismissed(true);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.setSelectionRange(pos, pos); }, 0);
  }

  async function submit(attachment?: File) {
    if (!attachment && !text.trim()) return;
    const ok = await onSend({ text, file: attachment, mentions });
    if (ok) { stopTyping(); setText(""); setMentions([]); }
  }

  return (
    <div className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
      <div className="relative mx-auto w-full max-w-3xl">
        {err && <p className="px-2 pb-2 text-sm text-red-600">{err}</p>}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute bottom-full left-0 z-10 mb-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-line bg-white p-1 shadow-lg sm:w-72">
              {suggestions.map((u, i) => (
                <button key={u.friend_id} onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setSel(i)} onClick={() => pick(u)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${i === Math.min(sel, suggestions.length - 1) ? "bg-surface" : "hover:bg-surface/70"}`}>
                  <Avatar user={u} size={26} /><span className="truncate">{u.name}</span>
                </button>
              ))}
            </motion.div>
          )}
          {reply && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="mb-2 flex items-center justify-between gap-3 overflow-hidden rounded-2xl bg-surface px-4 py-2 text-xs text-mute">
              <span className="min-w-0"><span className="block truncate font-medium text-ink">Reply to {ov(reply.sender)?.name ?? "message"}</span><span className="block truncate">{snippet(reply)}</span></span>
              <button onClick={onCancelReply} aria-label="Cancel reply" className="shrink-0"><Plus size={16} className="rotate-45" /></button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-1 rounded-full border border-line bg-white p-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-colors focus-within:border-neutral-300">
          <input ref={file} type="file" hidden onChange={(e) => e.target.files?.[0] && submit(e.target.files[0])} />
          <button onClick={() => file.current?.click()} className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-surface" aria-label="Attach"><Plus size={20} /></button>
          <input ref={inputRef} value={text} onChange={(e) => { onType(e.target.value); setCaret(e.target.selectionStart ?? e.target.value.length); }} onBlur={stopTyping}
            onSelect={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
            onKeyDown={(e) => {
              if (suggestions.length) {
                if (e.key === "ArrowDown") { e.preventDefault(); return setSel((x) => (x + 1) % suggestions.length); }
                if (e.key === "ArrowUp") { e.preventDefault(); return setSel((x) => (x - 1 + suggestions.length) % suggestions.length); }
                if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); return pick(suggestions[Math.min(sel, suggestions.length - 1)]); }
                if (e.key === "Escape") return setDismissed(true);
              }
              if (e.key === "Enter") submit();
            }}
            placeholder={isDirect ? "Type a message" : "Type a message — @ to tag someone"} className="text-base min-w-0 flex-1 bg-transparent px-1.5 outline-none" />
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => submit()} disabled={!text.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-white transition-colors disabled:bg-[#d7d7d7]" aria-label="Send"><ArrowUp size={18} /></motion.button>
        </div>
      </div>
    </div>
  );
}
