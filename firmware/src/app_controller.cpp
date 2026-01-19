/*
 * HarvestShield - App Controller
 * Main orchestrator for the sensor reading cycle
 */

#include "app_controller.h"
#include "config.h"
#include "sensors.h"
#include "crypto.h"
#include "stats.h"
#include "led.h"
#include "time_manager.h"
#include "key_manager.h"
#include "transport/payload_builder.h"
#include "transport/request_sender.h"

namespace AppController {

// PoW difficulty (3 = hash starts with "000", ~4096 attempts avg)
static const uint8_t POW_DIFFICULTY = 3;

// Last cycle timing
static CycleTiming s_lastTiming;

bool init() {
    // Initialize transport layer
    RequestSender::init(SUPABASE_URL, SUPABASE_ANON_KEY);

    DEBUG_PRINTLN("[AppController] Initialized");
    return true;
}

CycleResult runCycle() {
    CycleResult result;
    result.error = ErrorCode::OK;
    result.httpCode = -1;
    result.hasBlockchainTx = false;
    memset(&result.timing, 0, sizeof(CycleTiming));

    StatsManager::incrementTotal();
    Stats& stats = StatsManager::get();

    // Get device ID
    String deviceId = KeyManager::getDeviceId();

    // ===== REQUEST START =====
    Serial.println();
    Serial.printf(">>> REQUEST #%lu ========================================\n", stats.total);

    unsigned long tStart = millis();
    Led::on();

    // 1. Read sensors
    unsigned long t = millis();
    SensorReading reading = Sensors::read();
    result.timing.sensorMs = millis() - t;

    // 2. Build data string for PoW
    t = millis();
    String dataString = PayloadBuilder::buildDataString(reading);
    // Include in sensor timing since it's trivial
    result.timing.sensorMs += millis() - t;

    DEBUG_PRINTF("[IoT] Data: %s\n", dataString.c_str());

    // 3. Proof of Work: SHA256(data + nonce) until hash starts with "000"
    t = millis();
    Crypto::PoWResult pow = Crypto::computePoW(dataString.c_str(), POW_DIFFICULTY);
    result.timing.powMs = millis() - t;

    if (!pow.success) {
        Serial.println("[IoT] PoW FAIL - could not find valid nonce");
        Led::error();
        StatsManager::incrementFailed();
        result.error = ErrorCode::POW_FAILED;
        result.timing.totalMs = millis() - tStart;
        s_lastTiming = result.timing;
        return result;
    }

    DEBUG_PRINTF("[IoT] PoW: nonce=%u hash=%s\n", pow.nonce, pow.hash.c_str());

    // 4. ECDSA Sign the PoW hash
    t = millis();
    String signature = Crypto::sign(pow.hash.c_str());
    result.timing.signMs = millis() - t;

    if (signature.isEmpty()) {
        Serial.println("[IoT] Sign FAIL");
        Led::error();
        StatsManager::incrementFailed();
        result.error = ErrorCode::SIGN_FAILED;
        result.timing.totalMs = millis() - tStart;
        s_lastTiming = result.timing;
        return result;
    }

    // 5. Build JSON payload with real timestamp
    t = millis();
    unsigned long timestamp = TimeManager::getTimestamp();

    char jsonBuffer[400];
    int jsonLen = PayloadBuilder::buildJsonBody(jsonBuffer, sizeof(jsonBuffer),
                                                 deviceId.c_str(), reading, timestamp);
    result.timing.jsonMs = millis() - t;

    if (jsonLen < 0) {
        Serial.println("[IoT] JSON build FAIL");
        Led::error();
        StatsManager::incrementFailed();
        result.error = ErrorCode::INTERNAL_ERROR;
        result.timing.totalMs = millis() - tStart;
        s_lastTiming = result.timing;
        return result;
    }

    // 6. Prepare headers and send HTTP request
    PayloadBuilder::RequestHeaders headers;
    headers.deviceId = deviceId;
    headers.powData = dataString;
    headers.powNonce = pow.nonce;
    headers.powHash = pow.hash;
    headers.signature = signature;
    headers.timestamp = timestamp;

    t = millis();
    RequestSender::SendResult sendResult = RequestSender::send(jsonBuffer, headers);
    result.timing.httpMs = millis() - t;

    Led::off();
    result.timing.totalMs = millis() - tStart;
    result.httpCode = sendResult.httpCode;
    result.error = sendResult.error;

    // Log timing breakdown
    Serial.printf("[IoT] #%lu | Sensor:%lu PoW:%lu Sign:%lu JSON:%lu HTTP:%lu | Total:%lums\n",
        stats.total,
        result.timing.sensorMs,
        result.timing.powMs,
        result.timing.signMs,
        result.timing.jsonMs,
        result.timing.httpMs,
        result.timing.totalMs);

    // 7. Process response and update stats
    const char* statusMsg;
    if (sendResult.ok()) {
        StatsManager::incrementSuccess();

        bool hasBlockchainTx = sendResult.response.indexOf("\"tx_hash\":\"") > 0 &&
                               sendResult.response.indexOf("\"tx_hash\":null") < 0;
        bool isPending = sendResult.response.indexOf("\"status\":\"pending\"") > 0;

        result.hasBlockchainTx = hasBlockchainTx;

        if (hasBlockchainTx) {
            StatsManager::incrementBlockchainSuccess();
            Led::successBlockchain();
            int hashStart = sendResult.response.indexOf("\"tx_hash\":\"") + 11;
            int hashEnd = sendResult.response.indexOf("\"", hashStart);
            String txHash = sendResult.response.substring(hashStart, hashEnd);
            Serial.printf("    TX: %.16s...\n", txHash.c_str());
            statusMsg = "OK + BLOCKCHAIN";
        } else if (isPending || sendResult.httpCode == 202) {
            StatsManager::incrementBlockchainSuccess();
            Led::success();
            statusMsg = "OK (pending)";
        } else {
            StatsManager::incrementBlockchainFailed();
            Led::success();
            statusMsg = "OK (no blockchain)";
        }
    } else {
        StatsManager::incrementFailed();
        Led::error();
        statusMsg = "FAILED";
        Serial.printf("    HTTP Error: %d | %s\n", sendResult.httpCode, sendResult.response.c_str());
    }

    // ===== REQUEST END =====
    Serial.printf("<<< #%lu | %s | %lums ============================\n",
                  stats.total, statusMsg, result.timing.totalMs);

    // Persist stats periodically
    if (stats.total % 10 == 0) {
        StatsManager::save();
    }

    if (stats.total % 60 == 0) {
        StatsManager::print();
    }

    s_lastTiming = result.timing;
    return result;
}

CycleTiming getLastTiming() {
    return s_lastTiming;
}

} // namespace AppController
