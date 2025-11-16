import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, validateSmtpConfig } from '@/lib/email';

// Helper function to send email to item owner using the dedicated email API
async function sendEmailToOwner({
  item,
  receiverId,
  senderId,
  itemType
}: {
  item: any;
  receiverId: string;
  senderId: string;
  itemType: 'lost' | 'found';
}) {
  // Get receiver email - priority: contact_email from items table, then auth email
  let receiverEmail: string | null = null;
  let receiverName = 'Loqta User';

  // First, try contact_email from the report form (this is what the user entered)
  if (item.contact_email && item.contact_email.trim() !== '') {
    receiverEmail = item.contact_email.trim();
    console.log('✅ Using contact_email from report form:', receiverEmail);
  } else {
    // Fallback: Get email from auth user
    console.log('⚠️ No contact_email found, trying auth email...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && serviceRoleKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        const { data: receiverData } = await supabaseAdmin.auth.admin.getUserById(receiverId);
        
        if (receiverData?.user?.email) {
          receiverEmail = receiverData.user.email;
          console.log('✅ Using auth email as fallback:', receiverEmail);
          
          // Get receiver name from profiles
          const { data: receiverProfile } = await supabaseAdmin
            .from('profiles')
            .select('full_name')
            .eq('id', receiverId)
            .single();
          
          receiverName = receiverProfile?.full_name || receiverData.user.user_metadata?.full_name || receiverEmail.split('@')[0];
        }
      } catch (error) {
        console.error('Error fetching receiver email:', error);
      }
    }
  }

  if (!receiverEmail) {
    throw new Error('Could not find receiver email. Please make sure the contact email is entered in the report form.');
  }

  // Validate SMTP configuration
  const smtpValidation = validateSmtpConfig();
  if (!smtpValidation.valid) {
    throw new Error(`Email service not configured. Missing required environment variables: ${smtpValidation.missing.join(', ')}`);
  }

  // Get sender information
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  let senderEmail = 'someone@loqta.app';
  let senderName = 'A Loqta user';
  
  if (supabaseUrl && serviceRoleKey) {
    try {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      const { data: senderData } = await supabaseAdmin.auth.admin.getUserById(senderId);
      if (senderData?.user?.email) {
        senderEmail = senderData.user.email;
        
        const { data: profileData } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', senderId)
          .single();
        
        senderName = profileData?.full_name || senderData.user.user_metadata?.full_name || senderEmail.split('@')[0];
      }
    } catch (error) {
      console.error('Error fetching sender info:', error);
    }
  }

  // Prepare email content
  const emailSubject = `${senderName} reached out about your ${itemType} item on Loqta`;
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Loqta</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello,</h2>
          
          <p style="color: #4b5563; font-size: 16px;">
            <strong>${senderName}</strong> (${senderEmail}) contacted you via Loqta regarding your <strong>${item.title}</strong>.
          </p>
          
          <div style="background: #f9fafb; border-left: 4px solid #00BFA6; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>Item Type:</strong> ${itemType === 'lost' ? 'Lost Item' : 'Found Item'}<br/>
              <strong>Item Title:</strong> ${item.title}
            </p>
          </div>
          
          <p style="color: #4b5563; font-size: 16px;">
            ${itemType === 'lost' 
              ? 'They believe they found your lost item and would like to connect with you.' 
              : 'They believe this is their lost item and would like to verify ownership.'}
          </p>
          
          <p style="color: #4b5563; font-size: 16px;">
            Please log in to your Loqta account to view their message and respond.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://loqta.app'}/items?itemId=${item.id}" 
               style="display: inline-block; background: #00BFA6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              View on Loqta
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            Best regards,<br/>
            <strong>The Loqta Team</strong>
          </p>
        </div>
      </body>
    </html>
  `;

  const emailText = `
Hello,

${senderName} (${senderEmail}) contacted you via Loqta regarding your ${item.title}.

Item Type: ${itemType === 'lost' ? 'Lost Item' : 'Found Item'}
Item Title: ${item.title}

