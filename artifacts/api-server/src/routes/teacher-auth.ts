import { Router, type IRouter } from "express";
import { eq, and, inArray, sql, desc, gte, lte } from "drizzle-orm";
import { db, teachersTable, schoolsTable, classesTable, classSubjectsTable, studentsTable, scoresTable, attendanceTable, timetableSlotsTable, teacherAttendanceTable, schoolSettingsTable, announcementsTable, announcementReadsTable, calendarEventsTable, subscriptionsTable } from "@workspace/db";
import bcrypt from "bcryptjs";

declare module "express-session" {
  interface SessionData {
    teacherId: number;
    teacherSchoolId: number;
  }
}

const LOCKOUT_DURATION_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

const router: IRouter = Router();

// ─── Ghana grading scale ───────────────────────────────────────────
function computeGrade(score: number): { grade: string; remarks: string } {
  if (score >= 80) return { grade: "A1", remarks: "Excellent" };
  if (score >= 70) return { grade: "B2", remarks: "Very Good" };
  if (score >= 60) return { grade: "B3", remarks: "Good" };
  if (score >= 55) return { grade: "C4", remarks: "Credit" };
  if (score >= 50) return { grade: "C5", remarks: "Credit" };
  if (score >= 45) return { grade: "C6", remarks: "Credit" };
  if (score >= 40) return { grade: "D7", remarks: "Pass" };
  if (score >= 35) return { grade: "E8", remarks: "Pass" };
  return { grade: "F9", remarks: "Fail" };
}

// ─── Auth ──────────────────────────────────────────────────────────

router.post("/teacher-auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.username, username));
  if (!teacher || !teacher.passwordHash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (teacher.lockedUntil && teacher.lockedUntil > new Date()) {
    const remaining = Math.ceil((teacher.lockedUntil.getTime() - Date.now()) / 60000);
    res.status(423).json({ error: `Account locked. Try again in ${remaining} minute${remaining !== 1 ? "s" : ""}.`, lockedUntil: teacher.lockedUntil.toISOString() });
    return;
  }

  const valid = await bcrypt.compare(password, teacher.passwordHash);
  if (!valid) {
    const newAttempts = (teacher.failedLoginAttempts ?? 0) + 1;
    if (newAttempts >= MAX_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      await db.update(teachersTable).set({ failedLoginAttempts: 0, lockedUntil }).where(eq(teachersTable.id, teacher.id));
      res.status(423).json({ error: "Too many failed attempts. Account locked for 5 minutes.", lockedUntil: lockedUntil.toISOString() });
    } else {
      await db.update(teachersTable).set({ failedLoginAttempts: newAttempts }).where(eq(teachersTable.id, teacher.id));
      const left = MAX_ATTEMPTS - newAttempts;
      res.status(401).json({ error: `Invalid credentials. ${left} attempt${left !== 1 ? "s" : ""} remaining before lockout.` });
    }
    return;
  }

  await db.update(teachersTable).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(teachersTable.id, teacher.id));

  // Block login if school subscription has expired (past grace period)
  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.schoolId, teacher.schoolId));
  if (sub) {
    const today = new Date().toISOString().split("T")[0];
    const graceEnd = new Date(sub.expiryDate);
    graceEnd.setDate(graceEnd.getDate() + 3);
    const graceEndStr = graceEnd.toISOString().split("T")[0];
    if (graceEndStr < today) {
      res.status(403).json({ error: "subscription_expired", message: "Your school's subscription has expired. Please contact your school administrator to renew." });
      return;
    }
  }

  req.session.teacherId = teacher.id;
  req.session.teacherSchoolId = teacher.schoolId;

  await new Promise<void>((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });

  res.json({
    teacher: {
      id: teacher.id,
      name: teacher.name,
      username: teacher.username,
      schoolId: teacher.schoolId,
      mustChangePassword: teacher.mustChangePassword,
      subject: teacher.subject,
    },
  });
});

router.post("/teacher-auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {});
  res.json({ ok: true });
});

router.get("/teacher-auth/me", async (req, res): Promise<void> => {
  if (!req.session.teacherId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.id, req.session.teacherId));
  if (!teacher) { res.status(401).json({ error: "Not authenticated" }); return; }

  const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, teacher.schoolId));
  res.json({
    teacher: {
      id: teacher.id,
      name: teacher.name,
      username: teacher.username,
      schoolId: teacher.schoolId,
      mustChangePassword: teacher.mustChangePassword,
      subject: teacher.subject,
    },
    school: school ?? null,
  });
});

