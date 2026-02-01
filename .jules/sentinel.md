## 2024-05-22 - Broken Access Control in Admin Verification
**Vulnerability:** The `verifyAdmin` function verified the authenticity of the Firebase token but failed to check the `admin` custom claim, allowing any authenticated user to perform admin actions.
**Learning:** Authentication (who are you) != Authorization (what can you do). Verifying a token only proves identity, not privilege.
**Prevention:** Always check for specific claims (roles) after verifying the token signature. Separate the verification step from the authorization check.
