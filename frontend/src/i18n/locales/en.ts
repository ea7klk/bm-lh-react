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
} as const;