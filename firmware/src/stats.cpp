/*
 * HarvestShield - Stats Module
 * Estatisticas de operacao
 */

#include "stats.h"

static Stats stats = {0, 0, 0, 0, 0, 0};

namespace StatsManager {

void init() {
    stats = {0, 0, 0, 0, 0, 0};
    stats.start_time = millis();
}

Stats& get() {
    return stats;
}

void incrementTotal() {
    stats.total++;
}

void incrementSuccess() {
    stats.success++;
}

void incrementFailed() {
    stats.failed++;
}

void incrementBlockchainSuccess() {
    stats.blockchain_success++;
}

void incrementBlockchainFailed() {
    stats.blockchain_failed++;
}

void print() {
    unsigned long elapsed = (millis() - stats.start_time) / 1000;
    float hours = elapsed / 3600.0;

    Serial.println("\n============================================================");
    Serial.println("STATS");
    Serial.println("============================================================");
    Serial.printf("Runtime:              %lu s (%.2f h)\n", elapsed, hours);
    Serial.printf("Total requests:       %lu\n", stats.total);
    Serial.printf("Success:              %lu\n", stats.success);
    Serial.printf("Failed:               %lu\n", stats.failed);
    Serial.printf("Blockchain success:   %lu\n", stats.blockchain_success);
    Serial.printf("Blockchain failed:    %lu\n", stats.blockchain_failed);
    if (elapsed > 0) {
        Serial.printf("Rate:                 %.2f req/s\n", (float)stats.total / elapsed);
    }

    // Estimativa de custos Stellar
    float xlm_per_tx = 0.00001;
    float xlm_spent = stats.blockchain_success * xlm_per_tx;
    float xlm_per_hour = (hours > 0) ? (stats.blockchain_success / hours) * xlm_per_tx : 0;

    Serial.println("------------------------------------------------------------");
    Serial.println("STELLAR COSTS (testnet - free, but simulating mainnet)");
    Serial.println("------------------------------------------------------------");
    Serial.printf("XLM spent:            %.6f XLM\n", xlm_spent);
    Serial.printf("XLM per hour:         %.6f XLM\n", xlm_per_hour);
    Serial.printf("XLM per day:          %.6f XLM\n", xlm_per_hour * 24);
    Serial.printf("XLM per month:        %.6f XLM\n", xlm_per_hour * 24 * 30);
    Serial.println("============================================================\n");
}

} // namespace StatsManager
