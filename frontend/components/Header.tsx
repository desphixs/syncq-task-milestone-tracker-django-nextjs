// Instruct React and Next.js that this file is a Server Component.
// This ensures that session-sniffing and cookies verification happen securely on the server!
import Link from "next/link";

// Import our custom data access layer helper to safely sniff out if the user has an active session.
import { verifySession } from "@/data-access/auth";

// Import our secure server-side logout action that deletes cookies and performs clean routing.
import { logoutAction } from "@/app/actions/auth";

// Import beautiful icons from Lucide React to create a highly aesthetic, premium look.
import { LogOut, LogIn, User, BookOpen, GraduationCap, LayoutDashboard } from "lucide-react";

// Import our custom premium ThemeToggle switcher component.
import ThemeToggle from "@/components/ThemeToggle";

/**
 * HEADER COMPONENT (Server Component)
 *
 * Analogy:
 * Think of this Header like a smart concierge at a hotel lobby desk.
 * When a visitor approaches, the concierge immediately checks the secure registration registry
 * (using verifySession) to see if they are a registered guest (logged in) or a walk-in visitor.
 * - If they are a registered guest: The concierge greets them by name and displays a logout button.
 * - If they are a walk-in visitor: The concierge politely displays a direct sign-in key card button.
 *
 * Because it's a Server Component, all of this checking happens BEFORE the page is even sent to the
 * browser, resulting in a lightning-fast load with zero "layout flashes" or flickering loading states!
 */
export default async function Header() {
    // 1. Fetch the user session status from the secure Data Access Layer (DAL).
    const session = await verifySession();

    // 2. Check if the user is authenticated based on the session response.
    const isLoggedIn = session && session.authenticated;

    return (
        <header className="w-full bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50 sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* BRAND LOGO: Leads back to the home/dashboard landing page */}
                <Link href="/" className="flex items-center gap-3 group transition-transform active:scale-98">
                    {/* Dynamic logo graphic with subtle shadow */}
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold text-xl shadow-md transition-all duration-200 group-hover:shadow-lg group-hover:rotate-3">A</div>
                    <span className="font-semibold text-lg text-zinc-900 dark:text-zinc-50 tracking-tight group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">AuthForge</span>
                </Link>

                {/* NAVIGATION & ACTION ZONE */}
                <nav className="flex items-center gap-6">
                    {/* Educational Links: Shown to all users to navigate the sandbox environment */}
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        <a href="http://127.0.0.1:8000/api/docs/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                            <BookOpen className="w-4 h-4 text-zinc-400" />
                            API Documentation
                        </a>
                        {isLoggedIn && (
                            <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                                <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                                Dashboard
                            </Link>
                        )}
                    </div>

                    {/* DYNAMIC AUTHENTICATION ACTION STATUS */}
                    <div className="flex items-center gap-4 pl-4 border-l border-zinc-200 dark:border-zinc-800">
                        <ThemeToggle />
                        {isLoggedIn ? (
                            // RENDER SIGNED-IN STATE: If the session is authenticated, display welcome + Logout Action
                            <div className="flex items-center gap-4">
                                {/* Welcome message with a tiny premium avatar layout */}
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50">
                                    <div className="w-5 h-5 rounded-full bg-zinc-950 dark:bg-zinc-50 flex items-center justify-center">
                                        <User className="w-3 h-3 text-zinc-50 dark:text-zinc-950" />
                                    </div>
                                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Welcome, {session.user.name || "Developer"}</span>
                                </div>

                                {/* Zero-Client Interactive Logout Form. 
                                    Using a form action calling our Server Action executes cookie deletions securely
                                    without requiring the entire component to load Client Hooks or extra client-side state! */}
                                <form action={logoutAction}>
                                    <button type="submit" className="h-10 px-4 rounded-xl bg-zinc-100 hover:bg-red-50 dark:bg-zinc-900 dark:hover:bg-red-950/20 text-zinc-700 hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-400 border border-zinc-200/60 hover:border-red-200/60 dark:border-zinc-800/60 dark:hover:border-red-900/30 font-semibold text-xs transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm active:scale-95">
                                        <LogOut className="w-3.5 h-3.5" />
                                        Logout
                                    </button>
                                </form>
                            </div>
                        ) : (
                            // RENDER SIGNED-OUT STATE: If the user is unauthenticated, render a link to access registration / login
                            <Link href="/login" className="h-10 px-5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-98">
                                <LogIn className="w-3.5 h-3.5" />
                                Sign In
                            </Link>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
}
