import { Router, type IRouter } from "express";
import { eq, and, isNull, desc, sql, gte, lte, between } from "drizzle-orm";
import multer from "multer";
import { parse } from "csv-parse/sync";
import {
  db,
  timetableSlotsTable,
  academicCalendarTable,
  teacherAttendanceTable,
  studentFeeledgerTable,
  academicTermsTable,
  auditLogsTable,
  studentsTable,
  classesTable,
  teachersTable,
  schoolsTable,
  subscriptionsTable,
  paymentTransactionsTable,
  studentClassHistoryTable,
  announcementsTable,
  announcementReadsTable,
  calendarEventsTable,
  scoresTable,
  classSubjectsTable,
} from "@workspace/db";
import { writeAudit } from "../lib/audit";
import { sendSMS } from "../lib/sms";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function schoolId(req: any): number {
  return parseInt(req.params.schoolId, 10);
}

// ─────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────
router.get("/schools/:schoolId/audit-logs", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const limit = Math.min(parseInt(String(req.query.limit ?? "100")), 500);
  const logs = await db
    .select()
    .from(auditLogsTable)
    .where(eq(auditLogsTable.schoolId, sid))
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limit);
  res.json(logs);
});

// ─────────────────────────────────────────────
// TIMETABLE
// ─────────────────────────────────────────────
router.get("/schools/:schoolId/timetable", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const classId = req.query.classId ? parseInt(String(req.query.classId), 10) : null;
  const q = db.select().from(timetableSlotsTable).where(
    classId
      ? and(eq(timetableSlotsTable.schoolId, sid), eq(timetableSlotsTable.classId, classId))
      : eq(timetableSlotsTable.schoolId, sid)
  );
  res.json(await q);
});

router.post("/schools/:schoolId/timetable", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const { classId, dayOfWeek, periodNumber, startTime, endTime, subject, teacherId } = req.body;
  if (!classId || dayOfWeek === undefined || !periodNumber || !startTime || !endTime || !subject) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [slot] = await db.insert(timetableSlotsTable).values({
    schoolId: sid,
    classId: parseInt(classId),
    dayOfWeek: parseInt(dayOfWeek),
    periodNumber: parseInt(periodNumber),
    startTime,
    endTime,
    subject: String(subject).slice(0, 100),
    teacherId: teacherId ? parseInt(teacherId) : null,
  }).returning();
  await writeAudit({ req, schoolId: sid, action: "create", entity: "timetable_slot", entityId: slot.id, detail: `${subject} day ${dayOfWeek} period ${periodNumber}` });
  res.json(slot);
});

router.put("/schools/:schoolId/timetable/:slotId", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const slotId = parseInt(req.params.slotId, 10);
  const { startTime, endTime, subject, teacherId } = req.body;
  const [slot] = await db.update(timetableSlotsTable)
    .set({ startTime, endTime, subject: String(subject ?? "").slice(0, 100), teacherId: teacherId ? parseInt(teacherId) : null })
    .where(and(eq(timetableSlotsTable.id, slotId), eq(timetableSlotsTable.schoolId, sid)))
    .returning();
  res.json(slot);
});

router.delete("/schools/:schoolId/timetable/:slotId", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const slotId = parseInt(req.params.slotId, 10);
  await db.delete(timetableSlotsTable)
    .where(and(eq(timetableSlotsTable.id, slotId), eq(timetableSlotsTable.schoolId, sid)));
  await writeAudit({ req, schoolId: sid, action: "delete", entity: "timetable_slot", entityId: slotId });
  res.json({ ok: true });
});

// Bulk save timetable for a class (replace all slots)
router.post("/schools/:schoolId/timetable/bulk", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const { classId, slots } = req.body;
  if (!classId || !Array.isArray(slots)) {
    res.status(400).json({ error: "classId and slots[] required" });
    return;
  }
  const cid = parseInt(classId);
  await db.delete(timetableSlotsTable).where(and(eq(timetableSlotsTable.schoolId, sid), eq(timetableSlotsTable.classId, cid)));
  if (slots.length > 0) {
    await db.insert(timetableSlotsTable).values(slots.map((s: any) => ({
      schoolId: sid,
      classId: cid,
      dayOfWeek: parseInt(s.dayOfWeek),
      periodNumber: parseInt(s.periodNumber),
      startTime: String(s.startTime),
      endTime: String(s.endTime),
      subject: String(s.subject).slice(0, 100),
      teacherId: s.teacherId ? parseInt(s.teacherId) : null,
    })));
  }
  await writeAudit({ req, schoolId: sid, action: "bulk_update", entity: "timetable", detail: `Class ${cid}, ${slots.length} slots` });
  res.json({ ok: true, count: slots.length });
});

// ─────────────────────────────────────────────
// ACADEMIC CALENDAR
// ─────────────────────────────────────────────
router.get("/schools/:schoolId/calendar", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const year = req.query.academicYear ? String(req.query.academicYear) : null;
  const rows = await db.select().from(academicCalendarTable).where(
    year
      ? and(eq(academicCalendarTable.schoolId, sid), eq(academicCalendarTable.academicYear, year))
      : eq(academicCalendarTable.schoolId, sid)
  ).orderBy(academicCalendarTable.startDate);
  res.json(rows);
});

router.post("/schools/:schoolId/calendar", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const { academicYear, term, startDate, endDate, eventType, title, description } = req.body;
  if (!academicYear || !term || !startDate || !endDate || !title) {
    res.status(400).json({ error: "academicYear, term, startDate, endDate, title are required" });
    return;
  }
  const [entry] = await db.insert(academicCalendarTable).values({
    schoolId: sid,
    academicYear: String(academicYear).slice(0, 20),
    term: String(term).slice(0, 10),
    startDate,
    endDate,
    eventType: eventType ?? "term",
    title: String(title).slice(0, 200),
    description: description ? String(description).slice(0, 500) : null,
  }).returning();
  await writeAudit({ req, schoolId: sid, action: "create", entity: "calendar_event", entityId: entry.id, detail: title });
  res.json(entry);
});

