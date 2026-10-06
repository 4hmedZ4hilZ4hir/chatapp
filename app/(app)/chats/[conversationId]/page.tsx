import { notFound } from "next/navigation";
import ConversationView from "@/components/chat/ConversationView";

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  if (!/^\d+$/.test(conversationId)) notFound();
  return <ConversationView key={conversationId} conversationId={Number(conversationId)} />;
}
