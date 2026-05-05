import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import LayoutShell from "@/components/LayoutShell";
import MobileOnlyGuard from "@/components/MobileOnlyGuard";

export const metadata: Metadata = {
  title: "CreatorHub",
  description: "Support your favorite creators",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <MobileOnlyGuard>
          <AuthProvider>
            <LayoutShell>{children}</LayoutShell>
          </AuthProvider>
        </MobileOnlyGuard>
      </body>
    </html>
  );
}