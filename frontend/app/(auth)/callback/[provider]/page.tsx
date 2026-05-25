'use client';

// Importing standard React hooks:
// - useEffect: runs code when the component loads (side effects).
// - useRef: stores values that don't trigger a re-render when changed (used as our execution guard).
import { useEffect, useRef } from 'react';

// Importing Next.js navigation utilities:
// - useParams: grabs dynamic URL parameters (e.g. in /callback/github, 'github' is the provider).
// - useSearchParams: reads query parameters from the URL (e.g. ?code=12345).
// - useRouter: lets us programmatically push the user to different pages.
import { useParams, useSearchParams, useRouter } from 'next/navigation';

// Importing our server action that exchanges the temporary code for JWT credentials.
import { socialLoginAction } from '@/app/actions/auth';

// Importing standard icons from lucide-react to represent our loading status beautifully.
import { Loader2 } from 'lucide-react';

// Importing Sonner toast for floating notification bubbles.
import { toast } from 'sonner';

/**
 * AUTH CALLBACK PAGE component
 * 
 * Analogy:
 * Think of this page like the VIP customs clearance desk at our club.
 * When a user logs in via GitHub, GitHub stamps a temporary visa voucher (the authorization 'code') 
 * on their wrist and redirects them to this callback page. 
 * This page instantly catches that code, shows a friendly "Authenticating..." loading screen,
 * and calls our secure server-side action (the hotline to our server clerk) to exchange that visa 
 * for a permanent, secure membership card (access/refresh cookies).
 * 
 * Once cleared, they are escorted to the VIP Lounge (the homepage Dashboard)!
 */
export default function AuthCallbackPage() {
  // Extract the provider name dynamically from the URL route parameter (e.g., 'github').
  const { provider } = useParams();
  
  // Read query parameters from the browser address bar (e.g., ?code=...).
  const searchParams = useSearchParams();
  
  // The router helper lets us push the user back to home or login pages.
  const router = useRouter();
  
  // React StrictMode runs useEffect twice in development. 
  // We use this ref flag to guarantee we only call our backend API exactly ONCE!
  const hasCalled = useRef(false);

  useEffect(() => {
    // 1. Grab the unique 'code' string sent back from the social provider.
    const code = searchParams.get('code');
    const providerName = provider as string;

    // 2. If we have a code and a provider, and we haven't initiated the login handshake yet:
    if (code && providerName && !hasCalled.current) {
      // Set the flag to true immediately to block future dual-execution triggers.
      hasCalled.current = true;

      // Start a loading toast notification.
      const toastId = toast.loading(`Securely connecting your ${providerName} account...`);

      // 3. Dispatch the code to our Server Action behind the scenes.
      socialLoginAction(providerName, code)
        .then((result) => {
          if (result.success) {
            // Success! Update our toast alert and escort the user home.
            toast.success(result.message || 'Successfully authenticated!', { id: toastId });
            
            // Refresh the Next.js router to clear server component caches.
            router.refresh();
            
            // Redirect the user to the secure dashboard root directory.
            router.push('/');
          } else {
            // Handshake failed! Print error details and redirect to login.
            console.error('OAuth exchange failed:', result.message);
            toast.error(result.message || 'Authentication failed. Please try again.', { id: toastId });
            router.push('/login');
          }
        })
        .catch((error) => {
          // Catch unexpected connection failures.
          console.error('Unexpected connection crash:', error);
          toast.error('An unexpected connection error occurred.', { id: toastId });
          router.push('/login');
        });
    } 
    // 4. If the page loads but no authentication code is present in the URL:
    else if (!code && !hasCalled.current) {
      // Direct them back to the login page as this is an invalid direct entry attempt.
      hasCalled.current = true;
      router.push('/login');
    }
  }, [provider, searchParams, router]);

  // Render a high-aesthetic, ultra-clean glassmorphic loading screen for the student dashboard.
  return (
    <div className="fixed inset-0 z-[100] flex h-screen w-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans transition-colors duration-300">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          {/* Subtle modern pulsing background effect to keep the screen alive */}
          <div className="absolute inset-0 animate-pulse rounded-full bg-zinc-200/50 dark:bg-zinc-800/40 opacity-75 blur-md"></div>
          
          {/* Elegant minimalist loading spinner spinner */}
          <Loader2 className="relative h-12 w-12 animate-spin text-zinc-900 dark:text-zinc-50 stroke-[1.5]" />
        </div>
        
        <div className="space-y-1 text-center">
          {/* Elegant status labels */}
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Authenticating
          </h2>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Securely connecting your {provider as string || 'social'} account...
          </p>
        </div>
      </div>
    </div>
  );
}
