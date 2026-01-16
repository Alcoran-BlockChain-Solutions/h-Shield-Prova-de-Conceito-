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

    unsigned long tRequestStart = millis();

    DEBUG_PRINTLN("");
    DEBUG_PRINTLN("╔══════════════════════════════════════════════════════════╗");
    DEBUG_PRINTF("║ REQUEST #%lu\n", stats.total);
    DEBUG_PRINTLN("╚══════════════════════════════════════════════════════════╝");

    Led::on();

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Build JSON payload
    // ─────────────────────────────────────────────────────────────
    unsigned long t1 = millis();

    unsigned long timestamp = millis() / 1000;
    char json[300];
    int jsonLen = snprintf(json, sizeof(json),
        "{\"device_id\":\"%s\",\"temperature\":%.2f,\"humidity_air\":%.2f,\"humidity_soil\":%.2f,\"luminosity\":%d,\"timestamp\":%lu}",
        device_id, reading.temperature, reading.humidity_air, reading.humidity_soil, reading.luminosity, timestamp);

    unsigned long tBuildJson = millis() - t1;

    DEBUG_PRINTLN("┌─ STEP 1: Build JSON ─────────────────────────────────────┐");
    DEBUG_PRINTF("│ Time: %lu ms\n", tBuildJson);
    DEBUG_PRINTF("│ Size: %d bytes\n", jsonLen);
    DEBUG_PRINTF("│ JSON: %.60s...\n", json);
    DEBUG_PRINTLN("└──────────────────────────────────────────────────────────┘");

    // ─────────────────────────────────────────────────────────────
    // STEP 2: Compute SHA256 hash
    // ─────────────────────────────────────────────────────────────
    unsigned long t2 = millis();
    String dataHash = Crypto::sha256(json);
    unsigned long tHash = millis() - t2;

    if (dataHash.isEmpty()) {
        Serial.println("[HTTP] ERROR: Failed to generate hash!");
        Led::error();
        StatsManager::incrementFailed();
        return;
    }

    DEBUG_PRINTLN("┌─ STEP 2: SHA256 Hash ────────────────────────────────────┐");
    DEBUG_PRINTF("│ Time: %lu ms\n", tHash);
    DEBUG_PRINTF("│ Input: %d bytes -> Output: %d chars\n", jsonLen, dataHash.length());
    DEBUG_PRINTF("│ Hash: %s\n", dataHash.c_str());
    DEBUG_PRINTLN("└──────────────────────────────────────────────────────────┘");

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Sign hash with ECDSA
    // ─────────────────────────────────────────────────────────────
    unsigned long t3 = millis();
    String signature = Crypto::sign(dataHash.c_str());
    unsigned long tSign = millis() - t3;

    if (signature.isEmpty()) {
        Serial.println("[HTTP] ERROR: Failed to sign payload!");
        Led::error();
        StatsManager::incrementFailed();
        return;
    }

    DEBUG_PRINTLN("┌─ STEP 3: ECDSA Signature ────────────────────────────────┐");
    DEBUG_PRINTF("│ Time: %lu ms\n", tSign);
    DEBUG_PRINTF("│ Input: 64 chars (hash) -> Output: %d chars (base64)\n", signature.length());
    DEBUG_PRINTF("│ Sig: %.50s...\n", signature.c_str());
    DEBUG_PRINTLN("└──────────────────────────────────────────────────────────┘");

    // ─────────────────────────────────────────────────────────────
    // STEP 4: HTTP POST request
    // ─────────────────────────────────────────────────────────────
    char url[256];
    snprintf(url, sizeof(url), "%s/oracle", SUPABASE_URL);

    // Calculate total request size (headers + body)
    int headerSize = strlen(device_id) + dataHash.length() + signature.length() + 100; // approx

    DEBUG_PRINTLN("┌─ STEP 4: HTTP POST ──────────────────────────────────────┐");
    DEBUG_PRINTF("│ URL: %s\n", url);
    DEBUG_PRINTF("│ Body size: %d bytes\n", jsonLen);
    DEBUG_PRINTF("│ Headers size: ~%d bytes\n", headerSize);
    DEBUG_PRINTF("│ Total payload: ~%d bytes\n", jsonLen + headerSize);

    HTTPClient http;
    http.begin(url);
    http.setTimeout(HTTP_TIMEOUT_MS);

    // Headers
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
    http.addHeader("X-Device-ID", device_id);
    http.addHeader("X-Data-Hash", dataHash);
    http.addHeader("X-Signature", signature);
    http.addHeader("X-Timestamp", String(timestamp));

    unsigned long t4 = millis();
    int httpCode = http.POST(json);
    unsigned long tHttp = millis() - t4;

    String response = http.getString();
    http.end();

    Led::off();

    DEBUG_PRINTF("│ HTTP Time: %lu ms\n", tHttp);
    DEBUG_PRINTF("│ HTTP Code: %d\n", httpCode);
    DEBUG_PRINTF("│ Response size: %d bytes\n", response.length());
    DEBUG_PRINTLN("└──────────────────────────────────────────────────────────┘");

    // ─────────────────────────────────────────────────────────────
    // SUMMARY
    // ─────────────────────────────────────────────────────────────
    unsigned long tTotal = millis() - tRequestStart;

    DEBUG_PRINTLN("┌─ SUMMARY ────────────────────────────────────────────────┐");
    DEBUG_PRINTF("│ 1. Build JSON:    %4lu ms\n", tBuildJson);
    DEBUG_PRINTF("│ 2. SHA256 Hash:   %4lu ms\n", tHash);
    DEBUG_PRINTF("│ 3. ECDSA Sign:    %4lu ms\n", tSign);
    DEBUG_PRINTF("│ 4. HTTP Request:  %4lu ms\n", tHttp);
    DEBUG_PRINTLN("│ ──────────────────────────────────");
    DEBUG_PRINTF("│ TOTAL:            %4lu ms\n", tTotal);
    DEBUG_PRINTLN("│");
    DEBUG_PRINTF("│ Crypto overhead:  %4lu ms (%.1f%%)\n", tHash + tSign, 100.0 * (tHash + tSign) / tTotal);
    DEBUG_PRINTF("│ Network time:     %4lu ms (%.1f%%)\n", tHttp, 100.0 * tHttp / tTotal);
    DEBUG_PRINTLN("└──────────────────────────────────────────────────────────┘");

    // ─────────────────────────────────────────────────────────────
    // Process response
    // ─────────────────────────────────────────────────────────────
    if (httpCode == 200 || httpCode == 201) {
        StatsManager::incrementSuccess();

        if (response.indexOf("\"success\":true") > 0 || response.indexOf("\"tx_hash\"") > 0) {
            StatsManager::incrementBlockchainSuccess();
            Led::successBlockchain();

            int hashStart = response.indexOf("\"tx_hash\":\"");
            if (hashStart > 0) {
                hashStart += 11;
                int hashEnd = response.indexOf("\"", hashStart);
                String txHash = response.substring(hashStart, hashEnd);
                Serial.printf("[%04lu] OK + blockchain: %.16s... (%lu ms)\n", stats.total, txHash.c_str(), tTotal);
            } else {
                Serial.printf("[%04lu] OK + blockchain (%lu ms)\n", stats.total, tTotal);
            }
        } else {
            StatsManager::incrementBlockchainFailed();
            Led::success();
            Serial.printf("[%04lu] OK (blockchain failed) (%lu ms)\n", stats.total, tTotal);
        }
    } else {
        StatsManager::incrementFailed();
        Led::error();
        Serial.printf("[%04lu] FAILED: HTTP %d (%lu ms)\n", stats.total, httpCode, tTotal);
        DEBUG_PRINTF("[HTTP] Error response: %s\n", response.c_str());
    }

    if (stats.total % 60 == 0) {
        StatsManager::print();
    }

    DEBUG_PRINTLN("");
}

} // namespace HttpClient
