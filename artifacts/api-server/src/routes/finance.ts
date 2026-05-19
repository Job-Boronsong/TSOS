import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, attendanceTable, paymentsTable, salesTable, expendituresTable, feeSettingsTable, studentsTable, classesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/schools/:schoolId/attendance", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const date = req.query.date ? String(req.query.date) : null;
  const classIdParam = req.query.classId ? parseInt(String(req.query.classId), 10) : null;

  let query = db.select({
    attendance: attendanceTable,
    studentName: studentsTable.name,
    classId: studentsTable.classId,
  }).from(attendanceTable)
    .leftJoin(studentsTable, eq(attendanceTable.studentId, studentsTable.id))
    .where(
      and(
        eq(attendanceTable.schoolId, schoolId),
        date ? eq(attendanceTable.date, date) : undefined,
        classIdParam ? eq(studentsTable.classId, classIdParam) : undefined,
      )
    );

  const rows = await query;
  res.json(rows.map(({ attendance, studentName }) => ({
    ...attendance,
    studentName: studentName ?? "",
  })));
});

router.post("/schools/:schoolId/attendance", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { date, records } = req.body;
  if (!date || !records?.length) { res.status(400).json({ error: "Date and records required" }); return; }

  const results = [];
  for (const record of records) {
    const existing = await db.select().from(attendanceTable)
      .where(and(eq(attendanceTable.studentId, record.studentId), eq(attendanceTable.date, date), eq(attendanceTable.schoolId, schoolId)));

    let row;
    if (existing.length > 0) {
      [row] = await db.update(attendanceTable).set({ status: record.status, notes: record.notes })
        .where(and(eq(attendanceTable.studentId, record.studentId), eq(attendanceTable.date, date)))
        .returning();
    } else {
      [row] = await db.insert(attendanceTable).values({
        schoolId, studentId: record.studentId, date, status: record.status,
        notes: record.notes, markedViaPayment: false, overridden: false,
      }).returning();
    }

    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, record.studentId));
    results.push({ ...row, studentName: student?.name ?? "" });
  }

  res.json(results);
});

router.post("/schools/:schoolId/attendance/override", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { studentId, date, status, notes } = req.body;

  const existing = await db.select().from(attendanceTable)
    .where(and(eq(attendanceTable.studentId, studentId), eq(attendanceTable.date, date)));

  let row;
  if (existing.length > 0) {
    [row] = await db.update(attendanceTable).set({ status, notes, overridden: true })
      .where(and(eq(attendanceTable.studentId, studentId), eq(attendanceTable.date, date)))
      .returning();
  } else {
    [row] = await db.insert(attendanceTable).values({
      schoolId, studentId, date, status, notes, markedViaPayment: false, overridden: true,
    }).returning();
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
  res.json({ ...row, studentName: student?.name ?? "" });
});

router.get("/schools/:schoolId/fee-settings", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const [settings] = await db.select().from(feeSettingsTable).where(eq(feeSettingsTable.schoolId, schoolId));
  if (!settings) { res.status(404).json({ error: "Fee settings not found" }); return; }
  res.json({
    ...settings,
    schoolFee: Number(settings.schoolFee),
    busFee: Number(settings.busFee),
    scholarshipDiscount: Number(settings.scholarshipDiscount),
    staffChildDiscount: Number(settings.staffChildDiscount),
    termBillingEnabled: settings.termBillingEnabled === "true",
    feedingFeePerDay: Number((settings as any).feedingFeePerDay ?? 0),
    feedingEnabled: (settings as any).feedingEnabled === "true",
    busFeePerDay: Number((settings as any).busFeePerDay ?? 0),
    term1SchoolFee: settings.term1SchoolFee != null ? Number(settings.term1SchoolFee) : null,
    term2SchoolFee: settings.term2SchoolFee != null ? Number(settings.term2SchoolFee) : null,
    term3SchoolFee: settings.term3SchoolFee != null ? Number(settings.term3SchoolFee) : null,
  });
});

