export const sameId = (a: any, b: any) => a != null && b != null && String(a) === String(b);

export const replyText = (r: any) =>
  !r || typeof r !== "object" ? "" : typeof r.body === "string" ? r.body : r.type === "image" ? "Photo" : r.type === "file" || Array.isArray(r.body) ? "Attachment" : "";
export const snippet = (m: any) => replyText(m) || "Attachment";

export const snap = (t: any) => ({ id: t.id, type: t.type, body: typeof t.body === "string" ? t.body : null, sender: t.sender ? { name: t.sender.name, friend_id: t.sender.friend_id } : undefined });

export const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const atts = (m: any): any[] => (Array.isArray(m.body) ? m.body : m.body ? [m.body] : []);
export const akey = (m: any, a: any, i: number) => `${m.id}:${a.id ?? a.path ?? i}`;

export const mergeMsg = (old: any, upd: any) => ({
  ...old, ...upd,
  sender: upd.sender ?? old.sender,
  reply_to: upd.reply_to && typeof upd.reply_to === "object" ? upd.reply_to : old.reply_to ?? upd.reply_to,
});

export const likers = (m: any): any[] => m.liked_users ?? [];
export const dislikers = (m: any): any[] => m.disliked_users ?? [];
export const likeCount = (m: any): number => m.likes_count ?? likers(m).length;
export const dislikeCount = (m: any): number => m.dislikes_count ?? dislikers(m).length;
export const myReaction = (m: any, meId: any): "like" | "dislike" | null =>
  likers(m).some((u: any) => sameId(u.id, meId)) ? "like" : dislikers(m).some((u: any) => sameId(u.id, meId)) ? "dislike" : null;

export const withReactions = (msgs: any[], full: any) => msgs.map((x) => x.id === full.id
  ? { ...x, liked_users: full.liked_users ?? [], disliked_users: full.disliked_users ?? [], likes_count: undefined, dislikes_count: undefined } : x);

export const withReactEvent = (msgs: any[], e: any, liked: boolean | null, userStub: (uid: any) => any) => msgs.map((x) => {
  if (!sameId(x.id, e.message_id)) return x;
  const not = (u: any) => !sameId(u.id, e.user_id);
  const l = likers(x).filter(not), d = dislikers(x).filter(not);
  if (liked === true) l.push(userStub(e.user_id)); else if (liked === false) d.push(userStub(e.user_id));
  return { ...x, liked_users: l, disliked_users: d, likes_count: e.likes_count, dislikes_count: e.dislikes_count };
});
