# Dashboard v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign completo do dashboard HarvestShield com visual enterprise AgriTech IoT — dark theme permanente, paleta verde floresta + âmbar, topbar + 4 tabs, 2 novas páginas.

**Architecture:** Reusa toda a lógica de hooks/dados existente, substitui apenas camada visual (CSS + JSX). Sem novas dependências. 4 abas via React Router: Visão Geral, Analytics, Dispositivos, Blockchain.

**Tech Stack:** React 18, TypeScript, Vite, Recharts, react-router-dom v7, CSS puro (sem Tailwind), Supabase JS.

---

### Task 1: Design System — globals.css

**Files:**
- Modify: `dashboard/src/styles/globals.css` (substituição completa)

**Step 1: Substituir globals.css pelo novo design system**

```css
/* ============================================================
   HARVESTSHIELD v2 — Design System
   Dark theme permanente · Verde floresta + Âmbar dourado
   ============================================================ */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  /* Cores base */
  --bg:          #0a1f0e;
  --surface:     #112a16;
  --surface-2:   #1a3d22;
  --surface-3:   #22502c;
  --primary:     #22c55e;
  --primary-dim: #16a34a;
  --accent:      #f59e0b;
  --accent-dim:  #d97706;
  --danger:      #ef4444;
  --danger-dim:  #dc2626;
  --warning:     #f59e0b;
  --text:        #e2e8f0;
  --text-muted:  #6b9e7a;
  --text-dim:    #4a7a5a;
  --border:      rgba(34, 197, 94, 0.15);
  --border-accent: rgba(245, 158, 11, 0.3);

  /* Sombras */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.5);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.6);
  --glow-primary: 0 0 20px rgba(34, 197, 94, 0.2);
  --glow-accent:  0 0 20px rgba(245, 158, 11, 0.2);

  /* Tipografia */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Espaçamento */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px;
  --sp-4: 16px; --sp-5: 20px; --sp-6: 24px;
  --sp-8: 32px; --sp-10: 40px; --sp-12: 48px;

  /* Raios */
  --r-sm: 6px; --r-md: 10px; --r-lg: 14px; --r-xl: 20px;

  /* Topbar */
  --topbar-h1: 52px;
  --topbar-h2: 44px;
  --topbar-total: 96px;
}

/* ── Base ────────────────────────────────────────────── */
html { height: 100%; }
body {
  font-family: var(--font-sans);
  background-color: var(--bg);
  color: var(--text);
  line-height: 1.5;
  min-height: 100%;
  -webkit-font-smoothing: antialiased;
}

/* ── Scrollbar customizada ───────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--surface); }
::-webkit-scrollbar-thumb { background: var(--surface-3); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--primary-dim); }

/* ── Layout raiz ─────────────────────────────────────── */
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ── Topbar ──────────────────────────────────────────── */
.topbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.topbar__main {
  display: flex;
  align-items: center;
  height: var(--topbar-h1);
  padding: 0 var(--sp-6);
  gap: var(--sp-4);
}

.topbar__brand {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  text-decoration: none;
}

.topbar__logo {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.topbar__name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.01em;
}

.topbar__name span {
  color: var(--primary);
}

.topbar__spacer { flex: 1; }

.topbar__right {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
}

.topbar__farm {
  font-size: 0.8125rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.topbar__farm-icon {
  font-size: 0.875rem;
}

/* ── Tabs ────────────────────────────────────────────── */
.topbar__tabs {
  display: flex;
  align-items: center;
  height: var(--topbar-h2);
  padding: 0 var(--sp-6);
  gap: var(--sp-1);
  border-top: 1px solid var(--border);
  overflow-x: auto;
}

.topbar__tab {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-4);
  border-radius: var(--r-sm);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.15s, background 0.15s;
  position: relative;
}

.topbar__tab:hover {
  color: var(--text);
  background: var(--surface-2);
}

.topbar__tab--active {
  color: var(--primary);
  background: rgba(34, 197, 94, 0.08);
}

.topbar__tab--active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: var(--sp-4);
  right: var(--sp-4);
  height: 2px;
  background: var(--primary);
  border-radius: 1px;
}

.topbar__tab-icon { font-size: 1rem; }

/* ── Conteúdo principal ──────────────────────────────── */
.layout__content {
  margin-top: var(--topbar-total);
  flex: 1;
  padding: var(--sp-6);
  background: var(--bg);
}

/* ── Card base ───────────────────────────────────────── */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  transition: box-shadow 0.2s;
}
.card:hover { box-shadow: var(--glow-primary); }

/* ── Connection Status ───────────────────────────────── */
.connection-status {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: 0.8125rem;
}
.connection-status__dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.connection-status--connecting .connection-status__dot {
  background: var(--warning);
  animation: pulse 1.2s ease-in-out infinite;
}
.connection-status--connected .connection-status__dot { background: var(--primary); }
.connection-status--disconnected .connection-status__dot { background: var(--danger); }
.connection-status__label { color: var(--text-muted); }
.connection-status--connected .connection-status__label { color: var(--primary); }

@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(245,158,11,0.5); }
  50% { opacity: 0.7; box-shadow: 0 0 0 4px rgba(245,158,11,0); }
}

/* ── KPI Strip ───────────────────────────────────────── */
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-4);
  margin-bottom: var(--sp-6);
}

@media (max-width: 900px) {
  .kpi-strip { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 500px) {
  .kpi-strip { grid-template-columns: 1fr; }
}

.kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: var(--sp-5);
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s;
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--kpi-color, var(--primary));
}

.kpi-card:hover {
  box-shadow: var(--glow-primary);
  transform: translateY(-2px);
}

.kpi-card__icon {
  font-size: 1.5rem;
  margin-bottom: var(--sp-2);
  display: block;
}

.kpi-card__value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
  margin-bottom: var(--sp-1);
}

.kpi-card__unit {
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-muted);
  margin-left: 2px;
}

.kpi-card__label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.kpi-card__glow {
  position: absolute;
  bottom: -20px; right: -20px;
  width: 80px; height: 80px;
  border-radius: 50%;
  background: var(--kpi-color, var(--primary));
  opacity: 0.06;
  filter: blur(20px);
}

/* ── Dashboard Grid ──────────────────────────────────── */
.dashboard-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--sp-4);
  align-items: start;
}

@media (max-width: 900px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}

.dashboard-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
}

.dashboard-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-4) var(--sp-5);
  border-bottom: 1px solid var(--border);
}

.dashboard-panel__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.dashboard-panel__badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 2px var(--sp-2);
  border-radius: 99px;
  background: rgba(34,197,94,0.12);
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.live-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--danger);
  animation: live-pulse 1.5s ease-in-out infinite;
  display: inline-block;
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* ── Device List (no panel) ──────────────────────────── */
.device-list-v2 {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - var(--topbar-total) - 220px);
  overflow-y: auto;
}

.device-item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-5);
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.15s;
}

.device-item:last-child { border-bottom: none; }

.device-item:hover { background: var(--surface-2); }

.device-item--selected {
  background: rgba(34,197,94,0.08);
  border-left: 3px solid var(--primary);
}

.device-item__dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.device-item__dot--online { background: var(--primary); box-shadow: 0 0 6px var(--primary); }
.device-item__dot--offline { background: var(--text-dim); }

.device-item__info { flex: 1; min-width: 0; }

.device-item__name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-item__meta {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.device-item__badge {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 99px;
  flex-shrink: 0;
}
.device-item__badge--online {
  background: rgba(34,197,94,0.12);
  color: var(--primary);
}
.device-item__badge--offline {
  background: rgba(107,158,122,0.1);
  color: var(--text-dim);
}

/* ── Reading Feed ─────────────────────────────────────── */
.reading-feed {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - var(--topbar-total) - 220px);
  overflow-y: auto;
}

.reading-item {
  padding: var(--sp-4) var(--sp-5);
  border-bottom: 1px solid var(--border);
  border-left: 3px solid transparent;
  animation: slide-in 0.35s ease-out;
  transition: background 0.15s;
}

.reading-item:last-child { border-bottom: none; }
.reading-item:hover { background: var(--surface-2); }

@keyframes slide-in {
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.reading-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-2);
}

.reading-item__device {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--primary);
  font-family: var(--font-mono);
}

.reading-item__time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.reading-item__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
  margin-bottom: var(--sp-2);
}

.reading-metric {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8125rem;
  color: var(--text);
}

.reading-metric__icon { font-size: 0.875rem; }
.reading-metric__value { font-weight: 600; }
.reading-metric__unit { color: var(--text-muted); font-size: 0.75rem; }

.reading-item__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

/* ── Blockchain badge ─────────────────────────────────── */
.tx-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 99px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tx-badge--pending  { background: rgba(245,158,11,0.12); color: var(--accent); }
.tx-badge--confirmed { background: rgba(34,197,94,0.12); color: var(--primary); }
.tx-badge--failed   { background: rgba(239,68,68,0.12);  color: var(--danger); }

/* ── Tx Link ─────────────────────────────────────────── */
.tx-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.6875rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  transition: color 0.15s;
}
.tx-link:hover { color: var(--accent); }

/* ── Analytics Page ───────────────────────────────────── */
.analytics-v2 { max-width: 1400px; margin: 0 auto; }

.analytics-v2__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-6);
  flex-wrap: wrap;
  gap: var(--sp-4);
}

.analytics-v2__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
}

.period-selector {
  display: flex;
  gap: 2px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 3px;
}

.period-btn {
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-sm);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  font-family: var(--font-sans);
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

.period-btn:hover { color: var(--text); background: var(--surface-3); }

.period-btn--active {
  background: var(--primary);
  color: #000;
  font-weight: 600;
}

.analytics-v2__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--sp-4);
  margin-bottom: var(--sp-6);
}

.stat-card-v2 {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: var(--sp-5);
  border-left: 3px solid var(--stat-color, var(--primary));
  transition: box-shadow 0.2s, transform 0.2s;
}

.stat-card-v2:hover {
  box-shadow: var(--glow-primary);
  transform: translateY(-2px);
}

.stat-card-v2__icon { font-size: 1.25rem; margin-bottom: var(--sp-2); display: block; }
.stat-card-v2__label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--sp-1); }
.stat-card-v2__value { font-size: 1.75rem; font-weight: 700; color: var(--text); line-height: 1; }
.stat-card-v2__unit  { font-size: 0.875rem; color: var(--text-muted); font-weight: 400; margin-left: 2px; }
.stat-card-v2__sub   { font-size: 0.6875rem; color: var(--text-dim); margin-top: var(--sp-1); }

.analytics-v2__charts {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.analytics-v2__charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-4);
}

@media (max-width: 800px) {
  .analytics-v2__charts-row { grid-template-columns: 1fr; }
}

.chart-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: var(--sp-5);
}

.chart-card__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--sp-4);
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.analytics-v2__footer {
  margin-top: var(--sp-6);
  padding-top: var(--sp-4);
  border-top: 1px solid var(--border);
  text-align: center;
  font-size: 0.8125rem;
  color: var(--text-dim);
}

/* ── Devices Page ────────────────────────────────────── */
.devices-v2 { max-width: 1400px; margin: 0 auto; }

.devices-v2__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-6);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.page-title__count {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 99px;
  padding: 2px 10px;
}

.devices-v2__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--sp-4);
}

.device-card-v2 {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: var(--sp-5);
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
  position: relative;
  overflow: hidden;
}

.device-card-v2::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--device-color, var(--primary));
}

.device-card-v2:hover {
  box-shadow: var(--glow-primary);
  transform: translateY(-2px);
  border-color: rgba(34,197,94,0.3);
}

.device-card-v2__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--sp-4);
}

.device-card-v2__name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
}

.device-card-v2__id {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
  margin-top: 2px;
}

.device-card-v2__rows { display: flex; flex-direction: column; gap: var(--sp-2); }

.device-card-v2__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8125rem;
}

.device-card-v2__row-label { color: var(--text-muted); }
.device-card-v2__row-value { color: var(--text); font-weight: 500; }

.device-card-v2__pubkey {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--text-dim);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: var(--sp-2) var(--sp-3);
  margin-top: var(--sp-4);
  word-break: break-all;
  line-height: 1.6;
}

/* ── Blockchain Page ──────────────────────────────────── */
.blockchain-v2 { max-width: 1400px; margin: 0 auto; }

.blockchain-v2__kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-4);
  margin-bottom: var(--sp-6);
}

@media (max-width: 600px) {
  .blockchain-v2__kpis { grid-template-columns: 1fr; }
}

.bk-kpi {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: var(--sp-5);
  text-align: center;
}

.bk-kpi__value {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: var(--sp-2);
}

.bk-kpi__label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.bk-kpi--confirmed .bk-kpi__value { color: var(--primary); }
.bk-kpi--pending .bk-kpi__value   { color: var(--accent); }
.bk-kpi--failed .bk-kpi__value    { color: var(--danger); }

.blockchain-v2__table-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
}

.blockchain-v2__table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-4) var(--sp-5);
  border-bottom: 1px solid var(--border);
}

.bk-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.bk-table th {
  padding: var(--sp-3) var(--sp-5);
  text-align: left;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
}

.bk-table td {
  padding: var(--sp-3) var(--sp-5);
  border-bottom: 1px solid var(--border);
  color: var(--text);
  vertical-align: middle;
}

.bk-table tr:last-child td { border-bottom: none; }
.bk-table tr:hover td { background: var(--surface-2); }

.bk-table__device {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--primary);
}

.bk-table__hash {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  transition: color 0.15s;
}
.bk-table__hash:hover { color: var(--accent); }

/* ── Modal (Stellar Explorer & Error) ────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-4);
}

.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  width: 100%;
  max-width: 680px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  animation: modal-in 0.2s ease-out;
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.modal--wide { max-width: 1100px; }

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-5);
  border-bottom: 1px solid var(--border);
}

.modal__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.modal__close {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  width: 32px; height: 32px;
  border-radius: var(--r-sm);
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.modal__close:hover { background: var(--surface-3); color: var(--text); }

.modal__body {
  padding: var(--sp-5);
  overflow-y: auto;
  flex: 1;
}

.modal__body pre {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: var(--sp-4);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--danger);
  line-height: 1.6;
}

.modal__iframe-wrap { flex: 1; overflow: hidden; }
.modal__iframe-wrap iframe { width: 100%; height: 100%; border: none; }

.modal__fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--sp-4);
  color: var(--text-muted);
  text-align: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-5);
  background: var(--primary);
  color: #000;
  font-weight: 600;
  font-size: 0.875rem;
  border-radius: var(--r-md);
  text-decoration: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-sans);
  transition: background 0.15s;
}
.btn-primary:hover { background: var(--primary-dim); }

/* ── Utility ──────────────────────────────────────────── */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-12);
  color: var(--text-muted);
  font-size: 0.875rem;
  gap: var(--sp-3);
}

.loading-state::before {
  content: '';
  width: 18px; height: 18px;
  border: 2px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  padding: var(--sp-12);
  text-align: center;
  color: var(--text-dim);
  font-size: 0.875rem;
}

.error-banner {
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: var(--r-md);
  padding: var(--sp-3) var(--sp-4);
  color: var(--danger);
  font-size: 0.875rem;
  margin-bottom: var(--sp-4);
}

@media (max-width: 768px) {
  .layout__content { padding: var(--sp-4); }
  .kpi-strip { gap: var(--sp-3); }
  .topbar__tabs { padding: 0 var(--sp-4); }
}
```

