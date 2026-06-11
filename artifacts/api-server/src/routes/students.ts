import { Router, type IRouter } from "express";
import { eq, and, sql, ilike, isNull, inArray } from "drizzle-orm";
import { parse as parseCsv } from "csv-parse/sync";
import { db, studentsTable, classesTable, paymentsTable, feeSettingsTable, teachersTable, schoolsTable, classSubjectsTable, studentClassHistoryTable, scoresTable } from "@workspace/db";

const router: IRouter = Router();

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function schoolCode(name: string): string {
  // Take the first letter of each word (up to 3), uppercase, letters only
  const words = name.replace(/[^a-zA-Z ]/g, "").split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 3).map(w => w[0].toUpperCase()).join("");
  return initials.padEnd(2, "X").slice(0, 3);
}

async function generateStudentNumber(schoolId: number): Promise<string> {
  const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, schoolId));
  const code = schoolCode(school?.name ?? "SCH");
  const yy = String(new Date().getFullYear()).slice(2);

  // Get the highest existing auto-generated sequence for this school+year prefix
  const prefix = `${code}${yy}`;
  const existing = await db.select({ sn: studentsTable.studentNumber })
    .from(studentsTable)
    .where(and(eq(studentsTable.schoolId, schoolId), sql`${studentsTable.studentNumber} like ${prefix + "%"}`));

  let maxSeq = 0;
  for (const { sn } of existing) {
    const num = parseInt(sn.slice(prefix.length));
    if (!isNaN(num) && num > maxSeq) maxSeq = num;
  }
  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
}

async function enrichStudent(student: typeof studentsTable.$inferSelect, feeSetting: typeof feeSettingsTable.$inferSelect | undefined, className: string | null) {
  const schoolFee = Number(feeSetting?.schoolFee ?? 0);
  const busFee = Number(feeSetting?.busFee ?? 0);
  const scholarshipDiscount = Number(feeSetting?.scholarshipDiscount ?? 0);
  const staffChildDiscount = Number(feeSetting?.staffChildDiscount ?? 0);

  // Per-term fees (nullable — if any term fee is set, use sum; else fall back to flat schoolFee)
  const t1 = (feeSetting as any)?.term1SchoolFee != null ? Number((feeSetting as any).term1SchoolFee) : null;
  const t2 = (feeSetting as any)?.term2SchoolFee != null ? Number((feeSetting as any).term2SchoolFee) : null;
  const t3 = (feeSetting as any)?.term3SchoolFee != null ? Number((feeSetting as any).term3SchoolFee) : null;
  const hasTermFees = t1 !== null || t2 !== null || t3 !== null;
  const baseSchoolFee = hasTermFees ? ((t1 ?? 0) + (t2 ?? 0) + (t3 ?? 0)) : schoolFee;

  // Category-based expected fee
  let expectedFee = baseSchoolFee;
  if (student.category === "bus") expectedFee = baseSchoolFee + busFee;
  else if (student.category === "scholarship") expectedFee = baseSchoolFee * (1 - scholarshipDiscount / 100);
  else if (student.category === "staff_child") expectedFee = baseSchoolFee * (1 - staffChildDiscount / 100);

  // Per-student waiver overrides
  if (student.feeWaiver) expectedFee = 0;

  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.studentId, student.id));
  const totalPaid = payments.filter(p => p.paymentType !== "feeding_fee").reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    ...student,
    className: className ?? null,
    totalFeeExpected: expectedFee,
    totalFeePaid: totalPaid,
    arrears: Math.max(0, expectedFee - totalPaid),
  };
}

// ─────────────────────────────────────────────
// Students
// ─────────────────────────────────────────────

// Generate a student ID preview (for use in the add form)
// Must be defined BEFORE the /:studentId routes so it isn't shadowed
router.get("/schools/:schoolId/students/next-id", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const nextId = await generateStudentNumber(schoolId);
  res.json({ studentNumber: nextId });
});

