
/**
 * Standardized Frontend Error Handling
 */

export class ApiError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}

/**
 * Normalizes any error into a safe, user-facing error message.
 * @param {any} error 
 * @returns {string} - Safe error message
 */
export const normalizeError = (error) => {
    // 1. If it's our structured API error, trust the message
    if (error instanceof ApiError) {
        return error.message;
    }

    // 2. Handle generic Fetch/Network errors
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        return "Network connection issue. Please check your internet.";
    }

    // 3. Handle JSON/Serialization errors
    if (error instanceof SyntaxError) {
        return "Server returned invalid response. Please try again later.";
    }

    // 4. Default Safe Fallback (Prevent "Object object" or stack traces)
    console.warn("Unknown Error Caught:", error);
    return "Something went wrong. Please try again.";
};
