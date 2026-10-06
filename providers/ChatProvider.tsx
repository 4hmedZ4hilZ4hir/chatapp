"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clean, convoTitle, fetchFullUser } from "@/lib/api";
import { groupNotes } from "@/components/notifications/Notifications";
import { useAuth } from "@/providers/AuthProvider";
import { buildView } from "@/providers/chat/buildView";
import { useConversations } from "@/providers/chat/useConversations";
import { useNames } from "@/providers/chat/useNames";
import { useNotifications } from "@/providers/chat/useNotifications";
import { usePresence } from "@/providers/chat/usePresence";
import { useProfiles } from "@/providers/chat/useProfiles";
import { useReceipts } from "@/providers/chat/useReceipts";
import { useRealtime } from "@/providers/chat/useRealtime";
import { useSidebarState } from "@/providers/chat/useSidebarState";
import { useUserInfoSync } from "@/providers/chat/useUserInfoSync";

const ChatContext = createContext<any>(null);

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}

export default function ChatProvider({ children }: { children: ReactNode }) {
  const { me, setMe, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  const routeId = pathname.match(/^\/chats\/(\d+)/)?.[1];
  const activeId: number | null = routeId ? Number(routeId) : null;

  const meRef = useRef<any>(null);
  meRef.current = me;
  const activeRef = useRef<number | null>(null);
  activeRef.current = activeId;

  const { names, setName } = useNames(me, meRef);
  const { profiles, applyProfile, refreshProfile } = useProfiles(meRef);
  const { presence, setPresence } = usePresence(me);
  const { receipts, markReceipts } = useReceipts(me, meRef);
  const { convos, setConvos, loaded, load, bump, dropConvo, membersMap, setMembersMap, partners, setPartner, setMembers, convosRef, membersRef } = useConversations(me, activeRef);

  const openConvo = useCallback((id: number) => {
    if (id !== activeRef.current) router.push(`/chats/${id}`);
  }, [router]);

  const { notes, toasts, setToasts, addNote, openNote, dismiss } = useNotifications({ me, meRef, activeId, activeRef, convosRef, membersRef, load, openConvo });
  const echo = useRealtime({ me, meRef, convos, convosRef, load, bump, dropConvo, setConvos, setMembers, setMembersMap, setPresence, markReceipts, addNote, applyProfile, refreshProfile });
  useUserInfoSync({ me, meRef, setMe, convos, membersMap, setMembers, setName, applyProfile, refreshProfile });
  const { pins, nicks, flash, drawer, setDrawer, togglePin, renameConvo, deleteConvo } = useSidebarState(me, setConvos, activeId);

  const view = buildView({ convos, me, profiles, membersMap, partners, presence, nicks, pins, receipts });
  const active = view.find((c) => c.id === activeId);
  const titleOf = (cid: number | null) => { const c = view.find((x) => x.id === cid); return c ? convoTitle(c, me, names) : undefined; };
  const isGroup = (cid: number | null) => convos.find((c) => c.id === cid)?.type === "group_convo";
  const noteItems = groupNotes(notes, titleOf, isGroup);

  const selectConvo = (id: number) => { openConvo(id); setDrawer(false); };
  const openNoteAndClose = (it: any) => { openNote(it); setDrawer(false); };
  const clearNotes = () => dismiss(() => true);
  const onCreated = (c: any, u: any) => {
    if (u && c.type === "direct_convo") setName(c.id, u.name);
    load().finally(() => openConvo(c.id));
    setDrawer(false);
  };
  async function onProfileSaved(u: any, file?: File | null) {
    console.debug("[profile] save response", u);
    const local = file ? { avatar_local: URL.createObjectURL(file), avatar_v: Date.now() } : {};
    setMe((m: any) => ({ ...m, ...clean(u), ...local }));
    const fresh = await fetchFullUser(me.friend_id, u?.name ?? me.name, true);
    console.debug("[profile] refreshed user", fresh);
    if (fresh) {
      setMe((m: any) => ({ ...m, ...clean(fresh), ...local, ...(file ? {} : { avatar_v: Date.now() }) }));
      applyProfile({ ...fresh, friend_id: me.friend_id }, true);
    }
  }

  const value = {
    me, setMe, logout,
    convos: view, loaded, load, activeId, active, openConvo,
    echo, names, presence, profiles, bump, setName, setPartner, setMembers, dropConvo,
    drawer, setDrawer, selectConvo, togglePin, renameConvo, deleteConvo, onCreated,
    noteItems, noteTotal: notes.length, openNote, openNoteAndClose, clearNotes, toasts, setToasts, titleOf, isGroup, flash,
    profileOpen, setProfileOpen, onProfileSaved,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
