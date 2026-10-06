import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { tok } from "@/lib/api";
import { listenAll, makeEcho } from "@/lib/echo";

type Options = {
  me: any;
  meRef: MutableRefObject<any>;
  convos: any[];
  convosRef: MutableRefObject<any[]>;
  load: () => Promise<any>;
  bump: (id: number, m: any, reorder?: boolean) => void;
  dropConvo: (id: number) => void;
  setConvos: (fn: (cs: any[]) => any[]) => void;
  setMembers: (cid: number, list: any[], patch?: any) => void;
  setMembersMap: (fn: (p: Record<number, any[]>) => Record<number, any[]>) => void;
  setPresence: (fn: (p: any) => any) => void;
  markReceipts: (cid: number, ids: number[], level: number) => void;
  addNote: (raw: any) => void;
  applyProfile: (u: any, bust?: boolean) => void;
  refreshProfile: (fid?: string, name?: string) => Promise<void>;
};

export function useRealtime(o: Options) {
  const { me, meRef, convos, convosRef, load, bump, dropConvo, setConvos, setMembers, setMembersMap, setPresence, markReceipts, addNote, applyProfile, refreshProfile } = o;
  const [echo, setEcho] = useState<any>(null);
  const subbed = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!me) return;
    const e = makeEcho(tok.get()!);
    if (!e) return;
    e.private(`App.Models.User.${me.id}`).notification((n: any) => addNote(n));
    listenAll(e.private(`user.${me.id}`), {
      GroupCreated: load, UserAdded: load, UserDeleted: load,
      ConversationUpdated: (ev: any) => {
        const cv = ev?.conversation;
        if (!cv?.id) return load();
        setConvos((cs) => cs.map((x) => (x.id === cv.id ? { ...x, ...(cv.name !== undefined ? { name: cv.name } : {}) } : x)));
      },
      ConversationDeleted: (ev: any) => (ev?.conversation?.id ? dropConvo(ev.conversation.id) : load()),
    });
    setEcho(e);
    return () => { subbed.current = new Set(); e.disconnect(); };
  }, [me?.id, load]);

  useEffect(() => {
    if (!echo) return;
    convos.forEach((c) => {
      if (subbed.current.has(c.id)) return;
      subbed.current.add(c.id);
      listenAll(echo.private(`conversation.${c.id}`), {
        MessageSent: (ev: any) => ev?.message && bump(c.id, ev.message),
        MessageUpdated: (ev: any) => {
          const m = ev?.message;
          if (m?.id && convosRef.current.find((x) => x.id === c.id)?.last_message?.id === m.id) bump(c.id, m, false);
        },
        MessageDeleted: load, MessageDeletedForever: load, MessageRestored: load,
        MessageDelivered: (ev: any) => { if (ev?.user?.id !== meRef.current?.id) markReceipts(c.id, ev?.messageIds ?? [], 1); },
        MessageRead: (ev: any) => { if (ev?.messageId && ev?.user?.id !== meRef.current?.id) markReceipts(c.id, [ev.messageId], 2); },
        UserAdded: (ev: any) => {
          const cv = ev?.conversation;
          if (cv?.members) setMembers(c.id, cv.members, cv.type && (cv.type === "direct_convo" || cv.name) ? { type: cv.type, ...(cv.name ? { name: cv.name } : {}) } : undefined);
          else setMembersMap((p) => { const { [c.id]: _gone, ...rest } = p; return rest; });
          load();
        },
        UserDeleted: (ev: any) => {
          const ids: number[] = ev?.userIds ?? [];
          if (ids.includes(meRef.current?.id)) return dropConvo(c.id);
          setMembersMap((p) => (p[c.id] ? { ...p, [c.id]: p[c.id].filter((u) => !ids.includes(u.id)) } : p));
          load();
        },
        UserUpdatedInfo: (ev: any) => { if (!ev?.user?.friend_id) return load(); applyProfile(ev.user); refreshProfile(ev.user.friend_id, ev.user.name); },
        UserDeletedForever: (ev: any) => {
          const uid = ev?.user?.id;
          if (uid) setMembersMap((p) => (p[c.id] ? { ...p, [c.id]: p[c.id].filter((u) => u.id !== uid) } : p));
          load();
        },
        "user.online": (ev: any) => { if (ev?.user_id) setPresence((p) => ({ ...p, [ev.user_id]: { online: true } })); },
        "user.offline": (ev: any) => { if (ev?.user_id) setPresence((p) => ({ ...p, [ev.user_id]: { online: false, lastSeen: ev.last_seen_at } })); },
      });
    });
  }, [echo, convos, bump, load, markReceipts, setMembers, dropConvo, refreshProfile, applyProfile]);

  return echo;
}
