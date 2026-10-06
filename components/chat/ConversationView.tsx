"use client";
import { useEffect, useRef, useState } from "react";
import Chat from "@/components/chat/Chat";
import ChatSkeleton from "@/components/chat/ChatSkeleton";
import ConversationNotFound from "@/components/chat/ConversationNotFound";
import { useChat } from "@/providers/ChatProvider";

export default function ConversationView({ conversationId }: { conversationId: number }) {
  const { me, convos, loaded, load, echo, names, bump, setDrawer, presence, profiles, setMembers, dropConvo, setName, setPartner } = useChat();
  const convo = convos.find((c: any) => c.id === conversationId);
  const seen = useRef(false);
  const [checked, setChecked] = useState(false);
  if (convo) seen.current = true;

  useEffect(() => {
    if (convo || seen.current || !loaded) return;
    let dead = false;
    load().finally(() => { if (!dead) setChecked(true); });
    return () => { dead = true; };
  }, [convo, loaded, conversationId]);

  if (convo) {
    return (
      <Chat key={convo.id} me={me} convo={convo} echo={echo} names={names} onMessage={bump} onMenu={() => setDrawer(true)} presence={presence} profiles={profiles} onMembers={setMembers} onGone={dropConvo} onRefresh={load}
        onPartner={(cid: number, n: string, u?: any) => { setName(cid, n); if (u) setPartner(cid, u); }} />
    );
  }
  if (seen.current) return null;
  return loaded && checked ? <ConversationNotFound /> : <ChatSkeleton />;
}
