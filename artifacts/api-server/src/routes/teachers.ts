import { Router, type IRouter } from "express";
import { eq, and, isNull } from "drizzle-orm";
import { db, teachersTable, schoolSettingsTable, featureTogglesTable, schoolsTable } from "@workspace/db";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

// ─── Credential helpers ───────────────────────────────────────────

function generatePassword(length = 8): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

function generateUsername(name: string, schoolId: number): string {
  // e.g. "Kwame Asante" → "kwamea" + schoolId → "kwamea1"
  const parts = name.toLowerCase().replace(/[^a-z ]/g, "").split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "teacher";
  const lastInitial = parts[1]?.[0] ?? "";
  return `${first}${lastInitial}${schoolId}`;
}

async function uniqueUsername(base: string): Promise<string> {
  let candidate = base;
  let attempt = 0;
  while (true) {
    const existing = await db.select({ id: teachersTable.id }).from(teachersTable).where(eq(teachersTable.username, candidate));
    if (!existing.length) return candidate;
    attempt++;
    candidate = `${base}${attempt}`;
  }
}

// ─── Teacher CRUD ─────────────────────────────────────────────────

router.get("/schools/:schoolId/teachers", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const teachers = await db.select().from(teachersTable).where(and(eq(teachersTable.schoolId, schoolId), isNull(teachersTable.deletedAt))).orderBy(teachersTable.name);
  // Never send passwordHash to client
  res.json(teachers.map(({ passwordHash, ...t }) => t));
});

router.post("/schools/:schoolId/teachers", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { name, subject, phone, email } = req.body;
  if (!name) { res.status(400).json({ error: "Name is required" }); return; }

  const [teacher] = await db.insert(teachersTable).values({ schoolId, name, subject, phone, email, status: "active" }).returning();
  const { passwordHash, ...safe } = teacher;
  res.status(201).json(safe);
});

router.put("/schools/:schoolId/teachers/:teacherId", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const teacherId = parseInt(Array.isArray(req.params.teacherId) ? req.params.teacherId[0] : req.params.teacherId, 10);
  const { name, email, phone, subject, status } = req.body;
  if (!name) { res.status(400).json({ error: "Name is required" }); return; }

  const [teacher] = await db.update(teachersTable)
    .set({ name, email: email || null, phone: phone || null, subject: subject || null, status: status ?? "active" })
    .where(and(eq(teachersTable.id, teacherId), eq(teachersTable.schoolId, schoolId)))
    .returning();

  if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }
  const { passwordHash, ...safe } = teacher;
  res.json(safe);
});

router.patch("/schools/:schoolId/teachers/:teacherId/status", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const teacherId = parseInt(Array.isArray(req.params.teacherId) ? req.params.teacherId[0] : req.params.teacherId, 10);
  const { status } = req.body;

  const [teacher] = await db.update(teachersTable)
    .set({ status })
    .where(and(eq(teachersTable.id, teacherId), eq(teachersTable.schoolId, schoolId)))
    .returning();

  if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }
  const { passwordHash, ...safe } = teacher;
  res.json(safe);
});

// ─── Generate / reset login credentials ──────────────────────────

router.post("/schools/:schoolId/teachers/:teacherId/generate-credentials", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const teacherId = parseInt(Array.isArray(req.params.teacherId) ? req.params.teacherId[0] : req.params.teacherId, 10);

  const [teacher] = await db.select().from(teachersTable).where(and(eq(teachersTable.id, teacherId), eq(teachersTable.schoolId, schoolId)));
  if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }

  const rawPassword = generatePassword();
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const usernameBase = generateUsername(teacher.name, schoolId);
  // Only generate a new username if they don't already have one
  const username = teacher.username ?? await uniqueUsername(usernameBase);

  await db.update(teachersTable)
    .set({ username, passwordHash, mustChangePassword: true, failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(teachersTable.id, teacherId));

  // Return the plain password ONCE — it won't be retrievable again
  res.json({ username, password: rawPassword, mustChangePassword: true });
});

// ─── Settings & feature toggles ───────────────────────────────────

