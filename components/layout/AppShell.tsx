"use client";
import type { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import Sidebar from "@/components/sidebar/Sidebar";
import Profile from "@/components/profile/Profile";
import { Toast, groupNotes } from "@/components/notifications/Notifications";
import { useChat } from "@/providers/ChatProvider";

export default function AppShell({ children }: { children: ReactNode }) {
  const c = useChat();
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar me={c.me} convos={c.convos} activeId={c.activeId} onSelect={c.selectConvo} drawer={c.drawer} onDrawer={c.setDrawer} onLogout={c.logout} names={c.names} onPin={c.togglePin} onRename={c.renameConvo} onDelete={c.deleteConvo}
        onProfile={() => c.setProfileOpen(true)} notes={c.noteItems} noteTotal={c.noteTotal} onOpenNote={c.openNoteAndClose} onClearNotes={c.clearNotes}
        onCreated={c.onCreated} />
      {children}
      <div className="fixed right-3 top-3 z-[80] flex max-w-[calc(100vw-1.5rem)] flex-col gap-2 pt-[env(safe-area-inset-top)]">
        {c.flash && <div className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-red-600 shadow-lg">{c.flash}</div>}
        <AnimatePresence>
          {c.toasts.map((n: any, i: number) => <Toast key={n.id ?? i} item={groupNotes([n], c.titleOf, c.isGroup)[0]} onOpen={c.openNote} onDone={() => c.setToasts((x: any[]) => x.filter((y) => y !== n))} />)}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {c.profileOpen && <Profile me={c.me} onClose={() => c.setProfileOpen(false)} onSaved={c.onProfileSaved} onDeleted={() => { c.setProfileOpen(false); c.setMe(null); }} />}
      </AnimatePresence>
    </div>
  );
}
