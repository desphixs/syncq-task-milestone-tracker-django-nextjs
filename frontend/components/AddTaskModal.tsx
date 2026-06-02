'use client';

// Import React and useState to manage form inputs and submission states.
import React, { useState, useEffect } from 'react';
// Import Lucide React icons for visual cues.
import { X, Loader2, AlertCircle } from 'lucide-react';
// Import the Server Action to submit the task payload to Django.
import { createTaskAction, Task } from '@/app/actions/tracker/tasks';

// Define the component's props interface structure.
interface AddTaskModalProps {
  isOpen: boolean; // Determines if the dialog is visible on screen
  onClose: () => void; // Callback function to close the dialog
  projectId: number; // The database ID of the parent project workspace
  defaultStatus: 'todo' | 'doing' | 'done'; // The column status where the user clicked the button
  onSuccess: (newTask: Task) => void; // Callback function that appends the newly created task card to the UI state list
}

export default function AddTaskModal({
  isOpen,
  onClose,
  projectId,
  defaultStatus,
  onSuccess,
}: AddTaskModalProps) {
  // Input state values for form collection
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  
  // Track backend request processing state
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Store validation or database error messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state values when modal is opened or closed
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setErrorMsg(null);
    }
  }, [isOpen]);

  // If the dialog is configured as closed, do not render any DOM tags
  if (!isOpen) return null;

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Quick client-side check to ensure the title is filled
    if (!title.trim()) {
      setErrorMsg("Please provide a task title.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Prepare payload matching TaskSerializer constraints
    const payload = {
      project: projectId,
      title: title.trim(),
      description: description.trim(),
      priority,
      status: defaultStatus,
      due_date: dueDate || null,
    };

    // Dispatch the server action to securely post data to Django API
    const result = await createTaskAction(payload);

    if (result.success && result.task) {
      // Fire success callback to update parent state immediately
      onSuccess(result.task);
      // Close the modal
      onClose();
    } else {
      // Expose validation messages or server errors in the modal view
      setErrorMsg(result.message || "Failed to create task. Please check inputs.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
      
      {/* Background overlay backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/45 dark:bg-black/65 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card Container */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-3xl w-full max-w-lg p-6 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header containing title and Close control */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-850">
          <div>
            <h3 className="text-base font-black text-zinc-950 dark:text-white">Create New Task</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Assign details to this actionable workspace milestone</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-105 dark:hover:bg-zinc-900 text-zinc-450 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error banner indicator */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-5 mt-5">
          
          {/* Task Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Task Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Set up API routing rules"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all placeholder:text-zinc-400"
            />
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Write target details or goals for this milestone..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all placeholder:text-zinc-450 resize-none"
            />
          </div>

          {/* Priority Levels segment-like selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Priority level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPriority(level)}
                  className={`py-2.5 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                    priority === level
                      ? level === 'low'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50'
                        : level === 'medium'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
                      : 'bg-transparent text-zinc-400 dark:text-zinc-550 border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Due date picker input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Due date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all"
            />
          </div>

          {/* Action Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-850">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-650 hover:text-zinc-950 dark:text-zinc-450 dark:hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Task</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
