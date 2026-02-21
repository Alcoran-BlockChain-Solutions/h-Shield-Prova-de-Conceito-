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

const TOOLTIP = {
  contentStyle: {
    background: '#0d1411',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 0,
    color: '#e4eeeb',
    fontSize: '0.75rem',
    fontFamily: "'IBM Plex Mono', monospace",
  },
  itemStyle: { color: '#e4eeeb' },
  labelStyle: { color: '#3d5a50', fontSize: '0.625rem' },
}

function tick(ts: string) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const SENSORS = [
  { key: 'temperature' as const, label: 'Temperatura', unit: '°C', color: '#e84040', dp: 1 },
  { key: 'humidityAir' as const, label: 'Umidade do Ar', unit: '%', color: '#4090e8', dp: 1 },
  { key: 'humiditySoil' as const, label: 'Umidade do Solo', unit: '%', color: '#c8f53a', dp: 1 },
  { key: 'luminosity' as const, label: 'Luminosidade', unit: 'lx', color: '#e8a930', dp: 0 },
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
                    ↓ {st.min.toFixed(s.dp)}  ↑ {st.max.toFixed(s.dp)}
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
                  <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="timestamp" tickFormatter={tick} tick={{ fill: '#3d5a50', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#3d5a50', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP} labelFormatter={tick} formatter={(v: number | undefined) => [v != null ? `${v.toFixed(1)} °C` : '—', '']} />
                  <Line type="monotone" dataKey="value" stroke="#e84040" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="smaShort" stroke="#e84040" dot={false} strokeWidth={1} strokeDasharray="3 4" opacity={0.4} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-row">
              {/* Umidade Ar */}
              <div className="chart-box">
                <div className="chart-box__label">Umidade do Ar</div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={data.humidityAir.data}>
                    <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="timestamp" tickFormatter={tick} tick={{ fill: '#3d5a50', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#3d5a50', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                    <Tooltip {...TOOLTIP} labelFormatter={tick} formatter={(v: number | undefined) => [v != null ? `${v.toFixed(1)} %` : '—', '']} />
                    <Area type="monotone" dataKey="value" stroke="#4090e8" fill="#4090e8" fillOpacity={0.06} strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Umidade Solo */}
              <div className="chart-box">
                <div className="chart-box__label">Umidade do Solo</div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={data.humiditySoil.data}>
                    <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="timestamp" tickFormatter={tick} tick={{ fill: '#3d5a50', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#3d5a50', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                    <Tooltip {...TOOLTIP} labelFormatter={tick} formatter={(v: number | undefined) => [v != null ? `${v.toFixed(1)} %` : '—', '']} />
                    <Area type="monotone" dataKey="value" stroke="#c8f53a" fill="#c8f53a" fillOpacity={0.06} strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Luminosidade */}
            <div className="chart-box">
              <div className="chart-box__label">Luminosidade</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={data.luminosity.data}>
                  <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="timestamp" tickFormatter={tick} tick={{ fill: '#3d5a50', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#3d5a50', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP} labelFormatter={tick} formatter={(v: number | undefined) => [v != null ? `${v.toFixed(0)} lx` : '—', '']} />
                  <Area type="monotone" dataKey="value" stroke="#e8a930" fill="#e8a930" fillOpacity={0.06} strokeWidth={1.5} dot={false} />
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
