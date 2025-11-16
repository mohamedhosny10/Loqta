import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';

/**
 * Email sending configuration interface
 */
export interface EmailConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

/**
 * Email sending result interface
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: string;
}

/**
 * Validates that all required SMTP environment variables are present
 * @returns Object with validation result and missing variables
 */
export function validateSmtpConfig(): { valid: boolean; missing: string[] } {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD'];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key] || process.env[key]?.trim() === '') {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Gets SMTP configuration from environment variables
 * @returns EmailConfig object or null if configuration is invalid
 */
export function getSmtpConfig(): EmailConfig | null {
  const validation = validateSmtpConfig();
  
  if (!validation.valid) {
    console.error('❌ SMTP Configuration Validation Failed:', {
      missing: validation.missing,
      timestamp: new Date().toISOString(),
    });
    return null;
  }

  const port = parseInt(process.env.SMTP_PORT!, 10);
  
  if (isNaN(port) || port <= 0 || port > 65535) {
    console.error('❌ Invalid SMTP_PORT:', {
      port: process.env.SMTP_PORT,
      timestamp: new Date().toISOString(),
    });
    return null;
  }

  return {
    host: process.env.SMTP_HOST!.trim(),
    port,
    username: process.env.SMTP_USERNAME!.trim(),
    password: process.env.SMTP_PASSWORD!.trim(),
  };
}

/**
 * Creates and verifies a nodemailer transporter
 * @param config SMTP configuration
 * @returns Transporter instance or null if creation/verification fails
 */
export async function createTransporter(config: EmailConfig): Promise<Transporter | null> {
  try {
    console.log('📧 Creating SMTP transporter...', {
      host: config.host,
      port: config.port,
      username: config.username,
      secure: false,
      timestamp: new Date().toISOString(),
    });

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: false, // Use STARTTLS for ports 587/2525
      auth: {
        user: config.username,
        pass: config.password,
      },
      // Connection timeout
      connectionTimeout: 10000, // 10 seconds
      // Socket timeout
      socketTimeout: 10000, // 10 seconds
      // Greeting timeout
      greetingTimeout: 5000, // 5 seconds
      // Debug mode (set to true for detailed logs)
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development',
    });

    // Verify transporter connection
    console.log('🔍 Verifying SMTP connection...', {
      host: config.host,
      port: config.port,
      timestamp: new Date().toISOString(),
    });

    await transporter.verify();

    console.log('✅ SMTP transporter verified successfully', {
      host: config.host,
      port: config.port,
      timestamp: new Date().toISOString(),
    });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to create/verify SMTP transporter:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      host: config.host,
      port: config.port,
      username: config.username,
      timestamp: new Date().toISOString(),
    });

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.error('❌ SMTP Connection Refused:', {
          message: 'Cannot connect to SMTP server. Check SMTP_HOST and SMTP_PORT.',
          host: config.host,
          port: config.port,
        });
      } else if (error.message.includes('ETIMEDOUT')) {
        console.error('❌ SMTP Connection Timeout:', {
          message: 'Connection to SMTP server timed out.',
          host: config.host,
          port: config.port,
        });
      } else if (error.message.includes('EAUTH')) {
        console.error('❌ SMTP Authentication Failed:', {
          message: 'Invalid SMTP_USERNAME or SMTP_PASSWORD.',
          username: config.username,
        });
      }
    }

    return null;
  }
}

