/*
 * HarvestShield - Temperature Sensor
 * Simulated temperature readings with random walk
 */

#include "temperature.h"

namespace Temperature {

static bool initialized = false;
static float currentValue = 25.0;  // Start at room temperature

// Configuration
static const float MIN_VALUE = 15.0;
static const float MAX_VALUE = 40.0;
static const float MAX_STEP = 0.5;  // Max change per reading

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

} // namespace Temperature
