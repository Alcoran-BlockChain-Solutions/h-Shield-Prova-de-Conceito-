import json
import os
import random
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

# Configuration - Easy to change
DEVICE_ID = "esp32-farm-012"

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")  # e.g. http://127.0.0.1:54321/functions/v1
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
FUNCTION_URL = f"{SUPABASE_URL}/oracle"


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

    print(f"Sending data: {data}")

    req = urllib.request.Request(
        FUNCTION_URL,
        data=json.dumps(data).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = json.loads(response.read().decode("utf-8"))
            print(f"Status: {status}")
            print(f"Response: {body}")
            return body
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(f"Response: {json.loads(e.read().decode('utf-8'))}")
        return None


if __name__ == "__main__":
    send_reading()
