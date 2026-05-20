import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

async function requireSchoolAdminForSchool(req: any, res: any, schoolId: number): Promise<boolean> {
  const userId: number | undefined = req.session?.userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return false; }
  const [user] = await db.select({ role: usersTable.role, schoolId: usersTable.schoolId })
    .from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.role !== "school_admin" || user.schoolId !== schoolId) {
    res.status(403).json({ error: "Forbidden" }); return false;
  }
  return true;
}

function generatePassword(length = 10): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

async function uniqueUsername(base: string): Promise<string> {
  let candidate = base.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
  if (!candidate) candidate = "user";
  let attempt = 0;
  while (true) {
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, candidate));
    if (!existing.length) return candidate;
    attempt++;
    candidate = `${base.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 17)}${attempt}`;
  }
}

const STAFF_ROLES = ["head_teacher", "finance_officer"] as const;

// ─── List staff users ─────────────────────────────────────────────────────────

router.get("/schools/:schoolId/staff-users", async (req, res): Promise<void> => {
  const schoolId = parseInt(req.params.schoolId, 10);
  if (!(await requireSchoolAdminForSchool(req, res, schoolId))) return;

  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    name: usersTable.name,
    role: usersTable.role,
    mustChangePassword: usersTable.mustChangePassword,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(
    and(
      eq(usersTable.schoolId, schoolId),
      inArray(usersTable.role, [...STAFF_ROLES])
    )
  );

  res.json(users);
});

// ─── Create a new staff user ──────────────────────────────────────────────────

router.post("/schools/:schoolId/staff-users", async (req, res): Promise<void> => {
  const schoolId = parseInt(req.params.schoolId, 10);
  if (!(await requireSchoolAdminForSchool(req, res, schoolId))) return;

  const { name, role } = req.body as { name?: string; role?: string };
  if (!name?.trim()) { res.status(400).json({ error: "Name is required" }); return; }
  if (role !== "head_teacher" && role !== "finance_officer") {
    res.status(400).json({ error: "Role must be head_teacher or finance_officer" }); return;
  }

  const nameParts = name.trim().toLowerCase().split(/\s+/);
  const baseUsername = `${nameParts[0]}${nameParts[1]?.[0] ?? ""}`;
  const username = await uniqueUsername(baseUsername);
  const tempPassword = generatePassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const [user] = await db.insert(usersTable).values({
    username,
    passwordHash,
    name: name.trim(),
    role,
    schoolId,
    mustChangePassword: true,
  }).returning({
    id: usersTable.id,
    username: usersTable.username,
    name: usersTable.name,
    role: usersTable.role,
    mustChangePassword: usersTable.mustChangePassword,
    createdAt: usersTable.createdAt,
  });

  res.status(201).json({ ...user, tempPassword });
});

// ─── Update a staff user (name or role) ──────────────────────────────────────

router.put("/schools/:schoolId/staff-users/:userId", async (req, res): Promise<void> => {
  const schoolId = parseInt(req.params.schoolId, 10);
  if (!(await requireSchoolAdminForSchool(req, res, schoolId))) return;

  const userId = parseInt(req.params.userId, 10);
  const [target] = await db.select().from(usersTable)
    .where(and(eq(usersTable.id, userId), eq(usersTable.schoolId, schoolId)));
  if (!target || !STAFF_ROLES.includes(target.role as any)) {
    res.status(404).json({ error: "Staff user not found" }); return;
  }

  const { name, role } = req.body as { name?: string; role?: string };
  const updates: Record<string, any> = {};
  if (name?.trim()) updates.name = name.trim();
  if (role === "head_teacher" || role === "finance_officer") updates.role = role;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning({
    id: usersTable.id,
    username: usersTable.username,
    name: usersTable.name,
    role: usersTable.role,
    mustChangePassword: usersTable.mustChangePassword,
    createdAt: usersTable.createdAt,
  });
  res.json(updated);
});

// ─── Delete a staff user ──────────────────────────────────────────────────────

router.delete("/schools/:schoolId/staff-users/:userId", async (req, res): Promise<void> => {
  const schoolId = parseInt(req.params.schoolId, 10);
  if (!(await requireSchoolAdminForSchool(req, res, schoolId))) return;

  const userId = parseInt(req.params.userId, 10);
  const [target] = await db.select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable).where(and(eq(usersTable.id, userId), eq(usersTable.schoolId, schoolId)));
  if (!target || !STAFF_ROLES.includes(target.role as any)) {
    res.status(404).json({ error: "Staff user not found" }); return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.sendStatus(204);
});

// ─── Reset password ───────────────────────────────────────────────────────────

router.post("/schools/:schoolId/staff-users/:userId/reset-password", async (req, res): Promise<void> => {
  const schoolId = parseInt(req.params.schoolId, 10);
  if (!(await requireSchoolAdminForSchool(req, res, schoolId))) return;

  const userId = parseInt(req.params.userId, 10);
  const [target] = await db.select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable).where(and(eq(usersTable.id, userId), eq(usersTable.schoolId, schoolId)));
  if (!target || !STAFF_ROLES.includes(target.role as any)) {
    res.status(404).json({ error: "Staff user not found" }); return;
  }

  const tempPassword = generatePassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await db.update(usersTable).set({ passwordHash, mustChangePassword: true }).where(eq(usersTable.id, userId));

  res.json({ tempPassword });
});

export default router;
