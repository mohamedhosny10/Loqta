# Notification System Setup Guide

## ✅ What's Been Implemented

1. **Database Table**: `notifications` table created with RLS policies
2. **API Routes**: 
   - `/api/claim-item` - Creates notification when someone claims an item
   - `/api/send-notification-email` - Sends email notifications
3. **UI Components**:
   - `NotificationBell` - Bell icon with badge and dropdown
   - Notifications page at `/notifications`
4. **Realtime**: Supabase realtime subscriptions for instant notifications
5. **Sound Support**: Audio notification support (requires sound file)

## 🔧 Email Service Configuration

The email notification system supports multiple providers. Choose one:

### Option 1: Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to `.env.local`:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=Loqta <noreply@yourdomain.com>
```

### Option 2: SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key
3. Add to `.env.local`:
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Option 3: Development Mode

If no email service is configured, emails will be logged to the console for development.

## 🔊 Sound Notification Setup

1. Add a notification sound file to `public/sounds/notification.mp3`
   - Duration: 0.5-2 seconds
   - Format: MP3, WAV, or OGG
   - You can find free sounds at [freesound.org](https://freesound.org)

2. The sound will play automatically when new notifications arrive (if enabled)

3. Users can toggle sound in their browser settings (stored in localStorage)

## 🔒 Security

- **RLS Policies**: Users can only see their own notifications
- **Private Data**: `handover_location_private` is never exposed in emails or public APIs
- **Authentication**: All notification endpoints require authentication

## 📧 Email Template

The email sent to finders includes:
- Subject: "Someone requested info about your found item"
- Body: Friendly message with item name
- No sensitive information (handover location is never included)

## 🎨 Features

- **Real-time Updates**: Notifications appear instantly via Supabase Realtime
- **Badge Counter**: Shows unread count on bell icon
- **Dropdown**: Latest 5 notifications in navbar
- **Full Page**: All notifications at `/notifications`
- **Mark as Read**: Individual or bulk mark as read
- **Sound Alerts**: Optional audio notifications
- **Toast Popups**: Visual alerts for new notifications

## 🚀 Testing

1. Create a found item as User A
2. Sign in as User B
3. Click "I Lost This Item" on User A's found item
4. Check User A's notifications (bell icon should show badge)
5. Check User A's email inbox
6. Verify realtime updates work (open two browsers)

## 📝 Next Steps (Optional Enhancements)

- Add notification preferences page
- Add email templates customization
- Add notification filtering (by type, date, etc.)
- Add push notifications for mobile
- Add notification history/archiving


