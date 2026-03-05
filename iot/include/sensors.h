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
}

#endif // SENSORS_H
