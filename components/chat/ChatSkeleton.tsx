"use client";
import { SidebarIcon } from "@/components/ui/Icons";
import { useChat } from "@/providers/ChatProvider";

export default function ChatSkeleton() {
  const { setDrawer } = useChat();
  return (
    <div className="flex h-dvh min-w-0 flex-1 flex-col bg-white" aria-busy="true">
      <header className="flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-center gap-2 border-b border-surface px-2 pt-[env(safe-area-inset-top)] sm:px-4">
        <button onClick={() => setDrawer(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-mute hover:bg-surface md:hidden" aria-label="Open chats"><SidebarIcon size={20} /></button>
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-surface" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-32 animate-pulse rounded bg-surface" />
          <div className="h-3 w-20 animate-pulse rounded bg-surface" />
        </div>
      </header>
      <div className="min-h-0 flex-1" />
    </div>
  );
}
