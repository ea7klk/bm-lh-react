import { DatabaseService } from './databaseService';

// Token expiration times in seconds
export const TOKEN_EXPIRATION = {
  PASSWORD_RESET: 60 * 60, // 1 hour
  EMAIL_CHANGE: 24 * 60 * 60 // 24 hours
} as const;

export class CleanupService {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
  }

  /**
   * Clean up all expired tokens from the database
   * - Password reset tokens (expire after 1 hour)
   * - Email change tokens (expire after 24 hours)
   */
  async cleanupExpiredTokens(): Promise<{ passwordResetTokens: number; emailChangeTokens: number }> {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    try {
      // Clean up expired password reset tokens
      const passwordResetResult = await this.db.query(
        'DELETE FROM password_reset_tokens WHERE expires_at < $1',
        [currentTimestamp]
      );
      
      // Clean up expired email change tokens
      const emailChangeResult = await this.db.query(
        'DELETE FROM email_change_tokens WHERE expires_at < $1',
        [currentTimestamp]
      );
      
      const passwordResetDeleted = passwordResetResult.rowCount || 0;
      const emailChangeDeleted = emailChangeResult.rowCount || 0;
      
      if (passwordResetDeleted > 0 || emailChangeDeleted > 0) {
        console.log(`Token cleanup completed: ${passwordResetDeleted} password reset tokens, ${emailChangeDeleted} email change tokens removed`);
      }
      
      return {
        passwordResetTokens: passwordResetDeleted,
        emailChangeTokens: emailChangeDeleted
      };
    } catch (error) {
      console.error('Error during token cleanup:', error);
      throw error;
    }
  }

  /**
   * Clean up used password reset tokens (marked as is_used = true)
   * These can be cleaned up immediately after use
   */
  async cleanupUsedPasswordResetTokens(): Promise<number> {
    try {
      const result = await this.db.query(
        'DELETE FROM password_reset_tokens WHERE is_used = true'
      );
      
      const deleted = result.rowCount || 0;
      if (deleted > 0) {
        console.log(`Cleaned up ${deleted} used password reset tokens`);
      }
      
      return deleted;
    } catch (error) {
      console.error('Error cleaning up used password reset tokens:', error);
      throw error;
    }
  }

  /**
   * Clean up completed email change tokens (both old and new email verified)
   * These can be cleaned up immediately after completion
   */
  async cleanupCompletedEmailChangeTokens(): Promise<number> {
    try {
      const result = await this.db.query(
        'DELETE FROM email_change_tokens WHERE old_email_verified = true AND new_email_verified = true'
      );
      
      const deleted = result.rowCount || 0;
      if (deleted > 0) {
        console.log(`Cleaned up ${deleted} completed email change tokens`);
      }
      
      return deleted;
    } catch (error) {
      console.error('Error cleaning up completed email change tokens:', error);
      throw error;
    }
  }

  /**
   * Get statistics about current tokens in the database
   */
  async getTokenStatistics(): Promise<{
    totalPasswordResetTokens: number;
    expiredPasswordResetTokens: number;
    totalEmailChangeTokens: number;
    expiredEmailChangeTokens: number;
  }> {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    try {
      // Count total and expired password reset tokens
      const passwordResetTotal = await this.db.query('SELECT COUNT(*) as count FROM password_reset_tokens');
      const passwordResetExpired = await this.db.query(
        'SELECT COUNT(*) as count FROM password_reset_tokens WHERE expires_at < $1',
        [currentTimestamp]
      );
      
      // Count total and expired email change tokens
      const emailChangeTotal = await this.db.query('SELECT COUNT(*) as count FROM email_change_tokens');
      const emailChangeExpired = await this.db.query(
        'SELECT COUNT(*) as count FROM email_change_tokens WHERE expires_at < $1',
        [currentTimestamp]
      );
      
      return {
        totalPasswordResetTokens: parseInt(passwordResetTotal.rows[0].count),
        expiredPasswordResetTokens: parseInt(passwordResetExpired.rows[0].count),
        totalEmailChangeTokens: parseInt(emailChangeTotal.rows[0].count),
        expiredEmailChangeTokens: parseInt(emailChangeExpired.rows[0].count)
      };
    } catch (error) {
      console.error('Error getting token statistics:', error);
      throw error;
    }
  }

  /**
   * Get detailed token information for debugging
   */
  async getTokenDetails(): Promise<{
    passwordResetTokens: Array<{ id: number; expires_at: number; is_expired: boolean }>;
    emailChangeTokens: Array<{ id: number; expires_at: number; is_expired: boolean }>;
  }> {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    try {
      const passwordResetTokens = await this.db.query(
        'SELECT id, expires_at, (expires_at < $1) as is_expired FROM password_reset_tokens ORDER BY expires_at',
        [currentTimestamp]
      );
      
      const emailChangeTokens = await this.db.query(
        'SELECT id, expires_at, (expires_at < $1) as is_expired FROM email_change_tokens ORDER BY expires_at',
        [currentTimestamp]
      );
      
      return {
        passwordResetTokens: passwordResetTokens.rows,
        emailChangeTokens: emailChangeTokens.rows
      };
    } catch (error) {
      console.error('Error getting token details:', error);
      throw error;
    }
  }
}

export const cleanupService = new CleanupService();