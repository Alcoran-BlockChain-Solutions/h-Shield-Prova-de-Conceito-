/*
 * HarvestShield - Stats Module
 * Estatisticas de operacao
 */

#ifndef STATS_H
#define STATS_H

#include <Arduino.h>

struct Stats {
    unsigned long total;
    unsigned long success;
    unsigned long failed;
    unsigned long blockchain_success;
    unsigned long blockchain_failed;
    unsigned long start_time;
};

namespace StatsManager {
    void init();
    Stats& get();
    void incrementTotal();
    void incrementSuccess();
    void incrementFailed();
    void incrementBlockchainSuccess();
    void incrementBlockchainFailed();
    void print();
}

#endif // STATS_H
