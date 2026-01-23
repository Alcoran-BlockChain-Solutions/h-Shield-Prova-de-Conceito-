# HarvestShield - Arquitetura Técnica Detalhada

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              HARVESTSHIELD - ARQUITETURA COMPLETA                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────┐                    ┌─────────────────────────────────────────────┐  │
│  │     ESP32       │     HTTPS POST     │                  SUPABASE                   │  │
│  │   (firmware/)   │ ─────────────────> │                                             │  │
│  │                 │                    │  ┌───────────────────────────────────────┐  │  │
│  │ ┌─────────────┐ │   Headers:         │  │        EDGE FUNCTION (Oracle)         │  │  │
│  │ │ sensors/    │ │   X-Device-ID      │  │                                       │  │  │
│  │ │ temperature │ │   X-Timestamp      │  │  1. Verify PoW (SHA256, difficulty 3) │  │  │
│  │ │ humidity_*  │ │   X-PoW-Data       │  │  2. Verify ECDSA P-256 Signature      │  │  │
│  │ │ luminosity  │ │   X-PoW-Nonce      │  │  3. Anti-replay (5min window)         │  │  │
│  │ └─────────────┘ │   X-PoW-Hash       │  │  4. Validate ranges                   │  │  │
│  │                 │   X-Signature      │  │  5. Normalize + SHA256 hash           │  │  │
│  │ ┌─────────────┐ │                    │  │  6. Save to PostgreSQL                │  │  │
│  │ │ crypto.cpp  │ │                    │  │  7. Return 202 Accepted               │  │  │
│  │ │ SHA256+PoW  │ │                    │  │  8. Stellar TX (background)           │  │  │
│  │ │ ECDSA sign  │ │                    │  └──────────────────┬────────────────────┘  │  │
│  │ └─────────────┘ │                    │                     │                       │  │
│  │                 │                    │          ┌──────────┴──────────┐            │  │
│  │ ┌─────────────┐ │                    │          │                     │            │  │
│  │ │ key_manager │ │                    │   ┌──────▼──────┐    ┌─────────▼─────────┐  │  │
│  │ │ NVS storage │ │                    │   │ PostgreSQL  │    │ Stellar Blockchain│  │  │
│  │ │ MAC→DeviceID│ │                    │   │  (readings  │    │  (testnet/mainnet)│  │  │
│  │ └─────────────┘ │                    │   │   devices)  │    │                   │  │  │
│  │                 │                    │   └──────┬──────┘    └───────────────────┘  │  │
│  │ ┌─────────────┐ │                    │          │                                  │  │
│  │ │ http_client │ │                    │          │ Realtime (WebSocket)             │  │
│  │ │retry+backoff│ │                    │          │                                  │  │
│  │ └─────────────┘ │                    │   ┌──────▼──────┐    ┌───────────────────┐  │  │
│  └─────────────────┘                    │   │ REST API    │    │ Realtime Channel  │  │  │
│                                         │   │get-readings │    │ postgres_changes  │  │  │
│                                         │   └──────┬──────┘    └─────────┬─────────┘  │  │
│                                         └──────────│────────────────────│─────────────┘  │
│                                                    │                    │                │
│                                                    └────────┬───────────┘                │
│                                                             │                            │
│  ┌──────────────────────────────────────────────────────────▼──────────────────────────┐ │
│  │                         DASHBOARD (React + Vite + TypeScript)                        │ │
│  │                                                                                      │ │
│  │  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────────┐  │ │
│  │  │     Dashboard       │    │     Analytics       │    │      Components         │  │ │
│  │  │  - Device list      │    │  - Line charts      │    │  - DeviceCard           │  │ │
│  │  │  - Reading cards    │    │  - Area charts      │    │  - ReadingCard          │  │ │
│  │  │  - Realtime updates │    │  - Stat cards       │    │  - BlockchainStatus     │  │ │
│  │  │  - Connection status│    │  - Theme toggle     │    │  - TransactionLink      │  │ │
│  │  └─────────────────────┘    └─────────────────────┘    └─────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Componente 1: ESP32 Firmware (C++)

