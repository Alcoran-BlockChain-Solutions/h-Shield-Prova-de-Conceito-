/*
 * HarvestShield - Soil Humidity Sensor
 * Simulated soil humidity readings
 */

#ifndef HUMIDITY_SOIL_H
#define HUMIDITY_SOIL_H

#include <Arduino.h>

namespace HumiditySoil {
    // Initialize soil humidity sensor
    void init();

    // Read soil humidity percentage (simulated: 20.0 to 80.0)
    float read();
}

#endif // HUMIDITY_SOIL_H
