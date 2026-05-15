import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useTeacherAuth } from "@/lib/teacher-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Printer, MessageSquare, Loader2 } from "lucide-react";

const GRADE_INFO: Record<string, { label: string; color: string }> = {
  A1: { label: "Excellent", color: "#16a34a" },
  B2: { label: "Very Good", color: "#2563eb" },
  B3: { label: "Good", color: "#3b82f6" },
  C4: { label: "Credit", color: "#ca8a04" },
  C5: { label: "Credit", color: "#d97706" },
  C6: { label: "Credit", color: "#f59e0b" },
  D7: { label: "Pass", color: "#ea580c" },
  E8: { label: "Pass", color: "#dc2626" },
  F9: { label: "Fail", color: "#b91c1c" },
};

interface Props {
  params: { classId: string; studentId: string };
}

export default function TeacherReport({ params }: Props) {
  const { classId, studentId } = params;
  const { session } = useTeacherAuth();
  const [location, navigate] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const term = searchParams.get("term") ?? "";
  const year = searchParams.get("year") ?? "";

  const { toast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  useEffect(() => {
    const schoolId = session?.teacher.schoolId;
    if (!schoolId) return;
    const url = `/api/schools/${schoolId}/students/${studentId}/report?term=${term}&academicYear=${encodeURIComponent(year)}`;
    fetch(url, { credentials: "include" })
      .then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then(setReport)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [studentId, term, year, session]);

  const handlePrint = () => window.print();

  const handleNotifyParent = async () => {
    const schoolId = session?.teacher.schoolId;
    if (!schoolId) return;
    setSmsSending(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/sms/report-ready`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: parseInt(studentId), term, academicYear: year }),
      });
      const data = await res.json();
      if (data.ok) {
        setSmsSent(true);
        toast({ title: "SMS sent", description: `Parent notified at ${data.phone}` });
      } else {
        toast({ title: "SMS not sent", description: data.reason ?? "No parent phone on file", variant: "destructive" });
      }
    } catch {
      toast({ title: "SMS failed", description: "Network error — please try again.", variant: "destructive" });
    } finally {
      setSmsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading report card...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">Failed to load report card.</p>
        <Button onClick={() => navigate(`/teacher/class/${classId}`)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      </div>
    );
  }

  const { student, school, scores, summary } = report;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Screen-only controls */}
      <div className="print:hidden bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/teacher/class/${classId}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="flex-1 font-medium text-sm">{student.name} — Term {term} Report</span>
          <Button size="sm" variant="outline" onClick={handleNotifyParent} disabled={smsSending || smsSent}>
            {smsSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
            {smsSent ? "Parent Notified" : "Notify Parent"}
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />Print
          </Button>
        </div>
      </div>

      {/* Report card */}
      <div className="max-w-3xl mx-auto px-4 py-8 print:py-0 print:px-0 print:max-w-none">
        <div className="bg-white rounded-xl shadow-sm print:shadow-none print:rounded-none p-8 space-y-6">

          {/* School header */}
          <div className="text-center border-b pb-6">
            {school.logoUrl && <img src={school.logoUrl} alt="School Logo" className="h-16 w-auto mx-auto mb-2" />}
            <h1 className="text-2xl font-bold uppercase tracking-wide">{school.name}</h1>
            {school.address && <p className="text-sm text-muted-foreground mt-1">{school.address}</p>}
            <h2 className="text-lg font-semibold mt-3 text-primary">TERMINAL REPORT — TERM {report.term}</h2>
            {report.academicYear && <p className="text-sm text-muted-foreground">Academic Year: {report.academicYear}</p>}
          </div>

          {/* Student info */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm border-b pb-6">
            <div><span className="font-medium text-muted-foreground">Name:</span> <span className="font-semibold">{student.name}</span></div>
            <div><span className="font-medium text-muted-foreground">Student ID:</span> <span className="font-mono">{student.studentNumber}</span></div>
            <div><span className="font-medium text-muted-foreground">Class:</span> <span>{student.className ?? "—"}</span></div>
            <div><span className="font-medium text-muted-foreground">Gender:</span> <span className="capitalize">{student.gender ?? "—"}</span></div>
          </div>

          {/* Scores table */}
          <div>
            <h3 className="font-semibold text-sm mb-3 uppercase tracking-wide text-muted-foreground">Subject Results</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-2 px-3 border font-semibold">Subject</th>
                  <th className="text-center py-2 px-3 border font-semibold w-20">Score</th>
                  <th className="text-center py-2 px-3 border font-semibold w-16">Max</th>
                  <th className="text-center py-2 px-3 border font-semibold w-16">%</th>
                  <th className="text-center py-2 px-3 border font-semibold w-16">Grade</th>
                  <th className="text-left py-2 px-3 border font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {scores.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-muted-foreground border">No scores recorded for this term.</td></tr>
                ) : (
                  scores.map((s: any) => {
                    const pct = s.score !== null ? Math.round((s.score / s.maxScore) * 100) : null;
                    const info = s.grade ? GRADE_INFO[s.grade] : null;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 border">{s.subject}</td>
                        <td className="py-2 px-3 border text-center font-mono">{s.score ?? "—"}</td>
                        <td className="py-2 px-3 border text-center text-muted-foreground">{s.maxScore}</td>
                        <td className="py-2 px-3 border text-center">{pct !== null ? `${pct}%` : "—"}</td>
                        <td className="py-2 px-3 border text-center font-bold" style={{ color: info?.color }}>
                          {s.grade ?? "—"}
                        </td>
                        <td className="py-2 px-3 border text-muted-foreground">{s.remarks ?? info?.label ?? "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {scores.length > 0 && (
            <div className="border rounded-lg p-4 bg-slate-50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Score</p>
                <p className="text-xl font-bold">{summary.totalScore} / {summary.totalMax}</p>
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
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Position</p>
                <p className="text-xl font-bold">
                  {summary.position ? `${summary.position}${ordinal(summary.position)}` : "—"}
                </p>
              </div>
            </div>
          )}

          {/* Grade key */}
          <div className="text-xs border-t pt-4">
            <p className="font-medium mb-2 text-muted-foreground uppercase tracking-wide">Grading Scale</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(GRADE_INFO).map(([g, { label }]) => (
                <span key={g}><strong>{g}</strong>: {label}</span>
              ))}
            </div>
          </div>

          {/* Signature area */}
          <div className="grid grid-cols-3 gap-8 pt-6 border-t">
            {["Class Teacher", "Headmaster / Principal", "Parent / Guardian"].map(role => (
              <div key={role} className="text-center">
                <div className="border-b border-dashed mb-2 h-8"></div>
                <p className="text-xs text-muted-foreground">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