router.put("/schools/:schoolId/calendar/:entryId", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const entryId = parseInt(req.params.entryId, 10);
  const { academicYear, term, startDate, endDate, eventType, title, description } = req.body;
  const [entry] = await db.update(academicCalendarTable)
    .set({ academicYear, term, startDate, endDate, eventType, title: String(title ?? "").slice(0, 200), description: description ? String(description).slice(0, 500) : null })
    .where(and(eq(academicCalendarTable.id, entryId), eq(academicCalendarTable.schoolId, sid)))
    .returning();
  res.json(entry);
});

router.delete("/schools/:schoolId/calendar/:entryId", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const entryId = parseInt(req.params.entryId, 10);
  await db.delete(academicCalendarTable).where(and(eq(academicCalendarTable.id, entryId), eq(academicCalendarTable.schoolId, sid)));
  await writeAudit({ req, schoolId: sid, action: "delete", entity: "calendar_event", entityId: entryId });
  res.json({ ok: true });
});

// ─────────────────────────────────────────────
// TEACHER ATTENDANCE
// ─────────────────────────────────────────────
router.get("/schools/:schoolId/teacher-attendance", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const dateParam = req.query.date ? String(req.query.date) : null;
  const teacherIdParam = req.query.teacherId ? parseInt(String(req.query.teacherId), 10) : null;

  let conditions: any[] = [eq(teacherAttendanceTable.schoolId, sid)];
  if (dateParam) conditions.push(eq(teacherAttendanceTable.date, dateParam));
  if (teacherIdParam) conditions.push(eq(teacherAttendanceTable.teacherId, teacherIdParam));

  const rows = await db.select({
    attendance: teacherAttendanceTable,
    teacherName: teachersTable.name,
    teacherSubject: teachersTable.subject,
  }).from(teacherAttendanceTable)
    .leftJoin(teachersTable, eq(teacherAttendanceTable.teacherId, teachersTable.id))
    .where(and(...conditions))
    .orderBy(desc(teacherAttendanceTable.date));
  res.json(rows);
});

router.post("/schools/:schoolId/teacher-attendance/bulk", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const { date, records } = req.body;
  if (!date || !Array.isArray(records)) {
    res.status(400).json({ error: "date and records[] required" });
    return;
  }
  // Upsert: delete existing for this date+school, then insert
  await db.delete(teacherAttendanceTable).where(and(eq(teacherAttendanceTable.schoolId, sid), eq(teacherAttendanceTable.date, date)));
  if (records.length > 0) {
    await db.insert(teacherAttendanceTable).values(records.map((r: any) => ({
      schoolId: sid,
      teacherId: parseInt(r.teacherId),
      date,
      status: r.status ?? "present",
      notes: r.notes ? String(r.notes).slice(0, 300) : null,
    })));
  }
  await writeAudit({ req, schoolId: sid, action: "bulk_mark", entity: "teacher_attendance", detail: `Date ${date}, ${records.length} records` });
  res.json({ ok: true, count: records.length });
});

router.get("/schools/:schoolId/teacher-attendance/report", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const from = req.query.from ? String(req.query.from) : null;
  const to = req.query.to ? String(req.query.to) : null;

  let conditions: any[] = [eq(teacherAttendanceTable.schoolId, sid)];
  if (from) conditions.push(sql`${teacherAttendanceTable.date} >= ${from}`);
  if (to) conditions.push(sql`${teacherAttendanceTable.date} <= ${to}`);

  const rows = await db.select({
    teacherId: teacherAttendanceTable.teacherId,
    teacherName: teachersTable.name,
    status: teacherAttendanceTable.status,
    count: sql<number>`count(*)`,
  }).from(teacherAttendanceTable)
    .leftJoin(teachersTable, eq(teacherAttendanceTable.teacherId, teachersTable.id))
    .where(and(...conditions))
    .groupBy(teacherAttendanceTable.teacherId, teachersTable.name, teacherAttendanceTable.status);
  res.json(rows);
});

// ─────────────────────────────────────────────
// STUDENT FEE LEDGER
// ─────────────────────────────────────────────
router.get("/schools/:schoolId/fee-ledger", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const year = req.query.academicYear ? String(req.query.academicYear) : null;
  const term = req.query.term ? String(req.query.term) : null;
  const studentId = req.query.studentId ? parseInt(String(req.query.studentId), 10) : null;

  let conditions: any[] = [eq(studentFeeledgerTable.schoolId, sid)];
  if (year) conditions.push(eq(studentFeeledgerTable.academicYear, year));
  if (term) conditions.push(eq(studentFeeledgerTable.term, term));
  if (studentId) conditions.push(eq(studentFeeledgerTable.studentId, studentId));

  const rows = await db.select({
    ledger: studentFeeledgerTable,
    studentName: studentsTable.name,
    studentNumber: studentsTable.studentNumber,
    className: classesTable.name,
  }).from(studentFeeledgerTable)
    .leftJoin(studentsTable, eq(studentFeeledgerTable.studentId, studentsTable.id))
    .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
    .where(and(...conditions))
    .orderBy(studentsTable.name);
  res.json(rows);
});

router.post("/schools/:schoolId/fee-ledger", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const { studentId, academicYear, term, feeType, amountDue, amountPaid, paymentDate, notes } = req.body;
  if (!studentId || !academicYear || !term) {
    res.status(400).json({ error: "studentId, academicYear, term required" });
    return;
  }
  const [entry] = await db.insert(studentFeeledgerTable).values({
    schoolId: sid,
    studentId: parseInt(studentId),
    academicYear: String(academicYear),
    term: String(term),
    feeType: feeType ?? "school_fee",
    amountDue: String(amountDue ?? 0),
    amountPaid: String(amountPaid ?? 0),
    paymentDate: paymentDate ?? null,
    notes: notes ? String(notes).slice(0, 300) : null,
  }).returning();
  await writeAudit({ req, schoolId: sid, action: "create", entity: "fee_ledger", entityId: entry.id });
  res.json(entry);
});

