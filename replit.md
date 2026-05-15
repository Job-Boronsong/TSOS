# Workspace

## Overview

EduManage — a full-featured browser-based SaaS school management platform built as a pnpm workspace monorepo.

**Two access layers:**
- **Super Admin**: manages all schools, subscriptions (login: superadmin / superadmin123)
- **School Admin**: dashboard, students, classes, attendance, finance, teachers, reports, insights, settings
  - Greenfield Academy: admin_greenfield / admin123
  - Sunridge Primary: admin_sunridge / admin123

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Routing**: Wouter (with base path from `import.meta.env.BASE_URL`)
- **Database**: PostgreSQL + Drizzle ORM
- **Local offline DB**: Dexie.js (IndexedDB) + dexie-react-hooks
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Offline-First Architecture

All school admin pages (students, classes, attendance, finance, teachers, dashboard) are **offline-first**:

1. On first load (online), data is pulled from server into IndexedDB via `/api/sync/pull`
2. All reads come from IndexedDB via `useLiveQuery` — instant and works offline
3. All writes go to IndexedDB first, then queue an operation in `syncQueue`
4. When online, the sync engine pushes the queue via `/api/sync/push` and pulls fresh data
5. Sync status is shown in the sidebar (Online/Offline/Syncing/Pending changes)

Key offline files:
- `src/lib/local-db.ts` — Dexie schema (mirrors server schema)
- `src/lib/sync-service.ts` — Sync engine (push/pull, online/offline detection)
- `src/lib/sync-context.tsx` — React context for sync state
- `src/lib/offline-hooks.ts` — All offline-first React hooks
- `src/components/sync-status.tsx` — Sync status indicator in sidebar
- `artifacts/api-server/src/routes/sync.ts` — Backend sync endpoints

Super admin (schools overview) remains online-only since it manages all schools.

## Artifacts

- `artifacts/api-server` — Express API server, serves at `/api/*` (port 8080)
- `artifacts/school-saas` — React + Vite SPA, serves at `/` (port 23607)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## API Client Notes (CRITICAL)

