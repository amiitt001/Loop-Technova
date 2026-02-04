## 2024-05-22 - Broken Access Control in Admin Verification
**Vulnerability:** The `verifyAdmin` function verified the authenticity of the Firebase token but failed to check the `admin` custom claim, allowing any authenticated user to perform admin actions.
**Learning:** Authentication (who are you) != Authorization (what can you do). Verifying a token only proves identity, not privilege.
**Prevention:** Always check for specific claims (roles) after verifying the token signature. Separate the verification step from the authorization check.

## 2025-02-04 - Client-Side Secret Exposure Risk
**Vulnerability:** The backend supported a fallback to `VITE_` prefixed environment variables for sensitive secrets (private keys).
**Learning:** Developers sometimes prefix secrets with `VITE_` by mistake or misunderstanding, thinking it makes them available "globally", but `VITE_` specifically exposes them to the client bundle. Supporting this in the backend validates this dangerous pattern.
**Prevention:** Never allow fallbacks to `VITE_` variables for secrets in backend code. Explicitly warn or fail if such variables exist to alert the developer.
