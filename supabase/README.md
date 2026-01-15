# HarvestShield - Supabase Backend

## Estrutura

```
supabase/
├── functions/
│   ├── oracle/           # Recebe dados, normaliza, salva DB, registra Stellar
│   │   └── index.ts
│   └── get-readings/     # Recupera dados do DB
│       └── index.ts
├── migrations/
│   └── 001_create_readings_table.sql
├── config.toml
└── .env.example
```

## Setup

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Copie as credenciais (URL, anon key, service role key)

### 2. Criar conta Stellar Testnet

```bash
# Usando Stellar Laboratory
# https://laboratory.stellar.org/#account-creator?network=test

# Ou via curl:
curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"
```

### 3. Configurar variáveis de ambiente

No dashboard do Supabase > Settings > Edge Functions:

```
STELLAR_SECRET_KEY=S...
STELLAR_PUBLIC_KEY=G...
```

### 4. Executar migration

No SQL Editor do Supabase, execute o conteúdo de:
`migrations/001_create_readings_table.sql`

### 5. Deploy das Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy oracle
supabase functions deploy get-readings
```

## Uso

### Enviar Leitura (Oracle)

```bash
curl -X POST \
  'https://pdcueudzdvgitnqgiuwp.supabase.co/functions/v1/oracle' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkY3VldWR6ZHZnaXRucWdpdXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjkxMzEsImV4cCI6MjA4Mzg0NTEzMX0.n8CTVq8b7mA2eQrtmWoriDLeh9b8UNV1m9idEr9FQVY' \
  -H 'Content-Type: application/json' \
  -d '{
    "device_id": "esp32-farm-001",
    "temperature": 28.5,
    "humidity_air": 65.2,
    "humidity_soil": 45.8,
    "luminosity": 32000
  }'
```

**Resposta:**
```json
{
  "success": true,
  "reading_id": "uuid-here",
  "normalized_hash": "sha256-hash",
  "blockchain": {
    "success": true,
    "tx_hash": "stellar-tx-hash",
    "error": null
  }
}
```

### Recuperar Leituras

```bash
# Todas as leituras (últimas 100)
curl 'https://pdcueudzdvgitnqgiuwp.supabase.co/functions/v1/get-readings' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkY3VldWR6ZHZnaXRucWdpdXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjkxMzEsImV4cCI6MjA4Mzg0NTEzMX0.n8CTVq8b7mA2eQrtmWoriDLeh9b8UNV1m9idEr9FQVY'

# Filtrar por device
curl 'https://pdcueudzdvgitnqgiuwp.supabase.co/functions/v1/get-readings?device_id=esp32-farm-001' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkY3VldWR6ZHZnaXRucWdpdXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjkxMzEsImV4cCI6MjA4Mzg0NTEzMX0.n8CTVq8b7mA2eQrtmWoriDLeh9b8UNV1m9idEr9FQVY'

# Com paginação
curl 'https://pdcueudzdvgitnqgiuwp.supabase.co/functions/v1/get-readings?limit=10&offset=0' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkY3VldWR6ZHZnaXRucWdpdXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjkxMzEsImV4cCI6MjA4Mzg0NTEzMX0.n8CTVq8b7mA2eQrtmWoriDLeh9b8UNV1m9idEr9FQVY'
```

**Resposta:**
```json
{
  "success": true,
  "count": 10,
  "readings": [
    {
      "id": "uuid",
      "device_id": "esp32-farm-001",
      "temperature": 28.5,
      "humidity_air": 65.2,
      "humidity_soil": 45.8,
      "luminosity": 32000,
      "normalized_hash": "sha256",
      "blockchain_tx_hash": "stellar-tx",
      "blockchain_status": "confirmed",
      "created_at": "2026-01-13T..."
    }
  ]
}
```

## Verificar Transação na Stellar

Após receber o `tx_hash`, verifique em:
```
https://stellar.expert/explorer/testnet/tx/TX_HASH_HERE
```

## Fluxo de Dados v0.1

```
ESP32/Client
    │
    │ POST /oracle
    ▼
┌─────────────────┐
│  1. Validate    │
│  2. Normalize   │
│  3. Hash SHA256 │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌────────┐
│  DB   │  │Stellar │
│Insert │  │ManageData│
└───────┘  └────────┘
```
