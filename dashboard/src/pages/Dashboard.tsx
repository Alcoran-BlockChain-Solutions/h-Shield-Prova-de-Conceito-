import { useState, useMemo } from 'react'
import { useDevices } from '../hooks/useDevices'
import { useReadings } from '../hooks/useReadings'
import { StellarExplorer } from '../components/StellarExplorer'
import { BlockchainStatus } from '../components/BlockchainStatus'
import { TransactionLink } from '../components/TransactionLink'
import { useRelativeTime } from '../hooks/useRelativeTime'
import { formatFullDateTime } from '../utils/time'
import type { Reading } from '../types/reading'

function FeedRow({ reading, onTxClick }: {
  reading: Reading
  onTxClick?: (h: string) => void
}) {
  const rel = useRelativeTime(reading.created_at)
  const full = formatFullDateTime(reading.created_at)

  return (
    <div className="feed-row" title={full}>
      <div className="feed-row__head">
        <span className="feed-row__device">{reading.device_id}</span>
        <span className="feed-row__time">{rel}</span>
      </div>

      <div className="feed-row__metrics">
        {reading.temperature != null && (
          <div className="feed-metric">
            <span className="feed-metric__val">{reading.temperature.toFixed(1)}°</span>
            <span className="feed-metric__lbl">Temp °C</span>
          </div>
        )}
        {reading.humidity_air != null && (
          <div className="feed-metric">
            <span className="feed-metric__val">{reading.humidity_air.toFixed(1)}%</span>
            <span className="feed-metric__lbl">Ar</span>
          </div>
        )}
        {reading.humidity_soil != null && (
          <div className="feed-metric">
            <span className="feed-metric__val">{reading.humidity_soil.toFixed(1)}%</span>
            <span className="feed-metric__lbl">Solo</span>
          </div>
        )}
        {reading.luminosity != null && (
          <div className="feed-metric">
            <span className="feed-metric__val">{reading.luminosity}</span>
            <span className="feed-metric__lbl">lx</span>
          </div>
        )}
      </div>

      <div className="feed-row__footer">
        <BlockchainStatus status={reading.blockchain_status} error={reading.blockchain_error} />
        {reading.blockchain_tx_hash && (
          <TransactionLink txHash={reading.blockchain_tx_hash} onClick={onTxClick} />
        )}
      </div>
    </div>
  )
}

export function Dashboard() {
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [explorerHash, setExplorerHash] = useState<string | null>(null)

  const { devices, loading: devLoad } = useDevices()
  const { readings, loading: readLoad } = useReadings(selectedId)

  const latest = readings[0]

  const kpis = useMemo(() => [
    {
      label: 'Temperatura',
      value: latest?.temperature?.toFixed(1),
      unit: '°C',
    },
    {
      label: 'Umidade do Ar',
      value: latest?.humidity_air?.toFixed(1),
      unit: '%',
    },
    {
      label: 'Umidade do Solo',
      value: latest?.humidity_soil?.toFixed(1),
      unit: '%',
    },
    {
      label: 'Luminosidade',
      value: latest?.luminosity?.toFixed(0),
      unit: 'lx',
    },
  ], [latest])

  const onlineCount = devices.filter(d => d.isAlive).length

  return (
    <div>
      <div className="beta-banner">🚧 Fase Beta — dados da Stellar Testnet</div>
      {/* KPI Bar */}
      <div className="kpi-bar">
        {kpis.map(k => (
          <div key={k.label} className="kpi-bar__item">
            <span className="kpi-bar__label">{k.label}</span>
            {k.value != null ? (
              <span className="kpi-bar__value">
                {k.value}
                <span className="kpi-bar__unit">{k.unit}</span>
              </span>
            ) : (
              <span className="kpi-bar__empty">—</span>
            )}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="dash-grid">
        {/* Devices */}
        <div className="panel">
          <div className="panel__head">
            <span className="panel__title">Dispositivos</span>
            <span className="panel__meta">{onlineCount}/{devices.length} online</span>
          </div>

          {devLoad ? (
            <div className="loading">Aguarde</div>
          ) : devices.length === 0 ? (
            <div className="empty">Sem dispositivos</div>
          ) : (
            <div className="device-list">
              {devices.map(d => (
                <div
                  key={d.id}
                  className={`device-row${selectedId === d.device_id ? ' device-row--active' : ''}`}
                  onClick={() => setSelectedId(prev =>
                    prev === d.device_id ? undefined : d.device_id
                  )}
                >
                  <div className={`device-row__status device-row__status--${d.isAlive ? 'on' : 'off'}`} />
                  <div className="device-row__info">
                    <div className="device-row__name">{d.name || d.device_id}</div>
                    <div className="device-row__sub">
                      {d.location ?? d.device_id} · {d.total_readings} leituras
                    </div>
                  </div>
                  <span className={`device-row__state device-row__state--${d.isAlive ? 'on' : 'off'}`}>
                    {d.isAlive ? 'online' : 'off'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feed */}
        <div className="panel">
          <div className="panel__head">
            <span className="panel__title">Leituras</span>
            <span className="panel__live">
              <span className="panel__live-dot" />
              Ao vivo
            </span>
          </div>

          {readLoad ? (
            <div className="loading">Aguarde</div>
          ) : readings.length === 0 ? (
            <div className="empty">Sem leituras</div>
          ) : (
            <div className="feed">
              {readings.map(r => (
                <FeedRow key={r.id} reading={r} onTxClick={setExplorerHash} />
              ))}
            </div>
          )}
        </div>
      </div>

      {explorerHash && (
        <StellarExplorer txHash={explorerHash} onClose={() => setExplorerHash(null)} />
      )}
    </div>
  )
}
