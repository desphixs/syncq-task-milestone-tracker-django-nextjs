'use client';

// Import necessary React and third-party hooks.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

// Import our secure Next.js Server Action for handling registrations.
import { registerAction } from '@/app/actions/auth';

// Import modern icons from lucide-react.
import { Mail, Lock, Eye, EyeOff, Loader2, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ZOD SCHEMA FOR CLIENT-SIDE REGISTRATION VALIDATION
 * 
 * Analogy:
 * Think of this Zod schema like a strict passport registration checklist.
 * Before we let the request fly to Django, we verify that:
 * 1. The full name is present and at least 2 characters.
 * 2. The email matches standard email syntax.
 * 3. The password has a strong layout of at least 8 characters.
 * 4. The confirmation password matches the password exactly.
 */
const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, { message: 'Full name must be at least 2 characters long.' }),
    email: z
      .string()
      .min(1, { message: 'Email address is required.' })
      .email({ message: 'Please enter a valid email address (e.g., you@example.com).' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long.' }),
    confirm_password: z
      .string()
      .min(1, { message: 'Please confirm your password.' }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match. Please verify your typing.',
    path: ['confirm_password'], // Binds the validation error directly to the confirm_password input field
  });

// Infer the TypeScript type from our Zod schema.
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  
  // State for toggling password fields visibility.
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for tracking form submission loader.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize react-hook-form with our Zod schema validator.
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  /**
   * FORM SUBMISSION HANDLER
   * 
   * Analogy:
   * When you click submit, our handler collects the validated data package,
   * runs the loading animation, passes the payload to our Next.js Server Action,
   * and pops up contextual floating toast alerts based on the outcome.
   */
  const onSubmit = async (values: RegisterFormValues) => {
    // 1. Activate the loading state spinner.
    setIsSubmitting(true);
    
    // Create a loading toast and save its ID.
    const toastId = toast.loading('Creating your secure account...');

    try {
      // 2. Invoke the Server Action to create the user in Django.
      const result = await registerAction(values);

      if (result.success) {
        // 3. Update the toast to show a success message.
        toast.success(result.message || 'Account created successfully!', { id: toastId });
        
        // 4. Redirect the user to the login page so they can sign in.
        router.push('/login');
      } else {
        // 5. Update the toast with a contextual error returned by the backend views.
        toast.error(result.message || 'Failed to register account.', { id: toastId });
      }
    } catch (err: any) {
      // 6. Handle unexpected network crashes.
      toast.error('A connection error occurred. Please check your internet connection.', { id: toastId });
    } finally {
      // 7. Deactivate the loading state spinner.
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-300">
      
      {/* Container holding the modern aesthetic form card */}
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl shadow-xl shadow-zinc-100/50 dark:shadow-none p-8 space-y-8 relative overflow-hidden">
        
        {/* Form header branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-black font-bold text-xl mb-2 shadow-md">
            <ShieldCheck className="w-6 h-6 text-white dark:text-zinc-950" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Create an Account
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sign up to build your secure dashboard boilerplate
          </p>
        </div>

        {/* Active form handling */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          
          {/* Full Name input field */}
          <div className="space-y-1.5">
            <label 
              htmlFor="full_name" 
              className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
            >
              Full Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors duration-200">
                <User className="w-4 h-4" />
              </div>
              <input
                {...register('full_name')}
                id="full_name"
                type="text"
                placeholder="Marcus Aurelius"
                aria-invalid={errors.full_name ? 'true' : 'false'}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-950 text-sm font-medium transition-all duration-200 outline-none
                  ${errors.full_name 
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/30' 
                    : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-900/30'
                  }`}
              />
            </div>
            {errors.full_name && (
              <p className="text-xs font-medium text-red-500 mt-1 pl-1">
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Email input field */}
          <div className="space-y-1.5">
            <label 
              htmlFor="email" 
              className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
            >
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors duration-200">
                <Mail className="w-4 h-4" />
              </div>
              <input
                {...register('email')}
                id="email"
                type="email"
                placeholder="you@example.com"
                aria-invalid={errors.email ? 'true' : 'false'}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-950 text-sm font-medium transition-all duration-200 outline-none
                  ${errors.email 
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/30' 
                    : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-900/30'
                  }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs font-medium text-red-500 mt-1 pl-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password input field */}
          <div className="space-y-1.5">
            <label 
              htmlFor="password" 
              className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
            >
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors duration-200">
                <Lock className="w-4 h-4" />
              </div>
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                aria-invalid={errors.password ? 'true' : 'false'}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-950 text-sm font-medium transition-all duration-200 outline-none
                  ${errors.password 
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/30' 
                    : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-900/30'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-red-500 mt-1 pl-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password input field */}
          <div className="space-y-1.5">
            <label 
              htmlFor="confirm_password" 
              className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
            >
              Confirm Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors duration-200">
                <Lock className="w-4 h-4" />
              </div>
              <input
                {...register('confirm_password')}
                id="confirm_password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                aria-invalid={errors.confirm_password ? 'true' : 'false'}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-950 text-sm font-medium transition-all duration-200 outline-none
                  ${errors.confirm_password 
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/30' 
                    : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-900/30'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-xs font-medium text-red-500 mt-1 pl-1">
                {errors.confirm_password.message}
              </p>
            )}
          </div>

          {/* Submit button with loader state */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 mt-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </>
            )}
          </button>

        </form>

        {/* Bottom utility links */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="text-zinc-950 dark:text-white hover:underline font-semibold"
            >
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
