import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import {
  db,
  disciplineRecordsTable,
  studentsTable,
  teachersTable,
} from "@workspace/db";

const router: IRouter = Router();

function sid(req: any): number {
  return parseInt(req.params.schoolId, 10);
}

// GET /schools/:schoolId/discipline?studentId=&type=&status=&search=
router.get("/schools/:schoolId/discipline", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const { studentId, type, status } = req.query as Record<string, string>;

  const conditions: any[] = [eq(disciplineRecordsTable.schoolId, schoolId)];
  if (studentId) conditions.push(eq(disciplineRecordsTable.studentId, parseInt(studentId)));
  if (type) conditions.push(eq(disciplineRecordsTable.type, type));
  if (status) conditions.push(eq(disciplineRecordsTable.status, status));

  const records = await db.select({
    id: disciplineRecordsTable.id,
    date: disciplineRecordsTable.date,
    type: disciplineRecordsTable.type,
    description: disciplineRecordsTable.description,
    actionTaken: disciplineRecordsTable.actionTaken,
    parentNotified: disciplineRecordsTable.parentNotified,
    status: disciplineRecordsTable.status,
    adminNotes: disciplineRecordsTable.adminNotes,
    overriddenByAdmin: disciplineRecordsTable.overriddenByAdmin,
    createdAt: disciplineRecordsTable.createdAt,
    updatedAt: disciplineRecordsTable.updatedAt,
    studentId: disciplineRecordsTable.studentId,
    reportedByTeacherId: disciplineRecordsTable.reportedByTeacherId,
    studentName: studentsTable.name,
    teacherName: teachersTable.name,
  })
    .from(disciplineRecordsTable)
    .leftJoin(studentsTable, eq(disciplineRecordsTable.studentId, studentsTable.id))
    .leftJoin(teachersTable, eq(disciplineRecordsTable.reportedByTeacherId, teachersTable.id))
    .where(and(...conditions))
    .orderBy(desc(disciplineRecordsTable.date));

  res.json(records);
});

// GET /schools/:schoolId/discipline/:id
router.get("/schools/:schoolId/discipline/:id", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const id = parseInt(req.params.id, 10);

  const [record] = await db.select({
    id: disciplineRecordsTable.id,
    date: disciplineRecordsTable.date,
    type: disciplineRecordsTable.type,
    description: disciplineRecordsTable.description,
    actionTaken: disciplineRecordsTable.actionTaken,
    parentNotified: disciplineRecordsTable.parentNotified,
    status: disciplineRecordsTable.status,
    adminNotes: disciplineRecordsTable.adminNotes,
    overriddenByAdmin: disciplineRecordsTable.overriddenByAdmin,
    createdAt: disciplineRecordsTable.createdAt,
    studentId: disciplineRecordsTable.studentId,
    reportedByTeacherId: disciplineRecordsTable.reportedByTeacherId,
    studentName: studentsTable.name,
    teacherName: teachersTable.name,
  })
    .from(disciplineRecordsTable)
    .leftJoin(studentsTable, eq(disciplineRecordsTable.studentId, studentsTable.id))
    .leftJoin(teachersTable, eq(disciplineRecordsTable.reportedByTeacherId, teachersTable.id))
    .where(and(eq(disciplineRecordsTable.id, id), eq(disciplineRecordsTable.schoolId, schoolId)));

  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  res.json(record);
});

// POST /schools/:schoolId/discipline
router.post("/schools/:schoolId/discipline", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const { studentId, date, type, description, actionTaken, parentNotified, reportedByTeacherId } = req.body;

  if (!studentId || !date || !type || !description) {
    res.status(400).json({ error: "studentId, date, type, description are required" });
    return;
  }

  const [record] = await db.insert(disciplineRecordsTable).values({
    schoolId,
    studentId: parseInt(studentId),
    date,
    type,
    description,
    actionTaken: actionTaken ?? null,
    parentNotified: !!parentNotified,
    reportedByTeacherId: reportedByTeacherId ? parseInt(reportedByTeacherId) : null,
    status: "active",
  }).returning();

  res.status(201).json(record);
});

// PUT /schools/:schoolId/discipline/:id  — admin override/update
router.put("/schools/:schoolId/discipline/:id", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const id = parseInt(req.params.id, 10);
  const { description, actionTaken, parentNotified, status, adminNotes, type } = req.body;

  const updates: Record<string, any> = {
    overriddenByAdmin: true,
    updatedAt: new Date(),
  };
  if (description !== undefined) updates.description = description;
  if (actionTaken !== undefined) updates.actionTaken = actionTaken;
  if (parentNotified !== undefined) updates.parentNotified = !!parentNotified;
  if (status !== undefined) updates.status = status;
  if (adminNotes !== undefined) updates.adminNotes = adminNotes;
  if (type !== undefined) updates.type = type;

  const [record] = await db.update(disciplineRecordsTable)
    .set(updates)
    .where(and(eq(disciplineRecordsTable.id, id), eq(disciplineRecordsTable.schoolId, schoolId)))
    .returning();

  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  res.json(record);
});

// DELETE /schools/:schoolId/discipline/:id
router.delete("/schools/:schoolId/discipline/:id", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const id = parseInt(req.params.id, 10);
  await db.delete(disciplineRecordsTable).where(
    and(eq(disciplineRecordsTable.id, id), eq(disciplineRecordsTable.schoolId, schoolId))
  );
  res.json({ deleted: true });
});

export default router;
