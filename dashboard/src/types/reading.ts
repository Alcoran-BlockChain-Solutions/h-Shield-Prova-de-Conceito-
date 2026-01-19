export type BlockchainStatus = 'pending' | 'confirmed' | 'failed'

export interface Reading {
  id: string
  device_id: string
  temperature: number | null
  humidity_air: number | null
  humidity_soil: number | null
  luminosity: number | null
  raw_data: Record<string, unknown> | null
  normalized_hash: string | null
  normalized_at: string
  blockchain_tx_hash: string | null
  blockchain_status: BlockchainStatus
  blockchain_error: string | null
  created_at: string
}
