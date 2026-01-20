# PRD - HarvestShield

## Product Requirements Document
**Sistema de Monitoramento Agrícola com Blockchain**

| Campo | Valor |
|-------|-------|
| Versão | 2.0 |
| Data | 2026-01-20 |
| Autor | Lucas Oliveira (Olivmath) |
| Status | MVP Completo |

---

## 1. Visão Geral do Produto

### 1.1 Problema

Produtores agrícolas precisam de dados climáticos confiáveis e auditáveis para:
- Tomada de decisão sobre irrigação e manejo
- Comprovação de condições climáticas para seguros agrícolas
- Rastreabilidade e compliance com certificações

**Dor principal:** Dados climáticos podem ser manipulados, não há garantia de imutabilidade e autenticidade.

### 1.2 Solução

Sistema de monitoramento climático que:
- Coleta dados de sensores IoT (temperatura, umidade, luminosidade)
- Registra dados de forma imutável em blockchain (Stellar)
- Disponibiliza dados via API para consulta e integração

### 1.3 Proposta de Valor

> "Dados climáticos agrícolas verificáveis e imutáveis, registrados em blockchain."

---

## 2. Escopo do MVP

### 2.1 Incluso no MVP

| Funcionalidade | Descrição | Prioridade |
|----------------|-----------|------------|
| Simulação de dados | ESP32 gerando dados climáticos realistas | P1 |
| Recepção de dados | Endpoint HTTP para receber dados do dispositivo | P1 |
| Validação | Verificar formato e ranges dos dados | P1 |
| Normalização | Padronizar unidades e formatos | P1 |
| Persistência | Armazenar no PostgreSQL | P1 |
| Registro Blockchain | Gravar hash dos dados na Stellar Testnet | P1 |
| API GraphQL | Expor dados para consulta | P1 |

### 2.2 Fora do Escopo (MVP)

| Item | Motivo |
|------|--------|
| Sensores físicos | Dados serão simulados |
| Sistema de energia solar | Não aplicável para PoC |
| Comunicação LoRa | WiFi é suficiente para PoC |
| Alertas e notificações | Versão futura |
| Multi-tenancy | Versão futura |

---

## 3. Requisitos Funcionais

### RF01 - Geração de Dados Simulados

**Descrição:** O ESP32 deve gerar dados climáticos simulados com variação realista.

**Critérios de Aceite:**
- [ ] Temperatura varia entre 15°C e 35°C (±2°C/hora)
- [ ] Umidade do ar varia entre 40% e 90% (±5%/hora)
- [ ] Luminosidade segue ciclo diurno (0 a 65.000 Lux)
- [ ] Umidade do solo varia entre 20% e 80% (±3%/hora)
- [ ] Dados enviados em intervalo configurável (default: 60s)

### RF02 - Recepção e Validação de Dados

**Descrição:** O oráculo deve receber dados via HTTPS e validar formato/ranges.

**Critérios de Aceite:**
- [ ] Endpoint aceita POST com JSON
- [ ] Valida presença de campos obrigatórios (device_id, pelo menos 1 métrica)
- [ ] Valida ranges de valores (rejeita dados fora dos limites físicos)
- [ ] Retorna erro 400 para dados inválidos com mensagem descritiva
- [ ] Retorna 202 Accepted para dados válidos (processamento blockchain assíncrono)

### RF03 - Normalização de Dados

**Descrição:** Dados validados devem ser normalizados antes do armazenamento.

**Critérios de Aceite:**
- [ ] device_id convertido para lowercase e trimmed
- [ ] Temperatura com 2 casas decimais
- [ ] Umidades com 2 casas decimais
- [ ] Luminosidade arredondada para inteiro
- [ ] Timestamp em Unix epoch (ms)
- [ ] Hash SHA256 gerado dos dados normalizados

### RF04 - Persistência no PostgreSQL

**Descrição:** Dados normalizados devem ser armazenados no banco de dados.

