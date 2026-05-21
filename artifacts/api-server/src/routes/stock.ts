import { Router } from "express";
import { db, stockItemsTable, stockMovementsTable, expendituresTable } from "@workspace/db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

const router = Router();

function parseSchoolId(raw: string): number | null {
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

function serializeItem(i: typeof stockItemsTable.$inferSelect) {
  return { ...i, currentQuantity: Number(i.currentQuantity), reorderLevel: Number(i.reorderLevel) };
}

function serializeMovement(m: typeof stockMovementsTable.$inferSelect) {
  return { ...m, quantity: Number(m.quantity), cost: m.cost !== null ? Number(m.cost) : null };
}

// ── Items ──────────────────────────────────────────────────────

router.get("/schools/:schoolId/stock/items", async (req, res): Promise<void> => {
  const schoolId = parseSchoolId(req.params.schoolId);
  if (!schoolId) { res.status(400).json({ error: "Invalid schoolId" }); return; }
  const items = await db.select().from(stockItemsTable)
    .where(eq(stockItemsTable.schoolId, schoolId))
    .orderBy(stockItemsTable.category, stockItemsTable.name);
  res.json(items.map(serializeItem));
});

router.post("/schools/:schoolId/stock/items", async (req, res): Promise<void> => {
  const schoolId = parseSchoolId(req.params.schoolId);
  if (!schoolId) { res.status(400).json({ error: "Invalid schoolId" }); return; }
  const { name, category, unit, reorderLevel } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [item] = await db.insert(stockItemsTable).values({
    schoolId, name,
    category: category ?? "other",
    unit: unit ?? "pieces",
    reorderLevel: String(reorderLevel ?? 0),
    currentQuantity: "0",
  }).returning();
  res.status(201).json(serializeItem(item));
});

router.put("/schools/:schoolId/stock/items/:itemId", async (req, res): Promise<void> => {
  const schoolId = parseSchoolId(req.params.schoolId);
  const itemId = parseSchoolId(req.params.itemId);
  if (!schoolId || !itemId) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, category, unit, reorderLevel } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (category !== undefined) updates.category = category;
  if (unit !== undefined) updates.unit = unit;
  if (reorderLevel !== undefined) updates.reorderLevel = String(reorderLevel);
  const [item] = await db.update(stockItemsTable).set(updates)
    .where(and(eq(stockItemsTable.id, itemId), eq(stockItemsTable.schoolId, schoolId))).returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeItem(item));
});

router.delete("/schools/:schoolId/stock/items/:itemId", async (req, res): Promise<void> => {
  const schoolId = parseSchoolId(req.params.schoolId);
  const itemId = parseSchoolId(req.params.itemId);
  if (!schoolId || !itemId) { res.status(400).json({ error: "Invalid id" }); return; }
  const [movement] = await db.select({ id: stockMovementsTable.id }).from(stockMovementsTable)
    .where(eq(stockMovementsTable.itemId, itemId)).limit(1);
  if (movement) { res.status(409).json({ error: "Cannot delete item with movement history" }); return; }
  await db.delete(stockItemsTable).where(and(eq(stockItemsTable.id, itemId), eq(stockItemsTable.schoolId, schoolId)));
  res.json({ ok: true });
});

// ── Movements ─────────────────────────────────────────────────

router.get("/schools/:schoolId/stock/movements", async (req, res): Promise<void> => {
  const schoolId = parseSchoolId(req.params.schoolId);
  if (!schoolId) { res.status(400).json({ error: "Invalid schoolId" }); return; }
  const { itemId, type, dateFrom, dateTo } = req.query as Record<string, string>;
  const conditions = [eq(stockMovementsTable.schoolId, schoolId)];
  if (itemId) conditions.push(eq(stockMovementsTable.itemId, parseInt(itemId, 10)));
  if (type) conditions.push(eq(stockMovementsTable.type, type));
  if (dateFrom) conditions.push(gte(stockMovementsTable.date, dateFrom));
  if (dateTo) conditions.push(lte(stockMovementsTable.date, dateTo));
  const movements = await db.select().from(stockMovementsTable)
    .where(and(...conditions)).orderBy(desc(stockMovementsTable.date), desc(stockMovementsTable.createdAt));
  res.json(movements.map(serializeMovement));
});

