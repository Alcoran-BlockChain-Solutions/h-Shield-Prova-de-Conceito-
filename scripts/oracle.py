import json
import os
import random
import urllib.request
import hashlib
import base64
import time

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

# Configuration - Use unregistered device (should fail auth)
DEVICE_ID = "esp32-farm-002"
PRIVATE_KEY_PATH = os.path.join(os.path.dirname(__file__), "..", "keys", "esp32-farm-002.key")

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")  # e.g. http://127.0.0.1:54321/functions/v1
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
FUNCTION_URL = f"{SUPABASE_URL}/oracle"

# Try to import cryptography library
try:
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.backends import default_backend
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False
    print("Warning: cryptography library not installed. Run: pip install cryptography")


def load_private_key():
    """Load ECDSA private key from PEM file"""
    if not CRYPTO_AVAILABLE:
        return None

    with open(PRIVATE_KEY_PATH, "rb") as f:
        private_key = serialization.load_pem_private_key(
            f.read(),
            password=None,
            backend=default_backend()
        )
    return private_key


def sha256_hex(data: str) -> str:
    """Compute SHA256 hash and return as hex string"""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def sign_hash(private_key, hash_hex: str) -> str:
    """Sign a hash with ECDSA and return base64-encoded signature"""
    if not CRYPTO_AVAILABLE or private_key is None:
        return ""

    # Convert hex hash to bytes
    hash_bytes = bytes.fromhex(hash_hex)

    # Sign the hash (not the data) - use Prehashed since we already have the hash
    from cryptography.hazmat.primitives.asymmetric.utils import Prehashed
    signature = private_key.sign(
        hash_bytes,
        ec.ECDSA(Prehashed(hashes.SHA256()))
    )

    # Return base64 encoded signature
    return base64.b64encode(signature).decode("utf-8")


def generate_sensor_data():
    return {
        "device_id": DEVICE_ID,
        "temperature": random.uniform(15.0, 40.0),
        "humidity_air": random.uniform(30.0, 90.0),
        "humidity_soil": random.uniform(20.0, 80.0),
        "luminosity": random.randint(1000, 100000),
    }


def format_json_like_esp32(data: dict) -> str:
    """Format JSON exactly like ESP32's snprintf with %.2f for floats"""
    return (
        '{"device_id":"%s","temperature":%.2f,"humidity_air":%.2f,'
        '"humidity_soil":%.2f,"luminosity":%d,"timestamp":%d}'
    ) % (
        data["device_id"],
        data["temperature"],
        data["humidity_air"],
        data["humidity_soil"],
        data["luminosity"],
        data["timestamp"],
    )


def send_reading():
    # Load private key
    private_key = load_private_key()
    if private_key is None and CRYPTO_AVAILABLE:
        print(f"Error: Could not load private key from {PRIVATE_KEY_PATH}")
        return None

    # Generate sensor data with timestamp
    data = generate_sensor_data()
    data["timestamp"] = int(time.time())

    # Convert to JSON (format exactly like ESP32's snprintf)
    json_payload = format_json_like_esp32(data)

    # Compute hash
    data_hash = sha256_hex(json_payload)

    # Sign the hash
    signature = sign_hash(private_key, data_hash)

    # Build headers with authentication
    headers = {
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "X-Device-ID": DEVICE_ID,
        "X-Data-Hash": data_hash,
        "X-Signature": signature,
        "X-Timestamp": str(data["timestamp"]),
    }

    print(f"Sending data: {data}")
    print(f"Hash: {data_hash[:32]}...")
    print(f"Signature: {signature[:32]}...")

    req = urllib.request.Request(
        FUNCTION_URL,
        data=json_payload.encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = json.loads(response.read().decode("utf-8"))
            print(f"Status: {status}")
            print(f"Response: {json.dumps(body, indent=2)}")
            return body
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(f"Response: {json.loads(e.read().decode('utf-8'))}")
        return None


if __name__ == "__main__":
    if not CRYPTO_AVAILABLE:
        print("\nPlease install cryptography: pip install cryptography")
    else:
        send_reading()
