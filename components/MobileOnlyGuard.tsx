"use client";

import { useEffect, useState } from "react";

export default function MobileOnlyGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();

      const isMobileUA =
        /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/.test(
          userAgent
        );

      const isSmallScreen = window.innerWidth <= 768;

      const isDesktopUA =
        /windows nt|macintosh|x11|linux x86_64/.test(userAgent);

      if ((isMobileUA || isSmallScreen) && !isDesktopUA) {
        setAllowed(true);
      } else {
        setAllowed(false);
      }
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  if (allowed === null) {
    return null;
  }

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-sm text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-pink-100 flex items-center justify-center">
            <span className="text-3xl">📱</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Mobile Access Only
          </h1>

          <p className="text-gray-500 text-sm leading-6">
            This app is only available on mobile devices. Please open this
            website from your phone.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}