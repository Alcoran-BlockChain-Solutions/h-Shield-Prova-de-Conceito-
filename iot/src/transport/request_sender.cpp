/*
 * HarvestShield - Request Sender
 * HTTP POST with retry logic and exponential backoff
 */

#include "request_sender.h"
#include "config.h"
#include <HTTPClient.h>

namespace RequestSender {

// Static configuration
static String s_baseUrl;
static String s_authKey;

void init(const char* baseUrl, const char* authKey) {
    s_baseUrl = baseUrl;
    s_authKey = authKey;
}

// Internal: perform HTTP POST with retry logic
static int postWithRetry(HTTPClient& http, const char* payload, String& response,
                         const Config& config) {
    int retries = 0;
    int backoffMs = config.initialBackoffMs;
    int httpCode = -1;

    while (retries <= config.maxRetries) {
        httpCode = http.POST(payload);

        // Success
        if (httpCode == 200 || httpCode == 201 || httpCode == 202) {
            response = http.getString();
            return httpCode;
        }

        // Don't retry on client errors (4xx)
        if (httpCode >= 400 && httpCode < 500) {
            response = http.getString();
            DEBUG_PRINTF("[HTTP] Client error %d, not retrying\n", httpCode);
            return httpCode;
        }

        retries++;
        if (retries <= config.maxRetries) {
            DEBUG_PRINTF("[HTTP] Request failed (%d), retry %d/%d in %dms\n",
                         httpCode, retries, config.maxRetries, backoffMs);
            delay(backoffMs);
            backoffMs = min(backoffMs * 2, config.maxBackoffMs);
        }
    }

    response = http.getString();
    return httpCode;
}

SendResult send(const char* jsonBody, const PayloadBuilder::RequestHeaders& headers,
                const Config& config) {
    SendResult result;
    result.httpCode = -1;
    result.error = ErrorCode::HTTP_CONNECT_FAILED;
    result.durationMs = 0;

    unsigned long startTime = millis();

    // Build URL
    String url = s_baseUrl + "/oracle";

    HTTPClient http;
    if (!http.begin(url)) {
        DEBUG_PRINTF("[HTTP] Failed to begin connection to %s\n", url.c_str());
        result.durationMs = millis() - startTime;
        return result;
    }

    http.setTimeout(config.timeoutMs);

    // Set headers
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + s_authKey);
    http.addHeader("X-Device-ID", headers.deviceId);
    http.addHeader("X-PoW-Data", headers.powData);
    http.addHeader("X-PoW-Nonce", String(headers.powNonce));
    http.addHeader("X-PoW-Hash", headers.powHash);
    http.addHeader("X-Signature", headers.signature);
    http.addHeader("X-Timestamp", String(headers.timestamp));

    // Perform request with retry
    result.httpCode = postWithRetry(http, jsonBody, result.response, config);
    http.end();

    result.durationMs = millis() - startTime;

    // Determine error code based on HTTP response
    if (result.httpCode == 200 || result.httpCode == 201 || result.httpCode == 202) {
        result.error = ErrorCode::OK;
    } else if (result.httpCode >= 400 && result.httpCode < 500) {
        result.error = ErrorCode::HTTP_CLIENT_ERROR;
    } else if (result.httpCode >= 500) {
        result.error = ErrorCode::HTTP_SERVER_ERROR;
    } else if (result.httpCode == -1) {
        result.error = ErrorCode::HTTP_TIMEOUT;
    } else {
        result.error = ErrorCode::HTTP_CONNECT_FAILED;
    }

    return result;
}

} // namespace RequestSender
