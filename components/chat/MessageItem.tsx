"use client";
import { useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import Avatar from "@/components/ui/Avatar";
import Attachment from "@/components/chat/Attachment";
import { Check, Copy, Pencil, Pin, Reply, ThumbDown, ThumbUp, Trash } from "@/components/ui/Icons";
import { akey, atts, dislikeCount, likeCount, myReaction, replyText } from "@/lib/messages";

const Act = ({ label, onClick, active, danger, count, children }: any) => (
  <button onClick={(e) => { e.stopPropagation(); onClick(); }} aria-label={label} title={label}
    className={`flex h-7 min-w-7 items-center justify-center gap-1 rounded-lg px-1.5 text-xs hover:bg-surface ${active ? "text-ink" : ""} ${danger ? "hover:!text-red-600" : "hover:text-ink"}`}>{children}{count > 0 && <span>{count}</span>}</button>
);

const Ticks = ({ level }: { level: number }) => (
  <span title={level === 2 ? "Read" : level === 1 ? "Delivered" : "Sent"} className={`text-[11px] leading-none tracking-tighter ${level === 2 ? "text-ink" : "text-faint"}`}>{level ? "✓✓" : "✓"}</span>
);

type Props = {
  m: any; me: any; convo: any;
  ov: (u: any) => any;
  isAdmin: boolean;
  flash: boolean;
  tapped: boolean;
  onTap: () => void;
  target: any;
  editing: boolean;
  editValue: string;
  onEditChange: (v: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  renderText: (t: string, mine: boolean) => ReactNode;
  onEl: (id: number, el: HTMLElement | null) => void;
  onJump: (id: number) => void;
  onReact: (kind: "like" | "dislike") => void;
  onWho: () => void;
  onReply: () => void;
  onPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onImageReady: (key: string, url: string) => void;
  onOpenImage: (key: string) => void;
};

export default function MessageItem(p: Props) {
  const { m, me, convo, ov, isAdmin } = p;
  const [copied, setCopied] = useState(false);
  const mine = m.sender?.friend_id === me.friend_id;
  const r = myReaction(m, me.id);
  const likes = likeCount(m), dislikes = dislikeCount(m);

  async function copyMsg() {
    const t = typeof m.body === "string" ? m.body : "";
    try { await navigator.clipboard.writeText(t); }
    catch { const a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand("copy"); } catch {} a.remove(); }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.div ref={(el: any) => p.onEl(m.id, el)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: "easeOut" }}
      className={`group flex gap-2.5 ${mine ? "justify-end" : ""}`}>
      {!mine && <div className="mt-0.5 shrink-0"><Avatar user={ov(m.sender)} size={28} /></div>}
      <div className={`flex min-w-0 flex-col ${mine ? "max-w-[85%] items-end sm:max-w-[75%]" : "max-w-[calc(100%-2.25rem)] items-start sm:max-w-[85%]"}`}>
        {!mine && convo.type !== "direct_convo" && <p className="mb-0.5 text-[13px] font-medium leading-4 text-mute">{ov(m.sender)?.name}</p>}
        <div onClick={p.onTap}
          className={`max-w-full rounded-3xl text-base transition-shadow duration-500 [overflow-wrap:anywhere] ${mine ? "bg-surface px-4 py-2.5" : "py-0.5"} ${p.flash ? "shadow-[0_0_0_4px_rgba(13,13,13,0.14)]" : ""}`}>
          {m.reply_to != null && m.reply_to !== "" && (
            <button onClick={(e) => { e.stopPropagation(); p.target && p.onJump(p.target.id); }} className="mb-1.5 block w-full max-w-full rounded-lg border-l-2 border-neutral-400 bg-black/5 py-1 pl-2.5 pr-2 text-left">
              <span className="block truncate text-[13px] font-medium leading-4">{p.target?.sender ? ov(p.target.sender)?.name : "Reply"}</span>
              <span className="block truncate text-[13px] leading-4 text-mute">{replyText(p.target) || "Original message"}</span>
            </button>
          )}
          {p.editing ? (
            <input autoFocus value={p.editValue} onChange={(e) => p.onEditChange(e.target.value)} onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => (e.key === "Enter" ? p.onEditSave() : e.key === "Escape" && p.onEditCancel())}
              className="w-full min-w-[12rem] rounded-lg bg-white px-2.5 py-1 text-base outline-none" />
          ) : m.type === "text" ? (typeof m.body === "string" ? p.renderText(m.body, mine) : m.body) : atts(m).map((a: any, i: number) => {
            const k = akey(m, a, i);
            return <Attachment key={k} a={a} image={m.type === "image"} onReady={(u) => p.onImageReady(k, u)} onOpen={() => p.onOpenImage(k)} />;
          })}
          {(m.is_pinned || m.edited_at || mine) && (
            <div className={`mt-1 flex items-center gap-1.5 text-[11px] leading-none text-faint ${mine ? "justify-end" : "justify-start"}`}>
              {m.is_pinned && <Pin size={11} />}
              {m.edited_at && <span>edited</span>}
              {mine && <Ticks level={convo.receipts?.[m.id] ?? 0} />}
            </div>
          )}
        </div>
        <div className={`mt-1 items-center gap-0.5 text-mute md:flex md:opacity-0 md:transition-opacity md:focus-within:opacity-100 md:group-hover:opacity-100 ${p.tapped ? "flex" : "hidden"} ${r || likes > 0 || dislikes > 0 ? "md:opacity-100" : ""}`}>
          {m.type === "text" && typeof m.body === "string" && <Act label={copied ? "Copied" : "Copy"} onClick={copyMsg}>{copied ? <Check size={16} /> : <Copy size={16} />}</Act>}
          <Act label={r === "like" ? "Remove like" : "Like"} active={r === "like"} count={likes} onClick={() => p.onReact("like")}><ThumbUp size={16} filled={r === "like"} /></Act>
          <Act label={r === "dislike" ? "Remove dislike" : "Dislike"} active={r === "dislike"} count={dislikes} onClick={() => p.onReact("dislike")}><ThumbDown size={16} filled={r === "dislike"} /></Act>
          {(likes > 0 || dislikes > 0) && <button onClick={(e) => { e.stopPropagation(); p.onWho(); }} className="ml-1 rounded-lg px-1.5 py-1 text-xs hover:bg-surface hover:text-ink">Who reacted</button>}
          <Act label="Reply" onClick={p.onReply}><Reply size={16} /></Act>
          {isAdmin && <Act label={m.is_pinned ? "Unpin" : "Pin"} onClick={p.onPin}><Pin size={16} /></Act>}
          {mine && m.type === "text" && <Act label="Edit" onClick={p.onEdit}><Pencil size={16} /></Act>}
          {(mine || isAdmin) && <Act label="Delete" danger onClick={p.onDelete}><Trash size={16} /></Act>}
        </div>
      </div>
    </motion.div>
  );
}
