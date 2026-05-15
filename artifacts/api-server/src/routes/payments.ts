import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, schoolsTable, subscriptionsTable, paymentTransactionsTable, platformSettingsTable } from "@workspace/db";
import { sendSubscriptionThankYou } from "../lib/mailer";

const router: IRouter = Router();

const GRACE_DAYS = 3;
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";

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
  if (months >= 7) return 10;
  if (months >= 3) return 5;
  return 0;
}

function effectiveDiscount(months: number, customDiscountPct: string | null | undefined): number {
  if (customDiscountPct != null) return Number(customDiscountPct);
  return discountFor(months);
}

async function getPlatformPrice(): Promise<number> {
  const [ps] = await db.select().from(platformSettingsTable);
  return ps ? Number(ps.monthlyPrice) : 500;
}

// Gross up so platform receives `net` after Paystack deducts 1.5% + GHS 0.50
function withPaystackFee(net: number): { chargeAmount: number; paystackFee: number } {
  const chargeAmount = Math.round(((net + 0.50) / (1 - 0.015)) * 100) / 100;
  const paystackFee = Math.round((chargeAmount - net) * 100) / 100;
  return { chargeAmount, paystackFee };
}

// ─── Initialize a Paystack payment ─────────────────────────────────────────
// Creates a pending transaction record and returns the Paystack payment details
// for the frontend to open the popup.

router.post("/payments/initialize", async (req, res): Promise<void> => {
  const { schoolId, months } = req.body;
  if (!schoolId || !months || months < 1) {
    res.status(400).json({ error: "schoolId and months (≥1) are required" });
    return;
  }

  const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, Number(schoolId)));
  if (!school) { res.status(404).json({ error: "School not found" }); return; }

  const monthlyPrice = await getPlatformPrice();
  const discount = effectiveDiscount(months, school.customDiscountPct);
  const subscriptionAmount = Math.round(monthlyPrice * months * (1 - discount / 100) * 100) / 100;
  const { chargeAmount, paystackFee } = withPaystackFee(subscriptionAmount);
  const amountKobo = Math.round(chargeAmount * 100);

  const reference = `EDUMANAGE-${school.id}-${Date.now()}`;

  await db.insert(paymentTransactionsTable).values({
    schoolId: Number(schoolId),
    paystackRef: reference,
    months: Number(months),
    amount: String(subscriptionAmount),
    status: "pending",
  });

  res.json({
    reference,
    amount: amountKobo,
    amountGhs: chargeAmount,
    subscriptionAmount,
    paystackFee,
    email: school.contactEmail,
    schoolName: school.name,
    months,
    discount,
    monthlyPrice,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY ?? "",
  });
});

// ─── Verify a completed Paystack payment ──────────────────────────────────
// Called by the frontend after the Paystack popup returns success.
// Verifies with Paystack API, then extends the subscription.