**Critérios de Aceite:**
- [ ] Tabela `readings` criada com schema definido
- [ ] Dados inseridos com UUID gerado automaticamente
- [ ] Campos `created_at` e `normalized_at` preenchidos
- [ ] Índices criados para consultas frequentes
- [ ] RLS configurado para acesso público de leitura

### RF05 - Registro na Blockchain Stellar

**Descrição:** Hash dos dados deve ser registrado na Stellar Testnet.

**Critérios de Aceite:**
- [ ] Conexão com Stellar Testnet estabelecida
- [ ] Operação ManageData executada com sucesso
- [ ] Key no formato `reading_{timestamp}`
- [ ] Value contém hash SHA256 dos dados
- [ ] Transaction hash salvo no banco de dados
- [ ] Status da transação atualizado (pending -> confirmed)

### RF06 - API GraphQL

**Descrição:** Dados devem ser expostos via API GraphQL.

**Critérios de Aceite:**
- [ ] Endpoint GraphQL acessível
- [ ] Query para listar leituras com paginação
- [ ] Query para filtrar por device_id
- [ ] Query para filtrar por período
- [ ] Query para verificar transação blockchain
- [ ] Ordenação por data (desc por padrão)

### RF07 - Configuração de Rede Stellar (Mainnet/Testnet)

**Descrição:** O sistema deve suportar alternância entre Stellar Testnet e Mainnet via variável de ambiente.

**Critérios de Aceite:**
- [ ] Variável de ambiente `STELLAR_NETWORK` definida (`testnet` | `mainnet`)
- [ ] Oráculo seleciona automaticamente a network passphrase correta
- [ ] Oráculo seleciona automaticamente o Horizon URL correto
- [ ] Logs indicam claramente qual rede está sendo utilizada
- [ ] Validação impede inicialização com valor inválido
- [ ] Documentação atualizada com instruções de configuração

**Valores:**

| STELLAR_NETWORK | Horizon URL | Network Passphrase |
|-----------------|-------------|-------------------|
| `testnet` | https://horizon-testnet.stellar.org | Test SDF Network ; September 2015 |
| `mainnet` | https://horizon.stellar.org | Public Global Stellar Network ; September 2015 |

### RF08 - Autenticação Segura de Dispositivos IoT (ECDSA)

**Descrição:** O sistema deve autenticar dispositivos IoT de forma segura usando criptografia assimétrica (ECDSA P-256) para prevenir envio de dados falsos ou não autorizados.

**Critérios de Aceite:**
- [x] Cada dispositivo possui um par de chaves ECDSA P-256 (pública/privada)
- [x] Requisições incluem assinatura ECDSA do hash SHA-256 do payload
- [x] Oráculo valida assinatura usando a chave pública registrada
- [x] Tabela `devices` criada para registro de dispositivos autorizados
- [ ] Endpoint de provisionamento para registrar novos dispositivos
- [x] Requisições com assinatura inválida retornam 401 Unauthorized
- [ ] Rate limiting por device_id para prevenir abuso
- [x] Logs de tentativas de autenticação (sucesso/falha)

**Headers de Autenticação:**
- `X-Device-ID`: Identificador do dispositivo
- `X-Signature`: Assinatura ECDSA (DER format, base64)
- `X-Data-Hash`: Hash SHA-256 do payload
- `X-Timestamp`: Timestamp Unix (opcional, para anti-replay)

**Fluxo de Autenticação:**

```
┌─────────────┐                              ┌─────────────┐
│   ESP32     │                              │   Oráculo   │
│             │                              │             │
│ 1. Gera payload JSON                       │             │
│ 2. Calcula SHA-256(payload)                │             │
│ 3. Assina hash com chave privada ECDSA     │             │
│ 4. Envia: payload + signature + hash       │             │
│ ──────────────────────────────────────────>│             │
│             │                              │ 5. Busca public_key do device_id
│             │                              │ 6. Verifica assinatura ECDSA
│             │                              │ 7. Compara hashes
│             │                              │ 8. Se OK: processa
│             │                              │    Se FAIL: 401
│ <──────────────────────────────────────────│             │
└─────────────┘                              └─────────────┘
```

