---
stepsCompleted: [1]
workflowType: 'party-mode'
user_name: 'Olivmath'
date: '2026-01-13'
project_name: 'HarvestShield'
session_topic: 'Sistema de Monitoramento Agrícola com Blockchain'
session_goals:
  - Desenhar arquitetura detalhada
  - Definir priorização de desenvolvimento
  - Implementar MVP completo
context_file: 'proposta-simplificada.md'
priority_order:
  - 1. Serviço no Supabase (Edge Functions + PostgreSQL)
  - 2. Integração com Stellar (Testnet)
  - 3. Serviço de normalização dos dados
  - 4. Serviço de GraphQL (pg_graphql)
  - 5. Desenvolvimento da firmware (ESP32)
  - 6. Integração IoT com Supabase e Stellar
---

# HarvestShield - Sessão de Desenvolvimento

## Visão Geral do Projeto

**Objetivo:** Prova de conceito para sistema de monitoramento climático agrícola com registro imutável em blockchain.

### Componentes Principais

1. **ESP32 Simulador** - Gera dados climáticos simulados (temperatura, umidade, pressão, luminosidade)
2. **Oráculo (Supabase)** - Recebe, normaliza, armazena e registra na blockchain
3. **API GraphQL** - Disponibiliza dados para consulta externa

## Arquitetura do Sistema

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

## Priorização de Desenvolvimento

| Ordem | Componente | Status | Descrição |
|-------|------------|--------|-----------|
| 1 | Supabase Service | ⏳ Pendente | Edge Functions + PostgreSQL schema |
| 2 | Stellar Integration | ⏳ Pendente | Testnet + Manage Data |
| 3 | Data Normalization | ⏳ Pendente | Validação + padronização |
| 4 | GraphQL API | ⏳ Pendente | pg_graphql configuration |
| 5 | ESP32 Firmware | ⏳ Pendente | Simulador de dados |
| 6 | IoT Integration | ⏳ Pendente | ESP32 <-> Supabase <-> Stellar |

## Stack Tecnológico

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| Simulador | ESP32 + Arduino/C++ | Hardware disponível, WiFi integrado |
| Database | PostgreSQL (Supabase) | Gerenciado, RLS, GraphQL nativo |
| API | pg_graphql (Supabase) | Zero config, performance |
| Backend | Edge Functions (Deno) | Serverless, TypeScript |
| Blockchain | Stellar Testnet | Baixo custo, Manage Data |

## Dados Simulados

| Dado | Faixa de Valores | Variação |
|------|------------------|----------|
| Temperatura | 15°C a 35°C | ±2°C/hora |
| Umidade do Ar | 40% a 90% | ±5%/hora |
| Luminosidade | 0 a 65.000 Lux | Ciclo diurno |
| Umidade do Solo | 20% a 80% | ±3%/hora |

## Próximos Passos

- [ ] Setup Supabase project
- [ ] Criar schema PostgreSQL
- [ ] Configurar Edge Functions
- [ ] Integrar Stellar Testnet
- [ ] Implementar normalização
- [ ] Configurar pg_graphql
- [ ] Desenvolver firmware ESP32
- [ ] Testar integração E2E

---

_Sessão salva em 2026-01-13 | BMAD Framework_
