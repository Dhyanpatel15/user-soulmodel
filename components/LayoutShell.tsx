"use client";

import { useAuth } from "@/lib/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./Bottomnav";
import MobileHeader from "./Mobileheder";


// ✅ Updated public routes
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // ✅ Handle dynamic reset-password (with token)
  const isPublic =
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith("/reset-password");

  // ✅ Redirect unauthenticated users ONLY for protected routes
  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.replace("/login");
    }
  }, [loading, user, isPublic, router]);

  // ✅ Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#e8125c] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Public routes (NO layout UI) ──
  if (isPublic) {
    return <>{children}</>;
  }

  // ── Prevent flash if not authenticated ──
  if (!user) return null;

  // ── Protected layout ──
  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

        {/* Mobile Header */}
        <MobileHeader />

        {/* Page Content */}
        <main className="flex-1 bg-gray-50 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}