-- Migration: Create devices table for IoT authentication
-- Version: 0.2.0
-- Date: 2026-01-16

-- Tabela de dispositivos autorizados
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(50) UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    name VARCHAR(100),
    location VARCHAR(200),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ,
    total_readings BIGINT DEFAULT 0
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_active ON devices(active);

-- Row Level Security
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Apenas service_role pode gerenciar devices (INSERT, UPDATE, DELETE)
CREATE POLICY "Service role full access" ON devices
    FOR ALL USING (auth.role() = 'service_role');

-- Leitura publica para verificacao de assinatura
CREATE POLICY "Public read for verification" ON devices
    FOR SELECT USING (true);

-- Inserir dispositivo de teste (esp32-farm-001)
-- Public key gerada com: openssl ec -in esp32-farm-001.key -pubout
INSERT INTO devices (device_id, public_key, name, location, active)
VALUES (
    'esp32-farm-001',
    '-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYaBliLTj6BGnA2Wk9rP8Dhcq/fUX
7SJH3cjFEg2TgRyVeJ/D/cXHlHtX+4eKP+V6ftPfVTTGG5Q9UNGEaU77/Q==
-----END PUBLIC KEY-----',
    'Sensor Estufa Principal',
    'Estufa Norte',
    true
) ON CONFLICT (device_id) DO UPDATE SET
    public_key = EXCLUDED.public_key,
    name = EXCLUDED.name,
    location = EXCLUDED.location;
