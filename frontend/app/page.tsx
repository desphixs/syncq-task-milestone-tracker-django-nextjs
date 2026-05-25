// Import the default image loader from Next.js to handle logos or graphics securely.
import Image from "next/image";
// Import our new dedicated, server-first Header component!
import Header from "@/components/Header";

// The Home function represents the main entry page of our application.
// This is a "Server Component" by default, which means it pre-renders on the server for speed!
export default function Home() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between font-sans transition-colors duration-300">
            {/* Render the dynamically checked, high-aesthetic Header server component at the top */}
            <Header />

            {/* HERO SECTION: The core value proposition of our boilerplate */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-16 justify-center">
                {/* LEFT COLUMN: Narrative and Title */}
                <div className="flex-1 space-y-8 max-w-2xl text-center lg:text-left">
                    {/* Active indicator badge */}
                    <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-emerald-200/50 dark:border-emerald-800/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Starter Workspace Running Successfully
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.15]">
                        Modern Secure <br className="hidden sm:inline" />
                        <span className="bg-gradient-to-r from-zinc-700 to-zinc-950 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">Django + Next.js</span> Boilerplate
                    </h1>

                    <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">Welcome to your new developer home. You have successfully initialized both frameworks! This codebase is built with zero-trust cross-origin security, modern Server Actions, and secure HttpOnly cookie tracking to give you a state-of-the-art launchpad.</p>

                    {/* Quick Start Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                        <a href="/login" className="h-12 px-6 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-semibold text-sm transition-all duration-200 shadow-lg shadow-black/10 flex items-center justify-center gap-2">
                            Access Dashboard
                        </a>
                        <a href="http://localhost:8000/admin/" target="_blank" rel="noopener noreferrer" className="h-12 px-6 rounded-full border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-semibold text-sm transition-all duration-200 flex items-center justify-center">
                            Open Django Admin
                        </a>
                    </div>
                </div>

                {/* RIGHT COLUMN: Interactive Status & Project Modules Dashboard */}
                <div className="flex-1 w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-8 rounded-3xl shadow-xl shadow-zinc-100/50 dark:shadow-none space-y-6">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Workspace Blueprint</h2>

                    <div className="space-y-4">
                        {/* Status Item: Frontend */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900">
                            <div className="flex items-center gap-3.5">
                                <div className="w-8 h-8 rounded-lg bg-black dark:bg-zinc-800 flex items-center justify-center font-bold text-white text-xs">FE</div>
                                <div>
                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Next.js Frontend</h3>
                                    <p className="text-xs text-zinc-500">Port 3000</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-950">Online</span>
                        </div>

                        {/* Status Item: Backend */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900">
                            <div className="flex items-center gap-3.5">
                                <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-300 text-xs">BE</div>
                                <div>
                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Django REST API</h3>
                                    <p className="text-xs text-zinc-500">Port 8000</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-950">Configured</span>
                        </div>
                    </div>

                    {/* Boilerplate modules tracker */}
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">Included Boilerplate Components</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                                Secure JWT Cookies
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                                Google & GitHub Login
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                                Passwordless Magic Links
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                                Two-Factor OTP Codes
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                                Dark/Light Mode Themes
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                                Settings & Profile Panel
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* FOOTER: Minimal branding and documentation references */}
            <footer className="w-full max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-200/50 dark:border-zinc-800/50">
                <p>&copy; {new Date().getFullYear()} Staqed Projects. Built for learning full-stack mastery.</p>
                <p className="mt-2 sm:mt-0">Refactored to clean Server-first architecture.</p>
            </footer>
        </div>
    );
}
