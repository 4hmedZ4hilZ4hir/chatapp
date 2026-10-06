"use client";
import { motion } from "framer-motion";
import Avatar from "@/components/ui/Avatar";
import { Plus, ThumbDown, ThumbUp } from "@/components/ui/Icons";
import { dislikers, likers, sameId } from "@/lib/messages";

type Props = {
  m: any; me: any;
  isAdmin: boolean;
  ov: (u: any) => any;
  userStub: (uid: any) => any;
  onRemove: (userId: any) => void;
  onClose: () => void;
};

export default function ReactionsModal({ m, me, isAdmin, ov, userStub, onRemove, onClose }: Props) {
  const rows = [...likers(m).map((u: any) => ({ u, k: "like" })), ...dislikers(m).map((u: any) => ({ u, k: "dislike" }))];
  return (
    <motion.div key="reacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4">
      <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="max-h-[80dvh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-medium">Reactions</h2><button onClick={onClose} aria-label="Close" className="text-mute hover:text-ink"><Plus size={20} className="rotate-45" /></button></div>
        {rows.length === 0 && <p className="text-sm text-mute">No reactions yet.</p>}
        {rows.map(({ u, k }) => {
          const full = ov(u.name ? u : userStub(u.id));
          return (
            <div key={`${k}${u.id}`} className="flex items-center gap-3 py-1.5">
              <Avatar user={full} size={30} /><span className="min-w-0 flex-1 truncate text-sm">{full?.name ?? "Member"}{sameId(u.id, me.id) && " (you)"}</span>
              {k === "like" ? <ThumbUp size={16} filled /> : <ThumbDown size={16} filled />}
              {isAdmin && !sameId(u.id, me.id) && <button onClick={() => onRemove(u.id)} className="rounded-full px-2.5 py-1 text-xs text-red-600 hover:bg-surface">Remove</button>}
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
