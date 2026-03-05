/*
 * HarvestShield - LED Module
 * Controle do LED integrado do ESP32
 */

#include "led.h"

namespace Led {

void init() {
    pinMode(LED_PIN, OUTPUT);
    off();
}

void on() {
    digitalWrite(LED_PIN, HIGH);
}

void off() {
    digitalWrite(LED_PIN, LOW);
}

void blink(int times, int duration) {
    for (int i = 0; i < times; i++) {
        on();
        delay(duration);
        off();
        if (i < times - 1) {
            delay(duration);
        }
    }
}

// 1 piscada rapida = sucesso (sem blockchain)
void success() {
    blink(1, BLINK_FAST);
}

// 2 piscadas rapidas = sucesso com blockchain
void successBlockchain() {
    blink(2, BLINK_FAST);
}

// 3 piscadas lentas = erro
void error() {
    blink(3, BLINK_SLOW);
}

} // namespace Led
