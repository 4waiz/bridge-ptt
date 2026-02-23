# Recruiting Campaign Tool MVP

Full-stack recruiting workflow app with role-based access for applicants, reviewers, and admins.

## Tech Stack

- Frontend: React (Vite) + TailwindCSS
- Backend: Node.js + Express
- Database: SQLite via Prisma ORM
- Authentication: JWT-based session flow
- Repository layout: `client/` + `server/`

## Features Implemented

### Authentication + RBAC

- Email/password login
- Applicant self-registration
- Hashed passwords (`bcryptjs`)
- Role-based protected APIs and routes (`applicant`, `reviewer`, `admin`)
- Seeded admin account: `admin@system.com / 1234`

### Applicant

- Submit application form:
  - Personal information
  - Mandatory criteria checklist
  - Preferred criteria + years of experience
  - Experience description
  - CV upload (PDF/DOC/DOCX)
- Auto-rejection when mandatory criteria are not fully matched
- Weighted preferred-score calculation from admin-defined criteria
- Status, timeline, and reviewer note visibility

### Reviewer

- ATS-style reviewer board with:
  - Left applicant queue
  - Filters by status, score, mandatory criteria match
  - Sorting controls
- Applicant detail workspace:
  - Profile tab
  - Interviews tab
  - Timeline tab
  - Analytics tab
  - Resume preview
  - Notes management
- Score applicants by category (1-5)
- Move applicants through pipeline statuses

### Admin

- Dashboard stats cards:
  - total applicants
  - shortlisted
  - rejected
  - interviews scheduled
  - reviewer count
- Manage criteria:
  - must-have
  - nice-to-have with weight
- Dynamically edit scoring weights
- Create reviewer users
- Audit log of application events/status changes

### Security

- Input validation (`zod`)
- Route-level role protection middleware
- Authorization checks for CV access
- Upload type + size restrictions

## Project Structure

```text
bridge-ptt/
  client/   # React + Tailwind frontend
  server/   # Express API + Prisma + SQLite
```

## Setup

### 1. Install dependencies

```bash
npm run setup
```

### 2. Configure environment files

Server:

```bash
cp server/.env.example server/.env
```

Client (optional, defaults to local API URL):

```bash
cp client/.env.example client/.env
```

### 3. Initialize database

```bash
npm run db:push --prefix server
npm run db:seed --prefix server
```

### 4. Run development mode (both apps)

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Seeded Accounts

- Admin: `admin@system.com / 1234`
- Reviewer: `reviewer@system.com / 1234`
- Applicants:
  - `alex@applicant.com / 1234`
  - `bianca@applicant.com / 1234`
  - `carlos@applicant.com / 1234`

## Scripts

Root:

- `npm run dev` - Run client + server concurrently
- `npm run dev:client` - Run frontend only
- `npm run dev:server` - Run backend only
- `npm run build` - Build frontend
- `npm run seed` - Run Prisma seed in server

Server:

- `npm run dev` - Start API with nodemon
- `npm run start` - Start API
- `npm run db:push` - Sync Prisma schema to SQLite
- `npm run db:seed` - Seed database
- `npm run prisma:generate` - Generate Prisma client

## Notes

- SQLite DB file is managed under `server/prisma/dev.db`.
- Uploaded CV files are stored in `server/uploads`.
- For production, update `JWT_SECRET` and tighten CORS origins.
