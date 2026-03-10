# Ticket Management System Demo

React + Vite frontend connected to a real Express + MySQL backend for a role-based ticket workflow:

- Civil employee: logs in and creates tickets only
- Admin: sees tickets for their province only and changes status
- SuperAdmin: sees all tickets across all provinces

The active backend is in `server/` and the active SQL files are in `database/`.
The older `backend/` folder is a prototype and is not required to run the demo.

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: MySQL
- Auth: JWT access token + refresh token

## Project Structure

- `src/`: active frontend application
- `server/src/`: active backend API
- `database/schema.sql`: database schema
- `database/seed.sql`: dummy data for roles, provinces, departments, users, issue types, statuses, and tickets
- `.env.example`: frontend environment example
- `server/.env.example`: backend environment example

## Requirements

Install these before starting:

- Node.js 20+
- npm 10+
- MySQL 8+

## 1. Install Dependencies

From the project root:

```bash
npm install
```

## 2. Create the Database

Open MySQL and run:

```sql
CREATE DATABASE ticket_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then import the schema and seed files.

Option A: using MySQL command line:

```bash
mysql -u root -p ticket_demo < database/schema.sql
mysql -u root -p ticket_demo < database/seed.sql
```

Option B: using MySQL Workbench:

- Open `database/schema.sql` and execute it on `ticket_demo`
- Open `database/seed.sql` and execute it on `ticket_demo`

## 3. Configure Environment Files

Frontend:

- File: `.env`
- Default value already included for local development

```env
VITE_API_BASE=http://localhost:4000/api
```

Backend:

- File: `server/.env`
- Default local development file is already included

Important fields:

- `PORT`: API port, default `4000`
- `DB_HOST`: MySQL host
- `DB_PORT`: MySQL port
- `DB_USER`: MySQL username
- `DB_PASSWORD`: MySQL password
- `DB_NAME`: database name, default `ticket_demo`
- `JWT_ACCESS_SECRET`: secret for access tokens
- `JWT_REFRESH_SECRET`: secret for refresh tokens
- `CORS_ORIGIN`: allowed frontend origin list, comma separated
- `SEED_DEFAULT_PASSWORD`: initial password for users inserted with `DUMMY`

If your MySQL password is not empty, update `server/.env`.

## 4. Run the Backend API

From the project root:

```bash
npx tsx server/src/index.ts
```

Expected output:

```bash
API listening on http://localhost:4000
```

Health check:

Open this URL in the browser:

```text
http://localhost:4000/api/health
```

Expected response:

```json
{"ok":true}
```

## 5. Run the Frontend

Open a second terminal in the project root and run:

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Demo Accounts

All seeded users use this default password on first login:

```text
123456
```

Accounts:

- Civil employee Damascus: `osama`
- Civil employee Damascus: `sara`
- Admin Damascus: `dam_admin`
- Admin Aleppo: `aleppo_admin`
- SuperAdmin: `owner`

Notes:

- Seeded users in `database/seed.sql` start with `password_hash = 'DUMMY'`
- On first successful login, the backend automatically replaces `DUMMY` with a real bcrypt hash
- This means the first login upgrades the password storage without needing a separate script

## Role Logic

### Civil

- Logs in with `username` and `password`
- Receives role, province, and department from the backend
- Can create tickets only
- New tickets always start with status `OPEN`
- Province and department are taken from the authenticated user token
- The frontend tries to fetch the public IP and sends it with the ticket request

### Admin

- Logs in with `username` and `password`
- Sees all tickets in their province only
- Sees tickets from all departments inside that province
- Can change ticket status

### SuperAdmin

- Sees all tickets in all provinces
- Can change ticket status across the full system

## Main API Endpoints

Auth:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Metadata:

- `GET /api/meta/provinces`
- `GET /api/meta/departments?provinceId=1`
- `GET /api/meta/ticket-statuses`
- `GET /api/meta/issue-types`
- `GET /api/meta/issue-subtypes?issueTypeId=1`

Tickets:

- `POST /api/tickets`
- `GET /api/tickets`
- `GET /api/tickets/:id`
- `PATCH /api/tickets/:id/status`

## Example Login Request

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "osama",
  "password": "123456"
}
```

## Example Create Ticket Request

This endpoint is for `CIVIL` users only.

```http
POST /api/tickets
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "تعطل الطابعة",
  "description": "الطابعة لا تستجيب نهائيا",
  "imageUrl": null,
  "issueTypeId": 1,
  "issueSubtypeId": 3,
  "ipAddress": "203.0.113.10"
}
```

The backend automatically fills:

- `created_by`
- `province_id`
- `department_id`
- `status_id = OPEN`
- `assigned_admin_id` based on the user's province

## Troubleshooting

### MySQL connection failed

Check these values in `server/.env`:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

### CORS error in browser

Make sure `CORS_ORIGIN` in `server/.env` includes your frontend URL.

Example:

```env
CORS_ORIGIN=http://localhost:5173
```

### Login fails for seeded users

Make sure you imported both files in this order:

1. `database/schema.sql`
2. `database/seed.sql`

Then use password:

```text
123456
```

### Frontend cannot reach backend

Check:

- backend is running on `http://localhost:4000`
- `.env` contains `VITE_API_BASE=http://localhost:4000/api`
- browser devtools network tab shows API requests correctly

## Verified In This Environment

- Frontend build passes with `npm run build`

## Not Verified In This Environment

- Running a real MySQL server inside this environment
- Launching the Express server against a live database inside this environment

The code, SQL files, environment files, and local run steps are all prepared so you can run the full stack locally.