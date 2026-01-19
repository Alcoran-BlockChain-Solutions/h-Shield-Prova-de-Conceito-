import { useEffect, useState } from 'react'
import { supabase } from '../config/supabase'

type ConnectionState = 'connecting' | 'connected' | 'disconnected'

export function ConnectionStatus() {
  const [state, setState] = useState<ConnectionState>('connecting')

  useEffect(() => {
    const channel = supabase
      .channel('connection-status')
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setState('connected')
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setState('disconnected')
        } else {
          setState('connecting')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const config = {
    connecting: { label: 'Conectando...', className: 'connection-status--connecting' },
    connected: { label: 'Tempo real ativo', className: 'connection-status--connected' },
    disconnected: { label: 'Desconectado', className: 'connection-status--disconnected' }
  }

  const { label, className } = config[state]

  return (
    <div className={`connection-status ${className}`}>
      <span className="connection-status__dot" />
      <span className="connection-status__label">{label}</span>
    </div>
  )
}
