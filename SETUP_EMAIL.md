# Email Service Setup - Quick Start

## The Error You're Seeing

If you see: "Add RESEND_API_KEY or SENDGRID_API_KEY to your .env.local file to enable email sending"

This means you need to configure an email service. Follow the steps below.

## Option 1: Resend (Recommended - Easiest)

### Step 1: Get Resend API Key
1. Go to https://resend.com and sign up (free - 3,000 emails/month)
2. After login, go to **API Keys** → **Create API Key**
3. Copy the key (starts with `re_`)

### Step 2: Create .env.local File
Create a file named `.env.local` in your project root (`D:\Projects\Loqta\.env.local`) with this content:

```env
# Your existing Supabase keys (keep these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Add Resend configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**For testing**, you can use `onboarding@resend.dev` as the FROM email (Resend provides this for testing).

**For production**, verify your domain in Resend and use: `Loqta <noreply@yourdomain.com>`

### Step 3: Restart Your Server
```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

## Option 2: SendGrid (Alternative)

### Step 1: Get SendGrid API Key
1. Go to https://sendgrid.com and sign up (free - 100 emails/day)
2. Go to **Settings** → **API Keys** → **Create API Key**
3. Copy the key (starts with `SG.`)

### Step 2: Create .env.local File
```env
# Your existing Supabase keys (keep these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Add SendGrid configuration
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Step 3: Restart Your Server
```bash
npm run dev
```

## Quick Test

After setup:
1. Create a found item with a contact email
2. Have someone claim it
3. Click the notification bell → Send Email
4. You should see a success modal
5. Check the recipient's inbox

## Troubleshooting

- ✅ Make sure `.env.local` is in the project root (same folder as `package.json`)
- ✅ Restart your dev server after creating/editing `.env.local`
- ✅ Check that your API key is correct (no extra spaces)
- ✅ For Resend: Use `onboarding@resend.dev` for testing
- ✅ Check browser console for detailed error messages

## Need More Help?

See `EMAIL_SETUP.md` for detailed instructions.