### 1.1 Estrutura do Projeto

```
firmware/
├── include/
│   ├── config.example.h   # Template de configuração
│   ├── config.h           # WiFi, Supabase URL, keys (gitignored)
│   ├── crypto.h           # SHA256, ECDSA sign, PoW
│   ├── key_manager.h      # NVS secure key storage
│   ├── sensors.h          # Sensor reading interface
│   ├── http_client.h      # HTTP POST with retry
│   ├── time_manager.h     # NTP sync
│   ├── wifi_manager.h     # WiFi reconnection
│   ├── led.h              # Status feedback
│   ├── stats.h            # Operation statistics
│   ├── app_controller.h   # Main application control
│   └── error_types.h      # Error type definitions
├── src/
│   ├── main.cpp           # Setup + Loop (runCycle)
│   ├── crypto.cpp         # mbedTLS ECDSA P-256 + SHA256 + PoW
│   ├── key_manager.cpp    # NVS operations, key generation
│   ├── app_controller.cpp # Application state machine
│   ├── sensors.cpp        # Aggregated sensor readings
│   ├── sensors/           # Individual sensor modules
│   │   ├── temperature.cpp/h
│   │   ├── humidity_air.cpp/h
│   │   ├── humidity_soil.cpp/h
│   │   └── luminosity.cpp/h
│   ├── transport/         # HTTP transport layer
│   │   ├── payload_builder.cpp/h
│   │   └── request_sender.cpp/h
│   ├── http_client.cpp    # PoW + Sign + POST with retry
│   ├── time_manager.cpp   # NTP client
│   ├── wifi_manager.cpp   # WiFi management
│   ├── led.cpp            # LED patterns
│   └── stats.cpp          # Stats persistence
└── platformio.ini
```

### 1.2 Fluxo de Segurança

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ESP32 SECURITY FLOW                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Generate sensor data                                            │
│     │                                                               │
│     ▼                                                               │
│  2. Create JSON payload                                             │
│     │                                                               │
│     ▼                                                               │
│  3. Compute Proof of Work (SHA256, difficulty=3)                    │
│     │  - Hash: SHA256(data + nonce)                                 │
│     │  - Find nonce where hash starts with "000"                    │
│     │  - ~4096 attempts average                                     │
│     │                                                               │
│     ▼                                                               │
│  4. Sign with ECDSA P-256                                           │
│     │  - Private key stored in NVS                                  │
│     │  - Sign SHA256(payload)                                       │
│     │  - Convert DER → P1363 format                                 │
│     │                                                               │
│     ▼                                                               │
│  5. Send HTTPS POST with headers                                    │
│     - X-Device-ID: MAC-based identifier                             │
│     - X-Timestamp: Unix timestamp (NTP synced)                      │
│     - X-PoW-Data: Original data for PoW                             │
│     - X-PoW-Nonce: Found nonce                                      │
│     - X-PoW-Hash: Resulting hash                                    │
│     - X-Signature: ECDSA signature (base64)                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Key Manager

```cpp
// key_manager.cpp - Secure key storage using ESP32 NVS
class KeyManager {
    // Generates ECDSA P-256 keypair on first boot
    // Stores private key in NVS (Non-Volatile Storage)
    // Exports public key in PEM format for registration
    // Device ID derived from MAC address
};
```

---

## Componente 2: Supabase Edge Functions

### 2.1 Oracle Function (oracle/index.ts)

**Versão:** v0.14 - Async Stellar com retry

