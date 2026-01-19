/**
 * Format a date as relative time (e.g., "1 hora atrás", "agora mesmo")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - then.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 30) {
    return 'agora mesmo'
  }

  if (diffSeconds < 60) {
    return `${diffSeconds} segundos atrás`
  }

  if (diffMinutes === 1) {
    return '1 minuto atrás'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minutos atrás`
  }

  if (diffHours === 1) {
    return '1 hora atrás'
  }

  if (diffHours < 24) {
    return `${diffHours} horas atrás`
  }

  if (diffDays === 1) {
    return '1 dia atrás'
  }

  if (diffDays < 7) {
    return `${diffDays} dias atrás`
  }

  // For older dates, show the actual date
  return then.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Format a date as full date and time for tooltip
 */
export function formatFullDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
