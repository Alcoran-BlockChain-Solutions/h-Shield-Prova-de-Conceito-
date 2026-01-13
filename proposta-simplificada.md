# PROPOSTA TÉCNICA

## Sistema de Monitoramento Agrícola com Blockchain
### Prova de Conceito - Escopo Simplificado

**Lucas Oliveira - OLIVEIRA CONSULTORIA ESPECIALIZADA LTDA**

Janeiro 2026

---

## 1. Sumário Executivo

Este documento apresenta a proposta técnica para desenvolvimento de uma **prova de conceito simplificada** para um sistema de monitoramento climático agrícola com registro imutável em blockchain.

O sistema consiste em três componentes principais:

1. **ESP32 Simulador**: dispositivo que gera dados climáticos simulados e os transmite via WiFi para o oráculo.
2. **Oráculo (Supabase)**: recebe os dados, normaliza, armazena no banco de dados e registra na blockchain.
3. **API GraphQL**: disponibiliza os dados armazenados para consulta externa.

### 1.1 Objetivos do MVP

- Simular dados climáticos: temperatura, umidade, pressão e luminosidade
- Transmitir dados simulados para o oráculo via HTTP/HTTPS
- Normalizar e armazenar dados no PostgreSQL
- Registrar dados de forma imutável na blockchain Stellar
- Disponibilizar dados via API GraphQL

---

## 2. Arquitetura do Sistema

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

---

## 3. Componentes do Sistema

### 3.1 ESP32 Simulador

O ESP32 será programado para gerar dados realistas simulados, sem sensores físicos.

| Dado Simulado | Faixa de Valores | Variação |
|---------------|------------------|----------|
| Temperatura | 15°C a 35°C | ±2°C/hora |
| Umidade do Ar | 40% a 90% | ±5%/hora |
| Luminosidade | 0 a 65.000 Lux | Ciclo diurno |
| Umidade do Solo | 20% a 80% | ±3%/hora |

**Funcionalidades:**
- Geração de dados pseudo-aleatórios com variação realista
- Conexão WiFi para envio dos dados
- Cliente HTTPS para comunicação segura com o oráculo
- Intervalo configurável de envio

### 3.2 Oráculo (Supabase Edge Functions)

| Função | Descrição |
|--------|-----------|
| Recepção | Endpoint HTTP para receber dados do ESP32 |
| Validação | Verificar formato e ranges dos dados |
| Normalização | Padronizar unidades e formatos |
| Persistência DB | Salvar no PostgreSQL para acesso rápido |
| Registro Blockchain | Gravar hash dos dados na Stellar |

### 3.3 API GraphQL

Utilizando `pg_graphql` nativo do Supabase para expor os dados.

---

## 4. Stack Tecnológico

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| Simulador | ESP32 + Arduino/C++ | Hardware disponível, WiFi integrado |
| Database | PostgreSQL (Supabase) | Gerenciado, RLS, GraphQL nativo |
| API | pg_graphql (Supabase) | Zero config, performance |
| Backend | Edge Functions (Deno) | Serverless, TypeScript |
| Blockchain | Stellar Testnet | Baixo custo, Manage Data |

---

## 5. Cronograma de Desenvolvimento

**Prazo Total: 3-4 semanas**

### Semanas 1-2: Desenvolvimento Core

| Tarefa | Entregável |
|--------|------------|
| Setup Supabase + Stellar Testnet | Projeto configurado |
| Schema PostgreSQL + RLS | Tabelas prontas |
| Edge Function (oráculo) | Recepção + validação + blockchain |
| Firmware ESP32 simulador | Dados simulados + envio HTTP |
| API GraphQL configurada | Queries funcionais |

### Semana 3: Integração e Testes

| Tarefa | Entregável |
|--------|------------|
| Integração ESP32 <-> Oráculo | Fluxo completo funcionando |
| Testes E2E | Pipeline validado |
| Documentação técnica | README + API docs |
| Deploy produção | MVP funcional |

### Semana 4: Ajustes Finais (se necessário)

| Tarefa | Entregável |
|--------|------------|
| Correções de bugs | Sistema estável |
| Otimizações | Performance ajustada |
| Ajustes solicitados | Refinamentos |

---

## 6. Investimento

### 6.1 Escopo Incluso

| Item | Incluso |
|------|---------|
| Firmware ESP32 (simulador de dados) | SIM |
| Backend Supabase + Edge Functions | SIM |
| Integração Stellar (Manage Data) | SIM |
| API GraphQL configurada | SIM |
| Testes e documentação | SIM |
| Deploy e configuração | SIM |

### 6.2 Escopo Não Incluso

| Item | Observação |
|------|------------|
| Sensores físicos | Dados serão simulados |
| Hardware (ESP32) | Cliente fornece |
| Sistema de energia solar | Não aplicável |
| Comunicação LoRa | Não aplicável |

### 6.3 Valor Total

| Item | Valor |
|------|-------|
| **Serviço de Desenvolvimento** | **R$ 4.950,00** |
| Prazo de entrega | 3-4 semanas |

### 6.4 Forma de Pagamento

| Condição | Valor |
|----------|-------|
| 100% à vista | R$ 4.950,00 |
| 50% início + 50% entrega | R$ 2.475,00 + R$ 2.475,00 |

---

## 7. Entregáveis do MVP

| # | Entregável | Formato |
|---|------------|---------|
| 1 | Firmware ESP32 (simulador) | Código C++ + Github |
| 2 | Backend Supabase configurado | Edge Functions + Github |
| 3 | Integração Stellar | TypeScript + Github |
| 4 | API GraphQL | Configuração Supabase |
| 5 | Documentação técnica | README + API Docs |
| 6 | Testes | Unit + Integration |

---

## 8. Próximos Passos

1. **Validar proposta** - Revisar escopo e ajustar se necessário
2. **Aprovar orçamento** - Efetuar pagamento (integral ou 1ª parcela)
3. **Iniciar desenvolvimento** - Kick-off do projeto

---

**Lucas Bispo de Oliveira**
OLIVEIRA CONSULTORIA ESPECIALIZADA LTDA - 63.097.261/0001-91
Data: _____ / Jan / 2026

_____________________________________
