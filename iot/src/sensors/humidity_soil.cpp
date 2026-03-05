/*
 * HarvestShield - Soil Humidity Sensor
 * Simulated soil humidity readings with random walk
 */

#include "humidity_soil.h"

namespace HumiditySoil {

static bool initialized = false;
static float currentValue = 50.0;  // Start at moderate soil moisture

// Configuration
static const float MIN_VALUE = 20.0;
static const float MAX_VALUE = 80.0;
static const float MAX_STEP = 0.3;  // Soil changes slower than air

void init() {
    if (initialized) return;
    // Start with random initial value
    currentValue = MIN_VALUE + (float)random(0, 10001) / 10000.0 * (MAX_VALUE - MIN_VALUE);
    initialized = true;
}

float read() {
    // Random walk: small random step from current value
    float step = ((float)random(0, 10001) / 10000.0 - 0.5) * 2.0 * MAX_STEP;
    currentValue += step;

    // Clamp to valid range
    if (currentValue < MIN_VALUE) currentValue = MIN_VALUE;
    if (currentValue > MAX_VALUE) currentValue = MAX_VALUE;

    return currentValue;
}

} // namespace HumiditySoil
