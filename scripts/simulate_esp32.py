#!/usr/bin/env python3
"""
ESP32 Simulator for HarvestShield

Simulates an ESP32 device sending sensor data to the oracle endpoint
with full security: PoW (Proof of Work) + ECDSA P-256 signature.

Usage:
    python simulate_esp32.py

Configuration via .env file:
    SUPABASE_URL=https://your-project.supabase.co/functions/v1
    SUPABASE_ANON_KEY=your-anon-key
    DEVICE_ID=esp32-farm-001
    PRIVATE_KEY_PATH=../keys/esp32-farm-001.key
"""

import hashlib
import json
import os
import random
import time
import urllib.request
import urllib.error

# ECDSA signing requires cryptography library
try:
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.backends import default_backend
    HAS_CRYPTO = True
except ImportError:
    HAS_CRYPTO = False
    print("WARNING: cryptography library not installed. Run: pip install cryptography")
    print("Signature will be skipped (requests will fail authentication).\n")


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

# Configuration
DEVICE_ID = os.getenv("DEVICE_ID", "esp32-farm-001")
INTERVAL_SECONDS = int(os.getenv("INTERVAL_SECONDS", "15"))  # 15 segundos padrão
POW_DIFFICULTY = int(os.getenv("POW_DIFFICULTY", "3"))
POW_PREFIX = "0" * POW_DIFFICULTY

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
FUNCTION_URL = f"{SUPABASE_URL}/oracle"

# Private key for ECDSA signing
PRIVATE_KEY_PATH = os.getenv("PRIVATE_KEY_PATH", "../keys/esp32-farm-001.key")

# Stats
stats = {
    "total": 0,
    "success": 0,
    "failed": 0,
    "blockchain_pending": 0,
    "pow_attempts_total": 0,
    "pow_attempts_avg": 0,
    "start_time": None,
}


def load_private_key():
    """Load ECDSA private key from PEM file."""
    if not HAS_CRYPTO:
        return None

    key_path = os.path.join(os.path.dirname(__file__), PRIVATE_KEY_PATH)
    if not os.path.exists(key_path):
        print(f"ERROR: Private key not found at {key_path}")
        return None

    with open(key_path, "rb") as f:
        private_key = serialization.load_pem_private_key(
            f.read(),
            password=None,
            backend=default_backend()
        )
    return private_key


def generate_sensor_data():
    """Generate random sensor readings within valid ranges."""
    return {
        "device_id": DEVICE_ID,
        "temperature": round(random.uniform(15.0, 40.0), 2),
        "humidity_air": round(random.uniform(30.0, 90.0), 2),
        "humidity_soil": round(random.uniform(20.0, 80.0), 2),
        "luminosity": random.randint(1000, 100000),
    }


def format_pow_data(data: dict) -> str:
    """
    Format sensor data for PoW computation.
    Format: temp-X;hum_air-Y;hum_soil-Z;lum-W
    """
    parts = []
    if data.get("temperature") is not None:
        parts.append(f"temp-{data['temperature']}")
    if data.get("humidity_air") is not None:
        parts.append(f"hum_air-{data['humidity_air']}")
    if data.get("humidity_soil") is not None:
        parts.append(f"hum_soil-{data['humidity_soil']}")
    if data.get("luminosity") is not None:
        parts.append(f"lum-{data['luminosity']}")
    return ";".join(parts)


def solve_pow(pow_data: str) -> tuple[str, str, int]:
    """
    Solve Proof of Work by finding nonce where SHA256(data + nonce) starts with prefix.
    Returns: (nonce, hash, attempts)
    """
    nonce = 0
    while True:
        nonce += 1
        input_str = pow_data + str(nonce)
        hash_hex = hashlib.sha256(input_str.encode()).hexdigest()
        if hash_hex.startswith(POW_PREFIX):
            return str(nonce), hash_hex, nonce


def sign_message(private_key, message: str) -> str:
    """
    Sign a message with ECDSA P-256 and return base64-encoded DER signature.
    """
    if not HAS_CRYPTO or private_key is None:
        return ""

    import base64
    signature_der = private_key.sign(
        message.encode(),
        ec.ECDSA(hashes.SHA256())
    )
    return base64.b64encode(signature_der).decode()


