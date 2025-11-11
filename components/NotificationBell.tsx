"use client";
import { useState, useEffect, useRef } from 'react';
import { Bell, Mail, X } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ResultModal } from './ResultModal';

export type Notification = {
  id: string;
  receiver_id: string;
  sender_id: string;
  item_id: string;
  message: string;
  read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{ isOpen: boolean; success: boolean; message: string; details?: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabase();
    
    const initializeNotifications = async () => {
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      setIsAuthenticated(true);
      
      // Check if sound is enabled in localStorage
      const savedSoundSetting = localStorage.getItem('notificationSoundEnabled');
      if (savedSoundSetting !== null) {
        setSoundEnabled(savedSoundSetting === 'true');
      }

      // Sound is optional - don't check for file to avoid 404 errors
      // If you want sound, add notification.mp3 to public/sounds/ folder

      // Fetch initial notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        setNotifications(data || []);
      }
      setIsLoading(false);

      // Set up realtime subscription
      const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev].slice(0, 5));
          
          // Sound is optional - skip to avoid 404 errors
          // If you want sound, add notification.mp3 to public/sounds/ folder

          // Show toast notification
          if (typeof window !== 'undefined') {
            // Create a simple toast notification
            const toast = document.createElement('div');
            toast.className = 'fixed top-20 right-4 bg-accent text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
            toast.textContent = 'Someone is requesting info about your found item!';
            document.body.appendChild(toast);
            
            setTimeout(() => {
              toast.style.animation = 'slide-out 0.3s ease-out';
              setTimeout(() => toast.remove(), 300);
            }, 3000);
          }
        }
      )
      .subscribe();

      return () => {
        supabase.removeChannel(channel);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    };

    initializeNotifications();
  }, [soundEnabled, router]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (notificationId: string) => {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('receiver_id', user.id)
      .eq('read', false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    setIsOpen(false);
    setSelectedNotification(notification);
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!selectedNotification) return;

    setIsSendingEmail(true);
    try {
      console.log('Sending email for notification:', selectedNotification.id);
      const response = await fetch('/api/send-notification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: selectedNotification.id,
          itemId: selectedNotification.item_id,
          receiverId: selectedNotification.receiver_id,
          senderId: selectedNotification.sender_id,
        }),
      });

      console.log('Email API response status:', response.status);
      const data = await response.json();
      console.log('Email API response data:', data);
      
      // Close the email option modal first
      setShowEmailModal(false);
      
      // Small delay to ensure modal closes before showing result
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if response was successful
      if (response.ok) {
        // Check if data.success exists (for Resend/SendGrid) or if there's no error
        if (data.success !== false && !data.error) {
          setSelectedNotification(null);
          setEmailResult({
            isOpen: true,
            success: true,
            message: 'Email sent successfully!',
            details: undefined // Don't show technical details
          });
        } else {
          // Response was OK but there's an error in the data
          const errorMsg = data.error || 'Failed to send email';
          const hint = data.hint || '';
          const details = data.details || '';
          setEmailResult({
            isOpen: true,
            success: false,
            message: errorMsg,
            details: `${hint ? hint + (details ? '\n\n' : '') : ''}${details || 'Please check your email service configuration.'}`
          });
        }
      } else {
        // Response was not OK
        const errorMsg = data.error || 'Failed to send email';
        const hint = data.hint || '';
        const details = data.details || '';
        setEmailResult({
          isOpen: true,
          success: false,
          message: errorMsg,
          details: `${hint ? hint + (details ? '\n\n' : '') : ''}${details || 'Please check your email service configuration.'}`
        });
      }
    } catch (error) {
      console.error('Email send error:', error);
      setShowEmailModal(false);
      setEmailResult({
        isOpen: true,
        success: false,
        message: 'An error occurred while sending the email',
        details: error instanceof Error ? error.message : 'Please try again or check your email service configuration.'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSkipEmail = () => {
    setShowEmailModal(false);
    setSelectedNotification(null);
    router.push(`/items`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside the notification dropdown
      if (!target.closest('.notification-dropdown') && !target.closest('button[aria-label="Notifications"]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-accent hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-200">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm text-accent hover:underline"
              >
                View All
              </Link>
            </div>
          </div>
      )}

      {/* Email Option Modal */}
      {showEmailModal && selectedNotification && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
          {/* Full backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowEmailModal(false)}
            style={{ zIndex: 1 }}
          />
          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 mx-auto" style={{ zIndex: 2 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Send Email Notification?</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Would you like to send an email notification to the finder with the handover location?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSkipEmail}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSendingEmail}
              >
                Skip
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="flex-1 px-4 py-2 bg-accent text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSendingEmail ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Result Modal */}
      {emailResult && (
        <ResultModal
          isOpen={emailResult.isOpen}
          onClose={() => setEmailResult(null)}
          type={emailResult.success ? 'success' : 'error'}
          title={emailResult.success ? 'Email Sent' : 'Email Failed'}
          message={emailResult.message}
          details={emailResult.details}
        />
      )}
    </div>
  );
}

