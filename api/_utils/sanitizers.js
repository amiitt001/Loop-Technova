/**
 * Sanitizes a value for use in Google Sheets (or CSV exports) to prevent Formula Injection.
 * Prepends a single quote (') if the value starts with characters that could trigger formula execution.
 *
 * @param {string|any} value - The value to sanitize.
 * @returns {string|any} - The sanitized string, or the original value if safe.
 */
export function sanitizeForSheets(value) {
    if (value === null || value === undefined) {
        return value;
    }

    // Coerce to string to check for dangerous characters, ensuring we catch
    // dangerous payloads even in non-string types (like arrays).
    const stringValue = String(value);

    // Prevent Formula Injection:
    // If the value starts with =, +, -, @, Tab (\t), or Carriage Return (\r),
    // prepend a single quote so it's treated as text.
    // Reference: https://owasp.org/www-community/attacks/CSV_Injection
    if (/^[=+\-@\t\r]/.test(stringValue)) {
        return "'" + stringValue;
    }

    // If safe, return the original value to preserve types (e.g. Numbers, Dates)
    return value;
}
