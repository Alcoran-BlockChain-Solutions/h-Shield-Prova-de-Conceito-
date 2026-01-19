/*
 * HarvestShield - Luminosity Sensor
 * Simulated luminosity readings
 */

#ifndef LUMINOSITY_H
#define LUMINOSITY_H

#include <Arduino.h>

namespace Luminosity {
    // Initialize luminosity sensor
    void init();

    // Read luminosity in lux (simulated: 1000 to 100000)
    int read();
}

#endif // LUMINOSITY_H