router.get("/schools/:schoolId/students", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const classIdParam = req.query.classId ? parseInt(String(req.query.classId), 10) : null;
  const search = req.query.search ? String(req.query.search) : null;

  const rows = await db.select({
    student: studentsTable,
    className: classesTable.name,
  }).from(studentsTable)
    .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
    .where(and(
      eq(studentsTable.schoolId, schoolId),
      isNull(studentsTable.deletedAt),
      classIdParam ? eq(studentsTable.classId, classIdParam) : undefined,
      search ? ilike(studentsTable.name, `%${search}%`) : undefined,
    ))
    .orderBy(studentsTable.name);

  const [feeSetting] = await db.select().from(feeSettingsTable).where(eq(feeSettingsTable.schoolId, schoolId));
  const result = await Promise.all(rows.map(({ student, className }) => enrichStudent(student, feeSetting, className)));
  res.json(result);
});

router.post("/schools/:schoolId/students", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { name, studentNumber, classId, category, gender, dateOfBirth, parentName, parentPhone, photoUrl, feeWaiver, feedingWaiver, busWaiver } = req.body;
  if (!name) { res.status(400).json({ error: "Name is required" }); return; }

  const sn = studentNumber || await generateStudentNumber(schoolId);

  const [student] = await db.insert(studentsTable).values({
    schoolId, name, studentNumber: sn, classId: classId ?? null,
    category: category ?? "regular", gender, dateOfBirth, parentName, parentPhone, status: "active",
    photoUrl: photoUrl ?? null,
    feeWaiver: feeWaiver === true || feeWaiver === "true",
    feedingWaiver: feedingWaiver === true || feedingWaiver === "true",
    busWaiver: busWaiver === true || busWaiver === "true",
  }).returning();

  // Record initial enrollment if class is assigned
  if (student.classId) {
    await db.insert(studentClassHistoryTable).values({
      studentId: student.id, schoolId, fromClassId: null, toClassId: student.classId, changeType: "enrolled",
    });
  }

  let className = null;
  if (student.classId) {
    const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, student.classId));
    className = cls?.name ?? null;
  }
  res.status(201).json({ ...student, className, totalFeeExpected: 0, totalFeePaid: 0, arrears: 0 });
});

router.get("/schools/:schoolId/students/:studentId", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const studentId = parseInt(Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId, 10);

  const [row] = await db.select({ student: studentsTable, className: classesTable.name })
    .from(studentsTable).leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
    .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId)));

  if (!row) { res.status(404).json({ error: "Student not found" }); return; }

  const [feeSetting] = await db.select().from(feeSettingsTable).where(eq(feeSettingsTable.schoolId, schoolId));
  res.json(await enrichStudent(row.student, feeSetting, row.className));
});

router.put("/schools/:schoolId/students/:studentId", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const studentId = parseInt(Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId, 10);

  const { name, classId, category, gender, dateOfBirth, parentName, parentPhone, status, photoUrl, feeWaiver, feedingWaiver, busWaiver } = req.body;
  const [student] = await db.update(studentsTable)
    .set({
      name, classId, category, gender, dateOfBirth, parentName, parentPhone, status,
      photoUrl: photoUrl ?? undefined,
      ...(feeWaiver !== undefined && { feeWaiver: feeWaiver === true || feeWaiver === "true" }),
      ...(feedingWaiver !== undefined && { feedingWaiver: feedingWaiver === true || feedingWaiver === "true" }),
      ...(busWaiver !== undefined && { busWaiver: busWaiver === true || busWaiver === "true" }),
    })
    .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId)))
    .returning();

  if (!student) { res.status(404).json({ error: "Student not found" }); return; }

  let className = null;
  if (student.classId) {
    const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, student.classId));
    className = cls?.name ?? null;
  }
  res.json({ ...student, className, totalFeeExpected: null, totalFeePaid: null, arrears: null });
});

router.delete("/schools/:schoolId/students/:studentId", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const studentId = parseInt(Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId, 10);

  const [student] = await db.delete(studentsTable)
    .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId)))
    .returning();

  if (!student) { res.status(404).json({ error: "Student not found" }); return; }
  res.sendStatus(204);
});

// ─────────────────────────────────────────────
// Promote / Demote
// ─────────────────────────────────────────────

