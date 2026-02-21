interface Props {
  txHash: string
  onClick?: (hash: string) => void
}

export function TransactionLink({ txHash, onClick }: Props) {
  const short = `${txHash.slice(0, 6)}…${txHash.slice(-6)}`

  if (onClick) {
    return (
      <button className="tx-link" onClick={() => onClick(txHash)} title={txHash}>
        🔗 {short}
      </button>
    )
  }

  return (
    <a
      className="tx-link"
      href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
      target="_blank"
      rel="noreferrer"
      title={txHash}
    >
      🔗 {short}
    </a>
  )
}
