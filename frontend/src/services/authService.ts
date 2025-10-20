import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  PasswordResetRequest, 
  PasswordResetConfirmRequest,
  PasswordChangeRequest,
  EmailChangeRequest,
  UserProfile,
  VerificationResponse 
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class AuthService {
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('session_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    return response.json();
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const result = await response.json();
    
    // Store session token if login successful
    if (result.success && result.session_token) {
      localStorage.setItem('session_token', result.session_token);
    }

    return result;
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage regardless of API response
      localStorage.removeItem('session_token');
    }
  }

  async getProfile(): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.success ? result.user : null;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  async verifyEmail(token: string): Promise<VerificationResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify/${token}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Email verification failed');
    }

    return response.json();
  }

  async requestPasswordReset(data: PasswordResetRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Password reset request failed');
    }

    return response.json();
  }

  async confirmPasswordReset(data: PasswordResetConfirmRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset/confirm`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Password reset confirmation failed');
    }

    return response.json();
  }

  async changePassword(data: PasswordChangeRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/password-change`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Password change failed');
    }

    return response.json();
  }

  async requestEmailChange(data: EmailChangeRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/email-change`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Email change request failed');
    }

    return response.json();
  }

  async confirmEmailChange(token: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/email-change/confirm/${token}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Email change confirmation failed');
    }

    return response.json();
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('session_token');
  }

  getSessionToken(): string | null {
    return localStorage.getItem('session_token');
  }
}

export const authService = new AuthService();