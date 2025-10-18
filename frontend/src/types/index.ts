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
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  error?: string;
}
