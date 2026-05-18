import { Router, type IRouter } from "express";
import { eq, count, sql, lt, inArray } from "drizzle-orm";
import { db, schoolsTable, subscriptionsTable, studentsTable, usersTable, feeSettingsTable, featureTogglesTable, schoolSettingsTable, platformSettingsTable, academicTermsTable, classesTable, teachersTable, attendanceTable, paymentsTable, salesTable, expendituresTable, scoresTable, studentClassHistoryTable, classSubjectsTable, auditLogsTable, timetableSlotsTable, academicCalendarTable, teacherAttendanceTable, studentFeeledgerTable, paymentTransactionsTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { sendSubscriptionThankYou } from "../lib/mailer";

const router: IRouter = Router();
const GRACE_DAYS = 3;

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  let slug = base;
  let i = 2;
  while (true) {
    const rows = await db.select({ id: schoolsTable.id }).from(schoolsTable).where(eq(schoolsTable.slug, slug));
    const conflict = rows.find(r => r.id !== excludeId);
    if (!conflict) return slug;
    slug = `${base}-${i++}`;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function computeSubStatus(expiryDate: string): "active" | "grace" | "expired" {
  const today = todayStr();
  if (today <= expiryDate) return "active";
  const graceEnd = addDays(expiryDate, GRACE_DAYS);
  if (today <= graceEnd) return "grace";
  return "expired";
}

function discountFor(months: number): number {
  if (months >= 12) return 5;
  return 0;
}

function computeAmount(monthlyPrice: number, months: number, customDiscount?: number | null): { discount: number; amount: number } {
  const discount = customDiscount != null ? customDiscount : discountFor(months);
  const amount = monthlyPrice * months * (1 - discount / 100);
  return { discount, amount: Math.round(amount * 100) / 100 };
}

async function getSchoolCustomDiscount(schoolId: number): Promise<number | null> {
  const [school] = await db.select({ customDiscountPct: schoolsTable.customDiscountPct }).from(schoolsTable).where(eq(schoolsTable.id, schoolId));
  if (!school || school.customDiscountPct == null) return null;
  return Number(school.customDiscountPct);
}

/** Auto-deactivate any schools whose grace period has ended */
async function runAutoDeactivation() {
  const today = todayStr();
  const allSubs = await db.select({ id: subscriptionsTable.id, schoolId: subscriptionsTable.schoolId, expiryDate: subscriptionsTable.expiryDate })
    .from(subscriptionsTable);

  for (const sub of allSubs) {
    const status = computeSubStatus(sub.expiryDate);
    if (status === "expired") {
      // Check if school is still active — deactivate it
      const [school] = await db.select({ id: schoolsTable.id, status: schoolsTable.status })
        .from(schoolsTable).where(eq(schoolsTable.id, sub.schoolId));
      if (school && school.status === "active") {
        await db.update(schoolsTable).set({ status: "inactive" }).where(eq(schoolsTable.id, sub.schoolId));
        await db.update(subscriptionsTable).set({ status: "expired" }).where(eq(subscriptionsTable.schoolId, sub.schoolId));
      }
    }
  }
}

async function enrichSchool(school: any) {
  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.schoolId, school.id));
  const [sc] = await db.select({ count: count() }).from(studentsTable).where(eq(studentsTable.schoolId, school.id));
  const enrichedSub = sub ? { ...sub, amount: Number(sub.amount), monthlyPrice: Number(sub.monthlyPrice), discountPct: Number(sub.discountPct), subscriptionStatus: computeSubStatus(sub.expiryDate) } : null;
  return {
    ...school,
    customDiscountPct: school.customDiscountPct != null ? Number(school.customDiscountPct) : null,
    subscription: enrichedSub,
    studentCount: Number(sc?.count ?? 0),
  };
}

async function enrichSchools(schools: any[]) {
  if (!schools.length) return [];
  const ids = schools.map((s: any) => s.id);
  const [subs, counts] = await Promise.all([
    db.select().from(subscriptionsTable).where(inArray(subscriptionsTable.schoolId, ids)),
    db.select({ schoolId: studentsTable.schoolId, cnt: count() })
      .from(studentsTable).where(inArray(studentsTable.schoolId, ids))
      .groupBy(studentsTable.schoolId),
  ]);
  const subMap: Record<number, any> = {};
  for (const sub of subs) subMap[sub.schoolId] = sub;
  const cntMap: Record<number, number> = {};
  for (const c of counts) cntMap[c.schoolId] = Number(c.cnt);
  return schools.map((school: any) => {
    const sub = subMap[school.id];
    const enrichedSub = sub ? { ...sub, amount: Number(sub.amount), monthlyPrice: Number(sub.monthlyPrice), discountPct: Number(sub.discountPct), subscriptionStatus: computeSubStatus(sub.expiryDate) } : null;
    return { ...school, customDiscountPct: school.customDiscountPct != null ? Number(school.customDiscountPct) : null, subscription: enrichedSub, studentCount: cntMap[school.id] ?? 0 };
  });
}

