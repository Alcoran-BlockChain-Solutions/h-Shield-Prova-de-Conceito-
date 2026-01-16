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
#include "http_client.h"
#include "stats.h"
#include "crypto.h"

// Configuracoes do dispositivo
#define DEVICE_ID "esp32-farm-001"
#define INTERVAL_MS 1000
#define SERIAL_BAUD 115200

void setup() {
    Serial.begin(SERIAL_BAUD);
    delay(1000);

    // Inicializar modulos
    Led::init();
    Sensors::init();
    StatsManager::init();
    Crypto::init();

    Serial.println("\n============================================================");
    Serial.println("ESP32 FIRMWARE - HarvestShield");
    Serial.println("============================================================");
    Serial.printf("Device ID:    %s\n", DEVICE_ID);
    Serial.printf("Interval:     %d ms\n", INTERVAL_MS);
    Serial.printf("LED Pin:      GPIO%d\n", LED_PIN);
    Serial.println("============================================================\n");

    // LED inicial - boot
    Led::blink(3, BLINK_FAST);

    // Conectar WiFi
    WiFiManager::connect();

    // LED - pronto para operar
    Led::blink(2, BLINK_NORMAL);

    Serial.println("\nIniciando envio de dados...\n");
}

void loop() {
    // Verificar conexao WiFi
    WiFiManager::ensureConnection();

    // Ler sensores
    SensorReading reading = Sensors::read();

    // Enviar leitura
    HttpClient::sendReading(DEVICE_ID, reading);

    // Aguardar intervalo
    delay(INTERVAL_MS);
}
