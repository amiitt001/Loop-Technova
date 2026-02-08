
import { ValidationError, ConflictError, ServiceError } from './errors.js';

/**
 * Wraps an async handler to provide centralized error handling.
 * Ensures strict JSON responses and proper status codes.
 * 
 * @param {Function} fn - Async handler function (req, res)
 */
export const safeHandler = (fn) => async (req, res) => {
    try {
        await fn(req, res);
    } catch (error) {
        console.error("API Error:", error);

        // 1. Trusted Operational Errors (User's fault or Known Logic)
        if (error.isOperational) {
            return res.status(error.statusCode).json({
                error: error.message,
                code: error.code
            });
        }

        // 2. Unknown / System Errors (Crash, bug, etc.)
        // Never leak stack traces to the client
        return res.status(500).json({
            error: "Something went wrong on our end.",
            code: "INTERNAL_SERVER_ERROR"
        });
    }
};
