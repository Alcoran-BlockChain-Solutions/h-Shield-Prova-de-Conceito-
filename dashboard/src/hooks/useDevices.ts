import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../config/supabase'
import { ALIVE_THRESHOLD_MS, STATUS_REFRESH_INTERVAL_MS } from '../config/constants'
import type { Device, DeviceWithStatus } from '../types/device'

function isDeviceAlive(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false
  return (Date.now() - new Date(lastSeenAt).getTime()) < ALIVE_THRESHOLD_MS
}

function enrichDevice(device: Device): DeviceWithStatus {
  return {
    ...device,
    isAlive: isDeviceAlive(device.last_seen_at)
  }
}

export function useDevices() {
  const [devices, setDevices] = useState<DeviceWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDevices = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('devices')
      .select('*')
      .eq('active', true)
      .order('last_seen_at', { ascending: false, nullsFirst: false })

    if (fetchError) {
      console.error('[useDevices] Erro ao buscar dispositivos:', fetchError)
      setError('Falhou: veja os logs')
      return
    }

    setDevices((data || []).map(enrichDevice))
    setLoading(false)
  }, [])

  const updateDeviceStatus = useCallback((updatedDevice: Device) => {
    setDevices(prev =>
      prev.map(d =>
        d.id === updatedDevice.id ? enrichDevice(updatedDevice) : d
      )
    )
  }, [])

  const refreshAliveStatus = useCallback(() => {
    setDevices(prev => prev.map(d => enrichDevice(d)))
  }, [])

  useEffect(() => {
    fetchDevices()

    // Subscribe to device changes
    const channel = supabase
      .channel('devices-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'devices' },
        (payload) => updateDeviceStatus(payload.new as Device)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'devices' },
        () => fetchDevices()
      )
      .subscribe()

    // Periodically refresh "alive" status
    const interval = setInterval(refreshAliveStatus, STATUS_REFRESH_INTERVAL_MS)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [fetchDevices, updateDeviceStatus, refreshAliveStatus])

  return { devices, loading, error, refetch: fetchDevices }
}
