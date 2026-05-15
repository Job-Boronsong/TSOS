import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import {
  db,
  staffSalaryProfilesTable,
  payrollRunsTable,
  payrollEntriesTable,
  teachersTable,
} from "@workspace/db";

const router: IRouter = Router();

function sid(req: any): number {
  return parseInt(req.params.schoolId, 10);
}

// ─── Ghana PAYE computation (monthly bands, GRA 2024) ────────────────────────
function computePayeMonthly(taxable: number): number {
  const bands = [
    { limit: 402, rate: 0 },
    { limit: 110, rate: 0.05 },
    { limit: 130, rate: 0.10 },
    { limit: 3167, rate: 0.175 },
    { limit: 16191, rate: 0.25 },
    { limit: Infinity, rate: 0.30 },
  ];
  let tax = 0;
  let remaining = Math.max(0, taxable);
  for (const { limit, rate } of bands) {
    if (remaining <= 0) break;
    const slice = Math.min(remaining, limit);
    tax += slice * rate;
    remaining -= slice;
  }
  return Math.round(tax * 100) / 100;
}

function calcEntry(p: {
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
}) {
  const gross = p.basicSalary + p.housingAllowance + p.transportAllowance + p.otherAllowances;
  const ssnitEmployee = Math.round(p.basicSalary * 0.055 * 100) / 100; // 5.5% employee
  const ssnitEmployer = Math.round(p.basicSalary * 0.13 * 100) / 100;  // 13% employer
  const taxableIncome = Math.max(0, gross - ssnitEmployee);
  const payeIncomeTax = computePayeMonthly(taxableIncome);
  const netSalary = Math.round((gross - ssnitEmployee - payeIncomeTax) * 100) / 100;
  return { gross, ssnitEmployee, ssnitEmployer, taxableIncome, payeIncomeTax, netSalary };
}

// ─── Salary Profiles ──────────────────────────────────────────────────────────

// GET /schools/:schoolId/salary-profiles
router.get("/schools/:schoolId/salary-profiles", async (req, res): Promise<void> => {
  const schoolId = sid(req);

  const profiles = await db.select({
    id: staffSalaryProfilesTable.id,
    teacherId: teachersTable.id,          // always the real teacher ID, even when no profile row
    basicSalary: staffSalaryProfilesTable.basicSalary,
    housingAllowance: staffSalaryProfilesTable.housingAllowance,
    transportAllowance: staffSalaryProfilesTable.transportAllowance,
    otherAllowances: staffSalaryProfilesTable.otherAllowances,
    staffCategory: staffSalaryProfilesTable.staffCategory,
    updatedAt: staffSalaryProfilesTable.updatedAt,
    teacherName: teachersTable.name,
    teacherSubject: teachersTable.subject,
    teacherStatus: teachersTable.status,
  })
    .from(teachersTable)
    .leftJoin(staffSalaryProfilesTable, eq(staffSalaryProfilesTable.teacherId, teachersTable.id))
    .where(and(eq(teachersTable.schoolId, schoolId)))
    .orderBy(teachersTable.name);

  res.json(profiles.map(p => ({
    ...p,
    basicSalary: Number(p.basicSalary ?? 0),
    housingAllowance: Number(p.housingAllowance ?? 0),
    transportAllowance: Number(p.transportAllowance ?? 0),
    otherAllowances: Number(p.otherAllowances ?? 0),
  })));
});

