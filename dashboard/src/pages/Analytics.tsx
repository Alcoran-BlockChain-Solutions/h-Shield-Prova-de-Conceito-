import { useState } from 'react'
import { useAnalyticsData, type TimePeriod } from '../hooks/useAnalyticsData'
import { StatCard } from '../components/charts/StatCard'
import { SensorLineChart } from '../components/charts/SensorLineChart'
import { SensorAreaChart } from '../components/charts/SensorAreaChart'

const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: '1h', label: '1 hora' },
  { value: '6h', label: '6 horas' },
  { value: '24h', label: '24 horas' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' }
]

const SENSOR_COLORS = {
  temperature: '#f44336',
  humidityAir: '#2196f3',
  humiditySoil: '#4caf50',
  luminosity: '#ff9800'
}

export function Analytics() {
  const [period, setPeriod] = useState<TimePeriod>('24h')

  const { data, loading, error, totalReadings, deviceCount } = useAnalyticsData({ period })

  return (
    <div className="analytics">
      <div className="analytics__header">
        <h2>Analytics</h2>
        <div className="analytics__filters">
          <div className="analytics__filter">
            <label htmlFor="period-select">Período</label>
            <select
              id="period-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value as TimePeriod)}
              className="analytics__select"
            >
              {PERIOD_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">Erro ao carregar dados: {error}</div>
      )}

      {loading ? (
        <div className="loading">Carregando dados...</div>
      ) : totalReadings === 0 ? (
        <div className="empty-state">Nenhum dado encontrado para o período selecionado</div>
      ) : (
        <>
          <div className="analytics__stats">
            <StatCard
              icon="🌡️"
              label="Temperatura"
              value={data.temperature.stats.avg.toFixed(1)}
              unit="°C"
              subLabel="média"
              color={SENSOR_COLORS.temperature}
            />
            <StatCard
              icon="💧"
              label="Umidade do Ar"
              value={data.humidityAir.stats.avg.toFixed(1)}
              unit="%"
              subLabel="média"
              color={SENSOR_COLORS.humidityAir}
            />
            <StatCard
              icon="🌱"
              label="Umidade do Solo"
              value={data.humiditySoil.stats.avg.toFixed(1)}
              unit="%"
              subLabel="média"
              color={SENSOR_COLORS.humiditySoil}
            />
            <StatCard
              icon="☀️"
              label="Luminosidade"
              value={data.luminosity.stats.avg.toFixed(0)}
              unit=" lx"
              subLabel="média"
              color={SENSOR_COLORS.luminosity}
            />
          </div>

          <div className="analytics__charts">
            <SensorLineChart
              title="Temperatura"
              data={data.temperature.data}
              unit="°C"
              color={SENSOR_COLORS.temperature}
            />

            <div className="analytics__charts-row">
              <SensorAreaChart
                title="Umidade do Ar"
                data={data.humidityAir.data}
                unit="%"
                color={SENSOR_COLORS.humidityAir}
              />
              <SensorAreaChart
                title="Umidade do Solo"
                data={data.humiditySoil.data}
                unit="%"
                color={SENSOR_COLORS.humiditySoil}
              />
            </div>

            <SensorLineChart
              title="Luminosidade"
              data={data.luminosity.data}
              unit=" lx"
              color={SENSOR_COLORS.luminosity}
            />
          </div>

          <div className="analytics__footer">
            <span className="analytics__total">
              {totalReadings} leituras de {deviceCount} dispositivo{deviceCount !== 1 ? 's' : ''} no período
            </span>
          </div>
        </>
      )}
    </div>
  )
}
