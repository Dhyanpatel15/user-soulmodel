"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { mediaUrl, notificationsApi } from "@/lib/api";
import {
  Home,
  Rss,
  LayoutGrid,
  MessageCircle,
  Bell,
  User,
  CreditCard,
  Bookmark,
  LogOut,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/suggestions", label: "Model", icon: Users },
  { href: "/media", label: "Media", icon: LayoutGrid },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const displayName = useMemo(() => (
    user?.display_name?.trim() || user?.full_name?.trim() ||
    user?.username?.trim() || user?.email?.split("@")?.[0] || "User"
  ), [user]);

  const username = useMemo(() => (
    user?.username?.trim() || user?.email?.split("@")?.[0] || ""
  ), [user]);

  const rawAvatar = useMemo(() => user?.avatar || user?.avatar_url || "", [user]);
  const avatarSrc = useMemo(() => (rawAvatar ? mediaUrl(rawAvatar, true) : ""), [rawAvatar]);
  const initials = useMemo(() => (
    (displayName || "U").split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2)
  ), [displayName]);

  useEffect(() => { setImageError(false); }, [avatarSrc]);

  useEffect(() => {
    notificationsApi.getUnreadCount()
      .then((res: any) => {
        const count = res?.count ?? res?.unread_count ?? res?.data?.count ?? 0;
        setUnreadCount(Number(count) || 0);
      })
      .catch(() => setUnreadCount(0));
  }, [pathname]);

  return (
    <aside className="w-64 fixed top-0 left-0 h-screen bg-white border-r border-gray-100 flex flex-col z-50 shadow-sm">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-[#e8125c] to-rose-400 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
          <span className="text-white font-black text-sm">C</span>
        </div>
        <span className="font-black text-gray-900 text-base tracking-tight">CreatorHub</span>
      </div>

      {/* User Profile */}
      <div className="px-5 py-4 border-b border-gray-100">
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {avatarSrc && !imageError ? (
              <img
                key={avatarSrc}
                src={avatarSrc}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover border-2 border-pink-100 flex-shrink-0"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-pink-100 text-[#e8125c] font-bold text-sm flex items-center justify-center border-2 border-pink-100 flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="overflow-hidden min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{displayName}</p>
              <p className="text-xs text-gray-400 truncate">{username ? `@${username}` : ""}</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const isNotif = href === "/notifications";

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                isActive
                  ? "bg-pink-50 text-[#e8125c] font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={19} className={isActive ? "text-[#e8125c]" : ""} />
              <span className="flex-1">{label}</span>

              {/* Notification unread badge */}
              {isNotif && unreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] bg-[#e8125c] rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}

              {/* Active dot (only when no badge) */}
              {isActive && !(isNotif && unreadCount > 0) && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#e8125c]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}