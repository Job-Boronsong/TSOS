import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import {
  db,
  promotionRunsTable,
  studentsTable,
  classesTable,
  scoresTable,
  studentClassHistoryTable,
} from "@workspace/db";

const router: IRouter = Router();

function sid(req: any): number {
  return parseInt(req.params.schoolId, 10);
}

// GET /schools/:schoolId/promotion/preview?academicYear=
router.get("/schools/:schoolId/promotion/preview", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const { academicYear } = req.query as Record<string, string>;
  if (!academicYear) { res.status(400).json({ error: "academicYear is required" }); return; }

  const students = await db.select({
    id: studentsTable.id,
    name: studentsTable.name,
    classId: studentsTable.classId,
    className: classesTable.name,
    classLevel: classesTable.level,
  })
    .from(studentsTable)
    .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
    .where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.status, "active")));

  const allScores = await db.select({
    studentId: scoresTable.studentId,
    score: scoresTable.score,
  }).from(scoresTable).where(
    and(eq(scoresTable.schoolId, schoolId), eq(scoresTable.academicYear, academicYear))
  );

  const avgByStudent: Record<number, { sum: number; count: number }> = {};
  for (const score of allScores) {
    if (!avgByStudent[score.studentId]) avgByStudent[score.studentId] = { sum: 0, count: 0 };
    avgByStudent[score.studentId].sum += Number(score.score ?? 0);
    avgByStudent[score.studentId].count += 1;
  }

  const allClasses = await db.select().from(classesTable)
    .where(eq(classesTable.schoolId, schoolId))
    .orderBy(classesTable.level, classesTable.name);

  const classIds = allClasses.map(c => c.id);

  const studentData = students.map(s => {
    const avgData = avgByStudent[s.id];
    const yearAvg = avgData && avgData.count > 0 ? Math.round((avgData.sum / avgData.count) * 10) / 10 : null;
    const classIndex = classIds.indexOf(s.classId ?? -1);
    const nextClassId = classIndex >= 0 && classIndex < classIds.length - 1 ? classIds[classIndex + 1] : null;
    const nextClass = allClasses.find(c => c.id === nextClassId);
    const isLastClass = classIndex === classIds.length - 1 || classIndex < 0;
    const suggested: "promote" | "retain" | "graduate" = isLastClass ? "graduate"
      : (yearAvg !== null && yearAvg < 40) ? "retain" : "promote";
    return {
      id: s.id, name: s.name, classId: s.classId, className: s.className,
      classLevel: s.classLevel, yearAvg, nextClassId, nextClassName: nextClass?.name ?? null,
      isLastClass, suggestedAction: suggested,
    };
  });

  res.json({ students: studentData, classes: allClasses, academicYear });
});

// GET /schools/:schoolId/promotion-runs
router.get("/schools/:schoolId/promotion-runs", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const runs = await db.select().from(promotionRunsTable)
    .where(eq(promotionRunsTable.schoolId, schoolId))
    .orderBy(desc(promotionRunsTable.createdAt));
  res.json(runs);
});

// POST /schools/:schoolId/promotion/confirm
router.post("/schools/:schoolId/promotion/confirm", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const { academicYear, notes, promotions } = req.body as {
    academicYear: string;
    notes?: string;
    promotions: Array<{ studentId: number; action: "promote" | "retain" | "graduate"; targetClassId?: number }>;
  };

  if (!academicYear || !Array.isArray(promotions) || promotions.length === 0) {
    res.status(400).json({ error: "academicYear and promotions[] are required" });
    return;
  }

  let totalPromoted = 0, totalRetained = 0, totalGraduated = 0;

  for (const p of promotions) {
    const [student] = await db.select().from(studentsTable)
      .where(and(eq(studentsTable.id, p.studentId), eq(studentsTable.schoolId, schoolId)));
    if (!student) continue;

    const fromClassId = student.classId;

    if (p.action === "promote" && p.targetClassId) {
      await db.update(studentsTable).set({ classId: p.targetClassId })
        .where(eq(studentsTable.id, p.studentId));
      await db.insert(studentClassHistoryTable).values({
        schoolId, studentId: p.studentId,
        fromClassId: fromClassId ?? null,
        toClassId: p.targetClassId,
        changeType: "promoted",
        academicYear,
        notes: `Promoted for ${academicYear}`,
      });
      totalPromoted++;
    } else if (p.action === "graduate") {
      await db.update(studentsTable).set({ status: "inactive" })
        .where(eq(studentsTable.id, p.studentId));
      await db.insert(studentClassHistoryTable).values({
        schoolId, studentId: p.studentId,
        fromClassId: fromClassId ?? null,
        toClassId: null,
        changeType: "promoted",
        academicYear,
        notes: `Graduated ${academicYear}`,
      });
      totalGraduated++;
    } else {
      // retain — keep same class
      totalRetained++;
    }
  }

  const [run] = await db.insert(promotionRunsTable).values({
    schoolId, academicYear,
    status: "confirmed",
    totalPromoted, totalRetained, totalGraduated,
    notes: notes ?? null,
    confirmedAt: new Date(),
  }).returning();

  res.status(201).json({ run, totalPromoted, totalRetained, totalGraduated });
});

export default router;
