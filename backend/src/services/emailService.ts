import nodemailer from 'nodemailer';
import { createTransport, Transporter } from 'nodemailer';
import { User } from '../models/User';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  appName: string;
  appUrl: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.EMAIL_ENABLED === 'true';
    
    this.config = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      from: process.env.SMTP_FROM || 'noreply@example.com',
      appName: process.env.APP_NAME || 'BM Last Heard',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
    };

    if (this.enabled) {
      this.initializeTransporter();
    }
  }

  private initializeTransporter(): void {
    try {
      this.transporter = createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.auth.user,
          pass: this.config.auth.pass,
        },
      });

      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.enabled = false;
    }
  }

  private generateEmailVerificationTemplate(user: User, token: string): EmailTemplate {
    const verificationUrl = `${this.config.appUrl}/verify-email/${token}`;
    
    const subject = `Welcome to ${this.config.appName} - Verify Your Email`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.config.appName}</h1>
            <p>Ham Radio Network Activity Monitor</p>
          </div>
          <div class="content">
            <h2>Welcome, ${user.name}!</h2>
            <p>Thank you for registering your ham radio callsign <strong>${user.callsign}</strong> with ${this.config.appName}.</p>
            <p>To complete your registration and start monitoring Brandmeister network activity, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace;">${verificationUrl}</p>
            
            <div class="warning">
              <strong>Security Note:</strong> This verification link will expire in 24 hours. If you didn't create an account with us, please ignore this email.
            </div>
            
            <p>Once verified, you'll be able to:</p>
            <ul>
              <li>Monitor real-time Brandmeister network activity</li>
              <li>Filter talkgroup data by region and time</li>
              <li>Access personalized dashboard features</li>
              <li>Receive activity notifications (coming soon)</li>
            </ul>
            
            <p>73,<br>The ${this.config.appName} Team</p>
          </div>
          <div class="footer">
            <p>© 2025 ${this.config.appName}. This email was sent to ${user.email}</p>
            <p>If you have any questions, please contact us through our support channels.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to ${this.config.appName}!
      
      Thank you for registering your ham radio callsign ${user.callsign}.
      
      To complete your registration, please verify your email address by visiting:
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      If you didn't create an account with us, please ignore this email.
      
      73,
      The ${this.config.appName} Team
    `;

    return { subject, html, text };
  }

  private generatePasswordResetTemplate(user: User, token: string): EmailTemplate {
    const resetUrl = `${this.config.appUrl}/reset-password/${token}`;
    
    const subject = `${this.config.appName} - Password Reset Request`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 6px; margin: 20px 0; color: #721c24; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.config.appName}</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello ${user.name} (${user.callsign}),</p>
            <p>We received a request to reset the password for your ${this.config.appName} account.</p>
            <p>If you requested this password reset, click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace;">${resetUrl}</p>
            
            <div class="warning">
              <strong>Security Notice:</strong> This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </div>
            
            <p>For security reasons, you can only use this link once. If you need another password reset, please request a new one from the login page.</p>
            
            <p>73,<br>The ${this.config.appName} Team</p>
          </div>
          <div class="footer">
            <p>© 2025 ${this.config.appName}. This email was sent to ${user.email}</p>
            <p>If you didn't request this, please contact our support team immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${this.config.appName} - Password Reset Request
      
      Hello ${user.name} (${user.callsign}),
      
      We received a request to reset the password for your account.
      
      If you requested this, please visit:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, please ignore this email.
      
      73,
      The ${this.config.appName} Team
    `;

    return { subject, html, text };
  }

  private generateEmailChangeTemplate(user: User, newEmail: string, token: string): EmailTemplate {
    const confirmUrl = `${this.config.appUrl}/confirm-email-change/${token}`;
    
    const subject = `${this.config.appName} - Confirm Email Address Change`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Email Change</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .info { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 6px; margin: 20px 0; color: #0c5460; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.config.appName}</h1>
            <p>Email Address Change Confirmation</p>
          </div>
          <div class="content">
            <h2>Confirm Your New Email Address</h2>
            <p>Hello ${user.name} (${user.callsign}),</p>
            <p>You requested to change your email address from <strong>${user.email}</strong> to <strong>${newEmail}</strong>.</p>
            <p>To complete this change, please click the button below to confirm your new email address:</p>
            
            <div style="text-align: center;">
              <a href="${confirmUrl}" class="button">Confirm Email Change</a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace;">${confirmUrl}</p>
            
            <div class="info">
              <strong>Important:</strong> This confirmation link will expire in 24 hours. If you didn't request this email change, please contact our support team immediately.
            </div>
            
            <p>After confirmation, all future communications will be sent to your new email address.</p>
            
            <p>73,<br>The ${this.config.appName} Team</p>
          </div>
          <div class="footer">
            <p>© 2025 ${this.config.appName}. This email was sent to ${newEmail}</p>
            <p>This email was sent as part of an email address change request.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${this.config.appName} - Email Address Change Confirmation
      
      Hello ${user.name} (${user.callsign}),
      
      You requested to change your email address from ${user.email} to ${newEmail}.
      
      To complete this change, please visit:
      ${confirmUrl}
      
      This link will expire in 24 hours.
      
      If you didn't request this change, please contact our support team immediately.
      
      73,
      The ${this.config.appName} Team
    `;

    return { subject, html, text };
  }

  async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      console.log('Email service disabled or not configured. Email would be sent to:', to);
      console.log('Subject:', template.subject);
      console.log('Content preview:', template.text.substring(0, 200) + '...');
      return true; // Return true for development/testing
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.config.from,
        to: to,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });

      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendEmailVerification(user: User, token: string): Promise<boolean> {
    const template = this.generateEmailVerificationTemplate(user, token);
    return await this.sendEmail(user.email, template);
  }

  async sendPasswordReset(user: User, token: string): Promise<boolean> {
    const template = this.generatePasswordResetTemplate(user, token);
    return await this.sendEmail(user.email, template);
  }

  async sendEmailChangeConfirmation(user: User, newEmail: string, token: string): Promise<boolean> {
    const template = this.generateEmailChangeTemplate(user, newEmail, token);
    return await this.sendEmail(newEmail, template);
  }

  async testConnection(): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      console.log('Email service disabled or not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('Email service connection test successful');
      return true;
    } catch (error) {
      console.error('Email service connection test failed:', error);
      return false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const emailService = new EmailService();