async function getPlatformPrice(): Promise<number> {
  const [ps] = await db.select().from(platformSettingsTable);
  return ps ? Number(ps.monthlyPrice) : 500;
}

// ─── Platform settings ─────────────────────────────────────────────

router.get("/platform/settings", async (req, res): Promise<void> => {
  const [ps] = await db.select().from(platformSettingsTable);
  if (!ps) {
    res.json({ monthlyPrice: 500 });
    return;
  }
  res.json({ id: ps.id, monthlyPrice: Number(ps.monthlyPrice), updatedAt: ps.updatedAt });
});

router.put("/platform/settings", async (req, res): Promise<void> => {
  const { monthlyPrice } = req.body;
  if (typeof monthlyPrice !== "number" || monthlyPrice <= 0) {
    res.status(400).json({ error: "monthlyPrice must be a positive number" });
    return;
  }
  const [existing] = await db.select().from(platformSettingsTable);
  let ps;
  if (existing) {
    [ps] = await db.update(platformSettingsTable).set({ monthlyPrice: String(monthlyPrice) }).where(eq(platformSettingsTable.id, existing.id)).returning();
  } else {
    [ps] = await db.insert(platformSettingsTable).values({ monthlyPrice: String(monthlyPrice) }).returning();
  }
  res.json({ id: ps.id, monthlyPrice: Number(ps.monthlyPrice), updatedAt: ps.updatedAt });
});

// ─── Schools overview ──────────────────────────────────────────────

router.get("/schools/overview", async (req, res): Promise<void> => {
  const [[schoolCount], [studentCount]] = await Promise.all([
    db.select({ count: count() }).from(schoolsTable),
    db.select({ count: count() }).from(studentsTable),
  ]);
  const activeSchoolsResult = await db.select({ count: count() }).from(schoolsTable).where(eq(schoolsTable.status, "active"));
  const recentSchools = await db.select().from(schoolsTable).orderBy(sql`${schoolsTable.createdAt} DESC`).limit(5);

  const today = todayStr();
  const sevenDaysLater = addDays(today, 7);

  // Count active subscriptions, expiring within 7 days, and in grace
  const allSubs = await db.select().from(subscriptionsTable);
  let activeSubscriptions = 0, expiringSubscriptions = 0, graceSubscriptions = 0;
  for (const sub of allSubs) {
    const st = computeSubStatus(sub.expiryDate);
    if (st === "active") { activeSubscriptions++; if (sub.expiryDate <= sevenDaysLater) expiringSubscriptions++; }
    if (st === "grace") graceSubscriptions++;
  }

  const schoolsWithSubs = await enrichSchools(recentSchools);

  res.json({
    totalSchools: Number(schoolCount?.count ?? 0),
    activeSchools: Number(activeSchoolsResult[0]?.count ?? 0),
    totalStudents: Number(studentCount?.count ?? 0),
    activeSubscriptions, expiringSubscriptions, graceSubscriptions,
    recentSchools: schoolsWithSubs,
  });
});

// ─── Schools CRUD ─────────────────────────────────────────────────

router.get("/schools", async (req, res): Promise<void> => {
  const { status } = req.query;
  let schools;
  if (status === "active") {
    schools = await db.select().from(schoolsTable).where(eq(schoolsTable.status, "active"));
  } else if (status === "inactive") {
    schools = await db.select().from(schoolsTable).where(eq(schoolsTable.status, "inactive"));
  } else {
    schools = await db.select().from(schoolsTable).orderBy(sql`${schoolsTable.createdAt} DESC`);
  }
  const result = await enrichSchools(schools);
  res.json(result);
});

