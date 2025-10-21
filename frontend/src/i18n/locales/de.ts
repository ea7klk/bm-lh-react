export const de = {
  // Header
  title: "Was läuft auf Brandmeister?",
  subtitle: "Brandmeister Netzwerk-Aktivitätsmonitor",
  
  // Controls
  refreshData: "Daten Aktualisieren",
  autoRefresh: "Auto-Aktualisierung (10s)",
  showingTalkgroups: "Zeige {{count}} Gesprächsgruppen",
  
  // Error messages
  failedToLoad: "Fehler beim Laden der Daten. Prüfen Sie, ob das Backend läuft.",
  retry: "Wiederholen",
  
  // Filter Panel
  filters: "Filter",
  timeFilter: "Zeitfilter",
  allTime: "Alle Zeit",
  last5minutes: "Letzte 5 Minuten",
  last10minutes: "Letzte 10 Minuten",
  last15minutes: "Letzte 15 Minuten",
  last30minutes: "Letzte 30 Minuten",
  lastHour: "Letzte Stunde",
  last3hours: "Letzte 3 Stunden",
  last6hours: "Letzte 6 Stunden",
  last12hours: "Letzte 12 Stunden",
  last24hours: "Letzte 24 Stunden",
  last3days: "Letzte 3 Tage",
  last5days: "Letzte 5 Tage",
  lastWeek: "Letzte Woche",
  
  maxEntries: "Max. Einträge",
  entries10: "10 Einträge",
  entries20: "20 Einträge",
  entries30: "30 Einträge",
  entries50: "50 Einträge",
  
  continent: "Kontinent",
  allContinents: "Alle Kontinente",
  country: "Land",
  allCountries: "Alle Länder",
  
  resetFilters: "Filter Zurücksetzen",
  applyFilters: "Filter Anwenden",
  
  // Charts
  talkgroupActivity: "Gesprächsgruppen-Aktivität",
  activityDuration: "Aktivitätsdauer",
  talkgroupsByTotalDuration: "Gesprächsgruppen nach Gesamtdauer",
  transmissions: "Übertragungen",
  avgDurationSeconds: "Durchschn. Dauer (Sekunden)",
  loading: "Laden...",
  numberOfTransmissionsByTalkgroup: "Anzahl der Übertragungen pro Gesprächsgruppe",
  totalAirTimeByTalkgroup: "Gesamte Sendezeit pro Gesprächsgruppe",
  showingTopActiveGroups: "Zeige die {{count}} aktivsten Gesprächsgruppen",
  showingTopGroupsByDuration: "Zeige die {{count}} aktivsten Gesprächsgruppen nach Dauer",
  simultaneousSessionsNote: "Manchmal kann die gemeldete Gesamtzeit die Dauer des ausgewählten Zeitbereichs überschreiten. Dies liegt daran, dass die Daten vom BM LastHeard WebSocket stammen, der gleichzeitige Sitzungen in derselben Gesprächsgruppe ermöglicht, aber nur die erste Sitzung wird tatsächlich übertragen",
  
  // Table
  talkgroupStatisticsTable: "Gesamt-QSO-Statistiken nach Gesprächsgruppe",
  detailedTalkgroupStatistics: "Detaillierte Gesprächsgruppen-Statistiken",
  destinationName: "Zielname",
  destinationID: "Ziel-ID",
  count: "Anzahl",
  totalDuration: "Gesamtdauer",
  
  // Language selector
  language: "Sprache",
  
  // Authentication
  login: "Anmelden / Registrieren",
  signInPrompt: "Bitte melde dich bei deinem Konto an",
  register: "Registrieren",
  createAccountPrompt: "Erstelle dein Amateurfunk-Konto",
  noAccountYet: "Noch kein Konto?",
  resetPasswordPrompt: "Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.",
  callsign: "Rufzeichen",
  name: "Name",
  email: "E-Mail",
  password: "Passwort",
  confirmPassword: "Passwort Bestätigen",
  currentPassword: "Aktuelles Passwort",
  newPassword: "Neues Passwort",
  forgotPassword: "Passwort vergessen?",
  resetPassword: "Passwort Zurücksetzen",
  changePassword: "Passwort Ändern",
  changeEmail: "E-Mail Ändern",
  newEmail: "Neue E-Mail",
  verifyEmail: "E-Mail Verifizieren",
  emailVerification: "E-Mail Verifizierung",
  resendVerification: "Verifizierung Erneut Senden",
  
  // Auth form labels and placeholders
  callsignPlaceholder: "Gib dein Rufzeichen ein",
  namePlaceholder: "Gib deinen vollständigen Namen ein",
  emailPlaceholder: "Gib deine E-Mail-Adresse ein",
  passwordPlaceholder: "Gib dein Passwort ein",
  confirmPasswordPlaceholder: "Bestätige dein Passwort",
  emailOrCallsign: "E-Mail oder Rufzeichen",
  emailOrCallsignPlaceholder: "Gib E-Mail oder Rufzeichen ein",
  
  // Auth buttons
  registerButton: "Konto Erstellen",
  resetPasswordButton: "Reset-Link Senden",
  changePasswordButton: "Passwort Aktualisieren",
  changeEmailButton: "E-Mail Aktualisieren",
  cancelButton: "Abbrechen",
  backToLogin: "Zurück zur Anmeldung",
  
  // Auth messages
  registrationSuccess: "Registrierung erfolgreich! Überprüfe deine E-Mail zur Kontobestätigung.",
  loginSuccess: "Willkommen zurück!",
  logoutSuccess: "Du wurdest erfolgreich abgemeldet.",
  emailVerificationSent: "Bestätigungs-E-Mail gesendet. Überprüfe deinen Posteingang.",
  emailVerified: "E-Mail erfolgreich bestätigt! Du kannst dich jetzt anmelden.",
  passwordResetSent: "Passwort-Reset-Link an deine E-Mail gesendet.",
  passwordChanged: "Passwort erfolgreich geändert.",
  emailChanged: "E-Mail-Adresse erfolgreich aktualisiert.",
  
  // Auth errors
  invalidCredentials: "Ungültige E-Mail/Rufzeichen oder Passwort.",
  accountNotActivated: "Konto nicht aktiviert. Bitte bestätige deine E-Mail.",
  emailAlreadyExists: "Ein Konto mit dieser E-Mail existiert bereits.",
  callsignAlreadyExists: "Ein Konto mit diesem Rufzeichen existiert bereits.",
  invalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
  invalidCallsign: "Bitte gib ein gültiges Rufzeichen ein.",
  passwordTooShort: "Passwort muss mindestens 8 Zeichen lang sein.",
  passwordsDoNotMatch: "Passwörter stimmen nicht überein.",
  tokenExpired: "Token ist abgelaufen. Bitte fordere einen neuen an.",
  invalidToken: "Ungültiger oder abgelaufener Token.",
  currentPasswordIncorrect: "Aktuelles Passwort ist falsch.",
  
  // Auth form validation
  required: "Dieses Feld ist erforderlich",
  emailRequired: "E-Mail ist erforderlich",
  callsignRequired: "Rufzeichen ist erforderlich",
  nameRequired: "Name ist erforderlich",
  passwordRequired: "Passwort ist erforderlich",
  
  // Profile
  profile: "Profil",
  settings: "Einstellungen",
  personalInformation: "Persönliche Informationen",
  basicInformation: "Grundinformationen",
  accountInformation: "Kontoinformationen",
  security: "Sicherheit",
  preferences: "Einstellungen",
  status: "Status",
  active: "Aktiv",
  inactive: "Inaktiv",
  memberSince: "Mitglied seit",
  lastLogin: "Letzte Anmeldung",
  never: "Nie",
  close: "Schließen",
  save: "Speichern",
  cancel: "Abbrechen",
  editProfile: "Profil Bearbeiten",
  saveChanges: "Änderungen Speichern",
  updateProfile: "Profil Aktualisieren",
  profileUpdated: "Profil erfolgreich aktualisiert",
  languagePreference: "Spracheinstellung",
  
  // User menu
  userMenu: "Benutzermenü",
  viewProfile: "Profil Anzeigen",
  accountSettings: "Kontoeinstellungen",
  signOut: "Abmelden",
  
  // Account verification
  accountVerificationRequired: "Kontobestätigung Erforderlich",
  checkEmailForVerification: "Überprüfen Sie Ihre E-Mail und klicken Sie auf den Bestätigungslink zur Kontoaktivierung.",
  verificationLinkExpired: "Bestätigungslink abgelaufen. Bitte fordern Sie einen neuen an.",
} as const;