/*
 * HarvestShield - HTTP Client Module
 * Comunicacao HTTP com o backend Supabase
 */

#include "http_client.h"
#include "config.h"
#include "led.h"
#include "stats.h"
#include <HTTPClient.h>

namespace HttpClient {

void sendReading(const char* device_id, const SensorReading& reading) {
    StatsManager::incrementTotal();
    Stats& stats = StatsManager::get();

    // LED indica que esta enviando
    Led::on();

    // Montar JSON manualmente com snprintf (zero dependencias!)
    char json[200];
    snprintf(json, sizeof(json),
        "{\"device_id\":\"%s\",\"temperature\":%.2f,\"humidity_air\":%.2f,\"humidity_soil\":%.2f,\"luminosity\":%d}",
        device_id, reading.temperature, reading.humidity_air, reading.humidity_soil, reading.luminosity);

    // Montar URL
    char url[256];
    snprintf(url, sizeof(url), "%s/oracle", SUPABASE_URL);

    // Enviar HTTP POST
    HTTPClient http;
    http.begin(url);
    http.setTimeout(HTTP_TIMEOUT_MS);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);

    int httpCode = http.POST(json);
    String response = http.getString();
    http.end();

    // Desligar LED apos request
    Led::off();

    // Processar resposta
    if (httpCode == 200 || httpCode == 201) {
        StatsManager::incrementSuccess();

        // Parse simples para verificar blockchain success
        if (response.indexOf("\"success\":true") > 0 || response.indexOf("\"tx_hash\"") > 0) {
            StatsManager::incrementBlockchainSuccess();
            // LED: 2 piscadas rapidas = sucesso com blockchain
            Led::successBlockchain();

            // Extrair tx_hash de forma simples
            int hashStart = response.indexOf("\"tx_hash\":\"");
            if (hashStart > 0) {
                hashStart += 11;
                int hashEnd = response.indexOf("\"", hashStart);
                String txHash = response.substring(hashStart, hashEnd);
                Serial.printf("[%04lu] OK + blockchain: %.16s...\n", stats.total, txHash.c_str());
            } else {
                Serial.printf("[%04lu] OK + blockchain\n", stats.total);
            }
        } else {
            StatsManager::incrementBlockchainFailed();
            // LED: 1 piscada = sucesso mas sem blockchain
            Led::success();
            Serial.printf("[%04lu] OK (blockchain failed)\n", stats.total);
        }
    } else {
        StatsManager::incrementFailed();
        // LED: 3 piscadas lentas = erro
        Led::error();
        Serial.printf("[%04lu] FAILED: HTTP %d\n", stats.total, httpCode);
    }

    // Mostrar stats a cada 60 leituras
    if (stats.total % 60 == 0) {
        StatsManager::print();
    }
}

} // namespace HttpClient
