import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable, schoolsTable, schoolSettingsTable, subscriptionsTable, feeSettingsTable, featureTogglesTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "../lib/mailer";

declare module "express-session" {
  interface SessionData {
    userId: number;
    schoolId: number | null;
  }
}

const LOCKOUT_DURATION_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

const router: IRouter = Router();

function safeUser(user: typeof usersTable.$inferSelect, school?: typeof schoolsTable.$inferSelect | null) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    schoolId: user.schoolId,
    name: user.name,
    mustChangePassword: user.mustChangePassword,
    mouAcceptedAt: user.mouAcceptedAt ?? null,
    createdAt: user.createdAt,
  };
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMs = user.lockedUntil.getTime() - Date.now();
    const remainingMins = Math.ceil(remainingMs / 60000);
    res.status(423).json({
      error: `Account locked due to too many failed attempts. Try again in ${remainingMins} minute${remainingMins !== 1 ? "s" : ""}.`,
      lockedUntil: user.lockedUntil.toISOString(),
    });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const newAttempts = (user.failedLoginAttempts ?? 0) + 1;
    if (newAttempts >= MAX_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      await db.update(usersTable)
        .set({ failedLoginAttempts: 0, lockedUntil })
        .where(eq(usersTable.id, user.id));
      res.status(423).json({
        error: `Too many failed attempts. Account locked for 5 minutes.`,
        lockedUntil: lockedUntil.toISOString(),
      });
    } else {
      await db.update(usersTable)
        .set({ failedLoginAttempts: newAttempts })
        .where(eq(usersTable.id, user.id));
      const attemptsLeft = MAX_ATTEMPTS - newAttempts;
      res.status(401).json({
        error: `Invalid credentials. ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining before lockout.`,
      });
    }
    return;
  }

  await db.update(usersTable)
    .set({ failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(usersTable.id, user.id));

  req.session.userId = user.id;
  req.session.schoolId = user.schoolId;

  let schoolSlug: string | null = null;
  if (user.schoolId) {
    const [s] = await db.select({ id: schoolsTable.id, slug: schoolsTable.slug, name: schoolsTable.name }).from(schoolsTable).where(eq(schoolsTable.id, user.schoolId));
    if (s) {
      if (s.slug) {
        schoolSlug = s.slug;
      } else {
        // Auto-generate slug for legacy schools that somehow have none
        const base = (s.name ?? `school-${s.id}`)
          .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `school-${s.id}`;
        let candidate = base;
        let i = 2;
        while (true) {
          const existing = await db.select({ id: schoolsTable.id }).from(schoolsTable).where(eq(schoolsTable.slug, candidate));
          if (!existing.length) break;
          candidate = `${base}-${i++}`;
        }
        await db.update(schoolsTable).set({ slug: candidate }).where(eq(schoolsTable.id, s.id));
        schoolSlug = candidate;
      }
    }
  }

  // Explicitly save session to PostgreSQL before responding so the browser's
  // immediate follow-up request (GET /auth/me) always finds it in the store.
  await new Promise<void>((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });

  res.json({
    user: safeUser(user),
    schoolSlug,
    token: "session",
  });
});

// Returns the admin username for a given school (safe - no password info)
router.get("/auth/school-by-slug/:slug", async (req, res): Promise<void> => {
  const slug = req.params.slug;
  const [school] = await db.select({ id: schoolsTable.id, name: schoolsTable.name, slug: schoolsTable.slug })
    .from(schoolsTable).where(eq(schoolsTable.slug, slug));
  if (!school) { res.status(404).json({ error: "School not found" }); return; }
  res.json(school);
});

router.get("/auth/school-username-hint/:schoolId", async (req, res): Promise<void> => {
  const schoolId = parseInt(req.params.schoolId, 10);
  if (isNaN(schoolId)) { res.status(400).json({ error: "Invalid school" }); return; }
  const [user] = await db.select({ username: usersTable.username })
    .from(usersTable)
    .where(and(eq(usersTable.schoolId, schoolId), eq(usersTable.role, "school_admin")));
  if (!user) { res.status(404).json({ error: "No admin found" }); return; }
  res.json({ username: user.username });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {});
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  let school = null;
  if (user.schoolId) {
    const [s] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, user.schoolId));
    if (s) {
      const [settings] = await db
        .select({ themeColor: schoolSettingsTable.themeColor })
        .from(schoolSettingsTable)
        .where(eq(schoolSettingsTable.schoolId, s.id));
      school = { ...s, themeColor: settings?.themeColor ?? null };
    }
  }

  res.json({ user: safeUser(user), school });
});

