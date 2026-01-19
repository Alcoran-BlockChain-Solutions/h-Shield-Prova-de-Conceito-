// High contrast color palette for devices - WCAG AA compliant
export const DEVICE_COLORS = [
  '#1565c0', // Dark Blue
  '#2e7d32', // Dark Green
  '#c62828', // Dark Red
  '#ef6c00', // Dark Orange
  '#6a1b9a', // Dark Purple
  '#00838f', // Dark Cyan
  '#ad1457', // Dark Pink
  '#4e342e', // Dark Brown
  '#37474f', // Dark Blue Grey
  '#f9a825', // Dark Yellow
] as const

// Get color for a device based on its index
export function getDeviceColor(index: number): string {
  return DEVICE_COLORS[index % DEVICE_COLORS.length]
}

// Generate a consistent color from a device ID string
export function getDeviceColorFromId(deviceId: string): string {
  let hash = 0
  for (let i = 0; i < deviceId.length; i++) {
    const char = deviceId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const index = Math.abs(hash) % DEVICE_COLORS.length
  return DEVICE_COLORS[index]
}

// Lighter version of a color for SMA short lines
export function getLighterColor(hex: string, percent: number = 40): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, (num >> 16) + amt)
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt)
  const B = Math.min(255, (num & 0x0000FF) + amt)
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}

// Darker version of a color for SMA long lines
export function getDarkerColor(hex: string, percent: number = 25): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, (num >> 16) - amt)
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt)
  const B = Math.max(0, (num & 0x0000FF) - amt)
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}

// Create a map of device IDs to colors
export function createDeviceColorMap(deviceIds: string[]): Map<string, string> {
  const colorMap = new Map<string, string>()
  deviceIds.forEach((id, index) => {
    colorMap.set(id, getDeviceColor(index))
  })
  return colorMap
}
