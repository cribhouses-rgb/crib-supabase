import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscribeToMessages, sendMessage } from "../lib/db";
import type { ChatMessage } from "../types";

interface Props {
  chatId: string;
  otherName: string;
  contextLabel: string;
  onBack: () => void;
}

export default function ChatThreadScreen({ chatId, otherName, contextLabel, onBack }: Props) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(chatId, setMessages);
    return unsubscribe;
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!profile || !text.trim()) return;
    setSending(true);
    const toSend = text.trim();
    setText("");
    try {
      await sendMessage(chatId, profile.uid, toSend);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur flex items-center gap-3 border-b border-gray-100 dark:border-gray-700">
        <button onClick={onBack} className="h-9 w-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{otherName}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{contextLabel}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
            Say hello — this is the start of your conversation.
          </p>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === profile?.uid;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    isMe ? "bg-brand-700 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          placeholder="Type a message…"
          className="flex-1 h-11 px-4 rounded-full border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="h-11 w-11 rounded-full bg-brand-700 text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