router.post("/schools/:schoolId/stock/movements", async (req, res): Promise<void> => {
  const schoolId = parseSchoolId(req.params.schoolId);
  if (!schoolId) { res.status(400).json({ error: "Invalid schoolId" }); return; }
  const { itemId, type, quantity, reference, notes, cost, date } = req.body;
  if (!itemId || !type || quantity === undefined || !date) {
    res.status(400).json({ error: "itemId, type, quantity, date required" }); return;
  }
  if (!["intake", "issue", "adjustment"].includes(type)) {
    res.status(400).json({ error: "type must be intake|issue|adjustment" }); return;
  }
  const [item] = await db.select().from(stockItemsTable)
    .where(and(eq(stockItemsTable.id, itemId), eq(stockItemsTable.schoolId, schoolId)));
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }

  const qty = Number(quantity);
  const currentQty = Number(item.currentQuantity);
  let newQty: number;
  if (type === "intake") newQty = currentQty + qty;
  else if (type === "issue") {
    if (qty > currentQty) { res.status(400).json({ error: `Cannot issue ${qty} — only ${currentQty} in stock` }); return; }
    newQty = currentQty - qty;
  } else {
    newQty = qty; // adjustment = new absolute value
  }

  let expenditureId: number | undefined;
  if (type === "intake" && cost && Number(cost) > 0) {
    const [exp] = await db.insert(expendituresTable).values({
      schoolId,
      description: `Stock purchase: ${item.name}${reference ? ` from ${reference}` : ""}`,
      amount: String(cost),
      expenditureDate: date,
      category: "supplies",
    }).returning();
    expenditureId = exp.id;
  }

  const [movement] = await db.insert(stockMovementsTable).values({
    schoolId, itemId, type,
    quantity: String(qty),
    reference: reference ?? null,
    notes: notes ?? null,
    cost: cost ? String(cost) : null,
    expenditureId: expenditureId ?? null,
    date,
    createdBy: req.session.userId ?? null,
  }).returning();

  await db.update(stockItemsTable).set({ currentQuantity: String(newQty) }).where(eq(stockItemsTable.id, itemId));

  res.status(201).json({ ...serializeMovement(movement), newQuantity: newQty });
});

// ── Low-stock alert ────────────────────────────────────────────

router.get("/schools/:schoolId/stock/low", async (req, res): Promise<void> => {
  const schoolId = parseSchoolId(req.params.schoolId);
  if (!schoolId) { res.status(400).json({ error: "Invalid schoolId" }); return; }
  const items = await db.select().from(stockItemsTable)
    .where(and(
      eq(stockItemsTable.schoolId, schoolId),
      sql`${stockItemsTable.reorderLevel} > 0`,
      sql`${stockItemsTable.currentQuantity} <= ${stockItemsTable.reorderLevel}`
    )).orderBy(stockItemsTable.name);
  res.json(items.map(serializeItem));
});

// ── Stock-take ─────────────────────────────────────────────────

router.post("/schools/:schoolId/stock/stocktake", async (req, res): Promise<void> => {
  const schoolId = parseSchoolId(req.params.schoolId);
  if (!schoolId) { res.status(400).json({ error: "Invalid schoolId" }); return; }
  const { counts, date, notes } = req.body;
  if (!counts || !date) { res.status(400).json({ error: "counts and date required" }); return; }
  const results: { itemId: number; previous: number; counted: number; adjustment: number }[] = [];
  for (const { itemId, physicalCount } of counts) {
    const [item] = await db.select().from(stockItemsTable)
      .where(and(eq(stockItemsTable.id, itemId), eq(stockItemsTable.schoolId, schoolId)));
    if (!item) continue;
    const previous = Number(item.currentQuantity);
    const counted = Number(physicalCount);
    const diff = counted - previous;
    if (diff !== 0) {
      await db.insert(stockMovementsTable).values({
        schoolId, itemId, type: "adjustment",
        quantity: String(Math.abs(diff)),
        reference: diff > 0 ? `Stock-take surplus +${Math.abs(diff)}` : `Stock-take deficit -${Math.abs(diff)}`,
        notes: notes ?? null,
        date,
        createdBy: req.session.userId ?? null,
      });
      await db.update(stockItemsTable).set({ currentQuantity: String(counted) }).where(eq(stockItemsTable.id, itemId));
    }
    results.push({ itemId, previous, counted, adjustment: diff });
  }
  res.json({ results });
});

// ── Report ─────────────────────────────────────────────────────

router.get("/schools/:schoolId/stock/report", async (req, res): Promise<void> => {
  const schoolId = parseSchoolId(req.params.schoolId);
  if (!schoolId) { res.status(400).json({ error: "Invalid schoolId" }); return; }
  const { dateFrom, dateTo } = req.query as Record<string, string>;
  const items = await db.select().from(stockItemsTable)
    .where(eq(stockItemsTable.schoolId, schoolId)).orderBy(stockItemsTable.category, stockItemsTable.name);
  const cond = [eq(stockMovementsTable.schoolId, schoolId)];
  if (dateFrom) cond.push(gte(stockMovementsTable.date, dateFrom));
  if (dateTo) cond.push(lte(stockMovementsTable.date, dateTo));
  const movements = await db.select().from(stockMovementsTable)
    .where(and(...cond)).orderBy(desc(stockMovementsTable.date));
  res.json({
    items: items.map(serializeItem),
    movements: movements.map(serializeMovement),
  });
});

export default router;
