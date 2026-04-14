"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { mediaUrl, notificationsApi } from "@/lib/api";
import {
  Menu,
  X,
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

const pageTitles: Record<string, string> = {
  "/home": "Home",
  "/feed": "Feed",
  "/media": "Media",
  "/chat": "Messages",
  "/notifications": "Notifications",
  "/profile": "Profile",
  "/payments": "Payments",
  "/bookmarks": "Bookmarks",
  "/browse": "Browse",
  "/suggestions": "Suggestions",
};

const allNavItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/media", label: "Media", icon: LayoutGrid },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/suggestions", label: "Suggestions", icon: Users },
];

export default function MobileHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Resolve page title: exact match first, then prefix match
  const title =
    pageTitles[pathname] ||
    Object.entries(pageTitles).find(([key]) => pathname.startsWith(key + "/"))?.[1] ||
    "CreatorHub";

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Fetch unread notification count
  useEffect(() => {
    notificationsApi.getUnreadCount()
      .then((res: any) => {
        const count = res?.count ?? res?.unread_count ?? res?.data?.count ?? 0;
        setUnreadCount(Number(count) || 0);
      })
      .catch(() => setUnreadCount(0));
  }, [pathname]); // re-fetch when navigating

  const displayName =
    user?.display_name?.trim() || user?.full_name?.trim() || user?.username?.trim() || "User";
  const username = user?.username?.trim() || user?.email?.split("@")?.[0] || "";
  const rawAvatar = user?.avatar || user?.avatar_url || "";
  const avatarSrc = rawAvatar && typeof rawAvatar === "string" ? mediaUrl(rawAvatar) : "";
  const initials = (displayName || "U")
    .split(" ").filter(Boolean).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      {/* ── Top Header Bar ── */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14 shadow-sm">
        {/* Logo + Page Title */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-[#e8125c] to-rose-400 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-sm">C</span>
          </div>
          <span className="font-bold text-gray-900 text-base">{title}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Bell with unread badge */}
          <Link
            href="/notifications"
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-[#e8125c] rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Slide-in Drawer (from LEFT, same side as desktop sidebar) ── */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-[#e8125c] to-rose-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">C</span>
            </div>
            <span className="font-bold text-gray-900">CreatorHub</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Info */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {avatarSrc && !imageError ? (
              <img
                src={avatarSrc}
                alt={displayName}
                className="w-11 h-11 rounded-full object-cover border-2 border-pink-100"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-pink-100 text-[#e8125c] font-bold text-sm flex items-center justify-center border-2 border-pink-100">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{displayName}</p>
              <p className="text-xs text-gray-400 truncate">{username ? `@${username}` : ""}</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {allNavItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                  isActive
                    ? "bg-pink-50 text-[#e8125c] font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={20} className={isActive ? "text-[#e8125c]" : ""} />
                <span>{label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#e8125c]" />
                )}
                {/* Unread badge on Notifications item */}
                {href === "/notifications" && unreadCount > 0 && !isActive && (
                  <span className="ml-auto min-w-[18px] h-[18px] bg-[#e8125c] rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-gray-100">
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}