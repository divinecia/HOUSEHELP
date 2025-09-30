"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { initFirebaseAnalytics } from "@/lib/firebase";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initFirebaseAnalytics();
  }, []);
  return <SessionProvider>{children}</SessionProvider>;
}
