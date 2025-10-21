export const es = {
  // Header
  title: "¿Qué pasa en Brandmeister?",
  subtitle: "Monitor de Actividad de la Red Brandmeister",
  
  // Controls
  refreshData: "Actualizar Datos",
  autoRefresh: "Auto-actualizar (10s)",
  showingTalkgroups: "Mostrando {{count}} grupos de conversación",
  
  // Error messages
  failedToLoad: "Error al cargar los datos. Verifique si el backend está funcionando.",
  retry: "Reintentar",
  
  // Filter Panel
  filters: "Filtros",
  timeFilter: "Filtro de Tiempo",
  allTime: "Todo el Tiempo",
  last5minutes: "Últimos 5 minutos",
  last10minutes: "Últimos 10 minutos",
  last15minutes: "Últimos 15 minutos",
  last30minutes: "Últimos 30 minutos",
  lastHour: "Última hora",
  last3hours: "Últimas 3 horas",
  last6hours: "Últimas 6 horas",
  last12hours: "Últimas 12 horas",
  last24hours: "Últimas 24 horas",
  last3days: "Últimos 3 días",
  last5days: "Últimos 5 días",
  lastWeek: "Última semana",
  
  maxEntries: "Máximo de Entradas",
  entries10: "10 entradas",
  entries20: "20 entradas",
  entries30: "30 entradas",
  entries50: "50 entradas",
  
  continent: "Continente",
  allContinents: "Todos los Continentes",
  country: "País",
  allCountries: "Todos los Países",
  
  resetFilters: "Restablecer Filtros",
  applyFilters: "Aplicar Filtros",
  
  // Charts
  talkgroupActivity: "Actividad del Grupo de Conversación",
  activityDuration: "Duración de Actividad",
  talkgroupsByTotalDuration: "Grupos de Conversación por Duración Total",
  transmissions: "Transmisiones",
  avgDurationSeconds: "Duración Promedio (segundos)",
  loading: "Cargando...",
  numberOfTransmissionsByTalkgroup: "Número de transmisiones por grupo de conversación",
  totalAirTimeByTalkgroup: "Tiempo total de transmisión por grupo de conversación",
  showingTopActiveGroups: "Mostrando los {{count}} grupos de conversación más activos",
  showingTopGroupsByDuration: "Mostrando los {{count}} grupos de conversación más activos por duración",
  simultaneousSessionsNote: "En algunas ocasiones, el tiempo total reportado puede exceder la duración del rango de tiempo seleccionado. Esto se debe a que los datos provienen del WebSocket BM LastHeard, que permite sesiones simultáneas en el mismo grupo de conversación, pero solo la primera sesión se transmite realmente",
  
  // Table
  talkgroupStatisticsTable: "Estadísticas totales de QSO por grupo de conversación",
  detailedTalkgroupStatistics: "Estadísticas detalladas de grupos de conversación",
  destinationName: "Nombre de Destino",
  destinationID: "ID de Destino",
  count: "Cantidad",
  totalDuration: "Duración Total",
  
  // Language selector
  language: "Idioma",
  
  // Authentication
  login: "Iniciar Sesión / Registrarse",
  signInPrompt: "Por favor, inicia sesión en tu cuenta",
  register: "Registrarse",
  createAccountPrompt: "Crea tu cuenta de radioaficionado",
  noAccountYet: "¿No tienes una cuenta?",
  resetPasswordPrompt: "Introduce tu dirección de correo electrónico y te enviaremos un enlace para restablecer tu contraseña.",
  callsign: "Indicativo",
  name: "Nombre",
  email: "Correo Electrónico",
  password: "Contraseña",
  confirmPassword: "Confirmar Contraseña",
  currentPassword: "Contraseña Actual",
  newPassword: "Nueva Contraseña",
  forgotPassword: "¿Olvidaste tu contraseña?",
  resetPassword: "Restablecer Contraseña",
  changePassword: "Cambiar Contraseña",
  changeEmail: "Cambiar Correo",
  newEmail: "Nuevo Correo",
  verifyEmail: "Verificar Correo",
  emailVerification: "Verificación de Correo",
  resendVerification: "Reenviar Verificación",
  
  // Auth form labels and placeholders
  callsignPlaceholder: "Ingresa tu indicativo",
  namePlaceholder: "Ingresa tu nombre completo",
  emailPlaceholder: "Ingresa tu dirección de correo",
  passwordPlaceholder: "Ingresa tu contraseña",
  confirmPasswordPlaceholder: "Confirma tu contraseña",
  emailOrCallsign: "Correo o Indicativo",
  emailOrCallsignPlaceholder: "Ingresa correo o indicativo",
  
  // Auth buttons
  registerButton: "Crear Cuenta",
  resetPasswordButton: "Enviar Enlace",
  changePasswordButton: "Actualizar Contraseña",
  changeEmailButton: "Actualizar Correo",
  cancelButton: "Cancelar",
  backToLogin: "Volver al Inicio",
  
  // Auth messages
  registrationSuccess: "¡Registro exitoso! Revisa tu correo para verificar tu cuenta.",
  loginSuccess: "¡Bienvenido de vuelta!",
  logoutSuccess: "Has cerrado sesión exitosamente.",
  emailVerificationSent: "Correo de verificación enviado. Revisa tu bandeja de entrada.",
  emailVerified: "¡Correo verificado exitosamente! Ya puedes iniciar sesión.",
  passwordResetSent: "Enlace de restablecimiento enviado a tu correo.",
  passwordChanged: "Contraseña cambiada exitosamente.",
  emailChanged: "Dirección de correo actualizada exitosamente.",
  
  // Auth errors
  invalidCredentials: "Correo/indicativo o contraseña inválidos.",
  accountNotActivated: "Cuenta no activada. Verifica tu correo electrónico.",
  emailAlreadyExists: "Ya existe una cuenta con este correo electrónico.",
  callsignAlreadyExists: "Ya existe una cuenta con este indicativo.",
  invalidEmail: "Ingresa una dirección de correo válida.",
  invalidCallsign: "Ingresa un indicativo válido.",
  passwordTooShort: "La contraseña debe tener al menos 8 caracteres.",
  passwordsDoNotMatch: "Las contraseñas no coinciden.",
  tokenExpired: "El token ha expirado. Solicite uno nuevo.",
  invalidToken: "Token inválido o expirado.",
  currentPasswordIncorrect: "La contraseña actual es incorrecta.",
  
  // Auth form validation
  required: "Este campo es obligatorio",
  emailRequired: "El correo es obligatorio",
  callsignRequired: "El indicativo es obligatorio",
  nameRequired: "El nombre es obligatorio",
  passwordRequired: "La contraseña es obligatoria",
  
  // Profile
  profile: "Perfil",
  settings: "Configuración",
  personalInformation: "Información Personal",
  basicInformation: "Información Básica",
  accountInformation: "Información de la Cuenta",
  security: "Seguridad",
  preferences: "Preferencias",
  status: "Estado",
  active: "Activo",
  inactive: "Inactivo",
  memberSince: "Miembro desde",
  lastLogin: "Último acceso",
  never: "Nunca",
  close: "Cerrar",
  save: "Guardar",
  cancel: "Cancelar",
  editProfile: "Editar Perfil",
  saveChanges: "Guardar Cambios",
  updateProfile: "Actualizar Perfil",
  profileUpdated: "Perfil actualizado correctamente",
  languagePreference: "Preferencia de Idioma",
  
  // User menu
  userMenu: "Menú de Usuario",
  viewProfile: "Ver Perfil",
  accountSettings: "Configuración de Cuenta",
  signOut: "Cerrar Sesión",
  
  // Account verification
  accountVerificationRequired: "Verificación de Cuenta Requerida",
  checkEmailForVerification: "Revise su correo y haga clic en el enlace de verificación para activar su cuenta.",
  verificationLinkExpired: "Enlace de verificación expirado. Solicite uno nuevo.",
} as const;