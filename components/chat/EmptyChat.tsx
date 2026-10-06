"use client";
import { SidebarIcon } from "@/components/ui/Icons";
import { useChat } from "@/providers/ChatProvider";

export default function EmptyChat() {
  const { setDrawer } = useChat();
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center px-2 pt-[env(safe-area-inset-top)] md:hidden">
        <button onClick={() => setDrawer(true)} className="grid h-10 w-10 place-items-center rounded-lg text-mute hover:bg-surface" aria-label="Open chats"><SidebarIcon size={20} /></button>
      </div>
      <div className="grid flex-1 place-items-center px-6 text-center"><p className="text-2xl leading-8 sm:text-[28px] sm:leading-9">Select a conversation or start a new one</p></div>
    </div>
  );
}
