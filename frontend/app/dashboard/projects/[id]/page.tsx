'use client';

// Import React hooks for state management and running side-effects.
import React, { useState, useEffect } from 'react';
// Import Next.js Link component to navigate between pages.
import Link from 'next/link';
// Import DashboardWrapper layout that maintains header, sidebar and page structure.
import DashboardWrapper from '@/components/dashboard/DashboardWrapper';
// Import Lucide React icons to provide modern visual cues.
import { 
  ArrowLeft, CheckCircle2, Clock, Calendar, 
  Settings, AlertCircle, LayoutGrid, CheckSquare,
  ListTodo, Activity, List, Plus
} from 'lucide-react';
// Import our Project detail server action.
import { getProjectDetailAction } from '@/app/actions/tracker/projects';
// Import the getTasksAction and the Task interface from our tasks actions file.
import { getTasksAction, Task } from '@/app/actions/tracker/tasks';
// Import the AddTaskModal component we created to separate the dialog logic.
import AddTaskModal from '@/components/AddTaskModal';

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

  // State to hold the list of tasks belonging to this project.
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // State to track whether the project metadata request is currently loading.
  const [isLoading, setIsLoading] = useState(true);

  // State to track whether the tasks request is currently loading.
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // State to store any authorization or database error messages.
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dynamic width state to drive our smooth horizontal milestone progress bar micro-animation!
  const [progressWidth, setProgressWidth] = useState(0);

  // Switcher state to toggle between 'kanban' board layout and 'list' view layout
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Active filter tab for the tabbed List view ('all', 'todo', 'doing', 'done')
  const [activeListTab, setActiveListTab] = useState<'all' | 'todo' | 'doing' | 'done'>('all');

  // Modal control states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Track which status column triggered the modal so we can pre-select it
  const [modalDefaultStatus, setModalDefaultStatus] = useState<'todo' | 'doing' | 'done'>('todo');

  // Effect hook to fetch project details and tasks on component mount.
  useEffect(() => {
    async function loadData() {
      // Begin loading states
      setIsLoading(true);
      setIsLoadingTasks(true);
      setErrorMsg(null);
      
      // Dispatch both requests in parallel to prevent request waterfalls and load pages faster!
      const [projectResult, tasksResult] = await Promise.all([
        getProjectDetailAction(projectId),
        getTasksAction(projectId)
      ]);
      
      // Handle project details loading result
      if (projectResult.success && projectResult.project) {
        setProject(projectResult.project);
      } else {
        // Set error message if the workspace doesn't exist or belongs to another user.
        setErrorMsg(projectResult.message || "Failed to load project details.");
      }

      // Handle tasks loading result
      if (tasksResult.success && tasksResult.tasks) {
        setTasks(tasksResult.tasks);
      }
      
      // Stop loading states
      setIsLoading(false);
      setIsLoadingTasks(false);
    }
    
    if (projectId) {
      loadData();
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

  // Helper method to filter tasks by status for their respective Kanban columns
  const getTasksByStatus = (status: 'todo' | 'doing' | 'done') => {
    return tasks.filter(task => task.status === status);
  };

  // Helper method to filter tasks for the tabbed List view
  const getFilteredTasksForList = () => {
    if (activeListTab === 'all') return tasks;
    return tasks.filter(task => task.status === activeListTab);
  };

  // Opens the Add Task dialog modal with a pre-configured status category
  const openAddTaskModal = (status: 'todo' | 'doing' | 'done') => {
    setModalDefaultStatus(status);
    setIsAddModalOpen(true);
  };

  // Callback triggered when a task is successfully created in the AddTaskModal component
  const handleAddTaskSuccess = async (newTask: Task) => {
    // Append the newly created task to state immediately to prevent layout refresh latency
    setTasks(prevTasks => [...prevTasks, newTask]);
    
    // Fetch the updated project details to sync the horizontal milestone progress bar percentage
    const projectResult = await getProjectDetailAction(projectId);
    if (projectResult.success && projectResult.project) {
      setProject(projectResult.project);
    }
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
          <div className="space-y-8">
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

            {/* DYNAMIC TASK WORKSPACE SECTION */}
            <div className="space-y-6 pt-4 border-t border-zinc-150 dark:border-zinc-850">
              
              {/* Task Section Header */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-zinc-950 dark:text-white">Workspace Tasks</h2>
                  <p className="text-xs text-zinc-500">Organize and manage actionable milestones</p>
                </div>

                {/* View Layout Switcher Button Pill */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'kanban'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                    }`}
                  >
                    <LayoutGrid size={13} />
                    <span>Kanban Board</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                    }`}
                  >
                    <List size={13} />
                    <span>List View</span>
                  </button>
                </div>
              </div>

              {/* LOADING TASKS SKELETON */}
              {isLoadingTasks ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-3xl" />
                  ))}
                </div>
              ) : (
                <>
                  {/* KANBAN BOARD VIEW */}
                  {viewMode === 'kanban' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                      
                      {/* TO DO COLUMN */}
                      <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/65 dark:border-zinc-850 rounded-3xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                              <ListTodo size={14} />
                            </div>
                            <span className="text-xs font-black text-zinc-900 dark:text-zinc-200 uppercase tracking-wider">
                              To Do
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-200/60 dark:bg-zinc-850 text-zinc-650 dark:text-zinc-350 rounded-full">
                              {getTasksByStatus('todo').length}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => openAddTaskModal('todo')}
                            className="p-1.5 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-850 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                            title="Add Task to To Do"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="space-y-3 min-h-[120px]">
                          {getTasksByStatus('todo').length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center">
                              <span className="text-xs text-zinc-400">No tasks waiting</span>
                            </div>
                          ) : (
                            getTasksByStatus('todo').map((task) => (
                              <TaskCard key={task.id} task={task} />
                            ))
                          )}
                        </div>
                      </div>

                      {/* DOING COLUMN */}
                      <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/65 dark:border-zinc-850 rounded-3xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                              <Activity size={14} />
                            </div>
                            <span className="text-xs font-black text-zinc-900 dark:text-zinc-200 uppercase tracking-wider">
                              Doing
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-200/60 dark:bg-zinc-850 text-zinc-650 dark:text-zinc-350 rounded-full">
                              {getTasksByStatus('doing').length}
                            </span>
                          </div>

                          <button
                            onClick={() => openAddTaskModal('doing')}
                            className="p-1.5 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-850 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                            title="Add Task to Doing"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="space-y-3 min-h-[120px]">
                          {getTasksByStatus('doing').length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center">
                              <span className="text-xs text-zinc-400">No active tasks</span>
                            </div>
                          ) : (
                            getTasksByStatus('doing').map((task) => (
                              <TaskCard key={task.id} task={task} />
                            ))
                          )}
                        </div>
                      </div>

                      {/* DONE COLUMN */}
                      <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/65 dark:border-zinc-850 rounded-3xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 size={14} />
                            </div>
                            <span className="text-xs font-black text-zinc-900 dark:text-zinc-200 uppercase tracking-wider">
                              Done
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-200/60 dark:bg-zinc-850 text-zinc-650 dark:text-zinc-350 rounded-full">
                              {getTasksByStatus('done').length}
                            </span>
                          </div>

                          <button
                            onClick={() => openAddTaskModal('done')}
                            className="p-1.5 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-850 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                            title="Add Task to Done"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="space-y-3 min-h-[120px]">
                          {getTasksByStatus('done').length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center">
                              <span className="text-xs text-zinc-400">No completed tasks</span>
                            </div>
                          ) : (
                            getTasksByStatus('done').map((task) => (
                              <TaskCard key={task.id} task={task} />
                            ))
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TABBED LIST VIEW */}
                  {viewMode === 'list' && (
                    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-6">
                      
                      {/* List Filters & Actions Header */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                        {/* Status Filter Tabs */}
                        <div className="flex flex-wrap gap-2">
                          {(['all', 'todo', 'doing', 'done'] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setActiveListTab(tab)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                                activeListTab === tab
                                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md'
                                  : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                              }`}
                            >
                              {tab === 'todo' ? 'To Do' : tab}
                              <span className={`ml-2 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                                activeListTab === tab 
                                  ? 'bg-zinc-800 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-800' 
                                  : 'bg-zinc-200 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400'
                              }`}>
                                {tab === 'all' ? tasks.length : tasks.filter(t => t.status === tab).length}
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* Direct Add Task trigger */}
                        <button
                          onClick={() => openAddTaskModal('todo')}
                          className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Add Task</span>
                        </button>
                      </div>

                      {/* Vertically Scrolling List of Task Cards */}
                      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                        {getFilteredTasksForList().length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                            <span className="text-sm text-zinc-400">No tasks match this filter.</span>
                          </div>
                        ) : (
                          getFilteredTasksForList().map((task) => (
                            <TaskCard key={task.id} task={task} />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        )}

      </div>

      {/* CREATE NEW TASK FORM DIALOG MODAL */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        projectId={Number(projectId)}
        defaultStatus={modalDefaultStatus}
        onSuccess={handleAddTaskSuccess}
      />
    </DashboardWrapper>
  );
}

/**
 * STATIC TASK CARD COMPONENT (LISTING ONLY)
 * 
 * Analogy:
 * Think of this card like a visual representation of a single task.
 * It shows the title, description notes, priority badge, and calendar deadline.
 * There are no active input widgets or checkboxes in this initial phase.
 */
interface TaskCardProps {
  task: Task;
}

function TaskCard({ task }: TaskCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_2px_8px_-1px_rgba(0,0,0,0.02)] rounded-2xl p-5 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 relative group flex flex-col space-y-4">
      
      {/* Title & Description section */}
      <div className="flex items-start gap-3">
        {/* Static decorative checkbox circle */}
        <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          task.status === 'done'
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-zinc-350 dark:border-zinc-700 bg-transparent'
        }`}>
          {task.status === 'done' && <CheckSquare size={12} className="stroke-[3px]" />}
        </div>

        <div className="space-y-1 overflow-hidden">
          <h4 className={`text-sm font-bold tracking-tight break-words transition-all duration-200 ${
            task.status === 'done' 
              ? 'line-through text-zinc-400 dark:text-zinc-550' 
              : 'text-zinc-900 dark:text-zinc-100'
          }`}>
            {task.title}
          </h4>
          {task.description && (
            <p className={`text-xs leading-relaxed break-words line-clamp-2 ${
              task.status === 'done' ? 'text-zinc-400 dark:text-zinc-650' : 'text-zinc-500'
            }`}>
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer statistics - Priority Badge & Target Calendar due date */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-850/60">
        
        {/* Priority Badge */}
        <div>
          {task.priority === 'low' && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30">
              low
            </span>
          )}
          {task.priority === 'medium' && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30">
              medium
            </span>
          )}
          {task.priority === 'high' && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30">
              high
            </span>
          )}
        </div>

        {/* Due Date Calendar Icon and Text */}
        <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-400">
          <Calendar size={12} className="text-zinc-450" />
          <span>
            {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "No due date"}
          </span>
        </div>

      </div>

    </div>
  );
}
