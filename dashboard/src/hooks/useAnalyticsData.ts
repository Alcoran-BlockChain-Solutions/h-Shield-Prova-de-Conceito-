import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../config/supabase'
import type { Reading } from '../types/reading'
import { calculateSMA } from '../utils/statistics'

export type TimePeriod = '1h' | '6h' | '24h' | '7d' | '30d'

interface UseAnalyticsDataParams {
  period: TimePeriod
}

export interface SensorDataPoint {
  timestamp: string
  value: number | null
  smaShort: number | null
  smaLong: number | null
}

export interface SensorAnalytics {
  data: SensorDataPoint[]
  stats: {
    avg: number
    min: number
    max: number
  }
}

interface AnalyticsData {
  temperature: SensorAnalytics
  humidityAir: SensorAnalytics
  humiditySoil: SensorAnalytics
  luminosity: SensorAnalytics
}

function getPeriodMs(period: TimePeriod): number {
  switch (period) {
    case '1h': return 60 * 60 * 1000
    case '6h': return 6 * 60 * 60 * 1000
    case '24h': return 24 * 60 * 60 * 1000
    case '7d': return 7 * 24 * 60 * 60 * 1000
    case '30d': return 30 * 24 * 60 * 60 * 1000
  }
}

function getSMAPeriods(dataLength: number): { short: number; long: number } {
  const short = Math.max(3, Math.min(10, Math.floor(dataLength / 10)))
  const long = Math.max(5, Math.min(20, Math.floor(dataLength / 4)))
  return { short, long }
}

function calculateStats(values: (number | null)[]): { avg: number; min: number; max: number } {
  const validValues = values.filter((v): v is number => v !== null)
  if (validValues.length === 0) {
    return { avg: 0, min: 0, max: 0 }
  }
  return {
    avg: validValues.reduce((a, b) => a + b, 0) / validValues.length,
    min: Math.min(...validValues),
    max: Math.max(...validValues)
  }
}

// Group readings by timestamp (rounded to minute) and average values
function aggregateReadings(
  readings: Reading[],
  getValue: (r: Reading) => number | null
): { timestamp: string; value: number | null }[] {
  // Group by minute
  const groups = new Map<string, number[]>()

  readings.forEach(r => {
    const date = new Date(r.created_at)
    // Round to minute for grouping
    date.setSeconds(0, 0)
    const key = date.toISOString()

    const value = getValue(r)
    if (value !== null) {
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(value)
    }
  })

  // Calculate average for each group
  const result: { timestamp: string; value: number | null }[] = []

  groups.forEach((values, timestamp) => {
    const avg = values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : null
    result.push({ timestamp, value: avg })
  })

  // Sort by timestamp
  return result.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

function createSensorAnalytics(
  readings: Reading[],
  getValue: (r: Reading) => number | null
): SensorAnalytics {
  const aggregated = aggregateReadings(readings, getValue)
  const values = aggregated.map(d => d.value)
  const { short: shortPeriod, long: longPeriod } = getSMAPeriods(aggregated.length)

  const smaShort = calculateSMA(values, shortPeriod)
  const smaLong = calculateSMA(values, longPeriod)

  const data = aggregated.map((d, i) => ({
    timestamp: d.timestamp,
    value: d.value,
    smaShort: smaShort[i],
    smaLong: smaLong[i]
  }))

  return {
    data,
    stats: calculateStats(readings.map(getValue))
  }
}

export function useAnalyticsData({ period }: UseAnalyticsDataParams) {
  const [readings, setReadings] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReadings = useCallback(async () => {
    setLoading(true)
    setError(null)

    const periodMs = getPeriodMs(period)
    const startDate = new Date(Date.now() - periodMs).toISOString()

    const { data, error: fetchError } = await supabase
      .from('readings')
      .select('*')
      .gte('created_at', startDate)
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setReadings(data || [])
    setLoading(false)
  }, [period])

  useEffect(() => {
    fetchReadings()
  }, [fetchReadings])

  const analyticsData: AnalyticsData = useMemo(() => {
    return {
      temperature: createSensorAnalytics(readings, r => r.temperature),
      humidityAir: createSensorAnalytics(readings, r => r.humidity_air),
      humiditySoil: createSensorAnalytics(readings, r => r.humidity_soil),
      luminosity: createSensorAnalytics(readings, r => r.luminosity)
    }
  }, [readings])

  // Count unique devices
  const deviceCount = useMemo(() => {
    return new Set(readings.map(r => r.device_id)).size
  }, [readings])

  return {
    data: analyticsData,
    loading,
    error,
    refetch: fetchReadings,
    totalReadings: readings.length,
    deviceCount
  }
}
