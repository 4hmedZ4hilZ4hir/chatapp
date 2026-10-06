"use client";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export default function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { me, ready } = useAuth();
  const router = useRouter();
  useEffect(() => { if (ready && me) router.replace("/chats"); }, [ready, me, router]);
  if (!ready || me) return null;
  return <>{children}</>;
}
