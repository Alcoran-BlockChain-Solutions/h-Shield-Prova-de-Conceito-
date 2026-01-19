import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../config/supabase'
import type { Reading } from '../types/reading'

const MAX_READINGS = 50

export function useReadings(deviceId?: string) {
  const [readings, setReadings] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReadings = useCallback(async () => {
    let query = supabase
      .from('readings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(MAX_READINGS)

    if (deviceId) {
      query = query.eq('device_id', deviceId)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      console.error('[useReadings] Erro ao buscar leituras:', fetchError)
      setError('Falhou: veja os logs')
      return
    }

    setReadings(data || [])
    setLoading(false)
  }, [deviceId])

  const prependReading = useCallback((newReading: Reading) => {
    // Only add if matches filter (or no filter)
    if (deviceId && newReading.device_id !== deviceId) return

    setReadings(prev => {
      const updated = [newReading, ...prev]
      // Keep only MAX_READINGS
      return updated.slice(0, MAX_READINGS)
    })
  }, [deviceId])

  const updateReadingStatus = useCallback((updatedReading: Reading) => {
    setReadings(prev =>
      prev.map(r => r.id === updatedReading.id ? updatedReading : r)
    )
  }, [])

  useEffect(() => {
    fetchReadings()

    // Subscribe to new readings
    const insertChannel = supabase
      .channel('readings-inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'readings' },
        (payload) => prependReading(payload.new as Reading)
      )
      .subscribe()

    // Subscribe to reading updates (blockchain status changes)
    const updateChannel = supabase
      .channel('readings-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'readings' },
        (payload) => updateReadingStatus(payload.new as Reading)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(insertChannel)
      supabase.removeChannel(updateChannel)
    }
  }, [fetchReadings, prependReading, updateReadingStatus])

  return { readings, loading, error, refetch: fetchReadings }
}
