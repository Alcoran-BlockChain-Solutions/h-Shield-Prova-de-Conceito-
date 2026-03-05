/*
 * HarvestShield - App Controller
 * Main orchestrator for the sensor reading cycle
 */

#ifndef APP_CONTROLLER_H
#define APP_CONTROLLER_H

#include <Arduino.h>
#include "error_types.h"

namespace AppController {

// Timing breakdown for each cycle phase
struct CycleTiming {
    unsigned long sensorMs;
    unsigned long powMs;
    unsigned long signMs;
    unsigned long jsonMs;
    unsigned long httpMs;
    unsigned long totalMs;
};

// Cycle result with status and timing
struct CycleResult {
    ErrorCode error;
    CycleTiming timing;
    int httpCode;
    bool hasBlockchainTx;

    bool ok() const { return error == ErrorCode::OK; }
};

// Initialize all subsystems
// Returns true if all subsystems initialized successfully
bool init();

// Execute one reading cycle:
// 1. Read sensors
// 2. Build data string for PoW
// 3. Compute PoW
// 4. Sign the PoW hash
// 5. Build JSON payload
// 6. Send HTTP request with retry
// 7. Update stats
CycleResult runCycle();

// Get timing from the last cycle
CycleTiming getLastTiming();

} // namespace AppController

#endif // APP_CONTROLLER_H