router.put("/schools/:schoolId/fee-ledger/:entryId", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const entryId = parseInt(req.params.entryId, 10);
  const { amountPaid, paymentDate, notes, amountDue } = req.body;
  const [entry] = await db.update(studentFeeledgerTable)
    .set({ amountPaid: String(amountPaid ?? 0), amountDue: String(amountDue ?? 0), paymentDate: paymentDate ?? null, notes: notes ? String(notes).slice(0, 300) : null })
    .where(and(eq(studentFeeledgerTable.id, entryId), eq(studentFeeledgerTable.schoolId, sid)))
    .returning();
  await writeAudit({ req, schoolId: sid, action: "update", entity: "fee_ledger", entityId: entryId });
  res.json(entry);
});

// Bulk initialize fee ledger for all active students in a term
router.post("/schools/:schoolId/fee-ledger/bulk-init", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const { academicYear, term, amountDue } = req.body;
  if (!academicYear || !term || amountDue === undefined) {
    res.status(400).json({ error: "academicYear, term, amountDue required" });
    return;
  }
  const students = await db.select({ id: studentsTable.id })
    .from(studentsTable)
    .where(and(eq(studentsTable.schoolId, sid), eq(studentsTable.status, "active"), isNull(studentsTable.deletedAt)));

  let created = 0;
  for (const s of students) {
    const existing = await db.select({ id: studentFeeledgerTable.id })
      .from(studentFeeledgerTable)
      .where(and(
        eq(studentFeeledgerTable.schoolId, sid),
        eq(studentFeeledgerTable.studentId, s.id),
        eq(studentFeeledgerTable.academicYear, academicYear),
        eq(studentFeeledgerTable.term, term),
      ));
    if (existing.length === 0) {
      await db.insert(studentFeeledgerTable).values({
        schoolId: sid,
        studentId: s.id,
        academicYear,
        term,
        feeType: "school_fee",
        amountDue: String(amountDue),
        amountPaid: "0",
      });
      created++;
    }
  }
  res.json({ ok: true, created });
});

// ─────────────────────────────────────────────
// CSV BULK STUDENT IMPORT
// ─────────────────────────────────────────────
router.post("/schools/:schoolId/students/import-preview", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  try {
    const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
    res.json({ rows: records.slice(0, 5), total: records.length, columns: Object.keys(records[0] ?? {}) });
  } catch (e: any) {
    res.status(400).json({ error: "Could not parse CSV: " + e.message });
  }
});

router.post("/schools/:schoolId/students/import", upload.single("file"), async (req, res): Promise<void> => {
  const sid = schoolId(req);
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const { nameCol = "name", classId, gender: genderCol, dob: dobCol, parentName: parentNameCol, parentPhone: parentPhoneCol, studentNumber: snCol } = req.body;

  let records: any[];
  try {
    records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
  } catch (e: any) {
    res.status(400).json({ error: "CSV parse error: " + e.message });
    return;
  }

  const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, sid));
  const code = school?.name
    ? school.name.replace(/[^a-zA-Z ]/g, "").split(/\s+/).filter(Boolean).slice(0, 3).map((w: string) => w[0].toUpperCase()).join("").padEnd(2, "X").slice(0, 3)
    : "SCH";
  const yy = String(new Date().getFullYear()).slice(2);
  const prefix = `${code}${yy}`;

  const existing = await db.select({ sn: studentsTable.studentNumber })
    .from(studentsTable)
    .where(and(eq(studentsTable.schoolId, sid), sql`${studentsTable.studentNumber} like ${prefix + "%"}`));
  let maxSeq = 0;
  for (const { sn } of existing) {
    const num = parseInt(sn.slice(prefix.length));
    if (!isNaN(num) && num > maxSeq) maxSeq = num;
  }

  const imported: any[] = [];
  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const name = (row[nameCol] ?? "").trim();
    if (!name) { errors.push(`Row ${i + 2}: missing name`); continue; }
    maxSeq++;
    const studentNumber = snCol && row[snCol] ? row[snCol].trim() : `${prefix}${String(maxSeq).padStart(4, "0")}`;
    try {
      const [student] = await db.insert(studentsTable).values({
        schoolId: sid,
        name: name.slice(0, 200),
        studentNumber,
        classId: classId ? parseInt(classId) : null,
        gender: genderCol && row[genderCol] ? String(row[genderCol]).toLowerCase().slice(0, 10) : null,
        dateOfBirth: dobCol && row[dobCol] ? row[dobCol] : null,
        parentName: parentNameCol && row[parentNameCol] ? String(row[parentNameCol]).slice(0, 200) : null,
        parentPhone: parentPhoneCol && row[parentPhoneCol] ? String(row[parentPhoneCol]).slice(0, 30) : null,
        status: "active",
      }).returning();
      imported.push(student);
    } catch (e: any) {
      errors.push(`Row ${i + 2} (${name}): ${e.message}`);
    }
  }

  await writeAudit({ req, schoolId: sid, action: "bulk_import", entity: "students", detail: `Imported ${imported.length}, errors ${errors.length}` });
  res.json({ imported: imported.length, errors });
});