router.put("/schools/:schoolId/fee-settings", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { schoolFee, busFee, scholarshipDiscount, staffChildDiscount, termBillingEnabled, feedingFeePerDay, feedingEnabled, scholarshipWaivedFees, staffChildWaivedFees, busFeePerDay, term1SchoolFee, term2SchoolFee, term3SchoolFee } = req.body;

  const existing = await db.select().from(feeSettingsTable).where(eq(feeSettingsTable.schoolId, schoolId));
  let settings: any;
  if (existing.length > 0) {
    [settings] = await db.update(feeSettingsTable).set({
      schoolFee: schoolFee != null ? String(schoolFee) : undefined,
      busFee: busFee != null ? String(busFee) : undefined,
      scholarshipDiscount: scholarshipDiscount != null ? String(scholarshipDiscount) : undefined,
      staffChildDiscount: staffChildDiscount != null ? String(staffChildDiscount) : undefined,
      termBillingEnabled: termBillingEnabled != null ? String(termBillingEnabled) : undefined,
      ...(feedingFeePerDay != null ? { feedingFeePerDay: String(feedingFeePerDay) } : {}),
      ...(feedingEnabled != null ? { feedingEnabled: String(feedingEnabled) } : {}),
      ...(scholarshipWaivedFees != null ? { scholarshipWaivedFees: String(scholarshipWaivedFees) } : {}),
      ...(staffChildWaivedFees != null ? { staffChildWaivedFees: String(staffChildWaivedFees) } : {}),
      ...(busFeePerDay != null ? { busFeePerDay: String(busFeePerDay) } : {}),
      ...(term1SchoolFee !== undefined ? { term1SchoolFee: term1SchoolFee != null ? String(term1SchoolFee) : null } : {}),
      ...(term2SchoolFee !== undefined ? { term2SchoolFee: term2SchoolFee != null ? String(term2SchoolFee) : null } : {}),
      ...(term3SchoolFee !== undefined ? { term3SchoolFee: term3SchoolFee != null ? String(term3SchoolFee) : null } : {}),
    } as any).where(eq(feeSettingsTable.schoolId, schoolId)).returning();
  } else {
    [settings] = await db.insert(feeSettingsTable).values({
      schoolId,
      schoolFee: String(schoolFee ?? 0),
      busFee: String(busFee ?? 0),
      scholarshipDiscount: String(scholarshipDiscount ?? 0),
      staffChildDiscount: String(staffChildDiscount ?? 0),
      termBillingEnabled: String(termBillingEnabled ?? false),
      feedingFeePerDay: String(feedingFeePerDay ?? 0),
      feedingEnabled: String(feedingEnabled ?? false),
      scholarshipWaivedFees: String(scholarshipWaivedFees ?? ""),
      staffChildWaivedFees: String(staffChildWaivedFees ?? ""),
      busFeePerDay: String(busFeePerDay ?? 0),
    } as any).returning();
  }

  res.json({
    ...settings,
    schoolFee: Number(settings.schoolFee),
    busFee: Number(settings.busFee),
    scholarshipDiscount: Number(settings.scholarshipDiscount),
    staffChildDiscount: Number(settings.staffChildDiscount),
    termBillingEnabled: settings.termBillingEnabled === "true",
    feedingFeePerDay: Number(settings.feedingFeePerDay ?? 0),
    feedingEnabled: settings.feedingEnabled === "true",
    busFeePerDay: Number(settings.busFeePerDay ?? 0),
    scholarshipWaivedFees: settings.scholarshipWaivedFees ?? "",
    staffChildWaivedFees: settings.staffChildWaivedFees ?? "",
    term1SchoolFee: settings.term1SchoolFee != null ? Number(settings.term1SchoolFee) : null,
    term2SchoolFee: settings.term2SchoolFee != null ? Number(settings.term2SchoolFee) : null,
    term3SchoolFee: settings.term3SchoolFee != null ? Number(settings.term3SchoolFee) : null,
  });
});

