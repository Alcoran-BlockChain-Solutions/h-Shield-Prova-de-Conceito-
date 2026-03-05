# HarvestShield Firmware

Firmware para ESP32 que envia dados de sensores para o backend Supabase com autenticação ECDSA, Proof of Work e registro na blockchain Stellar.

## Estrutura

```
firmware/
├── include/
│   ├── config.example.h   # Template de configuração
│   ├── config.h           # Configurações (WiFi, Supabase) - gitignored
│   ├── crypto.h           # SHA256, ECDSA P-256, Proof of Work
│   ├── key_manager.h      # Gerenciamento de chaves (NVS)
│   ├── app_controller.h   # Controlador principal da aplicação
│   ├── sensors.h          # Interface de sensores
│   ├── http_client.h      # Comunicação HTTP com retry
│   ├── time_manager.h     # Sincronização NTP
│   ├── wifi_manager.h     # Gerenciamento WiFi
│   ├── led.h              # Controle de LEDs
│   ├── stats.h            # Estatísticas de operação
│   └── error_types.h      # Definições de tipos de erro
├── src/
│   ├── main.cpp           # Setup + Loop principal
│   ├── crypto.cpp         # mbedTLS ECDSA P-256 + SHA256 + PoW
│   ├── key_manager.cpp    # Operações NVS, geração de chaves
│   ├── app_controller.cpp # State machine da aplicação
│   ├── sensors.cpp        # Agregação de leituras
│   ├── sensors/           # Módulos individuais de sensores
│   │   ├── temperature.cpp/h
│   │   ├── humidity_air.cpp/h
│   │   ├── humidity_soil.cpp/h
│   │   └── luminosity.cpp/h
│   ├── transport/         # Camada de transporte HTTP
│   │   ├── payload_builder.cpp/h
│   │   └── request_sender.cpp/h
│   ├── http_client.cpp    # PoW + Sign + POST com retry
│   ├── time_manager.cpp   # Cliente NTP
│   ├── wifi_manager.cpp   # Gerenciamento WiFi
│   ├── led.cpp            # Padrões de LED
│   └── stats.cpp          # Persistência de stats
└── platformio.ini
```

## Módulos

| Módulo | Namespace | Descrição |
|--------|-----------|-----------|
| `crypto` | `Crypto::` | ECDSA P-256, SHA256, Proof of Work (dificuldade 3) |
| `key_manager` | `KeyManager::` | Gerenciamento de chave privada no NVS, Device ID via MAC |
| `app_controller` | `AppController::` | State machine: sensors → PoW → sign → HTTP |
| `sensors` | `Sensors::` | Leitura de sensores (temperatura, umidade ar/solo, luminosidade) |
| `http_client` | `HttpClient::` | Envio HTTP POST com headers de autenticação |
| `time_manager` | `TimeManager::` | Sincronização de tempo via NTP |
| `wifi_manager` | `WiFiManager::` | Conexão e reconexão automática WiFi |
| `led` | `Led::` | Controle do LED integrado (GPIO2) com padrões de feedback |
| `stats` | `StatsManager::` | Estatísticas de operação e custos Stellar |

## Configuração

1. Copie `include/config.example.h` para `include/config.h`
2. Preencha suas credenciais:

```cpp
#define WIFI_SSID     "sua-rede"
#define WIFI_PASSWORD "sua-senha"
#define SUPABASE_URL      "https://seu-projeto.supabase.co/functions/v1"
#define SUPABASE_ANON_KEY "sua-anon-key"
```

## Build e Upload

```bash
# Compilar
pio run

# Upload para ESP32
pio run -t upload

# Monitor serial
pio device monitor

# Clean build
pio run -t clean
```

## Fluxo de Segurança

```
1. Lê sensores (temperatura, umidade ar/solo, luminosidade)
2. Constrói dataString: "temp-X;hum_air-Y;hum_soil-Z;lum-W"
3. Computa PoW: encontra nonce onde SHA256(data+nonce) começa com "000"
4. Assina o PoW hash com ECDSA P-256 (chave privada no NVS)
5. Envia POST HTTPS com headers de autenticação
```

## Headers Enviados

| Header | Descrição |
|--------|-----------|
| `X-Device-ID` | Identificador do dispositivo (baseado no MAC) |
| `X-Timestamp` | Unix timestamp (sincronizado via NTP) |
| `X-PoW-Data` | String dos dados para PoW |
| `X-PoW-Nonce` | Nonce que resolve o PoW |
| `X-PoW-Hash` | SHA256(data + nonce) - começa com "000" |
| `X-Signature` | Assinatura ECDSA do PoW hash (base64) |

## Padrões de LED

| Padrão | Significado |
|--------|-------------|
| 3x rápido | Boot iniciado |
| 2x normal | Pronto para operar |
| Piscando lento | Conectando WiFi |
| 1x rápido | Envio com sucesso |
| 3x lento | Erro |

## Intervalo de Leituras

O intervalo padrão é **15 segundos** (`INTERVAL_MS 15000` em main.cpp).

Para alterar, modifique a constante em `src/main.cpp`:

```cpp
#define INTERVAL_MS 15000  // 15 segundos
```

## Dependências

- PlatformIO
- ESP32 Arduino Framework
- Bibliotecas nativas: WiFi, HTTPClient, mbedTLS, NVS
- **Zero dependências externas** - apenas bibliotecas nativas do ESP32

## Primeira Execução

Na primeira execução, o firmware:
1. Gera um par de chaves ECDSA P-256
2. Armazena a chave privada no NVS (Non-Volatile Storage)
3. Exibe a chave pública no Serial Monitor (formato PEM)
4. A chave pública deve ser registrada na tabela `devices` do Supabase

```
============================================================
ESP32 FIRMWARE - HarvestShield
============================================================
Device ID:    esp32-farm-001
MAC Address:  AA:BB:CC:DD:EE:FF
Private Key:  OK (NVS)
Interval:     15000 ms
============================================================
Public Key (PEM):
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
-----END PUBLIC KEY-----
============================================================
```
