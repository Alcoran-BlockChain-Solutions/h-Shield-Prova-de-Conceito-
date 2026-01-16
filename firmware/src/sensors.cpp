/*
 * HarvestShield - Sensors Module
 * Leitura de sensores (simulados por enquanto)
 */

#include "sensors.h"

namespace Sensors {

void init() {
    // Seed para numeros aleatorios
    randomSeed(analogRead(0));
}

SensorReading read() {
    SensorReading reading;
    reading.temperature = randomFloat(15.0, 40.0);
    reading.humidity_air = randomFloat(30.0, 90.0);
    reading.humidity_soil = randomFloat(20.0, 80.0);
    reading.luminosity = random(1000, 100001);
    return reading;
}

float randomFloat(float min, float max) {
    return min + (float)random(0, 10001) / 10000.0 * (max - min);
}

} // namespace Sensors
