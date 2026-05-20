import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useTeacherAuth } from "@/lib/teacher-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Users, BookOpen, LogOut, Key, Search, Filter, CalendarDays, Clock, MapPin, LogIn, LogOut as LogOutIcon, CheckCircle2, Loader2, Bell } from "lucide-react";

const LEVEL_LABELS: Record<string, string> = {
  nursery: "Nursery", kg: "KG", primary: "Primary", jhs: "JHS",
};

const LEVEL_COLORS: Record<string, string> = {
  nursery: "bg-pink-100 text-pink-700 border-pink-200",
  kg: "bg-purple-100 text-purple-700 border-purple-200",
  primary: "bg-blue-100 text-blue-700 border-blue-200",
  jhs: "bg-orange-100 text-orange-700 border-orange-200",
};

const LEVEL_CARD_COLORS: Record<string, string> = {
  nursery: "border-pink-200 hover:border-pink-300",
  kg: "border-purple-200 hover:border-purple-300",
  primary: "border-blue-200 hover:border-blue-300",
  jhs: "border-orange-200 hover:border-orange-300",
};

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_SHORT = ["", "Mon", "Tue", "Wed", "Thu", "Fri"];

interface TimetableSlot {
  id: number;
  classId: number;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subject: string | null;
  teacherId: number | null;
}

interface TimetableData {
  slots: TimetableSlot[];
  classes: { id: number; name: string; level: string | null }[];
  homeroomClassIds: number[];
  mySubjectsByClass: Record<number, string[]>;
}

// ── Timetable section ─────────────────────────────────────────────────────────

