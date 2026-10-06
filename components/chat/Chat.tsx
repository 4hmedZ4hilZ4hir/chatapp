"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { listenAll } from "@/lib/echo";
import { akey, atts, esc, mergeMsg, myReaction, sameId, snap, withReactEvent, withReactions } from "@/lib/messages";
import ChatHeader from "@/components/chat/ChatHeader";
import PinnedBar from "@/components/chat/PinnedBar";
import MessageList from "@/components/chat/MessageList";
import Composer from "@/components/chat/Composer";
import ReactionsModal from "@/components/chat/ReactionsModal";
import { useTrash } from "@/components/chat/useTrash";
import Members from "@/components/chat/Members";
import Lightbox from "@/components/chat/Lightbox";
import Confirm from "@/components/chat/Confirm";
import Deleted from "@/components/chat/Deleted";

export default function Chat({ me, convo, echo, names, onPartner, onMessage, presence, onMembers, onGone, profiles, onMenu, onRefresh }: any) {
  const id = convo.id;
  const ov = (u: any) => (u ? { ...u, ...profiles?.[u.friend_id] } : u);

  const [msgs, setMsgs] = useState<any[]>([]);
  const [reply, setReply] = useState<any>(null);
  const [edit, setEdit] = useState<{ id: number; value: string } | null>(null);
  const [flashId, setFlashId] = useState<number | null>(null);
  const [ask, setAsk] = useState<{ text: string; label: string; run: () => void } | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [owner, setOwner] = useState<any>(undefined);
  const [removed, setRemoved] = useState<any[]>([]);
  const [viewer, setViewer] = useState<string | null>(null);
  const [imgUrls, setImgUrls] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(true);
  const [reactView, setReactView] = useState<number | null>(null);
  const trash = useTrash(me, id, setMsgs);

  const reactBusy = useRef(new Set<number>());
  const readUpTo = useRef(0);
  const msgEls = useRef(new Map<number, HTMLElement>());
  const flashT = useRef<any>(null);
  const replyCache = useRef<Record<string, any>>({});
  const end = useRef<HTMLDivElement>(null);
  const prevNewest = useRef<any>(null);
  const typingTimer = useRef<any>(null);

  const role = convo.members?.find((m: any) => m.friend_id === me.friend_id)?.role;
  const isOwner = !!owner && (owner.friend_id === me.friend_id || owner.id === me.id);
  const adminRef = useRef(false);
  const isAdmin: boolean = role ? role === "owner" || role === "admin" : owner === undefined ? false : owner === null ? true : isOwner;
  adminRef.current = isAdmin;

  const people = useMemo(() => {
    const map = new Map<string, any>();
    [...(convo.members ?? []), ...msgs.map((m) => m.sender)].forEach((u) => u && u.friend_id !== me.friend_id && map.set(u.friend_id, ov(u)));
    return [...map.values()];
  }, [convo.members, msgs, me.friend_id, profiles]);
  const knownMembers = convo.members?.length ? convo.members : [me, ...people];
  const pinned = useMemo(() => msgs.filter((m) => m.is_pinned).sort((a, b) => b.id - a.id), [msgs]);
  const mentionRe = useMemo(() => {
    const ns = [...people.map((p) => p.name), me.name].filter(Boolean).sort((a: string, b: string) => b.length - a.length).map(esc);
    return ns.length ? new RegExp(`@(${ns.join("|")})`, "g") : null;
  }, [people, me.name]);
  const gallery = useMemo(() => msgs.flatMap((m) => (m.type === "image" ? atts(m).map((a, i) => ({ key: akey(m, a, i), m, a })) : []))
    .filter((g) => imgUrls[g.key])
    .map((g) => ({ key: g.key, url: imgUrls[g.key], name: g.a.file_name, mime: g.a.mime_type, sender: ov(g.m.sender), when: g.m.created_at })), [msgs, imgUrls, profiles]);
  const viewIndex = viewer ? gallery.findIndex((g) => g.key === viewer) : -1;
  const reactMsg = reactView != null ? msgs.find((x) => x.id === reactView) : undefined;

  const renderText = (t: string, mine: boolean) => !mentionRe ? t : t.split(mentionRe).map((part, i) =>
    i % 2 ? <span key={i} className="rounded bg-black/5 px-1 font-medium">@{part}</span> : part);

  const saveReply = (mid: number, t: any) => {
    const c = replyCache.current; c[mid] = snap(t);
    Object.keys(c).map(Number).sort((a, b) => b - a).slice(300).forEach((k) => delete c[k]);
    try { localStorage.setItem(`replies:${me.friend_id}:${id}`, JSON.stringify(c)); } catch {}
  };
  const hydrate = (m: any, all: any[]) => {
    const r = m.reply_to;
    let t = r && typeof r === "object" ? r : r != null && r !== "" ? all.find((x) => sameId(x.id, r)) : undefined;
    if (t) { saveReply(m.id, t); return t === r ? m : { ...m, reply_to: t }; }
    const c = replyCache.current[m.id];
    return c ? { ...m, reply_to: c } : m;
  };
  const replyOf = (m: any) => (m.reply_to && typeof m.reply_to === "object" ? m.reply_to : m.reply_to != null && m.reply_to !== "" ? msgs.find((x) => sameId(x.id, m.reply_to)) : undefined);

  const fail = (x: any) => setErr(
    x.status === 429 ? `You're reacting too fast. Try again${x.retryAfter ? ` in ${x.retryAfter}s` : " in a minute"}.`
    : x.status === 403 ? "You don't have permission to do that." : x.message);
  const removeMsg = (mid?: number) => {
    if (!mid) return false;
    setMsgs((cur) => cur.filter((x) => x.id !== mid));
    return true;
  };
  const userStub = (uid: any) => people.find((p: any) => sameId(p.id, uid)) ?? (sameId(uid, me.id) ? me : { id: uid });
  const setEl = (mid: number, el: HTMLElement | null) => { if (el) msgEls.current.set(mid, el); else msgEls.current.delete(mid); };
  function jumpTo(mid: number) {
    const el = msgEls.current.get(mid);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashId(mid); clearTimeout(flashT.current); flashT.current = setTimeout(() => setFlashId(null), 1800);
  }

  async function react(m: any, kind: "like" | "dislike") {
    if (reactBusy.current.has(m.id)) return;
    reactBusy.current.add(m.id);
    try {
      const full = myReaction(m, me.id) === kind
        ? await api(`/message/${m.id}/remove_reaction`, { method: "DELETE" })
        : await api(`/message/${m.id}/${kind}`, { method: "POST" });
      setMsgs((cur) => withReactions(cur, full)); setErr("");
    } catch (x: any) { fail(x); }
    finally { reactBusy.current.delete(m.id); }
  }
  async function removeReaction(m: any, uid: any) {
    try { const full = await api(`/message/${m.id}/remove_reaction`, { method: "DELETE", body: { user_id: uid } }); setMsgs((cur) => withReactions(cur, full)); }
    catch (x: any) { fail(x); }
  }
  const onReactEvent = (e: any, liked: boolean | null) => {
    if (e?.message_id == null) return;
    setMsgs((cur) => withReactEvent(cur, e, liked, userStub));
  };

  useEffect(() => {
    setMsgs([]); setReply(null); setEdit(null); setErr(""); setTyping(null); setRemoved([]);
    try { replyCache.current = JSON.parse(localStorage.getItem(`replies:${me.friend_id}:${id}`) || "{}"); } catch { replyCache.current = {}; }
    const load = () => api(`/conversation/${id}/messages?created_by`).then((c) => {
      const list = [...(c.messages ?? [])].reverse();
      setMsgs(list.map((m: any) => hydrate(m, list)));
      setOwner(c.created_by ?? null);
    }).catch((x) => setErr(x.message));
    const loadMembers = () => api(`/conversation/${id}/members_in`).then((r) => {
      const c = Array.isArray(r) ? r[0] : r;
      if (!c) return;
      const active = c.members ?? c.all_members?.filter((u: any) => !u.left_at);
      if (active?.length) onMembers?.(id, active);
      if (c.all_members) setRemoved(c.all_members.filter((u: any) => u.left_at));
    }).catch(() => {});
    load(); loadMembers();
    if (!echo) return;
    const off = listenAll(echo.private(`conversation.${id}`), {
      MessageSent: (e: any) => {
        if (!e?.message) return load();
        setMsgs((m) => (m.find((x) => x.id === e.message.id) ? m : [...m, hydrate(e.message, m)]));
        onMessage?.(id, e.message);
        if (!e.message.sender) load();
      },
      MessageUpdated: (e: any) => {
        const m = e?.message;
        if (!m?.id) return load();
        setMsgs((cur) => cur.map((x) => (x.id === m.id ? mergeMsg(x, m) : x)));
      },
      UserReacted: (e: any) => onReactEvent(e, !!e.liked),
      UserUnreacted: (e: any) => onReactEvent(e, null),
      UserAdded: loadMembers, UserDeleted: loadMembers,
      MessageDeleted: (e: any) => { if (adminRef.current) trash.add(e?.message); return removeMsg(e?.message?.id) || load(); },
      MessageDeletedForever: (e: any) => { if (e?.message?.id) trash.drop(e.message.id); return removeMsg(e?.message?.id) || load(); },
      MessageRestored: (e: any) => {
        const m = e?.message;
        if (!m?.id) return load();
        trash.drop(m.id);
        setMsgs((cur) => (cur.find((x) => x.id === m.id) ? cur : [...cur, m].sort((a, b) => a.id - b.id)));
        if (!m.sender) load();
      },
      "user.stopped.typing": (e: any) => {
        if (String(e.userId) === String(me.id)) return;
        clearTimeout(typingTimer.current);
        setTyping(null);
      },
      "user.typing": (e: any) => {
        if (String(e.userId) === String(me.id)) return;
        setTyping(convo.type === "direct_convo" ? "" : e.name);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(null), 5000);
      },
    });
    const offUser = listenAll(echo.private(`user.${me.id}`), {
      ConversationUpdated: (ev: any) => { if (Number(ev?.conversation?.id) === id) { loadMembers(); load(); } },
    });
    return () => { off(); offUser(); clearTimeout(typingTimer.current); };
  }, [id, echo]);

  useEffect(() => {
    if (convo.type !== "direct_convo") return;
    const o = msgs.find((m) => m.sender && m.sender.friend_id !== me.friend_id);
    if (o) onPartner(id, ov(o.sender).name, ov(o.sender));
  }, [msgs, profiles]);

  useEffect(() => {
    const n = msgs[msgs.length - 1], p = prevNewest.current;
    const body = (m: any) => (typeof m?.body === "string" ? m.body : "");
    if (n && p && (n.id < p.id || (n.id === p.id && body(n) !== p.body))) onMessage?.(id, n, false);
    prevNewest.current = n ? { id: n.id, body: body(n) } : null;
  }, [msgs]);

  useEffect(() => {
    const on = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  useEffect(() => { try { readUpTo.current = Number(localStorage.getItem(`readUpTo:${me.friend_id}:${id}`) || 0); } catch {} }, [id]);
  useEffect(() => {
    if (!visible) return;
    const todo = msgs.filter((m) => m.sender && m.sender.friend_id !== me.friend_id && m.id > readUpTo.current).slice(-30);
    if (!todo.length) return;
    readUpTo.current = todo[todo.length - 1].id;
    try { localStorage.setItem(`readUpTo:${me.friend_id}:${id}`, String(readUpTo.current)); } catch {}
    (async () => {
      for (const m of todo) {
        const r = await api(`/message/${m.id}?reply_to`).catch(() => null);
        const t = r?.reply_to;
        if (t && typeof t === "object") { saveReply(m.id, t); setMsgs((cur) => cur.map((x) => (x.id === m.id ? { ...x, reply_to: t } : x))); }
      }
    })();
  }, [msgs, visible]);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length, typing]);

  async function send({ text, file, mentions }: { text: string; file?: File; mentions: any[] }) {
    const body = new FormData();
    body.append("conversation_id", id);
    if (file) { body.append("type", file.type.startsWith("image/") ? "image" : "file"); body.append("attachment", file); }
    else { body.append("type", "text"); body.append("body", text.trim()); }
    if (reply) body.append("reply_to", reply.id);
    try {
      const m = await api("/message", { body });
      const mine = { ...m, sender: m.sender ?? me, ...(reply ? { reply_to: reply } : {}) };
      if (reply) saveReply(m.id, reply);
      setMsgs((x) => (x.some((y) => sameId(y.id, m.id)) ? x.map((y) => (sameId(y.id, m.id) ? { ...y, ...mine } : y)) : [...x, mine])); onMessage?.(id, m);
      mentions.filter((u) => text.includes(`@${u.name}`)).forEach((u) => api(`/notify/${u.friend_id}/in/${id}`, { method: "POST" }).catch(() => {}));
      setReply(null); setErr("");
      return true;
    } catch (x: any) { fail(x); return false; }
  }
  async function saveEdit() {
    if (!edit || !edit.value.trim()) return;
    try {
      const m = await api(`/message/${edit.id}`, { method: "PATCH", body: { conversation_id: id, body: edit.value.trim() } });
      setMsgs((x) => x.map((y) => (y.id === edit.id ? mergeMsg(y, m) : y))); setEdit(null);
    } catch (x: any) { fail(x); }
  }
  async function del(m: any) {
    if (!confirm("Delete this message?")) return;
    try { await api(`/message/${m.id}`, { method: "DELETE" }); setMsgs((x) => x.filter((y) => y.id !== m.id)); if (isAdmin) trash.add(m); }
    catch (x: any) { fail(x); }
  }
  async function togglePin(m: any) {
    try {
      await api(`/pin/${id}/${m.is_pinned ? "remove" : "add"}`, { method: "PUT", body: m.is_pinned ? { remove_pin_message: m.id } : { pin_message: m.id } });
      setMsgs((x) => x.map((y) => (y.id === m.id ? { ...y, is_pinned: !m.is_pinned } : y)));
    } catch (x: any) { fail(x); }
  }
  const askPin = (m: any) => setAsk({ text: m.is_pinned ? "Would you like to unpin this message?" : "Would you like to pin this message?", label: m.is_pinned ? "Unpin" : "Pin", run: () => togglePin(m) });

  return (
    <div className="flex h-dvh min-w-0 flex-1 flex-col bg-white">
      <ChatHeader convo={convo} me={me} names={names} typing={typing} isAdmin={isAdmin} deletedCount={trash.items.length}
        onMenu={onMenu} onTrash={() => trash.setShow(true)} onMembers={() => setShowMembers(true)} />
      <PinnedBar pinned={pinned} isAdmin={isAdmin} onJump={jumpTo} onUnpin={askPin} />
      <MessageList msgs={msgs} me={me} convo={convo} ov={ov} isAdmin={isAdmin} flashId={flashId}
        edit={edit} setEdit={setEdit} saveEdit={saveEdit} replyOf={replyOf} renderText={renderText} endRef={end}
        onEl={setEl} onJump={jumpTo} onReact={react} onWho={(m) => setReactView(m.id)} onReply={setReply} onPin={askPin} onDelete={del}
        onImageReady={(key, url) => setImgUrls((p) => ({ ...p, [key]: url }))} onOpenImage={setViewer} />
      <Composer convoId={id} isDirect={convo.type === "direct_convo"} people={people} reply={reply} ov={ov} err={err}
        onCancelReply={() => setReply(null)} onSend={send} />

      <AnimatePresence>
        {showMembers && (
          <Members me={me} convo={convo} known={knownMembers} complete={!!convo.members?.length} owner={owner} presence={presence} canManage={isAdmin}
            isOwner={isOwner} removed={removed}
            onRemoved={(u: any) => setRemoved((r) => (r.some((x) => x.id === u.id) ? r : [...r, u]))}
            onPurged={(u: any) => setRemoved((r) => r.filter((x) => x.id !== u.id))}
            onRestored={(u: any, list: any[]) => { setRemoved((r) => r.filter((x) => x.id !== u.id)); onMembers?.(id, [...knownMembers, ...list.filter((n) => !knownMembers.some((k: any) => k.id === n.id))]); onRefresh?.(); }}
            onClose={() => setShowMembers(false)} onGone={() => onGone?.(id)}
            onRole={(u: any, role: string) => onMembers?.(id, knownMembers.map((k: any) => (k.id === u.id ? { ...k, role } : k)))}
            onTransfer={(u: any) => { setOwner(u); onMembers?.(id, knownMembers.map((k: any) => (k.id === u.id ? { ...k, role: "owner" } : k.friend_id === me.friend_id ? { ...k, role: "member" } : k))); }}
            onChanged={(c: any, fallback: any[]) => onMembers?.(id, c.members?.length ? c.members : fallback, c.type ? { type: c.type, ...(c.name ? { name: c.name } : {}) } : undefined)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {trash.show && <Deleted items={trash.items} busy={trash.busy} err={trash.err} onRestore={trash.restore} onPurge={trash.purge} onClose={() => trash.setShow(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {reactMsg && <ReactionsModal m={reactMsg} me={me} isAdmin={isAdmin} ov={ov} userStub={userStub} onRemove={(uid) => removeReaction(reactMsg, uid)} onClose={() => setReactView(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {ask && <Confirm text={ask.text} label={ask.label} onYes={ask.run} onClose={() => setAsk(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {viewIndex >= 0 && <Lightbox items={gallery} index={viewIndex} onIndex={(n: number) => setViewer(gallery[n].key)} onClose={() => setViewer(null)} />}
      </AnimatePresence>
    </div>
  );
}
