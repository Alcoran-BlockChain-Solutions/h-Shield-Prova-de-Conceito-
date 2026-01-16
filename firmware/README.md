# HarvestShield Firmware

Firmware para ESP32 que envia dados de sensores para o backend Supabase com registro na blockchain Stellar.

## Estrutura

```
firmware/
├── include/
│   ├── config.h           # Configurações (WiFi, Supabase)
│   ├── led.h              # Controle de LEDs
│   ├── wifi_manager.h     # Gerenciamento WiFi
│   ├── sensors.h          # Leitura de sensores
│   ├── http_client.h      # Comunicação HTTP
│   └── stats.h            # Estatísticas
├── src/
│   ├── main.cpp           # Setup + Loop principal
│   ├── led.cpp            # Implementação LED
│   ├── wifi_manager.cpp   # Implementação WiFi
│   ├── sensors.cpp        # Implementação Sensores
│   ├── http_client.cpp    # Implementação HTTP
│   └── stats.cpp          # Implementação Stats
└── platformio.ini
```

## Módulos

| Módulo | Namespace | Descrição |
|--------|-----------|-----------|
| `led` | `Led::` | Controle do LED integrado (GPIO2) com padrões de feedback |
| `wifi_manager` | `WiFiManager::` | Conexão e reconexão automática WiFi |
| `sensors` | `Sensors::` | Leitura de sensores (simulados por enquanto) |
| `http_client` | `HttpClient::` | Envio de dados via HTTP POST para Supabase |
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
```

## Padrões de LED

| Padrão | Significado |
|--------|-------------|
| 3x rápido | Boot iniciado |
| 2x rápido | Sucesso com blockchain |
| 1x rápido | Sucesso sem blockchain |
| 3x lento | Erro |
| Piscando lento | Conectando WiFi |

## Dependências

- PlatformIO
- ESP32 Arduino Framework
- Bibliotecas nativas: WiFi, HTTPClient
