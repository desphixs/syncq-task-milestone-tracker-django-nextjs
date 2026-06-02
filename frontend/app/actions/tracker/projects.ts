'use server';

// Import our centralized apiFetch helper to make secure backend queries.
import { apiFetch } from '@/lib/api';

/**
 * GET PROJECTS SERVER ACTION
 * 
 * Analogy:
 * Think of this action like a secure vault messenger.
 * The messenger retrieves the client's credential keys from the cookie drawer,
 * travels securely to the Django vault, filters and fetches only the client's projects,
 * and delivers them safely back to our React dashboard page!
 */
export async function getProjectsAction() {
    try {
        // Dispatch a secure GET request to the Django tracker projects endpoint.
        // apiFetch automatically handles extracting the access token and attaching it to headers!
        const { ok, status, data } = await apiFetch('/tracker/projects/', {
            method: 'GET',
            cache: 'no-store', // Always fetch fresh projects, bypass intermediate caches
        });

        if (ok) {
            return {
                success: true,
                message: "Projects retrieved successfully.",
                projects: data,
            };
        } else {
            return {
                success: false,
                message: data.message || data.detail || "Failed to retrieve projects.",
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
 * CREATE PROJECT SERVER ACTION
 * 
 * Analogy:
 * Think of this action like a courier delivering a new office file cabinet drawer request.
 * It carries the title, description, and target deadline of the new project drawer,
 * authenticates using the client's cookie key card, and asks Django to securely build it.
 */
export async function createProjectAction(payload: {
    title: string;
    description: string;
    status?: string;
    due_date?: string | null;
}) {
    try {
        // Send a secure POST request with our new project details back to Django.
        const { ok, status, data } = await apiFetch('/tracker/projects/', {
            method: 'POST',
            body: payload, // Send payload converted automatically to a JSON string
        });

        if (ok) {
            return {
                success: true,
                message: "Workspace project created successfully.",
                project: data,
            };
        } else {
            return {
                success: false,
                message: data.message || data.detail || "Failed to create project. Please verify inputs.",
                errors: data, // Return direct validation errors (e.g. title too long) if any
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
