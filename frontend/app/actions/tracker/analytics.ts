'use server';

// Import our centralized apiFetch helper to make secure backend queries.
import { apiFetch } from '@/lib/api';

// Define the structure of the analytics response payload.
// This matches the exact JSON keys returned by our backend Django view!
export interface AnalyticsData {
  total_projects: number;
  total_tasks: number;
  status_breakdown: {
    todo: number;
    doing: number;
    done: number;
  };
  priority_breakdown: {
    low: number;
    medium: number;
    high: number;
  };
  overdue_tasks: number;
  due_next_7_days: number;
  overdue_tasks_list: Array<{
    id: number;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'todo' | 'doing' | 'done';
    due_date: string | null;
    project_title: string;
  }>;
}

/**
 * GET PROJECT ANALYTICS SERVER ACTION
 * 
 * Analogy:
 * Think of this action like an executive analyst compiling a progress audit.
 * The analyst requests reports from various departments, groups active tasks,
 * summarizes priority breakdowns, flags overdue warnings, and packages it
 * into a single unified report dictionary for the client dashboard overview.
 */
export async function getAnalyticsAction() {
  try {
    // Send a secure GET request to the Django tracker analytics endpoint.
    // apiFetch automatically handles appending the user authorization headers!
    const { ok, status, data } = await apiFetch('/tracker/analytics/', {
      method: 'GET',
      cache: 'no-store', // Bypass intermediate caches to load real-time statistics
    });

    if (ok) {
      // If the request succeeded, return a success status along with the translated analytics object.
      return {
        success: true,
        message: "Analytics retrieved successfully.",
        data: data as AnalyticsData,
      };
    } else {
      // If the API server returned an error (such as a 401 token invalidation), return success=false.
      return {
        success: false,
        message: data.message || data.detail || "Failed to retrieve analytics metrics.",
        status,
      };
    }
  } catch (error: any) {
    // If a connection error occurs (backend down or network timeout), return a friendly error message.
    return {
      success: false,
      message: `Network error: ${error.message || 'Failed to connect to backend server.'}`,
    };
  }
}
