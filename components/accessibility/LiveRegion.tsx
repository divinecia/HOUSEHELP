"use client";

import { useEffect, useRef } from "react";

interface LiveRegionProps {
  message: string;
  politeness?: "polite" | "assertive" | "off";
  clearAfter?: number;
}

export function LiveRegion({
  message,
  politeness = "polite",
  clearAfter = 3000
}: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && clearAfter > 0) {
      const timer = setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = "";
        }
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      ref={regionRef}
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="aria-live-region"
    >
      {message}
    </div>
  );
}
