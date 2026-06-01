import { useEffect, useState, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { useTeacherAuth } from "@/lib/teacher-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Printer, Plus, Trash2, Save, Eye, Edit2, CheckCircle2, User } from "lucide-react";
import {
  GRADE_INFO, COMPONENTS, type ComponentKey,
  computeGrade, ordinal,
} from "./report-utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScoreRow {
  _key: string;
  serverId: number | null;
  subject: string;
  classWork: string;
  classTest: string;
  homework: string;
  projectWork: string;
  examScore: string;
  total: number | null;
  grade: string | null;
  remarks: string;
  saved: boolean;
}

function calcTotal(row: Partial<ScoreRow>): number | null {
  const vals = COMPONENTS.map(c => {
    const v = parseFloat((row as any)[c.key] ?? "");
    return isNaN(v) ? null : Math.min(v, c.max);
  });
  if (vals.every(v => v === null)) return null;
  return vals.reduce<number>((s, v) => s + (v ?? 0), 0);
}

function makeEmptyRow(subject = ""): ScoreRow {
  return {
    _key: `new-${Date.now()}-${Math.random()}`,
    serverId: null, subject,
    classWork: "", classTest: "", homework: "", projectWork: "", examScore: "",
    total: null, grade: null, remarks: "", saved: false,
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  params: { classId: string; studentId: string };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentReport({ params }: Props) {
  const { classId, studentId } = params;
  const { session } = useTeacherAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const sp = new URLSearchParams(search);

  const currentYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  const [term, setTerm] = useState(sp.get("term") ?? "1");
  const [academicYear, setAcademicYear] = useState(sp.get("year") ?? currentYear);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  const [student, setStudent] = useState<any>(null);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [report, setReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teacherRemarks, setTeacherRemarks] = useState("");

  useEffect(() => {
    fetch(`/api/teacher/my-students?classId=${classId}`, { credentials: "include" })
      .then(r => r.json())
      .then((list: any[]) => setStudent(list.find(s => String(s.id) === studentId) ?? null));
  }, [classId, studentId]);

  useEffect(() => {
    fetch("/api/teacher/my-classes", { credentials: "include" })
      .then(r => r.json())
      .then((cls: any[]) => setClassInfo(cls.find(c => String(c.id) === classId) ?? null));
  }, [classId]);

  const loadScores = useCallback(() => {
    if (!term || !academicYear) return;
    const url = `/api/teacher/scores?classId=${classId}&term=${term}&academicYear=${encodeURIComponent(academicYear)}`;
    fetch(url, { credentials: "include" })
      .then(r => r.json())
      .then((all: any[]) => {
        const mine = all.filter(s => String(s.studentId) === studentId);
        if (mine.length > 0) {
          setRows(mine.map(s => ({
            _key: String(s.id),
            serverId: s.id,
            subject: s.subject,
            classWork:   s.classWork   !== null ? String(s.classWork)   : "",
            classTest:   s.classTest   !== null ? String(s.classTest)   : "",
            homework:    s.homework    !== null ? String(s.homework)    : "",
            projectWork: s.projectWork !== null ? String(s.projectWork) : "",
            examScore:   s.examScore   !== null ? String(s.examScore)   : "",
            total: s.score !== null ? Number(s.score) : null,
            grade: s.grade,
            remarks: s.remarks ?? "",
            saved: true,
          })));
        } else {
          const subs: string[] = classInfo?.mySubjects ?? [];
          setRows(subs.length > 0 ? subs.map(makeEmptyRow) : [makeEmptyRow()]);
        }
      })
      .catch(() => {});
  }, [classId, studentId, term, academicYear, classInfo]);

  useEffect(() => { loadScores(); }, [loadScores]);

  const loadReport = useCallback(() => {
    const schoolId = session?.teacher?.schoolId;
    if (!schoolId) return;
    setLoadingReport(true);
    fetch(
      `/api/schools/${schoolId}/students/${studentId}/report?term=${term}&academicYear=${encodeURIComponent(academicYear)}`,
      { credentials: "include" }
    )
      .then(r => r.json())
      .then(data => {
        setReport(data);
        if (data.teacherRemarks !== undefined) setTeacherRemarks(data.teacherRemarks ?? "");
      })
      .catch(() => setReport(null))
      .finally(() => setLoadingReport(false));
  }, [session, studentId, term, academicYear]);

  // Load existing teacher remarks when term/year changes (edit mode)
  useEffect(() => {
    const schoolId = session?.teacher?.schoolId;
    if (!schoolId || !term || !academicYear) return;
    fetch(
      `/api/schools/${schoolId}/students/${studentId}/report?term=${term}&academicYear=${encodeURIComponent(academicYear)}`,
      { credentials: "include" }
    )
      .then(r => r.json())
      .then(data => { if (data.teacherRemarks !== undefined) setTeacherRemarks(data.teacherRemarks ?? ""); })
      .catch(() => {});
  }, [session, studentId, term, academicYear]);

  const updateField = (key: string, field: ComponentKey | "subject" | "remarks", value: string) => {
    setRows(prev => prev.map(r => {
      if (r._key !== key) return r;
      const updated: ScoreRow = { ...r, [field]: value, saved: false };
      if (field !== "subject" && field !== "remarks") {
        const total = calcTotal(updated);
        updated.total = total;
        if (total !== null) {
          const g = computeGrade(total);
          updated.grade = g.grade;
          if (!r.remarks || r.remarks === (r.grade ? GRADE_INFO[r.grade]?.label : "")) {
            updated.remarks = g.remarks;
          }
        } else {
          updated.grade = null;
        }
      }
      return updated;
    }));
  };

  const clampField = (key: string, field: ComponentKey, max: number) => {
    setRows(prev => prev.map(r => {
      if (r._key !== key) return r;
      const raw = (r as any)[field];
      if (raw === "" || raw === undefined) return r;
      const v = parseFloat(raw);
      if (isNaN(v)) return { ...r, [field]: "", saved: false };
      const clamped = Math.max(0, Math.min(v, max));
      if (clamped === v) return r;
      const updated: ScoreRow = { ...r, [field]: String(clamped), saved: false };
      const total = calcTotal(updated);
      updated.total = total;
      if (total !== null) {
        const g = computeGrade(total);
        updated.grade = g.grade;
        if (!r.remarks || r.remarks === (r.grade ? GRADE_INFO[r.grade]?.label : "")) {
          updated.remarks = g.remarks;
        }
      } else {
        updated.grade = null;
      }
      return updated;
    }));
  };

  const isOverMax = (row: ScoreRow, key: ComponentKey, max: number): boolean => {
    const v = parseFloat((row as any)[key] ?? "");
    return !isNaN(v) && (v > max || v < 0);
  };

  const addRow = () => setRows(prev => [...prev, makeEmptyRow()]);

  const removeRow = async (row: ScoreRow) => {
    if (row.serverId) {
      await fetch(`/api/teacher/scores/${row.serverId}`, { method: "DELETE", credentials: "include" });
    }
    setRows(prev => prev.filter(r => r._key !== row._key));
  };

  const handleSaveAll = async (): Promise<boolean> => {
    const toSave = rows.filter(r => r.subject.trim() !== "");
    if (toSave.length === 0) {
      toast({ title: "Nothing to save", description: "Add at least one subject." });
      return false;
    }
    // Block save if any score exceeds its component max or is negative
    const overLimit = toSave.some(row =>
      COMPONENTS.some(c => isOverMax(row, c.key as ComponentKey, c.max))
    );
    if (overLimit) {
      toast({
        variant: "destructive",
        title: "Invalid scores",
        description: "One or more scores exceed the allowed maximum. Please correct them before saving.",
      });
      return false;
    }
    setSaving(true);
    let errors = 0;
    const updated = [...rows];
    for (const row of toSave) {
      try {
        const res = await fetch("/api/teacher/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            studentId: parseInt(studentId),
            classId: parseInt(classId),
            subject: row.subject.trim(),
            term, academicYear,
            classWork:   row.classWork   !== "" ? parseFloat(row.classWork)   : undefined,
            classTest:   row.classTest   !== "" ? parseFloat(row.classTest)   : undefined,
            homework:    row.homework    !== "" ? parseFloat(row.homework)    : undefined,
            projectWork: row.projectWork !== "" ? parseFloat(row.projectWork) : undefined,
            examScore:   row.examScore   !== "" ? parseFloat(row.examScore)   : undefined,
            remarks: row.remarks || undefined,
          }),
        });
        if (res.ok) {
          const saved = await res.json();
          const i = updated.findIndex(r => r._key === row._key);
          if (i !== -1) {
            updated[i] = {
              ...updated[i], serverId: saved.id, saved: true,
              grade: saved.grade,
              remarks: saved.remarks ?? updated[i].remarks,
              total: saved.score !== null ? Number(saved.score) : null,
            };
          }
        } else { errors++; }
      } catch { errors++; }
    }
    setRows(updated);

    // Save teacher remarks
    const schoolId = session?.teacher?.schoolId;
    if (schoolId) {
      await fetch("/api/teacher/report-remarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ studentId: parseInt(studentId), term, academicYear, teacherRemarks }),
      }).catch(() => {});
    }

    setSaving(false);
    if (errors === 0) { toast({ title: "All scores saved successfully" }); return true; }
    toast({ variant: "destructive", title: `${errors} score(s) failed to save` });
    return false;
  };

  const handlePreview = async () => {
    if (rows.some(r => !r.saved && r.subject.trim() !== "")) await handleSaveAll();
    loadReport();
    setMode("preview");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="print:hidden bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm"
            onClick={() => navigate(`/teacher/class/${classId}?term=${term}&year=${encodeURIComponent(academicYear)}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{student?.name ?? "Student"}</p>
            <p className="text-xs text-muted-foreground">Term {term} · {academicYear}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {mode === "edit" ? (
              <>
                <Button variant="outline" size="sm" onClick={handlePreview} className="gap-1.5">
                  <Eye className="w-3.5 h-3.5" />Preview
                </Button>
                <Button size="sm" onClick={handleSaveAll} disabled={saving} className="gap-1.5">
                  <Save className="w-3.5 h-3.5" />{saving ? "Saving…" : "Save All"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setMode("edit")} className="gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" />Edit Scores
                </Button>
                <Button size="sm" onClick={() => window.print()} className="gap-1.5">
                  <Printer className="w-3.5 h-3.5" />Print
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* EDIT MODE */}
      {mode === "edit" && (
        <main className="max-w-6xl mx-auto px-4 py-6 space-y-5 print:hidden">
          {student && (
            <div className="bg-white rounded-xl border p-4 flex items-start gap-4">
              {/* Passport photo */}
              <div className="shrink-0">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    className="w-16 h-20 object-cover rounded-lg border shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-20 rounded-lg border bg-muted flex items-center justify-center text-muted-foreground">
                    <User className="w-7 h-7 opacity-40" />
                  </div>
                )}
              </div>
              {/* Student info */}
              <div className="flex flex-wrap gap-x-8 gap-y-1.5 text-sm flex-1">
                <div><span className="text-muted-foreground">Name: </span><strong>{student.name}</strong></div>
                <div><span className="text-muted-foreground">ID: </span><span className="font-mono text-xs">{student.studentNumber}</span></div>
                {student.gender && <div><span className="text-muted-foreground">Gender: </span><span className="capitalize">{student.gender}</span></div>}
                {student.className && <div><span className="text-muted-foreground">Class: </span>{student.className}</div>}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Term</p>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Term 1</SelectItem>
                  <SelectItem value="2">Term 2</SelectItem>
                  <SelectItem value="3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Academic Year</p>
              <Input className="w-36" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center">
              <h2 className="font-medium text-sm flex-1">Score Entry</h2>
              <div className="flex gap-3 text-xs text-muted-foreground">
                {COMPONENTS.map(c => <span key={c.key}><strong>{c.abbr}</strong>/{c.max}</span>)}
                <span className="font-semibold text-foreground">Total/100</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[820px]">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Subject</th>
                    {COMPONENTS.map(c => (
                      <th key={c.key} className="text-center px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                        {c.label}<span className="block text-xs font-normal opacity-60">(/{c.max})</span>
                      </th>
                    ))}
                    <th className="text-center px-2 py-2.5 font-medium text-muted-foreground">Total</th>
                    <th className="text-center px-2 py-2.5 font-medium text-muted-foreground w-16">Grade</th>
                    <th className="text-left px-2 py-2.5 font-medium text-muted-foreground">Remarks</th>
                    <th className="w-8 px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map(row => {
                    const gInfo = row.grade ? GRADE_INFO[row.grade] : null;
                    return (
                      <tr key={row._key} className="hover:bg-slate-50/40">
                        <td className="px-3 py-2">
                          <Input value={row.subject} onChange={e => updateField(row._key, "subject", e.target.value)}
                            placeholder="e.g. Mathematics" className="h-8 text-sm min-w-[130px]" />
                        </td>
                        {COMPONENTS.map(c => {
                          const over = isOverMax(row, c.key as ComponentKey, c.max);
                          return (
                            <td key={c.key} className="px-2 py-2">
                              <div className="relative" title={over ? `Must be 0–${c.max}` : undefined}>
                                <Input
                                  type="number" min="0" max={c.max} step="0.5"
                                  value={(row as any)[c.key]}
                                  onChange={e => updateField(row._key, c.key as ComponentKey, e.target.value)}
                                  onBlur={() => clampField(row._key, c.key as ComponentKey, c.max)}
                                  placeholder="—"
                                  className={`h-8 text-sm text-center w-16 transition-colors ${
                                    over
                                      ? "border-destructive text-destructive bg-red-50 focus-visible:ring-destructive/30"
                                      : ""
                                  }`}
                                />
                                {over && (
                                  <span className="absolute -top-2.5 right-0 bg-destructive text-destructive-foreground text-[8px] font-bold px-1 rounded-sm leading-tight pointer-events-none">
                                    max {c.max}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-center">
                          <span className="font-semibold text-sm">
                            {row.total !== null ? row.total.toFixed(1) : "—"}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          {row.grade
                            ? <span className="font-bold text-sm" style={{ color: gInfo?.color }}>{row.grade}</span>
                            : <span className="text-muted-foreground text-sm">—</span>}
                        </td>
                        <td className="px-2 py-2">
                          <Input value={row.remarks} onChange={e => updateField(row._key, "remarks", e.target.value)}
                            placeholder={gInfo?.label ?? "Remarks"} className="h-8 text-sm min-w-[120px]" />
                        </td>
                        <td className="px-2 py-2 text-center">
                          {row.saved
                            ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                            : <Button variant="ghost" size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => removeRow(row)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />Add Subject
              </Button>
              <div className="flex-1" />
              <Button onClick={handleSaveAll} disabled={saving} size="sm" className="gap-1.5">
                <Save className="w-3.5 h-3.5" />{saving ? "Saving…" : "Save All Scores"}
              </Button>
              <Button variant="outline" onClick={handlePreview} size="sm" className="gap-1.5">
                <Eye className="w-3.5 h-3.5" />Preview & Print
              </Button>
            </div>
          </div>

          {/* Teacher Remarks */}
          <div className="bg-white rounded-xl border p-4 space-y-2">
            <div>
              <p className="font-medium text-sm">Class Teacher's Remarks</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Overall remarks about this student's conduct, attitude, and performance this term. Saved alongside scores.
              </p>
            </div>
            <Textarea
              value={teacherRemarks}
              onChange={e => setTeacherRemarks(e.target.value)}
              placeholder="e.g. A diligent student who has shown great improvement this term. Keep it up!"
              className="min-h-[80px] text-sm resize-none"
            />
          </div>
        </main>
      )}

      {/* PREVIEW MODE */}
      {mode === "preview" && (
        <div className="max-w-[860px] mx-auto px-4 py-8 print:py-0 print:px-0 print:max-w-none">
          {loadingReport
            ? <div className="py-16 text-center text-muted-foreground print:hidden">Loading report card…</div>
            : !report
              ? <div className="py-16 text-center print:hidden">
                  <p className="text-destructive mb-4">Could not load report card.</p>
                  <Button variant="outline" onClick={() => setMode("edit")}>Back to Edit</Button>
                </div>
              : <ReportCard report={report} />}
        </div>
      )}

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
          @page { margin: 1.5cm; size: A4 landscape; }
        }
      `}</style>
    </div>
  );
}