router.get("/schools/:schoolId/payments", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const date = req.query.date ? String(req.query.date) : null;
  const studentIdParam = req.query.studentId ? parseInt(String(req.query.studentId), 10) : null;

  const rows = await db.select({
    payment: paymentsTable,
    studentName: studentsTable.name,
  }).from(paymentsTable)
    .leftJoin(studentsTable, eq(paymentsTable.studentId, studentsTable.id))
    .where(
      and(
        eq(paymentsTable.schoolId, schoolId),
        date ? eq(paymentsTable.paymentDate, date) : undefined,
        studentIdParam ? eq(paymentsTable.studentId, studentIdParam) : undefined,
      )
    )
    .orderBy(sql`${paymentsTable.createdAt} DESC`);

  res.json(rows.map(({ payment, studentName }) => ({
    ...payment, amount: Number(payment.amount), studentName: studentName ?? "",
  })));
});

router.post("/schools/:schoolId/payments", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { studentId, amount, paymentDate, paymentType, markAttendance, notes } = req.body;
  if (!studentId || !amount || !paymentDate) { res.status(400).json({ error: "studentId, amount, paymentDate required" }); return; }

  const [payment] = await db.insert(paymentsTable).values({
    schoolId, studentId, amount: String(amount), paymentDate, paymentType: paymentType ?? "school_fee", notes,
  }).returning();

  if (markAttendance) {
    const existing = await db.select().from(attendanceTable)
      .where(and(eq(attendanceTable.studentId, studentId), eq(attendanceTable.date, paymentDate)));
    if (existing.length === 0) {
      await db.insert(attendanceTable).values({
        schoolId, studentId, date: paymentDate, status: "present", markedViaPayment: true, overridden: false,
      });
    }
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
  res.status(201).json({ ...payment, amount: Number(payment.amount), studentName: student?.name ?? "" });
});

router.get("/schools/:schoolId/sales", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const date = req.query.date ? String(req.query.date) : null;

  const rows = await db.select().from(salesTable)
    .where(and(eq(salesTable.schoolId, schoolId), date ? eq(salesTable.saleDate, date) : undefined))
    .orderBy(sql`${salesTable.createdAt} DESC`);

  res.json(rows.map(r => ({ ...r, amount: Number(r.amount) })));
});

router.post("/schools/:schoolId/sales", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { description, amount, saleDate, category } = req.body;
  if (!description || !amount || !saleDate) { res.status(400).json({ error: "description, amount, saleDate required" }); return; }

  const [sale] = await db.insert(salesTable).values({ schoolId, description, amount: String(amount), saleDate, category }).returning();
  res.status(201).json({ ...sale, amount: Number(sale.amount) });
});

router.get("/schools/:schoolId/expenditures", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const date = req.query.date ? String(req.query.date) : null;

  const rows = await db.select().from(expendituresTable)
    .where(and(eq(expendituresTable.schoolId, schoolId), date ? eq(expendituresTable.expenditureDate, date) : undefined))
    .orderBy(sql`${expendituresTable.createdAt} DESC`);

  res.json(rows.map(r => ({ ...r, amount: Number(r.amount) })));
});

router.post("/schools/:schoolId/expenditures", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { description, amount, expenditureDate, category } = req.body;
  if (!description || !amount || !expenditureDate) { res.status(400).json({ error: "description, amount, expenditureDate required" }); return; }

  const [exp] = await db.insert(expendituresTable).values({ schoolId, description, amount: String(amount), expenditureDate, category }).returning();
  res.status(201).json({ ...exp, amount: Number(exp.amount) });
});

