import { Router, type IRouter } from "express";
import { eq, and, gte, sql } from "drizzle-orm";
import {
  db,
  usersTable, schoolSettingsTable, featureTogglesTable, feeSettingsTable,
  classesTable, studentsTable, teachersTable,
  attendanceTable, paymentsTable, salesTable, expendituresTable,
} from "@workspace/db";

const router: IRouter = Router();

// Resolve the authenticated school admin from session
async function resolveSchoolAdmin(req: any): Promise<{ userId: number; role: string; schoolId: number | null } | null> {
  if (!req.session?.userId) return null;
  const [user] = await db.select({ id: usersTable.id, role: usersTable.role, schoolId: usersTable.schoolId })
    .from(usersTable).where(eq(usersTable.id, req.session.userId));
  return user ?? null;
}

const requireSchoolAdmin = async (req: any, res: any, next: any) => {
  const user = await resolveSchoolAdmin(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }
  req.resolvedUser = user;
  next();
};

router.get("/sync/pull", requireSchoolAdmin, async (req: any, res): Promise<void> => {
  const user = req.resolvedUser;
  const schoolId = user.role === "school_admin"
    ? user.schoolId
    : req.query.schoolId ? parseInt(req.query.schoolId as string, 10) : null;
  if (!schoolId) { res.status(400).json({ error: "schoolId required" }); return; }

  const since = req.query.since ? new Date(req.query.since as string) : null;
  // coreOnly=true: only return students, classes, teachers, settings — skip attendance & finance
  // Used for the fast initial load so the dashboard shows immediately
  const coreOnly = req.query.coreOnly === "true";

  // On first sync (no `since`), cap historical data to avoid huge downloads:
  // - Attendance: last 90 days
  // - Payments/Sales/Expenditures: last 365 days
  const now = new Date();
  const attendanceCutoff = since ?? new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const financeCutoff = since ?? new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const coreQueries = await Promise.all([
    since
      ? db.select().from(classesTable).where(and(eq(classesTable.schoolId, schoolId), gte(classesTable.createdAt, since)))
      : db.select().from(classesTable).where(eq(classesTable.schoolId, schoolId)),
    since
      ? db.select().from(studentsTable).where(and(eq(studentsTable.schoolId, schoolId), gte(studentsTable.updatedAt, since)))
      : db.select().from(studentsTable).where(eq(studentsTable.schoolId, schoolId)),
    since
      ? db.select().from(teachersTable).where(and(eq(teachersTable.schoolId, schoolId), gte(teachersTable.createdAt, since)))
      : db.select().from(teachersTable).where(eq(teachersTable.schoolId, schoolId)),
    db.select().from(feeSettingsTable).where(eq(feeSettingsTable.schoolId, schoolId)),
    db.select().from(featureTogglesTable).where(eq(featureTogglesTable.schoolId, schoolId)),
    db.select().from(schoolSettingsTable).where(eq(schoolSettingsTable.schoolId, schoolId)),
  ]);

  const [classes, students, teachers, feeSettings, featureToggles, schoolSettings] = coreQueries;

  if (coreOnly) {
    res.json({
      syncedAt: new Date().toISOString(),
      isFirstSync: !since,
      isCoreOnly: true,
      classes: classes.map(c => ({ ...c, level: c.level ?? "primary" })),
      students: students.map(s => ({ ...s, dateOfBirth: s.dateOfBirth ?? null })),
      teachers: teachers.map(({ passwordHash, ...t }) => t),
      feeSettings: feeSettings[0] ?? null,
      featureToggles: featureToggles[0] ?? null,
      schoolSettings: schoolSettings[0] ?? null,
      attendance: [], payments: [], sales: [], expenditures: [],
    });
    return;
  }

  const [attendance, payments, sales, expenditures] = await Promise.all([
    db.select().from(attendanceTable).where(
      and(eq(attendanceTable.schoolId, schoolId), gte(attendanceTable.date, sql`${attendanceCutoff.toISOString().slice(0,10)}::date`))
    ),
    db.select().from(paymentsTable).where(
      and(eq(paymentsTable.schoolId, schoolId), gte(paymentsTable.createdAt, financeCutoff))
    ),
    db.select().from(salesTable).where(
      and(eq(salesTable.schoolId, schoolId), gte(salesTable.createdAt, financeCutoff))
    ),
    db.select().from(expendituresTable).where(
      and(eq(expendituresTable.schoolId, schoolId), gte(expendituresTable.createdAt, financeCutoff))
    ),
  ]);

  res.json({
    syncedAt: new Date().toISOString(),
    isFirstSync: !since,
    isCoreOnly: false,
    classes: classes.map(c => ({ ...c, level: c.level ?? "primary" })),
    students: students.map(s => ({ ...s, dateOfBirth: s.dateOfBirth ?? null })),
    teachers: teachers.map(({ passwordHash, ...t }) => t),
    feeSettings: feeSettings[0] ?? null,
    featureToggles: featureToggles[0] ?? null,
    schoolSettings: schoolSettings[0] ?? null,
    attendance: attendance.map(a => ({ ...a })),
    payments: payments.map(p => ({ ...p, amount: Number(p.amount) })),
    sales: sales.map(s => ({ ...s, amount: Number(s.amount) })),
    expenditures: expenditures.map(e => ({ ...e, amount: Number(e.amount) })),
  });
});

