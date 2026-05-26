"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { saveThemeAction } from "@/app/actions/auth";
import { toast } from "sonner";

/**
 * THEME TOGGLE SWITCHER
 * 
 * Analogy:
 * Think of this toggle like a physical light switch placed on the wall of our office lobby.
 * When clicked:
 * 1. It flips the room lighting immediately (local client-side theme transition).
 * 2. It sends a message to the central building database via an async Server Action to record
 *    your new lighting preference so that next time you enter, the room matches your choice instantly!
 * 
 * It handles hydration matching: because the server cannot know the user's theme choice ahead of time,
 * this component remains hidden or renders a simple placeholder until it has officially mounted on the client browser.
 */
export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Mount check prevents hydration mismatch errors from server-to-client structural mismatches.
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200/40 dark:border-zinc-800/40 animate-pulse" />
    );
  }

  // Detect resolved state to display the appropriate icon representation
  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    const nextTheme = isDark ? "light" : "dark";
    
    // 1. Instantly trigger visual local state update for top-tier UX response speed.
    setTheme(nextTheme);

    // 2. Perform background server action syncing to persist the theme in user's profile context.
    startTransition(async () => {
      try {
        const result = await saveThemeAction(nextTheme);
        if (result && !result.success) {
          console.warn("Theme persistence sync deferred:", result.message);
        }
      } catch (err) {
        console.error("Theme background sync network error:", err);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 cursor-pointer flex items-center justify-center transition-all duration-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 shadow-sm active:scale-95 disabled:opacity-50"
      aria-label="Toggle theme mode"
    >
      {isDark ? (
        <Sun size={18} className="text-white transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon size={18} className="text-black transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
}
