import { useState } from 'react'
import type { BlockchainStatus as T } from '../types/reading'

interface Props { status: T; error: string | null }

export function BlockchainStatus({ status, error }: Props) {
  const [open, setOpen] = useState(false)

  const cls = { pending: 'tx-badge--pending', confirmed: 'tx-badge--confirmed', failed: 'tx-badge--failed' }[status]
  const lbl = { pending: 'Pendente', confirmed: 'Stellar OK', failed: 'Falhou' }[status]

  return (
    <>
      <span
        className={`tx-badge ${cls}`}
        style={{ cursor: error ? 'pointer' : 'default' }}
        onClick={() => error && setOpen(true)}
      >
        {lbl}{error ? ' [!]' : ''}
      </span>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__head">
              <span className="modal__title" style={{ color: 'var(--red)' }}>Blockchain Error</span>
              <button className="modal__close" onClick={() => setOpen(false)}>✕</button>
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
