'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
// Import our clean icons from lucide-react to design our layout menus.
import { 
  Menu, LayoutDashboard, Settings, LogOut, ChevronLeft, 
  Milestone, Users, User, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';

interface DashboardWrapperProps {
  children: React.ReactNode;
}

/**
 * DASHBOARD WORKSPACE WRAPPER
 * 
 * Analogy:
 * Think of this layout component like the master scaffolding of a premium office building.
 * It provides:
 * 1. The structural corridors (collapsible sidebar for desktops).
 * 2. The dynamic entrance gates (slide-up bottom-anchored menu drawer for mobile users).
 * 3. The lighting control switch (self-contained dark/light mode toggler).
 * 4. The main workspace rooms (the active child pages like Overview or Settings).
 */
export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Desktop Collapsible Sidebar State (true = expanded width 64, false = collapsed width 20)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Mobile Slide-up Bottom-anchored Menu Drawer State (true = open, false = closed)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);



  // Trigger secure redirection to our login screen upon user checkout.
  const handleLogout = () => {
    // For now, in this UI mock task, we trigger redirect to login.
    router.push('/login');
  };

  // Navigational items list inside our layout sidebar.
  const navItems = useMemo(() => [
    { label: 'Overview', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Profile', href: '/dashboard/profile', icon: <User size={20} /> },
  ], []);

  // Footer utility links.
  const footerItems = useMemo(() => [
    { label: 'Settings', href: '/dashboard/settings', icon: <Settings size={20} /> },
  ], []);

  return (
    <div className="flex min-h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 font-sans">
      
      {/* ============================================================================== */}
      {/* DESKTOP COLLAPSIBLE SIDEBAR */}
      {/* ============================================================================== */}
      <aside
        className={cn(
          "hidden lg:flex flex-col sticky top-0 h-screen border-r border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 transition-all duration-300 overflow-hidden z-20",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800/80">
          {isSidebarOpen ? <Logo /> : <div className="w-8" />}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors"
          >
            <ChevronLeft className={cn("transition-transform duration-300", !isSidebarOpen && "rotate-180")} size={16} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => (
            <NavItem 
              key={item.href} 
              {...item} 
              active={pathname === item.href} 
              isCollapsed={!isSidebarOpen} 
            />
          ))}
        </nav>

        {/* Footer controls: Settings, Theme switch, Logout */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 space-y-1">
          {footerItems.map((item) => (
            <NavItem 
              key={item.href} 
              {...item} 
              active={pathname === item.href} 
              isCollapsed={!isSidebarOpen} 
            />
          ))}
          


          {/* Checkout exit button */}
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ============================================================================== */}
      {/* MAIN CONTAINER WORKSPACE */}
      {/* ============================================================================== */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        
        {/* Universal Top Header */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile menu trigger button */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-400 dark:text-zinc-500 uppercase">
              Dashboard Workspace
            </h2>
          </div>

          {/* User badge */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Destiny Frank</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Pro Member</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold text-xs shadow-md border border-zinc-200 dark:border-zinc-800">
              DF
            </div>
          </div>
        </header>

        {/* Primary viewport body */}
        <main className="flex-1 p-6 lg:p-8 animate-in fade-in duration-300">
          {children}
        </main>
      </div>

      {/* ============================================================================== */}
      {/* MOBILE BOTTOM MENU BAR */}
      {/* ============================================================================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-lg flex items-center justify-around px-4 z-30 shadow-lg">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all",
                isActive 
                  ? "text-black dark:text-white font-bold" 
                  : "text-zinc-400 dark:text-zinc-500"
              )}
            >
              {item.icon}
              <span className="text-[9px] mt-1 font-bold">{item.label}</span>
            </Link>
          );
        })}
        {/* Settings shortcut button */}
        <Link 
          href="/dashboard/settings"
          className={cn(
            "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all",
            pathname === "/dashboard/settings" 
              ? "text-black dark:text-white font-bold" 
              : "text-zinc-400 dark:text-zinc-500"
          )}
        >
          <Settings size={20} />
          <span className="text-[9px] mt-1 font-bold">Settings</span>
        </Link>
        {/* Sidebar Trigger menu */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-zinc-400 dark:text-zinc-500 cursor-pointer"
        >
          <Menu size={20} />
          <span className="text-[9px] mt-1 font-bold">Menu</span>
        </button>
      </div>

      {/* ============================================================================== */}
      {/* MOBILE SLIDE-UP BOTTOM MENU DRAWER */}
      {/* ============================================================================== */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Blackout overlay curtain */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300"
          />
          {/* Slide-up sheet content */}
          <div className="relative bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-t-3xl p-6 space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Horizontal handle card */}
            <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto -mt-2" />
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pt-2">
              <Logo />
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation links */}
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavItem 
                  key={item.href} 
                  {...item} 
                  active={pathname === item.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
              {footerItems.map((item) => (
                <NavItem 
                  key={item.href} 
                  {...item} 
                  active={pathname === item.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
            </div>

            {/* Bottom utility controls */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-2">


              {/* Mobile logout exit */}
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-sm font-bold text-red-500 hover:bg-red-100 dark:hover:bg-red-950/30 transition-all cursor-pointer"
              >
                <LogOut size={20} />
                <span>Logout Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, href, active, isCollapsed, onClick }: NavItemProps) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group relative cursor-pointer", 
        active 
          ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md" 
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
      )}
    >
      <span className={cn("shrink-0", active ? "text-inherit" : "group-hover:text-black dark:group-hover:text-white")}>
        {icon}
      </span>
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
