
/**
 * Security Utility for Data Leak Prevention
 * 
 * This module provides guards to ensure raw objects, JSON blobs, 
 * and configuration strings are never rendered in the UI.
 */

// Patterns that suggest content is a code snippet or config object
const UNSAFE_PATTERNS = [
    /^\s*\{.*\}\s*$/,       // JSON-like object "{ ... }"
    /^\s*\[.*\]\s*$/,       // JSON-like array "[ ... ]"
    /function\s*\(/i,       // Function definition "function ("
    /=>\s*\{/,              // Arrow function "=> {"
    /apiKey/i,              // Specific sensitive keywords
    /accessToken/i,
    /secret/i,
    /bearer /i
];

/**
 * Checks if a string contains unsafe patterns or potential secrets.
 * @param {string} str 
 * @returns {boolean} true if safe, false if unsafe
 */
export const isSafeString = (str) => {
    if (typeof str !== 'string') return false;

    // Check key patterns
    for (const pattern of UNSAFE_PATTERNS) {
        if (pattern.test(str)) return false;
    }

    // Check for suspicious entropy/length (e.g., extremely long single word tokens)
    // A normal sentence usually has spaces. A 100+ char string with no spaces is suspicious.
    if (str.length > 100 && !str.includes(' ')) {
        return false;
    }

    return true;
};

/**
 * Safely renders content. Returns a fallback if content is suspicious.
 * @param {any} content - The content to render
 * @param {string} fallback - Text to show if content is unsafe
 * @returns {string} - Safe string to render
 */
export const safeRender = (content, fallback = "Invalid Content") => {
    // 1. Primitive Check: If null/undefined, safe to return empty
    if (content === null || content === undefined) {
        return '';
    }

    // 2. Type Check: If it's an object/array, it's definitely UNSAFE
    if (typeof content === 'object') {
        return fallback;
    }

    // 3. Stringify & Sanitize
    const str = String(content);

    if (!isSafeString(str)) {
        return fallback;
    }

    return str;
};

/**
 * Validates and returns a safe href URL.
 * Prevents javascript: URI injection and other malicious schemes.
 * @param {string} url - The URL to validate
 * @returns {string} - Safe URL or '#'
 */
export const safeHref = (url) => {
    if (!url || typeof url !== 'string') return '#';

    // Trim whitespace
    const cleanUrl = url.trim();

    // Allow http, https, mailto, tel
    if (cleanUrl.match(/^(https?:\/\/|mailto:|tel:)/i)) {
        return cleanUrl;
    }

    return '#';
};
