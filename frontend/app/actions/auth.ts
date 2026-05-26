// Instruct Next.js that this entire file runs exclusively on the secure server.
// The 'use server' directive guarantees this code never downloads to the client browser!
'use server';

// Import our server-side cookie manager utility from Next.js to read and write cookies.
import { cookies } from 'next/headers';
// Import next navigation redirect utility to route pages server-side.
import { redirect } from 'next/navigation';
// Import our type-safe, validated environment settings to safely locate our Django backend URL.
import { env } from '../env';

/**
 * REGISTER SERVER ACTION
 * 
 * Analogy:
 * Think of this action like a secure mail carrier.
 * The client form fills out their registration letter (email, name, password) and hands it to the carrier.
 * The carrier drives this directly to our secure kitchen (Django API) at the backend, waits for Django
 * to process and validate it, and returns the certified result back to the frontend form.
 */
export async function registerAction(payload: any) {
    try {
        // 1. Send an asynchronous POST request to our secure Django registration endpoint.
        // We interpolate our backend API base URL with the registration path.
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/userauths/register/`, {
            // Specify that we are sending data to the server using the POST method.
            method: 'POST',
            // Set headers to tell the server we are sending our data formatted as JSON.
            headers: {
                'Content-Type': 'application/json',
            },
            // Convert the raw JavaScript payload object into a standard JSON string.
            body: JSON.stringify(payload),
        });

        // 2. Parse the returned JSON response body asynchronously.
        const data = await response.json();

        // 3. Evaluate if the response HTTP status indicates success (typically 200 or 201).
        if (response.ok) {
            // Return a clean success payload object to our calling frontend components.
            return {
                // Set the success indicator flag to true.
                success: true,
                // Extract the success message from the backend response, or use a default string.
                message: data.message || 'Registration successful.',
                // Pass back the serialized user details.
                user: data.user,
            };
        } else {
            // If the server returned an error status (like 400 Bad Request), return a failure report.
            return {
                // Set the success indicator flag to false.
                success: false,
                // Extract the flattened validation error message parsed by our global handler.
                message: data.message || 'Registration failed. Please check your inputs.',
            };
        }
    } catch (error: any) {
        // Intercept any unexpected network failures or backend server connection crashes.
        return {
            // Set the success indicator flag to false.
            success: false,
            // Construct a helpful network troubleshooting message for the student.
            message: `Network error: ${error.message || 'Failed to connect to backend server.'}`,
        };
    }
}

/**
 * LOGIN SERVER ACTION
 * 
 * Analogy:
 * Think of this action like check-in at a high-security hotel.
 * You present your credentials, and instead of giving you key cards to carry in your pockets (localStorage),
 * the server clerk gets your secure keys, puts them in an armored capsule (HttpOnly cookies),
 * and routes them directly to your browser's private safe.
 * The client browser JavaScript scripts cannot touch or read it, keeping it safe from pickpockets (XSS attacks)!
 */
export async function loginAction(payload: any) {
    try {
        // 1. Send an asynchronous POST request to our custom Django login endpoint.
        // We interpolate our backend API base URL with the login path.
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/userauths/login/`, {
            // Specify that we are sending data to the server using the POST method.
            method: 'POST',
            // Set headers to tell the server we are sending our data formatted as JSON.
            headers: {
                'Content-Type': 'application/json',
            },
            // Convert the credentials payload object into a standard JSON string.
            body: JSON.stringify(payload),
        });

        // 2. Parse the returned JSON response body asynchronously.
        const data = await response.json();

        // 3. Evaluate if the login attempt was successfully authenticated by the backend.
        if (response.ok) {
            // Retrieve and await the Next.js asynchronous cookie store helper to get write permission.
            const cookieStore = await cookies();

            // Retrieve the access token string (the short-term token) from our parsed JSON body.
            const accessToken = data.access;
            // Retrieve the refresh token string (the long-term token) from our parsed JSON body.
            const refreshToken = data.refresh;

            // Set the access token cookie inside the secure browser context.
            cookieStore.set('access_token', accessToken, {
                // Restricts browser JavaScript code from reading this cookie, blocking XSS extraction!
                httpOnly: true,
                // Only require HTTPS in production environments, allowing local HTTP development to work seamlessly!
                secure: process.env.NODE_ENV === 'production',
                // Restricts cross-site cookie transfers to defend against CSRF attacks.
                sameSite: 'lax',
                // Makes the cookie accessible across all pages and directories of our website.
                path: '/',
                // Give the cookie an expiration of 1 hour, matching the access token lifespan.
                maxAge: 60 * 60,
            });

            // If a refresh token is returned in the response body, store it securely in a cookie.
            if (refreshToken) {
                // Set the long-term refresh token cookie inside the Next.js browser context.
                cookieStore.set('refresh_token', refreshToken, {
                    // Keep JavaScript access disabled for strict frontend isolation.
                    httpOnly: true,
                    // Only enforce HTTPS in production environments so local HTTP hosts write the cookie successfully.
                    secure: process.env.NODE_ENV === 'production',
                    // Apply Lax SameSite restriction for standard CSRF protection.
                    sameSite: 'lax',
                    // Make the refresh token accessible globally across all routes.
                    path: '/',
                    // Set the expiration to 7 days, matching the backend refresh token lifespan.
                    maxAge: 7 * 24 * 60 * 60,
                });
            }

            // Return a success payload to the calling form component.
            return {
                // Set the success indicator flag to true.
                success: true,
                // Pass back a clean success message.
                message: data.message || 'Login successful.',
                // Provide the serialized user details.
                user: data.user,
            };
        } else {
            // If the server returned an error status (like 401 Unauthorized), return a failure report.
            return {
                // Set the success indicator flag to false.
                success: false,
                // Extract the descriptive error message returned by our global handler.
                message: data.message || 'Invalid email or password.',
            };
        }
    } catch (error: any) {
        // Intercept any unexpected network failures or backend server connection crashes.
        return {
            // Set the success indicator flag to false.
            success: false,
            // Construct a helpful network troubleshooting message for the student.
            message: `Network error: ${error.message || 'Failed to connect to backend server.'}`,
        };
    }
}

