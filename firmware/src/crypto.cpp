/*
 * HarvestShield - Crypto Module
 * ECDSA signing and SHA256 hashing for IoT authentication
 */

#include "crypto.h"
#include "config.h"
#include "key_manager.h"
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

// Maximum input size for PoW (to prevent buffer overflow)
static const size_t MAX_POW_INPUT_SIZE = 500;

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

    // Get private key from KeyManager (NVS)
    t0 = millis();
    String privateKey = KeyManager::getPrivateKey();

    if (privateKey.length() == 0) {
        Serial.println("[Crypto] ERROR: No private key available!");
        Serial.println("[Crypto] Please provision a key using KeyManager::provisionKey()");
        return;
    }

    size_t keyLen = privateKey.length();
    ret = mbedtls_pk_parse_key(&pk,
        (const unsigned char*)privateKey.c_str(),
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

String getPublicKeyPEM() {
    if (!initialized) {
        return "";
    }

    unsigned char buf[512];
    int ret = mbedtls_pk_write_pubkey_pem(&pk, buf, sizeof(buf));

    if (ret != 0) {
        char error_buf[100];
        mbedtls_strerror(ret, error_buf, sizeof(error_buf));
        Serial.printf("[Crypto] ERROR: Failed to export public key: %s\n", error_buf);
        return "";
    }

    return String((char*)buf);
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

    // Web Crypto API does SHA256 of the message before verifying
    // So we must sign SHA256(hex_string), not the raw hash bytes
    // This way both sides compute: sign/verify(SHA256("000abc...64chars"))
    unsigned char messageHash[32];
    mbedtls_sha256((const unsigned char*)hexHash, strlen(hexHash), messageHash, 0);

    unsigned long tConvert = millis() - t0;

    // Sign the hash
    unsigned long tSignStart = millis();
    unsigned char sig[MBEDTLS_PK_SIGNATURE_MAX_SIZE];
    size_t sig_len = 0;

    int ret = mbedtls_pk_sign(&pk, MBEDTLS_MD_SHA256,
        messageHash, 32,
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

PoWResult computePoW(const char* data, uint8_t difficulty) {
    unsigned long t0 = millis();
    const uint32_t MAX_ATTEMPTS = 1000000;  // Increased for higher difficulty

    PoWResult result;
    result.nonce = 0;
    result.success = false;

    // SECURITY FIX: Validate input size to prevent buffer overflow
    size_t dataLen = strlen(data);
    if (dataLen > MAX_POW_INPUT_SIZE) {
        Serial.printf("[Crypto] ERROR: PoW input too large (%d > %d bytes)\n",
                      dataLen, MAX_POW_INPUT_SIZE);
        return result;
    }

    // Buffer sized for max data + max uint32 string (10 digits) + null
    char input[MAX_POW_INPUT_SIZE + 12];

    for (uint32_t nonce = 0; nonce < MAX_ATTEMPTS; nonce++) {
        // Build input: data + nonce as string
        snprintf(input, sizeof(input), "%s%u", data, nonce);

        // Compute SHA256
        unsigned char hash[32];
        mbedtls_sha256((const unsigned char*)input, strlen(input), hash, 0);

        // Check difficulty: count leading zero bytes/nibbles
        bool valid = true;
        for (uint8_t i = 0; i < difficulty / 2; i++) {
            if (hash[i] != 0x00) {
                valid = false;
                break;
            }
        }
        // Handle odd difficulty (e.g., difficulty=1 means first nibble is 0)
        if (valid && (difficulty % 2 == 1)) {
            if ((hash[difficulty / 2] & 0xF0) != 0x00) {
                valid = false;
            }
        }

        if (valid) {
            result.nonce = nonce;
            result.success = true;

            // Convert hash to hex string
            char hex[65];
            for (int i = 0; i < 32; i++) {
                sprintf(hex + (i * 2), "%02x", hash[i]);
            }
            hex[64] = '\0';
            result.hash = String(hex);

            unsigned long elapsed = millis() - t0;
            DEBUG_PRINTF("[Crypto] PoW: %lu ms | nonce: %u | attempts: %u | difficulty: %d\n",
                         elapsed, nonce, nonce + 1, difficulty);
            return result;
        }
    }

    unsigned long elapsed = millis() - t0;
    Serial.printf("[Crypto] PoW FAILED: %lu ms | max attempts: %u | difficulty: %d\n",
                  elapsed, MAX_ATTEMPTS, difficulty);
    return result;
}

} // namespace Crypto
