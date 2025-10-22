import * as bcrypt from 'bcrypt';
import { DatabaseService } from './databaseService';
import { emailService } from './emailService';
import { 
  User, 
  UserVerification, 
  UserSession, 
  PasswordResetToken,
  RegisterRequest,
  LoginRequest,
  PasswordChangeRequest,
  ProfileUpdateRequest,
  UserProfile,
  AuthResponse
} from '../models/User';

export class AuthService {
  private db: DatabaseService;
  private readonly SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds
  private readonly VERIFICATION_DURATION = 24 * 60 * 60; // 24 hours in seconds
  private readonly RESET_TOKEN_DURATION = 60 * 60; // 1 hour in seconds
  private readonly SALT_ROUNDS = 10; // bcrypt salt rounds

  constructor() {
    this.db = new DatabaseService();
  }

  /**
   * Hash password using bcrypt with salt rounds of 10
   */
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify password against hash using bcrypt
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmailOrCallsign(registerData.email, registerData.callsign);
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email or callsign already exists'
        };
      }

      // Hash the password
      const hashedPassword = await this.hashPassword(registerData.password);

      // For now, create a simple verification token (we'll improve this later)
      const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = Math.floor(Date.now() / 1000) + this.VERIFICATION_DURATION;

      // Store in user_verifications table
      const verification = {
        callsign: registerData.callsign.toUpperCase(),
        name: registerData.name,
        email: registerData.email.toLowerCase(),
        password_hash: hashedPassword,
        verification_token: verificationToken,
        is_verified: false,
        created_at: Math.floor(Date.now() / 1000),
        expires_at: expiresAt,
        locale: registerData.locale || 'en'
      };

      await this.storeUserVerification(verification);

      // Send verification email
      try {
        const tempUser = {
          callsign: verification.callsign,
          name: verification.name,
          email: verification.email
        } as User;
        
        await emailService.sendEmailVerification(tempUser, verificationToken);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }

      return {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.'
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    }
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    try {
      const verification = await this.getVerificationByToken(token);
      
      if (!verification) {
        return {
          success: false,
          message: 'Invalid verification token'
        };
      }

      if (this.isTokenExpired(verification.expires_at)) {
        return {
          success: false,
          message: 'Verification token has expired'
        };
      }

      if (verification.is_verified) {
        return {
          success: false,
          message: 'Email already verified'
        };
      }

      // Create user account
      const user = {
        callsign: verification.callsign,
        name: verification.name,
        email: verification.email,
        password_hash: verification.password_hash,
        is_active: true,
        created_at: Math.floor(Date.now() / 1000),
        locale: verification.locale
      };

      const userId = await this.createUser(user);
      
      // Mark verification as complete
      await this.markVerificationComplete(verification.id);

      // Create session
      const sessionToken = await this.createSession(userId);

      const userProfile = await this.getUserById(userId);

      return {
        success: true,
        message: 'Email verified successfully',
        user: this.toUserProfile(userProfile!),
        session_token: sessionToken
      };

    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        message: 'Email verification failed'
      };
    }
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const user = await this.getUserByEmailOrCallsign(loginData.identifier, loginData.identifier);
      
      if (!user) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      if (!user.is_active) {
        return {
          success: false,
          message: 'Account not activated. Please verify your email.'
        };
      }

      // Verify password using bcrypt
      const passwordValid = await this.verifyPassword(loginData.password, user.password_hash);
      if (!passwordValid) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Update last login
      await this.updateLastLogin(user.id);

      // Create session
      const sessionToken = await this.createSession(user.id);

      return {
        success: true,
        message: 'Login successful',
        user: this.toUserProfile(user),
        session_token: sessionToken
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed'
      };
    }
  }

  async logout(sessionToken: string): Promise<void> {
    try {
      await this.removeSession(sessionToken);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async validateSession(sessionToken: string): Promise<UserProfile | null> {
    try {
      const session = await this.getSessionByToken(sessionToken);
      
      if (!session) {
        return null;
      }

      if (this.isTokenExpired(session.expires_at)) {
        await this.removeSession(sessionToken);
        return null;
      }

      const user = await this.getUserById(session.user_id);
      
      if (!user || !user.is_active) {
        return null;
      }

      return this.toUserProfile(user);

    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  async updateProfile(userId: number, updateData: ProfileUpdateRequest): Promise<AuthResponse> {
    try {
      // Check if callsign is already taken by another user
      const existingCallsignUser = await this.getUserByCallsign(updateData.callsign);
      if (existingCallsignUser && existingCallsignUser.id !== userId) {
        return {
          success: false,
          message: 'Callsign is already taken by another user'
        };
      }

      // Update user profile
      const query = `
        UPDATE users 
        SET name = $1, callsign = $2, locale = $3
        WHERE id = $4 AND is_active = true
        RETURNING *
      `;
      const result = await this.db.query(query, [
        updateData.name,
        updateData.callsign.toUpperCase(),
        updateData.locale,
        userId
      ]);

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'User not found or not active'
        };
      }

      const updatedUser = result.rows[0];

      return {
        success: true,
        message: 'Profile updated successfully',
        user: this.toUserProfile(updatedUser)
      };

    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Profile update failed'
      };
    }
  }

  async requestPasswordReset(email: string): Promise<AuthResponse> {
    try {
      const user = await this.getUserByEmail(email);
      
      if (!user) {
        // Return success even if user not found (security practice)
        return {
          success: true,
          message: 'If this email exists in our system, you will receive a password reset link.'
        };
      }

      if (!user.is_active) {
        return {
          success: false,
          message: 'Account is not active. Please verify your email first.'
        };
      }

      // Generate reset token
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = Math.floor(Date.now() / 1000) + this.RESET_TOKEN_DURATION;

      // Store reset token
      await this.storePasswordResetToken(user.id, resetToken, expiresAt);

      // Send reset email
      try {
        await emailService.sendPasswordReset(user, resetToken);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        return {
          success: false,
          message: '' // Let frontend handle the translated message
        };
      }

      return {
        success: true,
        message: '' // Let frontend handle the translated message
      };

    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        message: '' // Let frontend handle the translated message
      };
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<AuthResponse> {
    try {
      const resetToken = await this.getPasswordResetToken(token);
      
      if (!resetToken) {
        return {
          success: false,
          message: 'Invalid password reset token.'
        };
      }

      if (this.isTokenExpired(resetToken.expires_at)) {
        await this.removePasswordResetToken(token);
        return {
          success: false,
          message: 'Password reset token has expired.'
        };
      }

      // Update user password
      await this.updateUserPassword(resetToken.user_id, newPassword);
      
      // Remove used token
      await this.removePasswordResetToken(token);
      
      // Invalidate all user sessions for security
      await this.removeAllUserSessions(resetToken.user_id);

      return {
        success: true,
        message: 'Password reset successfully. Please log in with your new password.'
      };

    } catch (error) {
      console.error('Password reset confirmation error:', error);
      return {
        success: false,
        message: 'Failed to reset password.'
      };
    }
  }

  async changePassword(userId: number, passwordChangeData: PasswordChangeRequest): Promise<AuthResponse> {
    try {
      const user = await this.getUserById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found.'
        };
      }

      // Verify current password
      const passwordValid = await this.verifyPassword(passwordChangeData.currentPassword, user.password_hash);
      if (!passwordValid) {
        return {
          success: false,
          message: 'Current password is incorrect.'
        };
      }

      // Validate new password
      if (passwordChangeData.newPassword.length < 8) {
        return {
          success: false,
          message: 'New password must be at least 8 characters long.'
        };
      }

      // Update password
      await this.updateUserPassword(userId, passwordChangeData.newPassword);
      
      // Invalidate all user sessions for security (except current one)
      // Note: For better UX, we might want to keep the current session active
      // but invalidate all other sessions
      await this.removeAllUserSessions(userId);

      return {
        success: true,
        message: 'Password changed successfully.'
      };

    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        message: 'Failed to change password.'
      };
    }
  }

  async requestEmailChange(userId: number, newEmail: string, currentPassword: string): Promise<AuthResponse> {
    try {
      const user = await this.getUserById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found.'
        };
      }

      // Verify current password using bcrypt
      const passwordValid = await this.verifyPassword(currentPassword, user.password_hash);
      if (!passwordValid) {
        return {
          success: false,
          message: 'Current password is incorrect.'
        };
      }

      // Check if new email is already in use
      const existingUser = await this.getUserByEmail(newEmail);
      if (existingUser && existingUser.id !== userId) {
        return {
          success: false,
          message: 'Email address is already in use.'
        };
      }

      // Generate tokens for two-step verification
      const oldEmailToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = Math.floor(Date.now() / 1000) + this.VERIFICATION_DURATION;

      // Store email change request (Step 1 - only old email token)
      await this.storeEmailChangeRequest(userId, user.email, newEmail, oldEmailToken, expiresAt);

      // Send verification email to CURRENT email address (Step 1)
      try {
        await emailService.sendOldEmailVerification(user, newEmail, oldEmailToken);
      } catch (emailError) {
        console.error('Failed to send old email verification:', emailError);
        return {
        success: false,
        message: '' // Let frontend handle the translated message
      };
      }

      return {
        success: true,
        message: '' // Let frontend handle the translated message
      };

    } catch (error) {
      console.error('Email change request error:', error);
      return {
        success: false,
        message: '' // Let frontend handle the translated message
      };
    }
  }

  async confirmOldEmail(token: string): Promise<AuthResponse> {
    try {
      const changeRequest = await this.getEmailChangeByOldToken(token);
      
      if (!changeRequest) {
        return {
          success: false,
          message: '' // Let frontend handle the translated message
        };
      }

      if (this.isTokenExpired(changeRequest.expires_at)) {
        await this.removeEmailChangeRequest(changeRequest.id);
        return {
          success: false,
          message: '' // Let frontend handle the translated message
        };
      }

      if (changeRequest.old_email_verified) {
        return {
          success: false,
          message: '' // Let frontend handle the translated message
        };
      }

      // Generate token for new email verification (Step 2)
      const newEmailToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Mark old email as verified and store new email token
      await this.markOldEmailVerified(changeRequest.id, newEmailToken);

      // Get user details for email
      const user = await this.getUserById(changeRequest.user_id);
      if (!user) {
        return {
          success: false,
          message: 'User not found.'
        };
      }

      // Send verification email to NEW email address (Step 2)
      try {
        await emailService.sendNewEmailVerification(user, changeRequest.new_email, newEmailToken);
      } catch (emailError) {
        console.error('Failed to send new email verification:', emailError);
        return {
          success: false,
          message: '' // Let frontend handle the translated message
        };
      }

      return {
        success: true,
        message: '' // Let frontend handle the translated message
      };

    } catch (error) {
      console.error('Old email confirmation error:', error);
      return {
        success: false,
        message: '' // Let frontend handle the translated message
      };
    }
  }

  async confirmNewEmail(token: string): Promise<AuthResponse> {
    try {
      const changeRequest = await this.getEmailChangeByNewToken(token);
      
      if (!changeRequest) {
        return {
          success: false,
          message: '' // Let frontend handle the translated message
        };
      }

      if (this.isTokenExpired(changeRequest.expires_at)) {
        await this.removeEmailChangeRequest(changeRequest.id);
        return {
          success: false,
          message: '' // Let frontend handle the translated message
        };
      }

      if (!changeRequest.old_email_verified) {
        return {
          success: false,
          message: '' // Let frontend handle the translated message
        };
      }

      if (changeRequest.new_email_verified) {
        return {
          success: false,
          message: '' // Let frontend handle the translated message
        };
      }

      // Update user email address
      await this.updateUserEmail(changeRequest.user_id, changeRequest.new_email);
      
      // Mark new email as verified
      await this.markNewEmailVerified(changeRequest.id);

      // Remove used token after successful verification
      await this.removeEmailChangeRequest(changeRequest.id);

      return {
        success: true,
        message: '' // Let frontend handle the translated message
      };

    } catch (error) {
      console.error('New email confirmation error:', error);
      return {
        success: false,
        message: '' // Let frontend handle the translated message
      };
    }
  }

  // Private helper methods
  private async getUserByEmailOrCallsign(email: string, callsign: string): Promise<User | null> {
    const query = `
      SELECT * FROM users 
      WHERE email = $1 OR callsign = $2
      LIMIT 1
    `;
    const result = await this.db.query(query, [email.toLowerCase(), callsign.toUpperCase()]);
    return result.rows[0] || null;
  }

  private async getVerificationByToken(token: string): Promise<UserVerification | null> {
    const query = `SELECT * FROM user_verifications WHERE verification_token = $1`;
    const result = await this.db.query(query, [token]);
    return result.rows[0] || null;
  }

  private async storeUserVerification(verification: any): Promise<void> {
    const query = `
      INSERT INTO user_verifications 
      (callsign, name, email, password_hash, verification_token, is_verified, created_at, expires_at, locale)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    await this.db.query(query, [
      verification.callsign,
      verification.name,
      verification.email,
      verification.password_hash,
      verification.verification_token,
      verification.is_verified,
      verification.created_at,
      verification.expires_at,
      verification.locale
    ]);
  }

  private async createUser(user: any): Promise<number> {
    const query = `
      INSERT INTO users 
      (callsign, name, email, password_hash, is_active, created_at, locale)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    const result = await this.db.query(query, [
      user.callsign,
      user.name,
      user.email,
      user.password_hash,
      user.is_active,
      user.created_at,
      user.locale
    ]);
    return result.rows[0].id;
  }

  private async markVerificationComplete(verificationId: number): Promise<void> {
    const query = `UPDATE user_verifications SET is_verified = true WHERE id = $1`;
    await this.db.query(query, [verificationId]);
  }

  private async getUserById(id: number): Promise<User | null> {
    const query = `SELECT * FROM users WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  private async updateLastLogin(userId: number): Promise<void> {
    const query = `UPDATE users SET last_login_at = $1 WHERE id = $2`;
    await this.db.query(query, [Math.floor(Date.now() / 1000), userId]);
  }

  private async createSession(userId: number): Promise<string> {
    const sessionToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = Math.floor(Date.now() / 1000) + this.SESSION_DURATION;
    
    const query = `
      INSERT INTO user_sessions (session_token, user_id, created_at, expires_at)
      VALUES ($1, $2, $3, $4)
    `;
    await this.db.query(query, [sessionToken, userId, Math.floor(Date.now() / 1000), expiresAt]);
    
    return sessionToken;
  }

  private async getSessionByToken(sessionToken: string): Promise<UserSession | null> {
    const query = `SELECT * FROM user_sessions WHERE session_token = $1`;
    const result = await this.db.query(query, [sessionToken]);
    return result.rows[0] || null;
  }

  private async removeSession(sessionToken: string): Promise<void> {
    const query = `DELETE FROM user_sessions WHERE session_token = $1`;
    await this.db.query(query, [sessionToken]);
  }

  private isTokenExpired(expiresAt: number): boolean {
    return Math.floor(Date.now() / 1000) > expiresAt;
  }

  private toUserProfile(user: User): UserProfile {
    return {
      id: user.id,
      callsign: user.callsign,
      name: user.name,
      email: user.email,
      is_active: user.is_active,
      created_at: user.created_at,
      last_login_at: user.last_login_at,
      locale: user.locale
    };
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE email = $1`;
    const result = await this.db.query(query, [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  private async getUserByCallsign(callsign: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE callsign = $1`;
    const result = await this.db.query(query, [callsign.toUpperCase()]);
    return result.rows[0] || null;
  }

  private async storePasswordResetToken(userId: number, token: string, expiresAt: number): Promise<void> {
    const query = `
      INSERT INTO password_reset_tokens (user_id, reset_token, created_at, expires_at)
      VALUES ($1, $2, $3, $4)
    `;
    await this.db.query(query, [userId, token, Math.floor(Date.now() / 1000), expiresAt]);
  }

  private async getPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    const query = `SELECT * FROM password_reset_tokens WHERE reset_token = $1`;
    const result = await this.db.query(query, [token]);
    return result.rows[0] || null;
  }

  private async removePasswordResetToken(token: string): Promise<void> {
    const query = `DELETE FROM password_reset_tokens WHERE reset_token = $1`;
    await this.db.query(query, [token]);
  }

  private async updateUserPassword(userId: number, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);
    const query = `UPDATE users SET password_hash = $1 WHERE id = $2`;
    await this.db.query(query, [hashedPassword, userId]);
  }

  private async removeAllUserSessions(userId: number): Promise<void> {
    const query = `DELETE FROM user_sessions WHERE user_id = $1`;
    await this.db.query(query, [userId]);
  }

  private async storeEmailChangeRequest(userId: number, oldEmail: string, newEmail: string, oldEmailToken: string, expiresAt: number): Promise<void> {
    const query = `
      INSERT INTO email_change_tokens (user_id, old_email, new_email, old_email_token, created_at, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await this.db.query(query, [userId, oldEmail, newEmail, oldEmailToken, Math.floor(Date.now() / 1000), expiresAt]);
  }

  private async getEmailChangeByOldToken(token: string): Promise<any | null> {
    const query = `SELECT * FROM email_change_tokens WHERE old_email_token = $1`;
    const result = await this.db.query(query, [token]);
    return result.rows[0] || null;
  }

  private async getEmailChangeByNewToken(token: string): Promise<any | null> {
    const query = `SELECT * FROM email_change_tokens WHERE new_email_token = $1`;
    const result = await this.db.query(query, [token]);
    return result.rows[0] || null;
  }

  private async markOldEmailVerified(requestId: number, newEmailToken: string): Promise<void> {
    const query = `
      UPDATE email_change_tokens 
      SET old_email_verified = true, new_email_token = $1
      WHERE id = $2
    `;
    await this.db.query(query, [newEmailToken, requestId]);
  }

  private async markNewEmailVerified(requestId: number): Promise<void> {
    const query = `
      UPDATE email_change_tokens 
      SET new_email_verified = true
      WHERE id = $1
    `;
    await this.db.query(query, [requestId]);
  }

  private async removeEmailChangeRequest(requestId: number): Promise<void> {
    const query = `DELETE FROM email_change_tokens WHERE id = $1`;
    await this.db.query(query, [requestId]);
  }

  private async updateUserEmail(userId: number, newEmail: string): Promise<void> {
    const query = `UPDATE users SET email = $1 WHERE id = $2`;
    await this.db.query(query, [newEmail.toLowerCase(), userId]);
  }
}