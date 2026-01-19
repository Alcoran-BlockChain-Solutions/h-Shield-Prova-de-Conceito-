/*
 * HarvestShield - HTTP Client Module
 * Comunicacao HTTP com o backend Supabase
 * Com autenticacao ECDSA + PoW para IoT
 *
 * Fluxo:
 * 1. Ler dados dos sensores
 * 2. Construir string de dados: "temp-X;hum_air-Y;hum_soil-Z;lum-W"
 * 3. PoW: encontrar nonce onde SHA256(data + nonce) comeca com "000"
 * 4. Assinar o hash do PoW com ECDSA
 * 5. Enviar para o oracle com retry/backoff
 */

#include "http_client.h"
#include "config.h"
#include "led.h"
#include "stats.h"
#include "crypto.h"
#include "sensors.h"
#include "time_manager.h"
#include "key_manager.h"
#include <HTTPClient.h>

namespace HttpClient {

// Retry configuration
static const int MAX_RETRIES = 3;
static const int INITIAL_BACKOFF_MS = 1000;  // 1 second
static const int MAX_BACKOFF_MS = 8000;      // 8 seconds

// PoW difficulty (3 = hash starts with "000", ~4096 attempts avg)
static const uint8_t POW_DIFFICULTY = 3;

// Perform HTTP POST with exponential backoff retry
static int postWithRetry(HTTPClient& http, const char* payload, String& response) {
    int retries = 0;
    int backoffMs = INITIAL_BACKOFF_MS;
    int httpCode = -1;

    while (retries <= MAX_RETRIES) {
        httpCode = http.POST(payload);

        if (httpCode == 200 || httpCode == 201 || httpCode == 202) {
            response = http.getString();
            return httpCode;
        }

        // Don't retry on client errors (4xx)
        if (httpCode >= 400 && httpCode < 500) {
            response = http.getString();
            DEBUG_PRINTF("[HTTP] Client error %d, not retrying\n", httpCode);
            return httpCode;
        }

        retries++;
        if (retries <= MAX_RETRIES) {
            DEBUG_PRINTF("[HTTP] Request failed (%d), retry %d/%d in %dms\n",
                         httpCode, retries, MAX_RETRIES, backoffMs);
            delay(backoffMs);
            backoffMs = min(backoffMs * 2, MAX_BACKOFF_MS);  // Exponential backoff
        }
    }

    response = http.getString();
    return httpCode;
}

void sendReading(const char* device_id_unused, const SensorReading& reading) {
    StatsManager::incrementTotal();
    Stats& stats = StatsManager::get();

    // Use device ID from KeyManager (MAC-based)
    String deviceId = KeyManager::getDeviceId();

    // ===== REQUEST START =====
    Serial.println();
    Serial.printf(">>> REQUEST #%lu ========================================\n", stats.total);

    unsigned long tStart = millis();
    Led::on();

    // 1. Build data string for PoW
    unsigned long t = millis();
    String dataString = Sensors::buildDataString(reading);
    unsigned long tData = millis() - t;

    DEBUG_PRINTF("[IoT] Data: %s\n", dataString.c_str());

    // 2. Proof of Work: SHA256(data + nonce) until hash starts with "000"
    t = millis();
    Crypto::PoWResult pow = Crypto::computePoW(dataString.c_str(), POW_DIFFICULTY);
    unsigned long tPoW = millis() - t;

    if (!pow.success) {
        Serial.println("[IoT] PoW FAIL - could not find valid nonce");
        Led::error();
        StatsManager::incrementFailed();
        return;
    }

    DEBUG_PRINTF("[IoT] PoW: nonce=%u hash=%s\n", pow.nonce, pow.hash.c_str());

    // 3. ECDSA Sign the PoW hash
    t = millis();
    String signature = Crypto::sign(pow.hash.c_str());
    unsigned long tSign = millis() - t;

    if (signature.isEmpty()) {
        Serial.println("[IoT] Sign FAIL");
        Led::error();
        StatsManager::incrementFailed();
        return;
    }

    // 4. Build JSON payload with real timestamp
    t = millis();
    unsigned long timestamp = TimeManager::getTimestamp();
    char json[400];
    snprintf(json, sizeof(json),
        "{\"device_id\":\"%s\",\"temperature\":%.2f,\"humidity_air\":%.2f,\"humidity_soil\":%.2f,\"luminosity\":%d,\"timestamp\":%lu}",
        deviceId.c_str(), reading.temperature, reading.humidity_air, reading.humidity_soil, reading.luminosity, timestamp);
    unsigned long tJson = millis() - t;

    // 5. HTTP POST with retry
    char url[256];
    snprintf(url, sizeof(url), "%s/oracle", SUPABASE_URL);

    HTTPClient http;
    http.begin(url);
    http.setTimeout(HTTP_TIMEOUT_MS);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
    http.addHeader("X-Device-ID", deviceId);
    http.addHeader("X-PoW-Data", dataString);
    http.addHeader("X-PoW-Nonce", String(pow.nonce));
    http.addHeader("X-PoW-Hash", pow.hash);
    http.addHeader("X-Signature", signature);
    http.addHeader("X-Timestamp", String(timestamp));

    t = millis();
    String response;
    int httpCode = postWithRetry(http, json, response);
    unsigned long tHttp = millis() - t;

    http.end();
    Led::off();

    unsigned long tTotal = millis() - tStart;

    // Log: etapa e tempo
    Serial.printf("[IoT] #%lu | Data:%lu PoW:%lu Sign:%lu JSON:%lu HTTP:%lu | Total:%lums\n",
        stats.total, tData, tPoW, tSign, tJson, tHttp, tTotal);

    // Process response
    const char* result;
    if (httpCode == 200 || httpCode == 201 || httpCode == 202) {
        StatsManager::incrementSuccess();

        bool hasBlockchainTx = response.indexOf("\"tx_hash\":\"") > 0 &&
                               response.indexOf("\"tx_hash\":null") < 0;
        bool isPending = response.indexOf("\"status\":\"pending\"") > 0;

        if (hasBlockchainTx) {
            StatsManager::incrementBlockchainSuccess();
            Led::successBlockchain();
            int hashStart = response.indexOf("\"tx_hash\":\"") + 11;
            int hashEnd = response.indexOf("\"", hashStart);
            String txHash = response.substring(hashStart, hashEnd);
            Serial.printf("    TX: %.16s...\n", txHash.c_str());
            result = "OK + BLOCKCHAIN";
        } else if (isPending || httpCode == 202) {
            StatsManager::incrementBlockchainSuccess();
            Led::success();
            result = "OK (pending)";
        } else {
            StatsManager::incrementBlockchainFailed();
            Led::success();
            result = "OK (no blockchain)";
        }
    } else {
        StatsManager::incrementFailed();
        Led::error();
        result = "FAILED";
        Serial.printf("    HTTP Error: %d | %s\n", httpCode, response.c_str());
    }

    // ===== REQUEST END =====
    Serial.printf("<<< #%lu | %s | %lums ============================\n", stats.total, result, tTotal);

    // Persist stats periodically
    if (stats.total % 10 == 0) {
        StatsManager::save();
    }

    if (stats.total % 60 == 0) {
        StatsManager::print();
    }
}

} // namespace HttpClient