/**
 * SOCIAL LOGIN SERVER ACTION
 * 
 * Analogy:
 * Think of this action like presenting a VIP check-in card from GitHub to our server clerk.
 * The server clerk takes this checked card, carries it securely behind the scenes to our Django database,
 * retrieves our certified tokens (access & refresh), stores them in HttpOnly cookies in the browser's private vault,
 * and confirms that the visitor is officially checked in!
 */
export async function socialLoginAction(provider: string, code: string) {
    try {
        // 1. Send a POST request to our custom Django social endpoint.
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/userauths/${provider}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });

        // 2. Parse the returned JSON response body.
        const data = await response.json();

        // 3. Evaluate if the login handshake succeeded.
        if (response.ok) {
            // Retrieve and await the Next.js cookie store helper.
            const cookieStore = await cookies();

            // Extract access and refresh tokens from the body.
            // Our Django view returns them inside the 'data' key as data.data.access / data.data.refresh!
            const accessToken = data.data?.access;
            const refreshToken = data.data?.refresh;

            if (!accessToken) {
                return {
                    success: false,
                    message: "Access token is missing from authentication response.",
                };
            }

            // Set the access token cookie inside the secure browser context.
            cookieStore.set('access_token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60, // 1 hour
            });

            // Set the refresh token cookie.
            if (refreshToken) {
                cookieStore.set('refresh_token', refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                    maxAge: 7 * 24 * 60 * 60, // 7 days
                });
            }

            return {
                success: true,
                message: "Social login successful.",
            };
        } else {
            return {
                success: false,
                message: data.error || data.message || "Failed to log in with social provider.",
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
 * REQUEST MAGIC LINK SERVER ACTION
 * 
 * Analogy:
 * Think of this action like requesting a VIP key card from the hotel receptionist.
 * You give them your email, and they check if you are registered in the hotel system.
 * If you are, they generate a secure, temporary key link, put it in an envelope, and send it to your email inbox.
 * You don't get the key immediately in your hand, but you are told to check your inbox!
 */
export async function requestMagicLinkAction(payload: { email: string }) {
    try {
        // 1. Send an asynchronous POST request to our secure Django magic link request endpoint.
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/userauths/magic-link/request/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        // 2. Parse the returned JSON response body.
        const data = await response.json();

        // 3. Evaluate if the request was successful.
        if (response.ok) {
            return {
                success: true,
                message: data.message || 'Magic link successfully sent to your email.',
            };
        } else {
            return {
                success: false,
                message: data.message || 'Failed to generate magic link. Please ensure your email is correct.',
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
 * LOGOUT SERVER ACTION
 * 
 * Analogy:
 * Think of this action like returning your room keycards at checkout.
 * You hand the access and refresh token keycards back to the server clerk,
 * who deletes them immediately from the browser vault, making sure your
 * session is officially cleared, and walks you out of the secure compound back to the gate.
 */
export async function logoutAction() {
  // Await and retrieve the server-side cookie container.
  const cookieStore = await cookies();

  // Delete the secure tokens from the browser context.
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');

  // Reroute the user instantly to the login endpoint.
  redirect('/login');
}

