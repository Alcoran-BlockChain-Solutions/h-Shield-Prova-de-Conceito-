/*
 * HarvestShield - Sensors Module
 * Aggregates all individual sensor readings
 */

#include "sensors.h"
#include "sensors/temperature.h"
#include "sensors/humidity_air.h"
#include "sensors/humidity_soil.h"
#include "sensors/luminosity.h"

namespace Sensors {

void init() {
    // Seed for random numbers (used by simulated sensors)
    randomSeed(analogRead(0));

    // Initialize each sensor
    Temperature::init();
    HumidityAir::init();
    HumiditySoil::init();
    Luminosity::init();
}

SensorReading read() {
    SensorReading reading;
    reading.temperature = Temperature::read();
    reading.humidity_air = HumidityAir::read();
    reading.humidity_soil = HumiditySoil::read();
    reading.luminosity = Luminosity::read();
    return reading;
}

} // namespace Sensors