def send_reading(private_key):
    """Generate sensor data, solve PoW, sign, and send to oracle."""
    data = generate_sensor_data()
    timestamp = int(time.time())

    # 1. Format PoW data
    pow_data = format_pow_data(data)

    # 2. Solve PoW
    pow_start = time.time()
    nonce, pow_hash, attempts = solve_pow(pow_data)
    pow_time = time.time() - pow_start

    stats["pow_attempts_total"] += attempts
    stats["pow_attempts_avg"] = stats["pow_attempts_total"] / stats["total"] if stats["total"] > 0 else attempts

    # 3. Sign the PoW hash
    signature = sign_message(private_key, pow_hash)

    # 4. Prepare headers
    headers = {
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "X-Device-ID": DEVICE_ID,
        "X-Timestamp": str(timestamp),
        "X-PoW-Data": pow_data,
        "X-PoW-Nonce": nonce,
        "X-PoW-Hash": pow_hash,
        "X-Signature": signature,
    }

    # 5. Send request
    req = urllib.request.Request(
        FUNCTION_URL,
        data=json.dumps(data).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            status = response.status
            # Oracle returns 202 Accepted with no body
            if status == 202:
                return True, {"success": True, "status": 202}, pow_time, attempts
            # For other success codes, try to parse body
            raw_body = response.read().decode("utf-8")
            if raw_body:
                body = json.loads(raw_body)
            else:
                body = {"success": True, "status": status}
            return True, body, pow_time, attempts
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode("utf-8"))
        except Exception:
            body = {"error": f"HTTP {e.code}"}
        return False, body, pow_time, attempts
    except Exception as e:
        return False, {"error": str(e)}, pow_time, attempts


def print_stats():
    """Print statistics summary."""
    elapsed = time.time() - stats["start_time"]
    hours = elapsed / 3600

    print("\n" + "=" * 70)
    print("STATS")
    print("=" * 70)
    print(f"Runtime:              {elapsed:.0f}s ({hours:.2f}h)")
    print(f"Total requests:       {stats['total']}")
    print(f"Success (202):        {stats['success']}")
    print(f"Failed:               {stats['failed']}")
    print(f"Blockchain pending:   {stats['blockchain_pending']}")
    print(f"Rate:                 {stats['total'] / elapsed:.2f} req/s" if elapsed > 0 else "N/A")
    print(f"PoW avg attempts:     {stats['pow_attempts_avg']:.0f}")

    # Cost estimation
    xlm_per_tx = 0.00001  # 100 stroops base fee
    xlm_spent = stats["success"] * xlm_per_tx
    xlm_per_hour = (stats["success"] / hours) * xlm_per_tx if hours > 0 else 0

    print("\n" + "-" * 70)
    print("STELLAR COSTS (testnet = free, simulating mainnet)")
    print("-" * 70)
    print(f"XLM spent:            {xlm_spent:.6f} XLM")
    print(f"XLM per hour:         {xlm_per_hour:.6f} XLM")
    print(f"XLM per day:          {xlm_per_hour * 24:.6f} XLM")
    print(f"XLM per month:        {xlm_per_hour * 24 * 30:.6f} XLM")
    print("=" * 70 + "\n")


def main():
    print("=" * 70)
    print("ESP32 SIMULATOR - HarvestShield")
    print("=" * 70)
    print(f"Device ID:        {DEVICE_ID}")
    print(f"Interval:         {INTERVAL_SECONDS}s")
    print(f"PoW Difficulty:   {POW_DIFFICULTY} (prefix: '{POW_PREFIX}')")
    print(f"Endpoint:         {FUNCTION_URL}")
    print(f"Private Key:      {PRIVATE_KEY_PATH}")
    print("=" * 70)
    print("Press Ctrl+C to stop and see stats\n")

    # Load private key
    private_key = load_private_key()
    if private_key is None and HAS_CRYPTO:
        print("ERROR: Could not load private key. Exiting.")
        return

    stats["start_time"] = time.time()

    try:
        while True:
            stats["total"] += 1

            success, response, pow_time, pow_attempts = send_reading(private_key)

            if success:
                stats["success"] += 1
                stats["blockchain_pending"] += 1
                status = f"202 OK | PoW: {pow_attempts} attempts ({pow_time*1000:.0f}ms)"
            else:
                stats["failed"] += 1
                error = response.get("error", response.get("errors", "unknown"))
                if isinstance(error, list):
                    error = "; ".join(error)
                status = f"FAILED: {str(error)[:50]}"

            print(f"[{stats['total']:04d}] {status}")

            time.sleep(INTERVAL_SECONDS)

    except KeyboardInterrupt:
        print_stats()


if __name__ == "__main__":
    main()
