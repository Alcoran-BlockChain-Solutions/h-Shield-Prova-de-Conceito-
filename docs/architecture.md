# HarvestShield - Arquitetura Técnica Detalhada

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HARVESTSHIELD MVP                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                    ┌─────────────────────────────────────┐ │
│  │   ESP32     │                    │            SUPABASE                 │ │
│  │  SIMULATOR  │                    │                                     │ │
│  │             │     HTTPS POST     │  ┌───────────────────────────────┐  │ │
│  │ ┌─────────┐ │ ─────────────────> │  │      EDGE FUNCTION           │  │ │
│  │ │ WiFi    │ │                    │  │      (Oráculo)               │  │ │
│  │ │ Client  │ │                    │  │                               │  │ │
│  │ └─────────┘ │                    │  │  ┌─────────┐  ┌───────────┐  │  │ │
│  │             │                    │  │  │Validate │->│Normalize  │  │  │ │
│  │ ┌─────────┐ │                    │  │  └─────────┘  └─────┬─────┘  │  │ │
│  │ │ Data    │ │                    │  │                     │        │  │ │
│  │ │Generator│ │                    │  │         ┌───────────┴──────┐ │  │ │
│  │ └─────────┘ │                    │  │         │                  │ │  │ │
│  └─────────────┘                    │  │    ┌────▼────┐    ┌────────▼┐│  │ │
│                                     │  │    │PostgreSQL│   │ Stellar ││  │ │
│                                     │  │    │   DB    │    │ Testnet ││  │ │
│                                     │  │    └────┬────┘    └─────────┘│  │ │
│                                     │  └─────────│────────────────────┘  │ │
│                                     │            │                       │ │
│                                     │  ┌─────────▼───────────────────┐  │ │
│                                     │  │       pg_graphql            │  │ │
│                                     │  │       (API Layer)           │  │ │
│                                     │  └─────────────────────────────┘  │ │
│                                     └─────────────────────────────────────┘ │
│                                                    │                        │
│  ┌─────────────┐                                   │                        │
│  │   CLIENT    │ <─────────────────────────────────┘                        │
│  │    APP      │              GraphQL                                       │
│  └─────────────┘                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Componente 1: Supabase Service

### 1.1 PostgreSQL Schema

```sql
-- Tabela principal de leituras
CREATE TABLE readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(50) NOT NULL,
    temperature DECIMAL(5,2),
    humidity_air DECIMAL(5,2),
    humidity_soil DECIMAL(5,2),
    luminosity INTEGER,
    raw_data JSONB,
    normalized_at TIMESTAMPTZ DEFAULT NOW(),
    blockchain_tx_hash VARCHAR(64),
    blockchain_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_readings_device_id ON readings(device_id);
CREATE INDEX idx_readings_created_at ON readings(created_at DESC);
CREATE INDEX idx_readings_blockchain_status ON readings(blockchain_status);

-- Row Level Security
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Public read access" ON readings
    FOR SELECT USING (true);

-- Política de insert via service role
CREATE POLICY "Service insert" ON readings
    FOR INSERT WITH CHECK (true);
```

### 1.2 Edge Function - Oráculo

```
supabase/functions/
└── oracle/
    ├── index.ts          # Entry point
    ├── validator.ts      # Validação de dados
    ├── normalizer.ts     # Normalização
    ├── stellar.ts        # Integração blockchain
    └── types.ts          # Type definitions
```

**Fluxo da Edge Function:**

```
Request -> Validate -> Normalize -> [DB Insert + Stellar Record] -> Response
```

---

## Componente 2: Stellar Integration

### 2.1 Estrutura de Dados na Blockchain

Usando **Manage Data** operation da Stellar:

```typescript
interface StellarDataEntry {
  key: string;      // "reading_{timestamp}"
  value: string;    // Hash SHA256 dos dados normalizados
}
```

### 2.2 Fluxo de Registro

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Dados      │ --> │   SHA256     │ --> │   Manage     │
│ Normalizados │     │    Hash      │     │    Data      │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │   Stellar    │
                                          │   Testnet    │
                                          └──────────────┘
