"use client";
import Link from "next/link";
import { SidebarIcon } from "@/components/ui/Icons";
import { useChat } from "@/providers/ChatProvider";

export default function ConversationNotFound() {
  const { setDrawer } = useChat();
  return (
    <div className="flex min-w-0 flex-1 flex-col bg-white">
      <div className="flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center px-2 pt-[env(safe-area-inset-top)] md:hidden">
        <button onClick={() => setDrawer(true)} className="grid h-10 w-10 place-items-center rounded-lg text-mute hover:bg-surface" aria-label="Open chats"><SidebarIcon size={20} /></button>
      </div>
      <div className="grid flex-1 place-items-center px-6 text-center">
        <div className="space-y-4">
          <p className="text-2xl leading-8 sm:text-[28px] sm:leading-9">Conversation not found</p>
          <p className="text-base text-mute">It may have been deleted, or you're no longer a member.</p>
          <Link href="/chats" className="inline-block rounded-full bg-ink px-5 py-2 text-sm font-medium text-white hover:bg-black/85">Back to chats</Link>
        </div>
      </div>
    </div>
  );
}