router.post("/auth/change-password", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current password and new password are required" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable)
    .set({ passwordHash, mustChangePassword: false })
    .where(eq(usersTable.id, user.id));

  res.json({ ok: true });
});

// Force-set password when mustChangePassword=true — no old password required
router.post("/auth/set-password", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (!user.mustChangePassword) {
    res.status(403).json({ error: "Use /auth/change-password to update your password" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable)
    .set({ passwordHash, mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(usersTable.id, user.id));

  res.json({ ok: true });
});

// Emergency super admin recovery — gated by SESSION_SECRET as a bearer token
router.post("/auth/recover-super-admin", async (req, res): Promise<void> => {
  const token = req.headers["x-recovery-token"];
  const sessionSecret = process.env.SESSION_SECRET;
  if (!token || token !== sessionSecret) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.role, "super_admin"));
  if (!user) {
    res.status(404).json({ error: "Super admin not found" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable)
    .set({ passwordHash, mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(usersTable.id, user.id));

  res.json({ ok: true, username: user.username });
});

router.post("/auth/accept-mou", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  await db.update(usersTable)
    .set({ mouAcceptedAt: new Date() })
    .where(eq(usersTable.id, req.session.userId));
  res.json({ ok: true });
});

// ─── Public school self-registration ──────────────────────────────────────────
function makeSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uniqueRegSlug(base: string): Promise<string> {
  let slug = base;
  let i = 1;
  while (true) {
    const [existing] = await db.select({ id: schoolsTable.id }).from(schoolsTable).where(eq(schoolsTable.slug, slug));
    if (!existing) return slug;
    slug = `${base}-${i++}`;
  }
}

async function uniqueUsername(base: string): Promise<string> {
  let username = base;
  let i = 1;
  while (true) {
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
    if (!existing) return username;
    username = `${base}${i++}`;
  }
}

router.post("/auth/register-school", async (req, res): Promise<void> => {
  const { schoolName, contactEmail, contactPhone, address, adminName, password, confirmPassword } = req.body;

  if (!schoolName || !contactEmail || !adminName || !password) {
    res.status(400).json({ error: "School name, contact email, admin name and password are required." });
    return;
  }
  if (password !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match." });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  // Check if email already registered
  const [existingEmail] = await db.select({ id: schoolsTable.id }).from(schoolsTable).where(eq(schoolsTable.contactEmail, contactEmail));
  if (existingEmail) {
    res.status(409).json({ error: "A school with this email is already registered." });
    return;
  }

  const slug = await uniqueRegSlug(makeSlug(schoolName));
  const firstWord = adminName.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  const adminUsername = await uniqueUsername(`admin_${firstWord}`);

  const [school] = await db.insert(schoolsTable).values({
    name: schoolName, slug, contactEmail, contactPhone: contactPhone || null, address: address || null, status: "active",
  }).returning();

  // 14-day trial
  const today = new Date().toISOString().split("T")[0];
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);
  const expiryDate = trialEnd.toISOString().split("T")[0];

  await db.insert(subscriptionsTable).values({
    schoolId: school.id, plan: "trial", billingCycle: "monthly", status: "active",
    startDate: today, expiryDate, amount: "0", monthsPaid: 0, monthlyPrice: "0", discountPct: "0",
  });

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(usersTable).values({
    username: adminUsername, passwordHash, name: adminName, role: "school_admin",
    schoolId: school.id, mustChangePassword: false,
  });
  await db.insert(feeSettingsTable).values({ schoolId: school.id, schoolFee: "0", busFee: "0", scholarshipDiscount: "0", staffChildDiscount: "0", termBillingEnabled: "false" });
  await db.insert(featureTogglesTable).values({ schoolId: school.id });
  await db.insert(schoolSettingsTable).values({ schoolId: school.id });

  const forwardedHost = req.headers["x-forwarded-host"];
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : (forwardedHost ?? req.headers.host ?? "");
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
  const origin = req.headers.origin ?? `${proto}://${host}`;
  const loginUrl = `${origin}/login?school=${slug}`;

  // Fire-and-forget welcome email
  sendWelcomeEmail({ schoolName, adminName, contactEmail, loginUrl, username: adminUsername, trialExpiry: expiryDate }).catch(() => {});

  res.status(201).json({ slug, adminUsername, loginUrl, trialExpiry: expiryDate });
});

export default router;
