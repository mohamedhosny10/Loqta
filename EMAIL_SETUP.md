# Email Service Setup Guide

This guide will help you set up email sending for the Loqta application. You can use either **Resend** (recommended) or **SendGrid**.

## Quick Setup with Resend (Recommended)

### Step 1: Create a Resend Account
1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (you get 3,000 emails/month free)
3. Verify your email address

### Step 2: Get Your API Key
1. After logging in, go to **API Keys** in the sidebar
2. Click **Create API Key**
3. Give it a name (e.g., "Loqta Production")
4. Copy the API key (starts with `re_`)

### Step 3: Verify Your Domain (Optional but Recommended)
1. Go to **Domains** in Resend
2. Click **Add Domain**
3. Follow the DNS setup instructions to verify your domain
4. Once verified, you can use emails like `noreply@yourdomain.com`

**Note:** For testing, you can use Resend's default domain: `onboarding@resend.dev` (limited to 100 emails/day)

### Step 4: Configure Environment Variables
1. Create a `.env.local` file in your project root (copy from `.env.example`)
2. Add your Resend API key:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=Loqta <noreply@yourdomain.com>
   ```
   Or for testing:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```

### Step 5: Restart Your Development Server
```bash
npm run dev
```

## Alternative: Setup with SendGrid

### Step 1: Create a SendGrid Account
1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Sign up for a free account (100 emails/day free)

### Step 2: Get Your API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Give it a name and select **Full Access** or **Restricted Access** (Mail Send permission required)
4. Copy the API key (starts with `SG.`)

### Step 3: Verify Your Sender Identity
1. Go to **Settings** → **Sender Authentication**
2. Verify a Single Sender or Domain
3. Follow the verification steps

### Step 4: Configure Environment Variables
1. Create a `.env.local` file in your project root
2. Add your SendGrid API key:
   ```env
   SENDGRID_API_KEY=SG.your_api_key_here
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```

### Step 5: Restart Your Development Server
```bash
npm run dev
```

## Testing Email Sending

1. Make sure your `.env.local` file is configured
2. Restart your development server
3. Create a found item with a contact email
4. Have another user click "I Lost This Item"
5. Click on the notification and send an email
6. Check the recipient's inbox (and spam folder)

## Troubleshooting

### Email Not Sending
- ✅ Check that your API key is correct in `.env.local`
- ✅ Verify your domain/email is verified in your email service
- ✅ Check the browser console and server logs for error messages
- ✅ Make sure you restarted your dev server after adding environment variables
- ✅ For Resend: Check the Resend dashboard for delivery status
- ✅ For SendGrid: Check the SendGrid Activity Feed

### Common Errors
- **"Email service not configured"**: Your API key is missing or incorrect
- **"Invalid API key"**: Check that you copied the full API key
- **"Domain not verified"**: Verify your domain in Resend/SendGrid
- **"Rate limit exceeded"**: You've hit the free tier limits

## Security Notes

⚠️ **Important:**
- Never commit `.env.local` to git (it's already in `.gitignore`)
- Keep your API keys secret
- Use environment variables for all sensitive data
- Rotate your API keys if they're exposed

## Need Help?

- Resend Docs: https://resend.com/docs
- SendGrid Docs: https://docs.sendgrid.com
- Check the application logs for detailed error messages


