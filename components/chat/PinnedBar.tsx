"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "@/components/ui/Icons";
import { replyText } from "@/lib/messages";

type Props = {
  pinned: any[];
  isAdmin: boolean;
  onJump: (messageId: number) => void;
  onUnpin: (m: any) => void;
};

export default function PinnedBar({ pinned, isAdmin, onJump, onUnpin }: Props) {
  const [pinIdx, setPinIdx] = useState(0);
  const curPin = pinned.length ? Math.min(pinIdx, pinned.length - 1) : 0;

  function cyclePin() {
    const p = pinned[curPin]; if (!p) return;
    onJump(p.id); setPinIdx((curPin + 1) % pinned.length);
  }

  return (
    <AnimatePresence initial={false}>
      {pinned.length > 0 && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="shrink-0 overflow-hidden border-b border-surface bg-white">
          <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
            <button onClick={cyclePin} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-0.5 text-left hover:bg-surface/60" title="Go to pinned message">
              <span className="flex h-9 w-0.5 flex-col gap-0.5">
                {pinned.slice(0, 6).map((_, i) => <span key={i} className={`flex-1 rounded-full ${i === curPin ? "bg-ink" : "bg-neutral-300"}`} />)}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium text-mute">{pinned.length > 1 ? `Pinned message #${curPin + 1}` : "Pinned message"}</span>
                <span className="block truncate text-sm">{replyText(pinned[curPin]) || "Message"}</span>
              </span>
            </button>
            {isAdmin && <button onClick={() => onUnpin(pinned[curPin])} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-mute hover:bg-surface" aria-label="Unpin message" title="Unpin"><Plus size={16} className="rotate-45" /></button>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
