"use client";

import { useEffect, useState } from "react";
import { notificationsApi, mediaUrl } from "@/lib/api";
import {
  Heart,
  UserPlus,
  DollarSign,
  MessageCircle,
  Bell,
} from "lucide-react";
import Spinner from "@/components/Spinner";

type NotificationItem = {
  id: string | number;
  type?: string;
  text?: string;
  is_read?: boolean;
  action_url?: string;
  sender?: {
    id?: string | number;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  metadata?: Record<string, any>;
  created_at?: string | null;
};

const PAGE_LIMIT = 20;

const iconMap: Record<string, { icon: any; color: string }> = {
  like: { icon: Heart, color: "bg-red-100 text-red-500" },
  post_liked: { icon: Heart, color: "bg-red-100 text-red-500" },

  follow: { icon: UserPlus, color: "bg-blue-100 text-blue-500" },

  subscribe: { icon: UserPlus, color: "bg-purple-100 text-purple-500" },
  subscribed: { icon: UserPlus, color: "bg-purple-100 text-purple-500" },
  subscription: { icon: UserPlus, color: "bg-purple-100 text-purple-500" },
  new_subscriber: { icon: UserPlus, color: "bg-purple-100 text-purple-500" },
  new_subscription: { icon: UserPlus, color: "bg-purple-100 text-purple-500" },
  creator_subscribed: { icon: UserPlus, color: "bg-purple-100 text-purple-500" },

  tip: { icon: DollarSign, color: "bg-green-100 text-green-500" },
  tip_received: { icon: DollarSign, color: "bg-green-100 text-green-500" },
  gift_received: { icon: DollarSign, color: "bg-green-100 text-green-500" },

  message: { icon: MessageCircle, color: "bg-indigo-100 text-indigo-500" },
  new_message: { icon: MessageCircle, color: "bg-indigo-100 text-indigo-500" },

  comment: { icon: MessageCircle, color: "bg-orange-100 text-orange-500" },

  default: { icon: Bell, color: "bg-gray-100 text-gray-500" },
};

function timeAgo(d?: string | null) {
  if (!d) return "";
  const ts = new Date(d).getTime();
  if (Number.isNaN(ts)) return "";

  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

function SenderAvatar({ notification }: { notification: NotificationItem }) {
  const avatar = notification.sender?.avatar_url;
  const senderName =
    notification.sender?.display_name ||
    notification.sender?.username ||
    "U";

  if (avatar) {
    return (
      <img
        src={mediaUrl(avatar)}
        alt={senderName}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {senderName.charAt(0).toUpperCase()}
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const loadNotifications = async (nextOffset = 0, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError("");
      }

      const response = await notificationsApi.getNotifications(
        PAGE_LIMIT,
        nextOffset
      );

      console.log("notifications response:", response);

      const items = Array.isArray(response?.data) ? response.data : [];
      const more = Boolean(response?.pagination?.has_more);

      setNotifications((prev) => {
        if (!append) return items;

        const merged = [...prev, ...items];
        const unique = merged.filter(
          (item, index, self) =>
            index === self.findIndex((x) => String(x.id) === String(item.id))
        );
        return unique;
      });

      setHasMore(more);
      setOffset(nextOffset);
    } catch (err: any) {
      console.error("Failed to load notifications:", err);
      setError(err?.message || "Failed to load notifications");
      if (!append) {
        setNotifications([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadNotifications(0, false);

    const interval = setInterval(() => {
      loadNotifications(0, false);
    }, 15000);

    const handleFocus = () => {
      loadNotifications(0, false);
    };

    const handleRefresh = () => {
      loadNotifications(0, false);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("notifications:refresh", handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("notifications:refresh", handleRefresh);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await notificationsApi.markAllRead();

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
        }))
      );
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.is_read && notification.id) {
      try {
        await notificationsApi.markRead(notification.id);

        setNotifications((prev) =>
          prev.map((n) =>
            String(n.id) === String(notification.id)
              ? { ...n, is_read: true }
              : n
          )
        );
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }

    if (notification.action_url && notification.action_url.trim()) {
      window.location.href = notification.action_url;
    }
  };

  const handleLoadMore = async () => {
    await loadNotifications(offset + PAGE_LIMIT, true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-sm text-[#e8125c] font-medium hover:underline disabled:opacity-50"
          >
            {markingAll ? "Marking..." : "Mark all read"}
          </button>
        )}
      </div>

      <p className="text-gray-500 text-sm mb-8">
        {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
      </p>

      {loading ? (
        <Spinner text="Loading notifications..." />
      ) : error ? (
        <div className="text-center py-20">
          <Bell size={48} className="mx-auto mb-4 text-red-200" />
          <p className="text-red-500 font-medium">Failed to load notifications</p>
          <p className="text-sm text-gray-400 mt-1">{error}</p>
          <button
            onClick={() => loadNotifications(0, false)}
            className="mt-4 px-4 py-2 rounded-lg bg-[#e8125c] text-white text-sm font-medium"
          >
            Try again
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400">No notifications yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((n) => {
              const type = n.type || "default";
              const { icon: Icon, color } = iconMap[type] || iconMap.default;
              const isRead = Boolean(n.is_read);
              const senderName =
                n.sender?.display_name || n.sender?.username || "";
              const message =
                n.text ||
                n.metadata?.message ||
                n.metadata?.title ||
                type.replace(/_/g, " ");
              const createdAt = n.created_at;

              return (
                <button
                  key={String(n.id)}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
                    !isRead
                      ? "bg-pink-50 border-pink-100"
                      : "bg-white border-gray-100"
                  } ${
                    n.action_url ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <SenderAvatar notification={n} />
                    <div
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${color} border border-white`}
                    >
                      <Icon size={12} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      {senderName ? (
                        <>
                          <span className="font-semibold">{senderName} </span>
                          <span className="text-gray-500">{message}</span>
                        </>
                      ) : (
                        <span className="text-gray-500">{message}</span>
                      )}
                    </p>

                    <p className="text-xs text-gray-400 mt-0.5">
                      {timeAgo(createdAt)}
                    </p>
                  </div>

                  {!isRead && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#e8125c] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {hasMore && (
            <div className="pt-6 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}