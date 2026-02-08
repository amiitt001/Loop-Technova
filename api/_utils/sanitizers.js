/**
 * Sanitizes a value for use in Google Sheets (or CSV exports) to prevent Formula Injection.
 * Prepends a single quote (') if the value starts with characters that could trigger formula execution.
 *
 * @param {string} value - The value to sanitize.
 * @returns {string} - The sanitized value.
 */
export function sanitizeForSheets(value) {
    if (typeof value !== 'string') return value;

    // Prevent Formula Injection:
    // If the value starts with =, +, -, @, Tab (\t), or Carriage Return (\r),
    // prepend a single quote so it's treated as text.
    // Reference: https://owasp.org/www-community/attacks/CSV_Injection
    if (/^[=+\-@\t\r]/.test(value)) {
        return "'" + value;
    }

    return value;
}
