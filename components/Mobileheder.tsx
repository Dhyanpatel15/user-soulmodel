"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  mediaUrl,
  notificationsApi,
  userProfileApi,
  creatorRequestApi,
} from "@/lib/api";
import {
  Menu,
  X,
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
  "/feed": "Feed",
  "/media": "Media",
  "/chat": "Messages",
  "/notifications": "Notifications",
  "/profile": "Profile",
  "/payments": "Payments",
  "/bookmarks": "Bookmarks",
  "/browse": "Browse",
  "/suggestions": "Model",
};

const navItems = [
  { href: "/suggestions", label: "Model", icon: Users },
  { href: "/media", label: "Media", icon: LayoutGrid },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
];

const getDisplayName = (user: any) => {
  return (
    user?.display_name?.trim?.() ||
    user?.full_name?.trim?.() ||
    user?.name?.trim?.() ||
    user?.username?.trim?.() ||
    user?.email?.split("@")?.[0] ||
    "User"
  );
};

const getUsername = (user: any) => {
  return (
    user?.username?.trim?.() ||
    user?.user_name?.trim?.() ||
    user?.handle?.trim?.() ||
    user?.email?.split("@")?.[0] ||
    ""
  );
};

const getAvatar = (user: any) => {
  return (
    user?.avatar_url ||
    user?.avatar ||
    user?.profile_image ||
    user?.profile_picture ||
    user?.image ||
    user?.user?.avatar_url ||
    user?.user?.avatar ||
    user?.user?.profile_image ||
    user?.user?.profile_picture ||
    user?.profile?.avatar_url ||
    user?.profile?.avatar ||
    user?.profile?.profile_image ||
    user?.profile?.profile_picture ||
    ""
  );
};

export default function MobileHeader() {
  const pathname = usePathname();
  const { user, logout, loading, token } = useAuth();

  const [open, setOpen] = useState(false);
  const [sidebarUser, setSidebarUser] = useState<any>(user || null);
  const [imageError, setImageError] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title =
    pageTitles[pathname] ||
    Object.entries(pageTitles).find(([key]) =>
      pathname.startsWith(key + "/")
    )?.[1] ||
    "Soulmodel";

  useEffect(() => {
    if (user) {
      setSidebarUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const res: any = await userProfileApi.getMe();

        if (!isMounted) return;

        setSidebarUser(res);
      } catch (error) {
        if (!isMounted) return;

        if (user) {
          setSidebarUser(user);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  const displayName = useMemo(() => {
    return getDisplayName(sidebarUser);
  }, [sidebarUser]);

  const username = useMemo(() => {
    return getUsername(sidebarUser);
  }, [sidebarUser]);

  const rawAvatar = useMemo(() => {
    return getAvatar(sidebarUser);
  }, [sidebarUser]);

  const avatarSrc = useMemo(() => {
    if (!rawAvatar) return "";
    return mediaUrl(rawAvatar, true);
  }, [rawAvatar]);

  const initials = useMemo(() => {
    return (displayName || "U")
      .split(" ")
      .filter(Boolean)
      .map((word: string) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [displayName]);

  useEffect(() => {
    setImageError(false);
  }, [avatarSrc]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const fetchUnreadCount = async () => {
      try {
        const res: any = await notificationsApi.getUnreadCount();

        if (!isMounted) return;

        const count =
          res?.count ??
          res?.unread_count ??
          res?.data?.count ??
          res?.data?.unread_count ??
          0;

        setUnreadCount(Number(count) || 0);
      } catch (error) {
        if (!isMounted) return;
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();

    return () => {
      isMounted = false;
    };
  }, [pathname, token]);

  const handleBecomeCreator = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const data: any = await creatorRequestApi.becomeCreator();

      setPopupMessage(
        data?.message ||
          data?.data?.message ||
          "Your request has been sent successfully."
      );

      setShowPopup(true);
    } catch (error: any) {
      setPopupMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong. Please try again."
      );

      setShowPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setOpen(false);

    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-[#e8125c] to-rose-400 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-sm">S</span>
          </div>

          <span className="font-bold text-gray-900 text-base">{title}</span>
        </div>

        <div className="flex items-center gap-1">
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

          <button
            onClick={() => setOpen(true)}
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Slide Sidebar */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 w-72 bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out h-dvh max-h-dvh ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#e8125c] to-rose-400 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">S</span>
            </div>

            <span className="font-black text-gray-900 text-base tracking-tight">
              Soulmodel
            </span>
          </div>

          <button
            onClick={() => setOpen(false)}
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Info */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100">
          {loading && !sidebarUser ? (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {avatarSrc && !imageError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={avatarSrc}
                  src={avatarSrc}
                  alt={displayName}
                  className="w-11 h-11 rounded-full object-cover border-2 border-pink-100 flex-shrink-0 bg-pink-50"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-pink-100 text-[#e8125c] font-bold text-sm flex items-center justify-center border-2 border-pink-100 flex-shrink-0">
                  {initials}
                </div>
              )}

              <div className="overflow-hidden min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {displayName}
                </p>

                <p className="text-xs text-gray-400 truncate">
                  {username ? `@${username}` : "Complete your profile"}
                </p>
              </div>
            </Link>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            const isNotif = href === "/notifications";

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

                <span className="flex-1">{label}</span>

                {isNotif && unreadCount > 0 && (
                  <span className="min-w-[18px] h-[18px] bg-[#e8125c] rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}

                {isActive && !(isNotif && unreadCount > 0) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e8125c]" />
                )}
              </Link>
            );
          })}

          {/* Become a Creator Button After Bookmarks */}
          <button
            onClick={handleBecomeCreator}
            disabled={isSubmitting}
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-[#e8125c] text-white hover:bg-[#d10f52] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Sending..." : "Become a Creator"}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Become Creator Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
          <div className="bg-white w-[90%] max-w-sm rounded-2xl shadow-xl p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Message
            </h2>

            <p className="text-sm text-gray-600">{popupMessage}</p>

            <button
              onClick={() => setShowPopup(false)}
              type="button"
              className="mt-5 px-5 py-2 rounded-lg bg-[#e8125c] text-white text-sm font-medium hover:bg-[#d10f52] transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}