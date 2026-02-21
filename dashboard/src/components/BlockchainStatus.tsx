import { useState } from 'react'
import type { BlockchainStatus as BlockchainStatusType } from '../types/reading'

interface Props {
  status: BlockchainStatusType
  error: string | null
}

export function BlockchainStatus({ status, error }: Props) {
  const [showError, setShowError] = useState(false)

  const label = {
    pending:   '⏳ Pendente',
    confirmed: '✓ Stellar',
    failed:    '✗ Falhou',
  }[status]

  const cls = {
    pending:   'tx-badge--pending',
    confirmed: 'tx-badge--confirmed',
    failed:    'tx-badge--failed',
  }[status]

  return (
    <>
      <span
        className={`tx-badge ${cls}`}
        style={{ cursor: error ? 'pointer' : 'default' }}
        onClick={() => error && setShowError(true)}
      >
        {label}{error && ' ⓘ'}
      </span>

      {showError && (
        <div className="modal-overlay" onClick={() => setShowError(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <div className="modal__title" style={{ color: 'var(--danger)' }}>
                ✗ Erro Blockchain
              </div>
              <button className="modal__close" onClick={() => setShowError(false)}>✕</button>
            </div>
            <div className="modal__body">
              <pre>{error}</pre>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
