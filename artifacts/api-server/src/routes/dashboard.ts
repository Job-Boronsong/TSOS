import { Router, type IRouter } from "express";
import { eq, and, count, sql } from "drizzle-orm";
import { db, studentsTable, attendanceTable, paymentsTable, salesTable, expendituresTable, feeSettingsTable, classesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/schools/:schoolId/dashboard", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const today = req.query.date ? String(req.query.date) : new Date().toISOString().split("T")[0];

  const [studentCount] = await db.select({ count: count() }).from(studentsTable)
    .where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.status, "active")));

  const [presentCount] = await db.select({ count: count() }).from(attendanceTable)
    .where(and(eq(attendanceTable.schoolId, schoolId), eq(attendanceTable.date, today), eq(attendanceTable.status, "present")));

  const [markedCount] = await db.select({ count: count() }).from(attendanceTable)
    .where(and(eq(attendanceTable.schoolId, schoolId), eq(attendanceTable.date, today)));

  const todayPayments = await db.select({
    payment: paymentsTable,
    studentName: studentsTable.name,
  }).from(paymentsTable)
    .leftJoin(studentsTable, eq(paymentsTable.studentId, studentsTable.id))
    .where(and(eq(paymentsTable.schoolId, schoolId), eq(paymentsTable.paymentDate, today)))
    .orderBy(sql`${paymentsTable.createdAt} DESC`)
    .limit(10);

  const todaySales = await db.select().from(salesTable)
    .where(and(eq(salesTable.schoolId, schoolId), eq(salesTable.saleDate, today)));

  const todayExpenditures = await db.select().from(expendituresTable)
    .where(and(eq(expendituresTable.schoolId, schoolId), eq(expendituresTable.expenditureDate, today)));

  const feesCollectedToday = todayPayments.reduce((s, { payment }) => s + Number(payment.amount), 0);
  const salesToday = todaySales.reduce((s, p) => s + Number(p.amount), 0);
  const expenditureToday = todayExpenditures.reduce((s, p) => s + Number(p.amount), 0);

  const totalStudents = Number(studentCount?.count ?? 0);
  const attendanceToday = Number(presentCount?.count ?? 0);
  const attendanceRate = Number(markedCount?.count ?? 0) > 0
    ? Math.round((attendanceToday / Number(markedCount?.count ?? 1)) * 100)
    : 0;

  const [feeSettings] = await db.select().from(feeSettingsTable).where(eq(feeSettingsTable.schoolId, schoolId));
  const allStudents = await db.select().from(studentsTable).where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.status, "active")));
  const allPayments = await db.select().from(paymentsTable).where(eq(paymentsTable.schoolId, schoolId));

  const paymentsByStudent = new Map<number, number>();
  for (const p of allPayments) {
    paymentsByStudent.set(p.studentId, (paymentsByStudent.get(p.studentId) ?? 0) + Number(p.amount));
  }

  const topArrears = [];
  for (const student of allStudents) {
    const schoolFee = Number(feeSettings?.schoolFee ?? 0);
    const busFee = Number(feeSettings?.busFee ?? 0);
    const scholarshipDiscount = Number(feeSettings?.scholarshipDiscount ?? 0);
    const staffChildDiscount = Number(feeSettings?.staffChildDiscount ?? 0);
    let expected = schoolFee;
    if (student.category === "bus") expected = schoolFee + busFee;
    else if (student.category === "scholarship") expected = schoolFee * (1 - scholarshipDiscount / 100);
    else if (student.category === "staff_child") expected = schoolFee * (1 - staffChildDiscount / 100);

    const paid = paymentsByStudent.get(student.id) ?? 0;
    const arrears = Math.max(0, expected - paid);
    if (arrears > 0) {
      topArrears.push({
        studentId: student.id, studentName: student.name, studentNumber: student.studentNumber,
        className: null, expectedFee: expected, paidFee: paid, arrears, lastPaymentDate: null,
      });
    }
  }
  topArrears.sort((a, b) => b.arrears - a.arrears);

  res.json({
    schoolId,
    date: today,
    studentCount: totalStudents,
    attendanceToday,
    attendanceRate,
    feesCollectedToday,
    salesToday,
    expenditureToday,
    netCashToday: feesCollectedToday + salesToday - expenditureToday,
    recentPayments: todayPayments.map(({ payment, studentName }) => ({
      ...payment, amount: Number(payment.amount), studentName: studentName ?? "",
    })),
    topArrears: topArrears.slice(0, 5),
  });
});

router.get("/schools/:schoolId/reports/daily", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const date = req.query.date ? String(req.query.date) : new Date().toISOString().split("T")[0];

  const [totalStudents] = await db.select({ count: count() }).from(studentsTable)
    .where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.status, "active")));

  const [presentCount] = await db.select({ count: count() }).from(attendanceTable)
    .where(and(eq(attendanceTable.schoolId, schoolId), eq(attendanceTable.date, date), eq(attendanceTable.status, "present")));
  const [absentCount] = await db.select({ count: count() }).from(attendanceTable)
    .where(and(eq(attendanceTable.schoolId, schoolId), eq(attendanceTable.date, date), eq(attendanceTable.status, "absent")));
  const [lateCount] = await db.select({ count: count() }).from(attendanceTable)
    .where(and(eq(attendanceTable.schoolId, schoolId), eq(attendanceTable.date, date), eq(attendanceTable.status, "late")));

  const payments = await db.select({
    payment: paymentsTable,
    studentName: studentsTable.name,
  }).from(paymentsTable)
    .leftJoin(studentsTable, eq(paymentsTable.studentId, studentsTable.id))
    .where(and(eq(paymentsTable.schoolId, schoolId), eq(paymentsTable.paymentDate, date)));

  const sales = await db.select().from(salesTable)
    .where(and(eq(salesTable.schoolId, schoolId), eq(salesTable.saleDate, date)));
  const expenditures = await db.select().from(expendituresTable)
    .where(and(eq(expendituresTable.schoolId, schoolId), eq(expendituresTable.expenditureDate, date)));

  const feesCollected = payments.reduce((s, { payment }) => s + Number(payment.amount), 0);
  const salesTotal = sales.reduce((s, p) => s + Number(p.amount), 0);
  const expenditureTotal = expenditures.reduce((s, p) => s + Number(p.amount), 0);

  const total = Number(totalStudents?.count ?? 0);
  const present = Number(presentCount?.count ?? 0);

  res.json({
    date,
    schoolId,
    totalStudents: total,
    presentCount: present,
    absentCount: Number(absentCount?.count ?? 0),
    lateCount: Number(lateCount?.count ?? 0),
    attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
    feesCollected,
    salesTotal,
    expenditureTotal,
    netCash: feesCollected + salesTotal - expenditureTotal,
    paymentDetails: payments.map(({ payment, studentName }) => ({
      ...payment, amount: Number(payment.amount), studentName: studentName ?? "",
    })),
  });
});

export default router;
