"use client";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getSupabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Toast, type ToastType } from '@/components/Toast';
import { Modal } from '@/components/Modal';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type Values = z.infer<typeof schema>;

export default function SignInPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email, password }: Values) => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setToast({ message: error.message, type: 'error' });
      return;
    }
    setToast({ message: 'Signed in successfully. Redirecting...', type: 'success' });
    setTimeout(() => router.push('/items'), 600);
  };

  const handleGoogleSignIn = async () => {
    setIsOAuthLoading(true);
    setShowOAuthModal(true);
    const supabase = getSupabase();
    // Use environment variable if available, otherwise use current origin
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://loqtalf.vercel.app');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${redirectUrl}/items`
      }
    });
    if (error) {
      setShowOAuthModal(false);
      setIsOAuthLoading(false);
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      setToast({ message: 'Please enter your email address', type: 'error' });
      return;
    }

    setIsSendingReset(true);
    const supabase = getSupabase();
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://loqtalf.vercel.app');
    const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
      redirectTo: `${redirectUrl}/reset-password`
    });

    setIsSendingReset(false);
    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setToast({ 
        message: 'Password reset email sent! Please check your inbox.', 
        type: 'success' 
      });
      setShowForgotPasswordModal(false);
      setForgotPasswordEmail('');
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card with modern styling */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Sign in</h1>
            <p className="text-gray-600 text-sm">Welcome back! Please sign in to continue.</p>
          </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
        <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`w-full border rounded-lg px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1.5 flex items-center gap-1">
                  {errors.email.message}
                </p>
              )}
        </div>

            {/* Password Field */}
        <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`w-full border rounded-lg px-4 py-3 pr-10 transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm mt-1.5 flex items-center gap-1">
                  {errors.password.message}
                </p>
              )}
        </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-accent hover:text-accent/80 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-black px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isOAuthLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Google</span>
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="text-accent hover:text-accent/80 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* OAuth Loading Modal */}
      <Modal isOpen={showOAuthModal} onClose={() => setShowOAuthModal(false)} title="Signing in with Google">
        <div className="text-center py-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600">Redirecting to Google sign-in...</p>
          <p className="text-sm text-gray-500 mt-2">Please complete the sign-in process in the popup window.</p>
        </div>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal isOpen={showForgotPasswordModal} onClose={() => setShowForgotPasswordModal(false)} title="Reset Password">
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="reset-email"
              type="email"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Enter your email"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              We'll send you a link to reset your password.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForgotPasswordModal(false);
                setForgotPasswordEmail('');
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSendingReset}
              className="flex-1 bg-primary text-black px-4 py-2 rounded-lg font-semibold hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSendingReset ? 'Sending…' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}


