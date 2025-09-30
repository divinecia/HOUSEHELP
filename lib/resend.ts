// Resend API for Email Notifications
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.COMPANY_EMAIL || 'noreply@househelp.rw';
const ISANGE_EMAIL = process.env.ISANGE_EMAIL || 'isange@househelp.rw';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Send an email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: options.from || FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', data);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(to: string, otp: string, name?: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4c66a4 0%, #6B9BD1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #4c66a4; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; letter-spacing: 8px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HOUSEHELP</h1>
          <p>Verify Your Account</p>
        </div>
        <div class="content">
          <p>Hello${name ? ' ' + name : ''},</p>
          <p>Thank you for registering with HouseHelp. Please use the following OTP code to verify your account:</p>
          <div class="otp-code">${otp}</div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HouseHelp. Professional household services platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Verify Your HouseHelp Account',
    html,
    text: `Your HouseHelp verification code is: ${otp}. This code will expire in 10 minutes.`,
  });
}

/**
 * Send welcome email after successful registration
 */
export async function sendWelcomeEmail(to: string, name: string, userType: 'worker' | 'household'): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4c66a4 0%, #6B9BD1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #4c66a4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to HOUSEHELP!</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Welcome to HouseHelp! We're excited to have you join our community of ${userType === 'worker' ? 'professional workers' : 'households'}.</p>
          ${userType === 'worker' ? `
            <p>As a worker, you can now:</p>
            <ul>
              <li>Browse and accept job opportunities</li>
              <li>Manage your schedule and earnings</li>
              <li>Complete training modules</li>
              <li>Build your reputation through ratings</li>
            </ul>
          ` : `
            <p>As a household member, you can now:</p>
            <ul>
              <li>Book trusted household workers</li>
              <li>Manage your bookings and subscriptions</li>
              <li>Rate and review workers</li>
              <li>Access premium services</li>
            </ul>
          `}
          <p style="text-align: center;">
            <a href="https://househelp.rw/${userType}/dashboard" class="button">Go to Dashboard</a>
          </p>
          <p>If you have any questions, feel free to contact our support team.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HouseHelp. Professional household services platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Welcome to HouseHelp!',
    html,
    text: `Welcome to HouseHelp, ${name}! Your account has been successfully created.`,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(to: string, resetCode: string, name?: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4c66a4 0%, #6B9BD1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .reset-code { font-size: 32px; font-weight: bold; color: #4c66a4; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; letter-spacing: 8px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
        </div>
        <div class="content">
          <p>Hello${name ? ' ' + name : ''},</p>
          <p>We received a request to reset your password. Use the following code to reset your password:</p>
          <div class="reset-code">${resetCode}</div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HouseHelp. Professional household services platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Reset Your HouseHelp Password',
    html,
    text: `Your password reset code is: ${resetCode}. This code will expire in 15 minutes.`,
  });
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  to: string,
  bookingDetails: {
    service: string;
    date: string;
    time: string;
    workerName?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4c66a4 0%, #6B9BD1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p>Your booking has been confirmed. Here are the details:</p>
          <div class="booking-details">
            <div class="detail-row">
              <strong>Service:</strong>
              <span>${bookingDetails.service}</span>
            </div>
            <div class="detail-row">
              <strong>Date:</strong>
              <span>${bookingDetails.date}</span>
            </div>
            <div class="detail-row">
              <strong>Time:</strong>
              <span>${bookingDetails.time}</span>
            </div>
            ${bookingDetails.workerName ? `
            <div class="detail-row">
              <strong>Worker:</strong>
              <span>${bookingDetails.workerName}</span>
            </div>
            ` : ''}
          </div>
          <p>We'll send you a reminder before your scheduled service.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HouseHelp. Professional household services platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Booking Confirmation - HouseHelp',
    html,
    text: `Your booking for ${bookingDetails.service} on ${bookingDetails.date} at ${bookingDetails.time} has been confirmed.`,
  });
}

/**
 * Send behavior report notification to Isange
 */
export async function sendBehaviorReportToIsange(
  reportDetails: {
    reportId: string;
    reporterType: 'worker' | 'household';
    reportedType: 'worker' | 'household';
    subject: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .severity { display: inline-block; padding: 5px 15px; border-radius: 5px; font-weight: bold; color: white; }
        .severity-critical { background: #dc2626; }
        .severity-high { background: #ea580c; }
        .severity-medium { background: #f59e0b; }
        .severity-low { background: #10b981; }
        .report-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Behavior Report Alert</h1>
        </div>
        <div class="content">
          <p><strong>Report ID:</strong> ${reportDetails.reportId}</p>
          <p><strong>Severity:</strong> <span class="severity severity-${reportDetails.severity}">${reportDetails.severity.toUpperCase()}</span></p>
          <div class="report-details">
            <p><strong>Reporter Type:</strong> ${reportDetails.reporterType}</p>
            <p><strong>Reported Type:</strong> ${reportDetails.reportedType}</p>
            <p><strong>Subject:</strong> ${reportDetails.subject}</p>
            <p><strong>Description:</strong></p>
            <p>${reportDetails.description}</p>
          </div>
          <p>Please review this report and take appropriate action.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HouseHelp. Professional household services platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: ISANGE_EMAIL,
    subject: `[${reportDetails.severity.toUpperCase()}] Behavior Report - ${reportDetails.reportId}`,
    html,
    text: `Behavior Report Alert: ${reportDetails.subject}. Report ID: ${reportDetails.reportId}`,
  });
}
