import type { DeviceWithStatus } from '../types/device'
import { DeviceStatusBadge } from './DeviceStatusBadge'

interface DeviceCardProps {
  device: DeviceWithStatus
  isSelected?: boolean
  onClick?: () => void
}

export function DeviceCard({ device, isSelected, onClick }: DeviceCardProps) {
  const lastSeen = device.last_seen_at
    ? new Date(device.last_seen_at).toLocaleString()
    : 'Nunca'

  return (
    <div
      className={`device-card ${isSelected ? 'device-card--selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="device-card__header">
        <h3 className="device-card__name">{device.name || device.device_id}</h3>
        <DeviceStatusBadge isAlive={device.isAlive} />
      </div>

      <div className="device-card__details">
        <p className="device-card__id">
          <span className="label">ID:</span> {device.device_id}
        </p>
        {device.location && (
          <p className="device-card__location">
            <span className="label">Local:</span> {device.location}
          </p>
        )}
        <p className="device-card__last-seen">
          <span className="label">Visto:</span> {lastSeen}
        </p>
        <p className="device-card__readings">
          <span className="label">Leituras:</span> {device.total_readings}
        </p>
      </div>
    </div>
  )
}
