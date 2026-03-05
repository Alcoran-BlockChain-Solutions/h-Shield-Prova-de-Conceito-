/*
 * HarvestShield - Sensors Module
 * Aggregates all individual sensor readings
 * Includes disaster simulation every 20 readings (5 readings duration)
 */

#include "sensors.h"
#include "sensors/temperature.h"
#include "sensors/humidity_air.h"
#include "sensors/humidity_soil.h"
#include "sensors/luminosity.h"
#include "config.h"

namespace Sensors {

// Disaster simulation state
static unsigned long readingCount = 0;
static const unsigned long DISASTER_INTERVAL = 20;
static const unsigned long DISASTER_DURATION = 5;

enum DisasterType { NONE, DROUGHT, STORM, FROST };
static DisasterType currentDisaster = NONE;
static unsigned long disasterReadingsLeft = 0;
static unsigned long nextDisasterType = 0;  // cycles: 0=drought, 1=storm, 2=frost

// Disaster target values
struct DisasterProfile {
    float temp;
    float humAir;
    float humSoil;
    int   lum;
};

static const DisasterProfile PROFILES[] = {
    { 45.0,  15.0,   5.0, 100000 },  // DROUGHT
    { 18.0,  99.0,  95.0,    100 },  // STORM
    {  2.0,  20.0,  10.0,    500 },  // FROST
};

static const char* DISASTER_NAMES[] = { "SECA", "TEMPESTADE", "GEADA" };

void init() {
    randomSeed(analogRead(0));

    Temperature::init();
    HumidityAir::init();
    HumiditySoil::init();
    Luminosity::init();
}

SensorReading read() {
    readingCount++;

    // Check if a new disaster should start
    if (currentDisaster == NONE && readingCount % DISASTER_INTERVAL == 0) {
        currentDisaster = (DisasterType)(nextDisasterType + 1);  // +1 because NONE=0
        disasterReadingsLeft = DISASTER_DURATION;
        nextDisasterType = (nextDisasterType + 1) % 3;

        DEBUG_PRINTF("[DISASTER] >>> %s started! (readings %lu-%lu)\n",
            DISASTER_NAMES[currentDisaster - 1],
            readingCount, readingCount + DISASTER_DURATION - 1);
    }

    SensorReading reading;

    if (currentDisaster != NONE) {
        // During disaster: push values toward extreme targets with small jitter
        const DisasterProfile& p = PROFILES[currentDisaster - 1];
        float jitter = ((float)random(0, 101) / 100.0 - 0.5) * 2.0;

        reading.temperature  = p.temp    + jitter * 1.5;
        reading.humidity_air = p.humAir  + jitter * 2.0;
        reading.humidity_soil = p.humSoil + jitter * 1.0;
        reading.luminosity   = p.lum     + (int)(jitter * 200);

        // Clamp
        if (reading.humidity_air  > 100.0) reading.humidity_air  = 100.0;
        if (reading.humidity_air  <   0.0) reading.humidity_air  =   0.0;
        if (reading.humidity_soil > 100.0) reading.humidity_soil = 100.0;
        if (reading.humidity_soil <   0.0) reading.humidity_soil =   0.0;
        if (reading.luminosity    <     0) reading.luminosity    =     0;

        disasterReadingsLeft--;
        DEBUG_PRINTF("[DISASTER] %s | %lu readings left\n",
            DISASTER_NAMES[currentDisaster - 1], disasterReadingsLeft);

        if (disasterReadingsLeft == 0) {
            DEBUG_PRINTF("[DISASTER] <<< %s ended\n", DISASTER_NAMES[currentDisaster - 1]);
            currentDisaster = NONE;
        }
    } else {
        // Normal operation
        reading.temperature  = Temperature::read();
        reading.humidity_air = HumidityAir::read();
        reading.humidity_soil = HumiditySoil::read();
        reading.luminosity   = Luminosity::read();
    }

    return reading;
}

} // namespace Sensors
