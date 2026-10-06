import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function useConversations(me: any, activeRef: MutableRefObject<number | null>) {
  const router = useRouter();
  const [convos, setConvos] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [membersMap, setMembersMap] = useState<Record<number, any[]>>({});
  const [partners, setPartners] = useState<Record<number, any>>({});

  const convosRef = useRef<any[]>([]);
  convosRef.current = convos;
  const membersRef = useRef<Record<number, any[]>>({});
  membersRef.current = membersMap;

  const load = useCallback(() => api("/conversation").then((r) => setConvos(r.data)).catch(() => {}).finally(() => setLoaded(true)), []);
  useEffect(() => { if (me) load(); }, [me?.id, load]);

  const bump = useCallback((id: number, m: any, reorder = true) => setConvos((cs) => {
    const c = cs.find((x) => x.id === id);
    if (!c) return cs;
    const u = { ...c, last_message: m };
    return reorder ? [u, ...cs.filter((x) => x.id !== id)] : cs.map((x) => (x.id === id ? u : x));
  }), []);

  const setPartner = useCallback((cid: number, u: any) => setPartners((p) => (p[cid]?.id === u?.id ? p : { ...p, [cid]: u })), []);

  const setMembers = useCallback((cid: number, list: any[], patch?: any) => {
    setMembersMap((p) => ({ ...p, [cid]: list }));
    if (patch) setConvos((cs) => cs.map((x) => (x.id === cid ? { ...x, ...patch } : x)));
  }, []);

  const dropConvo = useCallback((cid: number) => {
    setConvos((cs) => cs.filter((x) => x.id !== cid));
    if (activeRef.current === cid) router.replace("/chats");
  }, [router]);

  return { convos, setConvos, loaded, load, bump, dropConvo, membersMap, setMembersMap, partners, setPartner, setMembers, convosRef, membersRef };
}
