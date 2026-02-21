# Dashboard v2 — Design Document
**Date:** 2026-02-21
**Status:** Approved

## Overview
Redesign completo do dashboard HarvestShield com identidade visual enterprise AgriTech IoT. Dark theme permanente, paleta verde floresta + âmbar dourado, glassmorphism sutil, navegação por tabs.

## Design System

### Paleta
```
--bg:         #0a1f0e   (verde floresta profundo)
--surface:    #112a16   (cartões e painéis)
--surface-2:  #1a3d22   (hover / nested)
--primary:    #22c55e   (verde vivo)
--accent:     #f59e0b   (âmbar dourado)
--danger:     #ef4444
--text:       #e2e8f0
--text-muted: #6b9e7a
--border:     rgba(34,197,94,0.15)
```

### Tipografia
- Font: Inter (Google Fonts)
- Monospace: JetBrains Mono (hashes, IDs)

### Cards
- `background: var(--surface)`
- `border: 1px solid var(--border)`
- `border-radius: 12px`
- `backdrop-filter: blur(8px)`
- Glow no hover: `box-shadow: 0 0 20px rgba(34,197,94,0.15)`

## Layout

### Topbar (fixa, 2 linhas)
- Linha 1: Logo + "HarvestShield" | status de conexão + sino + nome da fazenda
- Linha 2: Tabs — Visão Geral · Analytics · Dispositivos · Blockchain

### Aba 1 — Visão Geral
1. KPI strip (4 cards horizontais): Temperatura, Umidade Ar, Umidade Solo, Luminosidade — valor grande + tendência
2. Grid 2 colunas:
   - Esquerda (350px fixo): lista de dispositivos com status badge, localização, última leitura relativa
   - Direita (flex): feed de leituras realtime com animação slideIn, badge Stellar por leitura

### Aba 2 — Analytics (restyled)
- Stat cards com borda âmbar
- Seletor de período (1h · 6h · 24h · 7d · 30d · Total)
- Gráficos Recharts com cores da paleta e fundo transparente

### Aba 3 — Dispositivos (nova)
- Grid de cards com: device_id (monospace), nome, localização, chave pública truncada, status badge, total_readings, last_seen_at

### Aba 4 — Blockchain (nova)
- KPI no topo: % TX confirmadas, total TXs, falhas
- Tabela/lista de readings com colunas: device, timestamp, hash (truncado + clicável), status pill

## Implementação

### Arquivos a modificar
- `src/styles/globals.css` — novo design system completo
- `src/components/Layout.tsx` — topbar 2 linhas + tabs
- `src/pages/Dashboard.tsx` — KPI strip + grid 2 colunas

### Arquivos a criar
- `src/pages/Devices.tsx` — nova aba Dispositivos
- `src/pages/Blockchain.tsx` — nova aba Blockchain

### Sem novas dependências
Usar Recharts (já instalado), CSS puro, sem Tailwind.
