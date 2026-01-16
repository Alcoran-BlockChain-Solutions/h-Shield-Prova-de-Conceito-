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
    String getIP();
}

#endif // WIFI_MANAGER_H