router.post("/schools/:schoolId/students/:studentId/promote", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const studentId = parseInt(Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId, 10);
  const { toClassId, changeType, academicYear, notes } = req.body;

  if (!toClassId || !changeType) { res.status(400).json({ error: "toClassId and changeType are required" }); return; }
  if (!["promoted", "demoted", "transferred"].includes(changeType)) {
    res.status(400).json({ error: "changeType must be promoted, demoted, or transferred" }); return;
  }

  const [student] = await db.select().from(studentsTable)
    .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId)));
  if (!student) { res.status(404).json({ error: "Student not found" }); return; }

  const fromClassId = student.classId;
  const [updated] = await db.update(studentsTable)
    .set({ classId: toClassId })
    .where(eq(studentsTable.id, studentId))
    .returning();

  await db.insert(studentClassHistoryTable).values({
    studentId, schoolId, fromClassId, toClassId, changeType, academicYear, notes,
  });

  let className = null;
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, toClassId));
  className = cls?.name ?? null;

  res.json({ ...updated, className });
});

// ─────────────────────────────────────────────
// Student Class History
// ─────────────────────────────────────────────

router.get("/schools/:schoolId/students/:studentId/history", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const studentId = parseInt(Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId, 10);

  const history = await db.select().from(studentClassHistoryTable)
    .where(and(eq(studentClassHistoryTable.studentId, studentId), eq(studentClassHistoryTable.schoolId, schoolId)))
    .orderBy(sql`${studentClassHistoryTable.changedAt} DESC`);

  const enriched = await Promise.all(history.map(async (h) => {
    let fromClassName = null, toClassName = null;
    if (h.fromClassId) {
      const [c] = await db.select().from(classesTable).where(eq(classesTable.id, h.fromClassId));
      fromClassName = c?.name ?? null;
    }
    if (h.toClassId) {
      const [c] = await db.select().from(classesTable).where(eq(classesTable.id, h.toClassId));
      toClassName = c?.name ?? null;
    }
    return { ...h, fromClassName, toClassName };
  }));

  res.json(enriched);
});

// ─────────────────────────────────────────────
// CSV Import
// ─────────────────────────────────────────────

router.post("/schools/:schoolId/students/import-csv", async (req, res): Promise<void> => {
  const sid = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { csv } = req.body as { csv: string };
  if (!csv) { res.status(400).json({ error: "csv field required" }); return; }

  let rows: Record<string, string>[];
  try {
    rows = parseCsv(csv, { columns: true, skip_empty_lines: true, trim: true });
  } catch {
    res.status(400).json({ error: "Could not parse CSV. Ensure it has a header row." }); return;
  }

  const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, sid));
  const allClasses = await db.select().from(classesTable).where(eq(classesTable.schoolId, sid));
  const classMap = new Map(allClasses.map(c => [c.name.toLowerCase(), c.id]));

  const imported: number[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const name = (row["name"] || row["Name"] || row["full_name"] || "").trim();
    if (!name) { errors.push(`Row ${rowNum}: name is required`); continue; }

    const classInput = (row["class"] || row["Class"] || row["class_name"] || "").trim().toLowerCase();
    let classId: number | null = null;
    if (classInput) {
      classId = classMap.get(classInput) ?? null;
      if (!classId) { errors.push(`Row ${rowNum}: class "${classInput}" not found — student added without class`); }
    }

    const category = (row["category"] || row["Category"] || "regular").toLowerCase();
    const validCategories = ["regular", "bus", "scholarship", "staff_child"];
    const gender = (row["gender"] || row["Gender"] || "").toLowerCase();
    const dateOfBirth = row["dob"] || row["date_of_birth"] || row["DOB"] || null;
    const parentName = row["parent_name"] || row["Parent Name"] || row["parent"] || null;
    const parentPhone = row["parent_phone"] || row["Parent Phone"] || row["phone"] || null;
    const studentNumber = row["student_id"] || row["student_number"] || row["Student ID"] || null;

    try {
      const sn = studentNumber || await generateStudentNumber(sid);
      const [student] = await db.insert(studentsTable).values({
        schoolId: sid, name, studentNumber: sn,
        classId, category: validCategories.includes(category) ? category : "regular",
        gender: ["male","female","other"].includes(gender) ? gender : null,
        dateOfBirth: dateOfBirth || null,
        parentName: parentName ? String(parentName).slice(0, 200) : null,
        parentPhone: parentPhone ? String(parentPhone).slice(0, 50) : null,
        status: "active",
      }).returning();
      if (student.classId) {
        await db.insert(studentClassHistoryTable).values({
          studentId: student.id, schoolId: sid, fromClassId: null, toClassId: student.classId, changeType: "enrolled",
        });
      }
      imported.push(student.id);
    } catch (err: any) {
      errors.push(`Row ${rowNum}: ${err?.message ?? "insert failed"}`);
    }
  }
  res.json({ imported: imported.length, errors });
});

