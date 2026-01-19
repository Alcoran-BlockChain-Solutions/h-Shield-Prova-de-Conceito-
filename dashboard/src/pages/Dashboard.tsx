import { useState } from 'react'
import { useDevices } from '../hooks/useDevices'
import { useReadings } from '../hooks/useReadings'
import { DeviceCard } from '../components/DeviceCard'
import { ReadingCard } from '../components/ReadingCard'
import { ConnectionStatus } from '../components/ConnectionStatus'
import { StellarExplorer } from '../components/StellarExplorer'

export function Dashboard() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>()
  const [explorerTxHash, setExplorerTxHash] = useState<string | null>(null)

  const { devices, loading: devicesLoading, error: devicesError } = useDevices()
  const { readings, loading: readingsLoading, error: readingsError } = useReadings(selectedDeviceId)

  const handleDeviceClick = (deviceId: string) => {
    setSelectedDeviceId(prev => prev === deviceId ? undefined : deviceId)
  }

  const handleTransactionClick = (txHash: string) => {
    setExplorerTxHash(txHash)
  }

  const handleCloseExplorer = () => {
    setExplorerTxHash(null)
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>HarvestShield Dashboard</h1>
        <ConnectionStatus />
      </header>

      <main className="dashboard__content">
        <section className="dashboard__devices">
          <h2>Dispositivos IoT</h2>

          {devicesError && (
            <div className="error-message">Erro: {devicesError}</div>
          )}

          {devicesLoading ? (
            <div className="loading">Carregando dispositivos...</div>
          ) : devices.length === 0 ? (
            <div className="empty-state">Nenhum dispositivo encontrado</div>
          ) : (
            <div className="device-list">
              {devices.map(device => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  isSelected={selectedDeviceId === device.device_id}
                  onClick={() => handleDeviceClick(device.device_id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="dashboard__readings">
          <h2>
            Leituras
            {selectedDeviceId && (
              <span className="dashboard__filter">
                {' '}({selectedDeviceId})
                <button
                  onClick={() => setSelectedDeviceId(undefined)}
                  className="dashboard__clear-filter"
                >
                  Limpar
                </button>
              </span>
            )}
          </h2>

          {readingsError && (
            <div className="error-message">Erro: {readingsError}</div>
          )}

          {readingsLoading ? (
            <div className="loading">Carregando leituras...</div>
          ) : readings.length === 0 ? (
            <div className="empty-state">Nenhuma leitura encontrada</div>
          ) : (
            <div className="reading-list">
              {readings.map(reading => (
                <ReadingCard
                  key={reading.id}
                  reading={reading}
                  onTransactionClick={handleTransactionClick}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {explorerTxHash && (
        <StellarExplorer
          txHash={explorerTxHash}
          onClose={handleCloseExplorer}
        />
      )}
    </div>
  )
}