**Step 2: Verificar no browser**
```bash
cd dashboard && npm run dev
```
Esperado: página com fundo `#0a1f0e`, sem erros no console.

**Step 3: Commit**
```bash
git add dashboard/src/styles/globals.css
git commit -m "feat(dashboard-v2): new design system — dark agritech theme"
```

---

### Task 2: Topbar + Tabs (Layout.tsx)

**Files:**
- Modify: `dashboard/src/components/Layout.tsx`

**Step 1: Substituir Layout.tsx**

```tsx
import { NavLink, Outlet } from 'react-router-dom'
import { ConnectionStatus } from './ConnectionStatus'

const TABS = [
  { to: '/',            label: 'Visão Geral', icon: '🌿', end: true },
  { to: '/analytics',  label: 'Analytics',   icon: '📊' },
  { to: '/devices',    label: 'Dispositivos', icon: '🛰️' },
  { to: '/blockchain', label: 'Blockchain',   icon: '⛓️' },
]

export function Layout() {
  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar__main">
          <div className="topbar__brand">
            <div className="topbar__logo">🌱</div>
            <span className="topbar__name">
              Harvest<span>Shield</span>
            </span>
          </div>
          <div className="topbar__spacer" />
          <div className="topbar__right">
            <ConnectionStatus />
            <div className="topbar__farm">
              <span className="topbar__farm-icon">📍</span>
              Fazenda Norte
            </div>
          </div>
        </div>

        <nav className="topbar__tabs">
          {TABS.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `topbar__tab${isActive ? ' topbar__tab--active' : ''}`
              }
            >
              <span className="topbar__tab-icon">{tab.icon}</span>
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  )
}
```

