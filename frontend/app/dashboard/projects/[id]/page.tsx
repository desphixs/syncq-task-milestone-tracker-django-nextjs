'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardWrapper from '@/components/dashboard/DashboardWrapper';
// Import Lucide React icons to provide modern visual cues.
import { 
  ArrowLeft, CheckCircle2, Clock, Calendar, 
  Settings, Loader2, AlertCircle, LayoutGrid, CheckSquare
} from 'lucide-react';
import { getProjectDetailAction } from '@/app/actions/tracker/projects';

// Define the Project typescript interface structure.
// This matches the exact dynamic calculated statistics returned by our Django REST API backend!
interface ProjectDetail {
  id: number;
  owner: number;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // In Next.js 15, dynamic route parameters are Promise objects.
  // We must unwrap this promise using React.use() before we can safely access its properties!
  const resolvedParams = React.use(params);
  const projectId = resolvedParams.id;

  // State to hold the retrieved project details and computed milestones.
  const [project, setProject] = useState<ProjectDetail | null>(null);
  
  // State to track whether the API request is currently loading.
  const [isLoading, setIsLoading] = useState(true);

  // State to store any authorization or database error messages.
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dynamic width state to drive our smooth horizontal milestone progress bar micro-animation!
  const [progressWidth, setProgressWidth] = useState(0);

  // Effect hook to fetch project details from our Next.js Server Action on component mount.
  useEffect(() => {
    async function loadProjectDetails() {
      setIsLoading(true);
      setErrorMsg(null);
      
      // Dispatch the server action to securely pull data from the Django database views.
      const result = await getProjectDetailAction(projectId);
      
      if (result.success && result.project) {
        setProject(result.project);
      } else {
        // Set error message if the workspace doesn't exist or belongs to another user.
        setErrorMsg(result.message || "Failed to load project details.");
      }
      setIsLoading(false);
    }
    
    if (projectId) {
      loadProjectDetails();
    }
  }, [projectId]);

  // Trigger our smooth progress bar animation once the project is successfully loaded!
  useEffect(() => {
    if (project) {
      const timer = setTimeout(() => {
        setProgressWidth(project.completion_percentage);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [project]);

  // Date formatter helper to output readable, premium dates (e.g. October 15, 2026).
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No target date set";
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <DashboardWrapper>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300 font-sans">
        
        {/* Back navigation control */}
        <div className="flex items-center">
          <Link 
            href="/dashboard"
            className="group flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            <div className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 transition-colors">
              <ArrowLeft size={14} className="transform group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span>Back to Workspaces</span>
          </Link>
        </div>

        {/* LOADING STATE - Pulse Skeleton Loading Blocks */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/4 animate-pulse" />
              <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-md w-3/4 animate-pulse" />
              <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-md w-full animate-pulse" />
              <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-3xl border border-zinc-250 dark:border-zinc-800 animate-pulse" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-3xl border border-zinc-250 dark:border-zinc-800 animate-pulse" />
            </div>
          </div>
        )}

        {/* ERROR STATE - Elegant 404 Workspace Box */}
        {!isLoading && errorMsg && (
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 p-12 text-center flex flex-col items-center justify-center space-y-6 max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 flex items-center justify-center">
              <AlertCircle size={28} className="text-zinc-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white">Workspace Not Found</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                This project workspace does not exist, or you do not have authorization keys to view its contents.
              </p>
            </div>
            <Link 
              href="/dashboard"
              className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <LayoutGrid size={14} />
              <span>Return to Workspaces</span>
            </Link>
          </div>
        )}

        {/* LOADED STATE - Workspace Details and Milestone Progress */}
        {!isLoading && project && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left wide column - Project metadata & milestone statistics */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Workspace Header Panel */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Color-coded status badges for different status states */}
                  {project.status === 'planning' && (
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-650 dark:text-zinc-300">
                      planning
                    </span>
                  )}
                  {project.status === 'active' && (
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/50">
                      active
                    </span>
                  )}
                  {project.status === 'completed' && (
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/50">
                      completed
                    </span>
                  )}
                  {project.status === 'archived' && (
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/50">
                      archived
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
                    {project.title}
                  </h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {project.description || "No detailed notes provided for this workspace."}
                  </p>
                </div>
              </div>

              {/* Milestone Progress Bar Card */}
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      <CheckCircle2 size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                      Milestone Progress
                    </h3>
                  </div>
                  <span className="text-xl font-extrabold text-zinc-950 dark:text-white">
                    {project.completion_percentage}%
                  </span>
                </div>

                {/* Progress bar container and active horizontal indicator */}
                <div className="space-y-3">
                  <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800/80 overflow-hidden">
                    <div 
                      style={{ width: `${progressWidth}%` }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    />
                  </div>
                  
                  {/* Dynamic description of completed tasks counts */}
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <CheckSquare size={12} />
                      <span>{project.completed_tasks} completed</span>
                    </span>
                    <span>{project.total_tasks} total tasks</span>
                  </div>
                </div>
              </div>

              {/* Task timeline placeholder card - placeholder layout for upcoming phase */}
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 p-8 text-center flex flex-col items-center justify-center space-y-3 border-dashed">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-850 text-zinc-400 flex items-center justify-center">
                  <CheckSquare size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-950 dark:text-white">Tasks & Milestone Timeline</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                    In the next phase, you will build dynamic task boards here to manage all actionable items!
                  </p>
                </div>
              </div>

            </div>

            {/* Right sidebar column - Date timelines & structural metrics */}
            <div className="space-y-6">
              
              {/* Workspace Details Card */}
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 space-y-5 shadow-sm">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                  <Settings size={16} className="text-zinc-400" />
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider">
                    Workspace Details
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Target Due Date info row */}
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 mt-0.5">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                        Target due date
                      </span>
                      <span className="text-xs font-bold text-zinc-950 dark:text-zinc-200 mt-0.5 block">
                        {formatDate(project.due_date)}
                      </span>
                    </div>
                  </div>

                  {/* Created timestamp info row */}
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 mt-0.5">
                      <Clock size={14} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                        Created on
                      </span>
                      <span className="text-xs font-bold text-zinc-950 dark:text-zinc-200 mt-0.5 block">
                        {formatDate(project.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Updated timestamp info row */}
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 mt-0.5">
                      <Clock size={14} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                        Last modified
                      </span>
                      <span className="text-xs font-bold text-zinc-950 dark:text-zinc-200 mt-0.5 block">
                        {formatDate(project.updated_at)}
                      </span>
                    </div>
                  </div>

                  {/* Operational indicators info row */}
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60 text-[10px] text-zinc-450 dark:text-zinc-500 flex items-center justify-between">
                    <span>Workspace reference</span>
                    <span className="font-bold">#{project.id}</span>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </DashboardWrapper>
  );
}