```

### 2.3 Configuração Stellar

```typescript
// stellar.ts
import { Keypair, Server, TransactionBuilder, Operation, Networks } from 'stellar-sdk';

const server = new Server('https://horizon-testnet.stellar.org');
const sourceKeypair = Keypair.fromSecret(Deno.env.get('STELLAR_SECRET_KEY')!);

export async function recordOnBlockchain(dataHash: string, timestamp: number): Promise<string> {
  const account = await server.loadAccount(sourceKeypair.publicKey());

  const transaction = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(Operation.manageData({
      name: `reading_${timestamp}`,
      value: dataHash
    }))
    .setTimeout(30)
    .build();

  transaction.sign(sourceKeypair);
  const result = await server.submitTransaction(transaction);

  return result.hash;
}
```

---

## Componente 3: Serviço de Normalização

### 3.1 Regras de Validação

```typescript
// validator.ts
interface RawReading {
  device_id: string;
  temperature?: number;
  humidity_air?: number;
  humidity_soil?: number;
  luminosity?: number;
  timestamp?: number;
}

const VALIDATION_RULES = {
  temperature: { min: -40, max: 60 },
  humidity_air: { min: 0, max: 100 },
  humidity_soil: { min: 0, max: 100 },
  luminosity: { min: 0, max: 120000 }
};

export function validate(data: RawReading): ValidationResult {
  // Implementação...
}
```

### 3.2 Normalização

```typescript
// normalizer.ts
interface NormalizedReading {
  device_id: string;
  temperature: number;      // Celsius, 2 decimal places
  humidity_air: number;     // Percentage, 2 decimal places
  humidity_soil: number;    // Percentage, 2 decimal places
  luminosity: number;       // Lux, integer
  timestamp: number;        // Unix timestamp
  hash: string;             // SHA256 of normalized data
}

export function normalize(validated: ValidatedReading): NormalizedReading {
  const normalized = {
    device_id: validated.device_id.trim().toLowerCase(),
    temperature: parseFloat(validated.temperature.toFixed(2)),
    humidity_air: parseFloat(validated.humidity_air.toFixed(2)),
    humidity_soil: parseFloat(validated.humidity_soil.toFixed(2)),
    luminosity: Math.round(validated.luminosity),
    timestamp: validated.timestamp || Date.now()
  };

  return {
    ...normalized,
    hash: generateHash(normalized)
  };
}
```

---

## Componente 4: GraphQL API

### 4.1 Configuração pg_graphql

O Supabase já vem com pg_graphql habilitado. Basta:

1. Criar as tabelas com os tipos corretos
2. Configurar RLS
3. Acessar via endpoint GraphQL

**Endpoint:** `https://<project>.supabase.co/graphql/v1`

### 4.2 Queries Disponíveis

```graphql
# Listar todas as leituras
query GetReadings {
  readingsCollection(
    orderBy: [{ created_at: DescNullsLast }]
    first: 100
  ) {
    edges {
      node {
        id
        device_id
        temperature
        humidity_air
        humidity_soil
        luminosity
        blockchain_tx_hash
        created_at
      }
    }
  }
}

# Leituras por dispositivo
query GetDeviceReadings($deviceId: String!) {
  readingsCollection(
    filter: { device_id: { eq: $deviceId } }
    orderBy: [{ created_at: DescNullsLast }]
  ) {
    edges {
      node {
        id
        temperature
        humidity_air
        created_at
      }
    }
  }
}

# Verificar registro blockchain
query VerifyBlockchain($txHash: String!) {
  readingsCollection(
    filter: { blockchain_tx_hash: { eq: $txHash } }
  ) {
    edges {
      node {
        id
        raw_data
        blockchain_tx_hash
        blockchain_status
      }
    }
  }
}
```

---

## Componente 5: ESP32 Firmware

### 5.1 Estrutura do Projeto

