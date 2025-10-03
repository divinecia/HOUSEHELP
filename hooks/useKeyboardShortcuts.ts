"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcuts (Alt + key)
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "h":
            // Alt + H: Go home
            e.preventDefault();
            router.push("/");
            break;
          case "d":
            // Alt + D: Go to dashboard (contextual)
            e.preventDefault();
            const path = window.location.pathname;
            if (path.includes("/worker")) {
              router.push("/worker/dashboard");
            } else if (path.includes("/household")) {
              router.push("/household/dashboard");
            } else if (path.includes("/admin")) {
              router.push("/admin/dashboard");
            }
            break;
          case "s":
            // Alt + S: Focus search (if exists)
            e.preventDefault();
            const searchInput = document.querySelector<HTMLInputElement>(
              'input[type="search"], input[placeholder*="Search" i]'
            );
            searchInput?.focus();
            break;
          case "n":
            // Alt + N: Go to notifications
            e.preventDefault();
            const currentPath = window.location.pathname;
            if (currentPath.includes("/worker")) {
              router.push("/worker/notifications");
            } else if (currentPath.includes("/household")) {
              router.push("/household/notifications");
            }
            break;
          case "m":
            // Alt + M: Go to messages
            e.preventDefault();
            const currentRoute = window.location.pathname;
            if (currentRoute.includes("/worker")) {
              router.push("/worker/messages");
            } else if (currentRoute.includes("/household")) {
              router.push("/household/messages");
            }
            break;
        }
      }

      // Escape to close modals/dialogs
      if (e.key === "Escape") {
        const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (modal) {
          const closeButton = modal.querySelector<HTMLButtonElement>(
            'button[aria-label*="Close" i]'
          );
          closeButton?.click();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}
