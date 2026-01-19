import type { Reading } from '../types/reading'
import { ReadingMetrics } from './ReadingMetrics'
import { BlockchainStatus } from './BlockchainStatus'
import { TransactionLink } from './TransactionLink'

interface ReadingCardProps {
  reading: Reading
  onTransactionClick?: (txHash: string) => void
}

export function ReadingCard({ reading, onTransactionClick }: ReadingCardProps) {
  const createdAt = new Date(reading.created_at).toLocaleString()

  return (
    <div className="reading-card">
      <div className="reading-card__header">
        <span className="reading-card__device">{reading.device_id}</span>
        <span className="reading-card__time">{createdAt}</span>
      </div>

      <ReadingMetrics reading={reading} />

      <div className="reading-card__footer">
        <BlockchainStatus
          status={reading.blockchain_status}
          error={reading.blockchain_error}
        />
        {reading.blockchain_tx_hash && (
          <TransactionLink
            txHash={reading.blockchain_tx_hash}
            onClick={onTransactionClick}
          />
        )}
      </div>
    </div>
  )
}
