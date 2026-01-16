/*
 * HarvestShield - Sensors Module
 * Leitura de sensores (simulados por enquanto)
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
    void init();
    SensorReading read();
    float randomFloat(float min, float max);
}

#endif // SENSORS_H
