export const fr = {
  // Header
  title: "BM Derniers Entendus",
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
  simultaneousSessionsNote: "Dans certains cas, le temps total rapporté peut dépasser la durée de la plage de temps sélectionnée. Ceci est causé par les données provenant du WebSocket BM LastHeard, qui permet des sessions simultanées sur le même groupe de discussion, mais seule la première session est réellement transmise",

  // Language selector
  language: "Langue",
} as const;