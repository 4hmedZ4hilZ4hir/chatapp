type Parts = {
  convos: any[]; me: any;
  profiles: Record<string, any>;
  membersMap: Record<number, any[]>;
  partners: Record<number, any>;
  presence: Record<number, { online: boolean; lastSeen?: string }>;
  nicks: Record<number, string>;
  pins: number[];
  receipts: Record<number, Record<number, number>>;
};

export function buildView({ convos, me, profiles, membersMap, partners, presence, nicks, pins, receipts }: Parts) {
  return convos.map((c) => {
    const ov = (u: any) => (u ? { ...u, ...profiles[u.friend_id] } : u);
    const members = (membersMap[c.id] ?? c.members)?.map(ov);
    const ls = c.last_message?.sender;
    const partner = ov(c.type === "direct_convo"
      ? members?.find((m: any) => m.friend_id !== me.friend_id) ?? (ls && ls.friend_id !== me.friend_id ? ls : partners[c.id])
      : undefined);
    const pr = partner ? presence[partner.id] : undefined;
    return { ...c, members, nick: c.type === "direct_convo" ? nicks[c.id] : undefined, pinned: pins.includes(c.id), partner, online: !!pr?.online, lastSeen: pr?.lastSeen ?? partner?.last_seen_at, receipts: receipts[c.id] };
  }).sort((a, b) => Number(b.pinned) - Number(a.pinned));
}
