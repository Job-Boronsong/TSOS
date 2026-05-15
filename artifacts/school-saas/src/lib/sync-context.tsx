import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { initSyncService, onSyncStatusChange, onProgressChange, runSync, type SyncStatus, type SyncProgress } from "./sync-service";
import { localDb, hasLocalData } from "./local-db";

interface SyncContextValue {
  status: SyncStatus;
  queueSize: number;
  isOffline: boolean;
  isSyncing: boolean;
  hasPendingChanges: boolean;
  initialSyncDone: boolean;
  triggerSync: () => void;
  syncProgress: SyncProgress;
}

const SyncCtx = createContext<SyncContextValue>({
  status: "idle",
  queueSize: 0,
  isOffline: false,
  isSyncing: false,
  hasPendingChanges: false,
  initialSyncDone: false,
  triggerSync: () => {},
  syncProgress: { pct: 0, label: "" },
});

let syncInitialized = false;

// Module-level set: tracks which schoolIds have completed initial sync in this page session.
// Persists across SyncProvider remounts (e.g. navigating between school pages).
const completedSchools = new Set<number>();

const SYNC_TIMEOUT_MS = 15_000;

export function SyncProvider({ children, schoolId }: { children: ReactNode; schoolId: number | null }) {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [queueSize, setQueueSize] = useState(0);
  // Immediately true if this school's initial sync already completed in this page session
  const [initialSyncDone, setInitialSyncDone] = useState(
    () => schoolId != null && completedSchools.has(schoolId)
  );
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({ pct: 0, label: "" });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevent triggering more than one runSync per SyncProvider instance
  const syncTriggeredRef = useRef(false);

  const markDone = useCallback(() => {
    if (schoolId != null) completedSchools.add(schoolId);
    setInitialSyncDone(true);
  }, [schoolId]);

  const checkLocalData = useCallback((sid: number) => {
    hasLocalData(sid).then(has => {
      if (has) markDone();
    });
  }, [markDone]);

  // Register listeners and initialise the sync engine once per page load
  useEffect(() => {
    if (!syncInitialized) {
      initSyncService();
      syncInitialized = true;
    }

    const unsub = onSyncStatusChange((s, q) => {
      setStatus(s);
      setQueueSize(q);
    });

    const unsubProgress = onProgressChange(p => setSyncProgress(p));

    if (schoolId) {
      checkLocalData(schoolId);
    }

    return () => { unsub(); unsubProgress(); };
  }, []);

  // Trigger the initial sync exactly ONCE per SyncProvider instance, when schoolId is known.
  useEffect(() => {
    if (!schoolId) return;
    checkLocalData(schoolId);
    if (!syncTriggeredRef.current) {
      syncTriggeredRef.current = true;
      runSync(schoolId, markDone);
    }
  }, [schoolId]);

  // Safety net: unblock the dashboard as soon as the sync engine reports "online",
  // in case markDone was not called by runSync (e.g. race with initSyncService timer).
  useEffect(() => {
    if (status === "online" && !initialSyncDone && schoolId) {
      markDone();
    }
  }, [status, initialSyncDone, schoolId, markDone]);

  // Hard timeout: if sync doesn't complete in time, force-show the dashboard
  useEffect(() => {
    if (initialSyncDone) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }
    if (!schoolId) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(markDone, SYNC_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [schoolId, initialSyncDone, markDone]);

  // If sync errors, unblock the dashboard so the user isn't permanently stuck
  useEffect(() => {
    if (status === "error" && !initialSyncDone) {
      markDone();
    }
  }, [status, markDone]);

  const triggerSync = useCallback(() => runSync(schoolId ?? undefined), [schoolId]);

  return (
    <SyncCtx.Provider value={{
      status,
      queueSize,
      isOffline: status === "offline",
      isSyncing: status === "syncing",
      hasPendingChanges: queueSize > 0,
      initialSyncDone,
      triggerSync,
      syncProgress,
    }}>
      {children}
    </SyncCtx.Provider>
  );
}

export function useSyncContext() {
  return useContext(SyncCtx);
}
