import { useSchoolId } from "@/lib/school-hooks";
import { useEffect, useState, useRef } from "react";
import { SchoolAdminLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { TrendingUp, Users, ChevronDown, ChevronUp, Loader2, User, Search, X } from "lucide-react";

interface Props { params: { schoolSlug: string } }

interface SubjectStat {
  subject: string;
  avgScore: number | null;
  scoredCount: number;
  passRate: number | null;
}
interface ClassStat {
  classId: number; className: string; level: string; teacherName: string | null;
  totalStudents: number; scoredStudents: number; totalScoreRows: number;
  avgScore: number | null; passRate: number | null;
  gradeDistribution: Record<string, number>;
  subjectBreakdown: SubjectStat[];
  subjectTeachers: Record<string, string>;
}
interface StudentPerfData {
  summary: {
    totalScoredStudents: number;
    schoolAvg: number | null;
    schoolPassRate: number | null;
    totalScoreRows: number;
    classCount: number;
  };
  filterOptions: {
    years: string[];
    terms: string[];
    subjects: string[];
    classes: { id: number; name: string; level: string }[];
    students: { id: number; name: string; classId: number | null; className: string }[];
  };
  classes: ClassStat[];
}
interface ScoreRow {
  id: number; subject: string; term: string; academicYear: string;
  score: number | null; grade: string | null;
  classWork: number | null; classTest: number | null;
  homework: number | null; projectWork: number | null; examScore: number | null;
  remarks: string | null;
}
interface StudentDetail {
  student: { id: number; name: string; studentNumber: string; className: string };
  scores: ScoreRow[];
  summary: { avgScore: number | null; passRate: number | null; totalSubjects: number; totalScores: number };
}
interface TeacherStat {
  teacherId: number; teacherName: string; status: string;
  classes: string[]; subjectsTaught: string[];
  totalStudents: number; scoredStudents: number; scoresEntered: number;
  avgScore: number | null; passRate: number | null; scoreEntryRate: number | null;
  presentDays: number; totalDays: number; attendanceRate: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<string, string> = { nursery: "Nursery", kg: "KG", primary: "Primary", jhs: "JHS" };
const LEVEL_COLORS: Record<string, string> = {
  nursery: "bg-pink-100 text-pink-700", kg: "bg-purple-100 text-purple-700",
  primary: "bg-blue-100 text-blue-700", jhs: "bg-orange-100 text-orange-700",
};
const GRADE_ORDER = ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"];
const GRADE_COLORS: Record<string, string> = {
  A1: "#22c55e", B2: "#3b82f6", B3: "#60a5fa", C4: "#eab308",
  C5: "#fbbf24", C6: "#f59e0b", D7: "#f97316", E8: "#ef4444", F9: "#dc2626",
};

function scoreColor(s: number | null): string {
  if (s === null) return "text-muted-foreground";
  if (s >= 70) return "text-green-600";
  if (s >= 50) return "text-yellow-600";
  return "text-red-600";
}

function scoreBg(s: number | null): string {
  if (s === null) return "bg-slate-100 text-slate-500";
  if (s >= 70) return "bg-green-100 text-green-700";
  if (s >= 50) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function GradeBar({ dist }: { dist: Record<string, number> }) {
  const total = GRADE_ORDER.reduce((sum, g) => sum + (dist[g] || 0), 0);
  if (total === 0) return <span className="text-xs text-muted-foreground">No grades yet</span>;
  const visible = GRADE_ORDER.filter(g => dist[g]);
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-2.5 rounded-full overflow-hidden min-w-[80px] flex-1 max-w-[100px]">
        {visible.map(g => (
          <div key={g} style={{ background: GRADE_COLORS[g], flex: dist[g] }} title={`${g}: ${dist[g]}`} />
        ))}
      </div>
      <div className="flex gap-1 flex-wrap">
        {visible.slice(0, 4).map(g => (
          <span
            key={g}
            className="text-[10px] px-1.5 rounded font-medium"
            style={{ background: GRADE_COLORS[g] + "28", color: GRADE_COLORS[g] }}
          >
            {g}: {dist[g]}
          </span>
        ))}
        {visible.length > 4 && <span className="text-[10px] text-muted-foreground">+{visible.length - 4}</span>}
      </div>
    </div>
  );
}

function teacherStatus(t: TeacherStat): { label: string; cls: string } {
  if (t.avgScore === null) return { label: "No Data", cls: "bg-slate-100 text-slate-600" };
  if (t.avgScore >= 65 && (t.passRate ?? 0) >= 65) return { label: "Strong", cls: "bg-green-100 text-green-700" };
  if (t.avgScore >= 50 && (t.passRate ?? 0) >= 50) return { label: "Good", cls: "bg-blue-100 text-blue-700" };
  return { label: "Needs Attention", cls: "bg-amber-100 text-amber-700" };
}

const curr = new Date().getFullYear();
const DEFAULT_YEAR = new Date().getMonth() >= 8 ? `${curr}/${curr + 1}` : `${curr - 1}/${curr}`;
const YEAR_OPTIONS = [`${curr - 2}/${curr - 1}`, `${curr - 1}/${curr}`, `${curr}/${curr + 1}`];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InsightsPage({ params }: Props) {
  const { schoolSlug } = params;
  const schoolId = useSchoolId();
  const [tab, setTab] = useState("students");
  const [yearFilter, setYearFilter] = useState(DEFAULT_YEAR);
  const [termFilter, setTermFilter] = useState("1");
  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [studentData, setStudentData] = useState<StudentPerfData | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [teacherData, setTeacherData] = useState<TeacherStat[]>([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());
  // Student individual filter
  const [studentFilter, setStudentFilter] = useState("all");
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const studentPickerRef = useRef<HTMLDivElement>(null);
  // Teacher filter
  const [teacherFilter, setTeacherFilter] = useState("all");

  useEffect(() => {
    if (!schoolId) return;
    setStudentLoading(true);
    const p = new URLSearchParams();
    if (yearFilter !== "all") p.set("academicYear", yearFilter);
    if (termFilter !== "all") p.set("term", termFilter);
    if (classFilter !== "all") p.set("classId", classFilter);
    if (subjectFilter !== "all") p.set("subject", subjectFilter);
    fetch(`/api/schools/${schoolId}/insights/student-performance?${p}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setStudentData(d))
      .catch(() => {})
      .finally(() => setStudentLoading(false));
  }, [schoolId, yearFilter, termFilter, classFilter, subjectFilter]);

  useEffect(() => {
    if (tab !== "teachers" || !schoolId) return;
    setTeacherLoading(true);
    const p = new URLSearchParams();
    if (yearFilter !== "all") p.set("academicYear", yearFilter);
    if (termFilter !== "all") p.set("term", termFilter);
    fetch(`/api/schools/${schoolId}/insights/teacher-performance?${p}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setTeacherData(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setTeacherLoading(false));
  }, [tab, schoolId, yearFilter, termFilter]);

  // Fetch individual student detail when studentFilter is set
  useEffect(() => {
    if (studentFilter === "all" || !schoolId) { setStudentDetail(null); return; }
    setStudentDetailLoading(true);
    const p = new URLSearchParams({ studentId: studentFilter });
    if (yearFilter !== "all") p.set("academicYear", yearFilter);
    if (termFilter !== "all") p.set("term", termFilter);
    fetch(`/api/schools/${schoolId}/insights/student-detail?${p}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setStudentDetail(d))
      .catch(() => setStudentDetail(null))
      .finally(() => setStudentDetailLoading(false));
  }, [studentFilter, schoolId, yearFilter, termFilter]);

  // Close student picker dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (studentPickerRef.current && !studentPickerRef.current.contains(e.target as Node)) {
        setStudentPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggleClass(id: number) {
    setExpandedClasses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const summary = studentData?.summary;
  const filterOpts = studentData?.filterOptions;
  const allClasses = studentData?.classes ?? [];
  const filteredClasses = classFilter !== "all"
    ? allClasses.filter(c => c.classId === parseInt(classFilter))
    : allClasses;
  const dbYears = filterOpts?.years ?? [];
  const allYears = dbYears.length > 0 ? dbYears : YEAR_OPTIONS;

  // Student picker: search-filtered list
  const allStudentOptions = filterOpts?.students ?? [];
  const filteredStudentOptions = studentSearch.trim()
    ? allStudentOptions.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
    : allStudentOptions;
  const selectedStudentName = allStudentOptions.find(s => String(s.id) === studentFilter)?.name ?? null;

  // Teacher filter: filter loaded teacher data client-side
  const visibleTeachers = teacherFilter === "all"
    ? teacherData
    : teacherData.filter(t => String(t.teacherId) === teacherFilter);

  // Auto-select most recent year from DB if our default isn't in the list
  useEffect(() => {
    if (dbYears.length > 0 && !dbYears.includes(yearFilter)) {
      setYearFilter(dbYears[0]);
    }
  }, [dbYears.join(",")]); // eslint-disable-line

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      <div className="space-y-5">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />Performance Insights
          </h1>
          <p className="text-muted-foreground text-sm">Aggregate student and teacher performance analytics by class, term, and subject.</p>
        </div>

        {/* Shared filters row */}
        <div className="flex flex-wrap gap-2 items-center bg-white border rounded-lg px-3 py-2 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium">Filter:</span>
          <Select value={yearFilter} onValueChange={v => { setYearFilter(v); setClassFilter("all"); setSubjectFilter("all"); setStudentFilter("all"); }}>
            <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {allYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={termFilter} onValueChange={v => { setTermFilter(v); }}>
            <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              <SelectItem value="1">Term 1</SelectItem>
              <SelectItem value="2">Term 2</SelectItem>
              <SelectItem value="3">Term 3</SelectItem>
            </SelectContent>
          </Select>

          {tab === "students" && (
            <>
              <Select value={classFilter} onValueChange={v => { setClassFilter(v); setStudentFilter("all"); setStudentSearch(""); }}>
                <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {(filterOpts?.classes ?? []).map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(filterOpts?.subjects ?? []).length > 0 && studentFilter === "all" && (
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-44 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {(filterOpts?.subjects ?? []).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {/* Student picker */}
              {allStudentOptions.length > 0 && (
                <div className="relative" ref={studentPickerRef}>
                  <button
                    type="button"
                    onClick={() => { setStudentPickerOpen(v => !v); setStudentSearch(""); }}
                    className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-sm transition-colors ${
                      studentFilter !== "all"
                        ? "bg-blue-50 border-blue-300 text-blue-800 font-medium"
                        : "bg-white border-input text-muted-foreground hover:bg-slate-50"
                    }`}
                  >
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="max-w-[120px] truncate">
                      {selectedStudentName ?? "All Students"}
                    </span>
                    {studentFilter !== "all" && (
                      <span
                        role="button"
                        className="ml-1 hover:text-red-500"
                        onClick={e => { e.stopPropagation(); setStudentFilter("all"); setStudentSearch(""); setStudentPickerOpen(false); }}
                      ><X className="w-3 h-3" /></span>
                    )}
                  </button>

                  {studentPickerOpen && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white border rounded-lg shadow-lg w-64 overflow-hidden">
                      <div className="p-2 border-b">
                        <div className="flex items-center gap-1.5 px-2 rounded-md border bg-slate-50">
                          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <Input
                            value={studentSearch}
                            onChange={e => setStudentSearch(e.target.value)}
                            placeholder="Search student…"
                            className="h-7 border-0 bg-transparent text-sm focus-visible:ring-0 px-0"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-52 overflow-y-auto">
                        {filteredStudentOptions.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">No students found</p>
                        ) : filteredStudentOptions.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => { setStudentFilter(String(s.id)); setStudentPickerOpen(false); setStudentSearch(""); }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between gap-2 ${
                              String(s.id) === studentFilter ? "bg-blue-50 text-blue-800 font-medium" : ""
                            }`}
                          >
                            <span className="truncate">{s.name}</span>
                            {s.className && <span className="text-xs text-muted-foreground shrink-0">{s.className}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {tab === "teachers" && teacherData.length > 0 && (
            <Select value={teacherFilter} onValueChange={setTeacherFilter}>
              <SelectTrigger className="w-48 h-8 text-sm">
                <SelectValue placeholder="All Teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teachers</SelectItem>
                {teacherData.map(t => (
                  <SelectItem key={t.teacherId} value={String(t.teacherId)}>{t.teacherName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full max-w-sm">
            <TabsTrigger value="students" className="flex-1 gap-1.5">
              Student Performance
            </TabsTrigger>
            <TabsTrigger value="teachers" className="flex-1 gap-1.5">
              Teacher Performance
            </TabsTrigger>
          </TabsList>

          {/* ────────────── STUDENT PERFORMANCE TAB ────────────── */}
          <TabsContent value="students" className="mt-4 space-y-4">

            {/* KPI summary row — only show when no individual student selected */}
            {studentFilter === "all" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card><CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Students Scored</p>
                  <p className="text-2xl font-bold">{summary?.totalScoredStudents ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{summary?.totalScoreRows ?? 0} entries total</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground mb-0.5">School Average</p>
                  <p className={`text-2xl font-bold ${scoreColor(summary?.schoolAvg ?? null)}`}>
                    {summary?.schoolAvg != null ? `${summary.schoolAvg}%` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">across all subjects</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground mb-0.5">School Pass Rate</p>
                  <p className={`text-2xl font-bold ${scoreColor(summary?.schoolPassRate ?? null)}`}>
                    {summary?.schoolPassRate != null ? `${summary.schoolPassRate}%` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">scored ≥ 50</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Classes Analysed</p>
                  <p className="text-2xl font-bold">{filteredClasses.filter(c => c.totalScoreRows > 0).length}</p>
                  <p className="text-xs text-muted-foreground">of {summary?.classCount ?? "—"} total</p>
                </CardContent></Card>
              </div>
            )}

            {/* Individual student detail view */}
            {studentFilter !== "all" && (
              <div className="space-y-4">
                {studentDetailLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !studentDetail ? (
                  <Card><CardContent className="py-10 text-center text-muted-foreground">
                    No score data found for this student with the selected filters.
                  </CardContent></Card>
                ) : (
                  <>
                    {/* Student header card */}
                    <Card className="border-blue-200 bg-blue-50/40">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-bold text-lg leading-tight">{studentDetail.student.name}</p>
                              <p className="text-sm text-muted-foreground">{studentDetail.student.className} · #{studentDetail.student.studentNumber}</p>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Avg Score</p>
                              <p className={`text-2xl font-bold ${scoreColor(studentDetail.summary.avgScore)}`}>
                                {studentDetail.summary.avgScore !== null ? `${studentDetail.summary.avgScore}%` : "—"}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Pass Rate</p>
                              <p className={`text-2xl font-bold ${scoreColor(studentDetail.summary.passRate)}`}>
                                {studentDetail.summary.passRate !== null ? `${studentDetail.summary.passRate}%` : "—"}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Subjects</p>
                              <p className="text-2xl font-bold">{studentDetail.summary.totalSubjects}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Scores table */}
                    {studentDetail.scores.length === 0 ? (
                      <Card><CardContent className="py-10 text-center text-muted-foreground">No scores recorded yet.</CardContent></Card>
                    ) : (
                      <Card>
                        <CardContent className="pt-4 pb-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Score Breakdown</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b text-muted-foreground text-xs">
                                  <th className="text-left pb-2 font-medium">Subject</th>
                                  <th className="text-center pb-2 font-medium">Term</th>
                                  <th className="text-center pb-2 font-medium">Year</th>
                                  <th className="text-right pb-2 font-medium">CW</th>
                                  <th className="text-right pb-2 font-medium">CT</th>
                                  <th className="text-right pb-2 font-medium">HW</th>
                                  <th className="text-right pb-2 font-medium">PW</th>
                                  <th className="text-right pb-2 font-medium">Exam</th>
                                  <th className="text-right pb-2 font-medium">Total</th>
                                  <th className="text-right pb-2 font-medium">Grade</th>
                                </tr>
                              </thead>
                              <tbody>
                                {studentDetail.scores.map(sc => (
                                  <tr key={sc.id} className="border-b last:border-0 hover:bg-slate-50/60">
                                    <td className="py-2 font-medium">{sc.subject}</td>
                                    <td className="py-2 text-center text-muted-foreground">Tm {sc.term}</td>
                                    <td className="py-2 text-center text-muted-foreground text-xs">{sc.academicYear}</td>
                                    <td className="py-2 text-right text-muted-foreground">{sc.classWork ?? "—"}</td>
                                    <td className="py-2 text-right text-muted-foreground">{sc.classTest ?? "—"}</td>
                                    <td className="py-2 text-right text-muted-foreground">{sc.homework ?? "—"}</td>
                                    <td className="py-2 text-right text-muted-foreground">{sc.projectWork ?? "—"}</td>
                                    <td className="py-2 text-right text-muted-foreground">{sc.examScore ?? "—"}</td>
                                    <td className={`py-2 text-right font-bold ${scoreColor(sc.score)}`}>
                                      {sc.score !== null ? `${sc.score}` : "—"}
                                    </td>
                                    <td className="py-2 text-right">
                                      {sc.grade ? (
                                        <span
                                          className="text-xs px-1.5 py-0.5 rounded font-medium"
                                          style={{ background: (GRADE_COLORS[sc.grade] ?? "#94a3b8") + "28", color: GRADE_COLORS[sc.grade] ?? "#64748b" }}
                                        >{sc.grade}</span>
                                      ) : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">CW = Class Work · CT = Class Test · HW = Homework · PW = Project Work</p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Class aggregate view (when no student selected) */}
            {studentFilter === "all" && (
            <>
            {/* Loading */}
            {studentLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredClasses.length === 0 ? (
              <Card><CardContent className="py-14 text-center">
                <TrendingUp className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No data for the selected filters.</p>
                <p className="text-xs text-muted-foreground mt-1">Adjust the year, term, or class filters above.</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {filteredClasses.map(cls => {
                  const expanded = expandedClasses.has(cls.classId);
                  const hasData = cls.totalScoreRows > 0;
                  const coverageRate = cls.totalStudents > 0 ? Math.round((cls.scoredStudents / cls.totalStudents) * 100) : 0;

                  return (
                    <Card key={cls.classId} className={`transition-opacity ${!hasData ? "opacity-70" : ""}`}>
                      <CardContent className="pt-4 pb-3">

                        {/* Class header */}
                        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-base">{cls.className}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[cls.level] ?? "bg-slate-100 text-slate-700"}`}>
                              {LEVEL_LABELS[cls.level] ?? cls.level}
                            </span>
                            {cls.teacherName && (
                              <span className="text-xs text-muted-foreground">· {cls.teacherName}</span>
                            )}
                          </div>
                          {cls.subjectBreakdown.length > 0 && (
                            <Button
                              variant="ghost" size="sm"
                              className="h-7 text-xs gap-1 shrink-0"
                              onClick={() => toggleClass(cls.classId)}
                            >
                              {expanded
                                ? <><ChevronUp className="w-3.5 h-3.5" />Hide Subjects</>
                                : <><ChevronDown className="w-3.5 h-3.5" />Subjects ({cls.subjectBreakdown.length})</>
                              }
                            </Button>
                          )}
                        </div>

                        {/* Metrics grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Avg Score</p>
                            {cls.avgScore !== null ? (
                              <>
                                <p className={`text-xl font-bold leading-none ${scoreColor(cls.avgScore)}`}>{cls.avgScore}%</p>
                                <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${cls.avgScore >= 70 ? "bg-green-500" : cls.avgScore >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                                    style={{ width: `${cls.avgScore}%` }}
                                  />
                                </div>
                              </>
                            ) : <p className="text-xl font-bold text-muted-foreground">—</p>}
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Pass Rate</p>
                            {cls.passRate !== null ? (
                              <>
                                <p className={`text-xl font-bold leading-none ${scoreColor(cls.passRate)}`}>{cls.passRate}%</p>
                                <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${cls.passRate >= 70 ? "bg-green-500" : cls.passRate >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                                    style={{ width: `${cls.passRate}%` }}
                                  />
                                </div>
                              </>
                            ) : <p className="text-xl font-bold text-muted-foreground">—</p>}
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Students Scored</p>
                            <p className="text-base font-semibold">{cls.scoredStudents} <span className="text-sm font-normal text-muted-foreground">/ {cls.totalStudents}</span></p>
                            <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${coverageRate}%` }} />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{coverageRate}% coverage</p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Grade Distribution</p>
                            {hasData
                              ? <GradeBar dist={cls.gradeDistribution} />
                              : <span className="text-sm text-muted-foreground">No scores entered</span>
                            }
                          </div>
                        </div>

                        {/* Subject breakdown (expandable) */}
                        {expanded && cls.subjectBreakdown.length > 0 && (
                          <div className="border-t mt-4 pt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Subject Breakdown</p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b text-muted-foreground text-xs">
                                    <th className="text-left pb-2 font-medium">Subject</th>
                                    <th className="text-right pb-2 font-medium">Entries</th>
                                    <th className="text-right pb-2 font-medium">Avg Score</th>
                                    <th className="text-right pb-2 font-medium">Pass Rate</th>
                                    {Object.keys(cls.subjectTeachers).length > 0 && (
                                      <th className="text-right pb-2 font-medium">Teacher</th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {cls.subjectBreakdown.map(sb => (
                                    <tr key={sb.subject} className="border-b last:border-0">
                                      <td className="py-2 font-medium">{sb.subject}</td>
                                      <td className="text-right py-2 text-muted-foreground">{sb.scoredCount}</td>
                                      <td className={`text-right py-2 font-semibold ${scoreColor(sb.avgScore)}`}>
                                        {sb.avgScore !== null ? `${sb.avgScore}%` : "—"}
                                      </td>
                                      <td className={`text-right py-2 ${scoreColor(sb.passRate)}`}>
                                        {sb.passRate !== null ? `${sb.passRate}%` : "—"}
                                      </td>
                                      {Object.keys(cls.subjectTeachers).length > 0 && (
                                        <td className="text-right py-2 text-xs text-muted-foreground">
                                          {cls.subjectTeachers[sb.subject] ?? "—"}
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            </>
            )}
          </TabsContent>

          {/* ────────────── TEACHER PERFORMANCE TAB ────────────── */}
          <TabsContent value="teachers" className="mt-4 space-y-3">
            {teacherLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : visibleTeachers.length === 0 ? (
              <Card><CardContent className="py-14 text-center">
                <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">{teacherFilter !== "all" ? "No data for selected teacher." : "No teacher data available."}</p>
              </CardContent></Card>
            ) : (
              visibleTeachers.map(t => {
                const status = teacherStatus(t);
                const coveragePct = t.totalStudents > 0
                  ? Math.round((t.scoredStudents / t.totalStudents) * 100) : 0;

                return (
                  <Card key={t.teacherId}>
                    <CardContent className="pt-4 pb-3">
                      {/* Teacher header */}
                      <div className="flex items-start justify-between gap-2 flex-wrap mb-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-base">{t.teacherName}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>
                              {status.label}
                            </span>
                            {t.status !== "active" && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {t.classes.slice(0, 5).map(c => (
                              <span key={c} className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{c}</span>
                            ))}
                            {t.classes.length > 5 && (
                              <span className="text-xs text-muted-foreground">+{t.classes.length - 5} more</span>
                            )}
                            {t.subjectsTaught.slice(0, 3).map(s => (
                              <span key={s} className="text-xs bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-100">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">Students</p>
                          <p className="text-2xl font-bold">{t.totalStudents}</p>
                        </div>
                      </div>

                      {/* Metrics grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {/* Avg score */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Avg Student Score</p>
                          {t.avgScore !== null ? (
                            <>
                              <p className={`text-xl font-bold leading-none ${scoreColor(t.avgScore)}`}>{t.avgScore}%</p>
                              <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${t.avgScore >= 70 ? "bg-green-500" : t.avgScore >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                                  style={{ width: `${t.avgScore}%` }}
                                />
                              </div>
                            </>
                          ) : <p className="text-xl font-bold text-muted-foreground">—</p>}
                        </div>

                        {/* Pass rate */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Pass Rate</p>
                          {t.passRate !== null ? (
                            <>
                              <p className={`text-xl font-bold leading-none ${scoreColor(t.passRate)}`}>{t.passRate}%</p>
                              <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${t.passRate >= 70 ? "bg-green-500" : t.passRate >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                                  style={{ width: `${t.passRate}%` }}
                                />
                              </div>
                            </>
                          ) : <p className="text-xl font-bold text-muted-foreground">—</p>}
                        </div>

                        {/* Score entry rate */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Scores Entered</p>
                          <p className="font-semibold text-sm">
                            {t.scoredStudents}
                            <span className="text-xs font-normal text-muted-foreground"> / {t.totalStudents} students</span>
                          </p>
                          <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${coveragePct}%` }} />
                          </div>
                          {t.scoreEntryRate !== null && (
                            <p className={`text-[10px] mt-0.5 ${t.scoreEntryRate >= 80 ? "text-green-600" : t.scoreEntryRate >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                              {t.scoreEntryRate}% entry rate
                            </p>
                          )}
                        </div>

                        {/* Attendance */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Teacher Attendance</p>
                          {t.totalDays > 0 ? (
                            <>
                              <p className={`text-xl font-bold leading-none ${scoreColor(t.attendanceRate)}`}>{t.attendanceRate}%</p>
                              <p className="text-xs text-muted-foreground mt-1">{t.presentDays} present / {t.totalDays} days</p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">No check-in records</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SchoolAdminLayout>
  );
}
