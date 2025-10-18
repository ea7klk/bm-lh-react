export interface LastHeardEntry {
  id: number;
  callsign: string;
  name?: string;
  dmr_id: number;
  target_id: number;
  target_name?: string;
  source: string;
  duration: number;
  timestamp: string;
  slot?: number;
  reflector?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  error?: string;
}
