import { localDb, getLastSyncedAt, setLastSyncedAt, hasLocalData, type SyncQueueItem } from "./local-db";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export type SyncStatus = "idle" | "syncing" | "online" | "offline" | "error";

// Categorised error codes surfaced to the UI for actionable messaging.
export type SyncErrorCode = "auth" | "network" | "server" | "unknown";

type Listener = (status: SyncStatus, queueSize: number) => void;
const listeners = new Set<Listener>();
let currentStatus: SyncStatus = "idle";
let currentQueueSize = 0;
let lastErrorCode: SyncErrorCode | null = null;
let lastErrorMessage: string | null = null;

function notifyListeners(status: SyncStatus, queueSize?: number) {
  currentStatus = status;
  if (queueSize !== undefined) currentQueueSize = queueSize;
  if (status !== "error") { lastErrorCode = null; lastErrorMessage = null; }
  listeners.forEach(fn => fn(currentStatus, currentQueueSize));
}

function notifyError(err: Error) {
  const msg = err.message ?? "";
  if (msg.includes("401")) { lastErrorCode = "auth"; }
  else if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Load failed")) { lastErrorCode = "network"; }
  else if (msg.includes("5")) { lastErrorCode = "server"; }
  else { lastErrorCode = "unknown"; }
  lastErrorMessage = msg;
  notifyListeners("error");
}

export function getLastSyncError(): { code: SyncErrorCode | null; message: string | null } {
  return { code: lastErrorCode, message: lastErrorMessage };
}

export function onSyncStatusChange(fn: Listener): () => void {
  listeners.add(fn);
  fn(currentStatus, currentQueueSize);
  return () => { listeners.delete(fn); };
}

export interface SyncProgress { pct: number; label: string }
type ProgressListener = (p: SyncProgress) => void;
const progressListeners = new Set<ProgressListener>();
let currentProgress: SyncProgress = { pct: 0, label: "" };

function emitProgress(pct: number, label: string) {
  currentProgress = { pct, label };
  progressListeners.forEach(fn => fn(currentProgress));
}

export function onProgressChange(fn: ProgressListener): () => void {
  progressListeners.add(fn);
  fn(currentProgress);
  return () => { progressListeners.delete(fn); };
}

export function isOnline() {
  return navigator.onLine;
}

export async function clearSyncQueue(): Promise<void> {
  await localDb.syncQueue.clear();
  notifyListeners("online", 0);
}

export async function enqueueOperation(op: Omit<SyncQueueItem, "id" | "createdAt" | "retries">) {
  await localDb.syncQueue.add({ ...op, createdAt: Date.now(), retries: 0 });
  const count = await localDb.syncQueue.count();
  notifyListeners(isOnline() ? "online" : "offline", count);
  if (isOnline()) {
    scheduleSyncDebounced();
  }
}

let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSyncDebounced(ms = 2000) {
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => { syncDebounceTimer = null; runSync(); }, ms);
}

let syncRunning = false;
let lastSyncCompletedAt = 0;
// Minimum gap between completed syncs (unless an explicit callback is provided).
// This is a hard guard against runaway loops: even if something triggers runSync
// repeatedly, it will only actually execute at most once every MIN_SYNC_GAP_MS.
const MIN_SYNC_GAP_MS = 3_000;

// After this many consecutive server-side failures, discard the operation so
// it cannot block the queue forever (poison-pill protection).
const MAX_QUEUE_RETRIES = 5;

// Operations older than this are considered stale and dropped on startup.
const MAX_QUEUE_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours

type CoreReadyCallback = () => void;

export async function runSync(
  schoolId?: number,
  onCoreReady?: CoreReadyCallback
): Promise<{ ok: boolean; error?: string }> {
  if (syncRunning) return { ok: true };
  // Universal rate-limit: block ALL calls (including onCoreReady) once a sync has completed recently.
  // This is the hard backstop against runaway loops — covers every possible call path.
  if (lastSyncCompletedAt > 0 && Date.now() - lastSyncCompletedAt < MIN_SYNC_GAP_MS) {
    return { ok: true };
  }
  if (!isOnline()) { notifyListeners("offline"); return { ok: false, error: "offline" }; }
  syncRunning = true;
  notifyListeners("syncing");
  emitProgress(5, "Connecting to server…");

  try {
    const sid = schoolId ?? await getActiveSchoolId();
    if (!sid) { syncRunning = false; return { ok: false, error: "no schoolId" }; }

    const pendingCount = await localDb.syncQueue.count();
    if (pendingCount > 0) {
      emitProgress(12, `Uploading ${pendingCount} pending change${pendingCount !== 1 ? "s" : ""}…`);
    } else {
      emitProgress(12, "Checking for pending changes…");
    }
    await pushQueue(sid);

    const lastSynced = await getLastSyncedAt(sid);
    const isFirst = !lastSynced;

    if (isFirst) {
      emitProgress(20, "Downloading school data…");
      // Phase 1: fetch students/classes/teachers/settings quickly so dashboard can show
      await pullData(sid, true);
      emitProgress(100, "Ready!");
      if (onCoreReady) onCoreReady();
      // Phase 2: fetch attendance & finance history in the background
      await pullData(sid, false, lastSynced);
    } else {
      if (onCoreReady) emitProgress(20, "Checking for updates…");
      await pullData(sid);
      if (onCoreReady) {
        emitProgress(100, "Ready!");
        onCoreReady();
      }
    }

    const count = await localDb.syncQueue.count();
    notifyListeners("online", count);
    lastSyncCompletedAt = Date.now();
    syncRunning = false;
    return { ok: true };
  } catch (err: any) {
    notifyError(err instanceof Error ? err : new Error(String(err)));
    syncRunning = false;
    return { ok: false, error: String(err.message) };
  }
}