// ─────────────────────────────────────────────
// STUDENT PROMOTION (end-of-year)
// ─────────────────────────────────────────────
router.post("/schools/:schoolId/students/promote", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const { promotions, academicYear } = req.body;
  // promotions: Array<{ studentId, toClassId }>
  if (!Array.isArray(promotions) || promotions.length === 0) {
    res.status(400).json({ error: "promotions[] required" });
    return;
  }

  let promoted = 0;
  for (const p of promotions) {
    const studentId = parseInt(p.studentId);
    const toClassId = p.toClassId ? parseInt(p.toClassId) : null;
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
    if (!student || student.schoolId !== sid) continue;
    await db.insert(studentClassHistoryTable).values({
      studentId,
      schoolId: sid,
      fromClassId: student.classId,
      toClassId,
      changeType: "promoted",
      academicYear: academicYear ?? null,
      notes: "End-of-year promotion",
    });
    await db.update(studentsTable).set({ classId: toClassId }).where(eq(studentsTable.id, studentId));
    promoted++;
  }
  await writeAudit({ req, schoolId: sid, action: "promote", entity: "students", detail: `${promoted} students promoted` });
  res.json({ ok: true, promoted });
});

// ─────────────────────────────────────────────
// SOFT DELETE / RESTORE for students
// ─────────────────────────────────────────────
router.delete("/schools/:schoolId/students/:studentId/soft", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const studentId = parseInt(req.params.studentId, 10);
  await db.update(studentsTable).set({ deletedAt: new Date() })
    .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, sid)));
  await writeAudit({ req, schoolId: sid, action: "soft_delete", entity: "student", entityId: studentId });
  res.json({ ok: true });
});

router.post("/schools/:schoolId/students/:studentId/restore", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const studentId = parseInt(req.params.studentId, 10);
  await db.update(studentsTable).set({ deletedAt: null })
    .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, sid)));
  await writeAudit({ req, schoolId: sid, action: "restore", entity: "student", entityId: studentId });
  res.json({ ok: true });
});

router.get("/schools/:schoolId/students/deleted", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const rows = await db.select({
    student: studentsTable,
    className: classesTable.name,
  }).from(studentsTable)
    .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
    .where(and(eq(studentsTable.schoolId, sid), sql`${studentsTable.deletedAt} IS NOT NULL`))
    .orderBy(desc(studentsTable.deletedAt));
  res.json(rows.map(r => ({ ...r.student, className: r.className ?? null })));
});

// ─────────────────────────────────────────────
// DATA EXPORT (CSV downloads)
// ─────────────────────────────────────────────
function toCSV(rows: Record<string, any>[], columns: string[]): string {
  const header = columns.join(",");
  const body = rows.map(r =>
    columns.map(c => {
      const val = r[c] ?? "";
      const str = String(val).replace(/"/g, '""');
      return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
    }).join(",")
  );
  return [header, ...body].join("\n");
}

router.get("/schools/:schoolId/export/students", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const rows = await db.select({
    studentNumber: studentsTable.studentNumber,
    name: studentsTable.name,
    gender: studentsTable.gender,
    dateOfBirth: studentsTable.dateOfBirth,
    className: classesTable.name,
    category: studentsTable.category,
    parentName: studentsTable.parentName,
    parentPhone: studentsTable.parentPhone,
    status: studentsTable.status,
  }).from(studentsTable)
    .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
    .where(and(eq(studentsTable.schoolId, sid), isNull(studentsTable.deletedAt)))
    .orderBy(classesTable.name, studentsTable.name);
  const csv = toCSV(rows, ["studentNumber", "name", "gender", "dateOfBirth", "className", "category", "parentName", "parentPhone", "status"]);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="students.csv"`);
  res.send(csv);
});

router.get("/schools/:schoolId/export/teachers", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const rows = await db.select({
    name: teachersTable.name,
    subject: teachersTable.subject,
    phone: teachersTable.phone,
    email: teachersTable.email,
    status: teachersTable.status,
  }).from(teachersTable)
    .where(and(eq(teachersTable.schoolId, sid), isNull(teachersTable.deletedAt)))
    .orderBy(teachersTable.name);
  const csv = toCSV(rows, ["name", "subject", "phone", "email", "status"]);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="teachers.csv"`);
  res.send(csv);
});

