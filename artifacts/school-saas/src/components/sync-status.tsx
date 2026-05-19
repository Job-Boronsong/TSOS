import { useState, useEffect } from "react";
import { onSyncStatusChange, getLastSyncError, type SyncStatus, type SyncErrorCode, runSync, clearSyncQueue } from "@/lib/sync-service";
import { localDb } from "@/lib/local-db";
import { RefreshCw, CheckCircle, AlertCircle, WifiOff, Trash2, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface Props {
  schoolId: number | null;
}

export function SyncStatus({ schoolId }: Props) {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [queueSize, setQueueSize] = useState(0);
  const [errorCode, setErrorCode] = useState<SyncErrorCode | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const unsub = onSyncStatusChange((s, q) => {
      setStatus(s);
      setQueueSize(q);
      if (s === "error") setErrorCode(getLastSyncError().code);
      else setErrorCode(null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!schoolId) return;
    localDb.syncMeta.get(`lastSyncedAt_${schoolId}`).then(meta => {
      if (meta) setLastSynced(formatRelative(new Date(meta.value)));
    });
    const interval = setInterval(async () => {
      const meta = await localDb.syncMeta.get(`lastSyncedAt_${schoolId}`);
      if (meta) setLastSynced(formatRelative(new Date(meta.value)));
    }, 30000);
    return () => clearInterval(interval);
  }, [schoolId, status]);

  const handleSync = () => {
    if (schoolId) runSync(schoolId);
    setOpen(false);
  };

  const handleClearQueue = async () => {
    setClearing(true);
    try {
      // clearSyncQueue empties the queue AND immediately notifies listeners so
      // the badge drops to 0 even if the rate-limiter blocks an immediate runSync.
      await clearSyncQueue();
      setOpen(false);
    } finally {
      setClearing(false);
    }
  };

  const label = statusLabel(status, queueSize);
  const icon = statusIcon(status);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-7 gap-1.5 text-xs px-2 w-full justify-start", statusClass(status))}
        >
          <span className={cn(status === "syncing" && "animate-spin")}>{icon}</span>
          <span>{label}</span>
          {queueSize > 0 && (
            <span className="ml-auto bg-orange-500 text-white rounded-full text-[10px] px-1.5 py-0">{queueSize}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="end" className="w-64 p-3 space-y-2 text-xs">
        <p className="font-medium text-sm">Sync status</p>

        {status === "offline" && (
          <p className="text-amber-600">You are offline. Changes are saved locally and will sync when you reconnect.</p>
        )}
        {status === "syncing" && (
          <p className="text-blue-500">Syncing data with server…</p>
        )}
        {status === "error" && errorCode === "auth" && (
          <div className="space-y-1.5">
            <p className="text-red-500 font-medium">Session expired</p>
            <p className="text-muted-foreground">Your login session has ended. Please log in again to resume syncing.</p>
            <a
              href="/"
              className="flex items-center gap-1 text-xs text-primary underline underline-offset-2 pt-0.5"
              onClick={() => setOpen(false)}
            >
              <LogIn className="w-3 h-3" /> Go to login
            </a>
          </div>
        )}
        {status === "error" && errorCode !== "auth" && (
          <p className="text-red-500">Last sync failed. Retrying in 30 seconds — or tap "Sync now" to retry immediately.</p>
        )}
        {(status === "online" || status === "idle") && queueSize === 0 && (
          <p className="text-muted-foreground">{lastSynced ? `Last synced ${lastSynced}.` : "Everything is up to date."}</p>
        )}
        {queueSize > 0 && (
          <p className="text-orange-600">{queueSize} change{queueSize !== 1 ? "s" : ""} waiting to upload.</p>
        )}

        <div className="flex flex-col gap-1.5 pt-1">
          <Button size="sm" className="w-full h-7 text-xs" onClick={handleSync} disabled={status === "syncing"}>
            <RefreshCw className={cn("w-3 h-3 mr-1", status === "syncing" && "animate-spin")} />
            Sync now
          </Button>

          {queueSize > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleClearQueue}
              disabled={clearing}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {clearing ? "Clearing…" : "Discard pending changes"}
            </Button>
          )}
        </div>

        {queueSize > 0 && (
          <p className="text-muted-foreground text-[10px]">
            "Discard" removes changes that failed to sync. Use only if items are stuck.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function statusLabel(status: SyncStatus, queueSize: number): string {
  if (status === "offline") return "Offline mode";
  if (status === "syncing") return "Syncing...";
  if (status === "error") return "Sync error";
  if (queueSize > 0) return "Changes pending";
  return "Up to date";
}

function statusIcon(status: SyncStatus) {
  const cls = "w-3.5 h-3.5";
  if (status === "offline") return <WifiOff className={cls} />;
  if (status === "syncing") return <RefreshCw className={cls} />;
  if (status === "error") return <AlertCircle className={cls} />;
  return <CheckCircle className={cls} />;
}

function statusClass(status: SyncStatus): string {
  if (status === "offline") return "text-amber-600 dark:text-amber-400";
  if (status === "syncing") return "text-blue-500";
  if (status === "error") return "text-red-500";
  return "text-green-600 dark:text-green-400";
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