// ─────────────────────────────────────────────
// End-of-Year Promote All
// ─────────────────────────────────────────────

router.post("/schools/:schoolId/students/promote-all", async (req, res): Promise<void> => {
  const sid = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { mappings, academicYear } = req.body as {
    mappings: { fromClassId: number; toClassId: number | null }[];
    academicYear: string;
  };
  if (!mappings || !Array.isArray(mappings) || !academicYear) {
    res.status(400).json({ error: "mappings and academicYear required" }); return;
  }

  let totalMoved = 0;
  for (const { fromClassId, toClassId } of mappings) {
    const students = await db.select().from(studentsTable)
      .where(and(eq(studentsTable.classId, fromClassId), eq(studentsTable.schoolId, sid), eq(studentsTable.status, "active")));

    for (const student of students) {
      await db.update(studentsTable).set({ classId: toClassId ?? null }).where(eq(studentsTable.id, student.id));
      await db.insert(studentClassHistoryTable).values({
        studentId: student.id, schoolId: sid,
        fromClassId: student.classId, toClassId: toClassId ?? null,
        changeType: toClassId ? "promoted" : "promoted",
        academicYear, notes: "End-of-year promotion",
      });
      totalMoved++;
    }
  }
  res.json({ moved: totalMoved });
});

// ─────────────────────────────────────────────
// Classes
// ─────────────────────────────────────────────

router.get("/schools/:schoolId/classes", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const classes = await db.select().from(classesTable).where(eq(classesTable.schoolId, schoolId)).orderBy(classesTable.name);

  const result = await Promise.all(classes.map(async (cls) => {
    const [sc] = await db.select({ count: sql<number>`count(*)::int` }).from(studentsTable)
      .where(and(eq(studentsTable.classId, cls.id), eq(studentsTable.status, "active")));

    let teacherName = null;
    if (cls.teacherId) {
      const [t] = await db.select().from(teachersTable).where(eq(teachersTable.id, cls.teacherId));
      teacherName = t?.name ?? null;
    }

    // For JHS classes, also include subject assignments
    const subjects = cls.level === "jhs"
      ? await db.select().from(classSubjectsTable).where(eq(classSubjectsTable.classId, cls.id))
      : [];

    const subjectsEnriched = await Promise.all(subjects.map(async (s) => {
      let subjectTeacherName = null;
      if (s.teacherId) {
        const [t] = await db.select().from(teachersTable).where(eq(teachersTable.id, s.teacherId));
        subjectTeacherName = t?.name ?? null;
      }
      return { ...s, teacherName: subjectTeacherName };
    }));

    return { ...cls, studentCount: sc?.count ?? 0, teacherName, subjects: subjectsEnriched };
  }));

  res.json(result);
});

router.post("/schools/:schoolId/classes", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { name, grade, level, teacherId } = req.body;
  if (!name) { res.status(400).json({ error: "Name is required" }); return; }

  const classLevel = level ?? "primary";
  // Only set homeroom teacher for non-JHS classes
  const homroomTeacherId = classLevel !== "jhs" ? (teacherId ?? null) : null;

  const [cls] = await db.insert(classesTable).values({
    schoolId, name, grade, level: classLevel, teacherId: homroomTeacherId,
  }).returning();
  res.status(201).json({ ...cls, studentCount: 0, teacherName: null, subjects: [] });
});