router.get("/schools/:schoolId/finance/summary", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const date = req.query.date ? String(req.query.date) : new Date().toISOString().split("T")[0];

  const [feeSettings] = await db.select().from(feeSettingsTable).where(eq(feeSettingsTable.schoolId, schoolId));
  const allStudents = await db.select().from(studentsTable).where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.status, "active")));

  let totalExpected = 0;
  const allPayments = await db.select().from(paymentsTable).where(eq(paymentsTable.schoolId, schoolId));
  const paymentsByStudent = new Map<number, number>();
  for (const p of allPayments) {
    const cur = paymentsByStudent.get(p.studentId) ?? 0;
    paymentsByStudent.set(p.studentId, cur + Number(p.amount));
  }

  for (const student of allStudents) {
    const schoolFee = Number(feeSettings?.schoolFee ?? 0);
    const busFee = Number(feeSettings?.busFee ?? 0);
    const scholarshipDiscount = Number(feeSettings?.scholarshipDiscount ?? 0);
    const staffChildDiscount = Number(feeSettings?.staffChildDiscount ?? 0);

    let expected = schoolFee;
    if (student.category === "bus") expected = schoolFee + busFee;
    else if (student.category === "scholarship") expected = schoolFee * (1 - scholarshipDiscount / 100);
    else if (student.category === "staff_child") expected = schoolFee * (1 - staffChildDiscount / 100);
    totalExpected += expected;
  }

  const dailyPayments = await db.select().from(paymentsTable)
    .where(and(eq(paymentsTable.schoolId, schoolId), eq(paymentsTable.paymentDate, date)));
  const dailySales = await db.select().from(salesTable)
    .where(and(eq(salesTable.schoolId, schoolId), eq(salesTable.saleDate, date)));
  const dailyExpenditures = await db.select().from(expendituresTable)
    .where(and(eq(expendituresTable.schoolId, schoolId), eq(expendituresTable.expenditureDate, date)));

  const feedingPaymentsToday = dailyPayments.filter(p => p.paymentType === "feeding_fee");
  const regularFeesToday = dailyPayments.filter(p => p.paymentType !== "feeding_fee");
  const feesCollected = regularFeesToday.reduce((s, p) => s + Number(p.amount), 0);
  const feedingCollectedToday = feedingPaymentsToday.reduce((s, p) => s + Number(p.amount), 0);
  const salesTotal = dailySales.reduce((s, p) => s + Number(p.amount), 0);
  const expenditureTotal = dailyExpenditures.reduce((s, p) => s + Number(p.amount), 0);

  // All-time feeding totals
  const allFeedingPayments = allPayments.filter(p => p.paymentType === "feeding_fee");
  const feedingCollectedTotal = allFeedingPayments.reduce((s, p) => s + Number(p.amount), 0);

  let totalArrears = 0;
  let studentsWithArrears = 0;
  const totalPaid = Array.from(paymentsByStudent.values()).reduce((a, b) => a + b, 0);
  for (const student of allStudents) {
    const paid = paymentsByStudent.get(student.id) ?? 0;
    const schoolFee = Number(feeSettings?.schoolFee ?? 0);
    const busFee = Number(feeSettings?.busFee ?? 0);
    const scholarshipDiscount = Number(feeSettings?.scholarshipDiscount ?? 0);
    const staffChildDiscount = Number(feeSettings?.staffChildDiscount ?? 0);
    let expected = schoolFee;
    if (student.category === "bus") expected = schoolFee + busFee;
    else if (student.category === "scholarship") expected = schoolFee * (1 - scholarshipDiscount / 100);
    else if (student.category === "staff_child") expected = schoolFee * (1 - staffChildDiscount / 100);
    const arrears = Math.max(0, expected - paid);
    if (arrears > 0) { totalArrears += arrears; studentsWithArrears++; }
  }

  res.json({
    date,
    feesCollected,
    feesExpected: totalExpected,
    salesTotal,
    expenditureTotal,
    netCash: feesCollected + salesTotal - expenditureTotal,
    totalArrears,
    studentsWithArrears,
    collectionRate: totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0,
    feedingCollectedToday,
    feedingStudentsToday: feedingPaymentsToday.length,
    feedingCollectedTotal,
    feedingFeePerDay: Number((feeSettings as any)?.feedingFeePerDay ?? 0),
    feedingEnabled: (feeSettings as any)?.feedingEnabled === "true",
  });
});

