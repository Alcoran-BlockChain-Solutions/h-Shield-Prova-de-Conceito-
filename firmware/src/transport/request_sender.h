/*
 * HarvestShield - Request Sender
 * HTTP POST with retry logic and exponential backoff
 */

#ifndef REQUEST_SENDER_H
#define REQUEST_SENDER_H

#include <Arduino.h>
#include "error_types.h"
#include "payload_builder.h"

namespace RequestSender {

// Configuration for HTTP requests
struct Config {
    int maxRetries = 3;
    int initialBackoffMs = 1000;
    int maxBackoffMs = 8000;
    int timeoutMs = 15000;
};

// Result of an HTTP send operation
struct SendResult {
    int httpCode;
    String response;
    ErrorCode error;
    unsigned long durationMs;

    bool ok() const { return error == ErrorCode::OK; }
};

// Initialize the request sender with base URL and auth key
void init(const char* baseUrl, const char* authKey);

// Send a JSON payload with authentication headers
// Returns SendResult with HTTP code, response, error status, and duration
SendResult send(const char* jsonBody, const PayloadBuilder::RequestHeaders& headers,
                const Config& config = Config{});

} // namespace RequestSender

#endif // REQUEST_SENDER_H
