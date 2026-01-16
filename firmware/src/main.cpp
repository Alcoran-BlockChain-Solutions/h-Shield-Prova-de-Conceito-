/*
 * HarvestShield ESP32 Firmware
 * Envia dados de sensores simulados para Supabase Edge Function
 *
 * Zero dependencias externas - apenas bibliotecas nativas ESP32
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include "config.h"

// Configuracoes do dispositivo
#define DEVICE_ID "esp32-farm-001"
#define INTERVAL_MS 1000
#define SERIAL_BAUD 115200

// Configuracao do LED
#define LED_PIN 2  // LED integrado do ESP32 (GPIO2)

// Padroes de LED (em ms)
#define BLINK_FAST 50
#define BLINK_NORMAL 150
#define BLINK_SLOW 300

// Timeout HTTP (blockchain pode demorar)
#define HTTP_TIMEOUT_MS 15000

// Estatisticas
struct Stats {
    unsigned long total;
    unsigned long success;
    unsigned long failed;
    unsigned long blockchain_success;
    unsigned long blockchain_failed;
    unsigned long start_time;
} stats = {0, 0, 0, 0, 0, 0};

// Prototipos
void connectWiFi();
void sendReading();
void printStats();
float randomFloat(float min, float max);

// Prototipos LED
void ledOn();
void ledOff();
void ledBlink(int times, int duration);
void ledSuccess();
void ledSuccessBlockchain();
void ledError();

void setup() {
    Serial.begin(SERIAL_BAUD);
    delay(1000);

    // Configurar LED
    pinMode(LED_PIN, OUTPUT);
    ledOff();

    Serial.println("\n============================================================");
    Serial.println("ESP32 FIRMWARE - HarvestShield");
    Serial.println("============================================================");
    Serial.printf("Device ID:    %s\n", DEVICE_ID);
    Serial.printf("Interval:     %d ms\n", INTERVAL_MS);
    Serial.printf("LED Pin:      GPIO%d\n", LED_PIN);
    Serial.println("============================================================\n");

    // Seed para numeros aleatorios
    randomSeed(analogRead(0));

    // LED inicial - boot
    ledBlink(3, BLINK_FAST);

    // Conectar WiFi
    connectWiFi();

    // Iniciar contagem
    stats.start_time = millis();

    // LED - pronto para operar
    ledBlink(2, BLINK_NORMAL);

    Serial.println("\nIniciando envio de dados...\n");
}

void loop() {
    // Verificar conexao WiFi
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi desconectado! Reconectando...");
        connectWiFi();
    }

    // Enviar leitura
    sendReading();

    // Aguardar intervalo
    delay(INTERVAL_MS);
}

void connectWiFi() {
    Serial.printf("Conectando ao WiFi: %s", WIFI_SSID);

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        // LED pisca lento enquanto conecta
        ledOn();
        delay(250);
        ledOff();
        delay(250);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println(" OK!");
        Serial.printf("IP: %s\n", WiFi.localIP().toString().c_str());
        // LED sucesso na conexao
        ledSuccessBlockchain();
    } else {
        Serial.println(" FALHOU!");
        Serial.println("Reiniciando em 5 segundos...");
        // LED erro antes de reiniciar
        ledError();
        delay(5000);
        ESP.restart();
    }
}

void sendReading() {
    stats.total++;

    // LED indica que esta enviando
    ledOn();

    // Gerar dados simulados
    float temperature = randomFloat(15.0, 40.0);
    float humidity_air = randomFloat(30.0, 90.0);
    float humidity_soil = randomFloat(20.0, 80.0);
    int luminosity = random(1000, 100001);

    // Montar JSON manualmente com snprintf (zero dependencias!)
    char json[200];
    snprintf(json, sizeof(json),
        "{\"device_id\":\"%s\",\"temperature\":%.2f,\"humidity_air\":%.2f,\"humidity_soil\":%.2f,\"luminosity\":%d}",
        DEVICE_ID, temperature, humidity_air, humidity_soil, luminosity);

    // Montar URL
    char url[256];
    snprintf(url, sizeof(url), "%s/oracle", SUPABASE_URL);

    // Enviar HTTP POST
    HTTPClient http;
    http.begin(url);
    http.setTimeout(HTTP_TIMEOUT_MS);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);

    int httpCode = http.POST(json);
    String response = http.getString();
    http.end();

    // Desligar LED apos request
    ledOff();

    // Processar resposta
    if (httpCode == 200 || httpCode == 201) {
        stats.success++;

        // Parse simples para verificar blockchain success
        if (response.indexOf("\"success\":true") > 0 || response.indexOf("\"tx_hash\"") > 0) {
            stats.blockchain_success++;
            // LED: 2 piscadas rapidas = sucesso com blockchain
            ledSuccessBlockchain();

            // Extrair tx_hash de forma simples
            int hashStart = response.indexOf("\"tx_hash\":\"");
            if (hashStart > 0) {
                hashStart += 11;
                int hashEnd = response.indexOf("\"", hashStart);
                String txHash = response.substring(hashStart, hashEnd);
                Serial.printf("[%04lu] OK + blockchain: %.16s...\n", stats.total, txHash.c_str());
            } else {
                Serial.printf("[%04lu] OK + blockchain\n", stats.total);
            }
        } else {
            stats.blockchain_failed++;
            // LED: 1 piscada = sucesso mas sem blockchain
            ledSuccess();
            Serial.printf("[%04lu] OK (blockchain failed)\n", stats.total);
        }
    } else {
        stats.failed++;
        // LED: 3 piscadas lentas = erro
        ledError();
        Serial.printf("[%04lu] FAILED: HTTP %d\n", stats.total, httpCode);
    }

    // Mostrar stats a cada 60 leituras
    if (stats.total % 60 == 0) {
        printStats();
    }
}

void printStats() {
    unsigned long elapsed = (millis() - stats.start_time) / 1000;
    float hours = elapsed / 3600.0;

    Serial.println("\n============================================================");
    Serial.println("STATS");
    Serial.println("============================================================");
    Serial.printf("Runtime:              %lu s (%.2f h)\n", elapsed, hours);
    Serial.printf("Total requests:       %lu\n", stats.total);
    Serial.printf("Success:              %lu\n", stats.success);
    Serial.printf("Failed:               %lu\n", stats.failed);
    Serial.printf("Blockchain success:   %lu\n", stats.blockchain_success);
    Serial.printf("Blockchain failed:    %lu\n", stats.blockchain_failed);
    if (elapsed > 0) {
        Serial.printf("Rate:                 %.2f req/s\n", (float)stats.total / elapsed);
    }

    // Estimativa de custos Stellar
    float xlm_per_tx = 0.00001;
    float xlm_spent = stats.blockchain_success * xlm_per_tx;
    float xlm_per_hour = (hours > 0) ? (stats.blockchain_success / hours) * xlm_per_tx : 0;

    Serial.println("------------------------------------------------------------");
    Serial.println("STELLAR COSTS (testnet - free, but simulating mainnet)");
    Serial.println("------------------------------------------------------------");
    Serial.printf("XLM spent:            %.6f XLM\n", xlm_spent);
    Serial.printf("XLM per hour:         %.6f XLM\n", xlm_per_hour);
    Serial.printf("XLM per day:          %.6f XLM\n", xlm_per_hour * 24);
    Serial.printf("XLM per month:        %.6f XLM\n", xlm_per_hour * 24 * 30);
    Serial.println("============================================================\n");
}

float randomFloat(float min, float max) {
    return min + (float)random(0, 10001) / 10000.0 * (max - min);
}

// ============================================================
// FUNCOES DE LED
// ============================================================

void ledOn() {
    digitalWrite(LED_PIN, HIGH);
}

void ledOff() {
    digitalWrite(LED_PIN, LOW);
}

void ledBlink(int times, int duration) {
    for (int i = 0; i < times; i++) {
        ledOn();
        delay(duration);
        ledOff();
        if (i < times - 1) {
            delay(duration);
        }
    }
}

// 1 piscada rapida = sucesso (sem blockchain)
void ledSuccess() {
    ledBlink(1, BLINK_FAST);
}

// 2 piscadas rapidas = sucesso com blockchain
void ledSuccessBlockchain() {
    ledBlink(2, BLINK_FAST);
}

// 3 piscadas lentas = erro
void ledError() {
    ledBlink(3, BLINK_SLOW);
}
