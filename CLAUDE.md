# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Security Rules

- **NEVER read `.env` files** - They contain sensitive credentials and secrets
- **NEVER read files that may contain secrets** (`.env.local`, `.env.production`, `credentials.json`, `config.h`, files in `keys/`)

## Project Overview

HarvestShield is an IoT agricultural monitoring system with:
- **IoT (ESP32 C++)**: Sensor data collection with ECDSA signing and Proof of Work
- **Backend (Supabase Edge Functions)**: Data validation, PostgreSQL persistence, Stellar blockchain recording
- **Dashboard (React + Vite)**: Real-time visualization of sensors and blockchain status
- **Pitch (React + Vite)**: Presentation slides for investors

## Build & Development Commands

### IoT / Firmware (PlatformIO)
```bash
cd iot
pio run                    # Compile
pio run -t upload          # Upload to ESP32
pio device monitor         # Serial monitor
pio run -t clean           # Clean build
```

### Dashboard (Vite)
```bash
cd dashboard
npm install
npm run dev                # Dev server on port 3000
npm run build              # Production build
```

### Backend / Supabase
```bash
cd backend/supabase
supabase start             # Local development
supabase db push           # Push migrations
supabase functions deploy oracle
supabase functions deploy get-readings
```

### Testing Scripts
```bash
cd backend/scripts
python oracle.py           # Test oracle endpoint
python simulate_esp32.py   # Simulate ESP32 device
```

## Architecture

```
ESP32 (C++)                     Supabase Edge Functions
┌─────────────────┐            ┌─────────────────────────┐
│ sensors/        │  HTTPS     │ oracle/index.ts         │
│ crypto (PoW)    │ ────────>  │  - PoW verify           │
│ key_manager     │            │  - ECDSA verify         │
│ http_client     │            │  - PostgreSQL save      │
└─────────────────┘            │  - Stellar TX (async)   │
                               └─────────────────────────┘
                                          │
                                          ▼
                               ┌─────────────────────────┐
                               │ PostgreSQL (readings)   │
                               │ Stellar Blockchain      │
                               └─────────────────────────┘
```

## Key Technical Details

**Security layers:**
- ECDSA P-256 signatures (private key in ESP32 NVS)
- Proof of Work (SHA256, difficulty 3)
- Anti-replay (5-minute timestamp window)
- PostgreSQL RLS policies

**Request headers from ESP32:**
```
X-Device-ID, X-Timestamp, X-PoW-Data, X-PoW-Nonce, X-PoW-Hash, X-Signature
```

**Oracle returns 202 Accepted** - blockchain recording happens asynchronously via `EdgeRuntime.waitUntil()`

## Key Files

| Purpose | Location |
|---------|----------|
| IoT entry | `iot/src/main.cpp` |
| Oracle logic | `backend/supabase/functions/oracle/index.ts` |
| REST API | `backend/supabase/functions/get-readings/index.ts` |
| DB migrations | `backend/supabase/migrations/*.sql` |
| Dashboard page | `dashboard/src/pages/Dashboard.tsx` |
| Pitch slides | `pitch/src/Presentation.jsx` |
| Progress tracking | `docs/STATUS.md` |
| User manual | `docs/manual-usuario.md` |
| Architecture | `docs/architecture.md` |
| PRD | `docs/prd-harvestshield.md` |
| Phase 2 hardware | `docs/phase-2-hardware.md` |
