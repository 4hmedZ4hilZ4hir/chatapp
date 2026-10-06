import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function useSidebarState(me: any, setConvos: (fn: (cs: any[]) => any[]) => void, activeId: number | null) {
  const router = useRouter();
  const [pins, setPins] = useState<number[]>([]);
  const [nicks, setNicks] = useState<Record<number, string>>({});
  const [flash, setFlash] = useState("");
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (!me?.friend_id) return;
    try {
      setPins(JSON.parse(localStorage.getItem(`pins:${me.friend_id}`) || "[]"));
      setNicks(JSON.parse(localStorage.getItem(`nicks:${me.friend_id}`) || "{}"));
    } catch {}
  }, [me?.friend_id]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(""), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  const save = (k: string, v: any) => localStorage.setItem(`${k}:${me.friend_id}`, JSON.stringify(v));

  const togglePin = (c: any) => setPins((p) => { const x = p.includes(c.id) ? p.filter((i) => i !== c.id) : [c.id, ...p]; save("pins", x); return x; });

  async function renameConvo(c: any, name: string) {
    if (c.type === "direct_convo") {
      setNicks((p) => { const x = { ...p }; if (name) x[c.id] = name; else delete x[c.id]; save("nicks", x); return x; });
      return;
    }
    if (!name) return setFlash("A group name can't be empty.");
    try { await api(`/conversation/${c.id}`, { method: "PATCH", body: { name } }); setConvos((cs) => cs.map((x) => (x.id === c.id ? { ...x, name } : x))); }
    catch (x: any) { setFlash(x.status === 403 ? "Only the owner or an admin can rename this group." : x.message); }
  }

  async function deleteConvo(c: any) {
    if (!confirm("Delete this conversation for everyone? This can't be undone.")) return;
    try {
      await api(`/conversation/${c.id}`, { method: "DELETE" });
      setConvos((cs) => cs.filter((x) => x.id !== c.id)); setPins((p) => { const x = p.filter((i) => i !== c.id); save("pins", x); return x; });
      if (activeId === c.id) router.replace("/chats");
    } catch (x: any) { setFlash(x.status === 403 ? "Only the owner can delete this conversation." : x.message); }
  }

  return { pins, nicks, flash, drawer, setDrawer, togglePin, renameConvo, deleteConvo };
}