router.post("/teacher-auth/change-password", async (req, res): Promise<void> => {
  if (!req.session.teacherId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) { res.status(400).json({ error: "Both passwords are required" }); return; }
  if (newPassword.length < 6) { res.status(400).json({ error: "New password must be at least 6 characters" }); return; }

  const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.id, req.session.teacherId));
  if (!teacher || !teacher.passwordHash) { res.status(401).json({ error: "Not authenticated" }); return; }

  const valid = await bcrypt.compare(currentPassword, teacher.passwordHash);
  if (!valid) { res.status(400).json({ error: "Current password is incorrect" }); return; }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(teachersTable).set({ passwordHash, mustChangePassword: false }).where(eq(teachersTable.id, teacher.id));
  res.json({ ok: true });
});

// ─── Teacher portal: my classes & students ─────────────────────────

function requireTeacher(req: any, res: any): boolean {
  if (!req.session.teacherId) {
    res.status(401).json({ error: "Not authenticated as teacher" });
    return false;
  }
  return true;
}

router.get("/teacher/my-classes", async (req, res): Promise<void> => {
  if (!requireTeacher(req, res)) return;
  const teacherId = req.session.teacherId!;

  // Homeroom classes (primary/kg/nursery) — teacher is class teacher
  const homeroomClasses = await db.select().from(classesTable).where(eq(classesTable.teacherId, teacherId));

  // JHS subject assignments — teacher may teach multiple subjects across multiple classes
  const subjectAssignments = await db.select().from(classSubjectsTable).where(eq(classSubjectsTable.teacherId, teacherId));
  const jhsClassIds = [...new Set(subjectAssignments.map(s => s.classId))];
  const jhsClasses = jhsClassIds.length
    ? await db.select().from(classesTable).where(inArray(classesTable.id, jhsClassIds))
    : [];

  // Get student counts for all involved classes in one query
  const allInvolvedIds = [...new Set([...homeroomClasses.map(c => c.id), ...jhsClassIds])];
  const studentCounts: Record<number, number> = {};
  if (allInvolvedIds.length) {
    const counts = await db.select({
      classId: studentsTable.classId,
      count: sql<number>`count(*)::int`,
    }).from(studentsTable)
      .where(and(inArray(studentsTable.classId, allInvolvedIds), eq(studentsTable.status, "active")))
      .groupBy(studentsTable.classId);
    for (const row of counts) {
      if (row.classId != null) studentCounts[row.classId] = row.count;
    }
  }

  // Merge and deduplicate
  const seen = new Set<number>();
  const allClasses: any[] = [];
  for (const cls of [...homeroomClasses, ...jhsClasses]) {
    if (seen.has(cls.id)) continue;
    seen.add(cls.id);
    const mySubjects = subjectAssignments
      .filter(s => s.classId === cls.id)
      .map(s => s.subject);
    allClasses.push({
      ...cls,
      mySubjects: mySubjects.length > 0 ? mySubjects : null,
      studentCount: studentCounts[cls.id] ?? 0,
    });
  }

  res.json(allClasses);
});

router.get("/teacher/timetable", async (req, res): Promise<void> => {
  if (!requireTeacher(req, res)) return;
  const teacherId = req.session.teacherId!;
  const schoolId = req.session.teacherSchoolId!;

  // Homeroom classes (all levels where teacher is the class teacher)
  const homeroomClasses = await db.select({ id: classesTable.id, name: classesTable.name, level: classesTable.level })
    .from(classesTable).where(eq(classesTable.teacherId, teacherId));
  const homeroomClassIds = homeroomClasses.map(c => c.id);

  // Subject assignments (JHS) — which subjects in which classes
  const subjectAssignments = await db.select().from(classSubjectsTable).where(eq(classSubjectsTable.teacherId, teacherId));
  const mySubjectsByClass: Record<number, string[]> = {};
  for (const sa of subjectAssignments) {
    if (!mySubjectsByClass[sa.classId]) mySubjectsByClass[sa.classId] = [];
    mySubjectsByClass[sa.classId].push(sa.subject);
  }
  const jhsClassIds = [...new Set(subjectAssignments.map(s => s.classId))];

  const allClassIds = [...new Set([...homeroomClassIds, ...jhsClassIds])];
  if (!allClassIds.length) {
    res.json({ slots: [], classes: [], homeroomClassIds: [], mySubjectsByClass: {} });
    return;
  }

  // Fetch all timetable slots for involved classes
  const allSlots = await db.select().from(timetableSlotsTable).where(
    and(
      eq(timetableSlotsTable.schoolId, schoolId),
      inArray(timetableSlotsTable.classId, allClassIds)
    )
  );

  // Filter: homeroom → all slots for that class; subject teacher → only their subjects' slots
  const visibleSlots = allSlots.filter(slot => {
    if (homeroomClassIds.includes(slot.classId)) return true;
    const mySubjects = (mySubjectsByClass[slot.classId] ?? []).map(s => s.toLowerCase());
    return mySubjects.includes((slot.subject ?? "").toLowerCase());
  });

  // Fetch class names/levels for the response
  const classRows = await db.select({ id: classesTable.id, name: classesTable.name, level: classesTable.level })
    .from(classesTable).where(inArray(classesTable.id, allClassIds));

  res.json({
    slots: visibleSlots,
    classes: classRows,
    homeroomClassIds,
    mySubjectsByClass,
  });
});

