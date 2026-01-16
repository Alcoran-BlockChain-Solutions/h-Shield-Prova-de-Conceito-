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

    unsigned long startTotal = millis();

    DEBUG_PRINTLN("[Crypto] ========================================");
    DEBUG_PRINTLN("[Crypto] Initializing ECDSA module...");
    DEBUG_PRINTLN("[Crypto] ========================================");

    // Initialize contexts
    unsigned long t0 = millis();
    mbedtls_pk_init(&pk);
    mbedtls_entropy_init(&entropy);
    mbedtls_ctr_drbg_init(&ctr_drbg);
    DEBUG_PRINTF("[Crypto] Context init: %lu ms\n", millis() - t0);

    // Seed the random number generator
    t0 = millis();
    const char* pers = "harvestshield_ecdsa";
    int ret = mbedtls_ctr_drbg_seed(&ctr_drbg, mbedtls_entropy_func, &entropy,
                                    (const unsigned char*)pers, strlen(pers));
    if (ret != 0) {
        char error_buf[100];
        mbedtls_strerror(ret, error_buf, sizeof(error_buf));
        Serial.printf("[Crypto] ERROR: Failed to seed RNG: %s\n", error_buf);
        return;
    }
    DEBUG_PRINTF("[Crypto] RNG seed: %lu ms\n", millis() - t0);

    // Parse the private key from config.h
    t0 = millis();
    size_t keyLen = strlen(DEVICE_PRIVATE_KEY);
    ret = mbedtls_pk_parse_key(&pk,
        (const unsigned char*)DEVICE_PRIVATE_KEY,
        keyLen + 1,
        NULL, 0);

    if (ret != 0) {
        char error_buf[100];
        mbedtls_strerror(ret, error_buf, sizeof(error_buf));
        Serial.printf("[Crypto] ERROR: Failed to parse key: %s (code: -0x%04x)\n", error_buf, -ret);
        return;
    }
    DEBUG_PRINTF("[Crypto] Key parse: %lu ms (key size: %d bytes)\n", millis() - t0, keyLen);

    // Verify it's an EC key
    if (!mbedtls_pk_can_do(&pk, MBEDTLS_PK_ECDSA)) {
        Serial.println("[Crypto] ERROR: Key is not ECDSA!");
        return;
    }

    const char* key_name = mbedtls_pk_get_name(&pk);
    int key_bits = (int)mbedtls_pk_get_bitlen(&pk);
    DEBUG_PRINTF("[Crypto] Key type: %s, %d bits\n", key_name, key_bits);

    initialized = true;
    DEBUG_PRINTLN("[Crypto] ========================================");
    DEBUG_PRINTF("[Crypto] INIT COMPLETE - Total: %lu ms\n", millis() - startTotal);
    DEBUG_PRINTLN("[Crypto] ========================================");
}

bool isInitialized() {
    return initialized;
}

String sha256(const char* data) {
    unsigned long t0 = millis();
    size_t inputLen = strlen(data);

    unsigned char hash[32];
    mbedtls_sha256((const unsigned char*)data, inputLen, hash, 0);

    // Convert to hex string
    char hex[65];
    for (int i = 0; i < 32; i++) {
        sprintf(hex + (i * 2), "%02x", hash[i]);
    }
    hex[64] = '\0';

    unsigned long elapsed = millis() - t0;
    DEBUG_PRINTF("[Crypto] SHA256: %lu ms | in: %d bytes -> out: 64 chars\n", elapsed, inputLen);

    return String(hex);
}

String sign(const char* hexHash) {
    if (!initialized) {
        Serial.println("[Crypto] ERROR: Not initialized!");
        return "";
    }

    unsigned long t0 = millis();

    // Convert hex hash string to bytes
    unsigned char hashBytes[32];
    for (int i = 0; i < 32; i++) {
        unsigned int byte;
        sscanf(hexHash + (i * 2), "%2x", &byte);
        hashBytes[i] = (unsigned char)byte;
    }

    unsigned long tConvert = millis() - t0;

    // Sign the hash
    unsigned long tSignStart = millis();
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

    unsigned long tSign = millis() - tSignStart;

    // Base64 encode the signature
    unsigned long tB64Start = millis();
    unsigned char base64[256];
    size_t base64_len = 0;

    ret = mbedtls_base64_encode(base64, sizeof(base64), &base64_len, sig, sig_len);
    if (ret != 0) {
        Serial.printf("[Crypto] ERROR: Base64 encode failed: %d\n", ret);
        return "";
    }
    base64[base64_len] = '\0';

    unsigned long tB64 = millis() - tB64Start;
    unsigned long tTotal = millis() - t0;

    DEBUG_PRINTF("[Crypto] ECDSA Sign: %lu ms | convert: %lu ms, sign: %lu ms, b64: %lu ms\n",
                 tTotal, tConvert, tSign, tB64);
    DEBUG_PRINTF("[Crypto] Signature: %d bytes DER -> %d chars base64\n", sig_len, base64_len);

    return String((char*)base64);
}

} // namespace Crypto
