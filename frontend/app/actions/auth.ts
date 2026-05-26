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
 * VERIFY MAGIC LINK SERVER ACTION
 * 
 * Analogy:
 * Think of this like presenting your VIP passport stamp to the hotel desk clerk.
 * The clerk takes the stamp, sends it privately to the Django server to check its mathematical validity,
 * receives the login access and refresh credentials, sets them securely in cookies,
 * and confirms that you are checked in!
 */
export async function verifyMagicLinkAction(token: string) {
    try {
        // 1. Send a POST request to our secure Django magic link verification endpoint.
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/userauths/magic-link/verify/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });

        // 2. Parse the returned JSON response body.
        const data = await response.json();

        // 3. Evaluate if the token verification was successful.
        if (response.ok) {
            // Retrieve and await the Next.js asynchronous cookie store helper.
            const cookieStore = await cookies();

            // Extract the access and refresh tokens from the body.
            const accessToken = data.access;
            const refreshToken = data.refresh;

            // Set the access token cookie.
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
                message: data.message || 'Authenticated successfully.',
                user: data.user,
            };
        } else {
            return {
                success: false,
                message: data.error || data.message || 'Verification failed.',
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

/**
 * REQUEST OTP SERVER ACTION
 * 
 * Analogy:
 * Think of this action like a secure messenger. You tell it your email,
 * and it runs to the hotel clerk's desk (the Django API) to ask for a temporary security pass code.
 * The messenger waits for the server clerk to verify your account, clear out any stale codes,
 * print a new 6-digit combination, and dispatch it to your inbox!
 * Then the messenger returns to the client with the good news that the code is on its way.
 */
export async function requestOtpAction(payload: { email: string }) {
    try {
        // 1. Send an asynchronous POST request to our secure Django OTP generation endpoint.
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/userauths/otp/request/`, {
            method: 'POST', // We use POST because we are initiating/submitting a dynamic generation request
            headers: {
                'Content-Type': 'application/json', // Inform Django that the body is formatted as JSON
            },
            body: JSON.stringify(payload), // Serialize our payload object containing the email
        });

        // 2. Parse the returned JSON response body.
        const data = await response.json();

        // 3. Evaluate if the request was successfully processed by our backend endpoint.
        if (response.ok) {
            return {
                success: true, // Success flag
                message: data.message || 'OTP verification code successfully sent to your email.', // Success feedback message
            };
        } else {
            return {
                success: false, // Failure flag
                message: data.message || data.error || 'Failed to generate OTP code. Please ensure your email is correct.', // Error explanation
            };
        }
    } catch (error: any) {
        // Catch and report any network connection failures.
        return {
            success: false, // Failure flag
            message: `Network error: ${error.message || 'Failed to connect to backend server.'}`,
        };
    }
}

/**
 * VERIFY OTP SERVER ACTION
 * 
 * Analogy:
 * Think of this like presenting your 6-digit gate passcode to the hotel bouncer.
 * The client hands their email and typed passcode to our server messenger.
 * The messenger travels securely to the Django database, compares the passcode hashes,
 * and checks the expiration timer.
 * If the passcode matches, the bouncer issues your session access credentials (JWT tokens).
 * The server messenger takes these tokens and saves them securely in the browser's HttpOnly cookies vault!
 * Now you are officially logged in, and the messenger reports the successful session.
 */
export async function verifyOtpAction(payload: { email: string; otp: string }) {
    try {
        // 1. Send an asynchronous POST request to our secure Django OTP verification endpoint.
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/userauths/otp/verify/`, {
            method: 'POST', // We use POST because we are submitting credentials for validation
            headers: {
                'Content-Type': 'application/json', // Notify Django that the body payload is JSON
            },
            body: JSON.stringify(payload), // Convert the { email, otp } object into a JSON string
        });

        // 2. Parse the returned JSON response body.
        const data = await response.json();

        // 3. Evaluate if the passcode is authentic and has been verified by the backend view.
        if (response.ok) {
            // Retrieve and await the Next.js asynchronous cookie helper to gain cookie write permission.
            const cookieStore = await cookies();

            // Extract the access and refresh JWT token credentials returned from Django.
            const accessToken = data.access;
            const refreshToken = data.refresh;

            // Store the short-term access token in a secure browser cookie.
            cookieStore.set('access_token', accessToken, {
                httpOnly: true, // Block client-side JavaScript access to prevent XSS credential stealing!
                secure: process.env.NODE_ENV === 'production', // Only require HTTPS in production hosts
                sameSite: 'lax', // Secure SameSite settings to mitigate CSRF attacks
                path: '/', // Allow the cookie to be active across all subdirectories of our app
                maxAge: 60 * 60, // Set cookie life to 1 hour, matching access token lifespan
            });

            // Store the long-term refresh token in a secure browser cookie.
            if (refreshToken) {
                cookieStore.set('refresh_token', refreshToken, {
                    httpOnly: true, // Lock JavaScript access for maximum frontend isolation
                    secure: process.env.NODE_ENV === 'production', // Local HTTP hosts work fine in dev
                    sameSite: 'lax', // Apply Lax SameSite restriction for standard CSRF protection
                    path: '/', // Allow the cookie to be active globally
                    maxAge: 7 * 24 * 60 * 60, // Set cookie life to 7 days, matching the backend refresh token
                });
            }

            return {
                success: true, // Success flag
                message: data.message || 'Authenticated successfully.', // Success message
                user: data.user, // Pass back user profile details
            };
        } else {
            return {
                success: false, // Failure flag
                message: data.error || data.message || 'OTP verification failed. Please try again.', // Detailed error text
            };
        }
    } catch (error: any) {
        // Intercept and report any network connection issues.
        return {
            success: false, // Failure flag
            message: `Network error: ${error.message || 'Failed to connect to backend server.'}`,
        };
    }
}

/**
 * SAVE THEME PREFERENCE SERVER ACTION
 * 
 * Analogy:
 * Think of this action like a secure background carrier.
 * When the user flips their theme setting, this carrier runs in the background to our secure Django profile endpoint.
 * It submits the selected preference ('light', 'dark', or 'system') to the user's permanent database profile record,
 * ensuring that their preference is safely stashed and loads instantly on any device!
 * 
 * Because it runs on the server, it securely fetches the user's access token from HttpOnly cookies and
 * authenticates requests with Django directly.
 */
export async function saveThemeAction(theme: string) {
    try {
        // 1. Fetch the user's access token securely from HttpOnly browser cookies.
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value;

        // If not authenticated, we store it in a temporary local theme cookie or report deferral.
        if (!accessToken) {
            return {
                success: false,
                message: "User session is unauthenticated. Theme preference saved locally.",
            };
        }

        // 2. Dispatch a secure POST request to our Django theme update endpoint.
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/userauths/theme/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`, // Authenticate with SimpleJWT Bearer header
            },
            body: JSON.stringify({ theme }),
        });

        // Parse returned response
        const data = await response.json();

        if (response.ok) {
            return {
                success: true,
                message: data.message || "Theme preference synchronized with backend successfully.",
                theme: data.theme,
            };
        } else {
            return {
                success: false,
                message: data.error || data.message || "Failed to synchronize theme with backend.",
            };
        }
    } catch (error: any) {
        return {
            success: false,
            message: `Background sync deferred: ${error.message || 'Connection offline.'}`,
        };
    }
}

/**
 * GET USER PROFILE ACTION
 * 
 * Analogy:
 * Think of this action like a secure security guard retrieve operation.
 * The guard checks the client's access badge (access_token) stored securely in HttpOnly cookies,
 * walks into the high-security members office (Django backend /profile/ endpoint),
 * grabs the member's profile file (email, name, bio, notification preferences),
 * and returns it safely to the client settings tab!
 */
export async function getUserProfileAction() {
    try {
        // 1. Securely fetch the user's access token from HttpOnly cookies in the browser.
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value;

        // 2. If no token is found, return an unauthorized status so the UI can redirect or block.
        if (!accessToken) {
            return {
                success: false,
                message: "Authentication credentials were not provided. Please log in.",
            };
        }

        // 3. Dispatch a secure GET request targeting our backend Django profile view controller.
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/userauths/profile/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Attach the access token inside standard Authorization Bearer header.
                'Authorization': `Bearer ${accessToken}`,
            },
            // Disable aggressive caching to ensure we always fetch fresh, active database details!
            cache: 'no-store',
        });

        // 4. Parse the returned JSON response body.
        const data = await response.json();

        // 5. Evaluate if the request was successfully processed (status code 200 OK).
        if (response.ok) {
            return {
                success: true,
                message: "Profile retrieved successfully.",
                user: data,
            };
        } else {
            return {
                success: false,
                message: data.message || data.detail || "Failed to retrieve user profile.",
            };
        }
    } catch (error: any) {
        // 6. Handle unexpected network drops or backend server offline failures.
        return {
            success: false,
            message: `Network error: ${error.message || 'Failed to connect to backend server.'}`,
        };
    }
}

/**
 * UPDATE USER PROFILE ACTION
 * 
 * Analogy:
 * Think of this action like a secure delivery courier.
 * It takes the profile update package containing the user's new name, biography, or preferences,
 * checks their access token key card in the cookie drawer,
 * and securely dispatches it to the Django server to perform a clean database update.
 * Once Django commits the changes and responds, the courier brings the fresh profile details back to the UI!
 */
export async function updateUserProfileAction(payload: any) {
    try {
        // 1. Fetch the user's secure access token from HttpOnly browser cookies.
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value;

        // 2. If no token is found, return an error block.
        if (!accessToken) {
            return {
                success: false,
                message: "Authentication credentials were not provided. Please log in.",
            };
        }

        // 3. Send a secure PUT request containing our profile payload back to Django.
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/userauths/profile/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                // Authenticate the call using SimpleJWT Bearer token standard.
                'Authorization': `Bearer ${accessToken}`,
            },
            // Convert our updated user data payload into a standard JSON string.
            body: JSON.stringify(payload),
        });

        // 4. Parse the returned JSON response.
        const data = await response.json();

        // 5. Check if the update succeeded on our backend.
        if (response.ok) {
            return {
                success: true,
                message: data.message || "Profile updated successfully.",
                user: data.user,
            };
        } else {
            return {
                success: false,
                message: data.message || "Failed to update profile. Please verify your inputs.",
                errors: data, // Pass validation errors back if they exist
            };
        }
    } catch (error: any) {
        // 6. Capture unexpected connection faults.
        return {
            success: false,
            message: `Network error: ${error.message || 'Failed to connect to backend server.'}`,
        };
    }
}

/**
 * GET CLOUDINARY SIGNATURE ACTION
 * 
 * Analogy:
 * Think of this action like going to the office manager to request a stamped permission voucher.
 * We present our credentials badge (the access token), and if verified, the manager stamps a 
 * cryptographic voucher card (the signature and timestamp) allowing us to drop off our media package 
 * directly at the Cloudinary deposit locker!
 */
export async function getCloudinarySignatureAction() {
    try {
        // 1. Retrieve the authenticated user's access token securely from HttpOnly browser cookies.
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value;

        // 2. Reject request immediately if the user is unauthenticated.
        if (!accessToken) {
            return {
                success: false,
                message: "Authentication credentials were not provided. Please log in.",
            };
        }

        // 3. Dispatch secure GET request to the Django signature generator view.
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/userauths/cloudinary/signature/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Authenticate request using standard SimpleJWT Bearer tokens.
                'Authorization': `Bearer ${accessToken}`,
            },
            // Disable fetch caching to ensure we generate fresh timestamps for signature validation!
            cache: 'no-store',
        });

        // 4. Parse the returned JSON response body.
        const data = await response.json();

        // 5. Check if the backend signature was successfully generated (status 200 OK).
        if (response.ok) {
            return {
                success: true,
                message: "Cloudinary upload signature generated successfully.",
                signatureData: data,
            };
        } else {
            return {
                success: false,
                message: data.message || data.detail || "Failed to generate upload signature.",
            };
        }
    } catch (error: any) {
        // 6. Capture unexpected connection drops.
        return {
            success: false,
            message: `Network error: ${error.message || 'Failed to connect to backend server.'}`,
        };
    }
}


/**
 * DELETE ACCOUNT SERVER ACTION
 * 
 * Analogy:
 * Think of this action like walking up to the bank cashier to close your entire safety vault.
 * 1. The cashier asks for your VIP identity badge (retrieve the access token from cookies).
 * 2. They ask you to type in your private confirmation key (the password).
 * 3. If verified, the cashier sends the destroy request to the Django ledger vault.
 * 4. Once Django confirms, the cashier immediately throws your physical key badges directly into the furnace
 *    (cookieStore.delete('access_token') and cookieStore.delete('refresh_token')), completely checking you out!
 */
export async function deleteAccountAction(password: string) {
    try {
        // 1. Retrieve the authenticated user's access token securely from HttpOnly browser cookies.
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value;

        // 2. Reject request immediately if the user is unauthenticated.
        if (!accessToken) {
            return {
                success: false,
                message: "Authentication credentials were not provided. Please log in.",
            };
        }

        // 3. Dispatch secure POST request to the Django account deletion view endpoint.
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/userauths/account/delete/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Authenticate request using standard SimpleJWT Bearer tokens.
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ password }),
        });

        // 4. Parse the returned JSON response body.
        const data = await response.json();

        // 5. Check if the deletion succeeded.
        if (response.ok) {
            // Wipe active authentication cookies from the client browser context upon complete success.
            cookieStore.delete('access_token');
            cookieStore.delete('refresh_token');

            return {
                success: true,
                message: data.message || "Your account has been successfully closed.",
            };
        } else {
            return {
                success: false,
                message: data.error || data.message || "Failed to delete account. Please verify your password.",
            };
        }
    } catch (error: any) {
        // 6. Capture unexpected connection drops.
        return {
            success: false,
            message: `Network error: ${error.message || 'Failed to connect to backend server.'}`,
        };
    }
}