// POST /schools/:schoolId/salary-profiles — upsert
router.post("/schools/:schoolId/salary-profiles", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const { teacherId, basicSalary, housingAllowance, transportAllowance, otherAllowances, staffCategory } = req.body;

  if (!teacherId) { res.status(400).json({ error: "teacherId is required" }); return; }

  const existing = await db.select({ id: staffSalaryProfilesTable.id })
    .from(staffSalaryProfilesTable)
    .where(and(eq(staffSalaryProfilesTable.schoolId, schoolId), eq(staffSalaryProfilesTable.teacherId, parseInt(teacherId))));

  const values = {
    schoolId,
    teacherId: parseInt(teacherId),
    basicSalary: String(basicSalary ?? 0),
    housingAllowance: String(housingAllowance ?? 0),
    transportAllowance: String(transportAllowance ?? 0),
    otherAllowances: String(otherAllowances ?? 0),
    staffCategory: staffCategory ?? "teaching",
  };

  let profile;
  if (existing.length > 0) {
    [profile] = await db.update(staffSalaryProfilesTable).set(values)
      .where(and(eq(staffSalaryProfilesTable.schoolId, schoolId), eq(staffSalaryProfilesTable.teacherId, parseInt(teacherId))))
      .returning();
  } else {
    [profile] = await db.insert(staffSalaryProfilesTable).values(values).returning();
  }

  res.status(201).json(profile);
});

// ─── Payroll Runs ─────────────────────────────────────────────────────────────

// GET /schools/:schoolId/payroll-runs
router.get("/schools/:schoolId/payroll-runs", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const runs = await db.select().from(payrollRunsTable)
    .where(eq(payrollRunsTable.schoolId, schoolId))
    .orderBy(desc(payrollRunsTable.year), desc(payrollRunsTable.month));
  res.json(runs.map(r => ({
    ...r,
    totalGross: Number(r.totalGross),
    totalNet: Number(r.totalNet),
    totalSsnit: Number(r.totalSsnit),
    totalPaye: Number(r.totalPaye),
  })));
});

// POST /schools/:schoolId/payroll-runs — generate new run from profiles
router.post("/schools/:schoolId/payroll-runs", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const { month, year, notes } = req.body;

  if (!month || !year) { res.status(400).json({ error: "month and year are required" }); return; }

  const existing = await db.select({ id: payrollRunsTable.id }).from(payrollRunsTable)
    .where(and(eq(payrollRunsTable.schoolId, schoolId), eq(payrollRunsTable.month, parseInt(month)), eq(payrollRunsTable.year, parseInt(year))));

  if (existing.length > 0) {
    res.status(409).json({ error: "Payroll run already exists for this month/year", runId: existing[0].id });
    return;
  }

  const profiles = await db.select({
    teacherId: staffSalaryProfilesTable.teacherId,
    basicSalary: staffSalaryProfilesTable.basicSalary,
    housingAllowance: staffSalaryProfilesTable.housingAllowance,
    transportAllowance: staffSalaryProfilesTable.transportAllowance,
    otherAllowances: staffSalaryProfilesTable.otherAllowances,
  }).from(staffSalaryProfilesTable)
    .where(eq(staffSalaryProfilesTable.schoolId, schoolId));

  const [run] = await db.insert(payrollRunsTable).values({
    schoolId,
    month: parseInt(month),
    year: parseInt(year),
    notes: notes ?? null,
    status: "draft",
  }).returning();

  if (profiles.length === 0) {
    res.status(201).json({ run, entries: [] });
    return;
  }

  let totalGross = 0, totalNet = 0, totalSsnit = 0, totalPaye = 0;
  const entryValues = profiles.map(p => {
    const basic = Number(p.basicSalary ?? 0);
    const housing = Number(p.housingAllowance ?? 0);
    const transport = Number(p.transportAllowance ?? 0);
    const other = Number(p.otherAllowances ?? 0);
    const { gross, ssnitEmployee, ssnitEmployer, taxableIncome, payeIncomeTax, netSalary } = calcEntry({
      basicSalary: basic, housingAllowance: housing, transportAllowance: transport, otherAllowances: other,
    });
    totalGross += gross;
    totalNet += netSalary;
    totalSsnit += ssnitEmployee + ssnitEmployer;
    totalPaye += payeIncomeTax;
    return {
      schoolId,
      runId: run.id,
      teacherId: p.teacherId,
      basicSalary: String(basic),
      housingAllowance: String(housing),
      transportAllowance: String(transport),
      otherAllowances: String(other),
      grossSalary: String(gross),
      ssnitEmployee: String(ssnitEmployee),
      ssnitEmployer: String(ssnitEmployer),
      taxableIncome: String(taxableIncome),
      payeIncomeTax: String(payeIncomeTax),
      netSalary: String(netSalary),
    };
  });

  const entries = await db.insert(payrollEntriesTable).values(entryValues).returning();

  await db.update(payrollRunsTable).set({
    totalGross: String(Math.round(totalGross * 100) / 100),
    totalNet: String(Math.round(totalNet * 100) / 100),
    totalSsnit: String(Math.round(totalSsnit * 100) / 100),
    totalPaye: String(Math.round(totalPaye * 100) / 100),
  }).where(eq(payrollRunsTable.id, run.id));

  res.status(201).json({ run, entries });
});

