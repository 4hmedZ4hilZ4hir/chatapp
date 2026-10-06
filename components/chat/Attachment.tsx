"use client";
import { useEffect, useState } from "react";
import { BASE, tok } from "@/lib/api";

export default function Attachment({ a, image, onReady, onOpen }: { a: any; image: boolean; onReady?: (url: string) => void; onOpen?: () => void }) {
  const [url, setUrl] = useState<string>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (a.id == null) { setFailed(true); return; }
    let u: string;
    fetch(`${BASE}/api/attachments/${a.id}/download`, { headers: { Authorization: `Bearer ${tok.get()}`, "ngrok-skip-browser-warning": "1" } })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.blob(); })
      .then((b) => { u = URL.createObjectURL(b); setUrl(u); onReady?.(u); })
      .catch(() => setFailed(true));
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [a.id]);
  if (failed) return <span className="text-sm text-mute">{a.file_name ?? "Attachment"} <span className="text-xs text-faint">(can't load)</span></span>;
  if (image) return url
    ? <img src={url} alt={a.file_name} onClick={onOpen} className="max-h-64 max-w-full cursor-zoom-in rounded-xl" />
    : <div className="h-32 w-48 max-w-full animate-pulse rounded-xl bg-black/5" />;
  return <a href={url} download={a.file_name} className="text-sm underline underline-offset-2">{a.file_name}</a>;
}
