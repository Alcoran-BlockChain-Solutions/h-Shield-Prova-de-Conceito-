import { useState } from 'react'
import { useReadings } from '../hooks/useReadings'
import { StellarExplorer } from '../components/StellarExplorer'
import { useRelativeTime } from '../hooks/useRelativeTime'
import type { Reading } from '../types/reading'

function TxRow({ reading, onHashClick }: { reading: Reading; onHashClick: (h: string) => void }) {
  const rel = useRelativeTime(reading.created_at)

  const statusClass = {
    confirmed: 'tx-badge--confirmed',
    pending:   'tx-badge--pending',
    failed:    'tx-badge--failed',
  }[reading.blockchain_status]

  const statusLabel = {
    confirmed: '✓ Confirmado',
    pending:   '⏳ Pendente',
    failed:    '✗ Falhou',
  }[reading.blockchain_status]

  return (
    <tr>
      <td><span className="bk-table__device">{reading.device_id}</span></td>
      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{rel}</td>
      <td>
        {reading.blockchain_tx_hash ? (
          <button
            className="bk-table__hash"
            onClick={() => onHashClick(reading.blockchain_tx_hash!)}
            title={reading.blockchain_tx_hash}
          >
            {reading.blockchain_tx_hash.slice(0, 8)}…{reading.blockchain_tx_hash.slice(-8)}
          </button>
        ) : (
          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>
        )}
      </td>
      <td>
        <span className={`tx-badge ${statusClass}`}>{statusLabel}</span>
      </td>
    </tr>
  )
}

export function Blockchain() {
  const [explorerHash, setExplorerHash] = useState<string | null>(null)
  const { readings, loading } = useReadings()

  const confirmed = readings.filter(r => r.blockchain_status === 'confirmed').length
  const pending   = readings.filter(r => r.blockchain_status === 'pending').length
  const failed    = readings.filter(r => r.blockchain_status === 'failed').length

  return (
    <div className="blockchain-v2">
      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <h2 className="page-title">⛓️ Blockchain</h2>
      </div>

      <div className="blockchain-v2__kpis">
        <div className="bk-kpi bk-kpi--confirmed">
          <div className="bk-kpi__value">{confirmed}</div>
          <div className="bk-kpi__label">✓ Confirmados</div>
        </div>
        <div className="bk-kpi bk-kpi--pending">
          <div className="bk-kpi__value">{pending}</div>
          <div className="bk-kpi__label">⏳ Pendentes</div>
        </div>
        <div className="bk-kpi bk-kpi--failed">
          <div className="bk-kpi__value">{failed}</div>
          <div className="bk-kpi__label">✗ Falhas</div>
        </div>
      </div>

      <div className="blockchain-v2__table-wrap">
        <div className="blockchain-v2__table-header">
          <span className="dashboard-panel__title">⛓️ Transações Recentes</span>
          <span className="dashboard-panel__badge">{readings.length} registros</span>
        </div>

        {loading ? (
          <div className="loading-state">Carregando</div>
        ) : readings.length === 0 ? (
          <div className="empty-state">Nenhuma transação encontrada</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="bk-table">
              <thead>
                <tr>
                  <th>Dispositivo</th>
                  <th>Quando</th>
                  <th>TX Hash</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {readings.map(r => (
                  <TxRow key={r.id} reading={r} onHashClick={setExplorerHash} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {explorerHash && (
        <StellarExplorer txHash={explorerHash} onClose={() => setExplorerHash(null)} />
      )}
    </div>
  )
}
