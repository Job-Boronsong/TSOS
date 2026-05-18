import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useTeacherAuth } from "@/lib/teacher-auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { ReportCard } from "./student-report";

interface Props {
  params: { classId: string };
}

export default function MassPrint({ params }: Props) {
  const { classId } = params;
  const { session } = useTeacherAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const sp = new URLSearchParams(search);
  const term = sp.get("term") ?? "1";
  const academicYear = sp.get("year") ?? "";

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [className, setClassName] = useState("");

  useEffect(() => {
    const schoolId = session?.teacher?.schoolId;
    if (!schoolId) return;

    async function load() {
      try {
        const classRes = await fetch("/api/teacher/my-classes", { credentials: "include" });
        const classes = await classRes.json();
        const cls = classes.find((c: any) => String(c.id) === classId);
        setClassName(cls?.name ?? `Class ${classId}`);

        const studRes = await fetch(`/api/teacher/my-students?classId=${classId}`, { credentials: "include" });
        const students: any[] = await studRes.json();

        if (students.length === 0) { setReports([]); setLoading(false); return; }

        const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name));
        const fetches = sorted.map(s =>
          fetch(
            `/api/schools/${schoolId}/students/${s.id}/report?term=${term}&academicYear=${encodeURIComponent(academicYear)}`,
            { credentials: "include" }
          ).then(r => r.json()).catch(() => null)
        );
        const results = await Promise.all(fetches);
        setReports(results.filter(Boolean));
      } catch (e: any) {
        setError(e.message ?? "Failed to load reports");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [classId, term, academicYear, session]);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Controls */}
      <div className="print:hidden bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm"
            onClick={() => navigate(`/teacher/class/${classId}?term=${term}&year=${encodeURIComponent(academicYear)}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <p className="font-semibold text-sm">{className} — All Report Cards</p>
            <p className="text-xs text-muted-foreground">Term {term} · {academicYear}</p>
          </div>
          <Button
            size="sm"
            onClick={() => window.print()}
            disabled={loading || reports.length === 0}
            className="gap-1.5"
          >
            <Printer className="w-4 h-4" />Print All ({reports.length})
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 print:hidden">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Loading all report cards…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 print:hidden">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={() => navigate(`/teacher/class/${classId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 print:hidden">
          <p className="text-muted-foreground">No students found in this class.</p>
          <Button variant="outline" onClick={() => navigate(`/teacher/class/${classId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
        </div>
      ) : (
        <>
          <div className="py-6 print:py-0 space-y-6 print:space-y-0">
            {reports.map((report, idx) => (
              <div
                key={report.student.id}
                className="max-w-4xl mx-auto px-4 print:px-0 print:max-w-none"
                style={{ pageBreakAfter: idx < reports.length - 1 ? "always" : "auto" }}
              >
                <ReportCard report={report} totalStudents={reports.length} />
              </div>
            ))}
          </div>

          <div className="print:hidden max-w-4xl mx-auto px-4 py-6 text-center">
            <Button onClick={() => window.print()} size="lg" className="gap-2">
              <Printer className="w-5 h-5" />
              Print All {reports.length} Report Cards
            </Button>
          </div>
        </>
      )}

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
          @page { margin: 1.5cm; size: A4 landscape; }
        }
      `}</style>
      <footer className="flex items-center justify-center gap-2 py-3 print:hidden">
        <img src={`${import.meta.env.BASE_URL}torrential-tech-logo-light.png`} alt="Torrential Technologies" className="h-4 w-auto object-contain opacity-50" />
        <span className="text-[10px] text-muted-foreground/75">Product of Torrential Technologies</span>
      </footer>
    </div>
  );
}
