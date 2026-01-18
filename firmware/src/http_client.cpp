/*
 * HarvestShield - HTTP Client Module
 * Comunicacao HTTP com o backend Supabase
 * Com autenticacao ECDSA para IoT
 */

#include "http_client.h"
#include "config.h"
#include "led.h"
#include "stats.h"
#include "crypto.h"
#include <HTTPClient.h>
#include <time.h>

namespace HttpClient {

void sendReading(const char* device_id, const SensorReading& reading) {
    StatsManager::incrementTotal();
    Stats& stats = StatsManager::get();

    // ===== REQUEST START =====
    Serial.println();
    Serial.printf(">>> REQUEST #%lu ========================================\n", stats.total);

    unsigned long tStart = millis();
    Led::on();

    // 1. Build JSON
    unsigned long t = millis();
    unsigned long timestamp = millis() / 1000;
    char json[300];
    snprintf(json, sizeof(json),
        "{\"device_id\":\"%s\",\"temperature\":%.2f,\"humidity_air\":%.2f,\"humidity_soil\":%.2f,\"luminosity\":%d,\"timestamp\":%lu}",
        device_id, reading.temperature, reading.humidity_air, reading.humidity_soil, reading.luminosity, timestamp);
    unsigned long tJson = millis() - t;

    // 2. SHA256
    t = millis();
    String dataHash = Crypto::sha256(json);
    unsigned long tHash = millis() - t;

    if (dataHash.isEmpty()) {
        Serial.println("[IoT] Hash FAIL");
        Led::error();
        StatsManager::incrementFailed();
        return;
    }

    // 3. ECDSA Sign
    t = millis();
    String signature = Crypto::sign(dataHash.c_str());
    unsigned long tSign = millis() - t;

    if (signature.isEmpty()) {
        Serial.println("[IoT] Sign FAIL");
        Led::error();
        StatsManager::incrementFailed();
        return;
    }

    // 4. HTTP POST
    char url[256];
    snprintf(url, sizeof(url), "%s/oracle", SUPABASE_URL);

    HTTPClient http;
    http.begin(url);
    http.setTimeout(HTTP_TIMEOUT_MS);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
    http.addHeader("X-Device-ID", device_id);
    http.addHeader("X-Data-Hash", dataHash);
    http.addHeader("X-Signature", signature);
    http.addHeader("X-Timestamp", String(timestamp));

    t = millis();
    int httpCode = http.POST(json);
    unsigned long tHttp = millis() - t;

    String response = http.getString();
    http.end();
    Led::off();

    unsigned long tTotal = millis() - tStart;

    // Log: etapa e tempo
    Serial.printf("[IoT] #%lu | JSON:%lu Hash:%lu Sign:%lu HTTP:%lu | Total:%lums\n",
        stats.total, tJson, tHash, tSign, tHttp, tTotal);

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
        Serial.printf("    HTTP Error: %d\n", httpCode);
    }

    // ===== REQUEST END =====
    Serial.printf("<<< #%lu | %s | %lums ============================\n", stats.total, result, tTotal);

    if (stats.total % 60 == 0) {
        StatsManager::print();
    }
}

} // namespace HttpClient
