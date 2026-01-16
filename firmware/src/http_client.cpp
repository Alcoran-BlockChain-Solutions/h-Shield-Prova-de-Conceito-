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

    DEBUG_PRINTLN("");
    DEBUG_PRINTLN("[HTTP] ============================================");
    DEBUG_PRINTF("[HTTP] Request #%lu\n", stats.total);
    DEBUG_PRINTLN("[HTTP] ============================================");

    // LED indica que esta enviando
    Led::on();

    // Obter timestamp (segundos desde boot)
    unsigned long timestamp = millis() / 1000;
    DEBUG_PRINTF("[HTTP] Timestamp: %lu\n", timestamp);

    // Montar JSON com timestamp
    char json[300];
    snprintf(json, sizeof(json),
        "{\"device_id\":\"%s\",\"temperature\":%.2f,\"humidity_air\":%.2f,\"humidity_soil\":%.2f,\"luminosity\":%d,\"timestamp\":%lu}",
        device_id, reading.temperature, reading.humidity_air, reading.humidity_soil, reading.luminosity, timestamp);

    DEBUG_PRINTLN("[HTTP] ----------------------------------------");
    DEBUG_PRINTLN("[HTTP] Payload JSON:");
    DEBUG_PRINTLN(json);
    DEBUG_PRINTF("[HTTP] Payload size: %d bytes\n", strlen(json));
    DEBUG_PRINTLN("[HTTP] ----------------------------------------");

    // Gerar hash SHA256 do payload
    DEBUG_PRINTLN("[HTTP] Generating SHA256 hash of payload...");
    String dataHash = Crypto::sha256(json);

    if (dataHash.isEmpty()) {
        Serial.println("[HTTP] ERROR: Failed to generate hash!");
        Led::error();
        StatsManager::incrementFailed();
        return;
    }

    // Assinar o hash com ECDSA
    DEBUG_PRINTLN("[HTTP] Signing hash with ECDSA...");
    String signature = Crypto::sign(dataHash.c_str());

    if (signature.isEmpty()) {
        Serial.println("[HTTP] ERROR: Failed to sign payload!");
        Led::error();
        StatsManager::incrementFailed();
        return;
    }

    // Montar URL
    char url[256];
    snprintf(url, sizeof(url), "%s/oracle", SUPABASE_URL);

    DEBUG_PRINTLN("[HTTP] ----------------------------------------");
    DEBUG_PRINTLN("[HTTP] Request details:");
    DEBUG_PRINTF("[HTTP] URL: %s\n", url);
    DEBUG_PRINTF("[HTTP] Device ID: %s\n", device_id);
    DEBUG_PRINTF("[HTTP] Data Hash: %s\n", dataHash.c_str());
    DEBUG_PRINTF("[HTTP] Signature: %.40s...\n", signature.c_str());
    DEBUG_PRINTF("[HTTP] Timestamp: %lu\n", timestamp);
    DEBUG_PRINTLN("[HTTP] ----------------------------------------");

    // Enviar HTTP POST
    DEBUG_PRINTLN("[HTTP] Initiating HTTP POST...");
    HTTPClient http;
    http.begin(url);
    http.setTimeout(HTTP_TIMEOUT_MS);
    DEBUG_PRINTF("[HTTP] Timeout: %d ms\n", HTTP_TIMEOUT_MS);

    // Headers padrao
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);

    // Headers de autenticacao IoT
    http.addHeader("X-Device-ID", device_id);
    http.addHeader("X-Data-Hash", dataHash);
    http.addHeader("X-Signature", signature);
    http.addHeader("X-Timestamp", String(timestamp));

    DEBUG_PRINTLN("[HTTP] Headers configured:");
    DEBUG_PRINTLN("[HTTP]   Content-Type: application/json");
    DEBUG_PRINTLN("[HTTP]   Authorization: Bearer ***");
    DEBUG_PRINTF("[HTTP]   X-Device-ID: %s\n", device_id);
    DEBUG_PRINTLN("[HTTP]   X-Data-Hash: (64 chars)");
    DEBUG_PRINTLN("[HTTP]   X-Signature: (base64)");
    DEBUG_PRINTF("[HTTP]   X-Timestamp: %lu\n", timestamp);

    DEBUG_PRINTLN("[HTTP] Sending POST request...");
    unsigned long startTime = millis();

    int httpCode = http.POST(json);

    unsigned long elapsed = millis() - startTime;
    DEBUG_PRINTF("[HTTP] Response time: %lu ms\n", elapsed);
    DEBUG_PRINTF("[HTTP] HTTP code: %d\n", httpCode);

    String response = http.getString();
    http.end();

    // Desligar LED apos request
    Led::off();

    DEBUG_PRINTLN("[HTTP] ----------------------------------------");
    DEBUG_PRINTLN("[HTTP] Response:");
    DEBUG_PRINTLN(response);
    DEBUG_PRINTLN("[HTTP] ----------------------------------------");

    // Processar resposta
    if (httpCode == 200 || httpCode == 201) {
        StatsManager::incrementSuccess();

        // Parse simples para verificar blockchain success
        if (response.indexOf("\"success\":true") > 0 || response.indexOf("\"tx_hash\"") > 0) {
            StatsManager::incrementBlockchainSuccess();
            Led::successBlockchain();

            // Extrair tx_hash de forma simples
            int hashStart = response.indexOf("\"tx_hash\":\"");
            if (hashStart > 0) {
                hashStart += 11;
                int hashEnd = response.indexOf("\"", hashStart);
                String txHash = response.substring(hashStart, hashEnd);
                Serial.printf("[%04lu] OK + blockchain: %.16s...\n", stats.total, txHash.c_str());
                DEBUG_PRINTF("[HTTP] Full tx_hash: %s\n", txHash.c_str());
            } else {
                Serial.printf("[%04lu] OK + blockchain\n", stats.total);
            }
        } else {
            StatsManager::incrementBlockchainFailed();
            Led::success();
            Serial.printf("[%04lu] OK (blockchain failed)\n", stats.total);
        }
    } else {
        StatsManager::incrementFailed();
        Led::error();
        Serial.printf("[%04lu] FAILED: HTTP %d\n", stats.total, httpCode);
        DEBUG_PRINTF("[HTTP] Error response: %s\n", response.c_str());
    }

    // Mostrar stats a cada 60 leituras
    if (stats.total % 60 == 0) {
        StatsManager::print();
    }

    DEBUG_PRINTLN("[HTTP] ============================================");
    DEBUG_PRINTLN("");
}

} // namespace HttpClient
