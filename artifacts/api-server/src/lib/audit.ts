import { db, auditLogsTable } from "@workspace/db";
import type { Request } from "express";

export async function writeAudit(params: {
  req?: Request;
  schoolId?: number | null;
  actorId?: number | null;
  actorRole?: string | null;
  actorName?: string | null;
  action: string;
  entity: string;
  entityId?: number | null;
  detail?: string;
}) {
  try {
    const session = params.req?.session as any;
    await db.insert(auditLogsTable).values({
      schoolId: params.schoolId ?? session?.schoolId ?? null,
      actorId: params.actorId ?? session?.userId ?? null,
      actorRole: params.actorRole ?? session?.role ?? null,
      actorName: params.actorName ?? session?.name ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      detail: params.detail ?? null,
    });
  } catch {
    // Audit failures must never break the main operation
  }
}
