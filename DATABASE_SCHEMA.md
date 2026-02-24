# Tech Nova - Cloud Database Architecture

This document outlines the Firestore NoSQL schema designed for the Tech Nova platform.

## 1. Collections Strategy

| Collection | Description | Access Level |
| :--- | :--- | :--- |
| `members` | Club members, points, and roles. | Public Read / Admin Write |
| `events` | Workshops, hackathons, and meetings. | Public Read / Admin Write |
| `registrations` | Student sign-ups for specific events. | Admin Full |
| `applications` | Membership applications submitted via the Join Us form. | Admin Full |
| `contestants` | Competitive programming / contest participants. | Public Read / Admin Write |
| `projects` | Projects built by the team. | Public Read / Admin Write |
| `messages` | Contact form submissions from visitors. | Public Create / Admin Full |
| `admins` | Authorized administrators. | Self Read/Write only |

---

## 2. Detailed Schema

### 👥 members
**Purpose**: Powers the `Team` page and `Leaderboard`.
**Document ID**: Auto-generated
```json
{
  "name": "String",                  // e.g. "Alex Chen"
  "role": "String",                  // "Head" | "Mentor" | "Coordinator" | "Member"
  "title": "String",                 // e.g. "President", "Tech Lead"
  "team": "String",                  // e.g. "Frontend Team", "AI/ML Team"
  "points": "Number",                // e.g. 1200 (for Leaderboard sorting)
  "github": "String",                // URL
  "linkedin": "String",              // URL
  "twitter": "String",               // URL (Optional)
  "img": "String",                   // URL to storage or path e.g. "/alex.jpg"
  "active": "Boolean",               // true
  "updatedAt": "Timestamp"
}
```

### 📅 events
**Purpose**: Powers the `Events` page and `Home` timeline.
**Document ID**: Auto-generated
```json
{
  "title": "String",                 // e.g. "HackNova 2026"
  "date": "Timestamp",               // Event date and time
  "location": "String",              // e.g. "Lab 2, Main Block"
  "status": "String",                // "Upcoming" | "Past" | "Live"
  "registrationOpen": "Boolean",     // true (show Register button)
  "description": "String",           // Markdown or plain text
  "thumbnailUrl": "String"           // Optional cover image URL
}
```

### 📝 registrations
**Purpose**: Stores student sign-ups for events. High-volume write collection.
**Document ID**: Auto-generated
> **Note**: Public `create` is intentionally disabled at the Firestore rules level; registrations are created server-side via the `/api/register` serverless function.
```json
{
  "eventId": "String",               // Reference to events/{eventId}
  "studentName": "String",
  "email": "String",
  "enrollmentNumber": "String",      // Unique college ID
  "course": "String",                // e.g. "B.Tech CSE"
  "timestamp": "Timestamp"           // When they registered
}
```

### 📋 applications
**Purpose**: Membership applications submitted through the Join Us / Apply page.
**Document ID**: Auto-generated
> **Note**: Written server-side via the `/api/apply` serverless function.
```json
{
  "name": "String",
  "email": "String",
  "enrollmentNumber": "String",
  "course": "String",                // e.g. "B.Tech CSE"
  "year": "String",                  // e.g. "2nd Year"
  "phone": "String",
  "github": "String",                // URL (Optional)
  "linkedin": "String",              // URL (Optional)
  "skills": "String",                // Comma-separated or free text
  "domain": "String",                // e.g. "Frontend", "AI/ML", "DevOps"
  "whyJoin": "String",               // Motivation statement
  "status": "String",                // "Pending" | "Approved" | "Rejected"
  "timestamp": "Timestamp"
}
```

### 🏆 contestants
**Purpose**: Tracks participants in competitive programming events and contests.
**Document ID**: Auto-generated
```json
{
  "name": "String",
  "enrollmentNumber": "String",
  "rank": "Number",                  // Contest rank
  "score": "Number",
  "contestId": "String",             // Reference to events/{contestId}
  "timestamp": "Timestamp"
}
```

### 💻 projects
**Purpose**: Showcases club achievements on the public site.
**Document ID**: Auto-generated
```json
{
  "title": "String",
  "description": "String",
  "techStack": ["Array", "of", "Strings"],  // e.g. ["React", "Firebase", "AI"]
  "githubLink": "String",
  "demoLink": "String",
  "featured": "Boolean",             // true (show on Home page)
  "teamMembers": ["Array", "of", "Strings"] // Names or reference IDs
}
```

### 💬 messages
**Purpose**: Contact form submissions from site visitors.
**Document ID**: Auto-generated
> **Note**: Public create is allowed if all fields pass validation (name ≤ 100 chars, email ≤ 100 chars, message ≤ 2000 chars). `read` is set to `false` on creation.
```json
{
  "name": "String",                  // max 100 chars
  "email": "String",                 // max 100 chars
  "message": "String",               // max 2000 chars
  "read": "Boolean",                 // false on create; admin flips to true
  "timestamp": "Timestamp"
}
```

### 🛡️ admins
**Purpose**: Manages authorized dashboard access. Admin status is set via Custom Claims using `setAdmin.js`.
**Document ID**: Firebase Auth UID
```json
{
  "name": "String",
  "email": "String",
  "role": "String",                  // "super_admin" | "editor"
  "lastLogin": "Timestamp"
}
```

---

## 3. Security Rules

The full `firestore.rules` deployed to the Firebase project:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }

    function isValidString(text, max) {
      return text is string && text.size() > 0 && text.size() <= max;
    }

    match /members/{memberId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /events/{eventId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /projects/{projectId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /registrations/{registrationId} {
      allow read, update, delete: if isAdmin();
    }

    match /applications/{applicationId} {
      allow read, update, delete: if isAdmin();
    }

    match /contestants/{contestantId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /admins/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /messages/{messageId} {
      allow create: if isValidString(request.resource.data.name, 100)
                    && isValidString(request.resource.data.email, 100)
                    && isValidString(request.resource.data.message, 2000)
                    && request.resource.data.read == false;
      allow read, update, delete: if isAdmin();
    }
  }
}
```

---

## 4. Implementation Notes

### Composite Indexes
For the Leaderboard to work efficiently, a composite index is required on `members`:
- **Fields**: `active` (Ascending) + `points` (Descending)
- **Scope**: Collection

Deploy indexes by running:
```bash
firebase deploy --only firestore:indexes
```

### Granting Admin Access
Admin privileges are granted via Firebase Custom Claims. Update the target email in `setAdmin.js` and run:
```bash
node setAdmin.js
```

### Deploying Security Rules
```bash
firebase deploy --only firestore:rules
```