router.post("/schools", async (req, res): Promise<void> => {
  const { name, contactEmail, contactPhone, address, adminUsername, adminPassword, adminName, months, logoUrl, themeColor, isTrial } = req.body;
  if (!name || !contactEmail || !adminUsername || !adminPassword || !adminName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const slug = await uniqueSlug(generateSlug(name));
  const [school] = await db.insert(schoolsTable).values({ name, slug, contactEmail, contactPhone, address, status: "active", ...(logoUrl ? { logoUrl } : {}) }).returning();

  const today = todayStr();
  let expiryDate: string;
  let plan: string;
  let amount: number;
  let monthsPaid: number;
  let monthlyPrice: number;
  let discount: number;

  if (isTrial) {
    const d = new Date(today);
    d.setDate(d.getDate() + 14);
    expiryDate = d.toISOString().split("T")[0];
    plan = "trial";
    amount = 0;
    monthsPaid = 0;
    monthlyPrice = 0;
    discount = 0;
  } else {
    monthsPaid = Math.max(1, parseInt(months ?? "1", 10));
    monthlyPrice = await getPlatformPrice();
    ({ discount, amount } = computeAmount(monthlyPrice, monthsPaid));
    expiryDate = addMonths(today, monthsPaid);
    plan = "standard";
  }

  const [sub] = await db.insert(subscriptionsTable).values({
    schoolId: school.id,
    plan,
    billingCycle: "monthly",
    status: "active",
    startDate: today,
    expiryDate,
    amount: String(amount),
    monthsPaid,
    monthlyPrice: String(monthlyPrice),
    discountPct: String(discount),
  }).returning();

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await db.insert(usersTable).values({ username: adminUsername, passwordHash, name: adminName, role: "school_admin", schoolId: school.id, mustChangePassword: true });
  await db.insert(feeSettingsTable).values({ schoolId: school.id, schoolFee: "0", busFee: "0", scholarshipDiscount: "0", staffChildDiscount: "0", termBillingEnabled: "false" });
  await db.insert(featureTogglesTable).values({ schoolId: school.id });
  await db.insert(schoolSettingsTable).values({ schoolId: school.id, ...(themeColor ? { themeColor } : {}) });

  res.status(201).json({ ...school, subscription: { ...sub, amount: Number(sub.amount), monthlyPrice: Number(sub.monthlyPrice), discountPct: Number(sub.discountPct), subscriptionStatus: "active" }, studentCount: 0 });
});

router.get("/schools/:schoolId", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  if (isNaN(schoolId)) { res.status(404).json({ error: "School not found" }); return; }
  const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, schoolId));
  if (!school) { res.status(404).json({ error: "School not found" }); return; }
  res.json(await enrichSchool(school));
});

router.put("/schools/:schoolId", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { name, contactEmail, contactPhone, address, slug: rawSlug } = req.body;
  const slugUpdate = rawSlug ? { slug: await uniqueSlug(generateSlug(rawSlug), schoolId) } : {};
  const [school] = await db.update(schoolsTable).set({ name, contactEmail, contactPhone, address, ...slugUpdate }).where(eq(schoolsTable.id, schoolId)).returning();
  if (!school) { res.status(404).json({ error: "School not found" }); return; }
  res.json(await enrichSchool(school));
});

router.patch("/schools/:schoolId/status", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { status } = req.body;
  const [school] = await db.update(schoolsTable).set({ status }).where(eq(schoolsTable.id, schoolId)).returning();
  if (!school) { res.status(404).json({ error: "School not found" }); return; }
  res.json(await enrichSchool(school));
});

