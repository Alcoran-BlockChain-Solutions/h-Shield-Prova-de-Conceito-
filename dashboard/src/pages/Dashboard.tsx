import { useState, useMemo } from 'react'
import { useDevices } from '../hooks/useDevices'
import { useReadings } from '../hooks/useReadings'
import { StellarExplorer } from '../components/StellarExplorer'
import { BlockchainStatus } from '../components/BlockchainStatus'
import { TransactionLink } from '../components/TransactionLink'
import { useRelativeTime } from '../hooks/useRelativeTime'
import { formatFullDateTime } from '../utils/time'
import type { Reading } from '../types/reading'

const SENSOR_COLORS = {
  temperature: '#ef4444',
  humidity_air: '#3b82f6',
  humidity_soil: '#22c55e',
  luminosity: '#f59e0b',
}

function KpiCard({ icon, label, value, unit, color }: {
  icon: string; label: string; value: string; unit: string; color: string
}) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color } as React.CSSProperties}>
      <span className="kpi-card__icon">{icon}</span>
      <div className="kpi-card__value">
        {value}
        <span className="kpi-card__unit">{unit}</span>
      </div>
      <div className="kpi-card__label">{label}</div>
      <div className="kpi-card__glow" />
    </div>
  )
}

function ReadingItemRow({ reading, onTransactionClick }: {
  reading: Reading; onTransactionClick?: (h: string) => void
}) {
  const rel = useRelativeTime(reading.created_at)
  const full = formatFullDateTime(reading.created_at)

  return (
    <div className="reading-item" title={full}>
      <div className="reading-item__header">
        <span className="reading-item__device">{reading.device_id}</span>
        <span className="reading-item__time">{rel}</span>
      </div>
      <div className="reading-item__metrics">
        {reading.temperature != null && (
          <span className="reading-metric">
            <span className="reading-metric__icon">🌡️</span>
            <span className="reading-metric__value">{reading.temperature.toFixed(1)}</span>
            <span className="reading-metric__unit">°C</span>
          </span>
        )}
        {reading.humidity_air != null && (
          <span className="reading-metric">
            <span className="reading-metric__icon">💧</span>
            <span className="reading-metric__value">{reading.humidity_air.toFixed(1)}</span>
            <span className="reading-metric__unit">%</span>
          </span>
        )}
        {reading.humidity_soil != null && (
          <span className="reading-metric">
            <span className="reading-metric__icon">🌱</span>
            <span className="reading-metric__value">{reading.humidity_soil.toFixed(1)}</span>
            <span className="reading-metric__unit">%</span>
          </span>
        )}
        {reading.luminosity != null && (
          <span className="reading-metric">
            <span className="reading-metric__icon">☀️</span>
            <span className="reading-metric__value">{reading.luminosity}</span>
            <span className="reading-metric__unit">lx</span>
          </span>
        )}
      </div>
      <div className="reading-item__footer">
        <BlockchainStatus status={reading.blockchain_status} error={reading.blockchain_error} />
        {reading.blockchain_tx_hash && (
          <TransactionLink txHash={reading.blockchain_tx_hash} onClick={onTransactionClick} />
        )}
      </div>
    </div>
  )
}

export function Dashboard() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>()
  const [explorerTxHash, setExplorerTxHash] = useState<string | null>(null)

  const { devices, loading: devicesLoading } = useDevices()
  const { readings, loading: readingsLoading } = useReadings(selectedDeviceId)

  const latest = readings[0]

  const kpis = useMemo(() => [
    { icon: '🌡️', label: 'Temperatura',    value: latest?.temperature?.toFixed(1) ?? '—',    unit: '°C', color: SENSOR_COLORS.temperature },
    { icon: '💧', label: 'Umidade do Ar',  value: latest?.humidity_air?.toFixed(1) ?? '—',   unit: '%',  color: SENSOR_COLORS.humidity_air },
    { icon: '🌱', label: 'Umidade do Solo',value: latest?.humidity_soil?.toFixed(1) ?? '—',  unit: '%',  color: SENSOR_COLORS.humidity_soil },
    { icon: '☀️', label: 'Luminosidade',   value: latest?.luminosity?.toFixed(0) ?? '—',     unit: 'lx', color: SENSOR_COLORS.luminosity },
  ], [latest])

  return (
    <div>
      <div className="kpi-strip">
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <span className="dashboard-panel__title">🛰️ Dispositivos</span>
            <span className="dashboard-panel__badge">
              {devices.filter(d => d.isAlive).length}/{devices.length} online
            </span>
          </div>

          {devicesLoading ? (
            <div className="loading-state">Carregando</div>
          ) : devices.length === 0 ? (
            <div className="empty-state">Nenhum dispositivo</div>
          ) : (
            <div className="device-list-v2">
              {devices.map(device => (
                <div
                  key={device.id}
                  className={`device-item${selectedDeviceId === device.device_id ? ' device-item--selected' : ''}`}
                  onClick={() => setSelectedDeviceId(prev =>
                    prev === device.device_id ? undefined : device.device_id
                  )}
                >
                  <span className={`device-item__dot device-item__dot--${device.isAlive ? 'online' : 'offline'}`} />
                  <div className="device-item__info">
                    <div className="device-item__name">{device.name || device.device_id}</div>
                    <div className="device-item__meta">
                      {device.location && `${device.location} · `}{device.total_readings} leituras
                    </div>
                  </div>
                  <span className={`device-item__badge device-item__badge--${device.isAlive ? 'online' : 'offline'}`}>
                    {device.isAlive ? 'online' : 'offline'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <span className="dashboard-panel__title">Feed de Leituras</span>
            <span className="dashboard-panel__badge">
              <span className="live-dot" />
              ao vivo
            </span>
          </div>

          {readingsLoading ? (
            <div className="loading-state">Carregando</div>
          ) : readings.length === 0 ? (
            <div className="empty-state">Nenhuma leitura ainda</div>
          ) : (
            <div className="reading-feed">
              {readings.map(r => (
                <ReadingItemRow
                  key={r.id}
                  reading={r}
                  onTransactionClick={setExplorerTxHash}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {explorerTxHash && (
        <StellarExplorer
          txHash={explorerTxHash}
          onClose={() => setExplorerTxHash(null)}
        />
      )}
    </div>
  )
}
