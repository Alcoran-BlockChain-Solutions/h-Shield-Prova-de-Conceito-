import { useDevices } from '../hooks/useDevices'
import { useRelativeTime } from '../hooks/useRelativeTime'
import type { DeviceWithStatus } from '../types/device'

const DEVICE_COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6']

function DeviceCardV2({ device, index }: { device: DeviceWithStatus; index: number }) {
  const color = DEVICE_COLORS[index % DEVICE_COLORS.length]
  const lastSeen = useRelativeTime(device.last_seen_at ?? '')

  const pubKeyShort = device.public_key
    ? device.public_key
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .trim()
        .slice(0, 64) + '...'
    : '—'

  return (
    <div className="device-card-v2" style={{ '--device-color': color } as React.CSSProperties}>
      <div className="device-card-v2__header">
        <div>
          <div className="device-card-v2__name">{device.name || device.device_id}</div>
          <div className="device-card-v2__id">{device.device_id}</div>
        </div>
        <span className={`device-item__badge device-item__badge--${device.isAlive ? 'online' : 'offline'}`}>
          {device.isAlive ? '● online' : '○ offline'}
        </span>
      </div>

      <div className="device-card-v2__rows">
        {device.location && (
          <div className="device-card-v2__row">
            <span className="device-card-v2__row-label">📍 Localização</span>
            <span className="device-card-v2__row-value">{device.location}</span>
          </div>
        )}
        <div className="device-card-v2__row">
          <span className="device-card-v2__row-label">📡 Leituras</span>
          <span className="device-card-v2__row-value">{device.total_readings.toLocaleString('pt-BR')}</span>
        </div>
        <div className="device-card-v2__row">
          <span className="device-card-v2__row-label">🕐 Último sinal</span>
          <span className="device-card-v2__row-value">{device.last_seen_at ? lastSeen : 'Nunca'}</span>
        </div>
        <div className="device-card-v2__row">
          <span className="device-card-v2__row-label">📅 Cadastrado</span>
          <span className="device-card-v2__row-value">
            {new Date(device.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      <div className="device-card-v2__pubkey">{pubKeyShort}</div>
    </div>
  )
}

export function Devices() {
  const { devices, loading, error } = useDevices()

  return (
    <div className="devices-v2">
      <div className="devices-v2__header">
        <h2 className="page-title">
          🛰️ Dispositivos
          <span className="page-title__count">{devices.length} total</span>
        </h2>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">Carregando dispositivos</div>
      ) : devices.length === 0 ? (
        <div className="empty-state">Nenhum dispositivo cadastrado</div>
      ) : (
        <div className="devices-v2__grid">
          {devices.map((device, i) => (
            <DeviceCardV2 key={device.id} device={device} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
