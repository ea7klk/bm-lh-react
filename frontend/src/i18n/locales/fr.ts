export const fr = {
  // Header
  title: "Quoi de neuf sur Brandmeister ?",
  subtitle: "Moniteur d'Activité du Réseau Brandmeister",
  
  // Controls
  refreshData: "Actualiser les Données",
  autoRefresh: "Auto-actualisation (10s)",
  showingTalkgroups: "Affichage de {{count}} groupes de discussion",
  
  // Error messages
  failedToLoad: "Échec du chargement des données. Vérifiez si le backend fonctionne.",
  retry: "Réessayer",
  
  // Filter Panel
  filters: "Filtres",
  timeFilter: "Filtre Temporel",
  allTime: "Tout le Temps",
  last5minutes: "5 dernières minutes",
  last10minutes: "10 dernières minutes",
  last15minutes: "15 dernières minutes",
  last30minutes: "30 dernières minutes",
  lastHour: "Dernière heure",
  last3hours: "3 dernières heures",
  last6hours: "6 dernières heures",
  last12hours: "12 dernières heures",
  last24hours: "24 dernières heures",
  last3days: "3 derniers jours",
  last5days: "5 derniers jours",
  lastWeek: "Dernière semaine",
  
  maxEntries: "Max. Entrées",
  entries10: "10 entrées",
  entries20: "20 entrées",
  entries30: "30 entrées",
  entries50: "50 entrées",
  
  continent: "Continent",
  allContinents: "Tous les Continents",
  country: "Pays",
  allCountries: "Tous les Pays",
  
  resetFilters: "Réinitialiser les Filtres",
  applyFilters: "Appliquer les Filtres",
  
  // Charts
  talkgroupActivity: "Activité du Groupe de Discussion",
  activityDuration: "Durée d'Activité",
  talkgroupsByTotalDuration: "Groupes de Discussion par Durée Totale",
  transmissions: "Transmissions",
  avgDurationSeconds: "Durée Moyenne (secondes)",
  loading: "Chargement...",
  numberOfTransmissionsByTalkgroup: "Nombre de transmissions par groupe de discussion",
  totalAirTimeByTalkgroup: "Temps total de transmission par groupe de discussion",
  showingTopActiveGroups: "Affichage des {{count}} groupes de discussion les plus actifs",
  showingTopGroupsByDuration: "Affichage des {{count}} groupes de discussion les plus actifs par durée",
  simultaneousSessionsNote: "Parfois, le temps total rapporté peut dépasser la durée de la plage de temps sélectionnée. Cela est dû au fait que les données proviennent du WebSocket BM LastHeard, qui permet des sessions simultanées sur le même groupe de discussion, mais seule la première session est réellement transmise",
  
  // Table
  talkgroupStatisticsTable: "Statistiques totales de QSO par groupe de discussion",
  detailedTalkgroupStatistics: "Statistiques détaillées des groupes de discussion",
  destinationName: "Nom de Destination",
  destinationID: "ID de Destination",
  count: "Nombre",
  totalDuration: "Durée Totale",

  // Language selector
  language: "Langue",
  
  // Authentication
  login: "Se Connecter / S'inscrire",
  register: "S'inscrire",
  callsign: "Indicatif",
  name: "Nom",
  email: "E-mail",
  password: "Mot de Passe",
  confirmPassword: "Confirmer le Mot de Passe",
  currentPassword: "Mot de Passe Actuel",
  newPassword: "Nouveau Mot de Passe",
  forgotPassword: "Mot de passe oublié ?",
  resetPassword: "Réinitialiser le Mot de Passe",
  changePassword: "Changer le Mot de Passe",
  changeEmail: "Changer l'E-mail",
  newEmail: "Nouvel E-mail",
  verifyEmail: "Vérifier l'E-mail",
  emailVerification: "Vérification E-mail",
  resendVerification: "Renvoyer la Vérification",
  
  // Auth form labels and placeholders
  callsignPlaceholder: "Entrez votre indicatif",
  namePlaceholder: "Entrez votre nom complet",
  emailPlaceholder: "Entrez votre adresse e-mail",
  passwordPlaceholder: "Entrez votre mot de passe",
  confirmPasswordPlaceholder: "Confirmez votre mot de passe",
  emailOrCallsign: "E-mail ou Indicatif",
  emailOrCallsignPlaceholder: "Entrez e-mail ou indicatif",
  
  // Auth buttons
  registerButton: "Créer un Compte",
  resetPasswordButton: "Envoyer le Lien",
  changePasswordButton: "Mettre à Jour le Mot de Passe",
  changeEmailButton: "Mettre à Jour l'E-mail",
  cancelButton: "Annuler",
  backToLogin: "Retour à la Connexion",
  
  // Auth messages
  registrationSuccess: "Inscription réussie ! Vérifiez votre e-mail pour confirmer votre compte.",
  loginSuccess: "Bon retour !",
  logoutSuccess: "Vous avez été déconnecté avec succès.",
  emailVerificationSent: "E-mail de vérification envoyé. Vérifiez votre boîte de réception.",
  emailVerified: "E-mail vérifié avec succès ! Vous pouvez maintenant vous connecter.",
  passwordResetSent: "Lien de réinitialisation envoyé à votre e-mail.",
  passwordChanged: "Mot de passe changé avec succès.",
  emailChanged: "Adresse e-mail mise à jour avec succès.",
  
  // Auth errors
  invalidCredentials: "E-mail/indicatif ou mot de passe invalide.",
  accountNotActivated: "Compte non activé. Veuillez vérifier votre e-mail.",
  emailAlreadyExists: "Un compte avec cet e-mail existe déjà.",
  callsignAlreadyExists: "Un compte avec cet indicatif existe déjà.",
  invalidEmail: "Veuillez entrer une adresse e-mail valide.",
  invalidCallsign: "Veuillez entrer un indicatif valide.",
  passwordTooShort: "Le mot de passe doit contenir au moins 8 caractères.",
  passwordsDoNotMatch: "Les mots de passe ne correspondent pas.",
  tokenExpired: "Le token a expiré. Veuillez en demander un nouveau.",
  invalidToken: "Token invalide ou expiré.",
  currentPasswordIncorrect: "Le mot de passe actuel est incorrect.",
  
  // Auth form validation
  required: "Ce champ est obligatoire",
  emailRequired: "L'e-mail est obligatoire",
  callsignRequired: "L'indicatif est obligatoire",
  nameRequired: "Le nom est obligatoire",
  passwordRequired: "Le mot de passe est obligatoire",
  
  // Profile
  profile: "Profil",
  settings: "Paramètres",
  personalInformation: "Informations Personnelles",
  basicInformation: "Informations de Base",
  accountInformation: "Informations du Compte",
  security: "Sécurité",
  preferences: "Préférences",
  status: "Statut",
  active: "Actif",
  inactive: "Inactif",
  memberSince: "Membre depuis",
  lastLogin: "Dernière connexion",
  never: "Jamais",
  close: "Fermer",
  save: "Enregistrer",
  cancel: "Annuler",
  editProfile: "Modifier le Profil",
  saveChanges: "Sauvegarder les Modifications",
  updateProfile: "Mettre à Jour le Profil",
  profileUpdated: "Profil mis à jour avec succès",
  languagePreference: "Préférence de Langue",
  
  // User menu
  userMenu: "Menu Utilisateur",
  viewProfile: "Voir le Profil",
  accountSettings: "Paramètres du Compte",
  signOut: "Se Déconnecter",
  
  // Account verification
  accountVerificationRequired: "Vérification du Compte Requise",
  checkEmailForVerification: "Vérifiez votre e-mail et cliquez sur le lien de vérification pour activer votre compte.",
  verificationLinkExpired: "Lien de vérification expiré. Veuillez en demander un nouveau.",
} as const;