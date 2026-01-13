-- Migration: Create readings table
-- Version: 0.1.0
-- Date: 2026-01-13

-- Tabela principal de leituras
CREATE TABLE IF NOT EXISTS readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(50) NOT NULL,
    temperature DECIMAL(5,2),
    humidity_air DECIMAL(5,2),
    humidity_soil DECIMAL(5,2),
    luminosity INTEGER,
    raw_data JSONB,
    normalized_hash VARCHAR(64),
    normalized_at TIMESTAMPTZ DEFAULT NOW(),
    blockchain_tx_hash VARCHAR(64),
    blockchain_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_readings_device_id ON readings(device_id);
CREATE INDEX IF NOT EXISTS idx_readings_created_at ON readings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_blockchain_status ON readings(blockchain_status);

-- Row Level Security
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (para v0.1)
CREATE POLICY "Public read access" ON readings
    FOR SELECT USING (true);

-- Política de insert (via service role ou anon para v0.1)
CREATE POLICY "Allow insert" ON readings
    FOR INSERT WITH CHECK (true);

-- Política de update (para atualizar blockchain_status)
CREATE POLICY "Allow update" ON readings
    FOR UPDATE USING (true);
