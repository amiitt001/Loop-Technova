/**
 * Validates the responses array for a registration.
 * Checks for array type, length, and item structure/content limits.
 *
 * @param {Array} responses - The responses array to validate.
 * @returns {Object} - { valid: boolean, reason?: string }
 */
export function validateResponses(responses) {
    // Optional field, so null/undefined is valid (treated as empty array later)
    if (!responses) return { valid: true };

    if (!Array.isArray(responses)) {
        return { valid: false, reason: 'Responses must be an array' };
    }

    if (responses.length > 50) {
        return { valid: false, reason: 'Too many responses (max 50)' };
    }

    for (const item of responses) {
        if (typeof item !== 'object' || item === null) {
            return { valid: false, reason: 'Response item must be an object' };
        }

        // Check required fields
        if (!item.question || !item.answer) {
            return { valid: false, reason: 'Response item must have question and answer' };
        }

        // Check types
        if (typeof item.question !== 'string') {
            return { valid: false, reason: 'Question must be a string' };
        }
        if (typeof item.answer !== 'string') {
            return { valid: false, reason: 'Answer must be a string' };
        }

        // Check lengths
        if (item.question.length > 500) {
            return { valid: false, reason: 'Question too long (max 500 chars)' };
        }
        if (item.answer.length > 5000) {
            return { valid: false, reason: 'Answer too long (max 5000 chars)' };
        }
    }

    return { valid: true };
}
