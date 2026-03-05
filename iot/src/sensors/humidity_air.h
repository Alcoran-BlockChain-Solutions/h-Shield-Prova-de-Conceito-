/*
 * HarvestShield - Air Humidity Sensor
 * Simulated air humidity readings
 */

#ifndef HUMIDITY_AIR_H
#define HUMIDITY_AIR_H

#include <Arduino.h>

namespace HumidityAir {
    // Initialize air humidity sensor
    void init();

    // Read air humidity percentage (simulated: 30.0 to 90.0)
    float read();
}

#endif // HUMIDITY_AIR_H
