# Torrential School Operations Suite (TSOS)
## Complete Step-by-Step User Guide

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Logging In](#2-logging-in)
3. [Super Admin — Platform Management](#3-super-admin--platform-management)
4. [School Admin — Setting Up a School](#4-school-admin--setting-up-a-school)
5. [School Admin — Daily Operations](#5-school-admin--daily-operations)
6. [School Admin — Finance & Feeding](#6-school-admin--finance--feeding)
7. [School Admin — Reports](#7-school-admin--reports)
8. [Teacher Portal — Daily Use](#8-teacher-portal--daily-use)
9. [Offline Mode](#9-offline-mode)
10. [Quick Reference — Who Does What](#10-quick-reference--who-does-what)

---

## 1. System Overview

TSOS is a browser-based school management platform built for schools in areas with unreliable internet. It has three layers:

| Who | What they manage |
|---|---|
| **Super Admin** | The platform owner. Creates schools, manages subscriptions, views platform-wide analytics. |
| **School Admin** | The head teacher or principal of one school. Manages students, fees, feeding, attendance, staff, and reports. |
| **Teacher** | Manages their own class — marks daily attendance, enters scores, prints report cards. |

> **Offline-first:** Everything the School Admin and Teacher do is saved locally on the device first. When internet is available, changes sync automatically to the server.

---

## 2. Logging In

There are **two login pages**:

### School Admin / Super Admin Login
**URL:** `https://your-domain.replit.app/login`

- Select your school from the dropdown
- Enter your **username** and **password**
- Click **Sign in**
- School admins are taken directly to their school dashboard
- Super admins are taken to the platform overview

### Teacher Login
**URL:** `https://your-domain.replit.app/teacher-login`

- Enter your **username** and **password**
- No school selection needed — teachers are linked to their school automatically

### First Time / Forgotten Password
- Passwords are set by the Super Admin when creating a school
- The Super Admin can reset any school admin password from the Schools page
- On first login you may be prompted to change your password

---

## 3. Super Admin — Platform Management

> Log in using **Sign in as Super Admin** on the login page.

### 3.1 Creating a School

1. Go to **Schools** in the left sidebar
2. Click **Add School** (top right)
3. Fill in the form:
   - **School Name** — e.g. "Greenfield Academy"
   - **Contact Email / Phone / Address**
   - **Admin Username & Password** — what the school admin will use to log in
   - **Admin Full Name**
   - **Subscription Months** — how many months to activate at creation
   - **Logo** — upload a PNG or JPG (optional but recommended)
   - **Brand Color** — pick a hex color to theme the school's interface
4. Click **Create School**

The school is now live. The admin can log in immediately.

### 3.2 Managing Existing Schools

From the **Schools** table you can:

- **Edit** a school's name, contact, address
- **Toggle Active/Inactive** — inactive schools cannot log in
- **Reset Password** — generates a new password for the school admin if they are locked out
- **Top Up Subscription** — extend a school's subscription by paying via Paystack
- **View Subscription Status** — shows expiry date, days remaining, and status badge (Active / Expiring / Expired)

### 3.3 Platform Pricing

At the top of the Schools page:
- Set the **Monthly Price (GHS)** — this is the rate charged per month per school
- Set **Pre-payment Discounts** — automatic % discounts for paying 3, 6, or 12 months at once
- Click **Save**

### 3.4 Resetting All Data (Fresh Start)

If you need to clear everything and start with new schools:

1. Click the red **Reset All Data** button (top of Schools page)
2. A warning dialog appears — read it carefully
3. Type **DELETE ALL** exactly into the confirmation box
4. Click **Wipe All Data**

> This deletes all schools, students, classes, payments, and all other records. Your Super Admin account is preserved.

### 3.5 Analytics

Go to **Analytics** to see:
- **Monthly Revenue** — area chart of platform income over time
- **Transaction Count** — how many school payments were processed each month
- **Schools Expiring Soon** — a list of schools whose subscriptions expire within 7 days

---

## 4. School Admin — Setting Up a School

> First time logging in? Start here before using the system day-to-day.

### 4.1 School Settings

Go to **Settings** in the left sidebar.

**School Information**
- Update your school name, contact email, phone number, and address
- Upload your school logo (appears in the sidebar and on report cards)
- Set your brand color

**Academic & Appearance**
- Set the current **Academic Year** (e.g. "2025-2026")
- Upload or change your school logo

Click **Save Settings** when done.

**Daily Feeding Fee**
- Enter your **Daily Rate (GHS)** — e.g. 5.00
- Toggle **Feeding Enabled** to ON
- Click **Save Feeding Settings**

This daily rate auto-fills whenever you record a feeding payment.

**Academic Terms**
- Click **Add Term**
- Enter: Term name (Term 1, Term 2, Term 3), Academic Year, Start Date, End Date
- Click the **Set Current** star on the term currently in progress
- You can edit or delete terms at any time

### 4.2 Setting Up Classes

Go to **Classes** in the sidebar.

1. Click **Add Class**
2. Enter the class name (e.g. "Primary 4A")
3. Select the level: Nursery, KG, Primary 1–6, JHS 1–3
4. Assign a class teacher (optional at this stage)
5. Click **Save**

Repeat for all classes in your school. Classes must exist before you can enroll students.

### 4.3 Adding Teachers

Go to **Teachers** in the sidebar.

1. Click **Add Teacher**
2. Fill in: Full name, phone, email, subject(s), qualification
3. Set login credentials (username + password)
4. Click **Save**

The teacher can now log in at `/teacher-login`.

### 4.4 Enrolling Students

Go to **Students** in the sidebar.

**Add one student:**
1. Click **Add Student**
2. Fill in: Full name, date of birth, gender, guardian name, guardian phone
3. Select their **Class**
4. Select their **Category**: Regular, Bus (travels by school bus), Scholarship, or Staff Child
5. Click **Save**

**Bulk import via CSV:**
1. Click **Import CSV**
2. Download the template if needed
3. Prepare your CSV with columns: `name, dateOfBirth, gender, guardianName, guardianPhone, className`
4. Upload the file — a preview of the first 5 rows appears
5. Confirm import
6. A summary shows how many were imported and any errors

### 4.5 Fee Settings

Fee amounts are managed from the Settings page. The finance calculations use:
- **School Fee** — base term or annual fee
- **Bus Fee** — additional fee for bus students
- **Scholarship Discount** — % off for scholarship students
- **Staff Child Discount** — % off for staff children
- **Daily Feeding Fee** — pre-filled when recording feeding payments

---

## 5. School Admin — Daily Operations

### 5.1 The Dashboard

Every day, start at the **Dashboard**. It shows:
- **Today's Attendance Rate** — % of students present today
- **Fees Collected Today** — payments recorded today
- **Net Cash Position** — total collected minus total spent
- **Students with Arrears** — those with unpaid fees
- **Subscription Banner** — appears if your subscription is expiring soon

### 5.2 Taking Attendance

Go to **Attendance**.

1. Select a class and the date (defaults to today)
2. The student list appears — each student shows their status
3. Click a student's status to toggle between **Present**, **Absent**, and **Late**
4. Changes save automatically (offline-safe)

> Attendance can also be marked automatically when a payment is recorded — useful for schools that collect fees at the gate each morning.

### 5.3 Student Management

From the **Students** page:

- **Search** students by name or student number
- **Filter** by class or status (Active / Inactive / Graduated)
- Click a student row to view their profile
- **Edit** any student's details
- **View payment history** for a student
- **Generate an ID card** — see Section 5.6
- **View Report Card** — see Section 8

### 5.4 Year-End Promotion (Promotion Wizard)

At the end of the academic year, promote students to the next class:

1. Go to **Students** and click **Promote Students**
2. **Step 1 — Choose mode:**
   - *Single class* — promote students in one specific class only
   - *All classes (End of Year)* — promote the entire school at once
3. **Step 2 — Map classes:**
   - Each current class is mapped to a destination class
   - Click **Auto-Suggest** to auto-fill standard progressions:
     - Nursery 1 → Nursery 2 → KG 1 → KG 2
     - Primary 1 → 2 → ... → 6
     - JHS 1 → JHS 2 → JHS 3 → Graduated
   - Adjust any mapping manually if needed
4. **Step 3 — Review & Confirm:**
   - See how many students move to each class
   - Click **Confirm Promotion** to execute

### 5.5 Class Timetable

Go to **Timetable**.

- Select a class
- Click any time slot to assign a subject and teacher
- The grid covers Monday–Friday with customizable time periods
- Changes sync automatically

### 5.6 Student ID Cards

1. Go to **Students**
2. Click **ID Cards** in the toolbar
3. Select the class you want to print for
4. Check/uncheck individual students
5. Click **Print ID Cards**
6. A print-ready layout opens — 3 cards per row, credit-card sized
   - Each card shows: school logo, school name, student name, class, student number, academic year

---

## 6. School Admin — Finance & Feeding

### 6.1 Finance Overview

Go to **Finance**. Four summary cards appear at the top:

| Card | What it shows |
|---|---|
| Fees Collected | Total school/bus/other fee payments |
| Feeding Collected | Total feeding payments (separate from fees) |
| Total Expenditure | All recorded expenses |
| Net Cash | (Fees + Feeding) minus Expenses |

### 6.2 Recording a Fee Payment

1. Click **Record Payment** (blue button, top right)
2. Search for the student by name or number
3. Click the student's name to select them
4. Enter the **amount**, **type** (School Fee, Bus Fee, Feeding Fee, Other), and **date**
5. Add an optional note
6. Click **Record Payment**

The payment saves locally and syncs to the server when online.

### 6.3 Recording Feeding Payments (Daily Feeding)

The quickest way to record feeding:

1. Click the orange **Record Feeding** button
2. Search for and select the student
3. The **amount** is pre-filled with your daily feeding rate (set in Settings)
4. Adjust the amount if the student paid for multiple days
5. Add a note if needed (e.g. "3 days" or "Week 2")
6. Click **Record Feeding Payment**

### 6.4 Feeding Tab — Daily Register

Click the **Feeding** tab to see the register:

**Today's stats:**
- How many students paid for feeding today
- Total collected today
- All-time feeding total

**Daily Register:**
- Shows every student who paid for feeding on the selected date
- Use the **left/right arrows** to browse previous or next days
- Or type a date directly in the date box
- Click **Add** to record a feeding payment for that date
- A **Recent Days Summary** below shows the last 14 active feeding days — click any row to jump to it

### 6.5 Recording an Expense

1. Click **Add Expense** (outline button)
2. Enter the amount, description, category, and date
3. Categories: Salaries, Utilities, Supplies, Maintenance, Other
4. Click **Record Expenditure**

### 6.6 Expenditure Breakdown

On the **Expenditures** tab, below the table you'll find a **breakdown by category** showing:
- How much was spent in each category
- The percentage each category represents
- A visual progress bar for easy comparison

You can also **filter by category** using the dropdown at the top of the tab.

### 6.7 Subscription Renewal

If your subscription is about to expire, a yellow banner appears on the dashboard. Click **Renew Now** to pay via Paystack directly from within the system. Prepay multiple months to get an automatic discount.

---

## 7. School Admin — Reports

Go to **Reports** in the sidebar.

### What the Reports page shows:

**Enrollment Summary**
- Total active students
- Breakdown by class

**Attendance Report**
- Average attendance rate for the current period
- Daily trend

**Finance Summary**
- Total fees collected vs. expected
- Collection rate (%)
- Outstanding arrears

**Expenditure Breakdown**
- Category-by-category spending analysis with bars and percentages

**Student Report Cards**
To view an individual student's report card:
1. Go to **Students**
2. Find the student and click their row
3. Click **Report Card**
4. Select the term and academic year
5. Use **Print** (Ctrl+P or Cmd+P) to print or save as PDF

---

## 8. Teacher Portal — Daily Use

> Teachers log in at `/teacher-login`

### 8.1 Teacher Dashboard

After login, you see your assigned class(es) or subjects. Click a class to open it.

### 8.2 Marking Attendance

1. From your class page, click **Attendance**
2. Today's date is pre-selected
3. Tap each student's name to mark: **Present (P)**, **Absent (A)**, or **Late (L)**
4. The register saves automatically — works offline too

### 8.3 Entering Scores

1. From your class page, click a student's name
2. Click **Enter Scores**
3. Enter scores for each assessment component (Class work, Homework, Project, Exam)
4. Add a teacher remark for the term
5. Save — the scores sync when online

### 8.4 Student Report Preview

Before printing, preview any student's terminal report:
- From the class list, click the student → **View Report**
- You can see computed totals, grades, position in class, and remarks

### 8.5 Mass Print (Whole Class Report Cards)

At the end of term:
1. From your class page, click **Print All Reports**
2. All students' report cards are generated in one print job
3. Use Ctrl+P (or Cmd+P) to send to printer or save as PDF
4. Cards have proper page breaks — one card per student

### 8.6 Cumulative View

Click **Cumulative** on your class page to see all students' scores in one table — useful for reviewing before finalizing the term.

---

## 9. Offline Mode

TSOS is designed to work without internet. Here is what happens:

### When internet is available:
- All data syncs automatically every 30 seconds
- A green sync indicator shows in the top bar
- Any actions taken offline are uploaded immediately when connection returns

### When offline:
- You can still mark attendance
- Record fee and feeding payments
- View all student, class, and financial data
- Enter teacher scores

Any record saved offline shows a **(pending)** tag until it syncs.

### What requires internet:
- Initial login (first time)
- Paystack subscription payments
- Creating or editing schools (Super Admin)

> **Tip:** Load the school dashboard while you have internet before going to a low-connectivity area. The app caches everything it needs.

---

## 10. Quick Reference — Who Does What

| Task | Super Admin | School Admin | Teacher |
|---|:---:|:---:|:---:|
| Create/delete schools | ✅ | | |
| Manage subscriptions & billing | ✅ | ✅ (self-renew) | |
| View platform analytics | ✅ | | |
| Reset school admin password | ✅ | | |
| Manage school settings & logo | | ✅ | |
| Add / edit students | | ✅ | |
| Import students via CSV | | ✅ | |
| Manage classes & timetable | | ✅ | |
| Record fee payments | | ✅ | |
| Record feeding payments | | ✅ | |
| View expenditure & reports | | ✅ | |
| Print student ID cards | | ✅ | |
| Promote students (year-end) | | ✅ | |
| Mark daily attendance | | ✅ | ✅ |
| Enter student scores | | | ✅ |
| Print class report cards | | | ✅ |
| View cumulative scores | | | ✅ |

---

*TSOS — Torrential School Operations Suite*
*Built for schools in Ghana and across Africa*
