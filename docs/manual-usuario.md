# HarvestShield - Manual do Usuário

## Visão Geral

HarvestShield é um sistema de monitoramento agrícola com IoT e blockchain que oferece:

- **Coleta de dados climáticos** via sensores ESP32 (temperatura, umidade do ar, umidade do solo, luminosidade)
- **Registro imutável** dos dados na blockchain Stellar
- **Dashboard em tempo real** para visualização e análise

---

## Arquitetura do Sistema

```
┌─────────────────┐          ┌─────────────────────┐          ┌─────────────────┐
│     ESP32       │  HTTPS   │    Supabase         │          │    Dashboard    │
│   (Sensores)    │ ───────> │  (Oracle + DB)      │ <─────── │    (React)      │
│                 │          │        │            │ Realtime │                 │
│  PoW + ECDSA    │          │        ▼            │          │  Visualização   │
└─────────────────┘          │  Stellar Blockchain │          │  Gráficos       │
                             └─────────────────────┘          └─────────────────┘
```

---

## Componentes

### 1. Dispositivo IoT (ESP32)

| Item | Descrição |
|------|-----------|
| Hardware | ESP32 DevKit |
| Sensores | Temperatura, Umidade Ar, Umidade Solo, Luminosidade |
| Comunicação | WiFi → HTTPS |
| Intervalo | 15 segundos (configurável) |
| Segurança | ECDSA P-256 + Proof of Work |

### 2. Backend (Supabase)

| Componente | Função |
|------------|--------|
| Oracle | Valida PoW, verifica assinatura, salva dados |
| PostgreSQL | Armazena leituras com RLS |
| Realtime | Notifica dashboard de novos dados |

### 3. Blockchain (Stellar)

| Item | Descrição |
|------|-----------|
| Rede | Testnet (desenvolvimento) ou Mainnet (produção) |
| Operação | ManageData com hash dos dados |
| Custo | ~$0.00001 por transação |

### 4. Dashboard (React)

| Recurso | Descrição |
|---------|-----------|
| Visualização | Lista de dispositivos e leituras |
| Tempo real | Atualização automática via WebSocket |
| Analytics | Gráficos de linha e área |
| Tema | Claro/Escuro |

---

## Configuração Inicial

### Passo 1: Configurar Supabase

