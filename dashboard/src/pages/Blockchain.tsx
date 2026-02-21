import { useState, useEffect } from 'react'
import { useReadings } from '../hooks/useReadings'
import { useRelativeTime } from '../hooks/useRelativeTime'
import type { Reading } from '../types/reading'

interface HorizonTx {
  id: string
  ledger: number
  created_at: string
  source_account: string
  fee_charged: string
  operation_count: number
  successful: boolean
  memo_type: string
  memo?: string
}

function TxPanel({ hash, onClose }: { hash: string; onClose: () => void }) {
  const [tx, setTx] = useState<HorizonTx | null>(null)
  const [error, setError] = useState(false)
  const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${hash}`

  useEffect(() => {
    setTx(null)
    setError(false)
    fetch(`https://horizon-testnet.stellar.org/transactions/${hash}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 404 || data.type?.includes('not_found')) { setError(true); return }
        setTx(data)
      })
      .catch(() => setError(true))
  }, [hash])

  return (
    <>
      <div className="bk-drawer-overlay" onClick={onClose} />
      <div className="bk-drawer">
        <div className="bk-drawer__head">
          <div className="bk-drawer__title-row">
            <span className="bk-drawer__title">Transação Stellar</span>
            <button className="bk-explorer__close" onClick={onClose}>✕</button>
          </div>
          <span className="bk-explorer__hash" style={{ display: 'block', marginTop: '4px' }}>
            {hash.slice(0, 16)}…{hash.slice(-16)}
          </span>
        </div>

        <div className="bk-drawer__body">
          {!tx && !error && (
            <div className="bk-explorer__loading">Carregando dados da transação…</div>
          )}

          {error && (
            <div className="bk-explorer__error">
              Não foi possível carregar os dados.{' '}
              <a href={explorerUrl} target="_blank" rel="noreferrer">
                Abrir no Stellar Explorer ↗
              </a>
            </div>
          )}

          {tx && (
            <div className="bk-drawer__fields">
              <div className="bk-explorer__field">
                <span className="bk-explorer__label">Status</span>
                <span className={`tx-badge ${tx.successful ? 'tx-badge--confirmed' : 'tx-badge--failed'}`}>
                  {tx.successful ? 'CONFIRMADA' : 'FALHOU'}
                </span>
              </div>
              <div className="bk-explorer__field">
                <span className="bk-explorer__label">Ledger</span>
                <span className="bk-explorer__value bk-explorer__value--mono">#{tx.ledger}</span>
              </div>
              <div className="bk-explorer__field">
                <span className="bk-explorer__label">Data</span>
                <span className="bk-explorer__value">{new Date(tx.created_at).toLocaleString('pt-BR')}</span>
              </div>
              <div className="bk-explorer__field">
                <span className="bk-explorer__label">Operações</span>
                <span className="bk-explorer__value bk-explorer__value--mono">{tx.operation_count}</span>
              </div>
              <div className="bk-explorer__field">
                <span className="bk-explorer__label">Taxa (stroops)</span>
                <span className="bk-explorer__value bk-explorer__value--mono">{tx.fee_charged}</span>
              </div>
              <div className="bk-explorer__field">
                <span className="bk-explorer__label">Hash completo</span>
                <span className="bk-explorer__value bk-explorer__value--mono bk-explorer__value--break">{tx.id}</span>
              </div>
              <div className="bk-explorer__field">
                <span className="bk-explorer__label">Conta origem</span>
                <span className="bk-explorer__value bk-explorer__value--mono bk-explorer__value--break">{tx.source_account}</span>
              </div>
              {tx.memo && (
                <div className="bk-explorer__field">
                  <span className="bk-explorer__label">Memo ({tx.memo_type})</span>
                  <span className="bk-explorer__value bk-explorer__value--mono">{tx.memo}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bk-drawer__foot">
          <a href={explorerUrl} target="_blank" rel="noreferrer" className="bk-drawer__btn">
            Abrir no Stellar Explorer ↗
          </a>
        </div>
      </div>
    </>
  )
}

function TxRow({ r, onHash, active }: { r: Reading; onHash: (h: string) => void; active: boolean }) {
  const rel = useRelativeTime(r.created_at)

  const cls = { confirmed: 'tx-badge--confirmed', pending: 'tx-badge--pending', failed: 'tx-badge--failed' }[r.blockchain_status]
  const lbl = { confirmed: 'OK', pending: 'AGUARDA', failed: 'FALHOU' }[r.blockchain_status]
  const clickable = !!r.blockchain_tx_hash

  return (
    <tr
      className={`bk-table__row${clickable ? ' bk-table__row--clickable' : ''}${active ? ' bk-table__row--active' : ''}`}
      onClick={() => clickable && onHash(r.blockchain_tx_hash!)}
      title={clickable ? r.blockchain_tx_hash! : undefined}
    >
      <td><span className="bk-table__dev">{r.device_id}</span></td>
      <td style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--t-03)' }}>{rel}</td>
      <td>
        {r.blockchain_tx_hash ? (
          <span className="bk-table__hash">
            {r.blockchain_tx_hash.slice(0, 8)}…{r.blockchain_tx_hash.slice(-8)}
          </span>
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
                  <TxRow key={r.id} r={r} onHash={setExplorerHash} active={explorerHash === r.blockchain_tx_hash} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {explorerHash && (
        <TxPanel hash={explorerHash} onClose={() => setExplorerHash(null)} />
      )}
    </div>
  )
}
