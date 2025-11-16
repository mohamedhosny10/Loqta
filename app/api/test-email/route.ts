import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, validateSmtpConfig, getSmtpConfig, createTransporter } from '@/lib/email';

/**
 * API Route: POST /api/test-email
 * 
 * Tests the Gmail SMTP configuration by sending a test email
 * 
 * Request Body (optional):
 * {
 *   to: string (email address to send test email to)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Validate SMTP configuration
    const smtpValidation = validateSmtpConfig();
    if (!smtpValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'SMTP configuration missing',
          details: `Missing required environment variables: ${smtpValidation.missing.join(', ')}`,
          missing: smtpValidation.missing,
        },
        { status: 400 }
      );
    }

    // Step 2: Get SMTP config
    const config = getSmtpConfig();
    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid SMTP configuration',
          details: 'Could not parse SMTP configuration from environment variables',
        },
        { status: 500 }
      );
    }

    // Step 3: Verify SMTP connection
    console.log('🔍 Testing SMTP connection...', {
      host: config.host,
      port: config.port,
      username: config.username,
    });

    const transporter = await createTransporter(config);
    if (!transporter) {
      return NextResponse.json(
        {
          success: false,
          error: 'SMTP connection failed',
          details: 'Could not establish connection to SMTP server. Please check your SMTP configuration.',
          config: {
            host: config.host,
            port: config.port,
            username: config.username,
            password: '***hidden***',
          },
        },
        { status: 500 }
      );
    }

    // Step 4: Get recipient email from request body or use config username
    const body = await request.json().catch(() => ({}));
    const testEmail = body.to || config.username;

    // Step 5: Send test email
    const testSubject = 'Loqta - Gmail SMTP Test Email';
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #00BFA6 0%, #00A693 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Loqta</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1f2937; margin-top: 0;">✅ Gmail SMTP Test Successful!</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              Congratulations! Your Gmail SMTP configuration is working correctly.
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid #00BFA6; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>SMTP Host:</strong> ${config.host}<br/>
                <strong>SMTP Port:</strong> ${config.port}<br/>
                <strong>From Email:</strong> ${config.username}<br/>
                <strong>Test Time:</strong> ${new Date().toLocaleString()}
              </p>
            </div>
            
            <p style="color: #4b5563; font-size: 16px;">
              Your email system is now ready to send emails to users' contact emails!
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              Best regards,<br/>
              <strong>The Loqta Team</strong>
            </p>
          </div>
        </body>
      </html>
    `;

    const testText = `
Loqta - Gmail SMTP Test Email

✅ Gmail SMTP Test Successful!

Congratulations! Your Gmail SMTP configuration is working correctly.

SMTP Host: ${config.host}
SMTP Port: ${config.port}
From Email: ${config.username}
Test Time: ${new Date().toLocaleString()}

Your email system is now ready to send emails to users' contact emails!

Best regards,
The Loqta Team
    `.trim();

    const emailResult = await sendEmail(testEmail, testSubject, testHtml, testText);

    if (emailResult.success) {
      return NextResponse.json(
        {
          success: true,
          message: 'Test email sent successfully!',
          details: `Test email sent to ${testEmail}`,
          messageId: emailResult.messageId,
          config: {
            host: config.host,
            port: config.port,
            username: config.username,
            password: '***hidden***',
          },
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || 'Failed to send test email',
          details: emailResult.details,
          config: {
            host: config.host,
            port: config.port,
            username: config.username,
            password: '***hidden***',
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Test email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * API Route: GET /api/test-email
 * 
 * Returns the current SMTP configuration status (without sending an email)
 */
export async function GET() {
  try {
    const smtpValidation = validateSmtpConfig();
    const config = getSmtpConfig();

    if (!smtpValidation.valid || !config) {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          error: 'SMTP configuration missing or invalid',
          missing: smtpValidation.missing,
          details: `Missing required environment variables: ${smtpValidation.missing.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Try to verify connection
    const transporter = await createTransporter(config);
    const connectionStatus = transporter ? 'connected' : 'failed';

    return NextResponse.json(
      {
        success: true,
        configured: true,
        connectionStatus,
        config: {
          host: config.host,
          port: config.port,
          username: config.username,
          password: '***hidden***',
        },
        message: connectionStatus === 'connected' 
          ? 'SMTP configuration is valid and connection successful!' 
          : 'SMTP configuration found but connection failed. Please check your credentials.',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

