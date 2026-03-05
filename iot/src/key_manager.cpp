/*
 * HarvestShield - Key Manager Module
 * Secure key storage using NVS (Non-Volatile Storage)
 */

#include "key_manager.h"
#include "config.h"
#include <Preferences.h>
#include <esp_system.h>

namespace KeyManager {

static Preferences prefs;
static const char* NVS_NAMESPACE = "harvest_keys";
static const char* KEY_PRIVKEY = "privkey";
static String cachedDeviceId = "";
static String cachedPrivateKey = "";
static bool initialized = false;

void init() {
    if (initialized) return;

    DEBUG_PRINTLN("[KeyMgr] Initializing...");

    // Generate device ID from MAC
    uint64_t mac = ESP.getEfuseMac();
    char idBuf[24];
    snprintf(idBuf, sizeof(idBuf), "esp32-%012llx", mac);
    cachedDeviceId = String(idBuf);

    DEBUG_PRINTF("[KeyMgr] Device ID: %s\n", cachedDeviceId.c_str());

    // Load private key from NVS
    prefs.begin(NVS_NAMESPACE, true);  // read-only
    cachedPrivateKey = prefs.getString(KEY_PRIVKEY, "");
    prefs.end();

    if (cachedPrivateKey.length() > 0) {
        DEBUG_PRINTLN("[KeyMgr] Private key loaded from NVS");
    } else {
        DEBUG_PRINTLN("[KeyMgr] No private key in NVS");

        // For backward compatibility: use hardcoded key if defined and provision it
        #ifdef DEVICE_PRIVATE_KEY
        DEBUG_PRINTLN("[KeyMgr] Provisioning from config.h (one-time migration)...");
        if (provisionKey(DEVICE_PRIVATE_KEY)) {
            DEBUG_PRINTLN("[KeyMgr] Key migrated to NVS successfully");
        }
        #endif
    }

    initialized = true;
}

bool hasPrivateKey() {
    return cachedPrivateKey.length() > 0;
}

String getPrivateKey() {
    return cachedPrivateKey;
}

bool setPrivateKey(const char* key) {
    if (hasPrivateKey()) {
        DEBUG_PRINTLN("[KeyMgr] ERROR: Key already exists, use provisionKey for initial setup");
        return false;
    }
    return provisionKey(key);
}

String getDeviceId() {
    return cachedDeviceId;
}

String getMacAddress() {
    uint8_t mac[6];
    esp_efuse_mac_get_default(mac);
    char macStr[18];
    snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    return String(macStr);
}

bool provisionKey(const char* key) {
    if (key == nullptr || strlen(key) < 100) {  // Basic validation
        DEBUG_PRINTLN("[KeyMgr] ERROR: Invalid key format");
        return false;
    }

    prefs.begin(NVS_NAMESPACE, false);  // read-write
    bool success = prefs.putString(KEY_PRIVKEY, key);
    prefs.end();

    if (success) {
        cachedPrivateKey = String(key);
        DEBUG_PRINTLN("[KeyMgr] Key provisioned successfully");
    } else {
        DEBUG_PRINTLN("[KeyMgr] ERROR: Failed to store key in NVS");
    }

    return success;
}

void clearKeys() {
    DEBUG_PRINTLN("[KeyMgr] WARNING: Clearing all keys!");
    prefs.begin(NVS_NAMESPACE, false);
    prefs.clear();
    prefs.end();
    cachedPrivateKey = "";
}

} // namespace KeyManager
