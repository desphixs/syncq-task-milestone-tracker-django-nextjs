'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// Import the sonner toast utility for displaying premium, high-aesthetic success and error alerts.
import { toast } from 'sonner';
import DashboardWrapper from '@/components/dashboard/DashboardWrapper';
// Import clean, modern icons from lucide-react to enrich our UI design.
import { 
  FolderPlus, Calendar, Folder, Plus, X, 
  Clock, Milestone, ChevronRight, AlertCircle, Loader2
} from 'lucide-react';

// Import our secure backend communication server actions.
import { getProjectsAction, createProjectAction } from '@/app/actions/tracker/projects';

// Define the Project typescript interface structure.
interface Project {
  id: number;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export default function DashboardOverviewPage() {
  // 1. Projects State List: Holds all the workspace projects fetched from the backend database.
  const [projects, setProjects] = useState<Project[]>([]);
  
  // 2. Loading State: Toggles whether the dashboard skeleton loaders should be displayed.
  const [isLoading, setIsLoading] = useState(true);

  // 3. Modal Toggler State: Controls the visibility of the new project creation modal dialog drawer.
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 4. Modal Submission Loading State: Shows a nice loading spinner while Django dispatches a create row query.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 5. New Project Form Field States:
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'planning' | 'active' | 'completed' | 'archived'>('planning');
  const [dueDate, setDueDate] = useState('');

  // 6. Hook: Fetch all user projects on initial component mount to populate the workspace cards.
  useEffect(() => {
    async function fetchUserProjects() {
      setIsLoading(true);
      
      // Dispatch the server action fetch request to query Django database.
      const result = await getProjectsAction();
      
      if (result.success && result.projects) {
        setProjects(result.projects);
      } else {
        // Display a clean warning toast if fetching projects failed.
        toast.error(result.message || "Failed to load projects.");
      }
      setIsLoading(false);
    }
    
    fetchUserProjects();
  }, []);

  // 7. Dynamic Projects Statistics:
  // We compute these numbers dynamically in memory from our current state projects array!
  const totalProjects = projects.length;
  const activeCount = projects.filter(p => p.status === 'active').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const planningCount = projects.filter(p => p.status === 'planning').length;

  // 8. Submit Handler: Dispatches the new project form fields to our backend via server action.
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Core Title validation check:
    if (!title.trim()) {
      toast.warning("Project title is required.");
      return;
    }

    setIsSubmitting(true);
    
    // Build our clean creation payload payload structure.
    const payload = {
      title,
      description,
      status,
      due_date: dueDate || null,
    };

    // Dispatch our create server action to perform secure API POST call.
    const result = await createProjectAction(payload);

    if (result.success && result.project) {
      // Append the newly created project directly to our frontend state array.
      // This gives Priya an instantaneous UI update without reloading the page!
      setProjects([result.project, ...projects]);
      
      // Close the modal dialog and wipe clean all form input state fields.
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setStatus('planning');
      setDueDate('');
      
      // Trigger a gorgeous modern success notification toast!
      toast.success("New project workspace created successfully.");
    } else {
      // Display the validation or server error response returned from Django REST framework.
      toast.error(result.message || "Failed to build new project workspace.");
    }
    setIsSubmitting(false);
  };

