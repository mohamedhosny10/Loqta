import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiverId, senderId, itemId, itemTitle, itemDescription, itemLocation, handoverLocation, contactEmail, notificationId } = body;

    // If notificationId is provided, fetch item details from notification
    let finalItemId = itemId;
    let finalReceiverId = receiverId;
    let finalSenderId = senderId;

    // Get Supabase config
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    if (notificationId && !itemId) {
      // Fetch notification to get item details
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .select('item_id, receiver_id, sender_id')
        .eq('id', notificationId)
        .single();

      if (notifError || !notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      finalItemId = notification.item_id;
      finalReceiverId = notification.receiver_id;
      finalSenderId = notification.sender_id;
    }

    if (!finalReceiverId || !finalSenderId || !finalItemId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get item details including contact email and handover location
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('id, title, description, location, handover_location_private, contact_email')
      .eq('id', finalItemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Get receiver (finder) email
    // Priority: 1. contact_email from items table (the email from report form), 2. auth email from user
    let receiverEmail: string | null = null;
    let receiverName: string = 'User';

    // First, try to use contact_email from the report form (this is what the user entered)
    if (item.contact_email && item.contact_email.trim() !== '') {
      receiverEmail = item.contact_email.trim();
      receiverName = item.contact_email.split('@')[0] || 'User';
      console.log('✅ Using contact email from report form:', receiverEmail);
    } else {
      // Fallback: Get email from auth user (only if service role key is available)
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        try {
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
          const { data: receiverData, error: receiverError } = await supabaseAdmin.auth.admin.getUserById(finalReceiverId);
          
          if (!receiverError && receiverData?.user?.email) {
            receiverEmail = receiverData.user.email;
            receiverName = receiverData.user.user_metadata?.full_name || receiverData.user.email?.split('@')[0] || 'User';
            console.log('Using auth email as fallback:', receiverEmail);
          }
        } catch (error) {
          console.error('Error fetching receiver with admin API:', error);
        }
      }
    }

    if (!receiverEmail) {
      console.error('=== EMAIL ERROR ===');
      console.error('Item ID:', finalItemId);
      console.error('Contact Email from item:', item.contact_email || 'NOT SET');
      console.error('Receiver ID:', finalReceiverId);
      console.error('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
      console.error('===================');
      
      return NextResponse.json({ 
        error: 'Could not find receiver email. Please make sure the finder entered a contact email in the report form.',
        hint: 'The contact email field in the report form must be filled out to send emails.'
      }, { status: 404 });
    }

    // Use item details from database
    const finalItemTitle = item.title;
    const finalItemDescription = item.description;
    const finalItemLocation = item.location;
    const finalHandoverLocation = item.handover_location_private;

    // Prepare email content with handover location
    const emailSubject = 'Someone requested info about your found item';
    
    let emailBody = `
Hi ${receiverName},

Someone on Loqta believes they lost the item you found:

Item: ${finalItemTitle}
${finalItemDescription ? `Description: ${finalItemDescription}` : ''}
${finalItemLocation ? `General Location: ${finalItemLocation}` : ''}

`;

    // Include handover location if available
    if (finalHandoverLocation) {
      emailBody += `
HANDOVER LOCATION:
${finalHandoverLocation}

`;
    }

    emailBody += `
Please log in to Loqta to view their message and verify ownership.

- The Loqta Team
    `.trim();

    // Send email using Resend, SendGrid, or Nodemailer
    // For now, we'll use a simple approach - you can integrate with your preferred service
    
    // Option 1: Using Resend (recommended)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'Loqta <noreply@loqta.app>',
            to: receiverEmail,
            subject: emailSubject,
            text: emailBody,
          }),
        });

        const resendData = await resendResponse.json();

        if (resendResponse.ok) {
          console.log('✅ Email sent successfully via Resend to:', receiverEmail);
          return NextResponse.json({ 
            success: true, 
            message: 'Email sent successfully via Resend',
            emailId: resendData.id 
          });
        } else {
          console.error('❌ Resend API error:', resendData);
          // Continue to try SendGrid or return error
        }
      } catch (resendError) {
        console.error('❌ Resend API request failed:', resendError);
        // Continue to try SendGrid
      }
    }

    // Option 2: Using SendGrid
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (sendgridApiKey) {
      try {
        const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: receiverEmail }],
              subject: emailSubject,
            }],
            from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@loqta.app' },
            content: [{
              type: 'text/plain',
              value: emailBody,
            }],
          }),
        });

        if (sendgridResponse.ok) {
          console.log('✅ Email sent successfully via SendGrid to:', receiverEmail);
          return NextResponse.json({ 
            success: true, 
            message: 'Email sent successfully via SendGrid' 
          });
        } else {
          const sendgridError = await sendgridResponse.text();
          console.error('❌ SendGrid API error:', sendgridError);
          return NextResponse.json({ 
            error: 'Failed to send email via SendGrid',
            details: sendgridError,
            hint: 'Please check your SendGrid API key and configuration.'
          }, { status: 500 });
        }
      } catch (sendgridError) {
        console.error('❌ SendGrid API request failed:', sendgridError);
        return NextResponse.json({ 
          error: 'Failed to send email',
          details: sendgridError instanceof Error ? sendgridError.message : 'Unknown error',
          hint: 'Please check your email service configuration.'
        }, { status: 500 });
      }
    }

    // Option 3: No email service configured
    console.error('❌ No email service configured');
    console.log('=== EMAIL NOTIFICATION (Development Mode - NOT SENT) ===');
    console.log('To:', receiverEmail);
    console.log('Subject:', emailSubject);
    console.log('Body:', emailBody);
    console.log('==============================================');

    return NextResponse.json({ 
      error: 'Email service not configured',
      message: 'No email service is configured. Please set RESEND_API_KEY or SENDGRID_API_KEY in your environment variables.',
      hint: 'Add RESEND_API_KEY or SENDGRID_API_KEY to your .env.local file to enable email sending.'
    }, { status: 500 });
  } catch (error) {
    console.error('Error sending notification email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

