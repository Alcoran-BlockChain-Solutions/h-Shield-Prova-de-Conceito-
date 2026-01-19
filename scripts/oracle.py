#!/usr/bin/env python3
"""
Oracle Test - HarvestShield

Single-shot test script to send one reading to the oracle endpoint
with full security: PoW (Proof of Work) + ECDSA P-256 signature.

Usage:
    python oracle.py

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
    print("ERROR: cryptography library not installed. Run: pip install cryptography\n")


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
POW_DIFFICULTY = int(os.getenv("POW_DIFFICULTY", "3"))
POW_PREFIX = "0" * POW_DIFFICULTY

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
FUNCTION_URL = f"{SUPABASE_URL}/oracle"

# Private key for ECDSA signing
PRIVATE_KEY_PATH = os.getenv("PRIVATE_KEY_PATH", "../keys/esp32-farm-001.key")


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
        "temperature": round(random.uniform(20.0, 30.0), 2),
        "humidity_air": round(random.uniform(50.0, 70.0), 2),
        "humidity_soil": round(random.uniform(40.0, 60.0), 2),
        "luminosity": random.randint(10000, 50000),
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


def send_reading():
    """Send a single reading to the oracle."""
    print("=" * 70)
    print("ORACLE TEST - HarvestShield")
    print("=" * 70)
    print(f"Device ID:      {DEVICE_ID}")
    print(f"PoW Difficulty: {POW_DIFFICULTY}")
    print(f"Endpoint:       {FUNCTION_URL}")
    print(f"Private Key:    {PRIVATE_KEY_PATH}")
    print("=" * 70)

    # Load private key
    private_key = load_private_key()
    if private_key is None:
        if HAS_CRYPTO:
            print("\nERROR: Could not load private key. Exiting.")
        return None

    # Generate data
    data = generate_sensor_data()
    timestamp = int(time.time())

    print(f"\n1. Generated sensor data:")
    print(f"   Temperature:   {data['temperature']}C")
    print(f"   Humidity Air:  {data['humidity_air']}%")
    print(f"   Humidity Soil: {data['humidity_soil']}%")
    print(f"   Luminosity:    {data['luminosity']} lux")

    # Format PoW data
    pow_data = format_pow_data(data)
    print(f"\n2. PoW Data: {pow_data}")

    # Solve PoW
    print(f"\n3. Solving PoW (difficulty {POW_DIFFICULTY})...")
    pow_start = time.time()
    nonce, pow_hash, attempts = solve_pow(pow_data)
    pow_time = time.time() - pow_start
    print(f"   Solved in {attempts} attempts ({pow_time*1000:.0f}ms)")
    print(f"   Nonce: {nonce}")
    print(f"   Hash:  {pow_hash[:32]}...")

    # Sign the PoW hash
    print(f"\n4. Signing PoW hash with ECDSA P-256...")
    signature = sign_message(private_key, pow_hash)
    print(f"   Signature: {signature[:32]}...")

    # Prepare headers
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

    # Send request
    print(f"\n5. Sending to oracle...")
    req = urllib.request.Request(
        FUNCTION_URL,
        data=json.dumps(data).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            status = response.status

            print(f"\n" + "=" * 70)
            print(f"RESPONSE - Status: {status}")
            print("=" * 70)

            # Oracle returns 202 Accepted with no body
            if status == 202:
                print("SUCCESS! Reading accepted by oracle.")
                print("Blockchain transaction is being processed in background.")
                return {"success": True, "status": 202}

            # For other success codes, try to parse body
            raw_body = response.read().decode("utf-8")
            if raw_body:
                body = json.loads(raw_body)
                print(json.dumps(body, indent=2))
                return body
            else:
                print("(empty body)")
                return {"success": True, "status": status}

    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode("utf-8"))
        except Exception:
            body = {"error": f"HTTP {e.code}"}

        print(f"\n" + "=" * 70)
        print(f"ERROR - Status: {e.code}")
        print("=" * 70)
        print(json.dumps(body, indent=2))
        return body

    except Exception as e:
        print(f"\nERROR: {e}")
        return None


def run_loop(interval_seconds: int = 15):
    """Run continuously, sending readings every interval_seconds."""
    print(f"\nStarting continuous mode (interval: {interval_seconds}s)")
    print("Press Ctrl+C to stop\n")

    count = 0
    while True:
        count += 1
        print(f"\n{'='*70}")
        print(f"READING #{count}")
        print(f"{'='*70}")

        result = send_reading()

        if result and result.get("success"):
            print(f"\nNext reading in {interval_seconds} seconds...")
        else:
            print(f"\nRetrying in {interval_seconds} seconds...")

        try:
            time.sleep(interval_seconds)
        except KeyboardInterrupt:
            print("\n\nStopped by user.")
            break


if __name__ == "__main__":
    if not HAS_CRYPTO:
        print("Please install cryptography: pip install cryptography")
    else:
        import sys
        if len(sys.argv) > 1 and sys.argv[1] == "--loop":
            interval = int(sys.argv[2]) if len(sys.argv) > 2 else 15
            run_loop(interval)
        else:
            send_reading()
            print("\nTip: Use --loop [interval] to run continuously")
