import { useState } from 'react'
import { useReadings } from '../hooks/useReadings'
import { StellarExplorer } from '../components/StellarExplorer'
import { useRelativeTime } from '../hooks/useRelativeTime'
import type { Reading } from '../types/reading'

function TxRow({ r, onHash }: { r: Reading; onHash: (h: string) => void }) {
  const rel = useRelativeTime(r.created_at)

  const cls = { confirmed: 'tx-badge--confirmed', pending: 'tx-badge--pending', failed: 'tx-badge--failed' }[r.blockchain_status]
  const lbl = { confirmed: 'OK', pending: 'AGUARDA', failed: 'FALHOU' }[r.blockchain_status]

  return (
    <tr>
      <td><span className="bk-table__dev">{r.device_id}</span></td>
      <td style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--t-03)' }}>{rel}</td>
      <td>
        {r.blockchain_tx_hash ? (
          <button className="bk-table__hash" onClick={() => onHash(r.blockchain_tx_hash!)} title={r.blockchain_tx_hash}>
            {r.blockchain_tx_hash.slice(0, 8)}…{r.blockchain_tx_hash.slice(-8)}
          </button>
        ) : (
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--t-03)' }}>—</span>
        )}
      </td>
      <td><span className={`tx-badge ${cls}`}>{lbl}</span></td>
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
    <div className="blockchain-page">
      <div className="page-header">
        <span className="page-title">Blockchain</span>
      </div>

      <div className="bk-kpis">
        <div className="bk-kpi bk-kpi--ok">
          <span className="bk-kpi__lbl">Confirmados</span>
          <span className="bk-kpi__val">{confirmed}</span>
        </div>
        <div className="bk-kpi bk-kpi--wait">
          <span className="bk-kpi__lbl">Pendentes</span>
          <span className="bk-kpi__val">{pending}</span>
        </div>
        <div className="bk-kpi bk-kpi--fail">
          <span className="bk-kpi__lbl">Falhas</span>
          <span className="bk-kpi__val">{failed}</span>
        </div>
      </div>

      <div className="bk-table-wrap">
        <div className="bk-table-head">
          <span className="panel__title">Transações Recentes</span>
          <span className="panel__meta">{readings.length} registros</span>
        </div>

        {loading ? (
          <div className="loading">Carregando</div>
        ) : readings.length === 0 ? (
          <div className="empty">Nenhuma transação</div>
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
                  <TxRow key={r.id} r={r} onHash={setExplorerHash} />
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
