export interface LastHeardEntry {
  id: number;
  SourceID: number;
  DestinationID: number;
  SourceCall: string;
  SourceName?: string;
  DestinationCall?: string;
  DestinationName?: string;
  Start: number; // bigint timestamp
  Stop?: number; // bigint timestamp
  TalkerAlias?: string;
  duration?: number;
  created_at?: number; // bigint timestamp
  continent?: string;
  country?: string;
  full_country_name?: string;
  talkgroup_name?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  error?: string;
}

export interface Country {
  country: string;
  full_country_name: string;
}

export interface FilterOptions {
  timeFilter: string;
  continent: string;
  country: string;
  maxEntries: string;
}

export interface AdvancedFilterOptions extends FilterOptions {
  talkgroup: string;
  callsign: string;
}

export interface TalkgroupStats {
  talkgroup_id: number;
  name: string;
  count: number;
  continent?: string;
  country?: string;
  full_country_name?: string;
}

export interface TalkgroupDurationStats {
  talkgroup_id: number;
  name: string;
  total_duration: number;
  continent?: string;
  country?: string;
  full_country_name?: string;
}

export interface Talkgroup {
  id: number;
  name: string;
  continent?: string;
  country?: string;
}

export interface CallsignInfo {
  callsign: string;
  name?: string;
  count: number;
  total_duration: number;
}

// User authentication types
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

export interface RegisterRequest {
  callsign: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
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
  confirmPassword: string;
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

export interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  register: (data: RegisterRequest) => Promise<AuthResponse>;
  updateProfile: (data: ProfileUpdateRequest) => Promise<AuthResponse>;
  changePassword: (data: PasswordChangeRequest) => Promise<AuthResponse>;
  requestEmailChange: (newEmail: string, currentPassword: string) => Promise<AuthResponse>;
  isAuthenticated: boolean;
}
