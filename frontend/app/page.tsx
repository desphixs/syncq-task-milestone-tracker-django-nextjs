// Import the Next.js image component.
import Image from "next/image";
// Import our dedicated Header component, which renders the brand navigation.
import Header from "@/components/Header";
// Import Lucide React icons to provide modern, clean visual cues.
import { Sparkles, ArrowRight, CheckCircle2, BarChart3, Search, Layers, RefreshCw, ChevronRight } from "lucide-react";

/**
 * LANDING PAGE (Home Component)
 *
 * Analogy:
 * Think of this landing page like the storefront of a physical workshop.
 * It immediately shows visitors what tools we build (projects/tasks), 
 * how clean our layout is, and guides them inside (login/register) to get to work.
 *
 * This is a React Server Component (default in Next.js app directory),
 * which loads incredibly fast because the structure is pre-rendered on the server.
 */
export default function Home() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between font-sans transition-colors duration-300">
            {/* The brand header wrapper containing Logo and auth links */}
            <Header />

            {/* Main content container with centralized layout and responsive margins */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col lg:flex-row items-center gap-16 justify-center">
                
                {/* LEFT COLUMN: Brand Narrative, Value Proposition and Call-to-Action (CTA) */}
                <div className="flex-1 space-y-8 max-w-2xl text-center lg:text-left">
                    
                    {/* Active feature/branding badge at the top */}
                    <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-indigo-100 dark:border-indigo-900/30">
                        {/* A small decorative icon representing fresh features */}
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Introducing Synced Workspace v1.0</span>
                    </div>

                    {/* Main Headline explaining the tool's goal */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
                        Keep your projects & tasks <br />
                        <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
                            in perfect sync
                        </span>
                    </h1>

                    {/* Simple description about the app's features */}
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                        Synced bridges the gap between planning and execution. Organize projects, schedule milestone tasks, filter your priorities, and monitor performance in one cohesive dashboard.
                    </p>

                    {/* CTA Action Buttons using Synced's brand indigo color */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                        {/* Primary button: redirects to the registration form */}
                        <a 
                            href="/register" 
                            className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-indigo-500/10 flex items-center justify-center gap-2 group cursor-pointer"
                        >
                            Get Started Free
                            {/* Accent chevron arrow that slides slightly to the right on button hover */}
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </a>
                        
                        {/* Secondary button: redirects to the login screen */}
                        <a 
                            href="/login" 
                            className="h-12 px-6 rounded-xl border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            Access Dashboard
                        </a>
                    </div>
                </div>

                {/* RIGHT COLUMN: Interactive High-Aesthetic Dashboard Mockup Preview */}
                <div className="flex-1 w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-8 rounded-3xl shadow-xl shadow-zinc-100/50 dark:shadow-none space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            {/* Small indicator light to represent connected status */}
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Active Workspace Demo</h2>
                        </div>
                        {/* Mock user badge indicator */}
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg">
                            demo-user
                        </span>
                    </div>

                    {/* Mock Search & Filter Bar */}
                    <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
                            <Search className="w-3.5 h-3.5" />
                            <span>Search tasks...</span>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 font-medium">
                            Priority: All
                        </div>
                    </div>

                    {/* Mock Tasks list inside preview */}
                    <div className="space-y-3.5">
                        {/* Mock Task Item 1 */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900/60">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-md border-2 border-indigo-500 flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white">Implement core authentication views</h3>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Milestone: Auth Setup</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                                High
                            </span>
                        </div>

                        {/* Mock Task Item 2 */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900/60">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-md border border-zinc-300 dark:border-zinc-700"></div>
                                <div>
                                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white">Build project analytics view</h3>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Milestone: Dashboard API</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40 px-2 py-0.5 rounded">
                                Medium
                            </span>
                        </div>
                    </div>

                    {/* Progress tracking overview inside preview card */}
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 mb-2">
                            <span>Sprints Completion Rate</span>
                            <span className="text-indigo-600 dark:text-indigo-400">82%</span>
                        </div>
                        {/* Progress bar outer channel */}
                        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            {/* Inner progress meter filling up 82% */}
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '82%' }}></div>
                        </div>
                    </div>
                </div>
            </main>

            {/* SECTION: Features Highlights overview block to guide absolute beginners */}
            <section className="bg-zinc-100/50 dark:bg-zinc-900/20 py-16 border-y border-zinc-200/50 dark:border-zinc-800/50">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
                    
                    {/* Feature 1: Workspaces */}
                    <div className="space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Workspace Boards</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Organize tasks into customizable visual boards. Move items from 'Todo' to 'Done' seamlessly and group tasks under milestones.
                        </p>
                    </div>

                    {/* Feature 2: Filters */}
                    <div className="space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30">
                            <Search className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Smart Searching & Sorts</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Query parameters perform search directly at the database level. Sort by due dates or filter by priorities instantly.
                        </p>
                    </div>

                    {/* Feature 3: Analytics */}
                    <div className="space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Integrated Analytics</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Gain absolute clarity on progress. Real-time visual metrics report active sprints, overdue tasks, and pending milestones.
                        </p>
                    </div>

                </div>
            </section>

            {/* FOOTER: copyright credentials */}
            <footer className="w-full max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-200/50 dark:border-zinc-800/50">
                <p>&copy; {new Date().getFullYear()} Synced Workspace. All rights reserved.</p>
                <p className="mt-2 sm:mt-0">Refactored to clean Server-first architecture.</p>
            </footer>
        </div>
    );
}
