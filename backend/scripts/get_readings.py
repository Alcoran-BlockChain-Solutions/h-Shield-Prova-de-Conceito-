#!/usr/bin/env python3
"""
Get Readings - HarvestShield API Client

Fetches sensor readings from the get-readings endpoint.

Usage:
    python get_readings.py
    python get_readings.py --device esp32-farm-001
    python get_readings.py --limit 20 --offset 10

Configuration via .env file:
    SUPABASE_URL=https://your-project.supabase.co/functions/v1
    SUPABASE_ANON_KEY=your-anon-key
"""

import argparse
import json
import os
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime


def load_env():
    """Load environment variables from .env file."""
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip().strip('"').strip("'")


load_env()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
FUNCTION_URL = f"{SUPABASE_URL}/get-readings"


def format_reading(reading: dict) -> str:
    """Format a reading for display."""
    device = reading.get("device_id", "?")
    temp = reading.get("temperature")
    hum_air = reading.get("humidity_air")
    hum_soil = reading.get("humidity_soil")
    lux = reading.get("luminosity")
    created = reading.get("created_at", "?")
    status = reading.get("blockchain_status", "?")
    tx_hash = reading.get("blockchain_tx_hash")

    # Format timestamp
    try:
        dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
        created = dt.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        pass

    # Format metrics
    metrics = []
    if temp is not None:
        metrics.append(f"{temp}C")
    if hum_air is not None:
        metrics.append(f"{hum_air}% air")
    if hum_soil is not None:
        metrics.append(f"{hum_soil}% soil")
    if lux is not None:
        metrics.append(f"{lux} lux")
    metrics_str = " | ".join(metrics) if metrics else "no data"

    # Format blockchain status
    if status == "confirmed" and tx_hash:
        bc_str = f"confirmed ({tx_hash[:8]}...)"
    elif status == "pending":
        bc_str = "pending"
    elif status == "failed":
        error = reading.get("blockchain_error", "")
        bc_str = f"failed: {error[:20]}..." if error else "failed"
    else:
        bc_str = status

    return f"  {device} | {metrics_str} | {created} | {bc_str}"


def get_readings(
    device_id: str = None,
    limit: int = 10,
    offset: int = 0,
    start_date: str = None,
    end_date: str = None,
    show_json: bool = False
):
    """Fetch readings from the API."""
    # Build query params
    params = {"limit": limit, "offset": offset}

    if device_id:
        params["device_id"] = device_id
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date

    url = f"{FUNCTION_URL}?{urllib.parse.urlencode(params)}"

    headers = {
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
    }

    print("=" * 70)
    print("GET READINGS - HarvestShield")
    print("=" * 70)
    print(f"Endpoint: {FUNCTION_URL}")
    print(f"Params:   {params}")
    print("=" * 70)

    req = urllib.request.Request(url, headers=headers, method="GET")

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            status = response.status
            body = json.loads(response.read().decode("utf-8"))

            print(f"\nStatus: {status}")
            print(f"Count:  {body.get('count', 0)} readings")
            print(f"Total:  {body.get('total', '?')} in database")

            if show_json:
                print("\nJSON Response:")
                print(json.dumps(body, indent=2))
            else:
                print("\nReadings:")
                print("-" * 70)
                for reading in body.get("readings", []):
                    print(format_reading(reading))
                print("-" * 70)

            # Summary stats
            readings = body.get("readings", [])
            if readings:
                confirmed = sum(1 for r in readings if r.get("blockchain_status") == "confirmed")
                pending = sum(1 for r in readings if r.get("blockchain_status") == "pending")
                failed = sum(1 for r in readings if r.get("blockchain_status") == "failed")
                print(f"\nBlockchain: {confirmed} confirmed | {pending} pending | {failed} failed")

            return body

    except urllib.error.HTTPError as e:
        print(f"\nStatus: {e.code}")
        try:
            error_body = json.loads(e.read().decode("utf-8"))
            print(f"Error:  {error_body}")
        except Exception:
            print(f"Error:  HTTP {e.code}")
        return None

    except Exception as e:
        print(f"\nError: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Fetch readings from HarvestShield API")
    parser.add_argument("--device", "-d", help="Filter by device ID")
    parser.add_argument("--limit", "-l", type=int, default=10, help="Number of readings (default: 10)")
    parser.add_argument("--offset", "-o", type=int, default=0, help="Offset for pagination (default: 0)")
    parser.add_argument("--start", help="Start date (ISO format: 2025-01-01T00:00:00)")
    parser.add_argument("--end", help="End date (ISO format: 2025-12-31T23:59:59)")
    parser.add_argument("--json", "-j", action="store_true", help="Show raw JSON response")

    args = parser.parse_args()

    get_readings(
        device_id=args.device,
        limit=args.limit,
        offset=args.offset,
        start_date=args.start,
        end_date=args.end,
        show_json=args.json
    )


if __name__ == "__main__":
    main()
