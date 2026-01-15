import json
import os
import urllib.request
import urllib.parse

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
DEVICE_ID = None  # Set to filter by device, e.g. "esp32-farm-012"
LIMIT = 10
OFFSET = 0
START_DATE = None  # e.g. "2025-01-01T00:00:00"
END_DATE = None    # e.g. "2025-12-31T23:59:59"

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")  # e.g. http://127.0.0.1:54321/functions/v1
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
FUNCTION_URL = f"{SUPABASE_URL}/get-readings"


def get_readings():
    # Build query params
    params = {"limit": LIMIT, "offset": OFFSET}

    if DEVICE_ID:
        params["device_id"] = DEVICE_ID
    if START_DATE:
        params["start_date"] = START_DATE
    if END_DATE:
        params["end_date"] = END_DATE

    url = f"{FUNCTION_URL}?{urllib.parse.urlencode(params)}"

    headers = {
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
    }

    print(f"Fetching readings with params: {params}")

    req = urllib.request.Request(url, headers=headers, method="GET")

    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = json.loads(response.read().decode("utf-8"))
            print(f"Status: {status}")
            print(f"Count: {body.get('count', 0)}")
            print(f"Readings:")
            for reading in body.get("readings", []):
                print(f"  - {reading['device_id']} | {reading['temperature']}°C | {reading['humidity_air']}% air | {reading['humidity_soil']}% soil | {reading['luminosity']} lux | {reading['created_at']}")
            return body
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(f"Response: {json.loads(e.read().decode('utf-8'))}")
        return None


if __name__ == "__main__":
    get_readings()
