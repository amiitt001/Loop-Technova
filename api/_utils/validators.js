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
    if (responses === undefined || responses === null) return { valid: true }; // Optional

    if (!Array.isArray(responses)) return { valid: false, reason: 'Responses must be an array' };
    if (responses.length > 20) return { valid: false, reason: 'Too many responses (max 20)' };

    for (const r of responses) {
        if (typeof r !== 'object' || r === null) return { valid: false, reason: 'Each response must be an object' };

        // Check question
        if (!r.question) return { valid: false, reason: 'Response missing question' };
        if (typeof r.question !== 'string') return { valid: false, reason: 'Question must be a string' };
        if (r.question.length > 200) return { valid: false, reason: 'Question too long' };

        // Check answer
        if (!r.answer) return { valid: false, reason: 'Response missing answer' };
        if (typeof r.answer !== 'string') return { valid: false, reason: 'Answer must be a string' };
        if (r.answer.length > 1000) return { valid: false, reason: 'Answer too long' };
    }
    return { valid: true };
}