${itemType === 'lost' 
  ? 'They believe they found your lost item and would like to connect with you.' 
  : 'They believe this is their lost item and would like to verify ownership.'}

Please log in to your Loqta account to view their message and respond.

Best regards,
The Loqta Team
  `.trim();

  // Send email using reusable email utility
  const emailResult = await sendEmail(receiverEmail, emailSubject, emailHtml, emailText);

  if (emailResult.success) {
    console.log('✅ Email sent successfully via SMTP:', {
      messageId: emailResult.messageId,
      to: receiverEmail,
      from: senderEmail
    });
    return { success: true, emailId: emailResult.messageId, service: 'smtp' };
  } else {
    console.error('❌ SMTP email sending failed:', emailResult.error);
    throw new Error(emailResult.details || emailResult.error || 'Failed to send email');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, userId } = body;

    if (!itemId || !userId) {
      return NextResponse.json(
        { error: 'Item ID and User ID are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the item details including handover location and contact email
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('id, title, user_id, category, handover_location_private, description, location, contact_email')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      console.error('❌ Error fetching item:', itemError);
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    console.log('📦 Item data retrieved:', {
      id: item.id,
      title: item.title,
      contact_email: item.contact_email,
      user_id: item.user_id
    });

    // Check if user is trying to interact with their own item
    if (item.user_id === userId) {
      return NextResponse.json(
        { error: 'You cannot interact with your own item' },
        { status: 400 }
      );
    }

    // Determine notification message and receiver based on item type
    let notificationMessage: string;
    let receiverId: string = item.user_id; // Default: notify the item owner

    if (item.category === 'lost') {
      // Lost item: Someone found it ("It's with me")
      // Notify the person who lost it (the owner)
      notificationMessage = `Someone found your lost item: ${item.title}`;
      receiverId = item.user_id; // The person who lost it
    } else {
      // Found item: Someone lost it ("Contact owner")
      // Notify the person who found it (the owner)
      notificationMessage = `Someone claims they lost the item: ${item.title}`;
      receiverId = item.user_id; // The person who found it
    }

    // Insert notification record using database function
    // This works even without service role key
    const { data: notificationData, error: notificationError } = await supabase
      .rpc('create_notification', {
        p_receiver_id: receiverId, // The item owner (person who lost or found it)
        p_sender_id: userId, // The person claiming/finding
        p_item_id: itemId,
        p_message: notificationMessage
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      console.error('Notification error details:', JSON.stringify(notificationError, null, 2));
      
      // Fallback: Try with service role key if available
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        console.log('Trying fallback with service role key...');
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
          .from('notifications')
          .insert({
            receiver_id: receiverId,
            sender_id: userId,
            item_id: itemId,
            message: notificationMessage,
            read: false
          })
          .select()
          .single();
        
        if (fallbackError) {
          return NextResponse.json(
            { 
              error: 'Failed to create notification',
              details: fallbackError.message,
              code: fallbackError.code
            },
            { status: 500 }
          );
        }
        console.log('✅ Notification created successfully (fallback):', fallbackData?.id);
      } else {
        return NextResponse.json(
          { 
            error: 'Failed to create notification',
            details: notificationError.message,
            code: notificationError.code,
            hint: 'Database function may need to be created. Check migration: create_notification_function'
          },
          { status: 500 }
        );
      }
    } else {
      console.log('✅ Notification created successfully:', notificationData);
    }

    // Automatically send email to the item owner
    try {
      await sendEmailToOwner({
        item,
        receiverId,
        senderId: userId,
        itemType: item.category
      });
    } catch (emailError) {
      console.error('Failed to send email (notification still created):', emailError);
      // Don't fail the request if email fails - notification was created successfully
    }

    // Return success message based on item type
    const successMessage = item.category === 'lost' 
      ? 'Notification sent! The person who lost this item has been notified via email.'
      : 'Your claim request has been sent. The finder has been notified via email.';

    return NextResponse.json({
      success: true,
      message: successMessage
    });
  } catch (error) {
    console.error('Error processing claim request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

