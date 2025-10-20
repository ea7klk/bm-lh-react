# Email Service Configuration Guide

The BM Last Heard application includes a comprehensive email service for user authentication workflows including email verification, password reset, and email change confirmations.

## Quick Setup

1. Copy the example environment files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. Configure email settings in `backend/.env`:
   ```bash
   EMAIL_ENABLED=true
   SMTP_HOST=your-smtp-host
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@domain.com
   SMTP_PASS=your-password
   SMTP_FROM=noreply@yourdomain.com
   APP_NAME=BM Last Heard
   APP_URL=http://localhost:3000
   ```

## Environment Variables

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EMAIL_ENABLED` | Enable/disable email service | `false` | No |
| `SMTP_HOST` | SMTP server hostname | `localhost` | Yes* |
| `SMTP_PORT` | SMTP server port | `587` | Yes* |
| `SMTP_SECURE` | Use SSL/TLS (true for port 465) | `false` | No |
| `SMTP_USER` | SMTP authentication username | - | Yes* |
| `SMTP_PASS` | SMTP authentication password | - | Yes* |
| `SMTP_FROM` | Default "from" email address | `noreply@example.com` | No |
| `APP_NAME` | Application name for emails | `BM Last Heard` | No |
| `APP_URL` | Frontend URL for email links | `http://localhost:3000` | No |

*Required only when `EMAIL_ENABLED=true`

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:3001/api` |
| `REACT_APP_NAME` | Application name | `BM Last Heard` |
| `REACT_APP_DESCRIPTION` | Application description | `Brandmeister Network Activity Monitor` |

## Email Provider Configuration

### Gmail Configuration

1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Configure in `.env`:
   ```bash
   EMAIL_ENABLED=true
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM=your-gmail@gmail.com
   ```

### Outlook/Hotmail Configuration

```bash
EMAIL_ENABLED=true
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=your-email@outlook.com
```

### Custom SMTP Server

```bash
EMAIL_ENABLED=true
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
```

### SSL/TLS Configuration

For secure connections (port 465):
```bash
SMTP_PORT=465
SMTP_SECURE=true
```

For STARTTLS (port 587):
```bash
SMTP_PORT=587
SMTP_SECURE=false
```

## Email Templates

The email service includes professionally designed HTML email templates for:

### 1. Email Verification
- Sent after user registration
- Contains verification link with token
- Expires in 24 hours
- Ham radio themed messaging

### 2. Password Reset
- Sent when user requests password reset
- Contains secure reset link with token
- Expires in 1 hour
- Security warnings included

### 3. Email Change Confirmation
- Sent to new email address when user changes email
- Contains confirmation link with token
- Expires in 24 hours
- Shows both old and new email addresses

## Development Mode

When `EMAIL_ENABLED=false` (default), the email service will:
- Log email details to console instead of sending
- Show email subject and preview
- Return success for all operations
- Allow testing without SMTP configuration

Example console output:
```
Email service disabled or not configured. Email would be sent to: user@example.com
Subject: Welcome to BM Last Heard - Verify Your Email
Content preview: Welcome to BM Last Heard! Thank you for registering your ham radio callsign...
```

## Testing Email Configuration

The application automatically tests the email connection on startup:

```
Email service: Connected ✓
# or
Email service: Connection failed ✗
# or
Email service: Disabled
```

You can also test email functionality by:
1. Registering a new user account
2. Checking console logs for email details
3. If enabled, checking your email inbox

## Security Features

- **Rate limiting**: Prevents spam through database token management
- **Token expiration**: All tokens expire automatically
- **Secure tokens**: Cryptographically random tokens
- **HTTPS links**: Production URLs should use HTTPS
- **Privacy protection**: Password reset doesn't reveal if email exists
- **Session invalidation**: Password reset invalidates all user sessions

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   ```
   Error: Invalid login: 535-5.7.8 Username and Password not accepted
   ```
   - Check SMTP_USER and SMTP_PASS
   - For Gmail, ensure App Password is used
   - Verify 2FA is enabled for Gmail

2. **Connection Timeout**
   ```
   Error: connect ETIMEDOUT
   ```
   - Check SMTP_HOST and SMTP_PORT
   - Verify firewall allows outgoing connections
   - Try different port (25, 465, 587)

3. **TLS/SSL Errors**
   ```
   Error: self signed certificate
   ```
   - Set SMTP_SECURE=false for port 587
   - Set SMTP_SECURE=true for port 465

4. **Domain/DNS Issues**
   ```
   Error: getaddrinfo ENOTFOUND
   ```
   - Verify SMTP_HOST is correct
   - Check DNS resolution

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will show detailed SMTP connection logs.

## Production Considerations

1. **Use environment variables**: Never commit credentials to version control
2. **HTTPS required**: Email links should use HTTPS in production
3. **Domain authentication**: Configure SPF/DKIM records for your domain
4. **Rate limiting**: Implement additional rate limiting if needed
5. **Monitoring**: Monitor email delivery rates and failures
6. **Backup**: Consider backup email service provider

## Email Content Customization

Email templates are defined in `/backend/src/services/emailService.ts`. To customize:

1. Modify the HTML templates in the `generate*Template` methods
2. Update styling in the `<style>` sections
3. Change application branding (colors, logos, etc.)
4. Adjust text content for your use case

The templates include:
- Responsive design for mobile devices
- Ham radio specific terminology
- Professional branding with gradients
- Security warnings and best practices
- Clear call-to-action buttons

## API Endpoints

The email service integrates with these authentication endpoints:

- `POST /api/auth/register` - Triggers email verification
- `POST /api/auth/password-reset` - Triggers password reset email
- `POST /api/auth/email-change` - Triggers email change confirmation
- `GET /api/auth/verify/:token` - Processes email verification
- `POST /api/auth/password-reset/confirm` - Processes password reset
- `POST /api/auth/email-change/confirm/:token` - Processes email change

All endpoints handle email sending gracefully and provide appropriate user feedback.