-- Migration: Add blockchain_error column for async oracle (RF11)
-- Version: 0.12.0
-- Date: 2026-01-18

-- Coluna para armazenar mensagens de erro do blockchain
-- Necessária para o oracle assíncrono que retorna 202 imediatamente
ALTER TABLE readings ADD COLUMN IF NOT EXISTS blockchain_error TEXT;

-- Índice para queries de erros pendentes/falhas
CREATE INDEX IF NOT EXISTS idx_readings_blockchain_error ON readings(blockchain_error)
WHERE blockchain_error IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN readings.blockchain_error IS 'Error message from Stellar blockchain transaction (RF11 async oracle)';
