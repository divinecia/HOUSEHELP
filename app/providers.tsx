"use client";

import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import { useEffect } from "react";
import { initFirebaseAnalytics } from "@/lib/firebase";
import { swrConfig } from "@/lib/swr-config";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initFirebaseAnalytics();
  }, []);

  return (
    <SessionProvider>
      <SWRConfig value={swrConfig}>
        {children}
      </SWRConfig>
    </SessionProvider>
  );
}
