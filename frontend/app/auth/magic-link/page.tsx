'use client';

// Import essential React hooks for lifecycle management and state control.
import { useEffect, useState, useRef } from 'react';
// Import routing hooks from Next.js to parse URLs and redirect pages.
import { useRouter, useSearchParams } from 'next/navigation';
// Import our secure Server Action to verify tokens on the server.
import { verifyMagicLinkAction } from '@/app/actions/auth';
// Import beautiful UI icons from Lucide.
import { Loader2, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

/**
 * MAGIC LINK LANDING PAGE
 * 
 * Analogy:
 * Think of this page like a security customs check-in lobby at a luxury resort.
 * You arrived here by clicking a secret, cryptographically stamped link sent to your email.
 * This lobby takes your stamped visa voucher (the token from the URL), hands it privately
 * to the customs officer behind the desk (our verifyMagicLinkAction Server Action),
 * and waits in a brief, elegant loading room (the spinner interface).
 * If the officer verifies the stamp, they write your security room passes (HttpOnly cookies),
 * and immediately open the doors to the main private courtyard (our home dashboard)!
 */
export default function MagicLinkLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Retrieve the cryptographic token directly from the URL query string parameter '?token=...'
  const token = searchParams.get('token');

  // React state hooks to manage UI feedback states.
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  // Use a useRef flag to track if verification has already run, preventing React 18 Strict Mode double-firing!
  const hasCalled = useRef(false);

  useEffect(() => {
    // 1. If no token is present in the URL query string, fail early and update the UI.
    if (!token) {
      setStatus('error');
      setErrorMessage('No authentication token was found in the URL. Please request a new magic link.');
      return;
    }

    // 2. Prevent the effect from executing twice during hot-reload or strict mode mounts.
    if (hasCalled.current) return;
    hasCalled.current = true;

    // 3. Define our asynchronous validation handshake process.
    const performVerification = async () => {
      // Launch a toast notification letting the user know we are verifying their visa voucher.
      const toastId = toast.loading('Decrypting your security token...');

      try {
        // Dispatch the token to our Server Action courier to post it to the Django server.
        const result = await verifyMagicLinkAction(token);

        if (result.success) {
          // If validated, show a success toast and update local states.
          toast.success(result.message || 'Authenticated successfully!', { id: toastId });
          setStatus('success');
          
          // Re-verify server state cookies and route the user to the protected home dashboard!
          router.refresh();
          router.push('/');
        } else {
          // If token signature is invalid, expired, or already used, report it.
          toast.error(result.message || 'Token verification failed.', { id: toastId });
          setStatus('error');
          setErrorMessage(result.message || 'This magic link is invalid or has expired.');
        }
      } catch (err: any) {
        // Catch any unforeseen network crashes or environment errors.
        toast.error('A connection failure occurred.', { id: toastId });
        setStatus('error');
        setErrorMessage('Failed to connect to the authentication server. Please check your network.');
      }
    };

    // 4. Trigger the verification process.
    performVerification();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-300">
      
      {/* Sleek, minimalist glassmorphism-style UI card */}
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl shadow-xl p-8 text-center space-y-6 relative overflow-hidden">
        
        {/* State 1: Verifying / Decrypting the stamp */}
        {status === 'verifying' && (
          <div className="py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-700/50">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Verifying Secure Link
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                Decrypting security credentials and establishing your session...
              </p>
            </div>
          </div>
        )}

        {/* State 2: Verification Succeeded */}
        {status === 'success' && (
          <div className="py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-900/30 animate-bounce">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Welcome Aboard!
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Authentication verified. Preparing your dashboard...
              </p>
            </div>
          </div>
        )}

        {/* State 3: Verification Failed */}
        {status === 'error' && (
          <div className="py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-900/30">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Authentication Failed
              </h2>
              <p className="text-sm text-red-500/80 font-medium px-4">
                {errorMessage}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => router.push('/login')}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-semibold text-sm transition-all duration-200 cursor-pointer shadow-md"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
