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

/**
 * GET PROJECT DETAIL SERVER ACTION
 * 
 * Analogy:
 * Think of this action like a secure courier sent to fetch one specific private drawer inside the vault.
 * The courier carries the unique drawer ID, presents the user's secret keys (cookies) for validation,
 * and retrieves the detailed folder containing project metadata and dynamically computed milestone statistics.
 * If the user does not own this folder, the vault guards block access and return a secure 404 response.
 */
export async function getProjectDetailAction(id: string | number) {
    try {
        // Step 1: Send a secure GET request to the single project detail endpoint in Django.
        // We interpolate the dynamic project ID directly into our REST API route path!
        const { ok, status, data } = await apiFetch(`/tracker/projects/${id}/`, {
            method: 'GET',
            cache: 'no-store', // Always bypass cache to load the latest dynamic progress statistics!
        });

        // Step 2: Check if Django responded with a successful status code.
        if (ok) {
            return {
                success: true,
                message: "Project details retrieved successfully.",
                project: data,
            };
        } else {
            // Step 3: If Django returned a 404 or other error, return it with a clear explanation message.
            return {
                success: false,
                message: data.message || data.detail || "Failed to retrieve project details.",
                status,
            };
        }
    } catch (error: any) {
        // Step 4: Handle standard network connectivity or offline connection errors gracefully.
        return {
            success: false,
            message: `Network error: ${error.message || 'Failed to connect to backend server.'}`,
        };
    }
}