/**
 * Validates email address format
 * @param email Email address to validate
 * @returns true if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Sends an email using SMTP
 * @param to Recipient email address (from contactEmail)
 * @param subject Email subject
 * @param html HTML email content
 * @param text Plain text email content
 * @returns EmailResult with success status and details
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<EmailResult> {
  const startTime = Date.now();

  try {
    // Step 1: Validate recipient email
    if (!validateEmail(to)) {
      console.error('❌ Invalid recipient email address:', {
        email: to,
        timestamp: new Date().toISOString(),
      });
      return {
        success: false,
        error: 'Invalid email address format',
        details: `The email address "${to}" is not valid.`,
      };
    }

    // Step 2: Validate SMTP configuration
    const config = getSmtpConfig();
    if (!config) {
      const validation = validateSmtpConfig();
      return {
        success: false,
        error: 'Missing SMTP configuration',
        details: `Missing required environment variables: ${validation.missing.join(', ')}`,
      };
    }

    // Step 3: Create and verify transporter
    const transporter = await createTransporter(config);
    if (!transporter) {
      return {
        success: false,
        error: 'Failed to create SMTP transporter',
        details: 'Could not establish connection to SMTP server. Please check your SMTP configuration.',
      };
    }

    // Step 4: Prepare email options
    const mailOptions: SendMailOptions = {
      from: `Loqta <${config.username}>`,
      to: to.trim(),
      subject: subject.trim(),
      html: html,
      text: text,
    };

    console.log('📤 Sending email...', {
      to: to,
      subject: subject,
      from: config.username,
      timestamp: new Date().toISOString(),
    });

    // Step 5: Send email
    const info = await transporter.sendMail(mailOptions);

    const duration = Date.now() - startTime;

    console.log('✅ Email sent successfully via SMTP:', {
      messageId: info.messageId,
      to: to,
      from: config.username,
      subject: subject,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Extract detailed error information
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || error?.responseCode || '';
    const errorResponse = error?.response || '';
    const fullError = error?.toString() || '';

    console.error('❌ SMTP email sending failed:', {
      error: errorMessage,
      errorCode: errorCode,
      errorResponse: errorResponse,
      fullError: fullError,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      to: to,
      subject: subject,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    // Handle specific SMTP errors
    let userErrorMessage = 'Failed to send email';
    let userErrorDetails = 'An unexpected error occurred while sending the email.';

    // Check for error in message, response, or code
    const errorText = `${errorMessage} ${errorResponse} ${errorCode} ${fullError}`.toLowerCase();

    // Trial account limitations
    if (errorText.includes('trial') || 
        errorText.includes('can only send') || 
        errorText.includes('administrator') ||
        errorText.includes('450')) {
      userErrorMessage = 'Email service account limitation';
      userErrorDetails = `Your email service account has restrictions. The server responded: "${errorMessage}". Please check your email service configuration or switch to Gmail SMTP.`;
      console.error('⚠️ Email Service Account Limitation Detected:', {
        errorMessage: errorMessage,
        errorResponse: errorResponse,
        recipient: to,
        suggestion: 'Check email service configuration or switch to Gmail SMTP',
      });
    }
    // Authentication errors
    else if (errorText.includes('eauth') || 
             errorText.includes('authentication') || 
             errorText.includes('invalid login') || 
             errorText.includes('invalid credentials') ||
             errorText.includes('535')) {
      userErrorMessage = 'SMTP authentication failed';
      userErrorDetails = 'Invalid SMTP username or password. Please check your SMTP_USERNAME and SMTP_PASSWORD environment variables.';
    }
    // Connection errors
    else if (errorText.includes('econnrefused') || 
             errorText.includes('connection refused') ||
             errorText.includes('enotfound')) {
      userErrorMessage = 'SMTP connection refused';
      userErrorDetails = 'Cannot connect to SMTP server. Please check your SMTP_HOST and SMTP_PORT settings.';
    }
    // Timeout errors
    else if (errorText.includes('etimeout') || 
             errorText.includes('timeout') ||
             errorText.includes('etimedout')) {
      userErrorMessage = 'SMTP connection timeout';
      userErrorDetails = 'Connection to SMTP server timed out. Please check your network connection and SMTP server settings.';
    }
    // Server rejections (550, 553, 554, etc.)
    else if (errorText.includes('rejected') || 
             errorText.includes('550') || 
             errorText.includes('553') || 
             errorText.includes('554') ||
             errorText.includes('552')) {
      userErrorMessage = 'Email rejected by server';
      userErrorDetails = `The email was rejected by the SMTP server. Server response: "${errorMessage}". Please check the recipient email address and your account settings.`;
    }
    // TLS/SSL errors
    else if (errorText.includes('tls') || 
             errorText.includes('ssl') || 
             errorText.includes('certificate') ||
             errorText.includes('eprotocol')) {
      userErrorMessage = 'SMTP TLS/SSL error';
      userErrorDetails = `TLS/SSL connection error: ${errorMessage}`;
    }
    // Generic error - show the actual error message
    else {
      userErrorMessage = 'Email sending failed';
      userErrorDetails = errorMessage || 'An unknown error occurred. Please check your SMTP configuration and try again.';
    }

    return {
      success: false,
      error: userErrorMessage,
      details: userErrorDetails,
    };
  }
}

