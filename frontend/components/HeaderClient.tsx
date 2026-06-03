"use client";

// Import necessary React, hooks, and navigation hooks.
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom"; // Import createPortal to escape CSS stacking containment constraints!
import Link from "next/link";
import { useRouter } from "next/navigation";

// Import beautiful icons from Lucide React.
import { LogOut, LogIn, User, BookOpen, LayoutDashboard, Settings, Menu, X, UserPlus, UserCheck, Laptop, Sparkles } from "lucide-react";

// Import custom ThemeToggle and Logo components.
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";

// Import secure logout action helper.
import { logoutAction } from "@/app/actions/userauths/auth";

// Define a clear interface for navigation links to make the code highly extensible!
interface NavigationItem {
    label: string;
    href: string;
    icon: React.ComponentType<any>; // Lucide React icon component type
    isExternal?: boolean; // Whether to open in a new browser tab
    requiresAuth?: boolean; // Show only if the user is authenticated
}

// Centered desktop & mobile stacked navigation links array.
// Analogy: Think of this array like a restaurant menu board.
// Adding, removing, or renaming a dish (link) here instantly updates it everywhere!
const NAVIGATION_LINKS: NavigationItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        requiresAuth: true,
    },
];

interface HeaderClientProps {
    session: any;
}

export default function HeaderClient({ session }: HeaderClientProps) {
    const router = useRouter();
    const isLoggedIn = session && session.authenticated;

    // Filter standard navigation links dynamically based on user authentication state.
    const visibleLinks = NAVIGATION_LINKS.filter((link) => {
        // If a link requires authentication and the user is logged out, hide it from sight.
        if (link.requiresAuth && !isLoggedIn) return false;
        return true;
    });

    // State to toggle popover dropdown menu in desktop header.
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    // State to toggle mobile sliding sidebar drawer.
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // State to track if the client-side component has mounted to support React Portals safely.
    const [isMounted, setIsMounted] = useState(false);

    // Refs to support click-outside popover dismissal.
    const popoverRef = useRef<HTMLDivElement>(null);

    // Dynamic initials parser fallback for avatar graphics.
    const getInitials = (name?: string) => {
        if (!name) return "U";
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Close the popover on clicking anywhere outside the menu box and handle mount flag.
    useEffect(() => {
        setIsMounted(true); // Flag that React has safely completed initial server side hydration.
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsPopoverOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Helper handler to process client-side logout action.
    const handleLogout = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPopoverOpen(false);
        setIsMobileMenuOpen(false);
        await logoutAction();
    };

    return (
        <header className="w-full bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50 sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative">
                {/* 1. BRAND LOGO - Rendered using Logo.tsx */}
                <div className="flex items-center">
                    <Logo />
                </div>

                {/* 2. CENTERED NAVIGATION LINKS - Desktop view only */}
                {/* 
                    We render these links dynamically by looping over our "visibleLinks" array!
                    This keeps our code clean, modular, and extremely easy to scale or update.
                */}
                <div className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 gap-6 text-sm font-semibold">
                    {visibleLinks.map((link) => {
                        const Icon = link.icon;

                        // Standard hoverable class structure: dark grey on light mode (zinc-600), bold white on dark mode (zinc-400).
                        const linkClass = "flex items-center gap-1.5 text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors duration-200";

                        if (link.isExternal) {
                            return (
                                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                                    <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                    <span>{link.label}</span>
                                </a>
                            );
                        }

                        return (
                            <Link key={link.label} href={link.href} className={linkClass}>
                                <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* 3. RIGHT ZONE: AUTH ACTIONS & PROFILE CONTROLS */}
                <div className="flex items-center gap-4">
                    {isLoggedIn ? (
                        // LOGGED-IN STATE (Desktop View)
                        <div className="hidden md:block relative" ref={popoverRef}>
                            {/* Profile image trigger button */}
                            <button onClick={() => setIsPopoverOpen(!isPopoverOpen)} className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-200/50 dark:hover:bg-zinc-850 shadow-sm active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden" aria-label="Open profile menu">
                                {session.user.avatar ? <img src={session.user.avatar} alt={session.user.name || "User Avatar"} className="w-full h-full object-cover" /> : <span className="text-xs font-black text-zinc-950 dark:text-white">{getInitials(session.user.name)}</span>}
                            </button>

                            {/* Dropdown Popover box */}
                            {isPopoverOpen && (
                                <div className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xl py-2.5 text-left text-sm animate-in fade-in slide-in-from-top-1 duration-200 z-50">
                                    {/* User metadata header display */}
                                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                                        <p className="text-sm font-bold text-zinc-950 dark:text-white truncate mt-1">{session.user.name}</p>
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{session.user.email}</p>
                                    </div>

                                    {/* Navigation redirect routes */}
                                    <div className="py-1">
                                        <Link href="/dashboard" onClick={() => setIsPopoverOpen(false)} className="flex items-center gap-2.5 px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 font-semibold transition-colors">
                                            <LayoutDashboard size={16} className="text-zinc-400" />
                                            <span>Dashboard</span>
                                        </Link>
                                        <Link href="/dashboard/settings" onClick={() => setIsPopoverOpen(false)} className="flex items-center gap-2.5 px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 font-semibold transition-colors">
                                            <Settings size={16} className="text-zinc-400" />
                                            <span>Settings</span>
                                        </Link>
                                    </div>

                                    <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 my-1" />

                                    {/* Persisted Theme Controller Switcher */}
                                    <div className="flex items-center justify-between px-4 py-1.5 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                        <span>Appearance</span>
                                        <ThemeToggle />
                                    </div>

                                    <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 my-1" />

                                    {/* Action items logout */}
                                    <div className="px-2 pt-1">
                                        <form onSubmit={handleLogout}>
                                            <button type="submit" className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 font-bold transition-all duration-200 cursor-pointer text-left">
                                                <LogOut size={16} />
                                                <span>Log Out</span>
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // LOGGED-OUT STATE (Desktop View actions)
                        <div className="hidden md:flex items-center gap-3">
                            <ThemeToggle />
                            <Link href="/login" className="h-10 px-4 rounded-xl text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-900/60 font-semibold text-xs transition-all duration-200 flex items-center">
                                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                                Sign In
                            </Link>
                            <Link href="/register" className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all duration-200 flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer">
                                <UserPlus className="w-3.5 h-3.5" />
                                Sign Up
                            </Link>
                        </div>
                    )}

                    {/* MOBILE DRAWER TRIGGER HAMBURGER BUTTON */}
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-zinc-150/50 dark:hover:bg-zinc-850 shadow-sm active:scale-95" aria-label="Toggle mobile menu sidebar drawer">
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* ==================== MOBILE SLIDING SIDEBAR DRAWER MENU ==================== */}
            {/* 
                We use React Portal (createPortal) here!
                Analogy: Think of this like sending a letter directly to the mayor's office instead of slipping it under a hotel room door.
                By rendering the mobile overlay and sidebar panel directly inside "document.body",
                we completely escape the parent <header>'s backdrop-filter stacking context boundary!
                This guarantees the dark overlay overlay stretches across 100% of the screen, and the sidebar panel slides beautifully
                without being clipped or restricted by the header's static styling rules!
            */}
            {isMounted &&
                isMobileMenuOpen &&
                typeof window !== "undefined" &&
                createPortal(
                    <>
                        {/* Dark overlay backdrop layer with smooth transition entry */}
                        <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[9998] animate-in fade-in duration-300" />

                        {/* Sliding sidebar container menu panel with full height, clean custom border, and high depth drop shadow */}
                        <div className="fixed top-0 right-0 h-screen w-80 max-w-[85vw] bg-white dark:bg-zinc-950 border-l border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl z-[9999] p-6 flex flex-col justify-between animate-in slide-in-from-right duration-300">
                            <div className="space-y-8">
                                {/* Mobile drawer header containing brand Logo and close trigger button */}
                                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900">
                                    <Logo />
                                    <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer active:scale-95 transition-all" aria-label="Close mobile menu sidebar">
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Dynamic User Profile identity card display (renders only when authenticated) */}
                                {isLoggedIn && (
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-950 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden">{session.user.avatar ? <img src={session.user.avatar} alt={session.user.name} className="w-full h-full object-cover" /> : <span className="text-xs font-black text-white">{getInitials(session.user.name)}</span>}</div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-zinc-950 dark:text-white truncate">{session.user.name}</p>
                                            <p className="text-xs text-zinc-500 truncate mt-0.5">{session.user.email}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Stacked mobile redirection links navigation block */}
                                {/* 
                                We loop over our "visibleLinks" array here too! 
                                This makes editing links a breeze since changes inside the "NAVIGATION_LINKS" array automatically propagate here!
                            */}
                                <nav className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-2.5 mb-1">Navigation</span>
                                    {visibleLinks.map((link) => {
                                        const Icon = link.icon;

                                        // Standard Tailwind color structure to keep link visible:
                                        // Light Mode: text-zinc-600 (dark grey), black on hover (hover:text-zinc-950), subtle light-grey background on hover.
                                        // Dark Mode: text-zinc-400 (light grey), white on hover (dark:hover:text-white), subtle dark-grey background on hover.
                                        const linkClass = "flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/50 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900/60 text-sm font-semibold transition-all duration-200 cursor-pointer";

                                        if (link.isExternal) {
                                            return (
                                                <a key={link.label} href={link.href} onClick={() => setIsMobileMenuOpen(false)} target="_blank" rel="noopener noreferrer" className={linkClass}>
                                                    <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                                    <span>{link.label}</span>
                                                </a>
                                            );
                                        }

                                        return (
                                            <Link key={link.label} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={linkClass}>
                                                <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                                <span>{link.label}</span>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>

                            {/* Mobile bottom actions panel (includes Appearance theme controls and Auth redirect/logout hooks) */}
                            <div className="space-y-6 pt-6 border-t border-zinc-150 dark:border-zinc-900">
                                {/* Interactive Theme Toggle section */}
                                <div className="flex items-center justify-between px-2 text-xs font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">
                                    <span>Appearance</span>
                                    <ThemeToggle />
                                </div>

                                {isLoggedIn ? (
                                    <form onSubmit={handleLogout} className="w-full">
                                        <button type="submit" className="w-full h-12 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-red-100 dark:border-red-900/30">
                                            <LogOut size={16} />
                                            <span>Log Out Session</span>
                                        </button>
                                    </form>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full h-12 rounded-xl text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1.5">
                                            <LogIn className="w-3.5 h-3.5" />
                                            <span>Sign In</span>
                                        </Link>
                                        <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md">
                                            <UserPlus className="w-3.5 h-3.5" />
                                            <span>Sign Up Free</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>,
                    document.body,
                )}
        </header>
    );
}
