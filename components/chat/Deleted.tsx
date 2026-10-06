"use client";
import { motion } from "framer-motion";
import { lastSeenText } from "@/lib/api";

export default function Deleted({ items, busy, err, onRestore, onPurge, onClose }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <motion.div initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full max-w-md flex-col gap-3 rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Deleted messages</h2>
          <button onClick={onClose} className="rounded-lg px-2 text-mute hover:bg-surface" aria-label="Close">×</button>
        </div>
        <p className="text-xs text-mute">Lists messages deleted from this chat on this device. You can restore them or delete them permanently.</p>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {items.length === 0 && <p className="px-2 py-3 text-sm text-mute">No deleted messages.</p>}
          {items.map((t: any) => (
            <div key={t.id} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-surface/60">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{t.text}</p>
                <p className="truncate text-xs text-mute">{t.sender ?? "Unknown"}{t.at ? ` · ${lastSeenText(t.at)}` : ""}</p>
              </div>
              <button disabled={busy === t.id} onClick={() => onRestore(t)} className="rounded-lg px-2 py-1 text-xs text-ink hover:bg-surface disabled:opacity-40">Restore</button>
              <button disabled={busy === t.id} onClick={() => onPurge(t)} className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40">Delete forever</button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
