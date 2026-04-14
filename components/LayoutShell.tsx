"use client";

import { useAuth } from "@/lib/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./Bottomnav";
import MobileHeader from "./Mobileheder";

const PUBLIC_ROUTES = ["/login", "/register"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.replace("/login");
    }
  }, [loading, user, isPublic, router]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
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

  // ── Public routes (login / register) — no layout ──
  if (isPublic) {
    return <>{children}</>;
  }

  // ── Not authenticated yet (brief flash prevention) ──
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Desktop Sidebar: md+ only */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

        {/* Mobile header: visible on mobile only */}
        <MobileHeader />

        {/* Page content */}
        <main className="flex-1 bg-gray-50 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav: visible on mobile only */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}