router.get("/teacher/my-students", async (req, res): Promise<void> => {
  if (!requireTeacher(req, res)) return;
  const teacherId = req.session.teacherId!;
  const classIdParam = req.query.classId ? parseInt(String(req.query.classId), 10) : null;

  // Get classes this teacher is assigned to
  const homeroomClasses = await db.select({ id: classesTable.id }).from(classesTable).where(eq(classesTable.teacherId, teacherId));
  const jhsSubjectRows = await db.select({ classId: classSubjectsTable.classId }).from(classSubjectsTable).where(eq(classSubjectsTable.teacherId, teacherId));

  const myClassIds = [...new Set([...homeroomClasses.map(c => c.id), ...jhsSubjectRows.map(s => s.classId)])];
  if (!myClassIds.length) { res.json([]); return; }

  const targetClassIds = classIdParam ? [classIdParam].filter(id => myClassIds.includes(id)) : myClassIds;
  if (!targetClassIds.length) { res.json([]); return; }

  const students = await db.select({
    student: studentsTable,
    className: classesTable.name,
    classLevel: classesTable.level,
  }).from(studentsTable)
    .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
    .where(
      and(
        eq(studentsTable.status, "active"),
        targetClassIds.length === 1
          ? eq(studentsTable.classId, targetClassIds[0])
          : eq(studentsTable.classId, targetClassIds[0]) // simplified — will handle multi-class below
      )
    );

  // If multiple classes, fetch for each
  if (targetClassIds.length > 1) {
    const allStudents = [];
    for (const classId of targetClassIds) {
      const rows = await db.select({
        student: studentsTable,
        className: classesTable.name,
        classLevel: classesTable.level,
      }).from(studentsTable)
        .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
        .where(and(eq(studentsTable.classId, classId), eq(studentsTable.status, "active")));
      allStudents.push(...rows);
    }
    res.json(allStudents.map(r => ({ ...r.student, className: r.className, classLevel: r.classLevel })));
    return;
  }

  res.json(students.map(r => ({ ...r.student, className: r.className, classLevel: r.classLevel })));
});

// ─── Scores ────────────────────────────────────────────────────────

router.get("/teacher/scores", async (req, res): Promise<void> => {
  if (!requireTeacher(req, res)) return;
  const teacherId = req.session.teacherId!;
  const { classId, term, academicYear } = req.query;

  if (!classId || !term || !academicYear) {
    res.status(400).json({ error: "classId, term, and academicYear are required" });
    return;
  }

  const scores = await db.select().from(scoresTable).where(
    and(
      eq(scoresTable.classId, parseInt(String(classId))),
      eq(scoresTable.term, String(term)),
      eq(scoresTable.academicYear, String(academicYear)),
      eq(scoresTable.teacherId, teacherId),
    )
  );
  res.json(scores);
});

