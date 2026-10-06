"use client";
import Avatar from "@/components/ui/Avatar";
import { SidebarIcon, Trash, Users } from "@/components/ui/Icons";
import { convoTitle, lastSeenText } from "@/lib/api";

type Props = {
  convo: any; me: any; names: any;
  typing: string | null;
  isAdmin: boolean;
  deletedCount: number;
  onMenu: () => void;
  onTrash: () => void;
  onMembers: () => void;
};

export default function ChatHeader({ convo, me, names, typing, isAdmin, deletedCount, onMenu, onTrash, onMembers }: Props) {
  const title = convoTitle(convo, me, names);
  const typingText = typing === null ? "" : typing ? `${typing} is typing…` : title === "Direct chat" ? "Typing…" : `${title} is typing…`;
  const statusText = convo.type === "direct_convo"
    ? convo.online ? "Online" : convo.lastSeen ? `Last seen ${lastSeenText(convo.lastSeen)}` : ""
    : convo.members?.length ? `${convo.members.length} members` : "";

  return (
    <header className="flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-center gap-2 border-b border-surface px-2 pt-[env(safe-area-inset-top)] sm:px-4">
      <button onClick={onMenu} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-mute hover:bg-surface md:hidden" aria-label="Open chats"><SidebarIcon size={20} /></button>
      <Avatar name={title} user={convo.partner} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium leading-5">{title}</p>
        <p className={`h-4 truncate text-xs leading-4 ${typingText ? "text-ink" : convo.online ? "text-green-600" : "text-faint"}`}>{typingText || statusText}</p>
      </div>
      {isAdmin && <button onClick={onTrash} className="flex h-9 shrink-0 items-center gap-2 rounded-lg px-2.5 text-sm hover:bg-surface" aria-label="Deleted messages"><Trash size={18} /><span className="hidden sm:inline">Deleted{deletedCount ? ` (${deletedCount})` : ""}</span></button>}
      <button onClick={onMembers} className="flex h-9 shrink-0 items-center gap-2 rounded-lg px-2.5 text-sm hover:bg-surface" aria-label="Members"><Users size={18} /><span className="hidden sm:inline">Members</span></button>
    </header>
  );
}
