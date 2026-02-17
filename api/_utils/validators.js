import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

const BLOCKED_DOMAINS = ['example.com', 'test.com', 'dummy.com', 'mailinator.com', 'yopmail.com'];
const BLOCKED_PREFIXES = ['test', 'admin', 'user', 'no-reply', 'noreply'];
// Strict Regex: prevents starting with +, -, = (Formula Injection prevention)
const EMAIL_REGEX = /^[a-zA-Z0-9._%][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function validateEmail(email) {
    if (!email || !EMAIL_REGEX.test(email)) return { valid: false, reason: 'Invalid email format' };

    const [local, domain] = email.split('@');

    if (BLOCKED_DOMAINS.includes(domain.toLowerCase())) return { valid: false, reason: 'Domain is blocked' };
    if (BLOCKED_PREFIXES.includes(local.toLowerCase())) return { valid: false, reason: 'Email prefix is blocked' };

    // Prevent self-send (system email)
    if (email === 'technova@galgotias.edu') return { valid: false, reason: 'Cannot use system email' };

    try {
        const addresses = await resolveMx(domain);
        if (!addresses || addresses.length === 0) return { valid: false, reason: 'No mail server found for domain' };
        return { valid: true };
    } catch (error) {
        return { valid: false, reason: 'Domain validation failed' };
    }
}

export function validateResponses(responses) {
    if (!responses) return { valid: true }; // Optional field, so null/undefined is valid (handled as empty array later)
    if (!Array.isArray(responses)) return { valid: false, reason: 'Responses must be an array' };
    if (responses.length > 50) return { valid: false, reason: 'Too many responses (max 50)' };

    for (const response of responses) {
        if (!response.question || typeof response.question !== 'string') return { valid: false, reason: 'Invalid question format' };
        // Answer might be empty string, but must be string if present? Or required?
        // Let's assume answer is required string, but can be empty if the form allows it.
        // However, usually we want to validate type.
        if (response.answer === undefined || response.answer === null || typeof response.answer !== 'string') return { valid: false, reason: 'Invalid answer format' };

        if (response.question.length > 500) return { valid: false, reason: 'Question too long (max 500 chars)' };
        if (response.answer.length > 5000) return { valid: false, reason: 'Answer too long (max 5000 chars)' };
    }

    return { valid: true };
}