router.post("/teacher/scores", async (req, res): Promise<void> => {
  if (!requireTeacher(req, res)) return;
  const teacherId = req.session.teacherId!;
  const schoolId = req.session.teacherSchoolId!;
  const {
    studentId, classId, subject, term, academicYear,
    classWork, classTest, homework, projectWork, examScore,
    remarks,
  } = req.body;

  if (!studentId || !subject || !term || !academicYear) {
    res.status(400).json({ error: "studentId, subject, term, and academicYear are required" });
    return;
  }

  // Component caps: CW=10, CT=20, HW=5, PW=5, Exam=60 → total max=100
  const cw   = classWork   !== undefined && classWork   !== "" ? Math.min(Number(classWork),   10) : null;
  const ct   = classTest   !== undefined && classTest   !== "" ? Math.min(Number(classTest),   20) : null;
  const hw   = homework    !== undefined && homework    !== "" ? Math.min(Number(homework),     5) : null;
  const pw   = projectWork !== undefined && projectWork !== "" ? Math.min(Number(projectWork),  5) : null;
  const exam = examScore   !== undefined && examScore   !== "" ? Math.min(Number(examScore),   60) : null;

  // Total = sum of all components that were supplied
  const parts = [cw, ct, hw, pw, exam];
  const hasAny = parts.some(p => p !== null);
  const total  = hasAny ? parts.reduce((s, p) => s + (p ?? 0), 0) : null;

  const gradeInfo = total !== null ? computeGrade(total) : null;

  const existing = await db.select().from(scoresTable).where(
    and(
      eq(scoresTable.studentId, studentId),
      eq(scoresTable.subject, subject),
      eq(scoresTable.term, term),
      eq(scoresTable.academicYear, academicYear),
    )
  );

  const scoreData: any = {
    classWork:   cw   !== null ? String(cw)   : null,
    classTest:   ct   !== null ? String(ct)   : null,
    homework:    hw   !== null ? String(hw)   : null,
    projectWork: pw   !== null ? String(pw)   : null,
    examScore:   exam !== null ? String(exam) : null,
    score:       total !== null ? String(total) : null,
    maxScore:    "100",
    grade:       gradeInfo?.grade ?? null,
    remarks:     remarks ?? gradeInfo?.remarks ?? null,
    teacherId,
    classId,
  };

  let savedScore;
  if (existing.length > 0) {
    [savedScore] = await db.update(scoresTable).set(scoreData)
      .where(eq(scoresTable.id, existing[0].id)).returning();
  } else {
    [savedScore] = await db.insert(scoresTable).values({
      schoolId, studentId, subject, term, academicYear,
      ...scoreData,
    }).returning();
  }

  res.status(201).json(savedScore);
});

router.delete("/teacher/scores/:scoreId", async (req, res): Promise<void> => {
  if (!requireTeacher(req, res)) return;
  const scoreId = parseInt(req.params.scoreId, 10);
  await db.delete(scoresTable).where(and(eq(scoresTable.id, scoreId), eq(scoresTable.teacherId, req.session.teacherId!)));
  res.sendStatus(204);
});

// ─── Cumulative class record ────────────────────────────────────────

router.get("/teacher/class/:classId/cumulative", async (req, res): Promise<void> => {
  if (!requireTeacher(req, res)) return;
  const classId = parseInt(req.params.classId, 10);
  const { term, academicYear } = req.query;
  const schoolId = req.session.teacherSchoolId!;

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, classId));
  if (!cls) { res.status(404).json({ error: "Class not found" }); return; }

  const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, schoolId));

  const allStudents = await db.select().from(studentsTable)
    .where(and(eq(studentsTable.classId, classId), eq(studentsTable.status, "active")));

  if (allStudents.length === 0) {
    res.json({ class: cls, school: { name: school?.name }, subjects: [], students: [] });
    return;
  }

  const studentIds = allStudents.map(s => s.id);

  const scoreFilters: any[] = [
    eq(scoresTable.schoolId, schoolId),
    inArray(scoresTable.studentId, studentIds),
  ];
  if (term) scoreFilters.push(eq(scoresTable.term, String(term)));
  if (academicYear) scoreFilters.push(eq(scoresTable.academicYear, String(academicYear)));

  const allScores = await db.select().from(scoresTable).where(and(...scoreFilters));

  // Collect all unique subjects (sorted alphabetically)
  const subjects = [...new Set(allScores.map(s => s.subject))].sort();

  // Build one row per student
  const rows = allStudents.map(student => {
    const sScores = allScores.filter(s => s.studentId === student.id);
    const bySubject: Record<string, number | null> = {};
    for (const sc of sScores) {
      bySubject[sc.subject] = sc.score !== null ? Number(sc.score) : null;
    }
    const scored = sScores.filter(s => s.score !== null);
    const total = scored.reduce((sum, s) => sum + Number(s.score), 0);
    const maxTotal = subjects.length * 100;
    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
    const grade = scored.length > 0 ? computeGrade(percentage) : null;
    return { id: student.id, name: student.name, studentNumber: student.studentNumber, gender: student.gender, bySubject, total, percentage: Math.round(percentage * 10) / 10, grade: grade?.grade ?? null, position: 0 };
  });

  // Sort by total descending, then assign positions (tie-aware)
  rows.sort((a, b) => b.total - a.total);
  for (let i = 0; i < rows.length; i++) {
    if (i > 0 && rows[i].total === rows[i - 1].total) {
      rows[i].position = rows[i - 1].position;
    } else {
      rows[i].position = i + 1;
    }
  }

  res.json({ class: { id: cls.id, name: cls.name }, school: { name: school?.name, address: school?.address, logoUrl: school?.logoUrl }, term: term ?? null, academicYear: academicYear ?? null, subjects, students: rows });
});