router.get("/schools/:schoolId/settings", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, schoolId));
  if (!school) { res.status(404).json({ error: "School not found" }); return; }

  const [settings] = await db.select().from(schoolSettingsTable).where(eq(schoolSettingsTable.schoolId, schoolId));

  res.json({
    schoolId: school.id,
    schoolName: school.name,
    contactEmail: school.contactEmail,
    contactPhone: school.contactPhone ?? null,
    address: school.address ?? null,
    academicYear: school.academicYear ?? null,
    logoUrl: school.logoUrl ?? null,
    themeColor: settings?.themeColor ?? null,
    checkinLatitude: settings?.checkinLatitude ?? null,
    checkinLongitude: settings?.checkinLongitude ?? null,
    checkinRadiusMeters: settings?.checkinRadiusMeters ?? 50,
  });
});

router.put("/schools/:schoolId/settings", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { schoolName, contactEmail, contactPhone, address, academicYear, themeColor, logoUrl,
          checkinLatitude, checkinLongitude, checkinRadiusMeters } = req.body;

  const [school] = await db.update(schoolsTable).set({
    name: schoolName,
    contactEmail,
    contactPhone,
    address,
    academicYear,
    logoUrl: logoUrl ?? undefined,
  }).where(eq(schoolsTable.id, schoolId)).returning();

  if (!school) { res.status(404).json({ error: "School not found" }); return; }

  const settingsUpdate: Record<string, unknown> = { themeColor };
  if (checkinLatitude !== undefined) settingsUpdate.checkinLatitude = checkinLatitude === null ? null : Number(checkinLatitude);
  if (checkinLongitude !== undefined) settingsUpdate.checkinLongitude = checkinLongitude === null ? null : Number(checkinLongitude);
  if (checkinRadiusMeters !== undefined) settingsUpdate.checkinRadiusMeters = Number(checkinRadiusMeters) || 50;

  const existing = await db.select().from(schoolSettingsTable).where(eq(schoolSettingsTable.schoolId, schoolId));
  let settings;
  if (existing.length > 0) {
    [settings] = await db.update(schoolSettingsTable).set(settingsUpdate).where(eq(schoolSettingsTable.schoolId, schoolId)).returning();
  } else {
    [settings] = await db.insert(schoolSettingsTable).values({ schoolId, ...settingsUpdate }).returning();
  }

  res.json({
    schoolId: school.id,
    schoolName: school.name,
    contactEmail: school.contactEmail,
    contactPhone: school.contactPhone ?? null,
    address: school.address ?? null,
    academicYear: school.academicYear ?? null,
    logoUrl: school.logoUrl ?? null,
    themeColor: settings?.themeColor ?? null,
    checkinLatitude: settings?.checkinLatitude ?? null,
    checkinLongitude: settings?.checkinLongitude ?? null,
    checkinRadiusMeters: settings?.checkinRadiusMeters ?? 50,
  });
});

router.get("/schools/:schoolId/features", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  let [ft] = await db.select().from(featureTogglesTable).where(eq(featureTogglesTable.schoolId, schoolId));
  if (!ft) {
    [ft] = await db.insert(featureTogglesTable).values({ schoolId }).returning();
  }
  res.json(ft);
});

router.put("/schools/:schoolId/features", async (req, res): Promise<void> => {
  const schoolId = parseInt(Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId, 10);
  const { attendanceEnabled, financeEnabled, salesEnabled, reportsEnabled, busEnabled } = req.body;

  const existing = await db.select().from(featureTogglesTable).where(eq(featureTogglesTable.schoolId, schoolId));
  let ft;
  if (existing.length > 0) {
    [ft] = await db.update(featureTogglesTable).set({ attendanceEnabled, financeEnabled, salesEnabled, reportsEnabled, busEnabled }).where(eq(featureTogglesTable.schoolId, schoolId)).returning();
  } else {
    [ft] = await db.insert(featureTogglesTable).values({ schoolId, attendanceEnabled, financeEnabled, salesEnabled, reportsEnabled, busEnabled }).returning();
  }
  res.json(ft);
});

export default router;
