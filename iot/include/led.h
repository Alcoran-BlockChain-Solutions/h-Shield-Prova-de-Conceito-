/*
 * HarvestShield - LED Module
 * Controle do LED integrado do ESP32
 */

#ifndef LED_H
#define LED_H

#include <Arduino.h>

// Configuracao do LED
#define LED_PIN 2  // LED integrado do ESP32 (GPIO2)

// Padroes de LED (em ms)
#define BLINK_FAST 50
#define BLINK_NORMAL 150
#define BLINK_SLOW 300

namespace Led {
    void init();
    void on();
    void off();
    void blink(int times, int duration);
    void success();
    void successBlockchain();
    void error();
}

#endif // LED_H
