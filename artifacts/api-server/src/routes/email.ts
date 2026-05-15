import { Router, type IRouter } from "express";
import nodemailer from "nodemailer";
import { eq } from "drizzle-orm";
import { db, schoolsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

function requireSuperAdmin(req: any, res: any, next: any) {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;

  if (!host || !user || !pass) return null;

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    }),
    from,
  };
}

router.get("/super-admin/email/config-status", requireSuperAdmin, async (_req, res): Promise<void> => {
  const cfg = getTransporter();
  res.json({ configured: cfg !== null });
});

router.post("/super-admin/send-email", requireSuperAdmin, async (req, res): Promise<void> => {
  const { subject, body, schoolIds } = req.body as {
    subject: string;
    body: string;
    schoolIds: number[] | "all";
  };

  if (!subject || !body) {
    res.status(400).json({ error: "subject and body are required" });
    return;
  }

  const cfg = getTransporter();
  if (!cfg) {
    res.status(503).json({ error: "Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS environment variables." });
    return;
  }

  const allSchools = await db
    .select({ id: schoolsTable.id, name: schoolsTable.name, contactEmail: schoolsTable.contactEmail })
    .from(schoolsTable);

  const targets =
    schoolIds === "all"
      ? allSchools
      : allSchools.filter(s => (schoolIds as number[]).includes(s.id));

  const emails = targets.map(s => s.contactEmail).filter(Boolean);

  if (emails.length === 0) {
    res.status(400).json({ error: "No valid email addresses found for the selected schools." });
    return;
  }

  const htmlBody = body.replace(/\n/g, "<br>");

  const results: { email: string; ok: boolean; error?: string }[] = [];

  for (const email of emails) {
    try {
      await cfg.transporter.sendMail({
        from: `"Torrential Technologies" <${cfg.from}>`,
        to: email,
        subject,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#1e40af;padding:20px;text-align:center">
              <h2 style="color:#fff;margin:0">Torrential School Operations Suite</h2>
            </div>
            <div style="padding:24px;background:#fff;border:1px solid #e5e7eb">
              ${htmlBody}
            </div>
            <div style="padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;text-align:center">
              <p style="font-size:12px;color:#6b7280;margin:0">
                This message was sent by Torrential Technologies · TSOS Platform<br>
                You are receiving this because your school is subscribed to TSOS.
              </p>
            </div>
          </div>
        `,
      });
      results.push({ email, ok: true });
    } catch (err: any) {
      results.push({ email, ok: false, error: err.message });
    }
  }

  const sent = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;

  res.json({ sent, failed, results });
});

export default router;