router.get("/schools/:schoolId/export/attendance", async (req, res): Promise<void> => {
  const { attendanceTable } = await import("@workspace/db");
  const sid = schoolId(req);
  const rows = await db.select({
    date: attendanceTable.date,
    studentName: studentsTable.name,
    studentNumber: studentsTable.studentNumber,
    className: classesTable.name,
    status: attendanceTable.status,
  }).from(attendanceTable)
    .leftJoin(studentsTable, eq(attendanceTable.studentId, studentsTable.id))
    .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
    .where(eq(attendanceTable.schoolId, sid))
    .orderBy(attendanceTable.date, studentsTable.name);
  const csv = toCSV(rows, ["date", "studentNumber", "studentName", "className", "status"]);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="attendance.csv"`);
  res.send(csv);
});

// ─────────────────────────────────────────────
// SUPER ADMIN ANALYTICS
// ─────────────────────────────────────────────
router.get("/admin/analytics", async (req, res): Promise<void> => {
  const now = new Date().toISOString().slice(0, 10);

  const [schoolCount] = await db.select({ count: sql<number>`count(*)` }).from(schoolsTable);
  const [activeCount] = await db.select({ count: sql<number>`count(*)` })
    .from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.status, "active"), sql`${subscriptionsTable.expiryDate} >= ${now}`));
  const [expiredCount] = await db.select({ count: sql<number>`count(*)` })
    .from(subscriptionsTable)
    .where(sql`${subscriptionsTable.expiryDate} < ${now}`);

  const revenueRows = await db.select({
    month: sql<string>`to_char(created_at, 'YYYY-MM')`,
    total: sql<number>`sum(amount::numeric)`,
    count: sql<number>`count(*)`,
  }).from(paymentTransactionsTable)
    .where(eq(paymentTransactionsTable.status, "paid"))
    .groupBy(sql`to_char(created_at, 'YYYY-MM')`)
    .orderBy(sql`to_char(created_at, 'YYYY-MM')`);

  const recentPayments = await db.select({
    id: paymentTransactionsTable.id,
    schoolId: paymentTransactionsTable.schoolId,
    schoolName: schoolsTable.name,
    amount: paymentTransactionsTable.amount,
    months: paymentTransactionsTable.months,
    createdAt: paymentTransactionsTable.createdAt,
  }).from(paymentTransactionsTable)
    .leftJoin(schoolsTable, eq(paymentTransactionsTable.schoolId, schoolsTable.id))
    .where(eq(paymentTransactionsTable.status, "paid"))
    .orderBy(desc(paymentTransactionsTable.createdAt))
    .limit(10);

  const expiringSoon = await db.select({
    schoolId: subscriptionsTable.schoolId,
    schoolName: schoolsTable.name,
    expiryDate: subscriptionsTable.expiryDate,
  }).from(subscriptionsTable)
    .leftJoin(schoolsTable, eq(subscriptionsTable.schoolId, schoolsTable.id))
    .where(and(
      sql`${subscriptionsTable.expiryDate} >= ${now}`,
      sql`${subscriptionsTable.expiryDate} <= ${new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)}`
    ))
    .orderBy(subscriptionsTable.expiryDate);

  res.json({
    totalSchools: Number(schoolCount?.count ?? 0),
    activeSubscriptions: Number(activeCount?.count ?? 0),
    expiredSubscriptions: Number(expiredCount?.count ?? 0),
    revenueByMonth: revenueRows,
    recentPayments,
    expiringSoon,
  });
});

// ─────────────────────────────────────────────
// Academic Terms
// ─────────────────────────────────────────────

router.get("/schools/:schoolId/terms", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const terms = await db.select().from(academicTermsTable)
    .where(eq(academicTermsTable.schoolId, sid))
    .orderBy(academicTermsTable.academicYear, academicTermsTable.name);
  res.json(terms);
});

router.post("/schools/:schoolId/terms", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const { name, academicYear, startDate, endDate, isCurrent } = req.body;
  if (!name || !academicYear || !startDate || !endDate) {
    res.status(400).json({ error: "name, academicYear, startDate, endDate required" });
    return;
  }
  if (isCurrent) {
    await db.update(academicTermsTable).set({ isCurrent: false }).where(eq(academicTermsTable.schoolId, sid));
  }
  const [term] = await db.insert(academicTermsTable).values({
    schoolId: sid, name: String(name), academicYear: String(academicYear),
    startDate: String(startDate), endDate: String(endDate), isCurrent: Boolean(isCurrent),
  }).returning();
  await writeAudit({ req, schoolId: sid, action: "create", entity: "academic_term", entityId: term.id });
  res.status(201).json(term);
});

router.put("/schools/:schoolId/terms/:termId", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const termId = parseInt(req.params.termId, 10);
  const { name, academicYear, startDate, endDate, isCurrent } = req.body;
  if (isCurrent) {
    await db.update(academicTermsTable).set({ isCurrent: false }).where(eq(academicTermsTable.schoolId, sid));
  }
  const [term] = await db.update(academicTermsTable)
    .set({
      ...(name && { name: String(name) }),
      ...(academicYear && { academicYear: String(academicYear) }),
      ...(startDate && { startDate: String(startDate) }),
      ...(endDate && { endDate: String(endDate) }),
      ...(isCurrent !== undefined && { isCurrent: Boolean(isCurrent) }),
    })
    .where(and(eq(academicTermsTable.id, termId), eq(academicTermsTable.schoolId, sid)))
    .returning();
  if (!term) { res.status(404).json({ error: "Term not found" }); return; }
  await writeAudit({ req, schoolId: sid, action: "update", entity: "academic_term", entityId: term.id });
  res.json(term);
});

router.delete("/schools/:schoolId/terms/:termId", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const termId = parseInt(req.params.termId, 10);
  const [term] = await db.delete(academicTermsTable)
    .where(and(eq(academicTermsTable.id, termId), eq(academicTermsTable.schoolId, sid)))
    .returning();
  if (!term) { res.status(404).json({ error: "Term not found" }); return; }
  res.sendStatus(204);
});

// ─────────────────────────────────────────────
// SMS — notify parent when scores are submitted
// ─────────────────────────────────────────────
router.post("/schools/:schoolId/sms/report-ready", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const { studentId, term, academicYear } = req.body;
  if (!studentId || !term) {
    res.status(400).json({ error: "studentId and term required" });
    return;
  }
  const [student] = await db.select().from(studentsTable)
    .where(and(eq(studentsTable.id, parseInt(studentId)), eq(studentsTable.schoolId, sid)));
  if (!student || !student.parentPhone) {
    res.json({ ok: false, reason: "No parent phone on file" });
    return;
  }
  const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, sid));
  const message = `Dear Parent, the Term ${term} (${academicYear}) report card for ${student.name} is now available. Please contact ${school?.name ?? "the school"} to collect it.`;
  const sent = await sendSMS(student.parentPhone, message);
  await writeAudit({ req, schoolId: sid, action: "sms_sent", entity: "student", entityId: parseInt(studentId), detail: `Term ${term} report notification` });
  res.json({ ok: sent, phone: student.parentPhone });
});

// ─────────────────────────────────────────────
// CALENDAR EVENTS (Operational)
// ─────────────────────────────────────────────

router.get("/schools/:schoolId/events", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const { month } = req.query;
  let rows;
  if (month) {
    const [yr, mo] = String(month).split("-");
    const startOfMonth = `${yr}-${mo.padStart(2, "0")}-01`;
    // last day: use the first day of next month minus logic → just use 31 which DB handles
    const nextMo = (parseInt(mo, 10) % 12) + 1;
    const nextYr = nextMo === 1 ? parseInt(yr, 10) + 1 : parseInt(yr, 10);
    const endOfMonth = `${nextYr}-${String(nextMo).padStart(2, "0")}-01`;
    rows = await db.select().from(calendarEventsTable)
      .where(and(
        eq(calendarEventsTable.schoolId, sid),
        lte(calendarEventsTable.startDate, endOfMonth),
        gte(calendarEventsTable.endDate, startOfMonth),
      ))
      .orderBy(calendarEventsTable.startDate);
  } else {
    rows = await db.select().from(calendarEventsTable)
      .where(eq(calendarEventsTable.schoolId, sid))
      .orderBy(calendarEventsTable.startDate);
  }
  res.json(rows);
});

router.post("/schools/:schoolId/events", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const { title, description, startDate, endDate, startTime, endTime, category, targetType, targetIds } = req.body;
  if (!title?.trim() || !startDate || !endDate) {
    res.status(400).json({ error: "title, startDate, and endDate are required" });
    return;
  }
  const [row] = await db.insert(calendarEventsTable).values({
    schoolId: sid,
    title: title.trim(),
    description: description?.trim() || null,
    startDate,
    endDate,
    startTime: startTime || null,
    endTime: endTime || null,
    category: category || "academic",
    targetType: targetType || "all_staff",
    targetIds: JSON.stringify(Array.isArray(targetIds) ? targetIds : []),
  }).returning();
  await writeAudit({ req, schoolId: sid, action: "create", entity: "calendar_event", entityId: row.id, detail: `"${title}" ${startDate}–${endDate}` });
  res.status(201).json(row);
});

router.put("/schools/:schoolId/events/:eventId", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const eid = parseInt(req.params.eventId, 10);
  const { title, description, startDate, endDate, startTime, endTime, category, targetType, targetIds } = req.body;
  if (!title?.trim() || !startDate || !endDate) {
    res.status(400).json({ error: "title, startDate, and endDate are required" });
    return;
  }
  const [row] = await db.update(calendarEventsTable)
    .set({
      title: title.trim(),
      description: description?.trim() || null,
      startDate,
      endDate,
      startTime: startTime || null,
      endTime: endTime || null,
      category: category || "academic",
      targetType: targetType || "all_staff",
      targetIds: JSON.stringify(Array.isArray(targetIds) ? targetIds : []),
    })
    .where(and(eq(calendarEventsTable.id, eid), eq(calendarEventsTable.schoolId, sid)))
    .returning();
  if (!row) { res.status(404).json({ error: "Event not found" }); return; }
  await writeAudit({ req, schoolId: sid, action: "update", entity: "calendar_event", entityId: eid, detail: `"${title}"` });
  res.json(row);
});

router.delete("/schools/:schoolId/events/:eventId", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const eid = parseInt(req.params.eventId, 10);
  await db.delete(calendarEventsTable).where(and(eq(calendarEventsTable.id, eid), eq(calendarEventsTable.schoolId, sid)));
  await writeAudit({ req, schoolId: sid, action: "delete", entity: "calendar_event", entityId: eid, detail: "deleted" });
  res.json({ ok: true });
});

// ─── Announcements (admin) ────────────────────────────────────────────────────

router.get("/schools/:schoolId/announcements", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const rows = await db.select().from(announcementsTable)
    .where(eq(announcementsTable.schoolId, sid))
    .orderBy(desc(announcementsTable.createdAt));
  res.json(rows);
});

router.post("/schools/:schoolId/announcements", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const { title, message, target, imageUrl } = req.body;
  if (!title?.trim() || !message?.trim()) { res.status(400).json({ error: "Title and message are required" }); return; }
  if (!["staff", "parents", "both"].includes(target)) { res.status(400).json({ error: "Invalid target" }); return; }
  const [row] = await db.insert(announcementsTable).values({
    schoolId: sid, title: title.trim(), message: message.trim(),
    target, imageUrl: imageUrl?.trim() || null,
  }).returning();
  await writeAudit({ req, schoolId: sid, action: "create", entity: "announcement", entityId: row.id, detail: `"${title}" → ${target}` });
  res.status(201).json(row);
});

router.delete("/schools/:schoolId/announcements/:announcementId", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const aid = parseInt(req.params.announcementId, 10);
  await db.delete(announcementReadsTable).where(eq(announcementReadsTable.announcementId, aid));
  await db.delete(announcementsTable).where(and(eq(announcementsTable.id, aid), eq(announcementsTable.schoolId, sid)));
  await writeAudit({ req, schoolId: sid, action: "delete", entity: "announcement", entityId: aid, detail: "deleted" });
  res.json({ ok: true });
});

// ─────────────────────────────────────────────
// INSIGHTS — STUDENT PERFORMANCE
// ─────────────────────────────────────────────

router.get("/schools/:schoolId/insights/student-performance", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const { term, academicYear, classId: classIdParam, subject } = req.query;

  const [allClasses, allTeachers, allStudents, rawScores, classSubjects] = await Promise.all([
    db.select().from(classesTable).where(eq(classesTable.schoolId, sid)),
    db.select().from(teachersTable).where(and(eq(teachersTable.schoolId, sid), isNull(teachersTable.deletedAt))),
    db.select({ id: studentsTable.id, name: studentsTable.name, classId: studentsTable.classId, status: studentsTable.status })
      .from(studentsTable).where(and(eq(studentsTable.schoolId, sid), isNull(studentsTable.deletedAt))),
    db.select().from(scoresTable).where(and(
      eq(scoresTable.schoolId, sid),
      ...(term ? [eq(scoresTable.term, String(term))] : []),
      ...(academicYear ? [eq(scoresTable.academicYear, String(academicYear))] : []),
      ...(classIdParam ? [eq(scoresTable.classId, parseInt(String(classIdParam)))] : []),
      ...(subject ? [eq(scoresTable.subject, String(subject))] : []),
    )),
    db.select().from(classSubjectsTable).where(eq(classSubjectsTable.schoolId, sid)),
  ]);

  const teacherMap = new Map(allTeachers.map(t => [t.id, t.name]));
  const activeStudents = allStudents.filter(s => s.status === "active");

  // Build per-class stats
  const classStats = allClasses.map(cls => {
    const clsStudents = activeStudents.filter(s => s.classId === cls.id);
    const clsScores = rawScores.filter(s => s.classId === cls.id && s.score !== null);
    const scoredStudentIds = new Set(clsScores.map(s => s.studentId));
    const nums = clsScores.map(s => parseFloat(String(s.score))).filter(n => !isNaN(n));
    const avgScore = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    const passRate = nums.length > 0 ? (nums.filter(n => n >= 50).length / nums.length) * 100 : null;

    // Grade distribution
    const gradeDistribution: Record<string, number> = {};
    for (const sc of clsScores) {
      if (sc.grade) gradeDistribution[sc.grade] = (gradeDistribution[sc.grade] || 0) + 1;
    }

    // Subject breakdown
    const subjects = [...new Set(clsScores.map(s => s.subject))].sort();
    const subjectBreakdown = subjects.map(subj => {
      const ss = clsScores.filter(s => s.subject === subj);
      const sn = ss.map(s => parseFloat(String(s.score))).filter(n => !isNaN(n));
      return {
        subject: subj,
        avgScore: sn.length > 0 ? Math.round((sn.reduce((a, b) => a + b, 0) / sn.length) * 10) / 10 : null,
        scoredCount: ss.length,
        passRate: sn.length > 0 ? Math.round((sn.filter(n => n >= 50).length / sn.length) * 1000) / 10 : null,
      };
    });

    // JHS subject teacher names
    const clsSubjects = classSubjects.filter(cs => cs.classId === cls.id);
    const subjectTeachers: Record<string, string> = {};
    for (const cs of clsSubjects) {
      if (cs.teacherId) subjectTeachers[cs.subject] = teacherMap.get(cs.teacherId) ?? "";
    }

    return {
      classId: cls.id,
      className: cls.name,
      level: cls.level,
      teacherName: cls.teacherId ? (teacherMap.get(cls.teacherId) ?? null) : null,
      totalStudents: clsStudents.length,
      scoredStudents: scoredStudentIds.size,
      totalScoreRows: clsScores.length,
      avgScore: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
      passRate: passRate !== null ? Math.round(passRate * 10) / 10 : null,
      gradeDistribution,
      subjectBreakdown,
      subjectTeachers,
    };
  });

  // School summary
  const allNums = rawScores.map(s => parseFloat(String(s.score))).filter(n => !isNaN(n) && n >= 0);
  const schoolAvg = allNums.length > 0 ? Math.round((allNums.reduce((a, b) => a + b, 0) / allNums.length) * 10) / 10 : null;
  const schoolPassRate = allNums.length > 0 ? Math.round((allNums.filter(n => n >= 50).length / allNums.length) * 1000) / 10 : null;

  // Filter options (derived from ALL scores for this school, not just current filter)
  const allSchoolScores = await db.select({ term: scoresTable.term, academicYear: scoresTable.academicYear, subject: scoresTable.subject })
    .from(scoresTable).where(eq(scoresTable.schoolId, sid));
  const allYears = [...new Set(allSchoolScores.map(s => s.academicYear))].sort().reverse();
  const allTerms = [...new Set(allSchoolScores.map(s => s.term))].sort();
  const allSubjects = [...new Set(allSchoolScores.map(s => s.subject))].sort();

  // Build student list for filter — respect class filter if set
  const filteredStudentsForPicker = classIdParam
    ? activeStudents.filter(s => s.classId === parseInt(String(classIdParam)))
    : activeStudents;
  const classNameMap = new Map(allClasses.map(c => [c.id, c.name]));

  res.json({
    summary: {
      totalScoredStudents: new Set(rawScores.map(s => s.studentId)).size,
      schoolAvg,
      schoolPassRate,
      totalScoreRows: rawScores.length,
      classCount: allClasses.length,
    },
    filterOptions: {
      years: allYears,
      terms: allTerms,
      subjects: allSubjects,
      classes: allClasses.map(c => ({ id: c.id, name: c.name, level: c.level })),
      students: filteredStudentsForPicker
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(s => ({ id: s.id, name: s.name, classId: s.classId, className: classNameMap.get(s.classId ?? -1) ?? "" })),
    },
    classes: classStats,
  });
});

// ─────────────────────────────────────────────
// INSIGHTS — INDIVIDUAL STUDENT DETAIL
// ─────────────────────────────────────────────

router.get("/schools/:schoolId/insights/student-detail", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const { studentId: studentIdParam, term, academicYear } = req.query;
  if (!studentIdParam) { res.status(400).json({ error: "studentId is required" }); return; }

  const studentId = parseInt(String(studentIdParam), 10);

  const [studentRows, scoreRows, classRows] = await Promise.all([
    db.select({ id: studentsTable.id, name: studentsTable.name, studentNumber: studentsTable.studentNumber, classId: studentsTable.classId })
      .from(studentsTable)
      .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, sid))),
    db.select().from(scoresTable).where(and(
      eq(scoresTable.studentId, studentId),
      eq(scoresTable.schoolId, sid),
      ...(term ? [eq(scoresTable.term, String(term))] : []),
      ...(academicYear ? [eq(scoresTable.academicYear, String(academicYear))] : []),
    )),
    db.select({ id: classesTable.id, name: classesTable.name }).from(classesTable).where(eq(classesTable.schoolId, sid)),
  ]);

  if (!studentRows[0]) { res.status(404).json({ error: "Student not found" }); return; }
  const student = studentRows[0];
  const className = classRows.find(c => c.id === student.classId)?.name ?? "—";

  const scores = scoreRows.map(s => ({
    id: s.id,
    subject: s.subject,
    term: s.term,
    academicYear: s.academicYear,
    score: s.score !== null ? Number(s.score) : null,
    grade: s.grade,
    classWork: s.classWork !== null ? Number(s.classWork) : null,
    classTest: s.classTest !== null ? Number(s.classTest) : null,
    homework: s.homework !== null ? Number(s.homework) : null,
    projectWork: s.projectWork !== null ? Number(s.projectWork) : null,
    examScore: s.examScore !== null ? Number(s.examScore) : null,
    remarks: s.remarks,
  })).sort((a, b) => {
    const yearCmp = (b.academicYear ?? "").localeCompare(a.academicYear ?? "");
    if (yearCmp !== 0) return yearCmp;
    const termCmp = Number(a.term) - Number(b.term);
    if (termCmp !== 0) return termCmp;
    return a.subject.localeCompare(b.subject);
  });

  const nums = scores.map(s => s.score).filter((n): n is number => n !== null);
  const avgScore = nums.length > 0 ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;
  const passRate = nums.length > 0 ? Math.round((nums.filter(n => n >= 50).length / nums.length) * 1000) / 10 : null;

  res.json({
    student: { id: student.id, name: student.name, studentNumber: student.studentNumber, className },
    scores,
    summary: { avgScore, passRate, totalSubjects: new Set(scores.map(s => s.subject)).size, totalScores: scores.length },
  });
});

// ─────────────────────────────────────────────
// INSIGHTS — TEACHER PERFORMANCE
// ─────────────────────────────────────────────

router.get("/schools/:schoolId/insights/teacher-performance", async (req, res): Promise<void> => {
  const sid = schoolId(req);
  const { term, academicYear } = req.query;

  const [allClasses, allTeachers, activeStudents, rawScores, classSubjects, attendanceAgg] = await Promise.all([
    db.select().from(classesTable).where(eq(classesTable.schoolId, sid)),
    db.select().from(teachersTable).where(and(eq(teachersTable.schoolId, sid), isNull(teachersTable.deletedAt))),
    db.select({ id: studentsTable.id, classId: studentsTable.classId })
      .from(studentsTable).where(and(eq(studentsTable.schoolId, sid), eq(studentsTable.status, "active"), isNull(studentsTable.deletedAt))),
    db.select().from(scoresTable).where(and(
      eq(scoresTable.schoolId, sid),
      ...(term ? [eq(scoresTable.term, String(term))] : []),
      ...(academicYear ? [eq(scoresTable.academicYear, String(academicYear))] : []),
    )),
    db.select().from(classSubjectsTable).where(eq(classSubjectsTable.schoolId, sid)),
    db.select({
      teacherId: teacherAttendanceTable.teacherId,
      status: teacherAttendanceTable.status,
      cnt: sql<number>`count(*)::int`,
    }).from(teacherAttendanceTable)
      .where(eq(teacherAttendanceTable.schoolId, sid))
      .groupBy(teacherAttendanceTable.teacherId, teacherAttendanceTable.status),
  ]);

  const teacherStats = allTeachers.map(teacher => {
    // Homeroom classes
    const homeroomClasses = allClasses.filter(c => c.teacherId === teacher.id);
    // JHS subject assignments
    const jhsAssignments = classSubjects.filter(cs => cs.teacherId === teacher.id);
    const jhsClassIds = [...new Set(jhsAssignments.map(j => j.classId))];
    const jhsSubjectNames = [...new Set(jhsAssignments.map(j => j.subject))];

    // Students under this teacher
    const homeroomStudentIds = new Set(activeStudents.filter(s => homeroomClasses.some(c => c.id === s.classId)).map(s => s.id));
    const jhsStudentIds = new Set(activeStudents.filter(s => jhsClassIds.includes(s.classId)).map(s => s.id));
    const totalStudentIds = new Set([...homeroomStudentIds, ...jhsStudentIds]);

    // Scores attributed to this teacher
    const homeroomScoreIds = new Set(rawScores.filter(s => homeroomClasses.some(c => c.id === s.classId)).map(s => s.id));
    const jhsScoreIds = new Set(rawScores.filter(s => s.teacherId === teacher.id).map(s => s.id));
    const allScoreIds = new Set([...homeroomScoreIds, ...jhsScoreIds]);
    const teacherScores = rawScores.filter(s => allScoreIds.has(s.id) && s.score !== null);

    const nums = teacherScores.map(s => parseFloat(String(s.score))).filter(n => !isNaN(n));
    const avgScore = nums.length > 0 ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;
    const passRate = nums.length > 0 ? Math.round((nums.filter(n => n >= 50).length / nums.length) * 1000) / 10 : null;
    const scoredStudentIds = new Set(teacherScores.map(s => s.studentId));
    const scoreEntryRate = totalStudentIds.size > 0 ? Math.round((scoredStudentIds.size / totalStudentIds.size) * 1000) / 10 : null;

    // Attendance
    const attRows = attendanceAgg.filter(a => a.teacherId === teacher.id);
    const presentDays = Number(attRows.find(a => a.status === "present")?.cnt ?? 0);
    const totalDays = attRows.reduce((sum, a) => sum + Number(a.cnt), 0);
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 1000) / 10 : null;

    // Class names
    const allClassNames = [
      ...homeroomClasses.map(c => c.name),
      ...jhsClassIds.map(id => allClasses.find(c => c.id === id)?.name).filter(Boolean) as string[],
    ];
    const uniqueClassNames = [...new Set(allClassNames)];

    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      status: teacher.status,
      classes: uniqueClassNames,
      subjectsTaught: jhsSubjectNames,
      totalStudents: totalStudentIds.size,
      scoredStudents: scoredStudentIds.size,
      scoresEntered: teacherScores.length,
      avgScore,
      passRate,
      scoreEntryRate,
      presentDays,
      totalDays,
      attendanceRate,
    };
  });

  res.json(teacherStats);
});

export default router;
