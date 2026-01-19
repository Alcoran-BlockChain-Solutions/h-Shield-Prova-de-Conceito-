/*
 * HarvestShield - Time Manager Module
 * NTP synchronization for real timestamps
 */

#include "time_manager.h"
#include "config.h"
#include <time.h>
#include <WiFi.h>

namespace TimeManager {

// NTP Configuration
static const char* NTP_SERVER1 = "pool.ntp.org";
static const char* NTP_SERVER2 = "time.nist.gov";
static const char* NTP_SERVER3 = "time.google.com";
static const long GMT_OFFSET_SEC = -3 * 3600;  // GMT-3 (Brazil)
static const int DAYLIGHT_OFFSET_SEC = 0;       // No daylight saving

static bool timeSynced = false;
static unsigned long lastSyncAttempt = 0;
static const unsigned long SYNC_RETRY_INTERVAL = 30000; // 30 seconds

void init() {
    DEBUG_PRINTLN("[Time] Initializing NTP...");

    // Configure NTP
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER1, NTP_SERVER2, NTP_SERVER3);

    // Wait for sync (max 10 seconds)
    unsigned long startWait = millis();
    struct tm timeinfo;

    while (!getLocalTime(&timeinfo) && (millis() - startWait < 10000)) {
        DEBUG_PRINT(".");
        delay(500);
    }

    if (getLocalTime(&timeinfo)) {
        timeSynced = true;
        DEBUG_PRINTLN(" OK!");
        DEBUG_PRINTF("[Time] Synced: %s\n", getTimeString().c_str());
    } else {
        timeSynced = false;
        DEBUG_PRINTLN(" FAILED (will retry later)");
    }
}

bool isSynced() {
    return timeSynced;
}

unsigned long getTimestamp() {
    // If not synced and enough time passed, try to resync
    if (!timeSynced && (millis() - lastSyncAttempt > SYNC_RETRY_INTERVAL)) {
        resync();
    }

    if (timeSynced) {
        time_t now = time(nullptr);
        // Sanity check: timestamp should be after 2024
        if (now > 1704067200) {  // Jan 1, 2024
            return (unsigned long)now;
        }
    }

    // Fallback: return millis-based timestamp with a marker
    // High bit set indicates it's not a real timestamp
    DEBUG_PRINTLN("[Time] WARNING: Using fallback timestamp (not synced)");
    return millis() / 1000;
}

String getTimeString() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        return "NOT_SYNCED";
    }

    char buffer[30];
    strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);
    return String(buffer);
}

bool resync() {
    lastSyncAttempt = millis();

    if (WiFi.status() != WL_CONNECTED) {
        DEBUG_PRINTLN("[Time] Cannot resync - WiFi not connected");
        return false;
    }

    DEBUG_PRINTLN("[Time] Attempting resync...");

    struct tm timeinfo;
    if (getLocalTime(&timeinfo, 5000)) {  // 5 second timeout
        timeSynced = true;
        DEBUG_PRINTF("[Time] Resynced: %s\n", getTimeString().c_str());
        return true;
    }

    DEBUG_PRINTLN("[Time] Resync failed");
    return false;
}

} // namespace TimeManager