function TimetableSection({ isSubjectTeacher }: { isSubjectTeacher: boolean }) {
  const [data, setData] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<number>(() => {
    const d = new Date().getDay(); // 0=Sun,6=Sat
    return d >= 1 && d <= 5 ? d : 1; // default to Mon if weekend
  });

  useEffect(() => {
    fetch("/api/teacher/timetable", { credentials: "include" })
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const classMap = useMemo(() => {
    const m: Record<number, string> = {};
    for (const c of data?.classes ?? []) m[c.id] = c.name;
    return m;
  }, [data]);

  // Days that actually have slots
  const daysWithSlots = useMemo(() => {
    const days = new Set<number>();
    for (const s of data?.slots ?? []) days.add(s.dayOfWeek);
    return days;
  }, [data]);

  // Slots for the active day, sorted by period
  const daySlots = useMemo(() =>
    (data?.slots ?? [])
      .filter(s => s.dayOfWeek === activeDay)
      .sort((a, b) => a.periodNumber - b.periodNumber),
    [data, activeDay]
  );

  if (loading) {
    return (
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">My Timetable</p>
        </div>
        <p className="text-sm text-muted-foreground">Loading timetable…</p>
      </div>
    );
  }

  if (!data || data.slots.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">My Timetable</p>
        </div>
        <p className="text-sm text-muted-foreground">No timetable has been set up for your class{isSubjectTeacher ? "es" : ""} yet. Ask the school admin to configure it.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-slate-50 flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-slate-700">
          {isSubjectTeacher ? "My Subject Timetable" : "Class Timetable"}
        </p>
        {isSubjectTeacher && (
          <span className="ml-auto text-xs text-muted-foreground">Showing your subjects across all classes</span>
        )}
      </div>

      {/* Day tabs */}
      <div className="flex border-b overflow-x-auto">
        {[1, 2, 3, 4, 5].map(day => {
          const hasSlots = daysWithSlots.has(day);
          const isToday = new Date().getDay() === day;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex-1 min-w-[64px] px-3 py-2.5 text-xs font-medium transition-colors border-b-2 relative ${
                activeDay === day
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-slate-50"
              } ${!hasSlots ? "opacity-40" : ""}`}
            >
              <span className="hidden sm:block">{DAY_NAMES[day]}</span>
              <span className="sm:hidden">{DAY_SHORT[day]}</span>
              {isToday && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-500" title="Today" />
              )}
            </button>
          );
        })}
      </div>

      {/* Slots for active day */}
      <div className="divide-y">
        {daySlots.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No periods on {DAY_NAMES[activeDay]}.</p>
        ) : (
          daySlots.map(slot => {
            const isHomeroom = data.homeroomClassIds.includes(slot.classId);
            const className = classMap[slot.classId] ?? `Class ${slot.classId}`;
            const mySubjects = data.mySubjectsByClass[slot.classId] ?? [];
            const isMySubject = !isHomeroom && mySubjects.some(s => s.toLowerCase() === (slot.subject ?? "").toLowerCase());

            return (
              <div
                key={slot.id}
                className={`flex items-center gap-3 px-4 py-3 ${isMySubject ? "bg-orange-50" : ""}`}
              >
                {/* Period + time */}
                <div className="shrink-0 text-center w-12">
                  <p className="text-xs font-bold text-muted-foreground">P{slot.periodNumber}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{slot.startTime}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{slot.endTime}</p>
                </div>

                {/* Divider line */}
                <div className={`w-1 self-stretch rounded-full ${isMySubject ? "bg-orange-400" : "bg-primary/20"}`} />

                {/* Subject + class */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isMySubject ? "text-orange-700" : ""}`}>
                    {slot.subject ?? "—"}
                  </p>
                  {isSubjectTeacher && (
                    <p className="text-xs text-muted-foreground truncate">{className}</p>
                  )}
                </div>

                {/* Badges */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {isMySubject && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium border border-orange-200">
                      Your subject
                    </span>
                  )}
                  {isHomeroom && isSubjectTeacher && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium border border-blue-200">
                      Homeroom
                    </span>
                  )}
                  {!isSubjectTeacher && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {slot.startTime}–{slot.endTime}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Notifications panel ───────────────────────────────────────────────────────

function NotificationsPanel() {
  const [, navigate] = useLocation();
  const [unread, setUnread] = useState(0);
  const [latest, setLatest] = useState<{ id: number; title: string; message: string; createdAt: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/teacher/announcements/unread-count", { credentials: "include" }).then(r => r.json()),
      fetch("/api/teacher/announcements", { credentials: "include" }).then(r => r.json()),
    ]).then(([countData, announcements]) => {
      setUnread(countData.unread ?? 0);
      if (Array.isArray(announcements) && announcements.length > 0) {
        setLatest(announcements[0]);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading || !latest) return null;

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return "Just now";
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div
      className="relative bg-white border rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
      onClick={() => navigate("/teacher/announcements")}
    >
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <Bell className="w-4 h-4 text-primary" />
        </div>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">Announcements</p>
          {unread > 0 && (
            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">{unread} new</span>
          )}
        </div>
        <p className="text-sm font-medium truncate">{latest.title}</p>
        <p className="text-xs text-muted-foreground truncate">{latest.message}</p>
      </div>
      <div className="text-xs text-muted-foreground shrink-0">{timeAgo(latest.createdAt)}</div>
    </div>
  );
}

// ── Upcoming Events widget ────────────────────────────────────────────────────

const CAT_DOTS: Record<string, string> = {
  academic: "bg-blue-500", event: "bg-green-500",
  exams: "bg-red-500", meeting: "bg-amber-400", holiday: "bg-slate-400",
};

function UpcomingEventsWidget() {
  const [, navigate] = useLocation();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/teacher/calendar", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d)) return;
        const today = new Date().toISOString().split("T")[0];
        setEvents(d.filter(ev => ev.endDate >= today).slice(0, 5));
      })
      .catch(() => {});
  }, []);

  if (events.length === 0) return null;

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">Upcoming Events</p>
        </div>
        <button
          onClick={() => navigate("/teacher/calendar")}
          className="text-xs text-primary hover:underline"
        >
          View Calendar →
        </button>
      </div>
      <div className="divide-y">
        {events.map(ev => {
          const dot = CAT_DOTS[ev.category] ?? "bg-slate-400";
          const startDate = new Date(ev.startDate + "T12:00:00");
          const startFmt = startDate.toLocaleDateString("en-GH", { day: "numeric", month: "short" });
          const endFmt = ev.endDate !== ev.startDate
            ? " – " + new Date(ev.endDate + "T12:00:00").toLocaleDateString("en-GH", { day: "numeric", month: "short" })
            : "";
          return (
            <div key={ev.id} className="px-4 py-2.5 flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
              <p className="text-sm font-medium flex-1 truncate">{ev.title}</p>
              <span className="text-xs text-muted-foreground shrink-0">{startFmt}{endFmt}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── GPS Check-in card ─────────────────────────────────────────────────────────

function CheckInCard() {
  const { toast } = useToast();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const load = () => {
    fetch("/api/teacher/checkin/today", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setRecord(d); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(load, []);

  const fmtTime = (ts: string | null) => {
    if (!ts) return "–";
    return new Date(ts).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Africa/Accra" });
  };

  const handleCheckIn = async () => {
    setWorking(true);
    const getCoords = (): Promise<GeolocationCoordinates | null> =>
      new Promise(resolve => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          pos => resolve(pos.coords),
          () => resolve(null),
          { timeout: 10000, maximumAge: 0 }
        );
      });

    try {
      const coords = await getCoords();
      const deviceInfo = `${navigator.userAgent.slice(0, 200)}`;
      const body: Record<string, unknown> = { deviceInfo };
      if (coords) {
        body.latitude = coords.latitude;
        body.longitude = coords.longitude;
      }
      const res = await fetch("/api/teacher/checkin", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Check-in failed", description: data.error });
      } else {
        toast({ title: "Checked in!", description: `At ${fmtTime(data.checkInTime)}` });
        setRecord(data);
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not complete check-in." });
    } finally {
      setWorking(false);
    }
  };

  const handleCheckOut = async () => {
    setWorking(true);
    try {
      const res = await fetch("/api/teacher/checkout", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Check-out failed", description: data.error });
      } else {
        toast({ title: "Checked out!", description: `At ${fmtTime(data.checkOutTime)}` });
        setRecord(data);
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not complete check-out." });
    } finally {
      setWorking(false);
    }
  };

  const today = new Date().toLocaleDateString("en-GH", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Accra" });
  const checkedIn = !!record?.checkInTime;
  const checkedOut = !!record?.checkOutTime;

  if (loading) return null;

  return (
    <Card className={`border-2 ${checkedIn ? (checkedOut ? "border-emerald-200 bg-emerald-50/60" : "border-blue-200 bg-blue-50/60") : "border-orange-200 bg-orange-50/60"}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${checkedIn ? (checkedOut ? "bg-emerald-500" : "bg-blue-500") : "bg-orange-400"}`}>
              {checkedOut
                ? <CheckCircle2 className="w-5 h-5 text-white" />
                : checkedIn
                  ? <MapPin className="w-5 h-5 text-white" />
                  : <LogIn className="w-5 h-5 text-white" />
              }
            </div>
            <div>
              <p className="font-semibold text-sm">
                {checkedOut ? "All done for today!" : checkedIn ? "You're checked in" : "Haven't checked in yet"}
              </p>
              <p className="text-xs text-muted-foreground">{today}</p>
              {checkedIn && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  In: <span className="font-medium text-foreground">{fmtTime(record.checkInTime)}</span>
                  {checkedOut && (<> · Out: <span className="font-medium text-foreground">{fmtTime(record.checkOutTime)}</span></>)}
                  {record.checkInMethod === "gps" && (<> · <MapPin className="w-3 h-3 inline text-emerald-600" /> GPS</>)}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!checkedIn && (
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 gap-1.5" onClick={handleCheckIn} disabled={working}>
                {working ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                Check In
              </Button>
            )}
            {checkedIn && !checkedOut && (
              <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 gap-1.5" onClick={handleCheckOut} disabled={working}>
                {working ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOutIcon className="w-3.5 h-3.5" />}
                Check Out
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { session, logout } = useTeacherAuth();
  const [, navigate] = useLocation();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");

  useEffect(() => {
    fetch("/api/teacher/my-classes", { credentials: "include" })
      .then(r => r.json())
      .then(setClasses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { toast } = useToast();
  const [switching, setSwitching] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/teacher-login");
  };

  const handleSwitchToAdmin = async () => {
    setSwitching(true);
    try {
      const res = await fetch("/api/teacher-auth/switch-to-admin", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        toast({ title: "Could not switch to admin view", variant: "destructive" });
        return;
      }
      const { slug, role } = await res.json();
      const dest = role === "finance_officer"
        ? `/school/${slug}/finance`
        : `/school/${slug}/dashboard`;
      navigate(dest);
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setSwitching(false);
    }
  };

  // Derive all unique subjects across all JHS classes this teacher teaches
  const allSubjects = useMemo(() => {
    const subjects = new Set<string>();
    for (const cls of classes) {
      if (cls.mySubjects) {
        for (const s of cls.mySubjects) subjects.add(s);
      }
    }
    return [...subjects].sort();
  }, [classes]);

  // Is this teacher a subject teacher (has JHS subject assignments)?
  const isSubjectTeacher = allSubjects.length > 0;

  // Derive all unique levels
  const allLevels = useMemo(() => {
    const levels = new Set<string>();
    for (const cls of classes) {
      if (cls.level) levels.add(cls.level);
    }
    return [...levels];
  }, [classes]);

  const filtered = useMemo(() => {
    return classes.filter(cls => {
      const matchesSearch = !search ||
        cls.name.toLowerCase().includes(search.toLowerCase()) ||
        (cls.mySubjects ?? []).some((s: string) => s.toLowerCase().includes(search.toLowerCase()));
      const matchesLevel = filterLevel === "all" || cls.level === filterLevel;
      const matchesSubject = filterSubject === "all" ||
        !cls.mySubjects || // homeroom classes always pass subject filter
        (cls.mySubjects ?? []).includes(filterSubject);
      return matchesSearch && matchesLevel && matchesSubject;
    });
  }, [classes, search, filterLevel, filterSubject]);

  const totalStudents = useMemo(() =>
    classes.reduce((sum, cls) => sum + (cls.studentCount ?? 0), 0),
    [classes]
  );

  const hasFilters = search || filterLevel !== "all" || filterSubject !== "all";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm leading-tight">{session?.teacher.name}</p>
                {session?.teacher.adminRole === "head_teacher" && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 border border-violet-200 leading-none">Head Teacher</span>
                )}
                {session?.teacher.adminRole === "finance_officer" && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 leading-none">Finance Officer</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{session?.school?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/change-password")}>
              <Key className="w-4 h-4 mr-1" />Change Password
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" />Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome + summary */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {session?.teacher.name?.split(" ")[0]}</h1>
            <p className="text-muted-foreground text-sm">Select a class to record attendance, enter scores, or view students.</p>
          </div>
          {!loading && classes.length > 0 && (
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 bg-white rounded-lg border shadow-sm">
                <p className="text-2xl font-bold text-primary">{classes.length}</p>
                <p className="text-xs text-muted-foreground">Class{classes.length !== 1 ? "es" : ""} Assigned</p>
              </div>
              <div className="text-center px-4 py-2 bg-white rounded-lg border shadow-sm">
                <p className="text-2xl font-bold text-primary">{totalStudents}</p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </div>
              {allSubjects.length > 0 && (
                <div className="text-center px-4 py-2 bg-white rounded-lg border shadow-sm">
                  <p className="text-2xl font-bold text-primary">{allSubjects.length}</p>
                  <p className="text-xs text-muted-foreground">Subject{allSubjects.length !== 1 ? "s" : ""} Taught</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Admin Access Card (shown when teacher has an admin role) ── */}
        {session?.teacher.adminRole && (
          <div className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${
            session.teacher.adminRole === "head_teacher"
              ? "bg-violet-50 border-violet-200"
              : "bg-emerald-50 border-emerald-200"
          }`}>
            <div>
              <p className={`font-semibold text-sm ${session.teacher.adminRole === "head_teacher" ? "text-violet-800" : "text-emerald-800"}`}>
                {session.teacher.adminRole === "head_teacher" ? "Head Teacher" : "Finance Officer"} — Admin Access
              </p>
              <p className={`text-xs mt-0.5 ${session.teacher.adminRole === "head_teacher" ? "text-violet-600" : "text-emerald-600"}`}>
                {session.teacher.adminRole === "head_teacher"
                  ? "You have access to all school management modules."
                  : "You have access to Finance, Payroll, Feeding and Announcements."}
              </p>
            </div>
            <Button
              size="sm"
              className={session.teacher.adminRole === "head_teacher" ? "bg-violet-600 hover:bg-violet-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
              onClick={handleSwitchToAdmin}
              disabled={switching}
            >
              {switching ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Switching…</> : "Go to Admin View"}
            </Button>
          </div>
        )}

        {/* ── Upcoming Events ── */}
        <UpcomingEventsWidget />

        {/* ── Notifications ── */}
        <NotificationsPanel />

        {/* ── GPS Check In / Out ── */}
        <CheckInCard />

        {/* ── My Timetable ── */}
        {!loading && classes.length > 0 && (
          <TimetableSection isSubjectTeacher={isSubjectTeacher} />
        )}

        {/* Subject summary for JHS teachers */}
        {!loading && allSubjects.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-orange-600" />
              <p className="text-sm font-semibold text-orange-800">Your Subject Assignments (JHS)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {allSubjects.map(subject => {
                const classesForSubject = classes.filter(c => (c.mySubjects ?? []).includes(subject));
                return (
                  <button
                    key={subject}
                    onClick={() => setFilterSubject(filterSubject === subject ? "all" : subject)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      filterSubject === subject
                        ? "bg-orange-600 text-white border-orange-600"
                        : "bg-white text-orange-700 border-orange-300 hover:bg-orange-100"
                    }`}
                  >
                    {subject}
                    <span className="ml-1.5 opacity-75">· {classesForSubject.length} class{classesForSubject.length !== 1 ? "es" : ""}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        {!loading && classes.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search class or subject…"
                className="pl-8 h-9"
              />
            </div>
            {allLevels.length > 1 && (
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-36 h-9">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {allLevels.map(l => (
                    <SelectItem key={l} value={l}>{LEVEL_LABELS[l] ?? l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {allSubjects.length > 0 && (
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-44 h-9">
                  <BookOpen className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {allSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterLevel("all"); setFilterSubject("all"); }} className="text-xs h-9">
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Classes grid */}
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading your classes…</p>
        ) : classes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground">No classes assigned yet.</p>
              <p className="text-sm text-muted-foreground">Ask your school admin to assign you to a class or subject.</p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No classes match your filters.{" "}
            <button className="underline text-primary" onClick={() => { setSearch(""); setFilterLevel("all"); setFilterSubject("all"); }}>
              Clear all
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(cls => {
              const levelColor = LEVEL_COLORS[cls.level ?? "primary"] ?? "bg-gray-100 text-gray-700";
              const cardBorder = LEVEL_CARD_COLORS[cls.level ?? "primary"] ?? "";
              const isJhs = cls.level === "jhs" && cls.mySubjects?.length > 0;

              return (
                <Card
                  key={cls.id}
                  className={`hover:shadow-md transition-all cursor-pointer border-2 ${cardBorder}`}
                  onClick={() => navigate(`/teacher/class/${cls.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">{cls.name}</CardTitle>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border shrink-0 ${levelColor}`}>
                        {LEVEL_LABELS[cls.level ?? "primary"] ?? cls.level}
                      </span>
                    </div>
                    {cls.grade && <p className="text-xs text-muted-foreground">Grade {cls.grade}</p>}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Student count */}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span><span className="font-semibold text-foreground">{cls.studentCount ?? 0}</span> student{cls.studentCount !== 1 ? "s" : ""}</span>
                    </div>

                    {/* JHS subjects this teacher teaches in this class */}
                    {isJhs ? (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Teaching in this class:</p>
                        <div className="flex flex-wrap gap-1">
                          {cls.mySubjects.map((s: string) => (
                            <Badge key={s} variant="secondary" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Homeroom teacher</span>
                      </div>
                    )}

                    <Button variant="outline" size="sm" className="w-full gap-1 text-xs mt-1">
                      <Users className="w-3 h-3" />Open Class
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Subject × Class breakdown table for JHS teachers */}
        {!loading && allSubjects.length > 0 && (
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b bg-slate-50 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-600" />
              <p className="text-sm font-semibold text-slate-700">Subject × Class Overview</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50/60">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Subject</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Classes</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allSubjects.map(subject => {
                    const subjectClasses = classes.filter(c => (c.mySubjects ?? []).includes(subject));
                    const subjectStudents = subjectClasses.reduce((sum, c) => sum + (c.studentCount ?? 0), 0);
                    return (
                      <tr key={subject} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium">{subject}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {subjectClasses.map(c => (
                              <button
                                key={c.id}
                                onClick={() => navigate(`/teacher/class/${c.id}`)}
                                className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 transition-colors"
                              >
                                {c.name}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-primary">{subjectStudents}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
