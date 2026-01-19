import type { Reading } from '../types/reading'

interface ReadingMetricsProps {
  reading: Reading
}

export function ReadingMetrics({ reading }: ReadingMetricsProps) {
  return (
    <div className="reading-metrics">
      {reading.temperature !== null && (
        <div className="metric">
          <span className="metric__icon">🌡️</span>
          <span className="metric__value">{reading.temperature}°C</span>
          <span className="metric__label">Temperatura</span>
        </div>
      )}

      {reading.humidity_air !== null && (
        <div className="metric">
          <span className="metric__icon">💧</span>
          <span className="metric__value">{reading.humidity_air}%</span>
          <span className="metric__label">Umidade Ar</span>
        </div>
      )}

      {reading.humidity_soil !== null && (
        <div className="metric">
          <span className="metric__icon">🌱</span>
          <span className="metric__value">{reading.humidity_soil}%</span>
          <span className="metric__label">Umidade Solo</span>
        </div>
      )}

      {reading.luminosity !== null && (
        <div className="metric">
          <span className="metric__icon">☀️</span>
          <span className="metric__value">{reading.luminosity} lux</span>
          <span className="metric__label">Luminosidade</span>
        </div>
      )}
    </div>
  )
}