**Step 2: Verificar topbar renderiza com 4 tabs**

Abrir `http://localhost:3000` — confirmar topbar verde escura com logo, connection status, e 4 abas.

**Step 3: Commit**
```bash
git add dashboard/src/components/Layout.tsx
git commit -m "feat(dashboard-v2): topbar with 4 tabs navigation"
```

---

### Task 3: Rotas — App.tsx

**Files:**
- Modify: `dashboard/src/App.tsx`

**Step 1: Adicionar rotas de Dispositivos e Blockchain**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Analytics } from './pages/Analytics'
import { Devices } from './pages/Devices'
import { Blockchain } from './pages/Blockchain'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="devices" element={<Devices />} />
          <Route path="blockchain" element={<Blockchain />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

**Step 2: Criar stubs temporários para não quebrar**

Criar `dashboard/src/pages/Devices.tsx`:
```tsx
export function Devices() {
  return <div className="loading-state">Carregando...</div>
}
```

Criar `dashboard/src/pages/Blockchain.tsx`:
```tsx
export function Blockchain() {
  return <div className="loading-state">Carregando...</div>
}
```

**Step 3: Verificar — 4 abas navegáveis sem erro**

**Step 4: Commit**
```bash
git add dashboard/src/App.tsx dashboard/src/pages/Devices.tsx dashboard/src/pages/Blockchain.tsx
git commit -m "feat(dashboard-v2): add routes for Devices and Blockchain pages"
```

---

### Task 4: Dashboard — KPI Strip + Grid

**Files:**
- Modify: `dashboard/src/pages/Dashboard.tsx`

**Step 1: Substituir Dashboard.tsx**

```tsx
import { useState, useMemo } from 'react'
import { useDevices } from '../hooks/useDevices'
import { useReadings } from '../hooks/useReadings'
import { StellarExplorer } from '../components/StellarExplorer'
import { BlockchainStatus } from '../components/BlockchainStatus'
import { TransactionLink } from '../components/TransactionLink'
import { useRelativeTime } from '../hooks/useRelativeTime'
import { formatFullDateTime } from '../utils/time'
import type { Reading } from '../types/reading'

const SENSOR_COLORS = {
  temperature: '#ef4444',
  humidity_air: '#3b82f6',
  humidity_soil: '#22c55e',
  luminosity: '#f59e0b',
}

function KpiCard({ icon, label, value, unit, color }: {
  icon: string; label: string; value: string; unit: string; color: string
}) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color } as React.CSSProperties}>
      <span className="kpi-card__icon">{icon}</span>
      <div className="kpi-card__value">
        {value}
        <span className="kpi-card__unit">{unit}</span>
      </div>
      <div className="kpi-card__label">{label}</div>
      <div className="kpi-card__glow" />
    </div>
  )
}

function ReadingItemRow({ reading, onTransactionClick }: {
  reading: Reading; onTransactionClick?: (h: string) => void
}) {
  const rel = useRelativeTime(reading.created_at)
  const full = formatFullDateTime(reading.created_at)

  return (
    <div className="reading-item" title={full}>
      <div className="reading-item__header">
        <span className="reading-item__device">{reading.device_id}</span>
        <span className="reading-item__time">{rel}</span>
      </div>
      <div className="reading-item__metrics">
        {reading.temperature != null && (
          <span className="reading-metric">
            <span className="reading-metric__icon">🌡️</span>
            <span className="reading-metric__value">{reading.temperature.toFixed(1)}</span>
            <span className="reading-metric__unit">°C</span>
          </span>
        )}
        {reading.humidity_air != null && (
          <span className="reading-metric">
            <span className="reading-metric__icon">💧</span>
            <span className="reading-metric__value">{reading.humidity_air.toFixed(1)}</span>
            <span className="reading-metric__unit">%</span>
          </span>
        )}
        {reading.humidity_soil != null && (
          <span className="reading-metric">
            <span className="reading-metric__icon">🌱</span>
            <span className="reading-metric__value">{reading.humidity_soil.toFixed(1)}</span>
            <span className="reading-metric__unit">%</span>
          </span>
        )}
        {reading.luminosity != null && (
          <span className="reading-metric">
            <span className="reading-metric__icon">☀️</span>
            <span className="reading-metric__value">{reading.luminosity}</span>
            <span className="reading-metric__unit">lx</span>
          </span>
        )}
      </div>
      <div className="reading-item__footer">
        <BlockchainStatus status={reading.blockchain_status} error={reading.blockchain_error} />
        {reading.blockchain_tx_hash && (
          <TransactionLink txHash={reading.blockchain_tx_hash} onClick={onTransactionClick} />
        )}
      </div>
    </div>
  )
}

export function Dashboard() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>()
  const [explorerTxHash, setExplorerTxHash] = useState<string | null>(null)

  const { devices, loading: devicesLoading } = useDevices()
  const { readings, loading: readingsLoading } = useReadings(selectedDeviceId)

  // KPI: pegar leitura mais recente
  const latest = readings[0]

  const kpis = useMemo(() => [
    { icon: '🌡️', label: 'Temperatura',    value: latest?.temperature?.toFixed(1) ?? '—',    unit: '°C', color: SENSOR_COLORS.temperature },
    { icon: '💧', label: 'Umidade do Ar',  value: latest?.humidity_air?.toFixed(1) ?? '—',   unit: '%',  color: SENSOR_COLORS.humidity_air },
    { icon: '🌱', label: 'Umidade do Solo',value: latest?.humidity_soil?.toFixed(1) ?? '—',  unit: '%',  color: SENSOR_COLORS.humidity_soil },
    { icon: '☀️', label: 'Luminosidade',   value: latest?.luminosity?.toFixed(0) ?? '—',     unit: 'lx', color: SENSOR_COLORS.luminosity },
  ], [latest])

  return (
    <div>
      {/* KPI Strip */}
      <div className="kpi-strip">
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Grid: devices + feed */}
      <div className="dashboard-grid">
        {/* Devices panel */}
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <span className="dashboard-panel__title">
              🛰️ Dispositivos
            </span>
            <span className="dashboard-panel__badge">
              {devices.filter(d => d.isAlive).length}/{devices.length} online
            </span>
          </div>

          {devicesLoading ? (
            <div className="loading-state">Carregando</div>
          ) : devices.length === 0 ? (
            <div className="empty-state">Nenhum dispositivo</div>
          ) : (
            <div className="device-list-v2">
              {devices.map(device => (
                <div
                  key={device.id}
                  className={`device-item${selectedDeviceId === device.device_id ? ' device-item--selected' : ''}`}
                  onClick={() => setSelectedDeviceId(prev =>
                    prev === device.device_id ? undefined : device.device_id
                  )}
                >
                  <span className={`device-item__dot device-item__dot--${device.isAlive ? 'online' : 'offline'}`} />
                  <div className="device-item__info">
                    <div className="device-item__name">{device.name || device.device_id}</div>
                    <div className="device-item__meta">
                      {device.location && `${device.location} · `}{device.total_readings} leituras
                    </div>
                  </div>
                  <span className={`device-item__badge device-item__badge--${device.isAlive ? 'online' : 'offline'}`}>
                    {device.isAlive ? 'online' : 'offline'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feed panel */}
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <span className="dashboard-panel__title">
              Feed de Leituras
            </span>
            <span className="dashboard-panel__badge">
              <span className="live-dot" />
              ao vivo
            </span>
          </div>

          {readingsLoading ? (
            <div className="loading-state">Carregando</div>
          ) : readings.length === 0 ? (
            <div className="empty-state">Nenhuma leitura ainda</div>
          ) : (
            <div className="reading-feed">
              {readings.map(r => (
                <ReadingItemRow
                  key={r.id}
                  reading={r}
                  onTransactionClick={setExplorerTxHash}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {explorerTxHash && (
        <StellarExplorer
          txHash={explorerTxHash}
          onClose={() => setExplorerTxHash(null)}
        />
      )}
    </div>
  )
}
```

**Step 2: Verificar KPIs + grid renderizam**

**Step 3: Commit**
```bash
git add dashboard/src/pages/Dashboard.tsx
git commit -m "feat(dashboard-v2): KPI strip and two-column realtime grid"
```

---

### Task 5: Analytics — Restyled

**Files:**
- Modify: `dashboard/src/pages/Analytics.tsx`
- Modify: `dashboard/src/components/charts/StatCard.tsx`
- Modify: `dashboard/src/components/charts/SensorLineChart.tsx`
- Modify: `dashboard/src/components/charts/SensorAreaChart.tsx`

**Step 1: Substituir Analytics.tsx**

```tsx
import { useState } from 'react'
import { useAnalyticsData, type TimePeriod } from '../hooks/useAnalyticsData'

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '1h',  label: '1h' },
  { value: '6h',  label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d',  label: '7d' },
  { value: '30d', label: '30d' },
  { value: 'all', label: 'Total' },
]

const SENSORS = [
  { key: 'temperature' as const, icon: '🌡️', label: 'Temperatura', unit: '°C', color: '#ef4444' },
  { key: 'humidityAir' as const, icon: '💧', label: 'Umidade do Ar', unit: '%', color: '#3b82f6' },
  { key: 'humiditySoil' as const, icon: '🌱', label: 'Umidade do Solo', unit: '%', color: '#22c55e' },
  { key: 'luminosity' as const, icon: '☀️', label: 'Luminosidade', unit: 'lx', color: '#f59e0b' },
]

import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

function formatTick(ts: string) {
  const d = new Date(ts)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function Analytics() {
  const [period, setPeriod] = useState<TimePeriod>('all')
  const { data, loading, error, totalReadings, deviceCount } = useAnalyticsData({ period })

  return (
    <div className="analytics-v2">
      <div className="analytics-v2__header">
        <h2 className="analytics-v2__title">📊 Analytics</h2>
        <div className="period-selector">
          {PERIODS.map(p => (
            <button
              key={p.value}
              className={`period-btn${period === p.value ? ' period-btn--active' : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-banner">Erro: {error}</div>}

      {loading ? (
        <div className="loading-state">Carregando dados</div>
      ) : totalReadings === 0 ? (
        <div className="empty-state">Nenhum dado para o período selecionado</div>
      ) : (
        <>
          <div className="analytics-v2__stats">
            {SENSORS.map(s => {
              const stats = data[s.key].stats
              return (
                <div
                  key={s.key}
                  className="stat-card-v2"
                  style={{ '--stat-color': s.color } as React.CSSProperties}
                >
                  <span className="stat-card-v2__icon">{s.icon}</span>
                  <div className="stat-card-v2__label">{s.label}</div>
                  <div className="stat-card-v2__value">
                    {stats.avg.toFixed(s.key === 'luminosity' ? 0 : 1)}
                    <span className="stat-card-v2__unit">{s.unit}</span>
                  </div>
                  <div className="stat-card-v2__sub">
                    min {stats.min.toFixed(1)} · max {stats.max.toFixed(1)}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="analytics-v2__charts">
            {/* Temperatura — linha grande */}
            {(() => {
              const s = SENSORS[0]
              return (
                <div className="chart-card">
                  <div className="chart-card__title">
                    {s.icon} {s.label}
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data[s.key].data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.08)" />
                      <XAxis dataKey="timestamp" tickFormatter={formatTick} tick={{ fill: '#6b9e7a', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#6b9e7a', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#112a16', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, color: '#e2e8f0' }}
                        labelFormatter={formatTick}
                        formatter={(v: number) => [`${v.toFixed(1)} ${s.unit}`, s.label]}
                      />
                      <Line type="monotone" dataKey="value" stroke={s.color} dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="smaShort" stroke={s.color} dot={false} strokeWidth={1} strokeDasharray="4 2" opacity={0.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )
            })()}

            {/* Umidade ar + solo — row */}
            <div className="analytics-v2__charts-row">
              {[SENSORS[1], SENSORS[2]].map(s => (
                <div className="chart-card" key={s.key}>
                  <div className="chart-card__title">{s.icon} {s.label}</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={data[s.key].data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.08)" />
                      <XAxis dataKey="timestamp" tickFormatter={formatTick} tick={{ fill: '#6b9e7a', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#6b9e7a', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#112a16', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, color: '#e2e8f0' }}
                        labelFormatter={formatTick}
                        formatter={(v: number) => [`${v.toFixed(1)} ${s.unit}`, s.label]}
                      />
                      <Area type="monotone" dataKey="value" stroke={s.color} fill={s.color} fillOpacity={0.08} strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>

            {/* Luminosidade */}
            {(() => {
              const s = SENSORS[3]
              return (
                <div className="chart-card">
                  <div className="chart-card__title">{s.icon} {s.label}</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data[s.key].data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.08)" />
                      <XAxis dataKey="timestamp" tickFormatter={formatTick} tick={{ fill: '#6b9e7a', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#6b9e7a', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#112a16', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, color: '#e2e8f0' }}
                        labelFormatter={formatTick}
                        formatter={(v: number) => [`${v.toFixed(0)} ${s.unit}`, s.label]}
                      />
                      <Area type="monotone" dataKey="value" stroke={s.color} fill={s.color} fillOpacity={0.08} strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )
            })()}
          </div>

          <div className="analytics-v2__footer">
            {totalReadings} leituras de {deviceCount} dispositivo{deviceCount !== 1 ? 's' : ''} · período: {PERIODS.find(p => p.value === period)?.label}
          </div>
        </>
      )}
    </div>
  )
}
```

**Step 2: Verificar gráficos com tema escuro**

**Step 3: Commit**
```bash
git add dashboard/src/pages/Analytics.tsx
git commit -m "feat(dashboard-v2): analytics page restyled with dark theme charts"
```

---

### Task 6: Página Dispositivos

**Files:**
- Modify: `dashboard/src/pages/Devices.tsx`

**Step 1: Implementar Devices.tsx**

```tsx
import { useDevices } from '../hooks/useDevices'
import { useRelativeTime } from '../hooks/useRelativeTime'
import type { DeviceWithStatus } from '../types/device'

const DEVICE_COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6']

function DeviceCardV2({ device, index }: { device: DeviceWithStatus; index: number }) {
  const color = DEVICE_COLORS[index % DEVICE_COLORS.length]
  const lastSeen = useRelativeTime(device.last_seen_at ?? '')

  const pubKeyShort = device.public_key
    ? device.public_key.replace('-----BEGIN PUBLIC KEY-----', '').replace('-----END PUBLIC KEY-----', '').trim().slice(0, 64) + '...'
    : '—'

  return (
    <div className="device-card-v2" style={{ '--device-color': color } as React.CSSProperties}>
      <div className="device-card-v2__header">
        <div>
          <div className="device-card-v2__name">{device.name || device.device_id}</div>
          <div className="device-card-v2__id">{device.device_id}</div>
        </div>
        <span className={`device-item__badge device-item__badge--${device.isAlive ? 'online' : 'offline'}`}>
          {device.isAlive ? '● online' : '○ offline'}
        </span>
      </div>

      <div className="device-card-v2__rows">
        {device.location && (
          <div className="device-card-v2__row">
            <span className="device-card-v2__row-label">📍 Localização</span>
            <span className="device-card-v2__row-value">{device.location}</span>
          </div>
        )}
        <div className="device-card-v2__row">
          <span className="device-card-v2__row-label">📡 Leituras</span>
          <span className="device-card-v2__row-value">{device.total_readings.toLocaleString('pt-BR')}</span>
        </div>
        <div className="device-card-v2__row">
          <span className="device-card-v2__row-label">🕐 Último sinal</span>
          <span className="device-card-v2__row-value">{device.last_seen_at ? lastSeen : 'Nunca'}</span>
        </div>
        <div className="device-card-v2__row">
          <span className="device-card-v2__row-label">📅 Cadastrado</span>
          <span className="device-card-v2__row-value">
            {new Date(device.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      <div className="device-card-v2__pubkey">{pubKeyShort}</div>
    </div>
  )
}

export function Devices() {
  const { devices, loading, error } = useDevices()

  return (
    <div className="devices-v2">
      <div className="devices-v2__header">
        <h2 className="page-title">
          🛰️ Dispositivos
          <span className="page-title__count">{devices.length} total</span>
        </h2>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">Carregando dispositivos</div>
      ) : devices.length === 0 ? (
        <div className="empty-state">Nenhum dispositivo cadastrado</div>
      ) : (
        <div className="devices-v2__grid">
          {devices.map((device, i) => (
            <DeviceCardV2 key={device.id} device={device} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verificar grid de dispositivos**

**Step 3: Commit**
```bash
git add dashboard/src/pages/Devices.tsx
git commit -m "feat(dashboard-v2): devices page with grid cards"
```

---

### Task 7: Página Blockchain

**Files:**
- Modify: `dashboard/src/pages/Blockchain.tsx`

**Step 1: Implementar Blockchain.tsx**

```tsx
import { useState } from 'react'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { useReadings } from '../hooks/useReadings'
import { StellarExplorer } from '../components/StellarExplorer'
import { useRelativeTime } from '../hooks/useRelativeTime'
import type { Reading } from '../types/reading'

function TxRow({ reading, onHashClick }: { reading: Reading; onHashClick: (h: string) => void }) {
  const rel = useRelativeTime(reading.created_at)

  const statusClass = {
    confirmed: 'tx-badge--confirmed',
    pending:   'tx-badge--pending',
    failed:    'tx-badge--failed',
  }[reading.blockchain_status]

  const statusLabel = {
    confirmed: '✓ Confirmado',
    pending:   '⏳ Pendente',
    failed:    '✗ Falhou',
  }[reading.blockchain_status]

  return (
    <tr>
      <td><span className="bk-table__device">{reading.device_id}</span></td>
      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{rel}</td>
      <td>
        {reading.blockchain_tx_hash ? (
          <button
            className="bk-table__hash"
            onClick={() => onHashClick(reading.blockchain_tx_hash!)}
            title={reading.blockchain_tx_hash}
          >
            {reading.blockchain_tx_hash.slice(0, 8)}…{reading.blockchain_tx_hash.slice(-8)}
          </button>
        ) : (
          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>
        )}
      </td>
      <td>
        <span className={`tx-badge ${statusClass}`}>{statusLabel}</span>
      </td>
    </tr>
  )
}

export function Blockchain() {
  const [explorerHash, setExplorerHash] = useState<string | null>(null)
  const { readings, loading } = useReadings()

  const confirmed = readings.filter(r => r.blockchain_status === 'confirmed').length
  const pending   = readings.filter(r => r.blockchain_status === 'pending').length
  const failed    = readings.filter(r => r.blockchain_status === 'failed').length

  return (
    <div className="blockchain-v2">
      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <h2 className="page-title">⛓️ Blockchain</h2>
      </div>

      <div className="blockchain-v2__kpis">
        <div className="bk-kpi bk-kpi--confirmed">
          <div className="bk-kpi__value">{confirmed}</div>
          <div className="bk-kpi__label">✓ Confirmados</div>
        </div>
        <div className="bk-kpi bk-kpi--pending">
          <div className="bk-kpi__value">{pending}</div>
          <div className="bk-kpi__label">⏳ Pendentes</div>
        </div>
        <div className="bk-kpi bk-kpi--failed">
          <div className="bk-kpi__value">{failed}</div>
          <div className="bk-kpi__label">✗ Falhas</div>
        </div>
      </div>

      <div className="blockchain-v2__table-wrap">
        <div className="blockchain-v2__table-header">
          <span className="dashboard-panel__title">⛓️ Transações Recentes</span>
          <span className="dashboard-panel__badge">{readings.length} registros</span>
        </div>

        {loading ? (
          <div className="loading-state">Carregando</div>
        ) : readings.length === 0 ? (
          <div className="empty-state">Nenhuma transação encontrada</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="bk-table">
              <thead>
                <tr>
                  <th>Dispositivo</th>
                  <th>Quando</th>
                  <th>TX Hash</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {readings.map(r => (
                  <TxRow key={r.id} reading={r} onHashClick={setExplorerHash} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {explorerHash && (
        <StellarExplorer txHash={explorerHash} onClose={() => setExplorerHash(null)} />
      )}
    </div>
  )
}
```

**Step 2: Verificar tabela de transações**

**Step 3: Commit**
```bash
git add dashboard/src/pages/Blockchain.tsx
git commit -m "feat(dashboard-v2): blockchain page with TX table and KPIs"
```

---

### Task 8: Atualizar modais (StellarExplorer + BlockchainStatus)

**Files:**
- Modify: `dashboard/src/components/StellarExplorer.tsx`
- Modify: `dashboard/src/components/BlockchainStatus.tsx`

**Step 1: Atualizar StellarExplorer.tsx para usar classes do novo design**

```tsx
interface StellarExplorerProps {
  txHash: string
  onClose: () => void
}

export function StellarExplorer({ txHash, onClose }: StellarExplorerProps) {
  const url = `https://stellar.expert/explorer/testnet/tx/${txHash}`

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" style={{ height: '80vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title">⛓️ Stellar Explorer</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', color: 'var(--accent)', textDecoration: 'none' }}>
              Abrir externo ↗
            </a>
            <button className="modal__close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal__iframe-wrap">
          <iframe src={url} title="Stellar Explorer" />
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Atualizar BlockchainStatus.tsx para usar tx-badge**

```tsx
import { useState } from 'react'
import type { BlockchainStatus as BlockchainStatusType } from '../types/reading'

interface Props {
  status: BlockchainStatusType
  error: string | null
}

export function BlockchainStatus({ status, error }: Props) {
  const [showError, setShowError] = useState(false)

  const label = { pending: '⏳ Pendente', confirmed: '✓ Stellar', failed: '✗ Falhou' }[status]
  const cls   = { pending: 'tx-badge--pending', confirmed: 'tx-badge--confirmed', failed: 'tx-badge--failed' }[status]

  return (
    <>
      <span className={`tx-badge ${cls}`} style={{ cursor: error ? 'pointer' : 'default' }} onClick={() => error && setShowError(true)}>
        {label}
        {error && ' ⓘ'}
      </span>

      {showError && (
        <div className="modal-overlay" onClick={() => setShowError(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <div className="modal__title" style={{ color: 'var(--danger)' }}>✗ Erro Blockchain</div>
              <button className="modal__close" onClick={() => setShowError(false)}>✕</button>
            </div>
            <div className="modal__body">
              <pre>{error}</pre>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

**Step 3: Commit**
```bash
git add dashboard/src/components/StellarExplorer.tsx dashboard/src/components/BlockchainStatus.tsx
git commit -m "feat(dashboard-v2): update modals to new design system"
```

---

### Task 9: Atualizar TransactionLink.tsx

**Files:**
- Modify: `dashboard/src/components/TransactionLink.tsx`

**Step 1: Ler o arquivo atual**

```bash
cat dashboard/src/components/TransactionLink.tsx
```

**Step 2: Atualizar para usar classe tx-link**

```tsx
interface Props {
  txHash: string
  onClick?: (hash: string) => void
}

export function TransactionLink({ txHash, onClick }: Props) {
  const short = `${txHash.slice(0, 6)}…${txHash.slice(-6)}`

  if (onClick) {
    return (
      <button className="tx-link" onClick={() => onClick(txHash)} title={txHash}>
        🔗 {short}
      </button>
    )
  }

  return (
    <a
      className="tx-link"
      href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
      target="_blank"
      rel="noreferrer"
      title={txHash}
    >
      🔗 {short}
    </a>
  )
}
```

**Step 3: Commit**
```bash
git add dashboard/src/components/TransactionLink.tsx
git commit -m "feat(dashboard-v2): update TransactionLink to new design"
```

---

### Task 10: Remover ThemeContext (dark-only permanente)

**Files:**
- Modify: `dashboard/src/main.tsx`
- Delete logic from: `dashboard/src/contexts/ThemeContext.tsx`

**Step 1: Verificar se ThemeContext é usado em algum arquivo além de Layout**

```bash
grep -r "ThemeContext\|useTheme\|ThemeProvider" dashboard/src --include="*.tsx" --include="*.ts"
```

**Step 2: Remover ThemeProvider do main.tsx ou App.tsx se presente**

Substituir `main.tsx` para não precisar do provider (o tema agora é CSS puro):
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Step 3: Verificar — sem erros de TypeScript**
```bash
cd dashboard && npm run build 2>&1 | tail -20
```
Esperado: build bem-sucedido sem erros.

**Step 4: Commit**
```bash
git add dashboard/src/main.tsx dashboard/src/App.tsx
git commit -m "feat(dashboard-v2): remove theme toggle, permanent dark mode"
```

---

### Task 11: Verificação final com Playwright

**Step 1: Abrir no browser com Playwright e tirar screenshot**

```
Navegar para http://localhost:3000
Verificar: topbar verde escura, KPI strip, grid de dispositivos e feed
Navegar para /analytics — verificar gráficos
Navegar para /devices — verificar cards de dispositivos
Navegar para /blockchain — verificar tabela de TXs
```

**Step 2: Build de produção**
```bash
cd dashboard && npm run build
```
Esperado: build sem erros TypeScript.

**Step 3: Commit final**
```bash
git add -A
git commit -m "feat: dashboard v2 complete — enterprise AgriTech dark theme"
```
