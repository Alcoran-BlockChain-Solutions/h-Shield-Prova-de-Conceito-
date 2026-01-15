import json
import os
import random
import time
import urllib.request

# Load .env file manually
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip().strip('"').strip("'")

load_env()

# Configuration
DEVICE_ID = "esp32-farm-012"
INTERVAL_SECONDS = 1

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
FUNCTION_URL = f"{SUPABASE_URL}/oracle"

# Stats
stats = {
    "total": 0,
    "success": 0,
    "failed": 0,
    "blockchain_success": 0,
    "blockchain_failed": 0,
    "start_time": None,
}


def generate_sensor_data():
    return {
        "device_id": DEVICE_ID,
        "temperature": round(random.uniform(15.0, 40.0), 2),
        "humidity_air": round(random.uniform(30.0, 90.0), 2),
        "humidity_soil": round(random.uniform(20.0, 80.0), 2),
        "luminosity": random.randint(1000, 100000),
    }


def send_reading():
    data = generate_sensor_data()

    headers = {
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
    }

    req = urllib.request.Request(
        FUNCTION_URL,
        data=json.dumps(data).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            body = json.loads(response.read().decode("utf-8"))
            return True, body
    except urllib.error.HTTPError as e:
        body = json.loads(e.read().decode("utf-8"))
        return False, body
    except Exception as e:
        return False, {"error": str(e)}


def print_stats():
    elapsed = time.time() - stats["start_time"]
    hours = elapsed / 3600

    print("\n" + "=" * 60)
    print("STATS")
    print("=" * 60)
    print(f"Runtime:              {elapsed:.0f}s ({hours:.2f}h)")
    print(f"Total requests:       {stats['total']}")
    print(f"Success:              {stats['success']}")
    print(f"Failed:               {stats['failed']}")
    print(f"Blockchain success:   {stats['blockchain_success']}")
    print(f"Blockchain failed:    {stats['blockchain_failed']}")
    print(f"Rate:                 {stats['total'] / elapsed:.2f} req/s")

    # Cost estimation
    xlm_per_tx = 0.00001  # 100 stroops base fee
    xlm_spent = stats["blockchain_success"] * xlm_per_tx
    xlm_per_hour = (stats["blockchain_success"] / hours) * xlm_per_tx if hours > 0 else 0

    print("\n" + "-" * 60)
    print("STELLAR COSTS (testnet - free, but simulating mainnet)")
    print("-" * 60)
    print(f"XLM spent:            {xlm_spent:.6f} XLM")
    print(f"XLM per hour:         {xlm_per_hour:.6f} XLM")
    print(f"XLM per day:          {xlm_per_hour * 24:.6f} XLM")
    print(f"XLM per month:        {xlm_per_hour * 24 * 30:.6f} XLM")
    print("=" * 60 + "\n")


def main():
    print("=" * 60)
    print("ESP32 SIMULATOR - HarvestShield")
    print("=" * 60)
    print(f"Device ID:    {DEVICE_ID}")
    print(f"Interval:     {INTERVAL_SECONDS}s")
    print(f"Endpoint:     {FUNCTION_URL}")
    print("=" * 60)
    print("Press Ctrl+C to stop and see stats\n")

    stats["start_time"] = time.time()

    try:
        while True:
            stats["total"] += 1

            success, response = send_reading()

            if success:
                stats["success"] += 1
                blockchain = response.get("blockchain", {})
                if blockchain.get("success"):
                    stats["blockchain_success"] += 1
                    status = f"OK + blockchain: https://stellar.expert/explorer/testnet/tx/{blockchain.get('tx_hash', 'unknown')}"
                else:
                    stats["blockchain_failed"] += 1
                    status = f"OK (blockchain: {blockchain.get('error', 'failed')[:30]})"
            else:
                stats["failed"] += 1
                status = f"FAILED: {response.get('error', 'unknown')[:40]}"

            print(f"[{stats['total']:04d}] {status}")

            time.sleep(INTERVAL_SECONDS)

    except KeyboardInterrupt:
        print_stats()


if __name__ == "__main__":
    main()
