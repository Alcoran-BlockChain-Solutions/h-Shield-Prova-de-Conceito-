export interface Device {
  id: string
  device_id: string
  public_key: string
  name: string | null
  location: string | null
  active: boolean
  created_at: string
  last_seen_at: string | null
  total_readings: number
}

export interface DeviceWithStatus extends Device {
  isAlive: boolean
}
