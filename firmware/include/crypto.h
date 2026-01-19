/*
 * HarvestShield - Crypto Module
 * ECDSA signing and SHA256 hashing for IoT authentication
 */

#ifndef CRYPTO_H
#define CRYPTO_H

#include <Arduino.h>

namespace Crypto {
    // Initialize crypto module (loads private key)
    void init();

    // Generate SHA256 hash of data (returns hex string)
    String sha256(const char* data);

    // Sign a hash with ECDSA private key (returns base64 signature)
    String sign(const char* hash);

    // Check if crypto is initialized
    bool isInitialized();

    // Get public key in PEM format (derived from private key)
    String getPublicKeyPEM();

    // Proof of Work result structure
    struct PoWResult {
        uint32_t nonce;
        String hash;
        bool success;
    };

    // Compute Proof of Work: finds nonce where SHA256(data + nonce) starts with difficulty zeros
    PoWResult computePoW(const char* data, uint8_t difficulty = 2);
}

#endif // CRYPTO_H