```typescript
// Fluxo principal
async function handleRequest(req: Request): Promise<Response> {
  // 1. Extract headers
  const deviceId = req.headers.get('X-Device-ID');
  const timestamp = req.headers.get('X-Timestamp');
  const powData = req.headers.get('X-PoW-Data');
  const powNonce = req.headers.get('X-PoW-Nonce');
  const powHash = req.headers.get('X-PoW-Hash');
  const signature = req.headers.get('X-Signature');

  // 2. Verify Proof of Work
  if (!verifyPoW(powData, powNonce, powHash, DIFFICULTY)) {
    return new Response('Invalid PoW', { status: 400 });
  }

  // 3. Verify timestamp (anti-replay, 5 min window)
  if (!isTimestampValid(timestamp, 5 * 60 * 1000)) {
    return new Response('Timestamp expired', { status: 400 });
  }

  // 4. Get device public key and verify signature
  const device = await getDevice(deviceId);
  if (!verifySignature(payload, signature, device.public_key)) {
    return new Response('Invalid signature', { status: 401 });
  }

  // 5. Validate and normalize data
  const normalized = normalize(payload);
  const dataHash = sha256(JSON.stringify(normalized));

  // 6. Save to PostgreSQL with status: 'pending'
  const reading = await saveReading(normalized, dataHash);

  // 7. Return 202 Accepted immediately
  const response = new Response(
    JSON.stringify({ success: true, reading_id: reading.id }),
    { status: 202 }
  );

  // 8. Process Stellar in background
  EdgeRuntime.waitUntil(processBlockchain(reading.id, dataHash));

  return response;
}
```

### 2.2 REST API (get-readings/index.ts)

**Versão:** v0.4 - Filtros + Paginação

```typescript
// GET /get-readings?device_id=xxx&limit=50&offset=0
async function handleRequest(req: Request): Promise<Response> {
  const { device_id, limit = 50, offset = 0 } = getQueryParams(req);

  let query = supabase
    .from('readings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (device_id) {
    query = query.eq('device_id', device_id);
  }

  const { data, error } = await query;
  return new Response(JSON.stringify(data));
}
```

---

## Componente 3: PostgreSQL Schema

### 3.1 Tabela: readings

```sql
CREATE TABLE readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(50) NOT NULL,
    temperature DECIMAL(5,2),
    humidity_air DECIMAL(5,2),
    humidity_soil DECIMAL(5,2),
    luminosity INTEGER,
    data_hash VARCHAR(64),
    pow_hash VARCHAR(64),
    pow_nonce BIGINT,
    blockchain_tx_hash VARCHAR(64),
    blockchain_status VARCHAR(20) DEFAULT 'pending',
    blockchain_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_readings_device_id ON readings(device_id);
CREATE INDEX idx_readings_created_at ON readings(created_at DESC);
CREATE INDEX idx_readings_blockchain_status ON readings(blockchain_status);

-- RLS
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON readings FOR SELECT USING (true);
CREATE POLICY "Service write" ON readings FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update" ON readings FOR UPDATE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE readings;
```

### 3.2 Tabela: devices

```sql
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(50) UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    name VARCHAR(100),
    location VARCHAR(200),
    active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ,
    total_readings BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_devices_device_id ON devices(device_id);
```

---

## Componente 4: Stellar Integration

### 4.1 ManageData Operation

```typescript
// Stellar record structure
const transaction = new TransactionBuilder(account, {
  fee: '100',
  networkPassphrase: NETWORK === 'mainnet'
    ? Networks.PUBLIC
    : Networks.TESTNET
})
  .addOperation(Operation.manageData({
    name: `r_${timestamp}`,           // Key: r_1705123456789
    value: `${powHash}:${nonce}`      // Value: hash:nonce
  }))
  .addMemo(Memo.text(deviceId.slice(0, 28)))
  .setTimeout(30)
  .build();
```

### 4.2 Retry Logic

