import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { RegisterRequest, LoginRequest, PasswordResetRequest, PasswordResetConfirmRequest, EmailChangeRequest, ProfileUpdateRequest } from '../models/User';

const router = Router();
const authService = new AuthService();

// Middleware to check authentication
async function authenticateSession(req: Request, res: Response, next: any) {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionToken) {
    return res.status(401).json({ success: false, message: 'No session token provided' });
  }

  const user = await authService.validateSession(sessionToken);
  
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }

  // Add user to request object
  (req as any).user = user;
  next();
}

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const registerData: RegisterRequest = req.body;
    
    // Basic validation
    if (!registerData.callsign || !registerData.name || !registerData.email || !registerData.password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: callsign, name, email, password'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate callsign format (basic ham radio callsign validation)
    const callsignRegex = /^[A-Z0-9]{3,8}$/i;
    if (!callsignRegex.test(registerData.callsign)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid callsign format'
      });
    }

    // Validate password strength
    if (registerData.password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const result = await authService.register(registerData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('Registration route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify email
router.get('/verify/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const result = await authService.verifyEmail(token);
    
    if (result.success) {
      // Redirect to main app with success message
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?verified=true&message=${encodeURIComponent('Email verified successfully! You can now log in.')}`);
    } else {
      // Redirect to main app with error message
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?verified=false&message=${encodeURIComponent(result.message)}`);
    }
    
  } catch (error) {
    console.error('Email verification route error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?verified=false&message=${encodeURIComponent('Internal server error')}`);
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const loginData: LoginRequest = req.body;
    
    if (!loginData.identifier || !loginData.password) {
      return res.status(400).json({
        success: false,
        message: 'Email/callsign and password are required'
      });
    }

    const result = await authService.login(loginData);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
    
  } catch (error) {
    console.error('Login route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout user
router.post('/logout', authenticateSession, async (req: Request, res: Response) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (sessionToken) {
      await authService.logout(sessionToken);
    }
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateSession, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    res.status(200).json({
      success: true,
      user: user
    });
    
  } catch (error) {
    console.error('Profile route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', authenticateSession, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, callsign, locale } = req.body;

    // Basic validation
    if (!name || !callsign || !locale) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, callsign, locale'
      });
    }

    // Validate callsign format
    const callsignRegex = /^[A-Z0-9]{3,8}$/i;
    if (!callsignRegex.test(callsign)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid callsign format'
      });
    }

    // Validate locale
    const validLocales = ['en', 'es', 'de', 'fr'];
    if (!validLocales.includes(locale)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid locale'
      });
    }

    const result = await authService.updateProfile(user.id, { name, callsign, locale });
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('Profile update route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Validate session
router.get('/validate', async (req: Request, res: Response) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ success: false, message: 'No session token provided' });
    }

    const user = await authService.validateSession(sessionToken);
    
    if (user) {
      res.status(200).json({
        success: true,
        user: user
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }
    
  } catch (error) {
    console.error('Session validation route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Request password reset
router.post('/password-reset', async (req: Request, res: Response) => {
  try {
    const { email }: PasswordResetRequest = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const result = await authService.requestPasswordReset(email);
    
    // Always return success for security (don't reveal if email exists)
    res.status(200).json(result);
    
  } catch (error) {
    console.error('Password reset request route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Confirm password reset
router.post('/password-reset/confirm', async (req: Request, res: Response) => {
  try {
    const { token, newPassword }: PasswordResetConfirmRequest = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const result = await authService.confirmPasswordReset(token, newPassword);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('Password reset confirmation route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Request email change
router.post('/email-change', authenticateSession, async (req: Request, res: Response) => {
  try {
    const { newEmail, password }: EmailChangeRequest = req.body;
    const user = (req as any).user;
    
    if (!newEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'New email and current password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const result = await authService.requestEmailChange(user.id, newEmail, password);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('Email change request route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Confirm old email for email change (Step 1)
router.get('/confirm-old-email/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const result = await authService.confirmOldEmail(token);
    
    if (result.success) {
      // Redirect to success page with message
      res.redirect(`${process.env.FRONTEND_URL}/email-change-step1-success?message=${encodeURIComponent(result.message)}`);
    } else {
      // Redirect to error page with message
      res.redirect(`${process.env.FRONTEND_URL}/email-change-error?message=${encodeURIComponent(result.message)}`);
    }
    
  } catch (error) {
    console.error('Old email confirmation route error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/email-change-error?message=${encodeURIComponent('Internal server error')}`);
  }
});

// Confirm new email for email change (Step 2)
router.get('/confirm-new-email/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const result = await authService.confirmNewEmail(token);
    
    if (result.success) {
      // Redirect to success page with message
      res.redirect(`${process.env.FRONTEND_URL}/email-change-success?message=${encodeURIComponent(result.message)}`);
    } else {
      // Redirect to error page with message  
      res.redirect(`${process.env.FRONTEND_URL}/email-change-error?message=${encodeURIComponent(result.message)}`);
    }
    
  } catch (error) {
    console.error('New email confirmation route error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/email-change-error?message=${encodeURIComponent('Internal server error')}`);
  }
});

// Test endpoint for token cleanup (development only)
if (process.env.NODE_ENV !== 'production') {
  router.get('/test/token-stats', async (req: Request, res: Response) => {
    try {
      const { cleanupService } = await import('../services/cleanupService');
      const stats = await cleanupService.getTokenStatistics();
      const details = await cleanupService.getTokenDetails();
      
      res.json({
        success: true,
        stats,
        details,
        currentTimestamp: Math.floor(Date.now() / 1000)
      });
    } catch (error) {
      console.error('Token stats error:', error);
      res.status(500).json({ success: false, message: 'Failed to get token statistics' });
    }
  });

  router.post('/test/cleanup-tokens', async (req: Request, res: Response) => {
    try {
      const { cleanupService } = await import('../services/cleanupService');
      const result = await cleanupService.cleanupExpiredTokens();
      
      res.json({
        success: true,
        result
      });
    } catch (error) {
      console.error('Token cleanup error:', error);
      res.status(500).json({ success: false, message: 'Failed to cleanup tokens' });
    }
  });
}

export default router;