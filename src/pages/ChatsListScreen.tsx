import { useEffect, useState } from "react";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMyChats } from "../lib/db";
import type { Chat } from "../types";

interface Props {
  onBack: () => void;
  onOpenChat: (chat: Chat) => void;
}

export default function ChatsListScreen({ onBack, onOpenChat }: Props) {
  const { profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    getMyChats(profile.uid).then(setChats).catch(console.error).finally(() => setLoading(false));
  }, [profile]);

  function otherName(chat: Chat): string {
    if (!profile) return "";
    const otherUid = chat.participantIds.find((id) => id !== profile.uid);
    return otherUid ? chat.participantNames[otherUid] ?? "Unknown" : "Unknown";
  }

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur flex items-center gap-3">
        <button onClick={onBack} className="h-9 w-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-bold text-gray-900 dark:text-gray-100">Messages</h1>
      </div>

      <div className="px-4 pt-2 space-y-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 rounded-full border-2 border-brand-700 border-t-transparent animate-spin" />
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center mt-10">
            <MessageCircle size={32} className="text-gray-300 mx-auto" />
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              No conversations yet. Message a seller or roommate to start one.
            </p>
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onOpenChat(chat)}
              className="w-full flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700 text-left"
            >
              <div className="h-11 w-11 rounded-full flex items-center justify-center text-white font-semibold bg-brand-700 flex-shrink-0">
                {otherName(chat).split(" ").map((w) => w[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{otherName(chat)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{chat.contextLabel}</p>
                {chat.lastMessage && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{chat.lastMessage}</p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
