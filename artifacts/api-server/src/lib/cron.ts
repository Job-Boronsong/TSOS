import cron from "node-cron";
import { db, subscriptionsTable, schoolsTable } from "@workspace/db";
import { and, sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { logger } from "./logger";
import { writeAudit } from "./audit";

// Daily at 8am: flag schools expiring in 7 days or 1 day
cron.schedule("0 8 * * *", async () => {
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const in1 = new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 10);

  try {
    const expiring7 = await db.select({
      schoolId: subscriptionsTable.schoolId,
      schoolName: schoolsTable.name,
      expiryDate: subscriptionsTable.expiryDate,
    }).from(subscriptionsTable)
      .leftJoin(schoolsTable, eq(subscriptionsTable.schoolId, schoolsTable.id))
      .where(and(eq(subscriptionsTable.status, "active"), eq(subscriptionsTable.expiryDate, in7)));

    for (const s of expiring7) {
      logger.info({ schoolId: s.schoolId, schoolName: s.schoolName, expiryDate: s.expiryDate }, "[RENEWAL] School subscription expires in 7 days");
      await writeAudit({
        schoolId: s.schoolId,
        action: "renewal_reminder_7d",
        entity: "subscription",
        detail: `Subscription for ${s.schoolName} expires on ${s.expiryDate}`,
      });
    }

    const expiring1 = await db.select({
      schoolId: subscriptionsTable.schoolId,
      schoolName: schoolsTable.name,
      expiryDate: subscriptionsTable.expiryDate,
    }).from(subscriptionsTable)
      .leftJoin(schoolsTable, eq(subscriptionsTable.schoolId, schoolsTable.id))
      .where(and(eq(subscriptionsTable.status, "active"), eq(subscriptionsTable.expiryDate, in1)));

    for (const s of expiring1) {
      logger.warn({ schoolId: s.schoolId, schoolName: s.schoolName, expiryDate: s.expiryDate }, "[RENEWAL] School subscription expires TOMORROW");
      await writeAudit({
        schoolId: s.schoolId,
        action: "renewal_reminder_1d",
        entity: "subscription",
        detail: `URGENT: Subscription for ${s.schoolName} expires TOMORROW (${s.expiryDate})`,
      });
    }

    if (expiring7.length + expiring1.length === 0) {
      logger.info("[RENEWAL] No subscriptions expiring soon");
    }
  } catch (err: any) {
    logger.error({ err: err?.message }, "[RENEWAL] Cron job failed");
  }
}, { timezone: "Africa/Accra" });

logger.info("[CRON] Renewal reminder cron scheduled (daily 08:00 Africa/Accra)");
