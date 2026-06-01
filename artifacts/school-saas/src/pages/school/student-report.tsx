import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useSchoolId } from "@/lib/school-hooks";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Printer, Loader2, Save } from "lucide-react";
import { ReportCard } from "@/pages/teacher/student-report";

interface Props {
  params: { schoolSlug: string; studentId: string };
}

export default function SchoolAdminStudentReport({ params }: Props) {
  const { schoolSlug, studentId } = params;
  const schoolId = useSchoolId();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const currentYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  const [term, setTerm] = useState("1");
  const [academicYear, setAcademicYear] = useState(currentYear);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [headRemarks, setHeadRemarks] = useState("");
  const [savingRemarks, setSavingRemarks] = useState(false);
  const remarksInitialised = useRef(false);

  const fetchReport = () => {
    if (!schoolId || !term || !academicYear) return;
    setLoading(true);
    setError(null);
    remarksInitialised.current = false;
    fetch(
      `/api/schools/${schoolId}/students/${studentId}/report?term=${term}&academicYear=${encodeURIComponent(academicYear)}`,
      { credentials: "include" }
    )
      .then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then(data => {
        setReport(data);
        if (!remarksInitialised.current) {
          setHeadRemarks(data.headRemarks ?? "");
          remarksInitialised.current = true;
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReport(); }, [schoolId, studentId, term, academicYear]);

  const handleSaveHeadRemarks = async () => {
    if (!schoolId) return;
    setSavingRemarks(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/students/${studentId}/head-remarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ term, academicYear, headRemarks }),
      });
      if (res.ok) {
        setReport((prev: any) => prev ? { ...prev, headRemarks: headRemarks || null } : prev);
        toast({ title: "Headmaster remarks saved" });
      } else {
        toast({ variant: "destructive", title: "Failed to save remarks" });
      }
    } catch {
      toast({ variant: "destructive", title: "Network error" });
    } finally {
      setSavingRemarks(false);
    }
  };

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
        {!loading && !error && report && (
          <div className="space-y-4">
            {/* Headmaster remarks editor — screen only */}
            <div className="print:hidden bg-white rounded-xl border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Headmaster / Principal's Remarks</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    These remarks are saved to the database and appear on the printed report card.
                  </p>
                </div>
                <Button size="sm" onClick={handleSaveHeadRemarks} disabled={savingRemarks} className="gap-1.5 shrink-0">
                  {savingRemarks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Remarks
                </Button>
              </div>
              <Textarea
                value={headRemarks}
                onChange={e => setHeadRemarks(e.target.value)}
                placeholder="e.g. A remarkable term. We are proud of your dedication and encourage you to keep striving for excellence."
                className="min-h-[80px] text-sm resize-none"
              />
              {report.teacherRemarks && (
                <div className="text-xs text-muted-foreground border-t pt-2">
                  <span className="font-medium">Class Teacher's Remarks:</span>{" "}
                  <span className="italic">{report.teacherRemarks}</span>
                </div>
              )}
            </div>

            <ReportCard report={{ ...report, headRemarks: headRemarks || report.headRemarks }} />
          </div>
        )}
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
