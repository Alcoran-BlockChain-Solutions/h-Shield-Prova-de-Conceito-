/*
 * HarvestShield - Temperature Sensor
 * Simulated temperature readings
 */

#ifndef TEMPERATURE_H
#define TEMPERATURE_H

#include <Arduino.h>

namespace Temperature {
    // Initialize temperature sensor
    void init();

    // Read temperature in Celsius (simulated: 15.0 to 40.0)
    float read();
}

#endif // TEMPERATURE_H
