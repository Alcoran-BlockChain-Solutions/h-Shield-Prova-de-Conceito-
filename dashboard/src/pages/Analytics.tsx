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

// IBM Carbon chart tooltip
const TOOLTIP = {
  contentStyle: {
    background: '#262626',
    border: '1px solid #393939',
    borderRadius: 0,
    color: '#f4f4f4',
    fontSize: '0.75rem',
    fontFamily: "'IBM Plex Mono', monospace",
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  itemStyle: { color: '#c6c6c6' },
  labelStyle: { color: '#8d8d8d', fontSize: '0.625rem', marginBottom: 4 },
}

// IBM Carbon chart axes
const AXIS_TICK = {
  fill: '#6f6f6f',
  fontSize: 10,
  fontFamily: 'IBM Plex Mono',
}

function tick(ts: string) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// IBM Carbon chart colors (deliberate, not random)
const SENSORS = [
  { key: 'temperature' as const,  label: 'Temperatura',     unit: '°C', color: '#fa4d56', dp: 1 },
  { key: 'humidityAir' as const,  label: 'Umidade do Ar',   unit: '%',  color: '#4589ff', dp: 1 },
  { key: 'humiditySoil' as const, label: 'Umidade do Solo', unit: '%',  color: '#42be65', dp: 1 },
  { key: 'luminosity' as const,   label: 'Luminosidade',    unit: 'lx', color: '#f1c21b', dp: 0 },
]

export function Analytics() {
  const [period, setPeriod] = useState<TimePeriod>('all')
  const { data, loading, error, totalReadings, deviceCount } = useAnalyticsData({ period })

  return (
    <div className="analytics">
      <div className="page-header">
        <span className="page-title">Analytics</span>
        <div className="period-strip">
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

      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="loading">Carregando</div>
      ) : totalReadings === 0 ? (
        <div className="empty">Sem dados para o período</div>
      ) : (
        <>
          <div className="stat-strip">
            {SENSORS.map(s => {
              const st = data[s.key].stats
              return (
                <div key={s.key} className="stat-cell">
                  <div className="stat-cell__lbl">{s.label}</div>
                  <div className="stat-cell__val">
                    {st.avg.toFixed(s.dp)}
                    <span className="stat-cell__unit">{s.unit}</span>
                  </div>
                  <div className="stat-cell__range">
                    ↓ {st.min.toFixed(s.dp)} &nbsp; ↑ {st.max.toFixed(s.dp)}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="chart-stack">
            {/* Temperatura */}
            <div className="chart-box">
              <div className="chart-box__label">Temperatura</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.temperature.data}>
                  <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="timestamp" tickFormatter={tick} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} />
                  <Tooltip {...TOOLTIP} labelFormatter={tick} formatter={(v: number | undefined) => [v != null ? `${v.toFixed(1)} °C` : '—', '']} />
                  <Line type="monotone" dataKey="value" stroke="#fa4d56" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="smaShort" stroke="#fa4d56" dot={false} strokeWidth={1} strokeDasharray="4 4" opacity={0.35} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-row">
              {/* Umidade Ar */}
              <div className="chart-box">
                <div className="chart-box__label">Umidade do Ar</div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={data.humidityAir.data}>
                    <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="timestamp" tickFormatter={tick} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} />
                    <Tooltip {...TOOLTIP} labelFormatter={tick} formatter={(v: number | undefined) => [v != null ? `${v.toFixed(1)} %` : '—', '']} />
                    <Area type="monotone" dataKey="value" stroke="#4589ff" fill="#4589ff" fillOpacity={0.08} strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Umidade Solo */}
              <div className="chart-box">
                <div className="chart-box__label">Umidade do Solo</div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={data.humiditySoil.data}>
                    <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="timestamp" tickFormatter={tick} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} />
                    <Tooltip {...TOOLTIP} labelFormatter={tick} formatter={(v: number | undefined) => [v != null ? `${v.toFixed(1)} %` : '—', '']} />
                    <Area type="monotone" dataKey="value" stroke="#42be65" fill="#42be65" fillOpacity={0.08} strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Luminosidade */}
            <div className="chart-box">
              <div className="chart-box__label">Luminosidade</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={data.luminosity.data}>
                  <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="timestamp" tickFormatter={tick} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} />
                  <Tooltip {...TOOLTIP} labelFormatter={tick} formatter={(v: number | undefined) => [v != null ? `${v.toFixed(0)} lx` : '—', '']} />
                  <Area type="monotone" dataKey="value" stroke="#f1c21b" fill="#f1c21b" fillOpacity={0.08} strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="analytics__foot">
            {totalReadings} leituras · {deviceCount} dispositivo{deviceCount !== 1 ? 's' : ''} · {PERIODS.find(p => p.value === period)?.label}
          </div>
        </>
      )}
    </div>
  )
}
