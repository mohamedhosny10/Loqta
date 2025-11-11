"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { NotificationBell } from './NotificationBell';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabase();
    
    // Check initial auth state
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email || null);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push('/signin');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/90 backdrop-blur shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center" prefetch={true}>
          <Image 
            src="/Logo B.png" 
            alt="Loqta" 
            width={130} 
            height={50} 
            priority
          />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:opacity-80 transition-opacity" prefetch={true}>Home</Link>
          <Link href="/items" className="hover:opacity-80 transition-opacity" prefetch={true}>Browse</Link>
          {isAuthenticated && (
            <Link href="/my-items" className="hover:opacity-80 transition-opacity" prefetch={true}>My Items</Link>
          )}
          <a href="#contact" className="hover:opacity-80 transition-opacity">Contact</a>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="flex items-center gap-2 text-accent">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="text-xs">{userEmail?.split('@')[0] || 'User'}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity text-gray-600"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/signin" className="hover:opacity-80 transition-opacity">Sign in</Link>
          )}
          <Link href="/report" className="ml-2 inline-block bg-primary text-black px-4 py-2 rounded-full font-semibold transition-transform hover:scale-[1.03] shadow-sm">Report Item</Link>
        </nav>
        <div className="flex items-center gap-3 md:hidden">
          {isAuthenticated !== null && (
            <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-accent' : 'bg-gray-400'}`} />
          )}
          <button aria-label="Open menu" className="p-2" onClick={() => setOpen((v) => !v)}>
          {open ? <X /> : <Menu />}
        </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3 text-sm font-medium">
            <Link href="/" onClick={() => setOpen(false)} prefetch={true}>Home</Link>
            <Link href="/items" onClick={() => setOpen(false)} prefetch={true}>Browse</Link>
            {isAuthenticated && (
              <Link href="/my-items" onClick={() => setOpen(false)} prefetch={true}>My Items</Link>
            )}
            <a href="#contact" onClick={() => setOpen(false)} className="scroll-smooth">Contact</a>
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 text-accent py-2">
                  <User className="w-4 h-4" />
                  <span>{userEmail || 'User'}</span>
                </div>
                <button
                  onClick={() => {
                    setOpen(false);
                    handleSignOut();
                  }}
                  className="flex items-center gap-2 text-left text-gray-600 py-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <Link href="/signin" onClick={() => setOpen(false)}>Sign in</Link>
            )}
            <Link href="/report" onClick={() => setOpen(false)} className="bg-primary text-black px-4 py-2 rounded-full font-semibold text-center">Report Item</Link>
          </div>
        </div>
      )}
    </header>
  );
}


