# HarvestShield - Supabase Backend

## Estrutura

```
supabase/
├── functions/
│   ├── oracle/           # Recebe dados, valida PoW+ECDSA, salva DB, registra Stellar
│   │   └── index.ts
│   └── get-readings/     # Recupera dados do DB (público)
│       └── index.ts
├── migrations/
│   ├── 001_create_readings_table.sql  # Tabela de leituras
│   ├── 002_create_devices_table.sql   # Tabela de dispositivos + chaves públicas
│   ├── 003_add_blockchain_error.sql   # Campo para erros de blockchain
│   └── 004_fix_rls_performance.sql    # Políticas RLS otimizadas
├── config.toml
└── .env.example
```

## Autenticação IoT

O oracle usa um sistema de autenticação em 3 camadas:

1. **Proof of Work (PoW):** O dispositivo deve computar `SHA256(data + nonce)` que comece com `000` (dificuldade 3, ~4096 tentativas médias)
2. **Assinatura ECDSA:** O hash do PoW é assinado com a chave privada do dispositivo
3. **Anti-replay:** Timestamp deve estar dentro de 5 minutos do servidor

Headers necessários:
- `X-Device-ID`: ID do dispositivo (registrado no banco)
- `X-PoW-Data`: String dos dados (`temp-X;hum_air-Y;hum_soil-Z;lum-W`)
- `X-PoW-Nonce`: Nonce que resolve o PoW
- `X-PoW-Hash`: SHA256(data + nonce) - deve começar com "000"
- `X-Signature`: Assinatura ECDSA (base64) do PoW hash
- `X-Timestamp`: Unix timestamp atual

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
  'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/oracle' \
  -H 'Authorization: Bearer <YOUR_ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -H 'X-Device-ID: esp32-farm-001' \
  -H 'X-PoW-Data: temp-28.50;hum_air-65.20;hum_soil-45.80;lum-32000' \
  -H 'X-PoW-Nonce: <VALID_NONCE>' \
  -H 'X-PoW-Hash: <SHA256_HASH_STARTING_WITH_000>' \
  -H 'X-Signature: <ECDSA_SIGNATURE_BASE64>' \
  -H 'X-Timestamp: <UNIX_TIMESTAMP>' \
  -d '{
    "device_id": "esp32-farm-001",
    "temperature": 28.5,
    "humidity_air": 65.2,
    "humidity_soil": 45.8,
    "luminosity": 32000,
    "timestamp": 1737200000
  }'
```

> **Nota:** O ESP32 calcula automaticamente PoW (SHA256 com dificuldade 3) e assina com ECDSA.

**Resposta:**
```
HTTP/1.1 202 Accepted
```

> **Nota:** O oracle retorna 202 Accepted sem body. O processamento blockchain ocorre em background via `EdgeRuntime.waitUntil()`. Consulte a tabela `readings` para verificar o status (`blockchain_status`: pending → confirmed/failed).

### Recuperar Leituras

```bash
# Todas as leituras (últimas 100)
curl 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/get-readings' \
  -H 'Authorization: Bearer <YOUR_ANON_KEY>'

# Filtrar por device
curl 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/get-readings?device_id=esp32-farm-001' \
  -H 'Authorization: Bearer <YOUR_ANON_KEY>'

# Com paginação
curl 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/get-readings?limit=10&offset=0' \
  -H 'Authorization: Bearer <YOUR_ANON_KEY>'
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

## Scripts Python

Na pasta `scripts/`:

```bash
# Enviar uma leitura
python3 oracle.py

# Buscar leituras
python3 get_readings.py

# Simular ESP32 (1 req/segundo)
python3 simulate_esp32.py
```

Configure o `.env`:
```
SUPABASE_URL = "https://<YOUR_PROJECT_REF>.supabase.co/functions/v1"
SUPABASE_ANON_KEY = "<YOUR_ANON_KEY>"
```

---

## Análise de Custos

### Stellar (Mainnet)

| Métrica | Valor |
|---------|-------|
| Fee por transação | 0.00001 XLM (100 stroops) |
| 1 req/segundo | 3,600 tx/hora |
| **Custo por hora** | **0.036 XLM** |
| Custo por dia | 0.864 XLM |
| Custo por mês | ~26 XLM (~$2.60 @ $0.10/XLM) |

### Supabase

| Recurso | Free Tier | Pro ($25/mês) |
|---------|-----------|---------------|
| Edge Functions | 500k invocações/mês | 2M invocações/mês |
| Database | 500MB | 8GB |
| Bandwidth | 5GB | 250GB |

### Cenários de Uso

| Frequência | Stellar/mês | Supabase Invocações/mês | Plano Recomendado |
|------------|-------------|------------------------|-------------------|
| 1 req/segundo | ~26 XLM | 2.6M | Pro |
| 1 req/minuto | ~0.43 XLM | 43k | Free ✅ |
| 1 req/5 minutos | ~0.09 XLM | 8.6k | Free ✅ |
| 1 req/hora | ~0.007 XLM | 720 | Free ✅ |

### Recomendação

Para produção com **1 sensor**, usar intervalo de **1 minuto**:
- Stellar: ~$0.04/mês
- Supabase: Free tier
- **Total: ~$0.04/mês**

Para **múltiplos sensores** ou maior frequência, considerar Pro Plan ($25/mês).

---

## Fluxo de Dados v0.13

```
ESP32 (Firmware)
    │
    │ 1. Lê sensores
    │ 2. Constrói dataString: "temp-X;hum_air-Y;hum_soil-Z;lum-W"
    │ 3. PoW: encontra nonce onde SHA256(data+nonce) começa com "000"
    │ 4. Assina powHash com ECDSA
    │
    │ POST /oracle (headers: X-PoW-Data, X-PoW-Nonce, X-PoW-Hash, X-Signature)
    ▼
┌─────────────────────────────────────────────────────┐
│  ORACLE                                             │
│  1. Verifica PoW: SHA256(data+nonce) == hash ✓     │
│  2. Verifica dificuldade: hash.startsWith("000") ✓ │
│  3. Verifica ECDSA: signature(powHash) válida ✓    │
│  4. Anti-replay: timestamp < 5min ✓                │
│  5. Valida ranges dos dados                        │
└────────────────────┬────────────────────────────────┘
                     │
                     │ 202 Accepted (async)
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼ (background)
    ┌─────────┐           ┌────────────┐
    │   DB    │           │  Stellar   │
    │ INSERT  │           │ ManageData │
    │ reading │           │ powHash    │
    └─────────┘           └────────────┘
```


## Links Úteis

- [Stellar Explorer (Testnet)](https://stellar.expert/explorer/testnet)
- [Supabase Dashboard](https://supabase.com/dashboard)