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
