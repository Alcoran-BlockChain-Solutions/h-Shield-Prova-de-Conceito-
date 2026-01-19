import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { useTheme } from '../../contexts/ThemeContext'
import { getLighterColor, getDarkerColor } from '../../utils/colors'
import type { SensorDataPoint } from '../../hooks/useAnalyticsData'

interface SensorLineChartProps {
  title: string
  data: SensorDataPoint[]
  unit: string
  color: string
  showSMA?: boolean
}

export function SensorLineChart({ title, data, unit, color, showSMA = true }: SensorLineChartProps) {
  const { theme } = useTheme()

  const textColor = theme === 'dark' ? '#e0e0e0' : '#212121'
  const gridColor = theme === 'dark' ? '#333333' : '#e0e0e0'
  const tooltipBg = theme === 'dark' ? '#1e1e1e' : '#ffffff'

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatTooltipTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="chart-container">
      <h3 className="chart-container__title">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            stroke={textColor}
            fontSize={12}
          />
          <YAxis
            stroke={textColor}
            fontSize={12}
            tickFormatter={(value) => `${value}${unit}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${gridColor}`,
              borderRadius: '8px',
              color: textColor
            }}
            labelFormatter={formatTooltipTime}
            formatter={(value, name) => {
              if (value === null || value === undefined) return ['-', name]
              const labels: Record<string, string> = {
                value: title,
                smaShort: 'Média Curta',
                smaLong: 'Média Longa'
              }
              return [`${(value as number).toFixed(1)}${unit}`, labels[name as string] || name]
            }}
          />
          <Legend
            formatter={(value) => {
              const labels: Record<string, string> = {
                value: title,
                smaShort: 'Média Curta',
                smaLong: 'Média Longa'
              }
              return labels[value] || value
            }}
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: color }}
            name="value"
            connectNulls
          />

          {showSMA && (
            <>
              <Line
                type="monotone"
                dataKey="smaShort"
                stroke={getLighterColor(color, 40)}
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                name="smaShort"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="smaLong"
                stroke={getDarkerColor(color, 25)}
                strokeWidth={1.5}
                strokeDasharray="8 4"
                dot={false}
                name="smaLong"
                connectNulls
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
