# BRIDGE Part-Time Recruiting Portal

Playful and simple web app for **BRIDGE Edge Learning and Innovation Factory**.

Two user types:

- **Applicant**: looking for part-time opportunities, submits profile, resume, certificates, and what they offer.
- **Reviewer**: BRIDGE team member reviewing applications and updating statuses.

## What was updated

- Frontend redesigned to be more playful and easy to use.
- Added global **header + footer**.
- Added fixed, large **BRIDGE logo** at bottom-left (from `server/logo.png`).
- Footer includes:
  - page links
  - **Made by Awaiz Ahmed** with hyperlink to `https://awaizahmed.com`
- Migrated app data/auth/files to **Firebase**:
  - Firebase Auth (email/password)
  - Firestore (users + applications)
  - Firebase Storage (profile pictures, resumes, certificates)
- Added **profile picture** option in applicant form.

## Stack

- React + Vite + TailwindCSS
- Firebase (Auth + Firestore + Storage)

## Setup

1. Install dependencies:

```bash
npm run setup
```

2. Create Firebase project and enable:
- Authentication -> Email/Password
- Firestore Database
- Storage

3. Configure env:

```bash
cp client/.env.example client/.env
```

Fill `client/.env` with Firebase config values:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

4. Run frontend:

```bash
npm run dev:client
```

App URL: `http://localhost:5173`

## Firestore collections used

- `users/{uid}`
  - `uid, email, name, role, profilePicUrl`
- `applications/{uid}`
  - `fullName, email, phone, location, availability, whatYouOffer, skills, experience, portfolio`
  - `profilePicUrl, resumeUrl, certificateUrls[]`
  - `status, reviewerNote, createdAt, updatedAt`

## Recommended Firebase security rules (starter)

### Firestore rules

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /applications/{userId} {
      allow create, read, update: if request.auth != null && request.auth.uid == userId;
      allow read, update: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'reviewer';
    }
  }
}
```

### Storage rules

```txt
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Notes

- The previous Express + Prisma backend remains in the repo but this UI now uses Firebase directly.
- Reviewer accounts can be created from the Register page by selecting "BRIDGE reviewer/team member".
