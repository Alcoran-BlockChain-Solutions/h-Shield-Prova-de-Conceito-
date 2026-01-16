/*
 * HarvestShield - HTTP Client Module
 * Comunicacao HTTP com o backend Supabase
 */

#ifndef HTTP_CLIENT_H
#define HTTP_CLIENT_H

#include <Arduino.h>
#include "sensors.h"

// Timeout HTTP (blockchain pode demorar)
#define HTTP_TIMEOUT_MS 15000

namespace HttpClient {
    void sendReading(const char* device_id, const SensorReading& reading);
}

#endif // HTTP_CLIENT_H
