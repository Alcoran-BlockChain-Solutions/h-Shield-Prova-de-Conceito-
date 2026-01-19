interface DeviceStatusBadgeProps {
  isAlive: boolean
}

export function DeviceStatusBadge({ isAlive }: DeviceStatusBadgeProps) {
  return (
    <span className={`badge ${isAlive ? 'badge--online' : 'badge--offline'}`}>
      {isAlive ? 'Online' : 'Offline'}
    </span>
  )
}
