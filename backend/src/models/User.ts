export interface User {
  id: number;
  callsign: string;
  name: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  created_at: number;
  last_login_at?: number;
  locale: string;
}

export interface UserVerification {
  id: number;
  callsign: string;
  name: string;
  email: string;
  password_hash: string;
  verification_token: string;
  is_verified: boolean;
  created_at: number;
  expires_at: number;
  locale: string;
}

export interface UserSession {
  id: number;
  session_token: string;
  user_id: number;
  created_at: number;
  expires_at: number;
}

export interface PasswordResetToken {
  id: number;
  user_id: number;
  reset_token: string;
  is_used: boolean;
  created_at: number;
  expires_at: number;
}

export interface EmailChangeToken {
  id: number;
  user_id: number;
  old_email: string;
  new_email: string;
  old_email_token: string;
  new_email_token?: string;
  old_email_verified: boolean;
  new_email_verified: boolean;
  created_at: number;
  expires_at: number;
}

// DTOs for API requests/responses
export interface RegisterRequest {
  callsign: string;
  name: string;
  email: string;
  password: string;
  locale?: string;
}

export interface LoginRequest {
  identifier: string; // Can be email or callsign
  password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface EmailChangeRequest {
  newEmail: string;
  password: string;
}

export interface ProfileUpdateRequest {
  name: string;
  callsign: string;
  locale: string;
}

export interface UserProfile {
  id: number;
  callsign: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: number;
  last_login_at?: number;
  locale: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: UserProfile;
  session_token?: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  verified?: boolean;
}