router.put("/schools/:schoolId/classes/:classId", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const classId = parseInt(Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId, 10);
  const { name, grade, level, teacherId, useSubjectTeachers } = req.body;

  const classLevel = level;
  const homroomTeacherId = classLevel !== "jhs" ? (teacherId ?? null) : null;
  // JHS always uses subject teachers by design; for other levels it's optional
  const useST = classLevel === "jhs" ? false : (useSubjectTeachers ?? false);

  const [cls] = await db.update(classesTable)
    .set({ name, grade, level: classLevel, teacherId: homroomTeacherId, useSubjectTeachers: useST })
    .where(and(eq(classesTable.id, classId), eq(classesTable.schoolId, schoolId)))
    .returning();

  if (!cls) { res.status(404).json({ error: "Class not found" }); return; }

  let teacherName = null;
  if (cls.teacherId) {
    const [t] = await db.select().from(teachersTable).where(eq(teachersTable.id, cls.teacherId));
    teacherName = t?.name ?? null;
  }
  res.json({ ...cls, teacherName, subjects: [] });
});

router.delete("/schools/:schoolId/classes/:classId", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const classId = parseInt(Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId, 10);

  const [cls] = await db.delete(classesTable).where(and(eq(classesTable.id, classId), eq(classesTable.schoolId, schoolId))).returning();
  if (!cls) { res.status(404).json({ error: "Class not found" }); return; }
  res.sendStatus(204);
});

// ─────────────────────────────────────────────
// Class Subjects (JHS only)
// ─────────────────────────────────────────────

router.get("/schools/:schoolId/classes/:classId/subjects", async (req, res): Promise<void> => {
  const classId = parseInt(Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId, 10);
  const subjects = await db.select().from(classSubjectsTable).where(eq(classSubjectsTable.classId, classId));

  const enriched = await Promise.all(subjects.map(async (s) => {
    let teacherName = null;
    if (s.teacherId) {
      const [t] = await db.select().from(teachersTable).where(eq(teachersTable.id, s.teacherId));
      teacherName = t?.name ?? null;
    }
    return { ...s, teacherName };
  }));
  res.json(enriched);
});

router.post("/schools/:schoolId/classes/:classId/subjects", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const classId = parseInt(Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId, 10);
  const { subject, teacherId } = req.body;
  if (!subject) { res.status(400).json({ error: "Subject is required" }); return; }

  const [cs] = await db.insert(classSubjectsTable).values({ classId, schoolId, subject, teacherId: teacherId ?? null }).returning();
  let teacherName = null;
  if (cs.teacherId) {
    const [t] = await db.select().from(teachersTable).where(eq(teachersTable.id, cs.teacherId));
    teacherName = t?.name ?? null;
  }
  res.status(201).json({ ...cs, teacherName });
});

router.delete("/schools/:schoolId/classes/:classId/subjects/:subjectId", async (req, res): Promise<void> => {
  const subjectId = parseInt(Array.isArray(req.params.subjectId) ? req.params.subjectId[0] : req.params.subjectId, 10);
  const [cs] = await db.delete(classSubjectsTable).where(eq(classSubjectsTable.id, subjectId)).returning();
  if (!cs) { res.status(404).json({ error: "Subject not found" }); return; }
  res.sendStatus(204);
});

// ─────────────────────────────────────────────
// Scores (school admin view)
// ─────────────────────────────────────────────

router.get("/schools/:schoolId/scores", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const studentIdParam = req.query.studentId ? parseInt(String(req.query.studentId), 10) : null;
  const term = req.query.term ? String(req.query.term) : null;
  const academicYear = req.query.academicYear ? String(req.query.academicYear) : null;

  const rows = await db.select().from(scoresTable)
    .where(and(
      eq(scoresTable.schoolId, schoolId),
      studentIdParam ? eq(scoresTable.studentId, studentIdParam) : undefined,
      term ? eq(scoresTable.term, term) : undefined,
      academicYear ? eq(scoresTable.academicYear, academicYear) : undefined,
    ))
    .orderBy(scoresTable.academicYear, scoresTable.term, scoresTable.subject);

  res.json(rows);
});

export default router;
