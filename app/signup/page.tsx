"use client";
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getSupabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Upload, X, User } from 'lucide-react';
import { Toast, type ToastType } from '@/components/Toast';
import { Modal } from '@/components/Modal';

const schema = z.object({
  full_name: z.string().min(2, 'Enter your name').max(80),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type Values = z.infer<typeof schema>;

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setToast({ message: 'Please select an image file', type: 'error' });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: 'Image size must be less than 5MB', type: 'error' });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    const supabase = getSupabase();
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return null;
    }

    // Get public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const onSubmit = async ({ full_name, email, password }: Values) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setToast({ message: error.message, type: 'error' });
      return;
    }
    // If immediately signed in (email confirm disabled), update profile with full_name and avatar
    if (data.session && data.user) {
      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(data.user.id);
      }
      
      await supabase.from('profiles').update({ 
        full_name,
        avatar_url: avatarUrl
      }).eq('id', data.user.id);
      
      setToast({ message: 'Account created! Redirecting…', type: 'success' });
      setTimeout(() => router.push('/items'), 600);
    } else {
      // If email confirmation is required, the trigger already created a profile row with email
      // full_name and avatar will be saved after the first sign-in
      setToast({ message: 'Check your email to confirm your account, then sign in.', type: 'info' });
    }
  };

  const handleGoogleSignUp = async () => {
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

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card with modern styling */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Create account</h1>
            <p className="text-gray-600 text-sm">Join us today! Create your account to get started.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Profile Picture Upload (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarPreview ? (
                    <div className="relative">
                      <Image
                        src={avatarPreview}
                        alt="Avatar preview"
                        width={80}
                        height={80}
                        className="rounded-full object-cover border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        aria-label="Remove avatar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors text-sm font-medium text-gray-700"
                  >
                    <Upload className="w-4 h-4" />
                    {avatarPreview ? 'Change Picture' : 'Upload Picture'}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 5MB.</p>
                </div>
              </div>
            </div>

            {/* Full Name Field */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="full_name"
                type="text"
                {...register('full_name')}
                className={`w-full border rounded-lg px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                  errors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                placeholder="Enter your full name"
              />
              {errors.full_name && (
                <p className="text-red-600 text-sm mt-1.5 flex items-center gap-1">
                  {errors.full_name.message}
                </p>
              )}
            </div>

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

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-black px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? 'Creating…' : 'Sign up'}
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

          {/* Google Sign Up Button */}
          <button
            onClick={handleGoogleSignUp}
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

          {/* Sign In Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link href="/signin" className="text-accent hover:text-accent/80 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* OAuth Loading Modal */}
      <Modal isOpen={showOAuthModal} onClose={() => setShowOAuthModal(false)} title="Signing up with Google">
        <div className="text-center py-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600">Redirecting to Google sign-up...</p>
          <p className="text-sm text-gray-500 mt-2">Please complete the sign-up process in the popup window.</p>
        </div>
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


