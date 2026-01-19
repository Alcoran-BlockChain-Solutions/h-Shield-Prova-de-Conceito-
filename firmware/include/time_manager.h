/*
 * HarvestShield - Time Manager Module
 * NTP synchronization for real timestamps
 */

#ifndef TIME_MANAGER_H
#define TIME_MANAGER_H

#include <Arduino.h>

namespace TimeManager {
    // Initialize NTP client and sync time
    void init();

    // Check if time is synchronized
    bool isSynced();

    // Get current Unix timestamp (seconds since 1970)
    // Returns 0 if not synced
    unsigned long getTimestamp();

    // Get formatted time string (for logging)
    String getTimeString();

    // Force resync with NTP server
    bool resync();
}

#endif // TIME_MANAGER_H