**Schema:**

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

### RF09 - Dashboard de Visualização (IMPLEMENTADO)

**Descrição:** Dashboard React completo para visualização de leituras com charts e analytics.

**Status:** ✅ Implementado

**Critérios de Aceite:**
- [x] Dashboard React + Vite + TypeScript (`/dashboard/`)
- [x] Filtro por device_id (DeviceCard selection)
- [x] Visualização de leituras em tempo real
- [x] Paginação (50 itens por página)
- [x] Indicador de status blockchain (pending/confirmed/failed) - BlockchainStatus.tsx
- [x] Link para Stellar Explorer para cada transação - TransactionLink.tsx
- [x] Página de Analytics com charts (SensorLineChart, SensorAreaChart)
- [x] Theme toggle (dark/light mode) - ThemeContext.tsx

**Stack Implementada:**
- React 18 + Vite + TypeScript
- Supabase JS Client
- Recharts para gráficos
- 12 componentes, 4 hooks customizados

### RF10 - Realtime Subscriptions (IMPLEMENTADO)

**Descrição:** Dashboard atualiza automaticamente quando novos dados são inseridos.

**Status:** ✅ Implementado

**Critérios de Aceite:**
- [x] Tabela `readings` com Realtime habilitado via `supabase_realtime` publication
- [x] Dashboard subscreve a eventos INSERT na tabela readings
- [x] Dashboard subscreve a eventos UPDATE (blockchain status changes)
- [x] Novos registros aparecem automaticamente (sem refresh manual)
- [x] Indicador visual de conexão realtime - ConnectionStatus.tsx

**Código Implementado (useReadings.ts):**
```typescript
// Subscribe to new readings
const insertChannel = supabase
  .channel('readings-inserts')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'readings' },
    (payload) => prependReading(payload.new as Reading)
  )
  .subscribe();

// Subscribe to reading updates (blockchain status changes)
const updateChannel = supabase
  .channel('readings-updates')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'readings' },
    (payload) => updateReadingStatus(payload.new as Reading)
  )
  .subscribe();
```

### RF11 - Oracle Assíncrono (IMPLEMENTADO)

**Descrição:** Oracle retorna 202 Accepted imediatamente após validação, processando blockchain em background.

**Status:** ✅ Implementado

**Problema Resolvido:**
- Oracle anteriormente levava ~3 segundos (82% era Stellar TX)
- IoT ficava bloqueado esperando resposta

**Solução Implementada:**
```
ANTES: IoT -> [ECDSA] -> [DB] -> [Stellar 2.6s] -> 201 (3s total)
AGORA: IoT -> [ECDSA] -> [DB pending] -> 202 (400ms)
                              |
                              +--[Background]--> [Stellar] -> [DB update]
```

**Critérios de Aceite:**
- [x] Retorna 202 Accepted em < 500ms após validação
- [x] Salva reading com `blockchain_status: 'pending'`
- [x] Processa Stellar TX em background via `EdgeRuntime.waitUntil()`
- [x] Atualiza status para `confirmed` ou `failed` após processamento
- [x] Coluna `blockchain_error` para registrar erros (migration 003)
- [x] Retry logic com exponential backoff para Stellar TX

**Código Implementado (oracle/index.ts):**
```typescript
// Retorna 202 após validação
const response = new Response(
  JSON.stringify({ success: true, status: 'accepted', reading_id }),
  { status: 202 }
);

// Processa Stellar em background
EdgeRuntime.waitUntil(processBlockchainInBackground(readingId, dataHash));

return response;
```

---

## 4. Requisitos Não-Funcionais

### RNF01 - Performance

| Métrica | Target Atual | Target Planejado (RF11) |
|---------|--------------|-------------------------|
| Latência do endpoint Oracle | < 2s (incluindo blockchain) | < 500ms (202 Accepted) |
| Processamento Blockchain | Síncrono (~2.6s) | Background (< 5s) |
| Throughput | 1 req/min por dispositivo | 1 req/min por dispositivo |
| Disponibilidade | 99% (Supabase SLA) | 99% (Supabase SLA) |