// ─── Report card (accessible to teacher AND school admin) ──────────

router.get("/schools/:schoolId/students/:studentId/report", async (req, res): Promise<void> => {
  const schoolId = parseInt(req.params.schoolId, 10);
  const studentId = parseInt(req.params.studentId, 10);
  const { term, academicYear } = req.query;

  const [student] = await db.select().from(studentsTable).where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId)));
  if (!student) { res.status(404).json({ error: "Student not found" }); return; }

  const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, schoolId));

  let cls = null;
  if (student.classId) {
    const [c] = await db.select().from(classesTable).where(eq(classesTable.id, student.classId));
    cls = c ?? null;
  }

  const scoreFilter = [eq(scoresTable.studentId, studentId), eq(scoresTable.schoolId, schoolId)];
  if (term) scoreFilter.push(eq(scoresTable.term, String(term)));
  if (academicYear) scoreFilter.push(eq(scoresTable.academicYear, String(academicYear)));

  const scores = await db.select().from(scoresTable).where(and(...scoreFilter as any)).orderBy(scoresTable.subject);

  const totalScore = scores.reduce((sum, s) => sum + (s.score ? Number(s.score) : 0), 0);
  const totalMax = scores.reduce((sum, s) => sum + Number(s.maxScore), 0);
  const percentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
  const overallGrade = scores.length > 0 ? computeGrade(percentage) : null;

  // Position: batch-fetch all classmates' scores in one query
  let position = null;
  if (student.classId && scores.length > 0) {
    const classStudents = await db.select({ id: studentsTable.id }).from(studentsTable)
      .where(and(eq(studentsTable.classId, student.classId), eq(studentsTable.status, "active")));

    const classmateIds = classStudents.map(cs => cs.id).filter(id => id !== studentId);
    if (classmateIds.length > 0) {
      const scoreFilters: any[] = [inArray(scoresTable.studentId, classmateIds)];
      if (term) scoreFilters.push(eq(scoresTable.term, String(term)));
      if (academicYear) scoreFilters.push(eq(scoresTable.academicYear, String(academicYear)));

      const classmateScores = await db.select({ studentId: scoresTable.studentId, score: scoresTable.score, maxScore: scoresTable.maxScore })
        .from(scoresTable).where(and(...scoreFilters));

      const totalsByStudent: Record<number, { total: number; max: number }> = {};
      for (const sc of classmateScores) {
        if (!totalsByStudent[sc.studentId]) totalsByStudent[sc.studentId] = { total: 0, max: 0 };
        totalsByStudent[sc.studentId].total += sc.score ? Number(sc.score) : 0;
        totalsByStudent[sc.studentId].max += Number(sc.maxScore);
      }
      let higherCount = 0;
      for (const { total, max } of Object.values(totalsByStudent)) {
        const pct = max > 0 ? (total / max) * 100 : 0;
        if (pct > percentage) higherCount++;
      }
      position = higherCount + 1;
    } else {
      position = 1;
    }
  }

  res.json({
    student: { ...student, className: cls?.name ?? null },
    school: { name: school?.name, address: school?.address, logoUrl: school?.logoUrl },
    term: term ?? null,
    academicYear: academicYear ?? null,
    scores: scores.map(s => ({ ...s, score: s.score ? Number(s.score) : null, maxScore: Number(s.maxScore) })),
    summary: { totalScore, totalMax, percentage: Math.round(percentage * 10) / 10, overallGrade: overallGrade?.grade ?? null, overallRemarks: overallGrade?.remarks ?? null, position },
  });
});

// ─── Teacher: mark student attendance ──────────────────────────────

