import { useState } from 'react'
import { useAnalyticsData, type TimePeriod } from '../hooks/useAnalyticsData'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '1h',  label: '1h' },
  { value: '6h',  label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d',  label: '7d' },
  { value: '30d', label: '30d' },
  { value: 'all', label: 'Total' },
]

const SENSORS = [
  { key: 'temperature' as const,  icon: '🌡️', label: 'Temperatura',    unit: '°C', color: '#ef4444' },
  { key: 'humidityAir' as const,  icon: '💧', label: 'Umidade do Ar',  unit: '%',  color: '#3b82f6' },
  { key: 'humiditySoil' as const, icon: '🌱', label: 'Umidade do Solo', unit: '%',  color: '#22c55e' },
  { key: 'luminosity' as const,   icon: '☀️', label: 'Luminosidade',   unit: 'lx', color: '#f59e0b' },
]

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#112a16',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: '0.8125rem',
  }
}

function formatTick(ts: string) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function Analytics() {
  const [period, setPeriod] = useState<TimePeriod>('all')
  const { data, loading, error, totalReadings, deviceCount } = useAnalyticsData({ period })

  return (
    <div className="analytics-v2">
      <div className="analytics-v2__header">
        <h2 className="analytics-v2__title">📊 Analytics</h2>
        <div className="period-selector">
          {PERIODS.map(p => (
            <button
              key={p.value}
              className={`period-btn${period === p.value ? ' period-btn--active' : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-banner">Erro: {error}</div>}

      {loading ? (
        <div className="loading-state">Carregando dados</div>
      ) : totalReadings === 0 ? (
        <div className="empty-state">Nenhum dado para o período selecionado</div>
      ) : (
        <>
          <div className="analytics-v2__stats">
            {SENSORS.map(s => {
              const stats = data[s.key].stats
              return (
                <div
                  key={s.key}
                  className="stat-card-v2"
                  style={{ '--stat-color': s.color } as React.CSSProperties}
                >
                  <span className="stat-card-v2__icon">{s.icon}</span>
                  <div className="stat-card-v2__label">{s.label}</div>
                  <div className="stat-card-v2__value">
                    {stats.avg.toFixed(s.key === 'luminosity' ? 0 : 1)}
                    <span className="stat-card-v2__unit">{s.unit}</span>
                  </div>
                  <div className="stat-card-v2__sub">
                    min {stats.min.toFixed(1)} · max {stats.max.toFixed(1)}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="analytics-v2__charts">
            <div className="chart-card">
              <div className="chart-card__title">🌡️ Temperatura</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.temperature.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.08)" />
                  <XAxis dataKey="timestamp" tickFormatter={formatTick} tick={{ fill: '#6b9e7a', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b9e7a', fontSize: 11 }} />
                  <Tooltip {...TOOLTIP_STYLE} labelFormatter={formatTick} formatter={(v: number | undefined) => [v != null ? `${v.toFixed(1)} °C` : '—', 'Temperatura']} />
                  <Line type="monotone" dataKey="value" stroke="#ef4444" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="smaShort" stroke="#ef4444" dot={false} strokeWidth={1} strokeDasharray="4 2" opacity={0.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="analytics-v2__charts-row">
              <div className="chart-card">
                <div className="chart-card__title">💧 Umidade do Ar</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={data.humidityAir.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.08)" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTick} tick={{ fill: '#6b9e7a', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b9e7a', fontSize: 11 }} />
                    <Tooltip {...TOOLTIP_STYLE} labelFormatter={formatTick} formatter={(v: number | undefined) => [v != null ? `${v.toFixed(1)} %` : '—', 'Umidade Ar']} />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <div className="chart-card__title">🌱 Umidade do Solo</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={data.humiditySoil.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.08)" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTick} tick={{ fill: '#6b9e7a', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b9e7a', fontSize: 11 }} />
                    <Tooltip {...TOOLTIP_STYLE} labelFormatter={formatTick} formatter={(v: number | undefined) => [v != null ? `${v.toFixed(1)} %` : '—', 'Umidade Solo']} />
                    <Area type="monotone" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.08} strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card__title">☀️ Luminosidade</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.luminosity.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.08)" />
                  <XAxis dataKey="timestamp" tickFormatter={formatTick} tick={{ fill: '#6b9e7a', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b9e7a', fontSize: 11 }} />
                  <Tooltip {...TOOLTIP_STYLE} labelFormatter={formatTick} formatter={(v: number | undefined) => [v != null ? `${v.toFixed(0)} lx` : '—', 'Luminosidade']} />
                  <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="analytics-v2__footer">
            {totalReadings} leituras · {deviceCount} dispositivo{deviceCount !== 1 ? 's' : ''} · período: {PERIODS.find(p => p.value === period)?.label}
          </div>
        </>
      )}
    </div>
  )
}
