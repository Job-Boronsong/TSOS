import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useTeacherAuth } from "@/lib/teacher-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Printer, TableProperties } from "lucide-react";
import { GRADE_INFO, ordinal } from "./report-utils";

interface Props { params: { classId: string } }

interface StudentRow {
  id: number;
  name: string;
  studentNumber: string;
  gender: string | null;
  bySubject: Record<string, number | null>;
  total: number;
  percentage: number;
  grade: string | null;
  position: number;
}

interface CumulativeData {
  class: { id: number; name: string };
  school: { name: string; address?: string; logoUrl?: string };
  term: string | null;
  academicYear: string | null;
  subjects: string[];
  students: StudentRow[];
}

export default function CumulativeRecord({ params }: Props) {
  const { classId } = params;
  const { session } = useTeacherAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const sp = new URLSearchParams(search);

  const currentYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  const [term, setTerm] = useState(sp.get("term") ?? "1");
  const [academicYear, setAcademicYear] = useState(sp.get("year") ?? currentYear);
  const [data, setData] = useState<CumulativeData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!term || !academicYear) return;
    setLoading(true);
    fetch(
      `/api/teacher/class/${classId}/cumulative?term=${term}&academicYear=${encodeURIComponent(academicYear)}`,
      { credentials: "include" }
    )
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [classId, term, academicYear]);

  const students = data?.students ?? [];
  const subjects = data?.subjects ?? [];
  const totalStudents = students.length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="print:hidden bg-white border-b sticky top-0 z-10">
        <div className="max-w-full px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm"
            onClick={() => navigate(`/teacher/class/${classId}?term=${term}&year=${encodeURIComponent(academicYear)}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <TableProperties className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{data?.class.name ?? "Class"} — Cumulative Record</p>
            <p className="text-xs text-muted-foreground">{session?.school?.name}</p>
          </div>
          <Button size="sm" onClick={() => window.print()} className="gap-1.5 shrink-0">
            <Printer className="w-3.5 h-3.5" />Print
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="print:hidden max-w-full px-4 py-4">
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
          {!loading && data && (
            <div className="ml-auto text-sm text-muted-foreground">
              {totalStudents} student{totalStudents !== 1 ? "s" : ""} · {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Printable result sheet */}
      <div className="max-w-full px-4 pb-8 print:px-0 print:pb-0">
        <div className="bg-white rounded-xl shadow-sm print:shadow-none print:rounded-none p-6 print:p-0">
          {/* Print header */}
          <div className="text-center mb-4 pb-4 border-b">
            {data?.school?.logoUrl && (
              <img src={data.school.logoUrl} alt="" className="h-14 w-auto mx-auto mb-2" />
            )}
            <h1 className="text-xl font-bold uppercase tracking-wide">{data?.school?.name ?? session?.school?.name}</h1>
            {data?.school?.address && <p className="text-xs text-muted-foreground">{data.school.address}</p>}
            <h2 className="font-bold mt-2 uppercase tracking-wider text-base text-primary">
              Cumulative Record Sheet — Term {term}
            </h2>
            <div className="flex justify-center gap-6 text-xs text-muted-foreground mt-1">
              <span>Class: <strong className="text-foreground">{data?.class?.name ?? "—"}</strong></span>
              <span>Academic Year: <strong className="text-foreground">{academicYear}</strong></span>
              <span>No. of Students: <strong className="text-foreground">{totalStudents}</strong></span>
            </div>
          </div>

          {loading && (
            <div className="py-16 text-center text-muted-foreground print:hidden">Loading…</div>
          )}

          {/* No-scores notice — students still shown below */}
          {!loading && students.length > 0 && subjects.length === 0 && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 print:hidden">
              No scores entered for Term {term}, {academicYear} yet — student list shown for reference.
              Enter scores from individual student pages.
            </div>
          )}

          {!loading && students.length === 0 && (
            <div className="py-16 text-center text-muted-foreground print:hidden">
              No students found in this class.
            </div>
          )}

          {!loading && students.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-gray-300 px-2 py-2 text-center font-bold w-10 print:px-1">Pos.</th>
                    <th className="border border-gray-300 px-2 py-2 text-left font-bold min-w-[150px] print:px-1">Student Name</th>
                    {subjects.map(sub => (
                      <th key={sub} className="border border-gray-300 px-1.5 py-2 text-center font-bold whitespace-nowrap print:px-1">
                        <span className="block">{sub}</span>
                        <span className="block font-normal opacity-60 text-[10px]">/100</span>
                      </th>
                    ))}
                    <th className="border border-gray-300 px-2 py-2 text-center font-bold bg-slate-200 print:px-1">
                      <span className="block">Total</span>
                      {subjects.length > 0 && (
                        <span className="block font-normal opacity-60 text-[10px]">/{subjects.length * 100}</span>
                      )}
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-bold print:px-1">%</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-bold w-12 print:px-1">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {/* When no scores yet, sort alphabetically; when scored, sorted by position (backend) */}
                  {(subjects.length === 0
                    ? [...students].sort((a, b) => a.name.localeCompare(b.name))
                    : students
                  ).map((student, idx) => {
                    const gInfo = student.grade ? GRADE_INFO[student.grade] : null;
                    const isTopThree = student.position <= 3 && student.total > 0;
                    return (
                      <tr key={student.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                        {/* Position */}
                        <td className="border border-gray-300 px-2 py-1.5 text-center font-bold print:px-1"
                          style={{ color: isTopThree ? (student.position === 1 ? "#ca8a04" : student.position === 2 ? "#6b7280" : "#b45309") : undefined }}>
                          {student.total > 0 ? `${student.position}${ordinal(student.position)}` : "—"}
                        </td>
                        {/* Name */}
                        <td className="border border-gray-300 px-2 py-1.5 font-medium print:px-1">
                          {student.name}
                          {student.studentNumber && (
                            <span className="block text-[10px] text-muted-foreground font-normal font-mono">{student.studentNumber}</span>
                          )}
                        </td>
                        {/* Subject scores */}
                        {subjects.map(sub => {
                          const score = student.bySubject[sub];
                          return (
                            <td key={sub} className="border border-gray-300 px-1.5 py-1.5 text-center font-mono print:px-1">
                              {score !== null && score !== undefined ? score.toFixed(1) : <span className="text-gray-300">—</span>}
                            </td>
                          );
                        })}
                        {/* Total — auto-summed from subject scores */}
                        <td className="border border-gray-300 px-2 py-1.5 text-center font-bold bg-slate-50 print:px-1">
                          {student.total > 0 ? student.total.toFixed(1) : <span className="text-gray-300">—</span>}
                        </td>
                        {/* Percentage */}
                        <td className="border border-gray-300 px-2 py-1.5 text-center print:px-1">
                          {student.total > 0 ? `${student.percentage}%` : <span className="text-gray-300">—</span>}
                        </td>
                        {/* Grade */}
                        <td className="border border-gray-300 px-2 py-1.5 text-center font-bold print:px-1"
                          style={{ color: gInfo?.color }}>
                          {student.grade ?? <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Summary footer — only when there are scored subjects */}
                {subjects.length > 0 && students.length > 0 && (() => {
                  const subjectAverages = subjects.map(sub => {
                    const vals = students.map(s => s.bySubject[sub]).filter(v => v !== null && v !== undefined) as number[];
                    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                  });
                  const scoredStudents = students.filter(s => s.total > 0);
                  const classAvg = scoredStudents.length > 0
                    ? scoredStudents.reduce((s, r) => s + r.percentage, 0) / scoredStudents.length
                    : 0;
                  return (
                    <tfoot>
                      <tr className="bg-slate-100 font-semibold">
                        <td colSpan={2} className="border border-gray-300 px-2 py-1.5 text-right text-xs print:px-1">
                          Class Average
                        </td>
                        {subjectAverages.map((avg, i) => (
                          <td key={i} className="border border-gray-300 px-1.5 py-1.5 text-center font-mono text-xs print:px-1">
                            {avg !== null ? avg.toFixed(1) : "—"}
                          </td>
                        ))}
                        <td className="border border-gray-300 px-2 py-1.5 text-center bg-slate-200 text-xs print:px-1">
                          {classAvg.toFixed(1)}%
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center text-xs print:px-1">
                          {classAvg.toFixed(1)}%
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 print:px-1" />
                      </tr>
                    </tfoot>
                  );
                })()}
              </table>
            </div>
          )}

          {/* Grading scale */}
          {!loading && subjects.length > 0 && (
            <div className="mt-4 pt-3 border-t text-xs">
              <span className="font-semibold text-muted-foreground uppercase tracking-wide mr-2">Grading Scale:</span>
              {Object.entries(GRADE_INFO).map(([g, { label }]) => (
                <span key={g} className="mr-3"><strong>{g}</strong>: {label}</span>
              ))}
            </div>
          )}

          {/* Signature lines */}
          {!loading && subjects.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-8 text-center text-xs">
              {["Class Teacher", "Headmaster / Principal", "Date"].map(label => (
                <div key={label}>
                  <div className="border-b border-dashed border-gray-400 mb-1 h-8" />
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
          @page { margin: 1cm; size: A4 landscape; }
          table { page-break-inside: avoid; }
        }
      `}</style>
      <footer className="text-center py-3 text-[10px] text-muted-foreground/75 print:hidden">Product of Torrential Technologies</footer>
    </div>
  );
}
