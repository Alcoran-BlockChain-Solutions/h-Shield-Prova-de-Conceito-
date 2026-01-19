// Device is considered "alive" if last_seen_at is within this threshold
export const ALIVE_THRESHOLD_MS = 30 * 1000 // 30 seconds

// Interval to refresh device status (recalculate "alive" status)
export const STATUS_REFRESH_INTERVAL_MS = 10 * 1000 // 10 seconds

// Stellar Explorer URLs
export const STELLAR_EXPLORER = {
  testnet: 'https://stellar.expert/explorer/testnet',
  mainnet: 'https://stellar.expert/explorer/public'
} as const

// Default network (can be overridden via env)
export const DEFAULT_STELLAR_NETWORK = (import.meta.env.VITE_STELLAR_NETWORK || 'testnet') as keyof typeof STELLAR_EXPLORER