// GET /schools/:schoolId/payroll-runs/:runId/entries
router.get("/schools/:schoolId/payroll-runs/:runId/entries", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const runId = parseInt(req.params.runId, 10);

  const entries = await db.select({
    id: payrollEntriesTable.id,
    teacherId: payrollEntriesTable.teacherId,
    basicSalary: payrollEntriesTable.basicSalary,
    housingAllowance: payrollEntriesTable.housingAllowance,
    transportAllowance: payrollEntriesTable.transportAllowance,
    otherAllowances: payrollEntriesTable.otherAllowances,
    grossSalary: payrollEntriesTable.grossSalary,
    ssnitEmployee: payrollEntriesTable.ssnitEmployee,
    ssnitEmployer: payrollEntriesTable.ssnitEmployer,
    taxableIncome: payrollEntriesTable.taxableIncome,
    payeIncomeTax: payrollEntriesTable.payeIncomeTax,
    otherDeductions: payrollEntriesTable.otherDeductions,
    netSalary: payrollEntriesTable.netSalary,
    overridden: payrollEntriesTable.overridden,
    notes: payrollEntriesTable.notes,
    teacherName: teachersTable.name,
    teacherSubject: teachersTable.subject,
  })
    .from(payrollEntriesTable)
    .leftJoin(teachersTable, eq(payrollEntriesTable.teacherId, teachersTable.id))
    .where(and(eq(payrollEntriesTable.runId, runId), eq(payrollEntriesTable.schoolId, schoolId)))
    .orderBy(teachersTable.name);

  res.json(entries.map(e => ({
    ...e,
    basicSalary: Number(e.basicSalary),
    housingAllowance: Number(e.housingAllowance),
    transportAllowance: Number(e.transportAllowance),
    otherAllowances: Number(e.otherAllowances),
    grossSalary: Number(e.grossSalary),
    ssnitEmployee: Number(e.ssnitEmployee),
    ssnitEmployer: Number(e.ssnitEmployer),
    taxableIncome: Number(e.taxableIncome),
    payeIncomeTax: Number(e.payeIncomeTax),
    otherDeductions: Number(e.otherDeductions),
    netSalary: Number(e.netSalary),
  })));
});

