/*
 * HarvestShield - Sensors Module
 * Aggregates all individual sensor readings
 */

#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>

struct SensorReading {
    float temperature;
    float humidity_air;
    float humidity_soil;
    int luminosity;
};

namespace Sensors {
    // Initialize all sensors
    void init();

    // Read all sensors and return aggregated data
    SensorReading read();

    // Build data string for PoW: "temp-25.50;hum_air-60.00;hum_soil-45.00;lum-1000"
    String buildDataString(const SensorReading& reading);
}

#endif // SENSORS_H
