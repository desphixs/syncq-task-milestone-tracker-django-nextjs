'use client';

// Import necessary React and third-party hooks.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

// Import our secure Next.js Server Action for handling logins.
import { loginAction } from '@/app/actions/auth';
// Import our type-safe environment configurations to safely read client IDs.
import { env } from '@/app/env';

// Import modern icons from lucide-react.
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Shield, Sparkles, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ZOD VALIDATION SCHEMAS
 * 
 * We define the rules for each authentication method.
 * For now, only the 'password' method is fully wired to the backend actions.
 */
const passwordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email address is required.' })
    .email({ message: 'Please enter a valid email address (e.g., you@example.com).' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long.' }),
});

const emailOnlySchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email address is required.' })
    .email({ message: 'Please enter a valid email address.' }),
});

const otpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, { message: 'OTP must be exactly 6 digits.' }),
});

// Infer TypeScript types from our Zod schemas.
type PasswordFormValues = z.infer<typeof passwordSchema>;
type EmailOnlyFormValues = z.infer<typeof emailOnlySchema>;
type OtpVerifyFormValues = z.infer<typeof otpVerifySchema>;

export default function LoginPage() {
  const router = useRouter();

  // State for toggling active tab: 'password', 'magic_link', or 'otp'
  const [method, setMethod] = useState<'password' | 'magic_link' | 'otp'>('password');
  
  // Stateful feedback loops for raw mock UI states.
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');

  // Password visibility controls.
  const [showPassword, setShowPassword] = useState(false);
  
  // Submit state loader.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize react-hook-form instances for the different forms.
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: '', password: '' },
  });

  const emailForm = useForm<EmailOnlyFormValues>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: '' },
  });

  const otpForm = useForm<OtpVerifyFormValues>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { email: '', otp: '' },
  });

  /**
   * EMAIL & PASSWORD SUBMISSION (FUNCTIONAL)
   * 
   * Handshakes directly with our Next.js Server Action and updates toast status.
   */
  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setIsSubmitting(true);
    const toastId = toast.loading('Verifying your credentials...');

    try {
      const result = await loginAction(values);

      if (result.success) {
        toast.success(result.message || 'Welcome back!', { id: toastId });
        router.refresh();
        router.push('/');
      } else {
        toast.error(result.message || 'Failed to authenticate.', { id: toastId });
      }
    } catch (err: any) {
      toast.error('A connection error occurred.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * MAGIC LINK REQUEST (RAW UI STUB)
   * 
   * Simulates the magic link workflow visually on the client side.
   */
  const onMagicLinkRequest = async (values: EmailOnlyFormValues) => {
    setIsSubmitting(true);
    const toastId = toast.loading('Sending secure magic link link...');
    
    // Simulate API delay.
    setTimeout(() => {
      toast.success('Magic link dispatched to your inbox!', { id: toastId });
      setMagicLinkSent(true);
      setIsSubmitting(false);
    }, 1500);
  };

  /**
   * OTP GENERATION REQUEST (RAW UI STUB)
   * 
   * Simulates sending a verification OTP on the client side.
   */
  const onOtpRequest = async (values: EmailOnlyFormValues) => {
    setIsSubmitting(true);
    const toastId = toast.loading('Generating secure verification OTP code...');

    setTimeout(() => {
      toast.success('6-digit code sent to your email!', { id: toastId });
      setOtpEmail(values.email);
      otpForm.setValue('email', values.email);
      setOtpSent(true);
      setIsSubmitting(false);
    }, 1500);
  };

  /**
   * OTP CODE VERIFICATION (RAW UI STUB)
   * 
   * Simulates verifying an OTP code.
   */
  const onOtpVerify = async (values: OtpVerifyFormValues) => {
    setIsSubmitting(true);
    const toastId = toast.loading('Verifying security token...');

    setTimeout(() => {
      toast.error('OTP feature is not fully wired to the backend in this phase.', { id: toastId });
      setIsSubmitting(false);
    }, 1500);
  };

  /**
   * SOCIAL LOGIN DISPATCHER
   * 
   * Analogy:
   * Think of this like buying a train ticket to a neighboring county.
   * Clicking the button doesn't log you in directly; it routes your browser to the partner county
   * desk (GitHub's Authorization portal), passing our unique Club Passport ID (Client ID) and a return address.
   * Once you are authenticated there, GitHub flies you back to our custom return desk callback url.
   */
  const handleSocialLogin = (provider: 'google' | 'github') => {
    if (provider === 'github') {
      const clientId = env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      const redirectUri = `${env.NEXT_PUBLIC_REDIRECT_URI}/github`;
      
      if (!clientId) {
        toast.error("GitHub Client ID is not configured in the environment.");
        return;
      }
      
      // Dispatch redirect to GitHub OAuth portal.
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
    } else {
      toast.info("Google OAuth is not fully configured in this phase.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-300">
      
      {/* Container holding the modern aesthetic form card */}
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl shadow-xl shadow-zinc-100/50 dark:shadow-none p-8 relative overflow-hidden">
        
        {/* Header branding */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 font-bold text-xl mb-1 shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to continue to your dashboard.
          </p>
        </div>

        {/* TABS FOR SELECTING LOGIN METHOD */}
        {(!magicLinkSent && !otpSent) && (
          <div className="mb-6 flex gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 p-1 border border-zinc-200/30 dark:border-zinc-800/30">
            <button
              onClick={() => { setMethod('password'); }}
              className={`flex-1 rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                method === 'password'
                  ? 'bg-white dark:bg-white text-zinc-950 dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => { setMethod('magic_link'); }}
              className={`flex-1 rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                method === 'magic_link'
                  ? 'bg-white dark:bg-white text-zinc-950 dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Magic Link
            </button>
            <button
              onClick={() => { setMethod('otp'); }}
              className={`flex-1 rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                method === 'otp'
                  ? 'bg-white dark:bg-white text-zinc-950 dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              OTP
            </button>
          </div>
        )}

        {/* ==================== FORM: PASSWORD (FUNCTIONAL) ==================== */}
        {method === 'password' && (
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4" noValidate>
            
            {/* Email input field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="email" 
                className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
              >
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors duration-200">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  {...passwordForm.register('email')}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  aria-invalid={passwordForm.formState.errors.email ? 'true' : 'false'}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-950 text-sm font-medium transition-all duration-200 outline-none
                    ${passwordForm.formState.errors.email 
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/30' 
                      : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-955 dark:focus:border-zinc-200 focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-900/30'
                    }`}
                />
              </div>
              {passwordForm.formState.errors.email && (
                <p className="text-xs font-medium text-red-500 mt-1 pl-1">
                  {passwordForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password input field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="password" 
                  className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
                >
                  Password
                </label>
                <Link 
                  href="/auth/password-reset" 
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-955 dark:hover:text-white transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors duration-200">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  {...passwordForm.register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  aria-invalid={passwordForm.formState.errors.password ? 'true' : 'false'}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-950 text-sm font-medium transition-all duration-200 outline-none
                    ${passwordForm.formState.errors.password 
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/30' 
                      : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-900/30'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.password && (
                <p className="text-xs font-medium text-red-500 mt-1 pl-1">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>
        )}

        {/* ==================== FORM: MAGIC LINK (RAW UI) ==================== */}
        {method === 'magic_link' && (
          <div>
            {!magicLinkSent ? (
              <form onSubmit={emailForm.handleSubmit(onMagicLinkRequest)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors duration-200">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      {...emailForm.register('email')}
                      type="email"
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm font-medium transition-all duration-200 outline-none focus:border-zinc-900 dark:focus:border-zinc-200 focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-900/30"
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-xs font-medium text-red-500 mt-1 pl-1">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Send Magic Link</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="py-4 text-center space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-700/50">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Check your inbox</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    We've sent a login link to <strong className="text-zinc-900 dark:text-white">{emailForm.getValues('email')}</strong>.
                  </p>
                </div>
                <button
                  onClick={() => setMagicLinkSent(false)}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:underline transition-colors"
                >
                  Try a different email
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== FORM: OTP (RAW UI) ==================== */}
        {method === 'otp' && (
          <div>
            {!otpSent ? (
              <form onSubmit={emailForm.handleSubmit(onOtpRequest)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors duration-200">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      {...emailForm.register('email')}
                      type="email"
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm font-medium transition-all duration-200 outline-none focus:border-zinc-900 dark:focus:border-zinc-200 focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-900/30"
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-xs font-medium text-red-500 mt-1 pl-1">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Send OTP Code</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={otpForm.handleSubmit(onOtpVerify)} className="space-y-4">
                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Enter the 6-digit code sent to <br />
                  <strong className="text-zinc-900 dark:text-white">{otpEmail}</strong>
                </p>

                <input type="hidden" {...otpForm.register('email')} />

                <div className="space-y-1.5">
                  <input
                    {...otpForm.register('otp')}
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    className="w-full text-center text-2xl font-bold tracking-[0.5em] py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-zinc-200 focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-900/30"
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="text-center text-xs font-medium text-red-500">{otpForm.formState.errors.otp.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Verify OTP Code</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-center text-xs font-semibold text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:underline transition-colors"
                >
                  Use a different email
                </button>
              </form>
            )}
          </div>
        )}

        {/* SOCIAL LOGIN DIVIDER */}
        {(!magicLinkSent && !otpSent) && (
          <>
            <div className="my-6 flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Or continue with</span>
              <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* GOOGLE BUTTON */}
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="flex items-center justify-center gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-white py-2.5 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-100 cursor-pointer shadow-sm"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-950">Google</span>
              </button>

              {/* GITHUB BUTTON */}
              <button
                type="button"
                onClick={() => handleSocialLogin('github')}
                className="flex items-center justify-center gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-white py-2.5 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-100 cursor-pointer shadow-sm"
              >
                <svg className="h-4 w-4 text-zinc-900 dark:text-zinc-950" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-950">GitHub</span>
              </button>
            </div>
          </>
        )}

        {/* Bottom link to Register */}
        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Don't have an account yet?{' '}
            <Link 
              href="/register" 
              className="text-zinc-950 dark:text-white hover:underline font-bold"
            >
              Sign Up Free
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