1. Criar projeto em [supabase.com](https://supabase.com)
2. Executar as migrations SQL (em `/supabase/migrations/`)
3. Configurar variáveis de ambiente:
   - `STELLAR_SECRET_KEY`
   - `STELLAR_PUBLIC_KEY`
   - `STELLAR_NETWORK` (testnet ou mainnet)
4. Deploy das Edge Functions:
   ```bash
   supabase functions deploy oracle
   supabase functions deploy get-readings
   ```

### Passo 2: Configurar ESP32

1. Copiar `firmware/include/config.example.h` para `config.h`
2. Preencher credenciais:
   ```cpp
   #define WIFI_SSID     "sua-rede"
   #define WIFI_PASSWORD "sua-senha"
   #define SUPABASE_URL      "https://seu-projeto.supabase.co/functions/v1"
   #define SUPABASE_ANON_KEY "sua-anon-key"
   ```
3. Upload do firmware:
   ```bash
   cd firmware
   pio run -t upload
   ```
4. Copiar a chave pública exibida no Serial Monitor

### Passo 3: Registrar Dispositivo

Inserir o dispositivo na tabela `devices` do Supabase:

```sql
INSERT INTO devices (device_id, public_key, name, location, active)
VALUES (
  'esp32-farm-001',
  '-----BEGIN PUBLIC KEY-----\nMFkwEwYH...\n-----END PUBLIC KEY-----',
  'Sensor Principal',
  'Campo A - Zona Norte',
  true
);
```

### Passo 4: Configurar Dashboard

1. Copiar `dashboard/.env.example` para `.env`
2. Preencher:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key
   ```
3. Iniciar:
   ```bash
   cd dashboard
   npm install
   npm run dev
   ```
4. Acessar `http://localhost:3000`

---

## Operação

### Fluxo de Dados

1. **ESP32 lê sensores** a cada 15 segundos
2. **Computa Proof of Work** (SHA256 com dificuldade 3)
3. **Assina com ECDSA** usando chave privada do NVS
4. **Envia para Oracle** via HTTPS com headers de autenticação
5. **Oracle valida** PoW, assinatura e timestamp (anti-replay 5min)
6. **Salva no PostgreSQL** com status `pending`
7. **Retorna 202 Accepted** imediatamente
8. **Processa Stellar em background** e atualiza status

### Headers de Autenticação

| Header | Descrição |
|--------|-----------|
| `X-Device-ID` | Identificador do dispositivo |
| `X-Timestamp` | Unix timestamp (para anti-replay) |
| `X-PoW-Data` | String serializada dos dados |
| `X-PoW-Nonce` | Nonce que resolve o PoW |
| `X-PoW-Hash` | Hash SHA256 (começa com "000") |
| `X-Signature` | Assinatura ECDSA (base64) |

### Status Blockchain

| Status | Descrição |
|--------|-----------|
| `pending` | Aguardando processamento |
| `confirmed` | Registrado na Stellar com sucesso |
| `failed` | Falha no registro (ver campo `blockchain_error`) |

---

## Dashboard

### Página Principal

- Lista de dispositivos com status (online/offline)
- Últimas leituras em tempo real
- Indicador de conexão Realtime
- Link para Stellar Explorer por transação

### Analytics

- Gráficos de linha para séries temporais
- Gráficos de área para visualização de tendências
- Cards de estatísticas (min, max, média)
- Filtro por dispositivo e período

---

## API REST

### Recuperar Leituras

```bash
# Todas as leituras (últimas 100)
curl 'https://SEU-PROJETO.supabase.co/functions/v1/get-readings' \
  -H 'Authorization: Bearer SUA-ANON-KEY'

# Filtrar por device
curl 'https://SEU-PROJETO.supabase.co/functions/v1/get-readings?device_id=esp32-farm-001'

# Com paginação
curl 'https://SEU-PROJETO.supabase.co/functions/v1/get-readings?limit=10&offset=0'

# Por período
curl 'https://SEU-PROJETO.supabase.co/functions/v1/get-readings?start_date=2026-01-01&end_date=2026-01-31'
```

### Resposta

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
      "normalized_hash": "sha256...",
      "blockchain_tx_hash": "stellar-tx...",
      "blockchain_status": "confirmed",
      "created_at": "2026-01-23T10:30:00Z"
    }
  ]
}
```

---

## Verificação de Autenticidade

Para verificar que uma leitura foi registrada na blockchain:

1. Obtenha o `blockchain_tx_hash` da leitura
2. Acesse o Stellar Explorer:
   - **Testnet:** `https://stellar.expert/explorer/testnet/tx/TX_HASH`
   - **Mainnet:** `https://stellar.expert/explorer/public/tx/TX_HASH`
3. Verifique a operação `ManageData` com a chave `r_{timestamp}`

---

## Manutenção

### ESP32

| Tarefa | Frequência |
|--------|------------|
| Verificar conexão WiFi | Automático |
| Limpar painel solar (se houver) | Trimestral |
| Verificar bateria | Mensal |

### Sistema

| Tarefa | Frequência |
|--------|------------|
| Monitorar uptime do Oracle | Semanal |
| Verificar taxa de sucesso blockchain | Semanal |
| Backup do banco de dados | Automático (Supabase) |

---

## Troubleshooting

### ESP32 não envia dados

1. Verificar conexão WiFi (LED piscando lento = conectando)
2. Verificar credenciais em `config.h`
3. Verificar Serial Monitor para logs de erro

### Leituras com status `failed`

1. Verificar configuração Stellar (secret key, network)
2. Verificar saldo da conta Stellar (mainnet requer XLM)
3. Consultar campo `blockchain_error` no banco

### Dashboard não atualiza

1. Verificar conexão com Supabase (indicador de conexão)
2. Verificar se Realtime está habilitado na tabela `readings`
3. Verificar console do navegador para erros

---

## Custos Operacionais

### Supabase

| Plano | Custo | Limite |
|-------|-------|--------|
| Free | $0/mês | 500MB DB, 2GB transfer |
| Pro | $25/mês | 8GB DB, 250GB transfer |

### Stellar

| Rede | Custo por TX |
|------|--------------|
| Testnet | $0 (ilimitado) |
| Mainnet | ~$0.00001 |

**Estimativa mensal (1 dispositivo, 15s intervalo):**
- ~172.800 leituras/mês
- Stellar Mainnet: ~$1.73/mês
- Supabase: Free tier (suficiente)

---

## Suporte

- **Documentação técnica:** `docs/architecture.md`
- **Requisitos do produto:** `docs/prd-harvestshield.md`
- **Hardware fase 2:** `docs/phase-2-hardware.md`

---

_HarvestShield v1.0 | Manual atualizado em 2026-01-23_
