/*
 * HarvestShield - Luminosity Sensor
 * Simulated luminosity readings with random walk
 */

#include "luminosity.h"

namespace Luminosity {

static bool initialized = false;
static int currentValue = 50000;  // Start at midday light

// Configuration
static const int MIN_VALUE = 1000;
static const int MAX_VALUE = 100000;
static const int MAX_STEP = 2000;  // Light can change quickly

void init() {
    if (initialized) return;
    // Start with random initial value
    currentValue = MIN_VALUE + random(0, MAX_VALUE - MIN_VALUE + 1);
    initialized = true;
}

int read() {
    // Random walk: small random step from current value
    int step = random(-MAX_STEP, MAX_STEP + 1);
    currentValue += step;

    // Clamp to valid range
    if (currentValue < MIN_VALUE) currentValue = MIN_VALUE;
    if (currentValue > MAX_VALUE) currentValue = MAX_VALUE;

    return currentValue;
}

} // namespace Luminosity