  return (
    <DashboardWrapper>
      <div className="space-y-8 animate-in fade-in duration-300">
        
        {/* ============================================================================== */}
        {/* WORKSPACE HEADER */}
        {/* ============================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
              Project Workspaces
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Manage your secure workspaces, client project milestones, and daily tasks.
            </p>
          </div>
          
          {/* Elegant dialog modal trigger button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white hover:opacity-90 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>New Project</span>
          </button>
        </div>

        {/* ============================================================================== */}
        {/* DYNAMIC STATISTICS OVERVIEW */}
        {/* ============================================================================== */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          
          {/* Card: Total Projects */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Total Workspaces
              </span>
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                <Folder size={14} />
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-zinc-950 dark:text-white">
              {isLoading ? "..." : totalProjects}
            </h2>
          </div>

          {/* Card: Active */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                Active Projects
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                <Clock size={14} />
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-zinc-950 dark:text-white">
              {isLoading ? "..." : activeCount}
            </h2>
          </div>

          {/* Card: Completed */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                Completed
              </span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                <Milestone size={14} />
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-zinc-950 dark:text-white">
              {isLoading ? "..." : completedCount}
            </h2>
          </div>

          {/* Card: Planning */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Planning
              </span>
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                <Plus size={14} />
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-zinc-950 dark:text-white">
              {isLoading ? "..." : planningCount}
            </h2>
          </div>

        </div>

        {/* ============================================================================== */}
        {/* PROJECTS GRID & SKELETONS */}
        {/* ============================================================================== */}
        {isLoading ? (
          // Render a clean premium grid of skeleton loaders while fetching API.
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div 
                key={n} 
                className="h-48 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-6 space-y-4 animate-pulse"
              >
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/3" />
                <div className="space-y-2">
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-full" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-5/6" />
                </div>
                <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/2 pt-4" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          // Elegant Empty State when user has no projects created.
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 flex items-center justify-center">
              <Folder size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white">No projects found</h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-sm">
                Get started by building your first secure project workspace to organize tasks and milestones!
              </p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 cursor-pointer shadow-sm"
            >
              Build Your First Project
            </button>
          </div>
        ) : (
          // Grid layout displaying all active projects of Priya securely.
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              // Map tailored harmonious status badge colors
              const badgeColors = {
                planning: "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300",
                active: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/50",
                completed: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/50",
                archived: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/50",
              };
              
              return (
                <div 
                  key={project.id}
                  className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md ${badgeColors[project.status]}`}>
                        {project.status}
                      </span>
                      {project.due_date && (
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                          <Calendar size={10} />
                          <span>{new Date(project.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-base font-extrabold text-zinc-950 dark:text-white line-clamp-1">
                        {project.title}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2">
                        {project.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400">
                      Workspace #{project.id}
                    </span>
                    
                    {/* View project details routing button */}
                    <Link 
                      href={`/dashboard/projects/${project.id}`}
                      className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:opacity-80 transition-opacity"
                    >
                      <span>Open Workspace</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================================== */}
        {/* ELEGANT MODAL DIALOG DRAWER */}
        {/* ============================================================================== */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Modal Backdrop Curtain */}
            <div 
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-sm transition-opacity"
            />
            
            {/* Modal dialog box */}
            <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 z-10">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white">
                    <FolderPlus size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-950 dark:text-white">
                    Build New Workspace
                  </h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateProject} className="space-y-4">
                
                {/* Field: Title */}
                <div className="space-y-1.5">
                  <label htmlFor="title" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Workspace Title
                  </label>
                  <input 
                    id="title"
                    type="text"
                    required
                    placeholder="e.g. Website Branding Audit"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/20 transition-colors"
                  />
                </div>

                {/* Field: Description */}
                <div className="space-y-1.5">
                  <label htmlFor="description" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Detailed Notes
                  </label>
                  <textarea 
                    id="description"
                    rows={3}
                    placeholder="Describe the scope or goals of this client workspace..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/20 transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Field: Status */}
                  <div className="space-y-1.5">
                    <label htmlFor="status" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Initial Status
                    </label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/20 transition-colors cursor-pointer"
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  {/* Field: Due Date */}
                  <div className="space-y-1.5">
                    <label htmlFor="dueDate" className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={12} />
                      <span>Target Due Date</span>
                    </label>
                    <input 
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/20 transition-colors cursor-pointer"
                    />
                  </div>
                </div>

                {/* Submit Controls */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white hover:opacity-90 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Building...</span>
                      </>
                    ) : (
                      <span>Create Workspace</span>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </DashboardWrapper>
  );
}
