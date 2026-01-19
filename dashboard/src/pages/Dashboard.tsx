import { useState, useMemo } from 'react'
import { useDevices } from '../hooks/useDevices'
import { useReadings } from '../hooks/useReadings'
import { DeviceCard } from '../components/DeviceCard'
import { ReadingCard } from '../components/ReadingCard'
import { StellarExplorer } from '../components/StellarExplorer'
import { getDeviceColor } from '../utils/colors'

export function Dashboard() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>()
  const [explorerTxHash, setExplorerTxHash] = useState<string | null>(null)

  const { devices, loading: devicesLoading, error: devicesError } = useDevices()
  const { readings, loading: readingsLoading, error: readingsError } = useReadings(selectedDeviceId)

  // Create a map of device_id to color
  const deviceColorMap = useMemo(() => {
    const map = new Map<string, string>()
    devices.forEach((device, index) => {
      map.set(device.device_id, getDeviceColor(index))
    })
    return map
  }, [devices])

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
      <div className="dashboard__content">
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
              {devices.map((device, index) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  isSelected={selectedDeviceId === device.device_id}
                  onClick={() => handleDeviceClick(device.device_id)}
                  color={getDeviceColor(index)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="dashboard__readings">
          <h2>
            Leituras Realtime
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
                  deviceColor={deviceColorMap.get(reading.device_id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {explorerTxHash && (
        <StellarExplorer
          txHash={explorerTxHash}
          onClose={handleCloseExplorer}
        />
      )}
    </div>
  )
}
