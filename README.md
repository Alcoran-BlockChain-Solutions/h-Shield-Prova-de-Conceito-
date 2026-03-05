# HarvestShield

IoT agricultural monitoring system with blockchain-backed data integrity.

## Structure

```
harvestshield/
├── iot/              # ESP32 firmware (C++) — sensors, ECDSA, PoW
├── backend/          # Supabase Edge Functions + testing scripts
│   ├── supabase/     # Oracle, API, migrations
│   └── scripts/      # Python test/simulation scripts
├── dashboard/        # React + Vite monitoring dashboard
├── pitch/            # Investor presentation (React + Vite)
├── docs/             # Architecture, PRD, user manual
└── keys/             # Device ECDSA keypairs
```

## How it works

1. **ESP32** reads sensors (temperature, humidity, luminosity)
2. Signs data with **ECDSA P-256** + adds **Proof of Work**
3. Sends to **Supabase Edge Function** (oracle) via HTTPS
4. Oracle validates PoW + signature, saves to **PostgreSQL**
5. Records transaction on **Stellar blockchain** (async)
6. **Dashboard** shows real-time sensor data + blockchain status