```typescript
async function submitWithRetry(tx: Transaction, maxRetries = 3): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await server.submitTransaction(tx);
      return result.hash;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

---

## Componente 5: Dashboard (React + Vite)

### 5.1 Estrutura do Projeto

```
dashboard/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Router + Layout
│   ├── pages/
│   │   ├── Dashboard.tsx           # Main view with devices and readings
│   │   └── Analytics.tsx           # Charts and statistics
│   ├── components/
│   │   ├── Layout.tsx              # App shell
│   │   ├── DeviceCard.tsx          # Device info
│   │   ├── DeviceStatusBadge.tsx   # Online/offline indicator
│   │   ├── ReadingCard.tsx         # Sensor reading display
│   │   ├── ReadingMetrics.tsx      # Metrics visualization
│   │   ├── BlockchainStatus.tsx    # TX status + error modal
│   │   ├── TransactionLink.tsx     # Stellar explorer link
│   │   ├── StellarExplorer.tsx     # Explorer integration
│   │   ├── ConnectionStatus.tsx    # Realtime connection
│   │   └── charts/
│   │       ├── StatCard.tsx
│   │       ├── SensorLineChart.tsx
│   │       └── SensorAreaChart.tsx
│   ├── hooks/
│   │   ├── useDevices.ts           # Device data + realtime
│   │   ├── useReadings.ts          # Readings + realtime subscriptions
│   │   ├── useAnalyticsData.ts     # Aggregated analytics
│   │   └── useRelativeTime.ts      # Time formatting
│   ├── contexts/
│   │   └── ThemeContext.tsx        # Dark/light mode
│   ├── config/
│   │   ├── supabase.ts             # Supabase client
│   │   └── constants.ts
│   ├── types/
│   │   ├── device.ts
│   │   └── reading.ts
│   └── utils/
│       ├── statistics.ts
│       ├── colors.ts
│       └── time.ts
└── package.json
```

### 5.2 Realtime Subscriptions

```typescript
// useReadings.ts - Real-time data updates
useEffect(() => {
  // Subscribe to new readings
  const insertChannel = supabase
    .channel('readings-inserts')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'readings' },
      (payload) => prependReading(payload.new as Reading)
    )
    .subscribe();

  // Subscribe to reading updates (blockchain status changes)
  const updateChannel = supabase
    .channel('readings-updates')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'readings' },
      (payload) => updateReadingStatus(payload.new as Reading)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(insertChannel);
    supabase.removeChannel(updateChannel);
  };
}, []);
```

---

## Componente 6: Segurança

### 6.1 Camadas de Segurança

| Camada | Mecanismo | Implementação |
|--------|-----------|---------------|
| **Autenticação** | ECDSA P-256 | Chave privada em NVS, assinatura DER→P1363 |
| **Anti-Sybil** | Proof of Work | SHA256 com dificuldade 3 (~4096 tentativas) |
| **Anti-Replay** | Timestamp | Janela de 5 minutos, verificação server-side |
| **Autorização** | RLS PostgreSQL | service_role para write, public para read |
| **Integridade** | SHA256 Hash | Hash dos dados normalizados |
| **Imutabilidade** | Stellar ManageData | Registro permanente do PoW hash + nonce |
| **Transporte** | HTTPS/TLS | Certificado válido obrigatório |

### 6.2 Fluxo de Verificação

```
Request → [1. PoW Check] → [2. Timestamp Check] → [3. Signature Check] → Process
              ↓                    ↓                      ↓
           400 Bad              400 Bad               401 Unauthorized
```

---

## Variáveis de Ambiente

### Supabase
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Stellar
```env
STELLAR_SECRET_KEY=S...
STELLAR_PUBLIC_KEY=G...
STELLAR_NETWORK=testnet  # or mainnet
```

### ESP32 (config.h)
```cpp
#define WIFI_SSID "your-wifi"
#define WIFI_PASSWORD "your-password"
#define ORACLE_URL "https://xxx.supabase.co/functions/v1/oracle"
#define DEVICE_ID "auto"  // Uses MAC address
#define SEND_INTERVAL_MS 15000  // 15 segundos entre leituras
#define POW_DIFFICULTY 3
```

---

_Documento atualizado em 2026-01-23 | HarvestShield Architecture v2.1_
