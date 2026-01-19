/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data: (number | null)[], period: number): (number | null)[] {
  const result: (number | null)[] = []

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
      continue
    }

    const window = data.slice(i - period + 1, i + 1)
    const validValues = window.filter((v): v is number => v !== null)

    if (validValues.length < period * 0.5) {
      result.push(null)
      continue
    }

    const sum = validValues.reduce((a, b) => a + b, 0)
    result.push(sum / validValues.length)
  }

  return result
}

export interface DataPointWithSMA {
  timestamp: string
  value: number | null
  smaShort: number | null
  smaLong: number | null
}

/**
 * Enrich data points with short and long SMAs
 */
export function enrichWithDualSMA(
  data: { timestamp: string; value: number | null }[],
  shortPeriod: number,
  longPeriod: number
): DataPointWithSMA[] {
  const values = data.map(d => d.value)
  const smaShort = calculateSMA(values, shortPeriod)
  const smaLong = calculateSMA(values, longPeriod)

  return data.map((d, i) => ({
    timestamp: d.timestamp,
    value: d.value,
    smaShort: smaShort[i],
    smaLong: smaLong[i]
  }))
}
