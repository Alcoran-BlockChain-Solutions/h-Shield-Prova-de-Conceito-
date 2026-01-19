/*
 * HarvestShield ESP32 Firmware
 * Envia dados de sensores simulados para Supabase Edge Function
 *
 * Zero dependencias externas - apenas bibliotecas nativas ESP32
 */

#include <Arduino.h>
#include "led.h"
#include "wifi_manager.h"
#include "sensors.h"
#include "app_controller.h"
#include "stats.h"
#include "crypto.h"
#include "time_manager.h"
#include "key_manager.h"

// Configuracoes do dispositivo
#define INTERVAL_MS 1000
#define SERIAL_BAUD 115200

void setup() {
    Serial.begin(SERIAL_BAUD);
    delay(1000);

    // Inicializar modulos (ordem importante)
    Led::init();
    KeyManager::init();      // Carrega chave privada do NVS
    Sensors::init();
    StatsManager::init();    // Carrega stats do NVS
    Crypto::init();

    Serial.println("\n============================================================");
    Serial.println("ESP32 FIRMWARE - HarvestShield");
    Serial.println("============================================================");
    Serial.printf("Device ID:    %s\n", KeyManager::getDeviceId().c_str());
    Serial.printf("MAC Address:  %s\n", KeyManager::getMacAddress().c_str());
    Serial.printf("Private Key:  %s\n", KeyManager::hasPrivateKey() ? "OK (NVS)" : "MISSING!");
    Serial.printf("Interval:     %d ms\n", INTERVAL_MS);
    Serial.printf("LED Pin:      GPIO%d\n", LED_PIN);
    Serial.println("============================================================");
    Serial.println("Public Key (PEM):");
    Serial.println(Crypto::getPublicKeyPEM());
    Serial.println("============================================================\n");

    // LED inicial - boot
    Led::blink(3, BLINK_FAST);

    // Conectar WiFi
    WiFiManager::connect();

    // Sincronizar tempo via NTP (requer WiFi)
    Serial.println("Sincronizando horario via NTP...");
    TimeManager::init();
    if (TimeManager::isSynced()) {
        Serial.printf("NTP OK: %s\n", TimeManager::getTimeString().c_str());
    } else {
        Serial.println("AVISO: NTP nao sincronizado, usando fallback");
    }

    // Initialize AppController (after WiFi and other subsystems)
    AppController::init();

    // LED - pronto para operar
    Led::blink(2, BLINK_NORMAL);

    Serial.println("\nIniciando envio de dados...\n");
}

void loop() {
    // Verificar conexao WiFi (non-blocking)
    if (!WiFiManager::isConnected()) {
        WiFiManager::tryReconnect();
        delay(INTERVAL_MS);
        return;  // Skip this cycle if not connected
    }

    // Execute one reading cycle (sensors -> PoW -> sign -> HTTP)
    AppController::runCycle();

    // Aguardar intervalo
    delay(INTERVAL_MS);
}
