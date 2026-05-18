import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useTeacherAuth } from "@/lib/teacher-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, GraduationCap, Printer, ChevronRight, Users, TableProperties, CalendarDays, UserPlus, Loader2, CheckCircle2, User } from "lucide-react";

interface Props {
  params: { classId: string };
}

export default function TeacherClass({ params }: Props) {
  const { classId } = params;
  const { session } = useTeacherAuth();
  const [, navigate] = useLocation();
  const search = useSearch();

  const currentYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  const sp = new URLSearchParams(search);
  const [term, setTerm] = useState(sp.get("term") ?? "1");
  const [academicYear, setAcademicYear] = useState(sp.get("year") ?? currentYear);

  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [scoreMap, setScoreMap] = useState<Record<number, number>>({}); // studentId → count of subjects scored
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", gender: "male", dateOfBirth: "", parentName: "", parentPhone: "" });
  const [addSaving, setAddSaving] = useState(false);
  const [addDone, setAddDone] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/teacher/my-classes", { credentials: "include" })
      .then(r => r.json())
      .then((cls: any[]) => setClassInfo(cls.find(c => String(c.id) === classId) ?? null));
  }, [classId]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/teacher/my-students?classId=${classId}`, { credentials: "include" })
      .then(r => r.json())
      .then(setStudents)
      .finally(() => setLoading(false));
  }, [classId]);

  // Fetch scores to show completion badge
  useEffect(() => {
    if (!term || !academicYear) return;
    const url = `/api/teacher/scores?classId=${classId}&term=${term}&academicYear=${encodeURIComponent(academicYear)}`;
    fetch(url, { credentials: "include" })
      .then(r => r.json())
      .then((scores: any[]) => {
        const map: Record<number, number> = {};
        for (const sc of scores) {
          map[sc.studentId] = (map[sc.studentId] ?? 0) + 1;
        }
        setScoreMap(map);
      })
      .catch(() => {});
  }, [classId, term, academicYear]);

  const openStudent = (studentId: number) =>
    navigate(`/teacher/student/${classId}/${studentId}?term=${term}&year=${encodeURIComponent(academicYear)}`);

  const handleMassPrint = () =>
    navigate(`/teacher/class/${classId}/mass-print?term=${term}&year=${encodeURIComponent(academicYear)}`);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    setAddSaving(true);
    setAddDone(null);
    try {
      const res = await fetch("/api/teacher/add-student", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, classId }),
      });
      if (res.ok) {
        const student = await res.json();
        setAddDone(`${student.name} (${student.studentNumber}) enrolled.`);
        setAddForm({ name: "", gender: "male", dateOfBirth: "", parentName: "", parentPhone: "" });
        // Refresh students list
        fetch(`/api/teacher/my-students?classId=${classId}`, { credentials: "include" })
          .then(r => r.json()).then(setStudents);
      }
    } finally {
      setAddSaving(false);
    }
  };

  const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <GraduationCap className="w-5 h-5 text-muted-foreground" />
          <h1 className="font-semibold flex-1">{classInfo?.name ?? `Class ${classId}`}</h1>
          <span className="text-xs text-muted-foreground hidden sm:block">{session?.school?.name}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Filters + actions */}
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
            <Input className="w-36" value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="e.g. 2024-2025" />
          </div>
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={() => navigate(`/teacher/class/${classId}/attendance`)}
            className="flex items-center gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            <CalendarDays className="w-4 h-4" />
            Attendance
          </Button>
          <Button
            variant="outline"
            onClick={() => { setAddOpen(true); setAddDone(null); }}
            className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/teacher/class/${classId}/cumulative?term=${term}&year=${encodeURIComponent(academicYear)}`)}
            disabled={students.length === 0}
            className="flex items-center gap-2"
          >
            <TableProperties className="w-4 h-4" />
            Cumulative Record
          </Button>
          <Button
            variant="outline"
            onClick={handleMassPrint}
            disabled={students.length === 0}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print All Reports
          </Button>
        </div>

        {/* Student roster */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-medium text-sm">Students</h2>
            <Badge variant="secondary" className="ml-auto">{students.length}</Badge>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Loading students…</div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No students in this class.</div>
          ) : (
            <div className="divide-y">
              {sorted.map((student, idx) => {
                const subjectCount = scoreMap[student.id] ?? 0;
                return (
                  <button
                    key={student.id}
                    onClick={() => openStudent(student.id)}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden border">
                      {student.photoUrl ? (
                        <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          <User className="w-4 h-4 opacity-50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{student.studentNumber}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {student.gender && (
                        <Badge variant="outline" className="text-xs capitalize hidden sm:inline-flex">
                          {student.gender}
                        </Badge>
                      )}
                      {subjectCount > 0 ? (
                        <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                          {subjectCount} {subjectCount === 1 ? "subject" : "subjects"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          No scores
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {sorted.length > 0 && (
          <p className="text-xs text-center text-muted-foreground">
            Click a student to enter scores and view their report card
          </p>
        )}
      </main>

      {/* Add Student Dialog */}
      <Dialog open={addOpen} onOpenChange={v => { if (!v) { setAddOpen(false); setAddDone(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              Enroll New Student
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Kofi Mensah" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={addForm.gender} onValueChange={v => setAddForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={addForm.dateOfBirth} onChange={e => setAddForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Parent / Guardian Name</Label>
              <Input value={addForm.parentName} onChange={e => setAddForm(f => ({ ...f, parentName: e.target.value }))} placeholder="e.g. Ama Mensah" />
            </div>
            <div className="space-y-2">
              <Label>Parent / Guardian Phone</Label>
              <Input value={addForm.parentPhone} onChange={e => setAddForm(f => ({ ...f, parentPhone: e.target.value }))} placeholder="e.g. 0241234567" />
            </div>
            {addDone && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {addDone}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Close</Button>
              <Button type="submit" disabled={addSaving || !addForm.name.trim()}>
                {addSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enrolling…</> : "Enroll Student"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <footer className="flex items-center justify-center gap-2 py-3">
        <img src={`${import.meta.env.BASE_URL}torrential-tech-logo-light.png`} alt="Torrential Technologies" className="h-4 w-auto object-contain opacity-50" />
        <span className="text-[10px] text-muted-foreground/75">Product of Torrential Technologies</span>
      </footer>
    </div>
  );
}