- School URLs use **slug-based routing**: `/school/:schoolSlug/dashboard` (e.g. `/school/greenfield-academy/dashboard`); numeric `schoolId` obtained via `useSchoolId()` hook from `@/lib/school-hooks` which reads it from session; slug from URL params via `useSchoolSlug()`
- All API hooks use **positional** `schoolId: number` — e.g. `useListStudents(schoolId)` where `schoolId = useSchoolId()`; NO more `parseInt(params.schoolId)`
- `useRecordPayment` (not `useCreatePayment`) for fee payments
- `useMarkAttendance` takes `{schoolId, data:{date, records:[{studentId, status}]}}`
- `FinanceSummary` fields: `feesCollected`, `feesExpected`, `expenditureTotal`, `netCash`, `salesTotal`, `totalArrears`, `collectionRate`
- `CreateStudentBody` requires `name, studentNumber, category`; uses `parentName/parentPhone`; `studentNumber` auto-generated via GET `/schools/:id/students/next-id` (format: `{CODE}{YY}{NNNN}`, e.g. GA260001)
- `Class` schema uses `grade` (not `section`); has `studentCount`, `teacherName`, `level` ('nursery'|'kg'|'primary'|'jhs'), and `subjects` array (JHS only)
- **Class level rules**: Nursery/KG/Primary use `teacherId` (homeroom); JHS uses `classSubjectsTable` (per-subject teacher via `/schools/:id/classes/:id/subjects` CRUD)
- **Promote/Demote**: POST `/schools/:id/students/:id/promote` with `{toClassId, changeType: promoted|demoted|transferred, academicYear?, notes?}`; records to `studentClassHistoryTable`
- GET `/schools/:id/students/:id/history` returns class movement history with class names resolved
- Local DB (`local-db.ts`) is Dexie v2 — `classes` store indexed on `id, schoolId, level`
- Sync route (`sync.ts`) auth uses `req.session.userId` → lookup user from DB (`usersTable`); resolves schoolId from `user.role`
- Teacher portal auth is separate from school admin: `POST /teacher-auth/login` → sets `req.session.teacherId` + `teacherSchoolId`
- Teacher credential generation: `POST /schools/:id/teachers/:id/generate-credentials` → returns `{username, password}` (password shown ONCE, bcrypt-hashed in DB, mustChangePassword=true)
- Score entry: POST/GET `/teacher/scores` — 5 components: classWork(/10), classTest(/20), homework(/5), projectWork(/5), examScore(/60); total auto-computed (max 100); grade/remarks auto-computed (Ghana A1–F9 scale); teacher can override remarks
- Report card: GET `/schools/:id/students/:id/report?term=&academicYear=` → returns scores, summary, position in class
- School admin report card: `/school/:slug/students/:studentId/report` — school admin can view and print any student's report card
- Academic Terms: GET/POST/PUT/DELETE `/schools/:id/terms` — manage academic terms (Term 1/2/3); `academicTermsTable` in `lib/db/src/schema/operations.ts`
- CSV bulk import: POST `/schools/:id/students/import-csv` with `{csv: string}` — parses CSV, fuzzy-matches class names, returns `{imported, errors[]}`; frontend shows 5-row preview before import
- End-of-year promotion: POST `/schools/:id/students/promote-all` with `{mappings:[{fromClassId, toClassId|null}], academicYear}` — bulk promotes all classes at once
- Promotion Wizard (students.tsx): 3-step dialog — Step 1: choose mode (single class or all classes), Step 2: mapping editor (with auto-suggest for nursery→kg→primary→jhs progression), Step 3: review + confirm
- Expenditure categories: salaries, utilities, supplies, maintenance, other — finance page has category filter + breakdown table; reports page also shows category breakdown with progress bars
- ID Card Generator: students page toolbar → "ID Cards" dialog → filter by class → 3-column printable grid (credit card size); displays passport photo if available
- Passport Photo: `students` table has `photo_url text` column; `LocalStudent.photoUrl`; upload via `PassportPhotoUpload` component (presigned URL); shown in enrollment form and on ID cards
- Per-student Fee Waivers: `students` table has `fee_waiver`, `feeding_waiver`, `bus_waiver` boolean columns (default false); visible in student list as colored badges; editable via Add/Edit Student form checkboxes; filterable via "Waivers" dropdown; shown on student detail page header + details card; `feeWaiver=true` zeroes out the expected school fee in `enrichStudent`; `LocalStudent.feeWaiver?`, `.feedingWaiver?`, `.busWaiver?` (optional for backward compat with cached records)
- Dashboard speed: `useSchoolId()` in `school-hooks.ts` caches `schoolId` in localStorage under key `tsos_school_id`; on subsequent loads, returns cached value synchronously so `checkLocalData` runs before the `/api/auth/me` network call resolves, avoiding the "Downloading school data…" spinner on re-visits
- **DB Performance**: 16 composite indexes added on all core tables — `students(school_id, status)`, `attendance(school_id, date)`, `payments(school_id)`, `scores(school_id)`, `teacher_attendance(teacher_id, date)`, etc. — eliminating full table scans on sync pull queries
- `enrichSchools()` batch function (schools.ts): replaces N+1 `enrichSchool()` — fetches all subscriptions and student counts for an array of schools in 2 parallel queries instead of 2N sequential queries
- Report card position N+1 fix: classmate scores now fetched in a single `inArray` batch query instead of 1 query per classmate
- NaN guard on `GET /schools/:schoolId`: returns 404 instead of crashing when a non-numeric ID (e.g. "platform-price") hits the route
- Teacher Timetable: `GET /api/teacher/timetable` returns slots relevant to the logged-in teacher — homeroom teachers see all slots for their class; subject teachers see only their subjects' slots across all assigned classes; teacher dashboard shows a day-tab weekly view with highlighted "Your subject" badges
- Student Report Card: `/school/:slug/students/:id/report` — school admin view with term/year selectors and print button
- `hasLocalData(schoolId)` now also checks `lastSyncedAt` so empty schools (no students/classes) don't get permanently stuck on "Downloading..." screen
- SyncProvider: added 20s safety timeout (`setInitialSyncDone(true)`) and error fallback so dashboard always loads; sync triggered immediately on schoolId mount
- `School` uses `contactPhone` not `phone`; `CreateSchoolBody` requires `adminUsername, adminPassword, adminName, months`
- Billing: flat monthly fee (set by super admin via `GET/PUT /api/platform/settings`); discounts: 3-6 months=5%, 7+ months=10%
- Subscription top-up: `POST /api/schools/:id/subscription/topup {months}` extends from current expiry; `GET .../topup-preview?months=N` for cost preview
- Grace period: 3 days after expiry; auto-deactivation runs as a **daily cron only** (08:00 Africa/Accra) — NOT on request handlers (removed for performance)
- **Subscription Cancellation**: School admins can cancel from their dashboard banner via `POST /api/schools/:schoolId/subscription/cancel {reason?}`; sets `cancelled_at` + `cancellation_reason` on subscriptions table; school remains active until expiry date (normal grace period + deactivation applies after); renewing via Paystack clears the cancellation; super admin sees "Cancelled" badge in school list; cancelled banner shows with "Renew" option to reactivate
- `platform_settings` table (single row): `monthly_price` (default 500 GHS)
- Subscription `subscriptionStatus` field: "active" | "grace" | "expired" (computed from expiryDate + GRACE_DAYS)
- School admin dashboard shows subscription countdown banner from 7 days before expiry through grace period
- `updateSchool` mutation: `{schoolId: number, data: UpdateSchoolBody}`
- `RecordPaymentBody.paymentType` enum: `school_fee | bus_fee | other`
- `SchoolSettings.UpdateSchoolSettingsBody` does NOT have `logoUrl`
- After login, call `queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() })` to refresh auth state
- Radix `<Select.Item>` must NOT have empty string value — use sentinel like `"all"` instead
- GPS Teacher Check-in: `teacher_attendance` table has `check_in_time`, `check_out_time`, `device_info`, `checkin_latitude/longitude`, `check_in_method`; school_settings has `checkin_latitude/longitude/radius_meters`; haversine validation; teacher routes: POST `/teacher/checkin`, POST `/teacher/checkout`, GET `/teacher/checkin/today`
- Announcements: `announcements` + `announcement_reads` tables; admin CRUD at GET/POST/DELETE `/schools/:id/announcements`; teacher inbox at GET `/teacher/announcements`, POST `/teacher/announcements/:id/read`, GET `/teacher/announcements/unread-count`; social share buttons (WhatsApp/FB/IG/X); teacher dashboard `NotificationsPanel` clickable banner
- Operational Calendar Events: `calendar_events` table (school_id, title, description, start_date, end_date, start_time, end_time, category [academic/event/exams/meeting/holiday], target_type [all_staff/specific_classes/specific_teachers], target_ids JSON array); admin CRUD: GET/POST/PUT/DELETE `/schools/:id/events?month=YYYY-MM`; teacher view: GET `/teacher/calendar?month=YYYY-MM` (filters by audience); admin calendar page = visual monthly grid; teacher dashboard `UpcomingEventsWidget` + teacher `/teacher/calendar` full calendar page
- **Feeding/Canteen**: `feeding_records` (daily per-student register: fed/absent/opted_out) + `feeding_fund_entries` (credit/debit ledger with balance). Routes: GET/POST `/schools/:id/feeding/records?date=&classId=`, GET `/schools/:id/feeding/students`, GET `/schools/:id/feeding/summary?date=`, GET/POST `/schools/:id/feeding/fund?academicYear=&term=`, DELETE `/schools/:id/feeding/fund/:id`. Frontend: `/school/:slug/feeding` with Daily Register + Fund Tracker tabs.
- **Staff Payroll**: `staff_salary_profiles` (basic+allowances per teacher) + `payroll_runs` (monthly batches, draft/confirmed) + `payroll_entries` (per-teacher amounts). Ghana PAYE bands (GRA 2024 monthly) + SSNIT 5.5% employee / 13% employer; all fields admin-overridable. Routes: GET/POST `/schools/:id/salary-profiles`, GET/POST `/schools/:id/payroll-runs`, GET `/schools/:id/payroll-runs/:id/entries`, PUT entries to override, POST confirm. Frontend: `/school/:slug/payroll` with Salary Setup + Process Payroll tabs.
- **Discipline Log**: `discipline_records` (type: warning/detention/suspension/commendation; status: active/resolved/overridden; admin can override any field via `overridden_by_admin` flag + `admin_notes`). Routes: GET/POST/PUT/DELETE `/schools/:id/discipline`. Frontend: `/school/:slug/discipline` with type/status filters, Log Incident dialog, Override dialog.
- **End-of-Year Promotion**: `promotion_runs` tracks batch operations. Uses existing `student_class_history` table for individual moves. Routes: GET `/schools/:id/promotion/preview?academicYear=` (AI-suggests promote/retain/graduate per student based on year avg), POST `/schools/:id/promotion/confirm` (updates classId or status=inactive for graduates), GET `/schools/:id/promotion-runs`. Frontend: `/school/:slug/promotion` with wizard + history tab; admin can override individual decisions per student.
- **Paystack Billing**: Already fully implemented in `payments.ts` — POST `/payments/initialize`, POST `/payments/verify`, POST `/webhooks/paystack` (HMAC SHA512 signature verification); subscription renewal via Paystack popup; dashboard banner shows from 7 days before expiry.

## Workspace Structure

See the `pnpm-workspace` skill for full workspace structure, TypeScript setup, and package details.
