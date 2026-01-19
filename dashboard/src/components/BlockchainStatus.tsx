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
  const config = STATUS_CONFIG[status]

  return (
    <div className={`blockchain-status ${config.className}`}>
      <span className="blockchain-status__label">{config.label}</span>
      {error && status === 'failed' && (
        <span className="blockchain-status__error" title={error}>
          {error.length > 30 ? `${error.slice(0, 30)}...` : error}
        </span>
      )}
    </div>
  )
}
