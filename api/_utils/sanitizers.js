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

    // Prevent Formula Injection (CSV Injection):
    // 1. Starts with =, +, -, @, Tab (\t), Carriage Return (\r), or Newline (\n)
    // 2. Starts with whitespace/control characters followed by =, +, -, @
    // This regex checks if the string starts with optional whitespace/control chars
    // followed by any of the dangerous characters.
    //
    // Reference: https://owasp.org/www-community/attacks/CSV_Injection
    if (/^[\s]*[=+\-@\t\r\n]/.test(stringValue)) {
        return "'" + stringValue;
    }

    // If safe, return the original value to preserve types (e.g. Numbers, Dates)
    return value;
}