async function getActiveSchoolId(): Promise<number | null> {
  try {
    const me = await apiFetch("/api/auth/me");
    return me?.school?.id ?? null;
  } catch {
    return null;
  }
}

async function pushQueue(schoolId: number): Promise<void> {
  // Drop operations that are too old or have exceeded the retry limit before
  // even sending — they are poison pills that will never succeed.
  const cutoff = Date.now() - MAX_QUEUE_AGE_MS;
  const staleIds = await localDb.syncQueue
    .filter(i => i.createdAt < cutoff || (i.retries ?? 0) >= MAX_QUEUE_RETRIES)
    .primaryKeys();
  if (staleIds.length) await localDb.syncQueue.bulkDelete(staleIds as number[]);

  const items = await localDb.syncQueue.orderBy("createdAt").toArray();
  if (items.length === 0) return;

  const data = await apiFetch("/api/sync/push", {
    method: "POST",
    body: JSON.stringify({ operations: items.map(i => ({ id: i.opId, entity: i.entity, action: i.action, data: i.data, serverId: i.serverId })) }),
  });

  // Build a set of opIds the server acknowledged so we can detect un-acknowledged ones.
  const acknowledgedOpIds = new Set<string>((data.results ?? []).map((r: any) => r.opId));

  for (const result of (data.results ?? [])) {
    const item = items.find(i => i.opId === result.opId);
    if (!item) continue;

    if (result.ok) {
      await localDb.syncQueue.where("opId").equals(result.opId).delete();

      if (result.localId && result.serverId) {
        // NOTE: Dexie does not allow changing the primary key via modify().
        // We must delete the old temp-ID record and put a new one with the real server ID.
        // IMPORTANT: localId comes from the server as a string (it was the _localId string),
        // but Dexie stores the primary key as a number. We must cast to Number for the lookup.
        const numericLocalId = Number(result.localId);
        if (item.entity === "student") {
          const rec = await localDb.students.get(numericLocalId);
          if (rec) { await localDb.students.delete(numericLocalId); await localDb.students.put({ ...rec, id: result.serverId, _localOnly: false, _localId: undefined }); }
        } else if (item.entity === "class") {
          const rec = await localDb.classes.get(numericLocalId);
          if (rec) { await localDb.classes.delete(numericLocalId); await localDb.classes.put({ ...rec, id: result.serverId, _localOnly: false, _localId: undefined }); }
        } else if (item.entity === "teacher") {
          const rec = await localDb.teachers.get(numericLocalId);
          if (rec) { await localDb.teachers.delete(numericLocalId); await localDb.teachers.put({ ...rec, id: result.serverId, _localOnly: false, _localId: undefined }); }
        } else if (item.entity === "payment") {
          const rec = await localDb.payments.get(numericLocalId);
          if (rec) { await localDb.payments.delete(numericLocalId); await localDb.payments.put({ ...rec, id: result.serverId, _localOnly: false, _localId: undefined }); }
        } else if (item.entity === "sale") {
          const rec = await localDb.sales.get(numericLocalId);
          if (rec) { await localDb.sales.delete(numericLocalId); await localDb.sales.put({ ...rec, id: result.serverId, _localOnly: false, _localId: undefined }); }
        } else if (item.entity === "expenditure") {
          const rec = await localDb.expenditures.get(numericLocalId);
          if (rec) { await localDb.expenditures.delete(numericLocalId); await localDb.expenditures.put({ ...rec, id: result.serverId, _localOnly: false, _localId: undefined }); }
        }
      }
    } else {
      // Server returned an explicit failure for this op. Increment retry counter;
      // items that hit MAX_QUEUE_RETRIES will be pruned on the next sync cycle.
      const newRetries = (item.retries ?? 0) + 1;
      if (newRetries >= MAX_QUEUE_RETRIES) {
        await localDb.syncQueue.where("opId").equals(result.opId).delete();
      } else if (item.id) {
        await localDb.syncQueue.update(item.id, { retries: newRetries });
      }
    }
  }

  // Drop any items that the server received but didn't return a result for
  // (unrecognised entity/action combos). After 2 unacknowledged cycles, drop them.
  for (const item of items) {
    if (!acknowledgedOpIds.has(item.opId)) {
      const newRetries = (item.retries ?? 0) + 1;
      if (newRetries >= MAX_QUEUE_RETRIES) {
        await localDb.syncQueue.where("opId").equals(item.opId).delete();
      } else if (item.id) {
        await localDb.syncQueue.update(item.id, { retries: newRetries });
      }
    }
  }
}

