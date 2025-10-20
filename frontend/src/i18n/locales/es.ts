export const es = {
  // Header
  title: "BM Últimas Escuchadas",
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
  
  // Language selector
  language: "Idioma",
} as const;