// ─── Shared printable report card ─────────────────────────────────────────────

export function ReportCard({ report, totalStudents }: { report: any; totalStudents?: number }) {
  const { student, school, scores, summary } = report;
  return (
    <div className="bg-white rounded-xl shadow-sm print:shadow-none print:rounded-none p-8 space-y-5">
      <div className="text-center border-b pb-5">
        {school.logoUrl && <img src={school.logoUrl} alt="" className="h-16 w-auto mx-auto mb-2" />}
        <h1 className="text-2xl font-bold uppercase tracking-wide">{school.name}</h1>
        {school.address && <p className="text-sm text-muted-foreground mt-1">{school.address}</p>}
        <h2 className="text-lg font-semibold mt-3 text-primary uppercase tracking-wider">
          Terminal Report — Term {report.term}
        </h2>
        {report.academicYear && (
          <p className="text-sm text-muted-foreground">Academic Year: {report.academicYear}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm border-b pb-5">
        <div><span className="text-muted-foreground">Name: </span><strong>{student.name}</strong></div>
        <div><span className="text-muted-foreground">Student ID: </span><span className="font-mono text-xs">{student.studentNumber}</span></div>
        <div><span className="text-muted-foreground">Class: </span>{student.className ?? "—"}</div>
        <div><span className="text-muted-foreground">Gender: </span><span className="capitalize">{student.gender ?? "—"}</span></div>
      </div>

      <div>
        <h3 className="font-semibold text-xs mb-2 uppercase tracking-wider text-muted-foreground">Subject Results</h3>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="text-left py-2 px-2 border font-semibold">Subject</th>
              {COMPONENTS.map(c => (
                <th key={c.key} className="text-center py-2 px-1.5 border font-semibold whitespace-nowrap">
                  {c.abbr}<span className="block font-normal opacity-60">/{c.max}</span>
                </th>
              ))}
              <th className="text-center py-2 px-2 border font-semibold">Total /100</th>
              <th className="text-center py-2 px-2 border font-semibold w-14">Grade</th>
              <th className="text-left py-2 px-2 border font-semibold">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {scores.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-5 text-muted-foreground border">
                  No scores recorded for this term.
                </td>
              </tr>
            ) : (
              scores.map((s: any) => {
                const info = s.grade ? GRADE_INFO[s.grade] : null;
                return (
                  <tr key={s.id}>
                    <td className="py-1.5 px-2 border">{s.subject}</td>
                    {COMPONENTS.map(c => (
                      <td key={c.key} className="py-1.5 px-1.5 border text-center font-mono">
                        {s[c.key] !== null && s[c.key] !== undefined ? Number(s[c.key]).toFixed(1) : "—"}
                      </td>
                    ))}
                    <td className="py-1.5 px-2 border text-center font-mono font-semibold">
                      {s.score !== null ? Number(s.score).toFixed(1) : "—"}
                    </td>
                    <td className="py-1.5 px-2 border text-center font-bold" style={{ color: info?.color }}>
                      {s.grade ?? "—"}
                    </td>
                    <td className="py-1.5 px-2 border text-muted-foreground">{s.remarks ?? info?.label ?? "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {scores.length > 0 && (
        <div className="border rounded-lg p-3 bg-slate-50 grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Score</p>
            <p className="text-xl font-bold">{Number(summary.totalScore).toFixed(1)} / {summary.totalMax}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Average</p>
            <p className="text-xl font-bold">{summary.percentage}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Overall Grade</p>
            <p className="text-xl font-bold" style={{ color: summary.overallGrade ? GRADE_INFO[summary.overallGrade]?.color : undefined }}>
              {summary.overallGrade ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Class Position</p>
            <p className="text-xl font-bold">
              {summary.position ? `${summary.position}${ordinal(summary.position)}` : "—"}
              {totalStudents && <span className="text-xs text-muted-foreground font-normal"> /{totalStudents}</span>}
            </p>
          </div>
        </div>
      )}

      <div className="text-xs border rounded-lg p-3 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground whitespace-nowrap">Next Term Begins:</span>
          <span className="flex-1 border-b border-dashed border-gray-400"></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground whitespace-nowrap">Total Students in Class:</span>
          <span className="flex-1 border-b border-dashed border-gray-400"></span>
        </div>
      </div>

      <div className="text-xs border-t pt-3">
        <p className="font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">Grading Scale</p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(GRADE_INFO).map(([g, { label }]) => (
            <span key={g}><strong>{g}</strong>: {label}</span>
          ))}
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        {/* Class Teacher's Remarks */}
        <div className="border rounded-lg p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Class Teacher's Remarks</p>
          {report.teacherRemarks ? (
            <p className="text-sm leading-relaxed min-h-[2.5rem]">{report.teacherRemarks}</p>
          ) : (
            <div className="space-y-2.5 my-1">
              <div className="border-b border-dashed border-gray-300 h-5" />
              <div className="border-b border-dashed border-gray-300 h-5" />
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Signature:</span>
            <span className="flex-1 border-b border-dashed border-gray-400" />
            <span className="text-xs text-muted-foreground ml-4 whitespace-nowrap">Date:</span>
            <span className="w-24 border-b border-dashed border-gray-400" />
          </div>
        </div>

        {/* Headmaster / Principal's Remarks */}
        <div className="border rounded-lg p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Headmaster / Principal's Remarks</p>
          {report.headRemarks ? (
            <p className="text-sm leading-relaxed min-h-[2.5rem]">{report.headRemarks}</p>
          ) : (
            <div className="space-y-2.5 my-1">
              <div className="border-b border-dashed border-gray-300 h-5" />
              <div className="border-b border-dashed border-gray-300 h-5" />
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Signature:</span>
            <span className="flex-1 border-b border-dashed border-gray-400" />
            <span className="text-xs text-muted-foreground ml-4 whitespace-nowrap">Date:</span>
            <span className="w-24 border-b border-dashed border-gray-400" />
          </div>
        </div>

        {/* Parent / Guardian */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Parent / Guardian's Signature:</span>
          <span className="flex-1 border-b border-dashed border-gray-400" />
          <span className="text-xs text-muted-foreground ml-4 whitespace-nowrap">Date:</span>
          <span className="w-24 border-b border-dashed border-gray-400" />
        </div>
      </div>
      <footer className="flex items-center justify-center gap-2 py-3 print:hidden">
        <img src={`${import.meta.env.BASE_URL}torrential-tech-logo-light.png`} alt="Torrential Technologies" className="h-4 w-auto object-contain opacity-50" />
        <span className="text-[10px] text-muted-foreground/75">Product of Torrential Technologies</span>
      </footer>
    </div>
  );
}
