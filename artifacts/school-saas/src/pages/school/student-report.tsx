import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useSchoolId } from "@/lib/school-hooks";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { ReportCard } from "@/pages/teacher/student-report";

interface Props {
  params: { schoolSlug: string; studentId: string };
}

export default function SchoolAdminStudentReport({ params }: Props) {
  const { schoolSlug, studentId } = params;
  const schoolId = useSchoolId();
  const [, navigate] = useLocation();

  const currentYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  const [term, setTerm] = useState("1");
  const [academicYear, setAcademicYear] = useState(currentYear);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = () => {
    if (!schoolId || !term || !academicYear) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/schools/${schoolId}/students/${studentId}/report?term=${term}&academicYear=${encodeURIComponent(academicYear)}`,
      { credentials: "include" }
    )
      .then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then(setReport)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReport(); }, [schoolId, studentId, term, academicYear]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="print:hidden bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/school/${schoolSlug}/students`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="flex-1 font-medium text-sm">
            {report ? `${report.student?.name} — Report Card` : "Student Report Card"}
          </span>
          <div className="flex items-center gap-2">
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Term 1</SelectItem>
                <SelectItem value="2">Term 2</SelectItem>
                <SelectItem value="3">Term 3</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="w-36 h-8 text-sm"
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              placeholder="e.g. 2024-2025"
            />
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />Print
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[860px] mx-auto px-4 py-8 print:py-0 print:px-0 print:max-w-none">
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading report card…
          </div>
        )}
        {!loading && error && (
          <div className="py-16 text-center">
            <p className="text-destructive mb-2">Could not load report card.</p>
            <p className="text-sm text-muted-foreground mb-4">
              No scores may have been recorded for Term {term} ({academicYear}) yet.
            </p>
            <Button variant="outline" onClick={() => navigate(`/school/${schoolSlug}/students`)}>
              Back to Students
            </Button>
          </div>
        )}
        {!loading && !error && report && <ReportCard report={report} />}
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>
    </div>
  );
}
