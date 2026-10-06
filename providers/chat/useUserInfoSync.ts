import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import { api, avatarPath, clean, fetchFullUser } from "@/lib/api";

type Options = {
  me: any;
  meRef: MutableRefObject<any>;
  setMe: (fn: (m: any) => any) => void;
  convos: any[];
  membersMap: Record<number, any[]>;
  setMembers: (cid: number, list: any[], patch?: any) => void;
  setName: (id: number, n: string) => void;
  applyProfile: (u: any, bust?: boolean) => void;
  refreshProfile: (fid?: string, name?: string) => Promise<void>;
};

export function useUserInfoSync({ me, meRef, setMe, convos, membersMap, setMembers, setName, applyProfile, refreshProfile }: Options) {
  const resolved = useRef<Set<number>>(new Set());
  const hydrated = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!me?.friend_id || avatarPath(me)) return;
    let dead = false;
    fetchFullUser(me.friend_id, me.name, true).then((u) => {
      if (dead || !u) return;
      console.debug("[profile] full user", u);
      setMe((m: any) => (m && m.friend_id === me.friend_id ? { ...m, ...clean(u) } : m));
      applyProfile(u);
    });
    return () => { dead = true; };
  }, [me?.friend_id]);

  useEffect(() => {
    if (!me?.friend_id) return;
    const todo = convos.filter((c) => c.type === "direct_convo" && !resolved.current.has(c.id) && !membersMap[c.id]
      && !c.members?.some((m: any) => m.friend_id !== me.friend_id));
    if (!todo.length) return;
    todo.forEach((c) => resolved.current.add(c.id));
    (async () => {
      for (const c of todo) {
        try {
          const r = await api(`/conversation/${c.id}/members_in`);
          const cc = Array.isArray(r) ? r[0] : r;
          const active = cc?.members ?? cc?.all_members?.filter((u: any) => !u.left_at);
          if (!active?.length) continue;
          setMembers(c.id, active);
          const other = active.find((u: any) => u.friend_id !== meRef.current?.friend_id);
          if (other?.name) setName(c.id, other.name);
        } catch {}
      }
    })();
  }, [convos, membersMap, me?.friend_id]);

  useEffect(() => {
    if (!me?.friend_id) return;
    const people = new Map<string, any>();
    convos.forEach((c) => [...(membersMap[c.id] ?? c.members ?? []), c.last_message?.sender].forEach((u: any) => u?.friend_id && people.set(u.friend_id, u)));
    const todo = Array.from(people.values()).filter((u) => u.friend_id !== me.friend_id && !hydrated.current.has(u.friend_id) && !avatarPath(u));
    if (!todo.length) return;
    todo.forEach((u) => hydrated.current.add(u.friend_id));
    (async () => { for (const u of todo) await refreshProfile(u.friend_id, u.name); })();
  }, [convos, membersMap, me?.friend_id]);
}
