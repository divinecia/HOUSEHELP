"use client";

import { useEffect, useState } from "react";

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
}

export function KeyboardShortcuts({ shortcuts }: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show help with Shift + ?
      if (e.shiftKey && e.key === "?") {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      // Process shortcuts
      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === e.ctrlKey;
        const altMatch = shortcut.alt === undefined || shortcut.alt === e.altKey;
        const shiftMatch = shortcut.shift === undefined || shortcut.shift === e.shiftKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);

  if (!showHelp) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-labelledby="keyboard-shortcuts-title"
      aria-modal="true"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="keyboard-shortcuts-title" className="text-xl font-bold">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setShowHelp(false)}
            aria-label="Close keyboard shortcuts help"
            className="hh-btn hh-btn-ghost"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b">
              <span className="text-slate-700">{shortcut.description}</span>
              <kbd className="px-3 py-1 bg-slate-100 rounded text-sm font-mono">
                {shortcut.ctrl && "Ctrl + "}
                {shortcut.alt && "Alt + "}
                {shortcut.shift && "Shift + "}
                {shortcut.key.toUpperCase()}
              </kbd>
            </div>
          ))}
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-slate-700">Show this help</span>
            <kbd className="px-3 py-1 bg-slate-100 rounded text-sm font-mono">
              Shift + ?
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
