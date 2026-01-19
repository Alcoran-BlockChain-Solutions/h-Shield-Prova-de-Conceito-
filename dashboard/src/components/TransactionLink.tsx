import { STELLAR_EXPLORER, DEFAULT_STELLAR_NETWORK } from '../config/constants'

interface TransactionLinkProps {
  txHash: string
  onClick?: (txHash: string) => void
}

export function TransactionLink({ txHash, onClick }: TransactionLinkProps) {
  const shortHash = `${txHash.slice(0, 8)}...${txHash.slice(-8)}`
  const explorerUrl = `${STELLAR_EXPLORER[DEFAULT_STELLAR_NETWORK]}/tx/${txHash}`

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick(txHash)
    }
  }

  return (
    <a
      href={explorerUrl}
      className="transaction-link-btn"
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      title={txHash}
    >
      view on-chain {shortHash}
    </a>
  )
}
