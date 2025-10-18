export interface LastHeardEntry {
  id?: number;
  callsign: string;
  name?: string;
  dmr_id: number;
  target_id: number;
  target_name?: string;
  source: string;
  duration: number;
  timestamp: Date;
  slot?: number;
  reflector?: number;
}