### RNF02 - Segurança

| Requisito | Implementação |
|-----------|---------------|
| Comunicação | HTTPS obrigatório |
| Autenticação | API Key (Supabase anon key) |
| Autorização | RLS no PostgreSQL |
| Secrets | Variáveis de ambiente |

### RNF03 - Escalabilidade

| Aspecto | Consideração |
|---------|--------------|
| Dispositivos | MVP suporta 1-10 dispositivos |
| Dados | ~1440 leituras/dia/dispositivo |
| Storage | ~50MB/mês estimado |

---

## 5. Arquitetura Técnica

### 5.1 Diagrama de Componentes

```
┌─────────────────┐     HTTPS      ┌─────────────────────────────────┐
│                 │ ─────────────> │           SUPABASE              │
│  ESP32          │                │  ┌─────────┐  ┌──────────────┐  │
│  (Simulador)    │                │  │ Edge    │  │ PostgreSQL   │  │
│                 │                │  │ Function│──│ (dados norm.)│  │
│  Gera dados     │                │  └────┬────┘  └──────────────┘  │
│  simulados      │                │       │                         │
│                 │                │       ▼                         │
└─────────────────┘                │  ┌─────────┐                    │
                                   │  │ Stellar │                    │
        ┌──────────────────────────│  │ Testnet │                    │
        │                          │  └─────────┘                    │
        │                          │                                 │
        ▼                          │  ┌─────────────┐                │
┌─────────────────┐                │  │ GraphQL API │ <──────────────┤
│  Aplicação      │ <──────────────│  │ (pg_graphql)│                │
│  Cliente        │    GraphQL     │  └─────────────┘                │
└─────────────────┘                └─────────────────────────────────┘
```

### 5.2 Stack Tecnológico

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| Simulador | ESP32 + Arduino | PlatformIO |
| Database | PostgreSQL | 15+ (Supabase) |
| Backend | Deno (Edge Functions) | Latest |
| Blockchain | Stellar SDK | 11.x |
| API | pg_graphql | Nativo Supabase |

### 5.3 Estrutura de Dados

**Tabela: readings**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK, auto-generated |
| device_id | VARCHAR(50) | Identificador do dispositivo |
| temperature | DECIMAL(5,2) | Temperatura em Celsius |
| humidity_air | DECIMAL(5,2) | Umidade do ar em % |
| humidity_soil | DECIMAL(5,2) | Umidade do solo em % |
| luminosity | INTEGER | Luminosidade em Lux |
| raw_data | JSONB | Dados brutos recebidos |
| normalized_at | TIMESTAMPTZ | Data/hora da normalização |
| blockchain_tx_hash | VARCHAR(64) | Hash da transação Stellar |
| blockchain_status | VARCHAR(20) | Status: pending/confirmed/failed |
| created_at | TIMESTAMPTZ | Data/hora de criação |

---

## 6. Fluxo de Dados

### 6.1 Fluxo Principal (Happy Path)

```
1. ESP32 gera dados simulados
2. ESP32 envia POST HTTPS para Oracle
3. Oracle valida formato e ranges
4. Oracle normaliza dados
5. Oracle gera hash SHA256
6. Oracle insere no PostgreSQL (status: pending)
7. Oracle registra hash na Stellar
8. Oracle atualiza status para confirmed
9. Oracle retorna sucesso com tx_hash
10. Cliente consulta via GraphQL
```

### 6.2 Fluxo de Erro

```
1. Dados inválidos -> 400 Bad Request + mensagem de erro
2. Falha no DB -> 500 + retry interno
3. Falha na Stellar -> Salva no DB com status: failed + retry queue
```

---

## 7. Casos de Uso

### UC01 - Enviar Leitura

| Campo | Valor |
|-------|-------|
| Ator | ESP32 (Dispositivo IoT) |
| Pré-condição | Dispositivo conectado à WiFi |
| Fluxo Principal | 1. Gera dados → 2. Envia HTTP → 3. Recebe confirmação |
| Pós-condição | Dados salvos no DB e blockchain |

