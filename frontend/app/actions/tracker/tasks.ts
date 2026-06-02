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

/**
 * UPDATE TASK SERVER ACTION
 * 
 * Analogy:
 * Think of this like editing a sticky note or moving it to another column.
 * It lets us update individual fields, like changing status from 'todo' to 'done'.
 */
export async function updateTaskAction(
  taskId: number,
  payload: Partial<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'todo' | 'doing' | 'done';
    due_date: string | null;
  }>
) {
  try {
    // Send a secure PUT request to modify the task details.
    // The backend uses partial=True in the serializer, allowing partial updates.
    const { ok, status, data } = await apiFetch(`/tracker/tasks/${taskId}/`, {
      method: 'PUT',
      body: payload,
    });
    if (ok) {
      return {
        success: true,
        message: "Task updated successfully.",
        task: data as Task,
      };
    } else {
      return {
        success: false,
        message: data.error || data.detail || "Failed to update task.",
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

/**
 * DELETE TASK SERVER ACTION
 * 
 * Analogy:
 * Think of this like tearing off a sticky note and tossing it in the recycling bin.
 * Once done, it is permanently deleted from the Django database.
 */
export async function deleteTaskAction(taskId: number) {
  try {
    // We make an asynchronous call to our backend API using the `apiFetch` helper function.
    // We dynamically insert the `taskId` into the URL path so Django knows exactly which task to remove.
    // The HTTP method is set to 'DELETE' since we are performing a destructive removal operation.
    const { ok, status, data } = await apiFetch(`/tracker/tasks/${taskId}/`, {
      method: 'DELETE', // DELETE is the standard HTTP verb used to delete a resource
    });

    // Check if the backend responded with a successful status code (in the 200-299 range).
    if (ok) {
      // If the deletion was successful, return a success indicator to the frontend caller.
      return {
        success: true,
        message: "Task deleted successfully.",
      };
    } else {
      // If the backend returned an error status (like 400 or 403), return success=false.
      // We check if the response data contains a specific error message or default message.
      return {
        success: false,
        message: data.error || data.detail || "Failed to delete task.",
        status, // Include the HTTP status code for debugging if necessary
      };
    }
  } catch (error: any) {
    // If a network connection error or server crash happens, we catch the exception.
    // We return a user-friendly error message showing what went wrong.
    return {
      success: false,
      message: `Network error: ${error.message || 'Failed to connect to backend server.'}`,
    };
  }
}



