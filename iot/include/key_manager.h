/*
 * HarvestShield - Key Manager Module
 * Secure key storage using NVS (Non-Volatile Storage)
 */

#ifndef KEY_MANAGER_H
#define KEY_MANAGER_H

#include <Arduino.h>

namespace KeyManager {
    // Initialize key manager and load keys from NVS
    void init();

    // Check if private key is stored
    bool hasPrivateKey();

    // Get private key from NVS (returns empty string if not found)
    String getPrivateKey();

    // Store private key in NVS (only works if no key exists - prevents overwrite)
    bool setPrivateKey(const char* key);

    // Get device ID (based on MAC address)
    String getDeviceId();

    // Get MAC address as string
    String getMacAddress();

    // Provision device with initial key (for first-time setup)
    // This should be called during manufacturing/provisioning
    bool provisionKey(const char* key);

    // Clear all stored keys (DANGEROUS - for testing only)
    void clearKeys();
}

#endif // KEY_MANAGER_H
