import { useEffect, useState, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { useTeacherAuth } from "@/lib/teacher-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarDays, CheckCircle2, XCircle, Clock, Save, Users, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, parseISO, isToday } from "date-fns";

interface Props {
  params: { classId: string };
}

type AttendanceStatus = "present" | "absent" | "late" | null;

interface StudentRecord {
  id: number;
  name: string;
  studentNumber: string;
  gender: string | null;
  status: AttendanceStatus;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  present: { label: "Present", color: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200", icon: CheckCircle2 },
  absent:  { label: "Absent",  color: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",     icon: XCircle },
  late:    { label: "Late",    color: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200", icon: Clock },
};

export default function TeacherAttendancePage({ params }: Props) {
  const { classId } = params;
  const [, navigate] = useLocation();
  const { session } = useTeacherAuth();
  const search = useSearch();
  const sp = new URLSearchParams(search);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(sp.get("date") ?? todayStr);
  const [classInfo, setClassInfo] = useState<{ id: number; name: string } | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fetchAttendance = useCallback(async (d: string) => {
    setLoading(true);
    setSaved(false);
    setDirty(false);
    try {
      const res = await fetch(`/api/teacher/attendance?classId=${classId}&date=${d}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setClassInfo(data.class);
        setStudents(data.students);
      }
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { fetchAttendance(date); }, [date, fetchAttendance]);

  const setStatus = (studentId: number, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
    setDirty(true);
    setSaved(false);
  };

  const markAll = (status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = students
        .filter(s => s.status !== null)
        .map(s => ({ studentId: s.id, status: s.status! }));

      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: parseInt(classId), date, records }),
      });
      if (res.ok) {
        setSaved(true);
        setDirty(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const goDate = (delta: number) => {
    const d = delta > 0 ? addDays(parseISO(date), delta) : subDays(parseISO(date), Math.abs(delta));
    setDate(format(d, "yyyy-MM-dd"));
  };

  const presentCount = students.filter(s => s.status === "present").length;
  const absentCount  = students.filter(s => s.status === "absent").length;
  const lateCount    = students.filter(s => s.status === "late").length;
  const unmarked     = students.filter(s => s.status === null).length;

  const isDateToday = date === todayStr;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/teacher/class/${classId}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CalendarDays className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">{classInfo?.name ?? "Attendance"}</h1>
            <p className="text-xs text-muted-foreground">{session?.school?.name}</p>
          </div>
          <Button onClick={handleSave} disabled={saving || !dirty || students.length === 0} size="sm" className="gap-2 shrink-0">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* Date navigation */}
        <div className="bg-white rounded-xl border p-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => goDate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 text-center">
            <p className="font-semibold">{format(parseISO(date), "EEEE, MMMM d, yyyy")}</p>
            {isDateToday && <Badge variant="outline" className="text-xs mt-0.5">Today</Badge>}
          </div>
          <Button variant="ghost" size="icon" onClick={() => goDate(1)} disabled={isDateToday}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <input
            type="date"
            value={date}
            max={todayStr}
            onChange={e => setDate(e.target.value)}
            className="text-xs border rounded px-2 py-1 w-36"
          />
        </div>

        {/* Summary + bulk actions */}
        {!loading && students.length > 0 && (
          <div className="bg-white rounded-xl border p-3 space-y-3">
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-1.5 text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-semibold">{presentCount}</span> Present
              </div>
              <div className="flex items-center gap-1.5 text-red-600">
                <XCircle className="w-4 h-4" />
                <span className="font-semibold">{absentCount}</span> Absent
              </div>
              <div className="flex items-center gap-1.5 text-amber-600">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">{lateCount}</span> Late
              </div>
              {unmarked > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold">{unmarked}</span> Unmarked
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <p className="text-xs text-muted-foreground self-center mr-1">Mark all:</p>
              <Button size="sm" variant="outline" className="text-xs h-7 border-green-200 text-green-700 hover:bg-green-50" onClick={() => markAll("present")}>All Present</Button>
              <Button size="sm" variant="outline" className="text-xs h-7 border-red-200 text-red-600 hover:bg-red-50" onClick={() => markAll("absent")}>All Absent</Button>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => markAll(null)}>Clear All</Button>
            </div>
          </div>
        )}

        {/* Student list */}
        <div className="bg-white rounded-xl border overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Loading students…</p>
            </div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">No active students in this class.</div>
          ) : (
            <div className="divide-y">
              {students.map((student, idx) => {
                const status = student.status;
                return (
                  <div key={student.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{student.studentNumber}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {(["present", "absent", "late"] as const).map(s => {
                        const cfg = STATUS_CONFIG[s];
                        const Icon = cfg.icon;
                        const active = status === s;
                        return (
                          <button
                            key={s}
                            onClick={() => setStatus(student.id, active ? null : s)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
                              active ? cfg.color : "bg-white text-muted-foreground border-border hover:bg-muted"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{cfg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {saved && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Attendance saved successfully — visible to school admin.
          </div>
        )}
      </main>
      <footer className="flex items-center justify-center gap-2 py-3">
        <img src={`${import.meta.env.BASE_URL}torrential-tech-logo-light.png`} alt="Torrential Technologies" className="h-4 w-auto object-contain opacity-50" />
        <span className="text-[10px] text-muted-foreground/75">Product of Torrential Technologies</span>
      </footer>
    </div>
  );
}
