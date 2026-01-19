/*
 * HarvestShield - Payload Builder
 * Builds JSON payloads and headers for HTTP requests
 */

#ifndef PAYLOAD_BUILDER_H
#define PAYLOAD_BUILDER_H

#include <Arduino.h>
#include "sensors.h"

namespace PayloadBuilder {

// Request headers for authenticated requests
struct RequestHeaders {
    String deviceId;
    String powData;
    uint32_t powNonce;
    String powHash;
    String signature;
    unsigned long timestamp;
};

// Build data string for PoW: "temp-25.50;hum_air-60.00;hum_soil-45.00;lum-1000"
String buildDataString(const SensorReading& reading);

// Build JSON body for sensor reading
// Returns number of bytes written (excluding null terminator), or -1 on error
int buildJsonBody(char* buffer, size_t bufferSize, const char* deviceId,
                  const SensorReading& reading, unsigned long timestamp);

} // namespace PayloadBuilder

#endif // PAYLOAD_BUILDER_H
