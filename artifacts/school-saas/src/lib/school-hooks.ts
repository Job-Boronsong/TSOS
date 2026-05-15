import { useAuth } from "./auth";
import { useEffect } from "react";

const SCHOOL_ID_KEY = "tsos_school_id";

export function useSchoolId(): number {
  const { session } = useAuth();
  const fromSession = (session?.user as any)?.schoolId ?? 0;

  useEffect(() => {
    if (fromSession > 0) {
      try { localStorage.setItem(SCHOOL_ID_KEY, String(fromSession)); } catch {}
    }
  }, [fromSession]);

  if (fromSession > 0) return fromSession;
  try {
    const cached = parseInt(localStorage.getItem(SCHOOL_ID_KEY) ?? "0", 10);
    return isNaN(cached) ? 0 : cached;
  } catch {
    return 0;
  }
}

export function useSchoolSlug(): string {
  const { session } = useAuth();
  return (session as any)?.school?.slug ?? "";
}
