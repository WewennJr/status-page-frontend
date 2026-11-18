/* Types de l'API */

export interface UptimeBar {
  date: string
  ok_ratio: number
  avg_ms: number | null
}

export interface MonitorPublic {
  id: number
  name: string
  description: string
  group_name: string
  status: "up" | "down" | "unknown"
  last_check_at: string | null
  response_time_ms: number | null
  uptime_ratio: number | null
  bars: UptimeBar[]
  show_response_time: boolean
  show_uptime: boolean
}

export interface IncidentUpdatePublic {
  message: string
  status: string
  created_at: string
}

export interface IncidentPublic {
  id: number
  monitor_id: number | null
  monitor_name: string | null
  title: string
  description: string
  status: string
  created_at: string
  updated_at: string
  resolved_at: string | null
  updates: IncidentUpdatePublic[]
}

export interface PublicOverview {
  setup_done: boolean
  settings: Record<string, string>
  monitors: MonitorPublic[]
  active_incidents: IncidentPublic[]
}

export interface HistoryPoint {
  t: string
  avg_ms: number | null
  ok_ratio: number
  checks: number
}

export interface MonitorAdmin {
  id: number
  name: string
  url: string
  description: string
  group_name: string
  interval_seconds: number
  email: string
  show_response_time: boolean
  show_uptime: boolean
  position: number
  active: boolean
}

export type MonitorInput = Omit<MonitorAdmin, "id">


export interface IncidentAdmin {
  id: number
  monitor_id: number | null
  title: string
  description: string
  status: string
  auto: boolean
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface MonitorStatusAdmin {
  id: number
  name: string
  group_name: string
  active: boolean
  status: "up" | "down" | "unknown"
  response_time_ms: number | null
  last_check_at: string | null
  uptime_ratio: number | null
}

export interface AdminStats {
  monitors: number
  monitors_up: number
  monitors_down: number
  monitors_unknown: number
  checks_stored: number
  checks_24h: number
  avg_response_ms_24h: number | null
  open_incidents: number
  incidents_30d: number
  uptime_series: UptimeBar[]
  response_series: HistoryPoint[]
  monitor_statuses: MonitorStatusAdmin[]
}

export interface AdminAccount {
  username: string
}

