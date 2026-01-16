/*
 * HarvestShield - WiFi Manager Module
 * Gerenciamento de conexao WiFi
 */

#include "wifi_manager.h"
#include "config.h"
#include "led.h"

namespace WiFiManager {

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

void ensureConnection() {
    if (!isConnected()) {
        Serial.println("WiFi desconectado! Reconectando...");
        connect();
    }
}

String getIP() {
    return WiFi.localIP().toString();
}

} // namespace WiFiManager
