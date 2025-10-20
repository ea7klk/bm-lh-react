export const de = {
  // Header
  title: "BM Zuletzt Gehört",
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
  simultaneousSessionsNote: "Gelegentlich kann die insgesamt gemeldete Zeit die Dauer des gewählten Zeitbereichs überschreiten. Dies liegt daran, dass die Daten vom BM LastHeard WebSocket stammen, der gleichzeitige Sitzungen in derselben Gesprächsgruppe ermöglicht, aber nur die erste Sitzung tatsächlich übertragen wird",
  
  // Language selector
  language: "Sprache",
} as const;