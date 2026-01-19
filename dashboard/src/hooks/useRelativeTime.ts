import { useState, useEffect } from 'react'
import { formatRelativeTime } from '../utils/time'

/**
 * Hook that returns a relative time string that updates automatically
 * @param date - The date to format
 * @returns A string like "agora mesmo", "1 minuto atrás", etc. that updates in real-time
 */
export function useRelativeTime(date: Date | string): string {
  const [relativeTime, setRelativeTime] = useState(() => formatRelativeTime(date))

  useEffect(() => {
    // Update immediately
    setRelativeTime(formatRelativeTime(date))

    // Calculate appropriate update interval based on how old the date is
    const getUpdateInterval = () => {
      const now = new Date()
      const then = typeof date === 'string' ? new Date(date) : date
      const diffSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

      if (diffSeconds < 60) {
        // Update every 10 seconds for "agora mesmo" and seconds
        return 10_000
      }
      if (diffSeconds < 3600) {
        // Update every 30 seconds for minutes
        return 30_000
      }
      // Update every minute for hours and days
      return 60_000
    }

    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(date))
    }, getUpdateInterval())

    return () => clearInterval(interval)
  }, [date])

  return relativeTime
}