router.delete("/schools/:schoolId", async (req: any, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const [sessionUser] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId));
  if (!sessionUser || sessionUser.role !== "super_admin") {
    res.status(403).json({ error: "Super admin access required" });
    return;
  }
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, schoolId));
  if (!school) { res.status(404).json({ error: "School not found" }); return; }

  await db.delete(auditLogsTable).where(eq(auditLogsTable.schoolId, schoolId));
  await db.delete(timetableSlotsTable).where(eq(timetableSlotsTable.schoolId, schoolId));
  await db.delete(academicCalendarTable).where(eq(academicCalendarTable.schoolId, schoolId));
  await db.delete(teacherAttendanceTable).where(eq(teacherAttendanceTable.schoolId, schoolId));
  await db.delete(studentFeeledgerTable).where(eq(studentFeeledgerTable.schoolId, schoolId));
  await db.delete(academicTermsTable).where(eq(academicTermsTable.schoolId, schoolId));
  await db.delete(scoresTable).where(eq(scoresTable.schoolId, schoolId));
  await db.delete(attendanceTable).where(eq(attendanceTable.schoolId, schoolId));
  await db.delete(paymentsTable).where(eq(paymentsTable.schoolId, schoolId));
  await db.delete(salesTable).where(eq(salesTable.schoolId, schoolId));
  await db.delete(expendituresTable).where(eq(expendituresTable.schoolId, schoolId));
  await db.delete(studentClassHistoryTable).where(eq(studentClassHistoryTable.schoolId, schoolId));
  const schoolClasses = await db.select({ id: classesTable.id }).from(classesTable).where(eq(classesTable.schoolId, schoolId));
  for (const cls of schoolClasses) {
    await db.delete(classSubjectsTable).where(eq(classSubjectsTable.classId, cls.id));
  }
  await db.delete(studentsTable).where(eq(studentsTable.schoolId, schoolId));
  await db.delete(teachersTable).where(eq(teachersTable.schoolId, schoolId));
  await db.delete(classesTable).where(eq(classesTable.schoolId, schoolId));
  await db.delete(feeSettingsTable).where(eq(feeSettingsTable.schoolId, schoolId));
  await db.delete(featureTogglesTable).where(eq(featureTogglesTable.schoolId, schoolId));
  await db.delete(schoolSettingsTable).where(eq(schoolSettingsTable.schoolId, schoolId));
  await db.delete(paymentTransactionsTable).where(eq(paymentTransactionsTable.schoolId, schoolId));
  await db.delete(subscriptionsTable).where(eq(subscriptionsTable.schoolId, schoolId));
  await db.delete(usersTable).where(eq(usersTable.schoolId, schoolId));
  await db.delete(schoolsTable).where(eq(schoolsTable.id, schoolId));

  res.json({ success: true, message: `School "${school.name}" permanently deleted.` });
});

// ─── Subscription top-up ──────────────────────────────────────────

router.post("/schools/:schoolId/subscription/topup", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { months } = req.body;
  const monthsPaid = parseInt(months, 10);
  if (!monthsPaid || monthsPaid < 1) {
    res.status(400).json({ error: "months must be a positive integer" });
    return;
  }

  const monthlyPrice = await getPlatformPrice();
  const customDiscount = await getSchoolCustomDiscount(schoolId);
  const { discount, amount } = computeAmount(monthlyPrice, monthsPaid, customDiscount);

  let [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.schoolId, schoolId));
  const today = todayStr();

  if (sub) {
    // Extend from payment date (today), not the existing expiry
    const newExpiry = addMonths(today, monthsPaid);
    [sub] = await db.update(subscriptionsTable).set({
      status: "active",
      expiryDate: newExpiry,
      amount: String(amount),
      monthsPaid,
      monthlyPrice: String(monthlyPrice),
      discountPct: String(discount),
    }).where(eq(subscriptionsTable.schoolId, schoolId)).returning();
    // Re-activate the school if it was deactivated due to non-payment
    await db.update(schoolsTable).set({ status: "active" }).where(eq(schoolsTable.id, schoolId));
  } else {
    const expiryDate = addMonths(today, monthsPaid);
    [sub] = await db.insert(subscriptionsTable).values({
      schoolId, plan: "standard", billingCycle: "monthly", status: "active",
      startDate: today, expiryDate, amount: String(amount),
      monthsPaid, monthlyPrice: String(monthlyPrice), discountPct: String(discount),
    }).returning();
  }

  // Send thank-you email (fire-and-forget)
  const [schoolRow] = await db.select({ name: schoolsTable.name, contactEmail: schoolsTable.contactEmail })
    .from(schoolsTable).where(eq(schoolsTable.id, schoolId));
  if (schoolRow?.contactEmail) {
    sendSubscriptionThankYou({
      schoolName: schoolRow.name,
      contactEmail: schoolRow.contactEmail,
      months: monthsPaid,
      amount,
      newExpiry: sub.expiryDate,
    }).catch(() => {});
  }

  res.json({
    ...sub, amount: Number(sub.amount), monthlyPrice: Number(sub.monthlyPrice),
    discountPct: Number(sub.discountPct), subscriptionStatus: computeSubStatus(sub.expiryDate),
  });
});

// Gross up so platform receives `amount` after Paystack takes 1.5% + GHS 0.50
function withPaystackFee(net: number): { chargeAmount: number; paystackFee: number } {
  const chargeAmount = Math.round(((net + 0.50) / (1 - 0.015)) * 100) / 100;
  const paystackFee = Math.round((chargeAmount - net) * 100) / 100;
  return { chargeAmount, paystackFee };
}