router.get("/teacher/attendance", async (req, res): Promise<void> => {
  if (!requireTeacher(req, res)) return;
  const teacherId = req.session.teacherId!;
  const schoolId = req.session.teacherSchoolId!;
  const classIdParam = req.query.classId ? parseInt(String(req.query.classId), 10) : null;
  const date = String(req.query.date ?? new Date().toISOString().slice(0, 10));

  if (!classIdParam) { res.status(400).json({ error: "classId required" }); return; }

  // Verify teacher owns this class
  const [cls] = await db.select().from(classesTable).where(and(eq(classesTable.id, classIdParam), eq(classesTable.schoolId, schoolId)));
  if (!cls) { res.status(403).json({ error: "Not your class" }); return; }

  const students = await db.select().from(studentsTable)
    .where(and(eq(studentsTable.classId, classIdParam), eq(studentsTable.status, "active")))
    .orderBy(studentsTable.name);

  const records = await db.select().from(attendanceTable)
    .where(and(eq(attendanceTable.schoolId, schoolId), eq(attendanceTable.date, date)));

  const attendanceMap: Record<number, string> = {};
  for (const rec of records) attendanceMap[rec.studentId] = rec.status;

  res.json({
    date,
    class: { id: cls.id, name: cls.name },
    students: students.map(s => ({ id: s.id, name: s.name, studentNumber: s.studentNumber, gender: s.gender, status: attendanceMap[s.id] ?? null })),
    totalMarked: records.filter(r => students.some(s => s.id === r.studentId)).length,
  });
});

router.post("/teacher/attendance", async (req, res): Promise<void> => {
  if (!requireTeacher(req, res)) return;
  const teacherId = req.session.teacherId!;
  const schoolId = req.session.teacherSchoolId!;
  const { classId, date, records } = req.body;

  if (!classId || !date || !Array.isArray(records)) {
    res.status(400).json({ error: "classId, date, and records[] required" }); return;
  }

  // Verify teacher owns the class
  const [cls] = await db.select({ id: classesTable.id }).from(classesTable)
    .where(and(eq(classesTable.id, classId), eq(classesTable.schoolId, schoolId)));
  if (!cls) { res.status(403).json({ error: "Not your class" }); return; }

  let saved = 0;
  for (const rec of records as { studentId: number; status: string }[]) {
    if (!rec.studentId || !rec.status) continue;
    const existing = await db.select({ id: attendanceTable.id }).from(attendanceTable)
      .where(and(eq(attendanceTable.schoolId, schoolId), eq(attendanceTable.studentId, rec.studentId), eq(attendanceTable.date, date)));
    if (existing.length > 0) {
      await db.update(attendanceTable).set({ status: rec.status, markedByTeacherId: teacherId }).where(eq(attendanceTable.id, existing[0].id));
    } else {
      await db.insert(attendanceTable).values({ schoolId, studentId: rec.studentId, date, status: rec.status, markedByTeacherId: teacherId });
    }
    saved++;
  }

  res.json({ saved, date, classId });
});

// ─── Teacher: add a student to their class ─────────────────────────

router.post("/teacher/add-student", async (req, res): Promise<void> => {
  if (!requireTeacher(req, res)) return;
  const schoolId = req.session.teacherSchoolId!;
  const { name, classId, gender, dateOfBirth, parentName, parentPhone } = req.body;

  if (!name) { res.status(400).json({ error: "Student name is required" }); return; }

  // Auto-generate student number
  const [school] = await db.select({ id: schoolsTable.id, name: schoolsTable.name }).from(schoolsTable).where(eq(schoolsTable.id, schoolId));
  if (!school) { res.status(404).json({ error: "School not found" }); return; }

  const acronym = school.name.split(/\s+/).map((w: string) => w[0]?.toUpperCase() ?? "").join("").slice(0, 3).padEnd(2, "X");
  const yy = String(new Date().getFullYear()).slice(-2);

  const existingCount = await db.select({ id: studentsTable.id }).from(studentsTable).where(eq(studentsTable.schoolId, schoolId));
  const seq = String(existingCount.length + 1).padStart(4, "0");
  const studentNumber = `${acronym}${yy}${seq}`;

  const [student] = await db.insert(studentsTable).values({
    schoolId,
    name: name.trim(),
    studentNumber,
    classId: classId ? parseInt(classId) : null,
    gender: gender || null,
    dateOfBirth: dateOfBirth || null,
    parentName: parentName || null,
    parentPhone: parentPhone || null,
    category: "regular",
    status: "active",
  }).returning();

  // Record class history
  if (classId) {
    const { studentClassHistoryTable } = await import("@workspace/db");
    await db.insert(studentClassHistoryTable).values({
      studentId: student.id,
      classId: parseInt(classId),
      schoolId,
      changeType: "enrolled",
      changedAt: new Date(),
      academicYear: String(new Date().getFullYear()),
    }).catch(() => {});
  }

  res.status(201).json(student);
});

