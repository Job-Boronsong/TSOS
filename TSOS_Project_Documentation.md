# Torrential School Operations Suite (TSOS)
## Complete Project Documentation

**Version:** 1.0 | **Platform:** Web (Browser-based) | **Region:** Ghana / Africa

---

## Table of Contents

### Part A — Product Overview
1. [What is TSOS?](#1-what-is-tsos)
2. [User Roles & Access Levels](#2-user-roles--access-levels)
3. [System Architecture](#3-system-architecture)
4. [Offline-First Design](#4-offline-first-design)

### Part B — Feature Reference
5. [Super Admin Portal](#5-super-admin-portal)
6. [School Admin Portal](#6-school-admin-portal)
7. [Teacher Portal](#7-teacher-portal)

### Part C — Technical Reference
8. [Tech Stack](#8-tech-stack)
9. [Monorepo Structure](#9-monorepo-structure)
10. [Database Schema](#10-database-schema)
11. [API Endpoints Reference](#11-api-endpoints-reference)
12. [Environment Variables](#12-environment-variables)
13. [Key Development Commands](#13-key-development-commands)

### Part D — User Guide
14. [Getting Started](#14-getting-started)
15. [Super Admin Walkthrough](#15-super-admin-walkthrough)
16. [School Admin Walkthrough](#16-school-admin-walkthrough)
17. [Teacher Walkthrough](#17-teacher-walkthrough)

---

# Part A — Product Overview

## 1. What is TSOS?

TSOS is a full-featured, browser-based **School Management SaaS platform** built specifically for schools in Ghana and other parts of Africa where internet connectivity is unreliable. It allows school administrators to manage their entire operation from a single web interface — students, classes, fees, feeding, attendance, teacher records, timetables, report cards, and more.

**Key design goals:**
- Works completely **offline** — data is stored locally on the device and syncs to the server whenever internet is available
- **Multi-tenant** — one platform installation serves many schools, each fully isolated
- **Mobile-friendly** — designed to work on phones and tablets as well as laptops
- **Ghana-specific** — GHS currency, local academic structure (Nursery → KG → Primary → JHS), Ghana grading scale (A1–F9)

---

## 2. User Roles & Access Levels

| Role | Login URL | Scope |
|---|---|---|
| **Super Admin** | `/login` → "Sign in as Super Admin" | Platform-wide: all schools, billing, analytics |
| **School Admin** | `/login` → select school | One school: students, fees, staff, reports, settings |
| **Teacher** | `/teacher-login` | Their class only: attendance, scores, report cards |

---

## 3. System Architecture

```
Browser (School Admin / Teacher)
    │
    ├── IndexedDB (Dexie.js) ← Offline-first local database
    │       │
    │       └── Sync Engine (sync-service.ts)
    │               ├── POST /api/sync/push  (send local changes)
    │               └── GET  /api/sync/pull  (receive server changes)
    │
    └── HTTP API Calls (when online)

Server
    ├── Express API Server (port 8080)
    │       ├── /api/auth/*         Authentication
    │       ├── /api/schools/*      School management
    │       ├── /api/sync/*         Offline sync engine
    │       ├── /api/payments/*     Paystack billing
    │       └── /api/...            All other routes
    │
    └── PostgreSQL Database (Drizzle ORM)

External Services
    ├── Paystack          — School subscription payments
    ├── AfricasTalking    — SMS notifications
    └── Google Cloud Storage — School logos & file uploads
```

The frontend (`school-saas`) is a React Single Page Application served by Vite. The backend (`api-server`) is an Express.js application. Both are deployed together under the same domain using path-based routing.

---

## 4. Offline-First Design

TSOS uses a **local-first sync architecture** for all school-level operations.

### How it works

**Step 1 — Initial Load (online required)**
When a school admin logs in for the first time on a device, the system pulls all school data from the server into a local database stored in the browser (IndexedDB).

**Step 2 — All reads come from local storage**
Every page — students, classes, attendance, finance, teachers — reads from IndexedDB. This means pages load instantly and work even with no internet.

**Step 3 — Writes queue locally first**
When you add a student, record a payment, or mark attendance, the change is saved to IndexedDB immediately. It is also added to a local sync queue.

**Step 4 — Background sync**
When internet is available, the sync engine automatically:
- **Pushes** the queue to `POST /api/sync/push`
- **Pulls** any changes from other devices via `GET /api/sync/pull`

**Step 5 — ID reconciliation**
Offline records get temporary local IDs. Once synced, the server assigns permanent IDs and the local records are updated.

### Sync Status Indicator
The sidebar always shows the current sync state:
- 🟢 **Online** — all data is synced
- 🔴 **Offline** — working locally, changes queued
- 🔄 **Syncing** — currently pushing/pulling
- 🟡 **Pending changes** — queued changes waiting for internet

### What works offline
- Viewing all students, classes, teachers
- Recording attendance (student and teacher)
- Recording fee and feeding payments
- Adding and editing students
- Entering scores (teachers)
- Viewing financial records and reports

### What requires internet
- First-time login on a new device
- Paystack subscription payments
- Super Admin operations (schools are managed online)

---

# Part B — Feature Reference

## 5. Super Admin Portal

Login: use the **Sign in as Super Admin** link on the login page.

### 5.1 Dashboard / Overview
- Total number of schools on the platform
- Total students across all schools
- Active vs inactive school count
- Schools expiring soon (within 7 days)
- Recent school registrations

### 5.2 School Management
**Create a school** with:
- School name, contact email/phone/address
- Admin username and password (for the school admin)
- Admin full name
- Number of subscription months to activate at creation
- School logo (PNG/JPG upload)
- Brand color (hex color code)

**Manage existing schools:**
- Edit school contact details
- Toggle a school active or inactive (inactive schools cannot log in)
- Reset the school admin password (if locked out)
- Unlock a locked account (after too many failed login attempts)
- View subscription status (Active / Expiring / Expired / Grace)
- Top up subscription (pay for additional months via Paystack)

### 5.3 Platform Pricing
- Set the monthly price per school (in GHS)
- Set automatic pre-payment discounts:
  - 3–6 months paid upfront: 5% discount
  - 7+ months paid upfront: 10% discount

### 5.4 Analytics
- Monthly platform revenue chart (area graph)
- Monthly transaction count (bar chart)
- List of schools expiring within 7 days

### 5.5 Data Reset
A destructive action for platform administrators:
- "Reset All Data" button on the Schools page
- Requires typing `DELETE ALL` as confirmation
- Wipes all schools, students, payments, and all related records
- Super admin account is preserved

---

## 6. School Admin Portal

Login: at `/login`, select the school from the dropdown, then enter username and password.

### 6.1 Dashboard
Real-time overview for the current day:
- Today's student attendance rate
- Fees collected today
- Total net cash position
- Top students with outstanding arrears
- Subscription renewal banner (appears 7 days before expiry)

### 6.2 Students
**Student record contains:**
- Full name, date of birth, gender
- Student number (auto-generated, e.g. GA260001)
- Class assignment
- Category: Regular, Bus (uses school transport), Scholarship, Staff Child
- Guardian name and phone number
- Status: Active, Inactive, Graduated

**Actions:**
- Add individual students
- Edit any student's details
- View per-student payment history
- View and print student report cards
- Generate student ID cards
- Soft delete / restore deleted students
- Promote individual students to another class

**Bulk CSV import:**
- Upload a CSV file with student data
- Preview the first 5 rows before importing
- See import results (how many succeeded, how many failed)
- Download a CSV template with correct column headers

**Promotion Wizard (End of Year):**
3-step wizard for promoting an entire school at year-end:
1. Choose mode: single class or all classes at once
2. Map each class to its destination class (Auto-Suggest fills in standard Ghana school progression)
3. Review student counts per move, then confirm

### 6.3 Classes
- Create and manage class groups
- Assign levels: Nursery, KG, Primary 1–6, JHS 1–3
- Assign a homeroom teacher (Nursery/KG/Primary) or per-subject teachers (JHS)
- Manage class subjects (JHS classes)
- View student count per class

### 6.4 Attendance
- View daily attendance for any class on any date
- Mark students Present, Absent, or Late
- Override an attendance record with a note
- Attendance is auto-marked as "Present" when a payment is recorded on that day (configurable)

### 6.5 Teacher Attendance
- Mark teaching staff as present or absent each day
- View staff attendance history and reports

### 6.6 Finance
**Summary cards:**
- Fees Collected (school, bus, and other fees)
- Feeding Collected (separate feeding payment tracking)
- Total Expenditure
- Net Cash (income minus expenses)

**Payments tab:**
- View all payments with student name, type, amount, and date
- Payment types: School Fee, Bus Fee, Feeding Fee, Other

**Record Payment dialog:**
- Search student by name or number
- Enter amount, type, date, optional notes
- Saves offline, syncs when online

**Record Feeding (quick button):**
- Dedicated dialog for daily feeding payments
- Amount auto-fills with the configured daily feeding rate
- Adjustable for multiple days (e.g. 3 days paid at once)

**Feeding Register tab:**
- Today's feeding stats: student count, amount collected
- Daily register: browse any date using arrow navigation or date picker
- Recent 14-day summary with daily totals (click any day to view its register)

**Expenditures tab:**
- Add expenses with category, description, amount, date
- Categories: Salaries, Utilities, Supplies, Maintenance, Other
- Filter by category
- Expenditure breakdown by category (progress bars, percentages)

### 6.7 Teachers
- Add and manage teaching staff
- Fields: name, phone, email, subject, qualification
- Generate login credentials for teachers (shown once)
- Teachers must change password on first login

### 6.8 Timetable
- Weekly schedule grid (Monday–Friday)
- Assign subjects and teachers to time slots
- Per-class timetable management

### 6.9 Calendar
- School event management
- Add holidays, exam periods, events with dates and descriptions

### 6.10 Reports
- Enrollment summary by class
- Attendance rate trends
- Finance summary: fees expected vs. collected, collection rate, arrears
- Expenditure breakdown by category with visual bars

### 6.11 Student Report Card (Admin View)
- Accessible from the Students page → student row → "Report Card"
- Select term and academic year
- View computed scores, grades, position in class
- Print button (Ctrl+P / Cmd+P to print or save as PDF)

### 6.12 Student ID Cards
- Access from Students page → "ID Cards" toolbar button
- Filter by class
- Select/deselect individual students
- Print layout: 3 cards per row, credit-card sized
- Each card: school logo, school name, student name, class, student number, academic year

### 6.13 Settings
**School Information:** name, contact, address

**Academic & Appearance:**
- Academic year (e.g. "2025-2026")
- School logo upload
- Brand color selection

**Daily Feeding Fee:**
- Set daily rate (GHS)
- Enable/disable the feeding module

**Academic Terms:**
- Add Terms (Term 1, Term 2, Term 3) with start and end dates
- Mark the currently active term
- Edit or delete terms

**Account Security:** Change admin password

### 6.14 Subscription Self-Service
- Renewal banner appears on the dashboard 7 days before expiry
- Click "Renew Now" to open Paystack payment
- Choose number of months — discount is applied automatically for 3+ months
- Payment confirmed in real time; subscription extended immediately

---

## 7. Teacher Portal

Login: at `/teacher-login`

### 7.1 Dashboard
- List of assigned classes (homeroom and/or subjects)
- Quick links to attendance and score entry
- Sync status indicator

### 7.2 Class View
- List of all students in the class
- Access to attendance, score entry, and reports

### 7.3 Attendance Marking
- Digital register for the teacher's class
- Mark each student: Present (P), Absent (A), or Late (L)
- Date picker to view or edit past registers
- Works fully offline

### 7.4 Score Entry
Per student, per subject, per term:
| Component | Max Marks |
|---|---|
| Class Work | 10 |
| Class Test | 20 |
| Homework | 5 |
| Project Work | 5 |
| Exam Score | 60 |
| **Total** | **100** |

- Grade computed automatically using Ghana's A1–F9 scale
- Teacher can override the printed remarks
- Scores saved offline and synced

### 7.5 Student Report Preview
- View a single student's computed terminal report before finalising
- Shows scores, grade, position in class, remarks

### 7.6 Cumulative View
- All students' scores in one table
- Useful for reviewing before finalising terminal scores

### 7.7 Mass Print (Whole Class Reports)
- Generates report cards for the entire class in one print job
- Proper page breaks between students
- Includes school logo, student photo (if available), all scores, grades, position, teacher remarks

---

# Part C — Technical Reference

## 8. Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 24 |
| **Package Manager** | pnpm (workspaces monorepo) |
| **Language** | TypeScript 5.9 |
| **Backend Framework** | Express.js 5 |
| **Frontend Framework** | React 19 |
| **Frontend Build** | Vite |
| **CSS** | Tailwind CSS v4 |
| **UI Components** | Radix UI + shadcn/ui |
| **Icons** | Lucide React |
| **Routing (frontend)** | Wouter |
| **Server State** | TanStack Query (React Query) |
| **Database** | PostgreSQL |
| **ORM** | Drizzle ORM |
| **Offline Storage** | Dexie.js (IndexedDB) |
| **Session Auth** | express-session + connect-pg-simple |
| **Password Hashing** | bcryptjs |
| **API Codegen** | Orval (OpenAPI → React hooks + Zod) |
| **Validation** | Zod v4 + drizzle-zod |
| **Backend Build** | esbuild |
| **Payments** | Paystack |
| **SMS** | AfricasTalking |
| **File Storage** | Google Cloud Storage |

---

## 9. Monorepo Structure

```
workspace/
├── artifacts/
│   ├── api-server/          Express API (port 8080, serves /api/*)
│   ├── school-saas/         React SPA (serves /)
│   └── mockup-sandbox/      Component preview server (dev only)
│
├── lib/
│   ├── db/                  Drizzle ORM schema + DB connection
│   ├── api-spec/            OpenAPI specification (YAML)
│   ├── api-zod/             Generated Zod request/response schemas
│   ├── api-client-react/    Generated React Query hooks
│   └── object-storage-web/  File upload components and hooks
│
├── pnpm-workspace.yaml
├── package.json
└── replit.md                Project notes and conventions
```

### Key files in `school-saas`

| File | Purpose |
|---|---|
| `src/lib/local-db.ts` | Dexie schema — mirrors the server database |
| `src/lib/sync-service.ts` | Sync engine (push/pull, online/offline detection) |
| `src/lib/sync-context.tsx` | React context exposing sync state |
| `src/lib/offline-hooks.ts` | All offline-first React hooks (`useLocalStudents`, etc.) |
| `src/components/sync-status.tsx` | Sync indicator in sidebar |
| `src/App.tsx` | Route definitions |
| `src/pages/login.tsx` | Login with redirect logic |

---

## 10. Database Schema

### schools
| Column | Type | Description |
|---|---|---|
| id | serial | Primary key |
| name | text | School name |
| slug | text | URL-safe identifier (e.g. `greenfield-academy`) |
| contact_email | text | |
| contact_phone | text | |
| address | text | |
| status | text | `active` or `inactive` |
| logo_url | text | Uploaded logo URL |
| theme_color | text | Hex brand color |
| academic_year | text | e.g. `2025-2026` |
| created_at | timestamp | |

### users
| Column | Type | Description |
|---|---|---|
| id | serial | Primary key |
| username | text | Login username |
| password_hash | text | bcrypt hash |
| name | text | Full name |
| role | text | `super_admin` or `school_admin` |
| school_id | integer | FK → schools (null for super admin) |
| failed_login_attempts | integer | Lockout counter |
| locked_until | timestamp | Account lockout expiry |
| must_change_password | boolean | Forces password change on next login |

### students
| Column | Type | Description |
|---|---|---|
| id | serial | Primary key |
| school_id | integer | FK → schools |
| name | text | Full name |
| student_number | text | Auto-generated (e.g. GA260001) |
| class_id | integer | FK → classes |
| category | text | `regular`, `bus`, `scholarship`, `staff_child` |
| gender | text | |
| date_of_birth | date | |
| parent_name | text | Guardian name |
| parent_phone | text | Guardian phone |
| status | text | `active`, `inactive`, `graduated` |
| created_at | timestamp | |

### classes
| Column | Type | Description |
|---|---|---|
| id | serial | Primary key |
| school_id | integer | FK → schools |
| name | text | e.g. `Primary 4A` |
| level | text | `nursery`, `kg`, `primary`, `jhs` |
| grade | text | e.g. `4`, `KG1` |
| teacher_id | integer | FK → teachers (homeroom) |
| student_count | integer | Cached count |

### teachers
| Column | Type | Description |
|---|---|---|
| id | serial | Primary key |
| school_id | integer | FK → schools |
| name | text | Full name |
| username | text | Login username |
| password_hash | text | bcrypt hash |
| phone | text | |
| email | text | |
| subject | text | Primary subject |
| qualification | text | |
| status | text | `active` or `inactive` |
| must_change_password | boolean | |

### attendance
| Column | Type | Description |
|---|---|---|
| id | serial | Primary key |
| school_id | integer | FK → schools |
| student_id | integer | FK → students |
| date | date | |
| status | text | `present`, `absent`, `late` |
| marked_via_payment | boolean | Auto-marked when payment recorded |
| overridden | boolean | Manually changed after auto-mark |
| notes | text | Optional override reason |

### payments
| Column | Type | Description |
|---|---|---|
| id | serial | Primary key |
| school_id | integer | FK → schools |
| student_id | integer | FK → students |
| amount | numeric(10,2) | |
| payment_date | date | |
| payment_type | text | `school_fee`, `bus_fee`, `feeding_fee`, `other` |
| notes | text | |
| created_at | timestamp | |

### expenditures
| Column | Type | Description |
|---|---|---|
| id | serial | Primary key |
| school_id | integer | FK → schools |
| description | text | |
| amount | numeric(10,2) | |
| expenditure_date | date | |
| category | text | `salaries`, `utilities`, `supplies`, `maintenance`, `other` |

### scores
| Column | Type | Description |
|---|---|---|
| id | serial | Primary key |
| school_id | integer | FK → schools |
| student_id | integer | FK → students |
| class_id | integer | FK → classes |
| subject | text | |
| term | text | e.g. `Term 1` |
| academic_year | text | |
| class_work | numeric | Max 10 |
| class_test | numeric | Max 20 |
| homework | numeric | Max 5 |
| project_work | numeric | Max 5 |
| exam_score | numeric | Max 60 |
| total_score | numeric | Auto-computed, max 100 |
| grade | text | Ghana scale: A1–F9 |
| remarks | text | Auto or teacher-overridden |

### fee_settings (one row per school)
| Column | Type | Description |
|---|---|---|
| school_fee | numeric | Base term/annual fee |
| bus_fee | numeric | Extra fee for bus students |
| scholarship_discount | numeric | % discount for scholarship students |
| staff_child_discount | numeric | % discount for staff children |
| feeding_fee_per_day | numeric | Daily feeding rate |
| feeding_enabled | text | `true` or `false` |
| term_billing_enabled | text | Per-term or annual billing |

### subscriptions
| Column | Type | Description |
|---|---|---|
| id | serial | Primary key |
| school_id | integer | FK → schools |
| plan | text | e.g. `standard` |
| billing_cycle | text | `monthly` |
| status | text | `active`, `grace`, `expired` |
| start_date | date | |
| expiry_date | date | |
| amount | numeric | Amount paid |
| months_paid | integer | Months covered |
| monthly_price | numeric | Rate at time of payment |
| discount_pct | numeric | Discount applied |

### Other tables
| Table | Purpose |
|---|---|
| `academic_terms` | Term 1/2/3 with start/end dates per school |
| `timetable_slots` | Weekly schedule per class |
| `academic_calendar` | School events and holidays |
| `teacher_attendance` | Daily staff attendance records |
| `student_class_history` | Log of every class change per student |
| `class_subjects` | Per-subject teacher assignment (JHS) |
| `student_fee_ledger` | Detailed per-student fee ledger entries |
| `payment_transactions` | Paystack transaction records for subscriptions |
| `platform_settings` | Single-row table: monthly price for the platform |
| `school_settings` | Per-school config (name, logo, theme, year) |
| `feature_toggles` | Per-school feature flags |
| `audit_logs` | Record of all significant admin actions |
| `sales` | Non-fee income (tuck shop, uniforms, etc.) |
| `session` | Server-side session storage |

---

## 11. API Endpoints Reference

All routes are prefixed with `/api`.

### Authentication
| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | School admin / super admin login |
| GET | `/auth/me` | Get current session user and school |
| POST | `/auth/logout` | End session |
| POST | `/auth/change-password` | Change own password |
| POST | `/auth/set-password` | Admin sets a user's password |
| GET | `/auth/school-username-hint/:schoolId` | Get admin username hint for login page |

### Teacher Auth
| Method | Path | Description |
|---|---|---|
| POST | `/teacher-auth/login` | Teacher login |
| GET | `/teacher-auth/me` | Get current teacher session |

### Schools (Super Admin)
| Method | Path | Description |
|---|---|---|
| GET | `/schools` | List all schools |
| POST | `/schools` | Create a new school |
| GET | `/schools/overview` | Platform overview stats |
| GET | `/schools/:id` | Get one school |
| PUT | `/schools/:id` | Update school details |
| PATCH | `/schools/:id/status` | Activate or deactivate a school |
| PUT | `/schools/:id/admin-password` | Reset school admin password |
| POST | `/schools/:id/admin-unlock` | Unlock a locked account |
| POST | `/admin/wipe-all-data` | Wipe all school data (destructive) |
| GET | `/platform/settings` | Get platform pricing settings |
| PUT | `/platform/settings` | Update platform pricing |
| GET | `/admin/analytics` | Platform-wide revenue and analytics |

### Subscriptions
| Method | Path | Description |
|---|---|---|
| GET | `/schools/:id/subscription` | Get school subscription details |
| PUT | `/schools/:id/subscription` | Update subscription |
| POST | `/schools/:id/subscription/topup` | Add months to subscription |
| GET | `/schools/:id/subscription/topup-preview` | Preview cost of top-up |
| POST | `/payments/initialize` | Start Paystack payment |
| POST | `/payments/verify` | Verify Paystack payment |
| POST | `/webhooks/paystack` | Paystack webhook receiver |

### School Dashboard
| Method | Path | Description |
|---|---|---|
| GET | `/schools/:id/dashboard` | Dashboard stats |
| GET | `/schools/:id/reports/daily` | Daily summary report |

### Students
| Method | Path | Description |
|---|---|---|
| GET | `/schools/:id/students` | List all students |
| POST | `/schools/:id/students` | Add a student |
| PUT | `/schools/:id/students/:sid` | Edit a student |
| DELETE | `/schools/:id/students/:sid/soft` | Soft-delete a student |
| POST | `/schools/:id/students/:sid/restore` | Restore soft-deleted student |
| GET | `/schools/:id/students/deleted` | List soft-deleted students |
| POST | `/schools/:id/students/import` | Bulk CSV import |
| POST | `/schools/:id/students/import-preview` | Preview CSV before import |
| POST | `/schools/:id/students/promote` | Promote a student to new class |
| POST | `/schools/:id/students/promote-all` | Promote all classes (end of year) |

### Classes & Teachers
| Method | Path | Description |
|---|---|---|
| GET | `/schools/:id/classes` | List classes |
| POST | `/schools/:id/classes` | Create class |
| PUT | `/schools/:id/classes/:cid` | Edit class |
| DELETE | `/schools/:id/classes/:cid` | Delete class |
| GET | `/schools/:id/teachers` | List teachers |
| POST | `/schools/:id/teachers` | Add teacher |
| PUT | `/schools/:id/teachers/:tid` | Edit teacher |
| POST | `/schools/:id/teachers/:tid/generate-credentials` | Generate teacher login |

### Attendance
| Method | Path | Description |
|---|---|---|
| GET | `/schools/:id/attendance` | Get attendance records |
| POST | `/schools/:id/attendance` | Mark attendance |
| POST | `/schools/:id/attendance/override` | Override an attendance record |
| GET | `/schools/:id/teacher-attendance` | Teacher attendance records |
| POST | `/schools/:id/teacher-attendance/bulk` | Bulk mark teacher attendance |
| GET | `/schools/:id/teacher-attendance/report` | Teacher attendance report |

### Finance
| Method | Path | Description |
|---|---|---|
| GET | `/schools/:id/fee-settings` | Get fee configuration |
| PUT | `/schools/:id/fee-settings` | Update fee configuration |
| GET | `/schools/:id/payments` | List all payments |
| POST | `/schools/:id/payments` | Record a payment |
| GET | `/schools/:id/sales` | List sales entries |
| POST | `/schools/:id/sales` | Add a sale |
| GET | `/schools/:id/expenditures` | List expenditures |
| POST | `/schools/:id/expenditures` | Add expenditure |
| GET | `/schools/:id/finance/summary` | Financial summary with feeding stats |
| GET | `/schools/:id/feeding/register` | Daily/monthly feeding register |
| GET | `/schools/:id/arrears` | Students with outstanding fees |
| GET | `/schools/:id/fee-ledger` | Student fee ledger |
| POST | `/schools/:id/fee-ledger` | Add ledger entry |
| POST | `/schools/:id/fee-ledger/bulk-init` | Initialize ledger for all students |

### Academic
| Method | Path | Description |
|---|---|---|
| GET | `/schools/:id/terms` | List academic terms |
| POST | `/schools/:id/terms` | Add a term |
| PUT | `/schools/:id/terms/:tid` | Edit a term |
| DELETE | `/schools/:id/terms/:tid` | Delete a term |
| GET | `/schools/:id/timetable` | Get timetable |
| POST | `/schools/:id/timetable` | Create timetable slot |
| PUT | `/schools/:id/timetable/:slotId` | Edit slot |
| DELETE | `/schools/:id/timetable/:slotId` | Delete slot |
| POST | `/schools/:id/timetable/bulk` | Bulk save timetable |
| GET | `/schools/:id/calendar` | Get calendar events |
| POST | `/schools/:id/calendar` | Add calendar event |
| PUT | `/schools/:id/calendar/:eid` | Edit event |
| DELETE | `/schools/:id/calendar/:eid` | Delete event |

### Reports & Scores
| Method | Path | Description |
|---|---|---|
| GET | `/schools/:id/students/:sid/report` | Student report card data |
| GET | `/teacher/scores` | Get scores (teacher session) |
| POST | `/teacher/scores` | Save scores (teacher session) |

### Sync Engine
| Method | Path | Description |
|---|---|---|
| GET | `/sync/pull` | Pull server changes since a timestamp |
| POST | `/sync/push` | Push local queued changes to server |

### Exports
| Method | Path | Description |
|---|---|---|
| GET | `/schools/:id/export/students` | Download students as CSV |
| GET | `/schools/:id/export/teachers` | Download teachers as CSV |
| GET | `/schools/:id/export/attendance` | Download attendance as CSV |

### Storage
| Method | Path | Description |
|---|---|---|
| POST | `/storage/uploads/request-url` | Get a signed upload URL |
| GET | `/storage/public-objects/*` | Serve public uploaded files |

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/healthz` | Server health check |

---

## 12. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret key for signing session cookies |
| `PAYSTACK_PUBLIC_KEY` | Yes | Paystack public key for frontend |
| `PAYSTACK_SECRET_KEY` | Yes | Paystack secret key for backend |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Yes | GCS bucket for file uploads |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Yes | Paths for publicly accessible uploads |
| `PRIVATE_OBJECT_DIR` | Yes | Path for private uploaded files |
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | Yes | Port for the API server (default 8080) |

---

## 13. Key Development Commands

```bash
# Install all dependencies
pnpm install

# Run API server in development mode
pnpm --filter @workspace/api-server run dev

# Run frontend in development mode
pnpm --filter @workspace/school-saas run dev

# Typecheck all packages
pnpm run typecheck

# Push database schema changes
pnpm --filter @workspace/db run push

# Force push schema (skip interactive prompts)
pnpm --filter @workspace/db run push-force

# Regenerate API client hooks from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Build everything for production
pnpm run build
```

---

# Part D — User Guide

## 14. Getting Started

### Default Login Credentials (Development)
| Account | Username | Password |
|---|---|---|
| Super Admin | `superadmin` | `superadmin123` |
| Greenfield Academy Admin | `admin_greenfield` | `admin123` |
| Sunridge Primary Admin | `admin_sunridge` | `admin123` |

> **Important:** Change all passwords before using in production.

---

## 15. Super Admin Walkthrough

### First-time setup

1. **Log in** at `/login` → click "Sign in as Super Admin"
2. Go to **Schools** → click "Add School"
3. Fill in all school details and set admin credentials
4. Set the **monthly price** at the top of the Schools page
5. The school is now live — the admin can log in immediately

### Ongoing tasks

- **Monthly:** check Analytics for revenue and expiring schools
- **As needed:** top up subscriptions, reset passwords, unlock accounts
- **Yearly:** review and update platform pricing

---

## 16. School Admin Walkthrough

### Initial school setup (do this first)

1. **Log in** at `/login` → select your school → enter credentials
2. Go to **Settings**:
   - Update school name, logo, and brand color
   - Set the current academic year
   - Set your daily **feeding fee rate** (if applicable)
   - Add your **academic terms** (Term 1, Term 2, Term 3)
3. Go to **Classes** → add all classes (Nursery 1, Primary 4A, JHS 2, etc.)
4. Go to **Teachers** → add all teachers and generate their login credentials
5. Go to **Students** → add students (or import via CSV)
   - Assign each student to the correct class and category

### Daily routine

| Time | Task | Where |
|---|---|---|
| Morning | Check dashboard stats | Dashboard |
| Morning | Record fee/feeding payments as students arrive | Finance → Record Feeding / Record Payment |
| During day | Any student additions or edits | Students |
| End of day | Review net cash, check arrears | Finance / Dashboard |

### Weekly / Monthly tasks
- Review expenditure breakdown (Finance → Expenditures tab)
- Check attendance trends (Reports page)
- Export student/teacher data as needed (via CSV export)

### End of term
1. Ensure all scores have been entered by teachers
2. Print student ID cards if needed (Students → ID Cards)
3. Print report cards for each class

### End of year
1. Use the **Promotion Wizard** (Students → Promote Students)
2. Run Auto-Suggest to map all classes to their next level
3. Review and confirm the promotion
4. Update the academic year in Settings
5. Add new academic terms for the next year

---

## 17. Teacher Walkthrough

### First login
1. Go to `/teacher-login`
2. Enter your username and password (provided by the school admin)
3. You will be asked to change your password immediately

### Daily attendance (do every morning)
1. Open your class from the dashboard
2. Click **Attendance**
3. Tap each student: P (Present), A (Absent), L (Late)
4. The register saves automatically — even without internet

### Entering scores (end of term)
1. Open your class
2. Click a student's name → **Enter Scores**
3. Fill in: Class Work, Class Test, Homework, Project Work, Exam Score
4. Add a remark (or edit the auto-generated one)
5. Save — repeat for each student

### Reviewing before printing
- Use **Cumulative View** to see all students' scores at a glance
- Click individual students to preview their full report card

### Printing report cards
1. From the class page, click **Print All Reports**
2. A print-ready layout opens with all students
3. Press Ctrl+P (Windows) or Cmd+P (Mac) to print or save as PDF

---

## Quick Reference Card

| I want to… | Go to… |
|---|---|
| Create a new school | Super Admin → Schools → Add School |
| Reset a school admin password | Super Admin → Schools → Reset Password button |
| Check platform revenue | Super Admin → Analytics |
| Wipe all data for a fresh start | Super Admin → Schools → Reset All Data |
| Add a student | School Admin → Students → Add Student |
| Import students from Excel/CSV | School Admin → Students → Import CSV |
| Record a school fee payment | School Admin → Finance → Record Payment |
| Record daily feeding | School Admin → Finance → Record Feeding |
| View today's feeding register | School Admin → Finance → Feeding tab |
| Mark student attendance | School Admin → Attendance |
| Add a class | School Admin → Classes → Add Class |
| Add a teacher | School Admin → Teachers → Add Teacher |
| Set feeding daily rate | School Admin → Settings → Daily Feeding Fee |
| Print student ID cards | School Admin → Students → ID Cards |
| Promote students at year end | School Admin → Students → Promote Students |
| View expenditure by category | School Admin → Finance → Expenditures tab |
| Print a student's report card | School Admin → Students → (student row) → Report Card |
| Mark teacher attendance | School Admin → Teacher Attendance |
| Mark class attendance (teacher) | Teacher → My Class → Attendance |
| Enter student scores (teacher) | Teacher → My Class → (student name) → Enter Scores |
| Print class report cards (teacher) | Teacher → My Class → Print All Reports |
| Change my password | Settings → Account Security (or on first login) |

---

*Torrential School Operations Suite — Built for African Schools*
*Documentation Version 1.0 — April 2026*
