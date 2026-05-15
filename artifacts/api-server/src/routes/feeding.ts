import { Router, type IRouter } from "express";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import {
  db,
  feedingRecordsTable,
  feedingFundEntriesTable,
  studentsTable,
  classesTable,
} from "@workspace/db";

const router: IRouter = Router();

function sid(req: any): number {
  return parseInt(req.params.schoolId, 10);
}

// ─── Feeding Records ──────────────────────────────────────────────────────────

// GET /schools/:schoolId/feeding/records?date=YYYY-MM-DD&classId=N
router.get("/schools/:schoolId/feeding/records", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const { date, classId } = req.query as Record<string, string>;

  if (!date) { res.status(400).json({ error: "date is required" }); return; }

  let studentIds: number[] = [];
  if (classId) {
    const students = await db.select({ id: studentsTable.id })
      .from(studentsTable)
      .where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.classId, parseInt(classId)), eq(studentsTable.status, "active")));
    studentIds = students.map(s => s.id);
    if (!studentIds.length) { res.json([]); return; }
  }

  const records = await db.select({
    id: feedingRecordsTable.id,
    studentId: feedingRecordsTable.studentId,
    date: feedingRecordsTable.date,
    status: feedingRecordsTable.status,
    studentName: studentsTable.name,
    classId: studentsTable.classId,
  })
    .from(feedingRecordsTable)
    .leftJoin(studentsTable, eq(feedingRecordsTable.studentId, studentsTable.id))
    .where(
      and(
        eq(feedingRecordsTable.schoolId, schoolId),
        eq(feedingRecordsTable.date, date)
      )
    )
    .orderBy(studentsTable.name);

  res.json(records);
});

// GET /schools/:schoolId/feeding/students?classId=N  — list students for register
router.get("/schools/:schoolId/feeding/students", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const { classId } = req.query as Record<string, string>;

  const where = classId
    ? and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.classId, parseInt(classId)), eq(studentsTable.status, "active"))
    : and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.status, "active"));

  const students = await db.select({
    id: studentsTable.id,
    name: studentsTable.name,
    classId: studentsTable.classId,
  }).from(studentsTable).where(where).orderBy(studentsTable.name);

  res.json(students);
});

// POST /schools/:schoolId/feeding/records — bulk upsert for a date
// body: { date: "YYYY-MM-DD", records: [{ studentId, status }] }
router.post("/schools/:schoolId/feeding/records", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const { date, records } = req.body as { date: string; records: Array<{ studentId: number; status: string }> };

  if (!date || !Array.isArray(records) || records.length === 0) {
    res.status(400).json({ error: "date and records[] are required" });
    return;
  }

  const values = records.map(r => ({
    schoolId,
    studentId: r.studentId,
    date,
    status: r.status ?? "fed",
  }));

  const studentIdsInBatch = values.map(v => v.studentId);
  // Delete existing records for these students on this date, then re-insert
  await db.delete(feedingRecordsTable).where(
    and(
      eq(feedingRecordsTable.schoolId, schoolId),
      eq(feedingRecordsTable.date, date),
      inArray(feedingRecordsTable.studentId, studentIdsInBatch)
    )
  );
  await db.insert(feedingRecordsTable).values(values);

  res.json({ saved: values.length });
});

// ─── Feeding Fund ─────────────────────────────────────────────────────────────

// GET /schools/:schoolId/feeding/fund?academicYear=&term=
router.get("/schools/:schoolId/feeding/fund", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const { academicYear, term } = req.query as Record<string, string>;

  const where = [eq(feedingFundEntriesTable.schoolId, schoolId)];
  if (academicYear) where.push(eq(feedingFundEntriesTable.academicYear, academicYear));
  if (term) where.push(eq(feedingFundEntriesTable.term, term));

  const entries = await db.select()
    .from(feedingFundEntriesTable)
    .where(and(...where))
    .orderBy(desc(feedingFundEntriesTable.date));

  const balance = entries.reduce((acc, e) => {
    return e.type === "credit" ? acc + Number(e.amount) : acc - Number(e.amount);
  }, 0);

  res.json({ balance, entries });
});

// POST /schools/:schoolId/feeding/fund
router.post("/schools/:schoolId/feeding/fund", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const { academicYear, term, type, amount, description, date } = req.body;

  if (!academicYear || !term || !type || !amount || !date) {
    res.status(400).json({ error: "academicYear, term, type, amount, date are required" });
    return;
  }
  if (!["credit", "debit"].includes(type)) {
    res.status(400).json({ error: "type must be 'credit' or 'debit'" });
    return;
  }

  const [entry] = await db.insert(feedingFundEntriesTable).values({
    schoolId,
    academicYear,
    term,
    type,
    amount: String(amount),
    description: description ?? null,
    date,
  }).returning();

  res.status(201).json(entry);
});

// DELETE /schools/:schoolId/feeding/fund/:id
router.delete("/schools/:schoolId/feeding/fund/:id", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const id = parseInt(req.params.id, 10);

  await db.delete(feedingFundEntriesTable).where(
    and(eq(feedingFundEntriesTable.id, id), eq(feedingFundEntriesTable.schoolId, schoolId))
  );
  res.json({ deleted: true });
});

// ─── Daily summary ────────────────────────────────────────────────────────────
// GET /schools/:schoolId/feeding/summary?date=YYYY-MM-DD
router.get("/schools/:schoolId/feeding/summary", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const date = String(req.query.date ?? new Date().toISOString().split("T")[0]);

  const [row] = await db.select({
    fed: sql<number>`count(*) filter (where ${feedingRecordsTable.status} = 'fed')`,
    absent: sql<number>`count(*) filter (where ${feedingRecordsTable.status} = 'absent')`,
    opted_out: sql<number>`count(*) filter (where ${feedingRecordsTable.status} = 'opted_out')`,
  }).from(feedingRecordsTable).where(
    and(eq(feedingRecordsTable.schoolId, schoolId), eq(feedingRecordsTable.date, date))
  );

  res.json({ date, fed: Number(row?.fed ?? 0), absent: Number(row?.absent ?? 0), opted_out: Number(row?.opted_out ?? 0) });
});

export default router;
