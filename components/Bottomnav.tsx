"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Rss, MessageCircle, Bell, User } from "lucide-react";

const bottomNavItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {bottomNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative ${
                isActive ? "text-[#e8125c]" : "text-gray-400"
              }`}
            >
              {/* Active top indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#e8125c] rounded-full" />
              )}
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}