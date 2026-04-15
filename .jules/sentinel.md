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

## 2025-10-27 - Inconsistent Input Validation
**Vulnerability:** Similar endpoints (`/apply` and `/register`) implemented divergent validation logic, with `/register` missing crucial checks (email MX validation, response size limits) present in `/apply` or missing entirely.
**Learning:** Duplicating validation logic across endpoints leads to inconsistencies and gaps. Security features added to one endpoint are easily missed in others.
**Prevention:** Centralize validation logic in shared utilities (`api/_utils/validators.js`) and enforce its use across all similar endpoints. This ensures consistent security posture and simplifies updates.

## 2025-10-28 - Implicit Trust in Foreign Key Existence
**Vulnerability:** The registration endpoint accepted any `eventId` and created a record, only checking for duplicates but not existence. This allowed creation of "orphan" registrations for non-existent events.
**Learning:** Validating uniqueness (duplicates) is not enough; validity of the reference must also be checked. Writing to the database based on unverified IDs compromises data integrity.
**Prevention:** Always validate the existence of referenced documents (foreign keys) before creating dependent records, even in NoSQL databases.

## 2025-10-28 - Type Confusion in Input Validation
**Vulnerability:** `api/register.js` validated field lengths but failed to validate field types. An attacker could bypass sanitization (which expects strings) by sending an array (e.g., `["=cmd"]`), leading to formula injection in Google Sheets.
**Learning:** Relying on "truthiness" or loose checks (`if (data[key])`) allows unexpected types to pass through. Sanitization functions often assume specific input types and fail silently or return raw input when types mismatch.
**Prevention:** Strictly enforce input types (e.g., `typeof value === 'string'`) before performing length checks or passing data to sanitization functions.

## 2025-03-02 - Type Confusion Vulnerability in Firestore Queries
**Vulnerability:** API endpoints taking `req.query.id` were passing the parameter directly to Firestore's `db.collection('...').doc(id)` without validating its type.
**Learning:** In Node.js server frameworks, `req.query.id` can be parsed as an array (e.g., `?id=foo&id=bar`). Passing an array to `.doc()` where a string is expected can cause unhandled exceptions or unintended query behavior (type confusion).
**Prevention:** Always strictly validate `req.query` and `req.body` parameters expected to be used as database keys to ensure they are the correct type (e.g., `typeof id === 'string'`) before executing the query.

## 2026-04-15 - [XSS] Removed dynamic innerHTML usage in React components
**Vulnerability:** XSS vulnerability found in `src/pages/Events.jsx` and `src/pages/Team.jsx` where image `onError` handlers were directly assigning string HTML to `e.currentTarget.parentElement.innerHTML`.
**Learning:** Even for "safe" placeholder content, dynamically injecting strings via `innerHTML` bypasses React's virtual DOM, can lead to state inconsistencies, and serves as a dangerous pattern that can be exploited if the codebase evolves to include user-supplied inputs in those templates.
**Prevention:** Avoid `innerHTML` whenever possible in React applications. Instead, track the error state locally (e.g. `const [imageError, setImageError] = useState(false)`) and conditionally render fallback JSX.

## 2026-04-15 - [CSV Injection] Unsanitized client-side CSV exports
**Vulnerability:** The client-side CSV export function in `AdminRegistrationsModal.jsx` concatenated user-provided registration fields directly into a CSV file. An attacker could craft a payload starting with characters like `=`, `+`, `-`, or `@` which would be interpreted as an executable formula when the exported file is opened in a spreadsheet application.
**Learning:** Sanitization for CSV Injection needs to happen at the exact point of export or integration, whether it's on the server pushing to Google Sheets or the client generating a downloadable `.csv` file.
**Prevention:** Always escape untrusted data that begins with `=, +, -, @` or potentially dangerous control characters when generating CSV contents or interfacing with spreadsheet applications, by prefixing the value with a single quote (`'`).
## 2024-05-30 - Sanitize Email inputs for Google Sheets Sync
**Vulnerability:** Google Sheets injection vulnerability via unsanitized email fields
**Learning:** Even structured/validated data like email addresses can be used for CSV/Formula Injection if they happen to start with dangerous characters (`=`, `+`, `-`, `@`) and aren't properly sanitized before being passed to a spreadsheet system. The app uses `sanitizeForSheets` everywhere except for email fields because emails are deemed "validated". However, validateEmail function only validates the email format and doesn't explicitly restrict starting characters like `+`, `-`, or `@` which are technically valid in some email formats (or at least could bypass simplistic validations if manipulated).
**Prevention:** All inputs passed to CSV or Spreadsheet syncs, regardless of prior validation or expected format, must be strictly run through `sanitizeForSheets()` or similar output encoding/sanitization functions to prevent injection.

## 2024-03-11 - [XSS via javascript: URI Injection in Social Links]
**Vulnerability:** External social links (like GitHub, LinkedIn, Twitter) stored in Firestore were directly rendered into `href` attributes in `src/components/HomeTeam.jsx` and `src/pages/Team.jsx` without any sanitization or validation. This allowed for Cross-Site Scripting (XSS) via `javascript:` URI injection.
**Learning:** Even structured data like `member.social.github` that seems innocuous needs strict sanitization on the frontend before being rendered into sensitive DOM attributes like `href`. Assuming database values are safe is dangerous.
**Prevention:** Always use `safeHref` from `src/utils/security.js` or a similar URL validation function when rendering any URL originating from a database, user input, or configuration file to guarantee it begins with an allowed scheme (e.g., `http:`, `https:`, `mailto:`).
## 2024-05-19 - Strict Schema Validation on Public Collections
**Vulnerability:** The Firestore `messages` collection allowed unauthenticated creation with basic field validation (`isValidString`), but failed to enforce the overall schema shape.
**Learning:** Checking individual fields (`name`, `email`, `message`) in Firestore rules is insufficient if the document schema itself is unbounded. Attackers could inject arbitrary extra fields to cause data pollution, bypass internal logic downstream, or inflate database storage costs (DoS).
**Prevention:** Always combine field-level validation with a strict schema check using `request.resource.data.keys().hasOnly(['field1', 'field2'])` on collections that allow public writes.

## 2026-04-15 - Enforce Server-Side Timestamps on Public Firestore Collections
**Vulnerability:** The Firestore `messages` collection allowed unauthenticated creation and checked the schema, but did not validate the `createdAt` timestamp. An attacker could inject arbitrary data (like future/past dates or non-timestamp types) into this field, which might bypass sorting logic or cause application crashes when the admin dashboard attempts to format it.
**Learning:** Even when using `request.resource.data.keys().hasOnly([...])` to enforce a schema on public collections, you must explicitly validate the *content* and *type* of every allowed field. For timestamps, `request.time` is the source of truth for the server.
**Prevention:** Always enforce server-side timestamps for user-created documents on public endpoints by adding `request.resource.data.createdAt == request.time` to the Firestore rules.
