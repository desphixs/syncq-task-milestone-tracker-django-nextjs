'use client';

// Import React hooks for managing state and running side-effects on component mount.
import React, { useState, useEffect } from 'react';
// Import Next.js Link component for client-side routing between dashboard views.
import Link from 'next/link';
// Import DashboardWrapper layout which provides the sidebar navigation and header controls.
import DashboardWrapper from '@/components/dashboard/DashboardWrapper';
// Import Lucide React icons for modern, visual designs.
import { 
  TrendingUp, AlertTriangle, CheckSquare, Layers, 
  Clock, ShieldAlert, Loader2, ShieldCheck, ArrowRight
} from 'lucide-react';
// Import the Server Action to securely retrieve analytics metrics from Django.
import { getAnalyticsAction, AnalyticsData } from '@/app/actions/tracker/analytics';
// Import Sonner toast for alert messaging.
import { toast } from 'sonner';

export default function AnalyticsDashboardPage() {
  // 1. State for storing aggregated analytics data fetched from the Django database.
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  
  // 2. Loading state to display animated skeleton grids during data fetch.
  const [isLoading, setIsLoading] = useState(true);

  // 3. Effect hook to pull metrics from our Server Action on component mount.
  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      
      // Execute the server action function which queries the backend /tracker/analytics/ endpoint.
      const result = await getAnalyticsAction();
      
      if (result.success && result.data) {
        // Save the received analytics dataset in state.
        setAnalytics(result.data);
      } else {
        // Expose a toast warning if authorization fails or the backend is offline.
        toast.error(result.message || "Failed to load productivity metrics.");
      }
      setIsLoading(false);
    }
    
    loadAnalytics();
  }, []);

  // Display a full-page animated spinner while the analytics are initially loading.
  if (isLoading) {
    return (
      <DashboardWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-900 dark:text-white" />
          <p className="text-xs text-zinc-500 font-bold">Assembling your productivity reports...</p>
        </div>
      </DashboardWrapper>
    );
  }

  // If no data exists, display an elegant placeholder state to guide the user.
  if (!analytics) {
    return (
      <DashboardWrapper>
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-950 dark:text-white">Unable to compile analytics</h3>
            <p className="text-sm text-zinc-500 mt-1 max-w-sm">
              We couldn't retrieve your workspace statistics. Please verify that your backend Django server is online and you are logged in.
            </p>
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  // Calculate pending tasks dynamically: To Do + Doing tasks count.
  const pendingTasks = analytics.status_breakdown.todo + analytics.status_breakdown.doing;

  return (
    <DashboardWrapper>
      <div className="space-y-8 animate-in fade-in duration-300 font-sans">
        
        {/* ============================================================================== */}
        {/* PAGE HEADER */}
        {/* ============================================================================== */}
        <div>
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <TrendingUp size={18} className="text-zinc-900 dark:text-white" />
            <span className="text-xs font-bold uppercase tracking-wider">Performance Center</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white mt-1">
            Productivity Analytics
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            A secure overview of active projects, priority tasks, and upcoming milestones.
          </p>
        </div>

        {/* ============================================================================== */}
        {/* METRICS HEADER GRID */}
        {/* ============================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card: Active Workspaces */}
          <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Active Projects
              </span>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                <Layers size={16} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-950 dark:text-white leading-none">
                {analytics.total_projects}
              </h2>
              <p className="text-[10px] text-zinc-400 mt-1">Active workspaces owned by you</p>
            </div>
          </div>

          {/* Card: Pending Tasks */}
          <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-amber-505 uppercase tracking-wider">
                Pending Tasks
              </span>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                <Clock size={16} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-950 dark:text-white leading-none">
                {pendingTasks}
              </h2>
              <p className="text-[10px] text-zinc-400 mt-1">Tasks in To Do or Doing state</p>
            </div>
          </div>

          {/* Card: Completed Milestones */}
          <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">
                Milestones Reached
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                <CheckSquare size={16} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-950 dark:text-white leading-none">
                {analytics.status_breakdown.done}
              </h2>
              <p className="text-[10px] text-zinc-400 mt-1">Tasks successfully completed</p>
            </div>
          </div>

          {/* Card: Urgent Deadlines */}
          <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">
                Urgent Deadlines
              </span>
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-950 dark:text-white leading-none">
                {analytics.due_next_7_days}
              </h2>
              <p className="text-[10px] text-zinc-400 mt-1">Incomplete tasks due in next 7 days</p>
            </div>
          </div>

        </div>

        {/* ============================================================================== */}
        {/* TASK PRIORITIES & OVERDUE SECTION */}
        {/* ============================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card: Priority Breakdown */}
          <div className="lg:col-span-1 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 space-y-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-black text-zinc-950 dark:text-white">Task Priorities</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Distribution of tasks by urgency level</p>
            </div>
            
            <div className="space-y-4 py-4">
              {/* High Priority Row */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-505" />
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400">High Urgency</span>
                </div>
                <span className="text-sm font-black text-rose-900 dark:text-rose-300">
                  {analytics.priority_breakdown.high}
                </span>
              </div>

              {/* Medium Priority Row */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-505" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Medium Urgency</span>
                </div>
                <span className="text-sm font-black text-amber-900 dark:text-amber-300">
                  {analytics.priority_breakdown.medium}
                </span>
              </div>

              {/* Low Priority Row */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-505" />
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Low Urgency</span>
                </div>
                <span className="text-sm font-black text-indigo-900 dark:text-indigo-300">
                  {analytics.priority_breakdown.low}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-zinc-400 text-center pt-2 border-t border-zinc-150 dark:border-zinc-850">
              Total aggregated tasks: {analytics.total_tasks}
            </div>
          </div>

          {/* Card: Overdue Warnings & Milestones */}
          <div className="lg:col-span-2 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-black text-zinc-950 dark:text-white">Overdue Milestones & Warnings</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Tasks that have missed their due date</p>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 py-1">
              {analytics.overdue_tasks_list && analytics.overdue_tasks_list.length > 0 ? (
                analytics.overdue_tasks_list.map((task: any) => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-850 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.01)] hover:border-rose-250 dark:hover:border-rose-900/30 transition-all duration-300"
                  >
                    <div className="flex items-start gap-3 overflow-hidden">
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 mt-0.5 shrink-0">
                        <AlertTriangle size={14} />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {task.title}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                          Project: {task.project_title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-md">
                        {task.priority}
                      </span>
                      <div className="text-[10px] font-bold text-rose-500">
                        Overdue {task.due_date}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center space-y-2">
                  <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white">All milestones on track</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">No incomplete tasks are past their due dates.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between text-[10px] text-zinc-400 mt-auto">
              <span>Overdue counter: {analytics.overdue_tasks}</span>
              <Link
                href="/dashboard"
                className="font-bold text-zinc-900 dark:text-white hover:opacity-80 transition-opacity flex items-center gap-1"
              >
                <span>Open Workspaces</span>
                <ArrowRight size={10} />
              </Link>
            </div>
          </div>

        </div>

        {/* ============================================================================== */}
        {/* DATA ISOLATION & PRIVACY POLICY CARD */}
        {/* ============================================================================== */}
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/10 p-5 flex items-start gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
              Secure Data Isolation
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              These productivity statistics and project metrics are compiled dynamically using secure relational database aggregation. Only you can view this data, ensuring your personal tasks, timelines, and credentials remain private and isolated.
            </p>
          </div>
        </div>

      </div>
    </DashboardWrapper>
  );
}
