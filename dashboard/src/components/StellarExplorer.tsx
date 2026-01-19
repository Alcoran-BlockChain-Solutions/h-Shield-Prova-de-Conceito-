import { useState } from 'react'
import { STELLAR_EXPLORER, DEFAULT_STELLAR_NETWORK } from '../config/constants'

interface StellarExplorerProps {
  txHash: string
  onClose: () => void
}

export function StellarExplorer({ txHash, onClose }: StellarExplorerProps) {
  const [iframeError, setIframeError] = useState(false)
  const url = `${STELLAR_EXPLORER[DEFAULT_STELLAR_NETWORK]}/tx/${txHash}`

  return (
    <div className="stellar-explorer">
      <div className="stellar-explorer__overlay" onClick={onClose} />

      <div className="stellar-explorer__modal">
        <div className="stellar-explorer__header">
          <h3>Transacao Stellar</h3>
          <div className="stellar-explorer__actions">
            <a href={url} target="_blank" rel="noopener noreferrer">
              Abrir em nova aba
            </a>
            <button onClick={onClose} className="stellar-explorer__close">
              X
            </button>
          </div>
        </div>

        <div className="stellar-explorer__content">
          {iframeError ? (
            <div className="stellar-explorer__fallback">
              <p>Iframe bloqueado pelo navegador</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
              >
                Ver no Stellar Expert
              </a>
            </div>
          ) : (
            <iframe
              src={url}
              title="Stellar Explorer"
              onError={() => setIframeError(true)}
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </div>
      </div>
    </div>
  )
}
