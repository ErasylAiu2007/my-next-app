"use client";

import { useParams } from "next/navigation";
import { ChatConversation } from "../../_components/chat-ui";

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  return <ChatConversation chatId={params.id} />;
}
