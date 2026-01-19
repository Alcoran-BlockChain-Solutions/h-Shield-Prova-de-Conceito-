/*
 * HarvestShield - Air Humidity Sensor
 * Simulated air humidity readings with random walk
 */

#include "humidity_air.h"

namespace HumidityAir {

static bool initialized = false;
static float currentValue = 60.0;  // Start at moderate humidity

// Configuration
static const float MIN_VALUE = 30.0;
static const float MAX_VALUE = 90.0;
static const float MAX_STEP = 1.0;  // Max change per reading

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

} // namespace HumidityAir
