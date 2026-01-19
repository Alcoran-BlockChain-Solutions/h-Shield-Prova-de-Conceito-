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

String buildDataString(const SensorReading& reading) {
    // Format: "temp-25.50;hum_air-60.00;hum_soil-45.00;lum-1000"
    char buffer[128];
    snprintf(buffer, sizeof(buffer),
        "temp-%.2f;hum_air-%.2f;hum_soil-%.2f;lum-%d",
        reading.temperature,
        reading.humidity_air,
        reading.humidity_soil,
        reading.luminosity);
    return String(buffer);
}

} // namespace Sensors