```
firmware/
├── src/
│   ├── main.cpp
│   ├── config.h
│   ├── wifi_manager.cpp
│   ├── data_generator.cpp
│   ├── http_client.cpp
│   └── led_status.cpp
├── platformio.ini
└── README.md
```

### 5.2 Data Generator

```cpp
// data_generator.cpp
#include "data_generator.h"

struct SensorData {
  float temperature;
  float humidity_air;
  float humidity_soil;
  int luminosity;
};

SensorData generateRealisticData() {
  static float lastTemp = 25.0;
  static float lastHumAir = 60.0;
  static float lastHumSoil = 50.0;

  // Variação realista baseada na hora do dia
  int hour = getHour();

  // Temperatura: mais quente durante o dia
  float tempVariation = random(-20, 20) / 10.0;
  if (hour >= 10 && hour <= 16) {
    tempVariation += 0.5;
  } else if (hour >= 0 && hour <= 6) {
    tempVariation -= 0.3;
  }
  lastTemp = constrain(lastTemp + tempVariation, 15.0, 35.0);

  // Umidade ar: inverso da temperatura
  float humVariation = random(-50, 50) / 10.0;
  lastHumAir = constrain(lastHumAir + humVariation, 40.0, 90.0);

  // Umidade solo: variação mais lenta
  float soilVariation = random(-30, 30) / 10.0;
  lastHumSoil = constrain(lastHumSoil + soilVariation, 20.0, 80.0);

  // Luminosidade: ciclo diurno
  int baseLux = 0;
  if (hour >= 6 && hour <= 18) {
    baseLux = map(hour <= 12 ? hour - 6 : 18 - hour, 0, 6, 1000, 65000);
  }
  int lux = baseLux + random(-1000, 1000);

  return {lastTemp, lastHumAir, lastHumSoil, max(0, lux)};
}
```

### 5.3 HTTP Client

```cpp
// http_client.cpp
#include <HTTPClient.h>
#include <ArduinoJson.h>

bool sendToOracle(SensorData data, const char* deviceId) {
  HTTPClient http;

  http.begin(ORACLE_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));

  StaticJsonDocument<256> doc;
  doc["device_id"] = deviceId;
  doc["temperature"] = data.temperature;
  doc["humidity_air"] = data.humidity_air;
  doc["humidity_soil"] = data.humidity_soil;
  doc["luminosity"] = data.luminosity;
  doc["timestamp"] = getUnixTimestamp();

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  http.end();

  return httpCode == 200 || httpCode == 201;
}
```

---

## Componente 6: Integração E2E

### 6.1 Fluxo Completo

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  ESP32  │───>│ Oracle  │───>│Normalize│───>│PostgreSQL│   │ Client  │
│Generate │    │Validate │    │  Hash   │    │  Store  │<──│  Query  │
└─────────┘    └─────────┘    └────┬────┘    └─────────┘   └─────────┘
                                   │
                                   ▼
                              ┌─────────┐
                              │ Stellar │
                              │ Record  │
                              └─────────┘
```

### 6.2 Payload de Comunicação

**ESP32 -> Oracle (Request):**
```json
{
  "device_id": "esp32-farm-001",
  "temperature": 28.5,
  "humidity_air": 65.2,
  "humidity_soil": 45.8,
  "luminosity": 32000,
  "timestamp": 1736784000
}
```

**Oracle -> ESP32 (Response):**
```json
{
  "success": true,
  "reading_id": "uuid-here",
  "blockchain_tx": "stellar-tx-hash",
  "normalized_hash": "sha256-hash"
}
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
STELLAR_NETWORK=testnet
```

### ESP32
```cpp
#define WIFI_SSID "your-wifi"
#define WIFI_PASSWORD "your-password"
#define ORACLE_URL "https://xxx.supabase.co/functions/v1/oracle"
#define SUPABASE_ANON_KEY "eyJ..."
#define DEVICE_ID "esp32-farm-001"
#define SEND_INTERVAL_MS 60000
```

---

_Documento gerado em 2026-01-13 | HarvestShield Architecture v1.0_
