/*
 * HarvestShield - Error Types
 * Common error codes and Result type for structured error handling
 */

#ifndef ERROR_TYPES_H
#define ERROR_TYPES_H

#include <Arduino.h>

// Error codes grouped by category
enum class ErrorCode : uint8_t {
    // Success
    OK = 0,

    // Crypto errors (10-19)
    POW_FAILED = 10,
    SIGN_FAILED = 11,
    HASH_FAILED = 12,

    // HTTP errors (20-29)
    HTTP_TIMEOUT = 20,
    HTTP_CLIENT_ERROR = 21,  // 4xx
    HTTP_SERVER_ERROR = 22,  // 5xx
    HTTP_CONNECT_FAILED = 23,

    // Sensor errors (30-39)
    SENSOR_READ_FAILED = 30,

    // General errors (90-99)
    INVALID_PARAM = 90,
    INTERNAL_ERROR = 99
};

// Get human-readable error message
inline const char* errorMessage(ErrorCode code) {
    switch (code) {
        case ErrorCode::OK:                 return "OK";
        case ErrorCode::POW_FAILED:         return "PoW computation failed";
        case ErrorCode::SIGN_FAILED:        return "Signature failed";
        case ErrorCode::HASH_FAILED:        return "Hash computation failed";
        case ErrorCode::HTTP_TIMEOUT:       return "HTTP timeout";
        case ErrorCode::HTTP_CLIENT_ERROR:  return "HTTP client error (4xx)";
        case ErrorCode::HTTP_SERVER_ERROR:  return "HTTP server error (5xx)";
        case ErrorCode::HTTP_CONNECT_FAILED: return "HTTP connection failed";
        case ErrorCode::SENSOR_READ_FAILED: return "Sensor read failed";
        case ErrorCode::INVALID_PARAM:      return "Invalid parameter";
        case ErrorCode::INTERNAL_ERROR:     return "Internal error";
        default:                            return "Unknown error";
    }
}

// Result type for functions that can fail
// Use Result<T> for functions with return value, Result<void> for void functions
template<typename T>
struct Result {
    T value;
    ErrorCode error;

    bool ok() const { return error == ErrorCode::OK; }

    // Factory methods
    static Result success(const T& val) {
        return Result{val, ErrorCode::OK};
    }

    static Result failure(ErrorCode err) {
        return Result{T{}, err};
    }

    static Result failure(ErrorCode err, const T& val) {
        return Result{val, err};
    }
};

// Specialization for void (no value)
template<>
struct Result<void> {
    ErrorCode error;

    bool ok() const { return error == ErrorCode::OK; }

    static Result success() {
        return Result{ErrorCode::OK};
    }

    static Result failure(ErrorCode err) {
        return Result{err};
    }
};

#endif // ERROR_TYPES_H
