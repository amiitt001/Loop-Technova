## 2024-05-22 - Broken Access Control in Admin Verification
**Vulnerability:** The `verifyAdmin` function verified the authenticity of the Firebase token but failed to check the `admin` custom claim, allowing any authenticated user to perform admin actions.
**Learning:** Authentication (who are you) != Authorization (what can you do). Verifying a token only proves identity, not privilege.
**Prevention:** Always check for specific claims (roles) after verifying the token signature. Separate the verification step from the authorization check.

## 2025-02-04 - Client-Side Secret Exposure Risk
**Vulnerability:** The backend supported a fallback to `VITE_` prefixed environment variables for sensitive secrets (private keys).
**Learning:** Developers sometimes prefix secrets with `VITE_` by mistake or misunderstanding, thinking it makes them available "globally", but `VITE_` specifically exposes them to the client bundle. Supporting this in the backend validates this dangerous pattern.
**Prevention:** Never allow fallbacks to `VITE_` variables for secrets in backend code. Explicitly warn or fail if such variables exist to alert the developer.

## 2025-02-05 - Insecure Direct Object Reference to Google Script
**Vulnerability:** The Google Apps Script URL was exposed in the client-side code (`VITE_GOOGLE_SHEET_URL`), allowing unauthenticated users to trigger arbitrary actions (including deletion) defined in the script.
**Learning:** External integrations often lack granular permissions (like "append-only"). Exposing their direct URLs to the client grants the client full permissions over that integration.
**Prevention:** Proxy all external integrations through the backend. This allows the backend to enforce authentication, validation, and rate limiting before forwarding the request to the external service.

## 2025-02-06 - Inconsistent Input Sanitization (CSV Injection)
**Vulnerability:** While the application form endpoint (`api/apply.js`) correctly sanitized inputs against CSV/Formula Injection, the registration endpoint (`api/register.js`) did not, despite using the same Google Sheets backend.
**Learning:** Security measures applied to one endpoint (like sanitization) are often forgotten in similar endpoints created later or by different developers. Consistency is key.
**Prevention:** Centralize data submission logic to external services (like Google Sheets) into a single utility function that handles sanitization automatically, rather than relying on each endpoint to manually sanitize before sending.
