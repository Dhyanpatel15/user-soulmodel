"use client";

import { useState, useEffect, useRef } from "react";
import { messagesApi, browseApi, mediaUrl } from "@/lib/api";
import { Send, BadgeCheck, ArrowLeft } from "lucide-react";
import Spinner from "@/components/Spinner";

function timeLabel(d?: string) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Avatar({ user, size = 40 }: any) {
  const [imgError, setImgError] = useState(false);
  const name = user?.display_name || user?.username || user?.full_name || "?";
  const initials = name.slice(0, 2).toUpperCase();
  const avatarUrl = user?.avatar ? mediaUrl(user.avatar) : null;

  if (!avatarUrl || imgError) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-pink-100 flex items-center justify-center text-[#e8125c] font-bold flex-shrink-0"
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      onError={() => setImgError(true)}
      style={{ width: size, height: size }}
      className="rounded-full object-cover flex-shrink-0"
    />
  );
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingCreators, setLoadingCreators] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesApi.getConversations()
      .then((data) => setConversations(Array.isArray(data) ? data : data?.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    browseApi.getCreatorsList(50, 0)
      .then(setCreators)
      .catch(console.error)
      .finally(() => setLoadingCreators(false));
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
  };

  const selectConversation = async (conv: any) => {
    setSelected(conv);
    setMsgLoading(true);
    try {
      const data = await messagesApi.getMessages(conv.id);
      setMessages(Array.isArray(data) ? data : data?.items || []);
    } catch { alert("Failed to load messages"); }
    setMsgLoading(false);
    scrollToBottom();
  };

  const startChatWithCreator = async (creator: any) => {
    try {
      let conv = conversations.find((c) => {
        const other = c.creator || c.other_user || c.participant || {};
        return other?.id === creator.id;
      });
      if (!conv) {
        conv = await messagesApi.startConversation(creator.id);
        setConversations((prev) => [conv, ...prev]);
      }
      selectConversation(conv);
    } catch { alert("Failed to start chat"); }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selected) return;
    const temp = { id: Date.now(), content: input, is_mine: true, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, temp]);
    setInput("");
    scrollToBottom();
    try {
      const real = await messagesApi.sendMessage(selected.id, temp.content);
      setMessages((prev) => prev.map((m) => (m.id === temp.id ? real : m)));
    } catch { alert("Failed to send message"); }
  };

  const getOther = (conv: any) => conv.creator || conv.other_user || conv.participant || {};

  // On mobile: show chat view OR list view (not both)
  // On desktop: show both side by side

  return (
    <div className="flex h-[calc(100vh-56px)] md:h-screen bg-gray-100">

      {/* SIDEBAR LIST */}
      <div className={`w-full md:w-80 bg-white border-r flex flex-col ${selected ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b font-semibold text-base md:text-lg">Messages</div>

        <div className="flex-1 overflow-y-auto">
          {/* Start Chat */}
          <div className="p-4 border-b">
            <p className="text-xs font-semibold text-gray-500 mb-3">START CHAT</p>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {loadingCreators ? (
                <Spinner />
              ) : (
                creators.map((c) => (
                  <button key={c.id} onClick={() => startChatWithCreator(c)} className="flex flex-col items-center min-w-[56px]">
                    <Avatar user={c} size={44} />
                    <span className="text-[10px] mt-1 truncate w-[56px] text-center">{c.username}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Conversations */}
          {loading ? (
            <Spinner />
          ) : (
            conversations.map((conv) => {
              const other = getOther(conv);
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 ${selected?.id === conv.id ? "bg-gray-100" : ""}`}
                >
                  <Avatar user={other} size={44} />
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm truncate">{other.display_name || other.username}</span>
                      {other.is_verified && <BadgeCheck size={13} className="flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{conv.last_message?.content || "Start chat"}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-white w-full md:w-auto">
          {/* Header */}
          <div className="border-b px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSelected(null)} className="text-gray-600 p-1 -ml-1">
              <ArrowLeft size={20} />
            </button>
            {(() => {
              const other = getOther(selected);
              return (
                <>
                  <Avatar user={other} size={36} />
                  <div>
                    <p className="font-medium text-sm">{other.display_name || other.username}</p>
                    <p className="text-xs text-green-500">Online</p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {msgLoading ? (
              <Spinner />
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.is_mine;
                return (
                  <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`px-3 py-2 rounded-xl max-w-[75%] text-sm ${isMe ? "bg-pink-500 text-white" : "bg-white border"}`}>
                      {msg.content}
                      <div className="text-[10px] mt-1 opacity-70">{timeLabel(msg.created_at)}</div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-2 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type message..."
              className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e8125c] bg-gray-50"
            />
            <button onClick={sendMessage} className="bg-[#e8125c] text-white px-4 rounded-xl flex items-center justify-center">
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex items-center justify-center text-gray-400 text-sm">
          Select a conversation
        </div>
      )}
    </div>
  );
}