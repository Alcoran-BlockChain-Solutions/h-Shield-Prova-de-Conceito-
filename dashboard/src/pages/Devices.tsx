import { useDevices } from '../hooks/useDevices'
import { useRelativeTime } from '../hooks/useRelativeTime'
import type { DeviceWithStatus } from '../types/device'

function DevCard({ device }: { device: DeviceWithStatus }) {
  const lastSeen = useRelativeTime(device.last_seen_at ?? '')

  const pubKey = device.public_key
    ? device.public_key
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\n/g, '')
        .trim()
        .slice(0, 80) + '...'
    : '—'

  return (
    <div className="device-card">
      <div className="device-card__head">
        <div>
          <div className="device-card__name">{device.name || device.device_id}</div>
          <div className="device-card__id">{device.device_id}</div>
        </div>
        <span className={`device-card__state device-card__state--${device.isAlive ? 'on' : 'off'}`}>
          {device.isAlive ? 'online' : 'offline'}
        </span>
      </div>

      <div className="device-card__rows">
        {device.location && (
          <div className="device-card__row">
            <span className="device-card__row-key">Localização</span>
            <span className="device-card__row-val">{device.location}</span>
          </div>
        )}
        <div className="device-card__row">
          <span className="device-card__row-key">Leituras</span>
          <span className="device-card__row-val">{device.total_readings.toLocaleString('pt-BR')}</span>
        </div>
        <div className="device-card__row">
          <span className="device-card__row-key">Último sinal</span>
          <span className="device-card__row-val">{device.last_seen_at ? lastSeen : 'Nunca'}</span>
        </div>
        <div className="device-card__row">
          <span className="device-card__row-key">Cadastrado</span>
          <span className="device-card__row-val">
            {new Date(device.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      <div className="device-card__key">{pubKey}</div>
    </div>
  )
}

export function Devices() {
  const { devices, loading, error } = useDevices()

  return (
    <div className="devices-page">
      <div className="page-header">
        <span className="page-title">
          Dispositivos&ensp;
          <span style={{ color: 'var(--t-03)', fontWeight: 400 }}>{devices.length}</span>
        </span>
      </div>

      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="loading">Carregando</div>
      ) : devices.length === 0 ? (
        <div className="empty">Nenhum dispositivo</div>
      ) : (
        <div className="device-grid">
          {devices.map(d => <DevCard key={d.id} device={d} />)}
        </div>
      )}
    </div>
  )
}