// PUT /schools/:schoolId/payroll-runs/:runId/entries/:entryId — admin override
router.put("/schools/:schoolId/payroll-runs/:runId/entries/:entryId", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const runId = parseInt(req.params.runId, 10);
  const entryId = parseInt(req.params.entryId, 10);

  const {
    basicSalary, housingAllowance, transportAllowance, otherAllowances,
    ssnitEmployee, ssnitEmployer, payeIncomeTax, otherDeductions, notes,
  } = req.body;

  const basic = basicSalary !== undefined ? Number(basicSalary) : undefined;
  const housing = housingAllowance !== undefined ? Number(housingAllowance) : undefined;
  const transport = transportAllowance !== undefined ? Number(transportAllowance) : undefined;
  const other = otherAllowances !== undefined ? Number(otherAllowances) : undefined;

  const [current] = await db.select().from(payrollEntriesTable)
    .where(and(eq(payrollEntriesTable.id, entryId), eq(payrollEntriesTable.runId, runId)));
  if (!current) { res.status(404).json({ error: "Entry not found" }); return; }

  const updatedBasic = basic ?? Number(current.basicSalary);
  const updatedHousing = housing ?? Number(current.housingAllowance);
  const updatedTransport = transport ?? Number(current.transportAllowance);
  const updatedOther = other ?? Number(current.otherAllowances);
  const gross = updatedBasic + updatedHousing + updatedTransport + updatedOther;

  const updatedSsnitEmp = ssnitEmployee !== undefined ? Number(ssnitEmployee) : Math.round(updatedBasic * 0.055 * 100) / 100;
  const updatedSsnitEmpl = ssnitEmployer !== undefined ? Number(ssnitEmployer) : Math.round(updatedBasic * 0.13 * 100) / 100;
  const taxable = Math.max(0, gross - updatedSsnitEmp);
  const updatedPaye = payeIncomeTax !== undefined ? Number(payeIncomeTax) : computePayeMonthly(taxable);
  const updatedOtherDed = otherDeductions !== undefined ? Number(otherDeductions) : Number(current.otherDeductions);
  const net = Math.round((gross - updatedSsnitEmp - updatedPaye - updatedOtherDed) * 100) / 100;

  const [updated] = await db.update(payrollEntriesTable).set({
    basicSalary: String(updatedBasic),
    housingAllowance: String(updatedHousing),
    transportAllowance: String(updatedTransport),
    otherAllowances: String(updatedOther),
    grossSalary: String(gross),
    ssnitEmployee: String(updatedSsnitEmp),
    ssnitEmployer: String(updatedSsnitEmpl),
    taxableIncome: String(taxable),
    payeIncomeTax: String(updatedPaye),
    otherDeductions: String(updatedOtherDed),
    netSalary: String(net),
    overridden: true,
    notes: notes ?? current.notes,
    updatedAt: new Date(),
  }).where(eq(payrollEntriesTable.id, entryId)).returning();

  // Recalculate run totals
  const allEntries = await db.select().from(payrollEntriesTable)
    .where(and(eq(payrollEntriesTable.runId, runId), eq(payrollEntriesTable.schoolId, schoolId)));

  const totals = allEntries.reduce((acc, e) => ({
    gross: acc.gross + Number(e.grossSalary),
    net: acc.net + Number(e.netSalary),
    ssnit: acc.ssnit + Number(e.ssnitEmployee) + Number(e.ssnitEmployer),
    paye: acc.paye + Number(e.payeIncomeTax),
  }), { gross: 0, net: 0, ssnit: 0, paye: 0 });

  await db.update(payrollRunsTable).set({
    totalGross: String(Math.round(totals.gross * 100) / 100),
    totalNet: String(Math.round(totals.net * 100) / 100),
    totalSsnit: String(Math.round(totals.ssnit * 100) / 100),
    totalPaye: String(Math.round(totals.paye * 100) / 100),
    updatedAt: new Date(),
  }).where(eq(payrollRunsTable.id, runId));

  res.json(updated);
});

// POST /schools/:schoolId/payroll-runs/:runId/confirm
router.post("/schools/:schoolId/payroll-runs/:runId/confirm", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const runId = parseInt(req.params.runId, 10);

  const [run] = await db.update(payrollRunsTable).set({
    status: "confirmed",
    confirmedAt: new Date(),
    updatedAt: new Date(),
  }).where(and(eq(payrollRunsTable.id, runId), eq(payrollRunsTable.schoolId, schoolId)))
    .returning();

  if (!run) { res.status(404).json({ error: "Run not found" }); return; }
  res.json(run);
});

// DELETE /schools/:schoolId/payroll-runs/:runId
router.delete("/schools/:schoolId/payroll-runs/:runId", async (req, res): Promise<void> => {
  const schoolId = sid(req);
  const runId = parseInt(req.params.runId, 10);

  await db.delete(payrollEntriesTable).where(eq(payrollEntriesTable.runId, runId));
  await db.delete(payrollRunsTable).where(and(eq(payrollRunsTable.id, runId), eq(payrollRunsTable.schoolId, schoolId)));
  res.json({ deleted: true });
});

export default router;
