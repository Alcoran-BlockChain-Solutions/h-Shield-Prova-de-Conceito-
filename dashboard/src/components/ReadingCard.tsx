import type { Reading } from '../types/reading'
import { ReadingMetrics } from './ReadingMetrics'
import { BlockchainStatus } from './BlockchainStatus'
import { TransactionLink } from './TransactionLink'
import { useRelativeTime } from '../hooks/useRelativeTime'
import { formatFullDateTime } from '../utils/time'

interface ReadingCardProps {
  reading: Reading
  onTransactionClick?: (txHash: string) => void
  deviceColor?: string
}

export function ReadingCard({ reading, onTransactionClick, deviceColor }: ReadingCardProps) {
  const relativeTime = useRelativeTime(reading.created_at)
  const fullDateTime = formatFullDateTime(reading.created_at)

  return (
    <div
      className="reading-card"
      style={deviceColor ? { borderLeftColor: deviceColor, borderLeftWidth: '4px' } : undefined}
    >
      <div className="reading-card__header">
        <div className="reading-card__device-wrapper">
          {deviceColor && (
            <span
              className="reading-card__color-dot"
              style={{ backgroundColor: deviceColor }}
            />
          )}
          <span className="reading-card__device">{reading.device_id}</span>
        </div>
        <span className="reading-card__time" data-tooltip={fullDateTime}>
          {relativeTime}
          <span className="reading-card__time-info">ⓘ</span>
        </span>
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