// coreOnly=true: only fetches students/classes/teachers/settings; does NOT set lastSyncedAt
// overrideSince: if passed explicitly (even as null), uses that instead of reading from DB
export async function pullData(schoolId: number, coreOnly = false, overrideSince?: Date | null): Promise<void> {
  const lastSynced = overrideSince !== undefined ? overrideSince : await getLastSyncedAt(schoolId);
  const since = lastSynced ? `&since=${encodeURIComponent(lastSynced.toISOString())}` : "";
  const coreParam = coreOnly ? "&coreOnly=true" : "";
  const data = await apiFetch(`/api/sync/pull?schoolId=${schoolId}${since}${coreParam}`);

  // Collect pending local IDs still in the sync queue so we don't delete truly pending records
  const queueItems = await localDb.syncQueue.toArray();
  const pendingLocalIds = new Set(queueItems.map(q => q.opId));

  if (coreOnly) emitProgress(55, "Saving classes & students…");

  await localDb.transaction("rw",
    [localDb.classes, localDb.students, localDb.teachers, localDb.feeSettings,
     localDb.featureToggles, localDb.schoolSettings, localDb.attendance,
     localDb.payments, localDb.sales, localDb.expenditures],
    async () => {
      if (!lastSynced) {
        // First-time pull: wipe core tables; wipe history tables too unless coreOnly
        await localDb.classes.where("schoolId").equals(schoolId).delete();
        await localDb.students.where("schoolId").equals(schoolId).delete();
        await localDb.teachers.where("schoolId").equals(schoolId).delete();
        await localDb.feeSettings.where("schoolId").equals(schoolId).delete();
        await localDb.featureToggles.where("schoolId").equals(schoolId).delete();
        await localDb.schoolSettings.where("schoolId").equals(schoolId).delete();
        if (!coreOnly) {
          await localDb.attendance.where("schoolId").equals(schoolId).delete();
          await localDb.payments.where("schoolId").equals(schoolId).delete();
          await localDb.sales.where("schoolId").equals(schoolId).delete();
          await localDb.expenditures.where("schoolId").equals(schoolId).delete();
        }
      } else if (!coreOnly) {
        // Incremental pull: clean up stale _localOnly records whose sync op already completed.
        const cleanStale = async (table: typeof localDb.classes) => {
          const stale = await (table as any).where("schoolId").equals(schoolId).filter((r: any) => r._localOnly && r._localId && !pendingLocalIds.has(r._localId)).primaryKeys();
          if (stale.length) await (table as any).bulkDelete(stale);
        };
        await cleanStale(localDb.classes as any);
        await cleanStale(localDb.students as any);
        await cleanStale(localDb.teachers as any);
        await cleanStale(localDb.payments as any);
        await cleanStale(localDb.sales as any);
        await cleanStale(localDb.expenditures as any);
      }

      if (data.classes?.length) await localDb.classes.bulkPut(data.classes);
      if (data.students?.length) await localDb.students.bulkPut(data.students);
      if (coreOnly) emitProgress(75, "Saving teachers & settings…");
      if (data.teachers?.length) await localDb.teachers.bulkPut(data.teachers);
      if (data.feeSettings) await localDb.feeSettings.put(data.feeSettings);
      if (data.featureToggles) await localDb.featureToggles.put(data.featureToggles);
      if (data.schoolSettings) await localDb.schoolSettings.put(data.schoolSettings);
      if (coreOnly) emitProgress(90, "Almost ready…");
      if (!coreOnly) {
        if (data.attendance?.length) await localDb.attendance.bulkPut(data.attendance);
        if (data.payments?.length) await localDb.payments.bulkPut(data.payments);
        if (data.sales?.length) await localDb.sales.bulkPut(data.sales);
        if (data.expenditures?.length) await localDb.expenditures.bulkPut(data.expenditures);
      }
    }
  );

  // Only persist the sync timestamp after a full pull (not core-only)
  if (!coreOnly) {
    await setLastSyncedAt(schoolId, new Date(data.syncedAt));
  }
}

export function initSyncService() {
  window.addEventListener("online", () => {
    notifyListeners("syncing");
    runSync();
  });
  window.addEventListener("offline", () => notifyListeners("offline"));

  notifyListeners(isOnline() ? "online" : "offline");

  // Background refresh every 5 minutes while the tab is open
  setInterval(() => {
    if (isOnline()) runSync();
  }, 5 * 60 * 1000);
}