### UC02 - Consultar Leituras

| Campo | Valor |
|-------|-------|
| Ator | Aplicação Cliente |
| Pré-condição | API GraphQL disponível |
| Fluxo Principal | 1. Envia query → 2. Recebe dados paginados |
| Pós-condição | Dados exibidos para o usuário |

### UC03 - Verificar Autenticidade

| Campo | Valor |
|-------|-------|
| Ator | Auditor/Cliente |
| Pré-condição | Possui tx_hash do registro |
| Fluxo Principal | 1. Consulta leitura → 2. Obtém hash → 3. Verifica na Stellar |
| Pós-condição | Prova de autenticidade confirmada |

---

## 8. Plano de Desenvolvimento

### 8.1 Priorização

| Ordem | Componente | Estimativa | Dependência |
|-------|------------|------------|-------------|
| 1 | Supabase Service | - | - |
| 2 | Stellar Integration | - | #1 |
| 3 | Normalização | - | #1 |
| 4 | GraphQL API | - | #1 |
| 5 | ESP32 Firmware | - | #1-4 |
| 6 | Integração E2E | - | #1-5 |

### 8.2 Entregáveis

| # | Entregável | Formato |
|---|------------|---------|
| 1 | Firmware ESP32 (simulador) | Código C++ + GitHub |
| 2 | Backend Supabase | Edge Functions + GitHub |
| 3 | Integração Stellar | TypeScript + GitHub |
| 4 | API GraphQL | Configuração Supabase |
| 5 | Documentação técnica | README + API Docs |
| 6 | Testes | Unit + Integration |

---

## 9. Critérios de Sucesso

### 9.1 MVP Completo Quando:

- [x] ESP32 enviando dados a cada 60 segundos
- [x] Dados validados e normalizados corretamente
- [x] Hash registrado na Stellar Testnet
- [x] Dados consultáveis via API REST
- [x] Transação verificável no Stellar Explorer
- [x] Documentação completa
- [x] Configuração Mainnet/Testnet via ENV VAR funcionando
- [x] Autenticação IoT com ECDSA P-256 implementada
- [x] Tabela de dispositivos provisionados criada

### 9.2 Funcionalidades Implementadas:

- [x] Oracle assíncrono com resposta 202 (RF11)
- [x] Dashboard de visualização React (RF09)
- [x] Realtime subscriptions (RF10)

### 9.3 Próxima Fase (Phase 2 - Hardware):

- [ ] Implementação de hardware físico com sensores reais
- [ ] Comunicação LoRaWAN para dispositivos de campo
- [ ] Gateway central na sede da fazenda
- [ ] Ver documento: `docs/phase-2-hardware.md`

### 9.3 Métricas de Validação

| Métrica | Target | Como Medir |
|---------|--------|------------|
| Uptime Oracle | 99%+ | Logs Supabase |
| Taxa de sucesso blockchain | 95%+ | Status no DB |
| Latência média | < 2s | Timestamps |

---

## 10. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Rate limit Stellar Testnet | Média | Alto | Implementar queue com retry |
| Latência Edge Functions | Baixa | Médio | Otimizar código, async operations |
| Conectividade ESP32 | Média | Médio | Buffer local + retry |

---

## 11. Glossário

| Termo | Definição |
|-------|-----------|
| Oráculo | Serviço intermediário entre mundo físico e blockchain |
| ManageData | Operação Stellar para armazenar dados key-value |
| RLS | Row Level Security - controle de acesso por linha |
| Edge Function | Função serverless executada próxima ao usuário |

---

## 12. Referências

- [Stellar Developers](https://developers.stellar.org/)
- [Supabase Docs](https://supabase.com/docs)
- [ESP32 Arduino](https://docs.espressif.com/projects/arduino-esp32/)

---

_Documento gerado via BMAD Framework | Atualizado: 2026-01-20 | MVP 100% Completo_
