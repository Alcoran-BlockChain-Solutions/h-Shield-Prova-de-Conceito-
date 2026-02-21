interface Props { txHash: string; onClose: () => void }

export function StellarExplorer({ txHash, onClose }: Props) {
  const url = `https://stellar.expert/explorer/testnet/tx/${txHash}`

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--wide"
        style={{ height: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal__head">
          <span className="modal__title">Stellar Explorer</span>
          <div className="modal__actions">
            <a href={url} target="_blank" rel="noreferrer" className="modal__ext">
              Abrir externo ↗
            </a>
            <button className="modal__close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal__iframe">
          <iframe src={url} title="Stellar Explorer" />
        </div>
      </div>
    </div>
  )
}
