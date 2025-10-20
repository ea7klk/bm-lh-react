export const en = {
  // Header
  title: "BM Last Heard",
  subtitle: "Brandmeister Network Activity Monitor",
  
  // Controls
  refreshData: "Refresh Data",
  autoRefresh: "Auto-refresh (10s)",
  showingTalkgroups: "Showing {{count}} talkgroups",
  
  // Error messages
  failedToLoad: "Failed to load data. Please check if the backend is running.",
  retry: "Retry",
  
  // Filter Panel
  filters: "Filters",
  timeFilter: "Time Filter",
  allTime: "All Time",
  last5minutes: "Last 5 minutes",
  last10minutes: "Last 10 minutes",
  last15minutes: "Last 15 minutes",
  last30minutes: "Last 30 minutes",
  lastHour: "Last hour",
  last3hours: "Last 3 hours",
  last6hours: "Last 6 hours",
  last12hours: "Last 12 hours",
  last24hours: "Last 24 hours",
  last3days: "Last 3 days",
  last5days: "Last 5 days",
  lastWeek: "Last week",
  
  maxEntries: "Max Entries",
  entries10: "10 entries",
  entries20: "20 entries",
  entries30: "30 entries",
  entries50: "50 entries",
  
  continent: "Continent",
  allContinents: "All Continents",
  country: "Country",
  allCountries: "All Countries",
  
  resetFilters: "Reset Filters",
  applyFilters: "Apply Filters",
  
  // Charts
  talkgroupActivity: "Talkgroup Activity",
  activityDuration: "Activity Duration",
  talkgroupsByTotalDuration: "Talkgroups by Total Duration",
  transmissions: "Transmissions",
  avgDurationSeconds: "Avg Duration (seconds)",
  loading: "Loading...",
  numberOfTransmissionsByTalkgroup: "Number of transmissions by talkgroup",
  totalAirTimeByTalkgroup: "Total air time by talkgroup",
  showingTopActiveGroups: "Showing top {{count}} most active talkgroups",
  showingTopGroupsByDuration: "Showing top {{count}} talkgroups by duration",
  simultaneousSessionsNote: "In some occasions, the total reported time can exceed the selected time range duration. This is caused by the data coming from the BM LastHeard Websocket, which allows simultaneous sessions on the same talkgroup, but only the first session is actually transmitted",
  
  // Language selector
  language: "Language",
  
  // Authentication
  login: "Login / Register",
  register: "Register",
  callsign: "Callsign",
  name: "Name",
  email: "Email",
  password: "Password",
  confirmPassword: "Confirm Password",
  currentPassword: "Current Password",
  newPassword: "New Password",
  forgotPassword: "Forgot Password?",
  resetPassword: "Reset Password",
  changePassword: "Change Password",
  changeEmail: "Change Email",
  newEmail: "New Email",
  verifyEmail: "Verify Email",
  emailVerification: "Email Verification",
  resendVerification: "Resend Verification",
  
  // Auth form labels and placeholders
  callsignPlaceholder: "Enter your callsign",
  namePlaceholder: "Enter your full name",
  emailPlaceholder: "Enter your email address",
  passwordPlaceholder: "Enter your password",
  confirmPasswordPlaceholder: "Confirm your password",
  emailOrCallsign: "Email or Callsign",
  emailOrCallsignPlaceholder: "Enter email or callsign",
  
  // Auth buttons
  registerButton: "Create Account",
  resetPasswordButton: "Send Reset Link",
  changePasswordButton: "Update Password",
  changeEmailButton: "Update Email",
  cancelButton: "Cancel",
  backToLogin: "Back to Login",
  
  // Auth messages
  registrationSuccess: "Registration successful! Please check your email to verify your account.",
  loginSuccess: "Welcome back!",
  logoutSuccess: "You have been logged out successfully.",
  emailVerificationSent: "Verification email sent. Please check your inbox.",
  emailVerified: "Email verified successfully! You can now log in.",
  passwordResetSent: "Password reset link sent to your email.",
  passwordChanged: "Password changed successfully.",
  emailChanged: "Email address updated successfully.",
  
  // Auth errors
  invalidCredentials: "Invalid email/callsign or password.",
  accountNotActivated: "Account not activated. Please verify your email.",
  emailAlreadyExists: "An account with this email already exists.",
  callsignAlreadyExists: "An account with this callsign already exists.",
  invalidEmail: "Please enter a valid email address.",
  invalidCallsign: "Please enter a valid callsign.",
  passwordTooShort: "Password must be at least 8 characters long.",
  passwordsDoNotMatch: "Passwords do not match.",
  tokenExpired: "Token has expired. Please request a new one.",
  invalidToken: "Invalid or expired token.",
  currentPasswordIncorrect: "Current password is incorrect.",
  
  // Auth form validation
  required: "This field is required",
  emailRequired: "Email is required",
  callsignRequired: "Callsign is required",
  nameRequired: "Name is required",
  passwordRequired: "Password is required",
  
  // Profile
  profile: "Profile",
  settings: "Settings",
  personalInformation: "Personal Information",
  basicInformation: "Basic Information",
  accountInformation: "Account Information",
  security: "Security",
  preferences: "Preferences",
  status: "Status",
  active: "Active",
  inactive: "Inactive",
  memberSince: "Member Since",
  lastLogin: "Last Login",
  never: "Never",
  close: "Close",
  
  // User menu
  userMenu: "User Menu",
  viewProfile: "View Profile",
  accountSettings: "Account Settings",
  signOut: "Sign Out",
  
  // Account verification
  accountVerificationRequired: "Account Verification Required",
  checkEmailForVerification: "Please check your email and click the verification link to activate your account.",
  verificationLinkExpired: "Verification link expired. Please request a new one.",
} as const;