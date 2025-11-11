# 🔧 Quick Fix: Server Configuration Error

## The Problem
You're seeing "Server configuration error" because `SUPABASE_SERVICE_ROLE_KEY` is missing from your `.env.local` file.

## ⚡ Quick Solution (2 minutes)

### Step 1: Get Your Service Role Key

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Sign in

2. **Select Your Project**
   - Click on "Loqta" project

3. **Go to API Settings**
   - Click **Settings** (⚙️ icon) in left sidebar
   - Click **API** in the menu

4. **Copy Service Role Key**
   - Scroll down to find **"service_role"** key
   - ⚠️ **IMPORTANT**: Use the **service_role** key, NOT the anon key!
   - Click the 👁️ eye icon to reveal it
   - Click **Copy** button
   - The key looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long)

### Step 2: Add to Your Project

1. **Create/Edit `.env.local` file**
   - In your project root (same folder as `package.json`)
   - Create file named `.env.local` if it doesn't exist

2. **Add the key**
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_copied_key_here
   ```
   - Replace `your_copied_key_here` with the actual key you copied
   - Make sure there are NO spaces around the `=`

3. **Your `.env.local` should look like:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://gyjzcrggifdtkqpordfl.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 3: Restart Server

1. **Stop your dev server** (press `Ctrl+C` in terminal)
2. **Start it again**: `npm run dev`
3. **Try again** - Click "I Lost This Item" on a found item

## ✅ Verify It's Working

After restarting:
- Click "I Lost This Item" on any found item
- Check terminal/console - you should see: `✅ Notification created successfully`
- The notification should appear in the bell icon 🔔

## 🆘 Still Not Working?

1. **Check the key is correct:**
   - Make sure you copied the **service_role** key, not anon key
   - Key should be very long (starts with `eyJ...`)
   - No extra spaces or quotes

2. **Check file location:**
   - `.env.local` must be in project root (same folder as `package.json`)
   - File name is exactly `.env.local` (with the dot at start)

3. **Check you restarted:**
   - Environment variables only load when server starts
   - Must restart after adding/changing `.env.local`

4. **Check server logs:**
   - Look for error messages in terminal
   - Should see "✅ Notification created successfully" if working

## 🔒 Security Note

- **Never commit** `.env.local` to git (it's in `.gitignore`)
- **Never share** your service role key publicly
- This key has admin access - keep it secret!


