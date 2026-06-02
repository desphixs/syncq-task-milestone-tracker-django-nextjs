'use server';

// Import our centralized apiFetch helper to make secure backend queries.
import { apiFetch } from '@/lib/api';

/**
 * Task Data Interface matching our backend serializer layout.
 */
export interface Task {
  id: number;
  project: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'doing' | 'done';
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET TASKS SERVER ACTION
 * 
 * Analogy:
 * Think of this action like retrieving task cards from a project's folder.
 * It takes a project ID, validates authentication, and asks Django
 * to return all tasks that belong to that project folder.
 */
export async function getTasksAction(projectId: string | number) {
  try {
    // Send a secure GET request to the Django tracker tasks endpoint,
    // including the project_id as a query parameter.
    const { ok, status, data } = await apiFetch(`/tracker/tasks/?project_id=${projectId}`, {
      method: 'GET',
      cache: 'no-store', // Bypass cache to retrieve the most up-to-date tasks list
    });

    if (ok) {
      return {
        success: true,
        message: "Tasks retrieved successfully.",
        tasks: data as Task[],
      };
    } else {
      return {
        success: false,
        message: data.error || data.detail || "Failed to retrieve tasks.",
        status,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Network error: ${error.message || 'Failed to connect to backend server.'}`,
    };
  }
}

/**
 * CREATE TASK SERVER ACTION
 * 
 * Analogy:
 * Think of this like pinning a new sticky note task card onto a project board.
 * It sends the task title, description, priority level, and target due date,
 * along with the parent project ID to associate it.
 */
export async function createTaskAction(payload: {
  project: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'doing' | 'done';
  due_date: string | null;
}) {
  try {
    // Send a secure POST request with the task payload to Django.
    const { ok, status, data } = await apiFetch('/tracker/tasks/', {
      method: 'POST',
      body: payload,
    });
    if (ok) {
      return {
        success: true,
        message: "Task created successfully.",
        task: data as Task,
      };
    } else {
      return {
        success: false,
        message: data.error || data.detail || "Failed to create task.",
        errors: data,
        status,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Network error: ${error.message || 'Failed to connect to backend server.'}`,
    };
  }
}

