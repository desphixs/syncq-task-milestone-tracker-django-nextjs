import React from "react";
// Import Link from Next.js to allow navigation back to the homepage.
import Link from "next/link";

/**
 * BRAND LOGO COMPONENT
 *
 * Analogy:
 * Think of this like the main glowing emblem at the top of our workspace.
 * It houses the Synced image icon and brand name, and links guests back
 * to the landing homepage whenever clicked.
 */
export default function Logo() {
    return (
        <Link href="/" className="flex items-center gap-2.5 group">
            {/* Logo container wrapper styling with a subtle border and background using Synced's custom indigo brand colors */}
            <div className="relative w-8 h-8 flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/40 rounded-xl p-1.5 transition-all duration-200 group-hover:scale-105 border border-indigo-100 dark:border-indigo-900/30">
                {/* Synced brand icon from the specified URL */}
                <img
                    src="https://cdn-icons-png.flaticon.com/128/11243/11243780.png"
                    alt="Synced Logo"
                    className="w-full h-full object-contain"
                />
            </div>
            {/* Brand title text with bold weight and tight tracking */}
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white transition-colors duration-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                Synced
            </span>
        </Link>
    );
}