router.post("/payments/verify", async (req, res): Promise<void> => {
  const { reference } = req.body;
  if (!reference) { res.status(400).json({ error: "reference is required" }); return; }

  const [txn] = await db.select().from(paymentTransactionsTable)
    .where(eq(paymentTransactionsTable.paystackRef, reference));

  if (!txn) { res.status(404).json({ error: "Transaction not found" }); return; }
  if (txn.status === "completed") {
    const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.schoolId, txn.schoolId));
    res.json({ alreadyProcessed: true, newExpiryDate: txn.newExpiryDate, subscription: sub });
    return;
  }

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });

  if (!verifyRes.ok) {
    res.status(502).json({ error: "Failed to reach Paystack verification API" });
    return;
  }

  const verifyData = await verifyRes.json() as any;

  if (!verifyData.status || verifyData.data?.status !== "success") {
    await db.update(paymentTransactionsTable)
      .set({ status: "failed" })
      .where(eq(paymentTransactionsTable.paystackRef, reference));
    res.status(400).json({ error: "Payment not confirmed by Paystack", details: verifyData.data?.status });
    return;
  }

  const today = todayStr();
  let [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.schoolId, txn.schoolId));
  const [schoolRow] = await db.select({ customDiscountPct: schoolsTable.customDiscountPct }).from(schoolsTable).where(eq(schoolsTable.id, txn.schoolId));
  const appliedDiscount = effectiveDiscount(txn.months, schoolRow?.customDiscountPct);
  const monthlyPrice = Number(txn.amount) / txn.months / (1 - appliedDiscount / 100);

  let newExpiry: string;
  if (sub) {
    const baseDate = sub.expiryDate >= today ? sub.expiryDate : today;
    newExpiry = addMonths(baseDate, txn.months);
    [sub] = await db.update(subscriptionsTable).set({
      status: "active",
      expiryDate: newExpiry,
      amount: String(txn.amount),
      monthsPaid: txn.months,
      monthlyPrice: String(Math.round(monthlyPrice * 100) / 100),
      discountPct: String(appliedDiscount),
      cancelledAt: null,
      cancellationReason: null,
    }).where(eq(subscriptionsTable.schoolId, txn.schoolId)).returning();
  } else {
    newExpiry = addMonths(today, txn.months);
    [sub] = await db.insert(subscriptionsTable).values({
      schoolId: txn.schoolId,
      plan: "standard",
      billingCycle: "monthly",
      status: "active",
      startDate: today,
      expiryDate: newExpiry,
      amount: String(txn.amount),
      monthsPaid: txn.months,
      monthlyPrice: String(Math.round(monthlyPrice * 100) / 100),
      discountPct: String(appliedDiscount),
    }).returning();
  }

  await db.update(schoolsTable).set({ status: "active" }).where(eq(schoolsTable.id, txn.schoolId));

  await db.update(paymentTransactionsTable).set({ status: "completed", newExpiryDate: newExpiry })
    .where(eq(paymentTransactionsTable.paystackRef, reference));

  // Send thank-you email (fire-and-forget)
  const [schoolForEmail] = await db.select({ name: schoolsTable.name, contactEmail: schoolsTable.contactEmail })
    .from(schoolsTable).where(eq(schoolsTable.id, txn.schoolId));
  if (schoolForEmail?.contactEmail) {
    sendSubscriptionThankYou({
      schoolName: schoolForEmail.name,
      contactEmail: schoolForEmail.contactEmail,
      months: txn.months,
      amount: Number(txn.amount),
      newExpiry,
    }).catch(() => {});
  }

  res.json({
    success: true,
    newExpiryDate: newExpiry,
    subscription: {
      ...sub,
      amount: Number(sub.amount),
      monthlyPrice: Number(sub.monthlyPrice),
      discountPct: Number(sub.discountPct),
      subscriptionStatus: computeSubStatus(newExpiry),
    },
  });
});

// ─── Paystack webhook (for server-side event confirmation) ─────────────────
router.post("/webhooks/paystack", async (req, res): Promise<void> => {
  const crypto = await import("crypto");
  const hash = crypto.createHmac("sha512", PAYSTACK_SECRET)
    .update(JSON.stringify(req.body)).digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    res.sendStatus(401);
    return;
  }

  const event = req.body as any;
  if (event.event === "charge.success") {
    const reference = event.data?.reference;
    if (reference) {
      const [txn] = await db.select().from(paymentTransactionsTable)
        .where(eq(paymentTransactionsTable.paystackRef, reference));

      if (txn && txn.status === "pending") {
        const today = todayStr();
        let [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.schoolId, txn.schoolId));
        const monthlyPrice = Number(txn.amount) / txn.months / (1 - discountFor(txn.months) / 100);
        let newExpiry: string;

        if (sub) {
          const baseDate = sub.expiryDate >= today ? sub.expiryDate : today;
          newExpiry = addMonths(baseDate, txn.months);
          await db.update(subscriptionsTable).set({
            status: "active",
            expiryDate: newExpiry,
            amount: String(txn.amount),
            monthsPaid: txn.months,
            monthlyPrice: String(Math.round(monthlyPrice * 100) / 100),
            discountPct: String(discountFor(txn.months)),
            cancelledAt: null,
            cancellationReason: null,
          }).where(eq(subscriptionsTable.schoolId, txn.schoolId));
        } else {
          newExpiry = addMonths(today, txn.months);
          await db.insert(subscriptionsTable).values({
            schoolId: txn.schoolId, plan: "standard", billingCycle: "monthly", status: "active",
            startDate: today, expiryDate: newExpiry, amount: String(txn.amount),
            monthsPaid: txn.months, monthlyPrice: String(Math.round(monthlyPrice * 100) / 100),
            discountPct: String(discountFor(txn.months)),
          });
        }

        await db.update(schoolsTable).set({ status: "active" }).where(eq(schoolsTable.id, txn.schoolId));
        await db.update(paymentTransactionsTable).set({ status: "completed", newExpiryDate: newExpiry })
          .where(eq(paymentTransactionsTable.paystackRef, reference));
      }
    }
  }

  res.sendStatus(200);
});

export default router;
