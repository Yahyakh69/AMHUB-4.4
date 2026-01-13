
export interface WorkflowParams {
  creator: string;
  latitude: number;
  longitude: number;
  level: number;
  desc: string;
}

export interface WorkflowRequest {
  workflow_uuid: string;
  trigger_type: number;
  name: string;
  params: WorkflowParams;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'request';
  message: string;
  details?: unknown;
}

export enum ConnectionStatus {
  IDLE = 'IDLE',
  SENDING = 'SENDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface AppSettings {
  userToken: string;
  projectUuid: string;
  workflowUuid: string;
  creatorId: string;
  apiUrl: string;
  useCorsProxy: boolean;
}

// --- Topology / Device Types ---

export interface DeviceTelemetry {
  latitude: number;
  longitude: number;
  height: number;
  speed: number;
  battery_percent: number;
  link_signal_quality: number; // 0-100
  flight_time: number; // Total flight time in seconds (Legacy)
  remaining_flight_time: number; // Remaining flight time in seconds
  yaw: number;
  pitch: number;
  roll: number;
}

export interface DockPosition {
  sn: string;
  latitude: number;
  longitude: number;
  nickname?: string;
}

export interface Device {
  device_sn: string;
  nickname: string;
  device_model: string;
  status: boolean; // true = online, false = offline
  domain: number; // 0 = drone, 1 = dock, etc.
  position: { lat: number; lng: number }; // Unified position (Live, Offline, or Dock)
  telemetry?: DeviceTelemetry; // Optional, might be null if offline
  dock?: DockPosition; // Parent dock information
  is_flying?: boolean; // Derived status for map icon coloring
  raw?: any; // For debugging API responses
}

export interface TopologyResponse {
  code: number;
  message: string;
  data: Device[];
  rawResponse?: any; // The full unparsed JSON from DJI
}