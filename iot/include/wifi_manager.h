/*
 * HarvestShield - WiFi Manager Module
 * Gerenciamento de conexao WiFi
 */

#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <WiFi.h>

namespace WiFiManager {
    void connect();
    bool isConnected();
    void ensureConnection();
    bool tryReconnect();  // Non-blocking reconnection attempt
    String getIP();
    int getReconnectAttempts();
}

#endif // WIFI_MANAGER_H
