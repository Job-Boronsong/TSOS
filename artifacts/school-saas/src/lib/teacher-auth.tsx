import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface TeacherSession {
  teacher: {
    id: number;
    name: string;
    username: string;
    schoolId: number;
    mustChangePassword: boolean;
    subject: string | null;
    adminRole: "head_teacher" | "finance_officer" | null;
  };
  school: {
    id: number;
    name: string;
    address: string | null;
    logoUrl: string | null;
  } | null;
}

interface TeacherAuthCtx {
  session: TeacherSession | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<TeacherAuthCtx | null>(null);

export function TeacherAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TeacherSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher-auth/me", { credentials: "include" });
      if (res.ok) {
        setSession(await res.json());
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (username: string, password: string) => {
    const res = await fetch("/api/teacher-auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message ?? data.error ?? "Login failed");
    }
    await refresh();
  };

  const logout = async () => {
    await fetch("/api/teacher-auth/logout", { method: "POST", credentials: "include" });
    setSession(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const res = await fetch("/api/teacher-auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to change password");
    }
    await refresh();
  };

  return <Ctx.Provider value={{ session, isLoading, login, logout, changePassword, refresh }}>{children}</Ctx.Provider>;
}

export function useTeacherAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTeacherAuth must be used inside TeacherAuthProvider");
  return ctx;
}
