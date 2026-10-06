import { useCallback, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { api } from "@/lib/api";

export function useProfiles(meRef: MutableRefObject<any>) {
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const lastRefresh = useRef<Record<string, number>>({});

  const applyProfile = useCallback((u: any, bust = false) => {
    if (!u?.friend_id) return;
    const { conversations, created_conversations, ...rest } = u;
    setProfiles((p) => ({ ...p, [u.friend_id]: { ...p[u.friend_id], ...rest, ...(bust ? { avatar_v: Date.now() } : {}) } }));
  }, []);

  const refreshProfile = useCallback(async (fid?: string, name?: string) => {
    if (!fid || fid === meRef.current?.friend_id) return;
    if (Date.now() - (lastRefresh.current[fid] ?? 0) < 1000) return;
    lastRefresh.current[fid] = Date.now();
    try {
      const r = await api(`/user/${fid}`);
      let u = r?.data ?? r;
      console.debug("[avatar] /user/" + fid, u);
      const n = String(u?.name ?? name ?? "").replace(/[^a-zA-Z ]/g, "").trim();
      if (!u?.avatar && n) {
        const list = await api(`/user?search=${encodeURIComponent(n)}`);
        const hit = list?.data?.find((x: any) => x.friend_id === fid);
        console.debug("[avatar] search hit for", fid, hit);
        if (hit) u = { ...u, ...hit };
      }
      applyProfile(u, true);
    } catch {}
  }, [applyProfile]);

  return { profiles, applyProfile, refreshProfile };
}
