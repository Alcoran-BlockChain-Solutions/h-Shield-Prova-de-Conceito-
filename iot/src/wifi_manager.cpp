/*
 * HarvestShield - WiFi Manager Module
 * Gerenciamento de conexao WiFi com reconexao non-blocking
 */

#include "wifi_manager.h"
#include "config.h"
#include "led.h"

namespace WiFiManager {

// State for non-blocking reconnection
static bool reconnecting = false;
static unsigned long lastReconnectAttempt = 0;
static int reconnectAttempts = 0;
static const int MAX_RECONNECT_ATTEMPTS = 10;
static const unsigned long RECONNECT_INTERVAL_MS = 5000;

void connect() {
    Serial.printf("Conectando ao WiFi: %s", WIFI_SSID);

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        // LED pisca lento enquanto conecta
        Led::on();
        delay(250);
        Led::off();
        delay(250);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println(" OK!");
        Serial.printf("IP: %s\n", WiFi.localIP().toString().c_str());
        Led::successBlockchain();
        reconnecting = false;
        reconnectAttempts = 0;
    } else {
        Serial.println(" FALHOU!");
        Serial.println("Reiniciando em 5 segundos...");
        Led::error();
        delay(5000);
        ESP.restart();
    }
}

bool isConnected() {
    return WiFi.status() == WL_CONNECTED;
}

bool tryReconnect() {
    // Already connected? Reset state and return true
    if (isConnected()) {
        if (reconnecting) {
            Serial.println("WiFi reconectado!");
            Led::successBlockchain();
        }
        reconnecting = false;
        reconnectAttempts = 0;
        return true;
    }

    unsigned long now = millis();

    // First time disconnecting or enough time passed?
    if (!reconnecting || (now - lastReconnectAttempt >= RECONNECT_INTERVAL_MS)) {
        reconnecting = true;
        lastReconnectAttempt = now;
        reconnectAttempts++;

        Serial.printf("WiFi desconectado. Tentativa %d/%d...\n",
                      reconnectAttempts, MAX_RECONNECT_ATTEMPTS);

        // Non-blocking: just initiate connection
        WiFi.disconnect();
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

        // Visual feedback
        Led::blink(1, 100);

        // Check if max attempts exceeded
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            Serial.println("Max reconnect attempts reached. Restarting...");
            Led::error();
            delay(1000);
            ESP.restart();
        }
    }

    return false;  // Still trying to reconnect
}

void ensureConnection() {
    if (!isConnected()) {
        Serial.println("WiFi desconectado! Reconectando...");
        connect();
    }
}

String getIP() {
    return WiFi.localIP().toString();
}

int getReconnectAttempts() {
    return reconnectAttempts;
}

} // namespace WiFiManager
