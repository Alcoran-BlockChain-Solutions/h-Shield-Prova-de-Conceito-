/*
 * HarvestShield - Payload Builder
 * Builds JSON payloads and headers for HTTP requests
 */

#include "payload_builder.h"

namespace PayloadBuilder {

String buildDataString(const SensorReading& reading) {
    // Format: "temp-25.50;hum_air-60.00;hum_soil-45.00;lum-1000"
    char buffer[128];
    snprintf(buffer, sizeof(buffer),
        "temp-%.2f;hum_air-%.2f;hum_soil-%.2f;lum-%d",
        reading.temperature,
        reading.humidity_air,
        reading.humidity_soil,
        reading.luminosity);
    return String(buffer);
}

int buildJsonBody(char* buffer, size_t bufferSize, const char* deviceId,
                  const SensorReading& reading, unsigned long timestamp) {
    if (buffer == nullptr || bufferSize == 0 || deviceId == nullptr) {
        return -1;
    }

    int written = snprintf(buffer, bufferSize,
        "{\"device_id\":\"%s\",\"temperature\":%.2f,\"humidity_air\":%.2f,"
        "\"humidity_soil\":%.2f,\"luminosity\":%d,\"timestamp\":%lu}",
        deviceId,
        reading.temperature,
        reading.humidity_air,
        reading.humidity_soil,
        reading.luminosity,
        timestamp);

    // Check if output was truncated
    if (written < 0 || (size_t)written >= bufferSize) {
        return -1;
    }

    return written;
}

} // namespace PayloadBuilder