// ─────────────────────────────────────────────
// ANNOUNCEMENTS (teacher-facing)
// ─────────────────────────────────────────────

router.get("/teacher/announcements/unread-count", async (req, res): Promise<void> => {
  const teacherId = (req as any).session?.teacherId as number | undefined;
  const schoolId = (req as any).session?.teacherSchoolId as number | undefined;
  if (!teacherId || !schoolId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const reads = await db.select({ announcementId: announcementReadsTable.announcementId })
    .from(announcementReadsTable)
    .where(eq(announcementReadsTable.teacherId, teacherId));
  const readIds = reads.map(r => r.announcementId);

  const allRows = await db.select({ id: announcementsTable.id })
    .from(announcementsTable)
    .where(and(
      eq(announcementsTable.schoolId, schoolId),
      sql`${announcementsTable.target} IN ('staff', 'both')`
    ));

  const unread = allRows.filter(r => !readIds.includes(r.id)).length;
  res.json({ unread });
});

router.get("/teacher/announcements", async (req, res): Promise<void> => {
  const teacherId = (req as any).session?.teacherId as number | undefined;
  const schoolId = (req as any).session?.teacherSchoolId as number | undefined;
  if (!teacherId || !schoolId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const announcements = await db.select().from(announcementsTable)
    .where(and(
      eq(announcementsTable.schoolId, schoolId),
      sql`${announcementsTable.target} IN ('staff', 'both')`
    ))
    .orderBy(desc(announcementsTable.createdAt));

  const reads = await db.select({ announcementId: announcementReadsTable.announcementId })
    .from(announcementReadsTable)
    .where(eq(announcementReadsTable.teacherId, teacherId));
  const readIds = new Set(reads.map(r => r.announcementId));

  const result = announcements.map(a => ({ ...a, isRead: readIds.has(a.id) }));
  res.json(result);
});

router.post("/teacher/announcements/:id/read", async (req, res): Promise<void> => {
  const teacherId = (req as any).session?.teacherId as number | undefined;
  if (!teacherId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const announcementId = parseInt(req.params.id, 10);
  await db.insert(announcementReadsTable)
    .values({ announcementId, teacherId })
    .onConflictDoNothing();
  res.json({ ok: true });
});

// ─────────────────────────────────────────────
// GPS CHECK-IN / CHECK-OUT
// ─────────────────────────────────────────────

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const dPhi = (lat2 - lat1) * Math.PI / 180;
  const dLambda = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function todayDateStr(): string {
  return new Date().toLocaleString("sv-SE", { timeZone: "Africa/Accra" }).split(" ")[0];
}

router.get("/teacher/checkin/today", async (req, res): Promise<void> => {
  const teacherId = (req as any).session?.teacherId as number | undefined;
  if (!teacherId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const today = todayDateStr();
  const [record] = await db.select().from(teacherAttendanceTable)
    .where(and(eq(teacherAttendanceTable.teacherId, teacherId), eq(teacherAttendanceTable.date, today)));
  res.json(record ?? null);
});

router.post("/teacher/checkin", async (req, res): Promise<void> => {
  const teacherId = (req as any).session?.teacherId as number | undefined;
  const schoolId = (req as any).session?.teacherSchoolId as number | undefined;
  if (!teacherId || !schoolId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { latitude, longitude, deviceInfo } = req.body as { latitude?: number; longitude?: number; deviceInfo?: string };
  const today = todayDateStr();

  const [existing] = await db.select().from(teacherAttendanceTable)
    .where(and(eq(teacherAttendanceTable.teacherId, teacherId), eq(teacherAttendanceTable.date, today)));

  if (existing?.checkInTime) {
    res.status(400).json({ error: "Already checked in today", record: existing }); return;
  }

  // GPS validation — only if school has coordinates configured
  if (latitude !== undefined && longitude !== undefined) {
    const [settings] = await db.select().from(schoolSettingsTable).where(eq(schoolSettingsTable.schoolId, schoolId));
    if (settings?.checkinLatitude != null && settings?.checkinLongitude != null) {
      const dist = Math.round(haversineMeters(latitude, longitude, settings.checkinLatitude, settings.checkinLongitude));
      const radius = settings.checkinRadiusMeters ?? 50;
      if (dist > radius) {
        res.status(400).json({ error: `You are ${dist}m from school. Must be within ${radius}m to check in.`, distance: dist, required: radius });
        return;
      }
    }
  } else if (latitude === undefined) {
    // No GPS provided and school requires it — check if school has a location set
    const [settings] = await db.select().from(schoolSettingsTable).where(eq(schoolSettingsTable.schoolId, schoolId));
    if (settings?.checkinLatitude != null) {
      res.status(400).json({ error: "GPS location is required for check-in at this school. Please allow location access." });
      return;
    }
  }

  const now = new Date();
  const payload = {
    schoolId,
    teacherId,
    date: today,
    status: "present",
    checkInTime: now,
    deviceInfo: deviceInfo ? String(deviceInfo).slice(0, 500) : null,
    checkinLatitude: latitude ?? null,
    checkinLongitude: longitude ?? null,
    checkInMethod: latitude !== undefined ? "gps" : "manual",
  };

  let record;
  if (existing) {
    [record] = await db.update(teacherAttendanceTable)
      .set({ checkInTime: now, status: "present", deviceInfo: payload.deviceInfo, checkinLatitude: payload.checkinLatitude, checkinLongitude: payload.checkinLongitude, checkInMethod: payload.checkInMethod })
      .where(eq(teacherAttendanceTable.id, existing.id)).returning();
  } else {
    [record] = await db.insert(teacherAttendanceTable).values(payload).returning();
  }
  res.json(record);
});

router.post("/teacher/checkout", async (req, res): Promise<void> => {
  const teacherId = (req as any).session?.teacherId as number | undefined;
  if (!teacherId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const today = todayDateStr();
  const [existing] = await db.select().from(teacherAttendanceTable)
    .where(and(eq(teacherAttendanceTable.teacherId, teacherId), eq(teacherAttendanceTable.date, today)));
  if (!existing?.checkInTime) { res.status(400).json({ error: "No check-in found for today" }); return; }
  if (existing.checkOutTime) { res.status(400).json({ error: "Already checked out today", record: existing }); return; }
  const [record] = await db.update(teacherAttendanceTable)
    .set({ checkOutTime: new Date() })
    .where(eq(teacherAttendanceTable.id, existing.id)).returning();
  res.json(record);
});

// ─── Teacher Calendar ───────────────────────────────────────────────────────

router.get("/teacher/calendar", async (req, res): Promise<void> => {
  const teacherId = (req as any).session?.teacherId as number | undefined;
  const schoolId = (req as any).session?.teacherSchoolId as number | undefined;
  if (!teacherId || !schoolId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { month } = req.query;

  // Get teacher's homeroom class IDs
  const myClasses = await db.select({ id: classesTable.id })
    .from(classesTable)
    .where(and(eq(classesTable.schoolId, schoolId), eq(classesTable.teacherId, teacherId)));
  const myClassIds = myClasses.map(c => c.id);

  let rows;
  if (month) {
    const [yr, mo] = String(month).split("-");
    const startOfMonth = `${yr}-${mo.padStart(2, "0")}-01`;
    const nextMo = (parseInt(mo, 10) % 12) + 1;
    const nextYr = nextMo === 1 ? parseInt(yr, 10) + 1 : parseInt(yr, 10);
    const endOfMonth = `${nextYr}-${String(nextMo).padStart(2, "0")}-01`;
    rows = await db.select().from(calendarEventsTable)
      .where(and(
        eq(calendarEventsTable.schoolId, schoolId),
        lte(calendarEventsTable.startDate, endOfMonth),
        gte(calendarEventsTable.endDate, startOfMonth),
      ))
      .orderBy(calendarEventsTable.startDate);
  } else {
    // upcoming: next 60 days
    const today = todayDateStr();
    const future = new Date(); future.setDate(future.getDate() + 60);
    const futureStr = future.toISOString().split("T")[0];
    rows = await db.select().from(calendarEventsTable)
      .where(and(
        eq(calendarEventsTable.schoolId, schoolId),
        gte(calendarEventsTable.endDate, today),
        lte(calendarEventsTable.startDate, futureStr),
      ))
      .orderBy(calendarEventsTable.startDate);
  }

  // Filter by audience
  const filtered = rows.filter(ev => {
    if (ev.targetType === "all_staff") return true;
    const ids: number[] = JSON.parse(ev.targetIds || "[]");
    if (ev.targetType === "specific_classes") return ids.some(id => myClassIds.includes(id));
    if (ev.targetType === "specific_teachers") return ids.includes(teacherId);
    return true;
  });

  res.json(filtered);
});

export default router;
