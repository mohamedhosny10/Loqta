# How to Get and Set SUPABASE_SERVICE_ROLE_KEY

## Why You Need This

The notification system requires the Supabase **service role key** (not the anon key) to create notifications from the server-side API. This key bypasses Row Level Security (RLS) policies, which is necessary for server-side operations.

## Steps to Get Your Service Role Key

1. **Go to Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign in to your account

2. **Select Your Project**
   - Click on your "Loqta" project

3. **Navigate to API Settings**
   - Click on **Settings** (gear icon) in the left sidebar
   - Click on **API** in the settings menu

4. **Copy the Service Role Key**
   - Scroll down to find the **service_role** key (NOT the anon key)
   - Click the **eye icon** to reveal it
   - Click **Copy** to copy the key
   - ⚠️ **WARNING**: This key has full access to your database. Keep it secret!

5. **Add to Your Project**
   - Open your `.env.local` file in the project root
   - Add this line:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
   - Replace `your_service_role_key_here` with the actual key you copied
   - Save the file

6. **Restart Your Development Server**
   - Stop your Next.js dev server (Ctrl+C)
   - Start it again with `npm run dev`
   - The new environment variable will be loaded

## Verify It's Working

After setting up the key:

1. Try clicking "I Lost This Item" on a found item
2. Check the browser console - you should see "✅ Notification created successfully"
3. The notification should appear in the bell icon for the item owner

## Security Note

- **Never commit** `.env.local` to git (it should already be in `.gitignore`)
- **Never share** your service role key publicly
- The service role key has admin access - only use it server-side
- In production, set this as an environment variable in your hosting platform

## Troubleshooting

If you still get errors after setting the key:

1. Make sure you copied the **service_role** key, not the **anon** key
2. Make sure the key starts with `eyJ...` (it's a JWT token)
3. Restart your dev server after adding the key
4. Check that `.env.local` is in the project root (same folder as `package.json`)
5. Check server logs for detailed error messages


