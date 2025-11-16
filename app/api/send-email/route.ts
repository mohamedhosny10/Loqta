import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, validateSmtpConfig } from '@/lib/email';

/**
 * API Route: POST /api/send-email
 * 
 * Sends an email to the contactEmail address from the item report.
 * Uses SMTP with nodemailer via the reusable email utility.
 * 
 * Request Body:
 * {
 *   itemId: string,
 *   itemTitle: string,
 *   itemType: 'lost' | 'found',
 *   contactEmail: string,  // Dynamic email from report form
 *   senderId: string
 * }
 */
export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();
  let requestId: string | undefined;

  try {
    // Generate request ID for tracking
    requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('📧 Email API Request Received:', {
      requestId,
      timestamp: new Date().toISOString(),
    });

    // Step 1: Parse and validate request body
    let body: any;
    try {
      body = await request.json();
      console.log('📥 Request body parsed:', {
        requestId,
        hasItemId: !!body.itemId,
        hasItemTitle: !!body.itemTitle,
        hasItemType: !!body.itemType,
        hasContactEmail: !!body.contactEmail,
        hasSenderId: !!body.senderId,
        contactEmail: body.contactEmail ? body.contactEmail.substring(0, 20) + '...' : 'missing',
      });
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', {
        requestId,
        error: parseError instanceof Error ? parseError.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }

    const { itemId, itemTitle, itemType, contactEmail, senderId } = body;

    // Step 2: Validate required fields
    const missingFields: string[] = [];
    if (!itemId) missingFields.push('itemId');
    if (!itemTitle) missingFields.push('itemTitle');
    if (!itemType) missingFields.push('itemType');
    if (!contactEmail) missingFields.push('contactEmail');
    if (!senderId) missingFields.push('senderId');

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', {
        requestId,
        missingFields,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: `The following fields are required: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Step 3: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      console.error('❌ Invalid email format:', {
        requestId,
        contactEmail,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          error: 'Invalid email address format',
          details: `The email address "${contactEmail}" is not valid.`,
        },
        { status: 400 }
      );
    }

    // Step 4: Validate SMTP configuration BEFORE processing
    const smtpValidation = validateSmtpConfig();
    if (!smtpValidation.valid) {
      console.error('❌ SMTP configuration missing:', {
        requestId,
        missing: smtpValidation.missing,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          error: 'Missing SMTP configuration',
          details: `Missing required environment variables: ${smtpValidation.missing.join(', ')}`,
        },
        { status: 500 }
      );
    }

    // Step 5: Validate Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase configuration missing:', {
        requestId,
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          error: 'Server configuration error',
          details: 'Supabase configuration is missing. Please contact support.',
        },
        { status: 500 }
      );
    }

    // Step 6: Get sender information from Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let senderEmail = 'someone@loqta.app';
    let senderName = 'A Loqta user';

    try {
      console.log('🔍 Fetching sender information...', {
        requestId,
        senderId,
        timestamp: new Date().toISOString(),
      });

      const { data: senderData, error: senderError } = await supabase.auth.admin.getUserById(senderId);

      if (senderError) {
        console.warn('⚠️ Error fetching sender from auth:', {
          requestId,
          error: senderError.message,
          timestamp: new Date().toISOString(),
        });
      } else if (senderData?.user?.email) {
        senderEmail = senderData.user.email;

        // Try to get full name from profiles
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', senderId)
            .single();

          senderName =
            profileData?.full_name ||
            senderData.user.user_metadata?.full_name ||
            senderEmail.split('@')[0];
        } catch (profileError) {
          console.warn('⚠️ Error fetching sender profile:', {
            requestId,
            error: profileError instanceof Error ? profileError.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          });
          // Use fallback name
          senderName = senderData.user.user_metadata?.full_name || senderEmail.split('@')[0];
        }
      }

      console.log('✅ Sender information retrieved:', {
        requestId,
        senderEmail,
        senderName,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Error fetching sender info:', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      // Continue with default values - don't fail the request
    }

    // Step 7: Prepare email content
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
              <strong>${senderName}</strong> (${senderEmail}) contacted you via Loqta regarding your <strong>${itemTitle}</strong>.
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid #00BFA6; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>Item Type:</strong> ${itemType === 'lost' ? 'Lost Item' : 'Found Item'}<br/>
                <strong>Item Title:</strong> ${itemTitle}
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
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://loqta.app'}/items?itemId=${itemId}" 
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

${senderName} (${senderEmail}) contacted you via Loqta regarding your ${itemTitle}.

Item Type: ${itemType === 'lost' ? 'Lost Item' : 'Found Item'}
Item Title: ${itemTitle}

${itemType === 'lost'
  ? 'They believe they found your lost item and would like to connect with you.'
  : 'They believe this is their lost item and would like to verify ownership.'}

Please log in to your Loqta account to view their message and respond.

Best regards,
The Loqta Team
    `.trim();

    // Step 8: Send email using reusable email utility
    console.log('📤 Attempting to send email...', {
      requestId,
      to: contactEmail,
      subject: emailSubject,
      timestamp: new Date().toISOString(),
    });

    const emailResult = await sendEmail(contactEmail, emailSubject, emailHtml, emailText);

    const requestDuration = Date.now() - requestStartTime;

    // Step 9: Return response based on email result
    if (emailResult.success) {
      console.log('✅ Email API Request Completed Successfully:', {
        requestId,
        messageId: emailResult.messageId,
        to: contactEmail,
        duration: `${requestDuration}ms`,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          success: true,
        },
        { status: 200 }
      );
    } else {
      console.error('❌ Email API Request Failed:', {
        requestId,
        error: emailResult.error,
        details: emailResult.details,
        to: contactEmail,
        duration: `${requestDuration}ms`,
        timestamp: new Date().toISOString(),
      });

      // Determine appropriate status code based on error type
      let statusCode = 500;
      if (emailResult.error === 'Invalid email address format') {
        statusCode = 400;
      } else if (emailResult.error === 'Missing SMTP configuration') {
        statusCode = 500;
      } else if (emailResult.error?.includes('authentication')) {
        statusCode = 500;
      } else if (emailResult.error?.includes('connection')) {
        statusCode = 503; // Service Unavailable
      }

      return NextResponse.json(
        {
          error: emailResult.error || 'Failed to send email',
          details: emailResult.details,
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    const requestDuration = Date.now() - requestStartTime;

    console.error('❌ Email API Request Exception:', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${requestDuration}ms`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