// Preview top-up cost without saving
router.get("/schools/:schoolId/subscription/topup-preview", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const months = parseInt(String(req.query.months ?? "1"), 10);
  const monthlyPrice = await getPlatformPrice();
  const customDiscount = await getSchoolCustomDiscount(schoolId);
  const { discount, amount } = computeAmount(monthlyPrice, months, customDiscount);
  const { chargeAmount, paystackFee } = withPaystackFee(amount);

  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.schoolId, schoolId));
  const today = todayStr();
  const newExpiry = addMonths(today, months);

  res.json({ months, monthlyPrice, discount, amount, paystackFee, chargeAmount, currentExpiry: sub?.expiryDate ?? null, newExpiry, customDiscount });
});

router.get("/schools/:schoolId/subscription", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.schoolId, schoolId));
  if (!sub) { res.status(404).json({ error: "Subscription not found" }); return; }
  res.json({ ...sub, amount: Number(sub.amount), monthlyPrice: Number(sub.monthlyPrice), discountPct: Number(sub.discountPct), subscriptionStatus: computeSubStatus(sub.expiryDate) });
});

// ─── Cancel subscription ───────────────────────────────────────────

router.post("/schools/:schoolId/subscription/cancel", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  if (isNaN(schoolId)) { res.status(400).json({ error: "Invalid school ID" }); return; }

  if (!req.session?.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const [user] = await db.select({ role: usersTable.role, schoolId: usersTable.schoolId })
    .from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user) { res.status(403).json({ error: "Forbidden" }); return; }
  const isSchoolAdmin = user.role === "school_admin" && user.schoolId === schoolId;
  const isSuperAdmin = user.role === "super_admin";
  if (!isSchoolAdmin && !isSuperAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.schoolId, schoolId));
  if (!sub) { res.status(404).json({ error: "Subscription not found" }); return; }
  if (sub.cancelledAt) { res.status(400).json({ error: "Subscription is already cancelled" }); return; }

  const reason: string = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  const [updated] = await db.update(subscriptionsTable)
    .set({ cancelledAt: new Date(), cancellationReason: reason || null })
    .where(eq(subscriptionsTable.schoolId, schoolId))
    .returning();

  req.log.info({ schoolId, reason }, "Subscription cancelled");
  res.json({ ...updated, amount: Number(updated.amount), monthlyPrice: Number(updated.monthlyPrice), discountPct: Number(updated.discountPct), subscriptionStatus: computeSubStatus(updated.expiryDate) });
});

// ─── Special discount per school ──────────────────────────────────

router.put("/schools/:schoolId/custom-discount", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { discountPct } = req.body;

  if (discountPct === null || discountPct === undefined) {
    // Clear the custom discount
    await db.update(schoolsTable).set({ customDiscountPct: null }).where(eq(schoolsTable.id, schoolId));
    res.json({ customDiscountPct: null });
    return;
  }

  const pct = Number(discountPct);
  if (isNaN(pct) || pct < 0 || pct > 100) {
    res.status(400).json({ error: "discountPct must be between 0 and 100" });
    return;
  }

  await db.update(schoolsTable).set({ customDiscountPct: String(pct) }).where(eq(schoolsTable.id, schoolId));
  res.json({ customDiscountPct: pct });
});

// ─── Admin password reset ─────────────────────────────────────────

router.put("/schools/:schoolId/admin-password", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const [user] = await db.update(usersTable)
    .set({ passwordHash, mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(usersTable.schoolId, schoolId))
    .returning();
  if (!user) { res.status(404).json({ error: "Admin user not found for this school" }); return; }
  res.json({ ok: true, username: user.username });
});

// ─── Admin unlock (clear lockout) ─────────────────────────────────

router.post("/schools/:schoolId/admin-unlock", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const [user] = await db.update(usersTable)
    .set({ failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(usersTable.schoolId, schoolId))
    .returning({ id: usersTable.id, username: usersTable.username, lockedUntil: usersTable.lockedUntil });
  if (!user) { res.status(404).json({ error: "Admin user not found for this school" }); return; }
  res.json({ ok: true, username: user.username });
});

// ── Academic Terms ─────────────────────────────────────────────────────