// ─── Feeding Register ─────────────────────────────────────────────────────────
router.get("/schools/:schoolId/feeding/register", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const date = req.query.date ? String(req.query.date) : new Date().toISOString().split("T")[0];
  const month = req.query.month ? String(req.query.month) : null; // YYYY-MM for monthly view

  let whereClause;
  if (month) {
    whereClause = and(
      eq(paymentsTable.schoolId, schoolId),
      eq(paymentsTable.paymentType, "feeding_fee"),
      sql`DATE_TRUNC('month', ${paymentsTable.paymentDate}::date) = DATE_TRUNC('month', ${month}::date)`
    );
  } else {
    whereClause = and(
      eq(paymentsTable.schoolId, schoolId),
      eq(paymentsTable.paymentType, "feeding_fee"),
      eq(paymentsTable.paymentDate, date)
    );
  }

  const rows = await db.select({
    payment: paymentsTable,
    studentName: studentsTable.name,
    studentNumber: studentsTable.studentNumber,
    className: classesTable.name,
  }).from(paymentsTable)
    .leftJoin(studentsTable, eq(paymentsTable.studentId, studentsTable.id))
    .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
    .where(whereClause)
    .orderBy(sql`${paymentsTable.paymentDate} DESC, ${paymentsTable.createdAt} DESC`);

  res.json(rows.map(({ payment, studentName, studentNumber, className }) => ({
    ...payment,
    amount: Number(payment.amount),
    studentName: studentName ?? "",
    studentNumber: studentNumber ?? "",
    className: className ?? "",
  })));
});

router.get("/schools/:schoolId/arrears", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);

  const [feeSettings] = await db.select().from(feeSettingsTable).where(eq(feeSettingsTable.schoolId, schoolId));
  const students = await db.select({
    student: studentsTable,
    className: classesTable.name,
  }).from(studentsTable)
    .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
    .where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.status, "active")));

  const allPayments = await db.select().from(paymentsTable).where(eq(paymentsTable.schoolId, schoolId));
  const paymentsByStudent = new Map<number, { total: number; lastDate: string | null }>();
  for (const p of allPayments) {
    const cur = paymentsByStudent.get(p.studentId);
    if (!cur || (cur.lastDate && p.paymentDate > cur.lastDate)) {
      paymentsByStudent.set(p.studentId, { total: (cur?.total ?? 0) + Number(p.amount), lastDate: p.paymentDate });
    } else {
      paymentsByStudent.set(p.studentId, { total: (cur?.total ?? 0) + Number(p.amount), lastDate: cur?.lastDate ?? null });
    }
  }

  const result = [];
  for (const { student, className } of students) {
    const schoolFee = Number(feeSettings?.schoolFee ?? 0);
    const busFee = Number(feeSettings?.busFee ?? 0);
    const scholarshipDiscount = Number(feeSettings?.scholarshipDiscount ?? 0);
    const staffChildDiscount = Number(feeSettings?.staffChildDiscount ?? 0);
    let expected = schoolFee;
    if (student.category === "bus") expected = schoolFee + busFee;
    else if (student.category === "scholarship") expected = schoolFee * (1 - scholarshipDiscount / 100);
    else if (student.category === "staff_child") expected = schoolFee * (1 - staffChildDiscount / 100);

    const paid = paymentsByStudent.get(student.id)?.total ?? 0;
    const arrears = Math.max(0, expected - paid);
    if (arrears > 0) {
      result.push({
        studentId: student.id,
        studentName: student.name,
        studentNumber: student.studentNumber,
        className: className ?? null,
        expectedFee: expected,
        paidFee: paid,
        arrears,
        lastPaymentDate: paymentsByStudent.get(student.id)?.lastDate ?? null,
      });
    }
  }

  result.sort((a, b) => b.arrears - a.arrears);
  res.json(result);
});

export default router;
