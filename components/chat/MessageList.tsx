"use client";
import { useState } from "react";
import type { ReactNode, RefObject } from "react";
import { AnimatePresence } from "framer-motion";
import MessageItem from "@/components/chat/MessageItem";

type Props = {
  msgs: any[]; me: any; convo: any;
  ov: (u: any) => any;
  isAdmin: boolean;
  flashId: number | null;
  edit: { id: number; value: string } | null;
  setEdit: (e: { id: number; value: string } | null) => void;
  saveEdit: () => void;
  replyOf: (m: any) => any;
  renderText: (t: string, mine: boolean) => ReactNode;
  endRef: RefObject<HTMLDivElement | null>;
  onEl: (id: number, el: HTMLElement | null) => void;
  onJump: (id: number) => void;
  onReact: (m: any, kind: "like" | "dislike") => void;
  onWho: (m: any) => void;
  onReply: (m: any) => void;
  onPin: (m: any) => void;
  onDelete: (m: any) => void;
  onImageReady: (key: string, url: string) => void;
  onOpenImage: (key: string) => void;
};

export default function MessageList(p: Props) {
  const [tapped, setTapped] = useState<number | null>(null);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl space-y-5 px-3 py-5 sm:px-4">
        <AnimatePresence initial={false}>
          {p.msgs.map((m) => (
            <MessageItem key={m.id} m={m} me={p.me} convo={p.convo} ov={p.ov} isAdmin={p.isAdmin}
              flash={p.flashId === m.id}
              tapped={tapped === m.id} onTap={() => setTapped((t) => (t === m.id ? null : m.id))}
              target={p.replyOf(m)}
              editing={p.edit?.id === m.id} editValue={p.edit?.value ?? ""}
              onEditChange={(value) => p.setEdit({ id: m.id, value })} onEditSave={p.saveEdit} onEditCancel={() => p.setEdit(null)}
              renderText={p.renderText} onEl={p.onEl} onJump={p.onJump}
              onReact={(kind) => p.onReact(m, kind)} onWho={() => p.onWho(m)}
              onReply={() => p.onReply(m)} onPin={() => p.onPin(m)}
              onEdit={() => p.setEdit({ id: m.id, value: m.body })} onDelete={() => p.onDelete(m)}
              onImageReady={p.onImageReady} onOpenImage={p.onOpenImage} />
          ))}
        </AnimatePresence>
        <div ref={p.endRef} />
      </div>
    </div>
  );
}
