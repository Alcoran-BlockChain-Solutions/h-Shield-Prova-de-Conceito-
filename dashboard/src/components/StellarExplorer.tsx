interface StellarExplorerProps {
  txHash: string
  onClose: () => void
}

export function StellarExplorer({ txHash, onClose }: StellarExplorerProps) {
  const url = `https://stellar.expert/explorer/testnet/tx/${txHash}`

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--wide"
        style={{ height: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal__header">
          <div className="modal__title">⛓️ Stellar Explorer</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.8125rem', color: 'var(--accent)', textDecoration: 'none' }}
            >
              Abrir externo ↗
            </a>
            <button className="modal__close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal__iframe-wrap">
          <iframe src={url} title="Stellar Explorer" />
        </div>
      </div>
    </div>
  )
}