router.get("/schools/:schoolId/terms", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const terms = await db.select().from(academicTermsTable)
    .where(eq(academicTermsTable.schoolId, schoolId))
    .orderBy(academicTermsTable.academicYear, academicTermsTable.name);
  res.json(terms);
});

router.post("/schools/:schoolId/terms", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { name, academicYear, startDate, endDate, isCurrent } = req.body;
  if (!name || !academicYear || !startDate || !endDate) {
    res.status(400).json({ error: "name, academicYear, startDate, endDate are required" }); return;
  }
  // If marking as current, unset all others for this school
  if (isCurrent) {
    await db.update(academicTermsTable).set({ isCurrent: false }).where(eq(academicTermsTable.schoolId, schoolId));
  }
  const [term] = await db.insert(academicTermsTable)
    .values({ schoolId, name, academicYear, startDate, endDate, isCurrent: isCurrent ?? false })
    .returning();
  res.status(201).json(term);
});

router.put("/schools/:schoolId/terms/:termId", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const termId = parseInt(Array.isArray(req.params.termId) ? req.params.termId[0] : req.params.termId, 10);
  const { name, academicYear, startDate, endDate, isCurrent } = req.body;
  // If marking as current, unset all others for this school
  if (isCurrent) {
    await db.update(academicTermsTable).set({ isCurrent: false }).where(eq(academicTermsTable.schoolId, schoolId));
  }
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (academicYear !== undefined) updateData.academicYear = academicYear;
  if (startDate !== undefined) updateData.startDate = startDate;
  if (endDate !== undefined) updateData.endDate = endDate;
  if (isCurrent !== undefined) updateData.isCurrent = isCurrent;
  const [term] = await db.update(academicTermsTable).set(updateData)
    .where(eq(academicTermsTable.id, termId))
    .returning();
  if (!term) { res.status(404).json({ error: "Term not found" }); return; }
  res.json(term);
});

router.delete("/schools/:schoolId/terms/:termId", async (req, res): Promise<void> => {
  const termId = parseInt(Array.isArray(req.params.termId) ? req.params.termId[0] : req.params.termId, 10);
  const [term] = await db.delete(academicTermsTable).where(eq(academicTermsTable.id, termId)).returning();
  if (!term) { res.status(404).json({ error: "Term not found" }); return; }
  res.sendStatus(204);
});

router.put("/schools/:schoolId/subscription", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { expiryDate, amount } = req.body;
  let [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.schoolId, schoolId));
  if (sub) {
    [sub] = await db.update(subscriptionsTable).set({ expiryDate, amount: String(amount), status: "active" }).where(eq(subscriptionsTable.schoolId, schoolId)).returning();
  } else {
    const today = todayStr();
    [sub] = await db.insert(subscriptionsTable).values({ schoolId, plan: "standard", billingCycle: "monthly", status: "active", startDate: today, expiryDate, amount: String(amount), monthsPaid: 1, monthlyPrice: String(amount), discountPct: "0" }).returning();
  }
  res.json({ ...sub, amount: Number(sub.amount), monthlyPrice: Number(sub.monthlyPrice), discountPct: Number(sub.discountPct), subscriptionStatus: computeSubStatus(sub.expiryDate) });
});

// ─── Super Admin: Wipe all school data ──────────────────────────────────────
router.post("/admin/wipe-all-data", async (req: any, res): Promise<void> => {
  // Only allow super admins
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const [user] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user || user.role !== "super_admin") { res.status(403).json({ error: "Forbidden" }); return; }

  // Confirm token required in body
  const { confirmToken } = req.body as { confirmToken?: string };
  if (confirmToken !== "WIPE_ALL_CONFIRMED") {
    res.status(400).json({ error: "Invalid confirmation token" }); return;
  }

  try {
    // Truncate all school-related tables in dependency order
    await db.execute(sql`
      TRUNCATE TABLE
        scores, student_fee_ledger, student_class_history,
        payment_transactions, payments, attendance, teacher_attendance,
        timetable_slots, academic_calendar, academic_terms, audit_logs,
        class_subjects, expenditures, sales, fee_settings, feature_toggles,
        school_settings, subscriptions, students, teachers, classes
      RESTART IDENTITY CASCADE
    `);
    await db.delete(schoolsTable);
    await db.delete(usersTable).where(sql`role != 'super_admin'`);
    res.json({ ok: true, message: "All school data wiped. Super admin accounts preserved." });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Wipe failed" });
  }
});

export default router;
