import { useState } from 'react'
import type { BlockchainStatus as Status } from '../types/reading'

interface BlockchainStatusProps {
  status: Status
  error?: string | null
}

const STATUS_CONFIG = {
  pending: { label: 'Pendente', className: 'blockchain-status--pending' },
  confirmed: { label: 'Confirmado', className: 'blockchain-status--confirmed' },
  failed: { label: 'Falhou', className: 'blockchain-status--failed' }
} as const

export function BlockchainStatus({ status, error }: BlockchainStatusProps) {
  const [showErrorModal, setShowErrorModal] = useState(false)
  const config = STATUS_CONFIG[status]

  return (
    <>
      <div className={`blockchain-status ${config.className}`}>
        <span className="blockchain-status__label">{config.label}</span>
        {error && status === 'failed' && (
          <button
            className="blockchain-status__error-btn"
            onClick={() => setShowErrorModal(true)}
          >
            ver logs
          </button>
        )}
      </div>

      {showErrorModal && (
        <div className="error-modal" onClick={() => setShowErrorModal(false)}>
          <div className="error-modal__content" onClick={e => e.stopPropagation()}>
            <div className="error-modal__header">
              <h3>Erro na Blockchain</h3>
              <button
                className="error-modal__close"
                onClick={() => setShowErrorModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="error-modal__body">
              <pre>{error}</pre>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