router.post("/sync/push", requireSchoolAdmin, async (req: any, res): Promise<void> => {
  const user = req.resolvedUser;
  const schoolId = user.role === "school_admin" ? user.schoolId : null;
  if (!schoolId) { res.status(403).json({ error: "Super admins cannot push sync" }); return; }

  const operations: any[] = req.body.operations ?? [];
  const results: any[] = [];

  for (const op of operations) {
    try {
      const { id: opId, entity, action, data, serverId } = op;

      if (entity === "student") {
        if (action === "create") {
          const [s] = await db.insert(studentsTable).values({ ...data, schoolId }).returning();
          results.push({ opId, ok: true, entity, action, serverId: s.id, localId: data._localId });
        } else if (action === "update" && serverId) {
          await db.update(studentsTable).set(data).where(and(eq(studentsTable.id, serverId), eq(studentsTable.schoolId, schoolId)));
          results.push({ opId, ok: true, entity, action, serverId });
        } else if (action === "delete" && serverId) {
          await db.delete(studentsTable).where(and(eq(studentsTable.id, serverId), eq(studentsTable.schoolId, schoolId)));
          results.push({ opId, ok: true, entity, action, serverId });
        }
      } else if (entity === "class") {
        if (action === "create") {
          const [c] = await db.insert(classesTable).values({ ...data, schoolId }).returning();
          results.push({ opId, ok: true, entity, action, serverId: c.id, localId: data._localId });
        } else if (action === "delete" && serverId) {
          await db.delete(classesTable).where(and(eq(classesTable.id, serverId), eq(classesTable.schoolId, schoolId)));
          results.push({ opId, ok: true, entity, action, serverId });
        }
      } else if (entity === "teacher") {
        if (action === "create") {
          const [t] = await db.insert(teachersTable).values({ ...data, schoolId }).returning();
          results.push({ opId, ok: true, entity, action, serverId: t.id, localId: data._localId });
        } else if (action === "update" && serverId) {
          await db.update(teachersTable).set(data).where(and(eq(teachersTable.id, serverId), eq(teachersTable.schoolId, schoolId)));
          results.push({ opId, ok: true, entity, action, serverId });
        } else if (action === "delete" && serverId) {
          await db.delete(teachersTable).where(and(eq(teachersTable.id, serverId), eq(teachersTable.schoolId, schoolId)));
          results.push({ opId, ok: true, entity, action, serverId });
        }
      } else if (entity === "attendance") {
        if (action === "mark") {
          const records: any[] = data.records ?? [];
          const date: string = data.date;
          for (const rec of records) {
            const existing = await db.select().from(attendanceTable).where(
              and(eq(attendanceTable.schoolId, schoolId), eq(attendanceTable.studentId, rec.studentId), eq(attendanceTable.date, date))
            );
            if (existing.length > 0) {
              await db.update(attendanceTable).set({ status: rec.status }).where(
                and(eq(attendanceTable.schoolId, schoolId), eq(attendanceTable.studentId, rec.studentId), eq(attendanceTable.date, date))
              );
            } else {
              await db.insert(attendanceTable).values({ schoolId, studentId: rec.studentId, date, status: rec.status });
            }
          }
          results.push({ opId, ok: true, entity, action });
        }
      } else if (entity === "payment") {
        if (action === "create") {
          const [p] = await db.insert(paymentsTable).values({ ...data, schoolId, amount: String(data.amount) }).returning();
          results.push({ opId, ok: true, entity, action, serverId: p.id, localId: data._localId });
        }
      } else if (entity === "sale") {
        if (action === "create") {
          const [s] = await db.insert(salesTable).values({ ...data, schoolId, amount: String(data.amount) }).returning();
          results.push({ opId, ok: true, entity, action, serverId: s.id, localId: data._localId });
        }
      } else if (entity === "expenditure") {
        if (action === "create") {
          const [e] = await db.insert(expendituresTable).values({ ...data, schoolId, amount: String(data.amount) }).returning();
          results.push({ opId, ok: true, entity, action, serverId: e.id, localId: data._localId });
        } else {
          results.push({ opId, ok: false, error: `Unknown action for expenditure: ${action}` });
        }
      } else {
        // Unknown entity — acknowledge with a failure so the client can retire the item
        // rather than leaving it stuck in the queue indefinitely.
        results.push({ opId, ok: false, error: `Unknown entity: ${entity}` });
      }
    } catch (err: any) {
      results.push({ opId, ok: false, error: err.message });
    }
  }

  res.json({ results });
});

export default router;
