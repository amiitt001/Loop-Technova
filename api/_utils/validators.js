
/**
 * Validates the structure and content of the responses array.
 * Enforces strict limits to prevent DoS attacks.
 *
 * @param {Array} responses - The array of response objects.
 * @returns {Object} - { valid: boolean, reason?: string }
 */
export function validateResponses(responses) {
    if (!responses) return { valid: true }; // Optional

    if (!Array.isArray(responses)) {
        return { valid: false, reason: 'Responses must be an array' };
    }

    if (responses.length > 50) {
        return { valid: false, reason: 'Too many responses (max 50)' };
    }

    for (const response of responses) {
        if (typeof response !== 'object' || response === null) {
            return { valid: false, reason: 'Invalid response format' };
        }

        const { question, answer } = response;

        if (question && typeof question !== 'string') {
            return { valid: false, reason: 'Response question must be a string' };
        }
        if (answer && typeof answer !== 'string') {
            return { valid: false, reason: 'Response answer must be a string' };
        }

        if (question && question.length > 500) {
            return { valid: false, reason: 'Response question exceeds max length (500)' };
        }
        if (answer && answer.length > 5000) {
            return { valid: false, reason: 'Response answer exceeds max length (5000)' };
        }
    }

    return { valid: true };
}
