/*
 * HarvestShield - Crypto Module
 * ECDSA signing and SHA256 hashing for IoT authentication
 */

#include "crypto.h"
#include "config.h"
#include <mbedtls/sha256.h>
#include <mbedtls/pk.h>
#include <mbedtls/entropy.h>
#include <mbedtls/ctr_drbg.h>
#include <mbedtls/base64.h>
#include <mbedtls/error.h>

namespace Crypto {

// Static contexts for mbedTLS
static mbedtls_pk_context pk;
static mbedtls_entropy_context entropy;
static mbedtls_ctr_drbg_context ctr_drbg;
static bool initialized = false;

void init() {
    if (initialized) return;

    DEBUG_PRINTLN("[Crypto] ========================================");
    DEBUG_PRINTLN("[Crypto] Initializing ECDSA module...");
    DEBUG_PRINTLN("[Crypto] ========================================");

    // Initialize contexts
    DEBUG_PRINTLN("[Crypto] Initializing mbedTLS contexts...");
    mbedtls_pk_init(&pk);
    mbedtls_entropy_init(&entropy);
    mbedtls_ctr_drbg_init(&ctr_drbg);
    DEBUG_PRINTLN("[Crypto] Contexts initialized");

    // Seed the random number generator
    DEBUG_PRINTLN("[Crypto] Seeding RNG...");
    const char* pers = "harvestshield_ecdsa";
    int ret = mbedtls_ctr_drbg_seed(&ctr_drbg, mbedtls_entropy_func, &entropy,
                                    (const unsigned char*)pers, strlen(pers));
    if (ret != 0) {
        char error_buf[100];
        mbedtls_strerror(ret, error_buf, sizeof(error_buf));
        Serial.printf("[Crypto] ERROR: Failed to seed RNG: %s\n", error_buf);
        return;
    }
    DEBUG_PRINTLN("[Crypto] RNG seeded successfully");

    // Parse the private key from config.h
    DEBUG_PRINTLN("[Crypto] Parsing private key...");
    DEBUG_PRINTF("[Crypto] Key length: %d bytes\n", strlen(DEVICE_PRIVATE_KEY));

    ret = mbedtls_pk_parse_key(&pk,
        (const unsigned char*)DEVICE_PRIVATE_KEY,
        strlen(DEVICE_PRIVATE_KEY) + 1,
        NULL, 0);

    if (ret != 0) {
        char error_buf[100];
        mbedtls_strerror(ret, error_buf, sizeof(error_buf));
        Serial.printf("[Crypto] ERROR: Failed to parse private key: %s (code: -0x%04x)\n", error_buf, -ret);
        return;
    }
    DEBUG_PRINTLN("[Crypto] Private key parsed successfully");

    // Verify it's an EC key
    DEBUG_PRINTLN("[Crypto] Verifying key type...");
    if (!mbedtls_pk_can_do(&pk, MBEDTLS_PK_ECDSA)) {
        Serial.println("[Crypto] ERROR: Key is not ECDSA!");
        return;
    }

    const char* key_name = mbedtls_pk_get_name(&pk);
    DEBUG_PRINTF("[Crypto] Key type: %s\n", key_name);
    DEBUG_PRINTF("[Crypto] Key size: %d bits\n", (int)mbedtls_pk_get_bitlen(&pk));

    initialized = true;
    DEBUG_PRINTLN("[Crypto] ========================================");
    DEBUG_PRINTLN("[Crypto] ECDSA initialized successfully!");
    DEBUG_PRINTLN("[Crypto] ========================================");
}

bool isInitialized() {
    return initialized;
}

String sha256(const char* data) {
    DEBUG_PRINTLN("[Crypto] ----------------------------------------");
    DEBUG_PRINTLN("[Crypto] Computing SHA256 hash...");
    DEBUG_PRINTF("[Crypto] Input length: %d bytes\n", strlen(data));
    DEBUG_PRINTF("[Crypto] Input preview: %.50s...\n", data);

    unsigned char hash[32];

    // Compute SHA-256 (void function in ESP32's mbedtls)
    mbedtls_sha256((const unsigned char*)data, strlen(data), hash, 0);

    // Convert to hex string
    char hex[65];
    for (int i = 0; i < 32; i++) {
        sprintf(hex + (i * 2), "%02x", hash[i]);
    }
    hex[64] = '\0';

    DEBUG_PRINTF("[Crypto] SHA256 hash: %s\n", hex);
    DEBUG_PRINTLN("[Crypto] ----------------------------------------");

    return String(hex);
}

String sign(const char* hexHash) {
    DEBUG_PRINTLN("[Crypto] ----------------------------------------");
    DEBUG_PRINTLN("[Crypto] Signing hash with ECDSA...");
    DEBUG_PRINTF("[Crypto] Hash to sign: %s\n", hexHash);

    if (!initialized) {
        Serial.println("[Crypto] ERROR: Not initialized!");
        return "";
    }

    // Convert hex hash string to bytes
    DEBUG_PRINTLN("[Crypto] Converting hex hash to bytes...");
    unsigned char hashBytes[32];
    for (int i = 0; i < 32; i++) {
        unsigned int byte;
        sscanf(hexHash + (i * 2), "%2x", &byte);
        hashBytes[i] = (unsigned char)byte;
    }

    // Sign the hash
    DEBUG_PRINTLN("[Crypto] Calling mbedtls_pk_sign...");
    unsigned char sig[MBEDTLS_PK_SIGNATURE_MAX_SIZE];
    size_t sig_len = 0;

    int ret = mbedtls_pk_sign(&pk, MBEDTLS_MD_SHA256,
        hashBytes, 32,
        sig, &sig_len,
        mbedtls_ctr_drbg_random, &ctr_drbg);

    if (ret != 0) {
        char error_buf[100];
        mbedtls_strerror(ret, error_buf, sizeof(error_buf));
        Serial.printf("[Crypto] ERROR: Sign failed: %s\n", error_buf);
        return "";
    }

    DEBUG_PRINTF("[Crypto] Signature length: %d bytes\n", sig_len);

    // Base64 encode the signature
    DEBUG_PRINTLN("[Crypto] Base64 encoding signature...");
    unsigned char base64[256];
    size_t base64_len = 0;

    ret = mbedtls_base64_encode(base64, sizeof(base64), &base64_len, sig, sig_len);
    if (ret != 0) {
        Serial.printf("[Crypto] ERROR: Base64 encode failed: %d\n", ret);
        return "";
    }

    base64[base64_len] = '\0';

    DEBUG_PRINTF("[Crypto] Base64 signature: %s\n", (char*)base64);
    DEBUG_PRINTF("[Crypto] Base64 length: %d chars\n", base64_len);
    DEBUG_PRINTLN("[Crypto] Signing complete!");
    DEBUG_PRINTLN("[Crypto] ----------------------------------------");

    return String((char*)base64);
}

} // namespace Crypto
