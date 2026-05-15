import { useSchoolId } from "@/lib/school-hooks";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { SchoolAdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Users, ArrowUpDown, History, RefreshCw, BookOpen, Upload, Download, RotateCcw, GraduationCap, CreditCard, FileText, CheckCircle2, AlertCircle, Loader2, ChevronRight, ChevronLeft, Printer, User, ShieldCheck } from "lucide-react";
import { PassportPhotoUpload } from "@/components/passport-photo-upload";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useLocalStudents,
  useLocalClasses,
  useCreateStudentOffline,
  useUpdateStudentOffline,
  useDeleteStudentOffline,
} from "@/lib/offline-hooks";
import { localDb } from "@/lib/local-db";

const LEVEL_LABELS: Record<string, string> = {
  nursery: "Nursery", kg: "KG", primary: "Primary", jhs: "JHS",
};

interface HistoryEntry {
  id: number;
  fromClassName: string | null;
  toClassName: string | null;
  changeType: string;
  academicYear: string | null;
  notes: string | null;
  changedAt: string;
}

interface Props {
  params: { schoolSlug: string };
}

export default function Students({ params }: Props) {
  const { schoolSlug } = params;
  const schoolId = useSchoolId();
  const sid = schoolId;
  const students = useLocalStudents(sid);
  const classes = useLocalClasses(sid);
  const createStudent = useCreateStudentOffline(sid);
  const updateStudent = useUpdateStudentOffline(sid);
  const deleteStudent = useDeleteStudentOffline(sid);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterWaiver, setFilterWaiver] = useState("all");
  const [saving, setSaving] = useState(false);
  const [loadingNextId, setLoadingNextId] = useState(false);

  // CSV Import
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{ imported: number; errors: string[] } | null>(null);

  // ID Cards
  const [idCardOpen, setIdCardOpen] = useState(false);
  const [idCardClass, setIdCardClass] = useState("all");
  const [idCardYear, setIdCardYear] = useState(`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`);
  const [idCardSelected, setIdCardSelected] = useState<Set<number>>(new Set());
  const [schoolName, setSchoolName] = useState<string>("School");

  // End-of-Year Wizard
  const [eoyOpen, setEoyOpen] = useState(false);
  const [eoyStep, setEoyStep] = useState(1);
  const [eoyYear, setEoyYear] = useState(`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`);
  const [eoyMappings, setEoyMappings] = useState<{ fromClassId: number; toClassId: number | null }[]>([]);
  const [eoyPromoting, setEoyPromoting] = useState(false);
  const [eoyMode, setEoyMode] = useState<"all" | "single">("all");
  const [eoySingleSource, setEoySingleSource] = useState("");
  const [eoySingleTarget, setEoySingleTarget] = useState("");
  const [eoySingleSelected, setEoySingleSelected] = useState<Set<number>>(new Set());
  const [csvPreviewRows, setCsvPreviewRows] = useState<Record<string, string>[]>([]);

  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promotingStudent, setPromotingStudent] = useState<any>(null);
  const [promoteForm, setPromoteForm] = useState({ toClassId: "", changeType: "promoted", academicYear: "", notes: "" });
  const [promoting, setPromoting] = useState(false);

  const [bulkPromoteOpen, setBulkPromoteOpen] = useState(false);
  const [bulkSourceClass, setBulkSourceClass] = useState("");
  const [bulkTargetClass, setBulkTargetClass] = useState("");
  const [bulkAcademicYear, setBulkAcademicYear] = useState(String(new Date().getFullYear()));
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set());
  const [bulkPromoting, setBulkPromoting] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<any>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const emptyForm = {
    name: "", studentNumber: "", dateOfBirth: "", gender: "male",
    classId: "", parentName: "", parentPhone: "", category: "regular", status: "active",
    photoUrl: "", feeWaiver: false, feedingWaiver: false, busWaiver: false,
  };
  const [form, setForm] = useState(emptyForm);

  const getClassName = (classId: number | null) =>
    classId ? (classes ?? []).find(c => c.id === classId)?.name ?? null : null;

  const filtered = (students ?? []).filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.studentNumber || "").toLowerCase().includes(search.toLowerCase());
    const matchesClass = filterClass === "all" || String(s.classId) === filterClass;
    const matchesWaiver =
      filterWaiver === "all" ? true :
      filterWaiver === "any" ? (s.feeWaiver || s.feedingWaiver || s.busWaiver) :
      filterWaiver === "fee" ? s.feeWaiver :
      filterWaiver === "feeding" ? s.feedingWaiver :
      filterWaiver === "bus" ? s.busWaiver : true;
    return matchesSearch && matchesClass && matchesWaiver;
  });

  const fetchNextId = async () => {
    setLoadingNextId(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/students/next-id`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setForm(f => ({ ...f, studentNumber: data.studentNumber }));
      }
    } catch {
      // ignore — user can type manually
    } finally {
      setLoadingNextId(false);
    }
  };

  useEffect(() => {
    if (!schoolId) return;
    fetch(`/api/schools`, { credentials: "include" })
      .then(r => r.json())
      .then((schools: any[]) => {
        const s = schools.find((s: any) => s.id === schoolId);
        if (s?.name) setSchoolName(s.name);
      })
      .catch(() => {});
  }, [schoolId]);

  const handleOpenAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
    fetchNextId();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        studentNumber: form.studentNumber,
        classId: form.classId && form.classId !== "none" ? parseInt(form.classId) : null,
        gender: form.gender || null,
        dateOfBirth: form.dateOfBirth || null,
        parentName: form.parentName || null,
        parentPhone: form.parentPhone || null,
        category: form.category,
        status: form.status,
        photoUrl: form.photoUrl || null,
        feeWaiver: form.feeWaiver,
        feedingWaiver: form.feedingWaiver,
        busWaiver: form.busWaiver,
      };
      if (editing) {
        await updateStudent(editing.id, payload);
        toast({ title: "Student updated", description: "Saved locally, will sync when online." });
      } else {
        await createStudent(payload as any);
        toast({ title: "Student added", description: "Saved locally, will sync when online." });
      }
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch {
      toast({ variant: "destructive", title: "Error saving student" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteStudent(id);
      toast({ title: "Student removed", description: "Will sync when online." });
    } catch {
      toast({ variant: "destructive", title: "Error removing student" });
    }
  };

  // ── Promote / Demote ──

  const openPromote = (student: any) => {
    setPromotingStudent(student);
    setPromoteForm({ toClassId: "", changeType: "promoted", academicYear: String(new Date().getFullYear()), notes: "" });
    setPromoteOpen(true);
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotingStudent || !promoteForm.toClassId) return;
    setPromoting(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/students/${promotingStudent.id}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          toClassId: parseInt(promoteForm.toClassId),
          changeType: promoteForm.changeType,
          academicYear: promoteForm.academicYear || null,
          notes: promoteForm.notes || null,
        }),
      });
      if (!res.ok) { toast({ variant: "destructive", title: "Failed to update student class" }); return; }
      const updated = await res.json();
      // Update local DB so the change reflects immediately
      await localDb.students.update(promotingStudent.id, { classId: parseInt(promoteForm.toClassId) });
      toast({ title: `Student ${promoteForm.changeType}`, description: `${promotingStudent.name} moved to ${updated.className ?? "new class"}.` });
      setPromoteOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Error updating student" });
    } finally {
      setPromoting(false);
    }
  };

  // ── Bulk Promotion ──

  const bulkStudents = (students ?? []).filter(s => bulkSourceClass ? String(s.classId) === bulkSourceClass : false);
  const allBulkSelected = bulkStudents.length > 0 && bulkStudents.every(s => bulkSelected.has(s.id));

  const handleBulkPromote = async () => {
    if (!bulkTargetClass || bulkSelected.size === 0) return;
    setBulkPromoting(true);
    try {
      const promotions = Array.from(bulkSelected).map(studentId => ({ studentId, toClassId: parseInt(bulkTargetClass) }));
      const res = await fetch(`/api/schools/${schoolId}/students/promote`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promotions, academicYear: bulkAcademicYear }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: `${data.promoted} student(s) promoted successfully` });
        setBulkPromoteOpen(false);
        setBulkSelected(new Set());
        setBulkSourceClass("");
        setBulkTargetClass("");
        window.location.reload();
      } else {
        toast({ title: "Promotion failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setBulkPromoting(false);
    }
  };

  // ── Class History ──

  const openHistory = async (student: any) => {
    setHistoryStudent(student);
    setHistoryOpen(true);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/students/${student.id}/history`, { credentials: "include" });
      if (res.ok) setHistory(await res.json());
    } catch {
      toast({ variant: "destructive", title: "Failed to load history" });
    } finally {
      setLoadingHistory(false);
    }
  };

  const changeTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      enrolled: "bg-green-100 text-green-700",
      promoted: "bg-blue-100 text-blue-700",
      demoted: "bg-orange-100 text-orange-700",
      transferred: "bg-purple-100 text-purple-700",
    };
    return map[type] ?? "bg-gray-100 text-gray-700";
  };

  const sortedClasses = [...(classes ?? [])].sort((a, b) => {
    const order = ["nursery", "kg", "primary", "jhs"];
    return order.indexOf(a.level ?? "primary") - order.indexOf(b.level ?? "primary");
  });

  const handleCsvImport = async () => {
    if (!csvFile) return;
    setCsvImporting(true);
    setCsvResult(null);
    const text = await csvFile.text();
    try {
      const res = await fetch(`/api/schools/${schoolId}/students/import-csv`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      });
      const result = await res.json();
      setCsvResult(result);
      if (result.imported > 0) {
        toast({ title: `${result.imported} students imported`, description: result.errors.length > 0 ? `${result.errors.length} row(s) had issues` : "All rows successful" });
      }
    } catch {
      toast({ title: "Import failed", description: "Network error — try again", variant: "destructive" });
    } finally {
      setCsvImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "name,class,gender,dob,category,parent_name,parent_phone\nKofi Mensah,Primary 1,male,2015-03-12,regular,Ama Mensah,0241234567\n";
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "students_template.csv";
    a.click();
  };

  const openEoyWizard = () => {
    const mappings = sortedClasses.map(c => ({ fromClassId: c.id, toClassId: null as number | null }));
    setEoyMappings(mappings);
    setEoyStep(1);
    setEoyMode("all");
    setEoySingleSource("");
    setEoySingleTarget("");
    setEoySingleSelected(new Set());
    setEoyOpen(true);
  };

  const autoSuggestMappings = () => {
    const levelOrder = ["nursery", "kg", "primary", "jhs"];
    const byLevel: Record<string, typeof sortedClasses> = {};
    for (const cls of sortedClasses) {
      const level = cls.level ?? "primary";
      if (!byLevel[level]) byLevel[level] = [];
      byLevel[level].push(cls);
    }
    for (const level of Object.keys(byLevel)) {
      byLevel[level].sort((a, b) => {
        const aNum = parseInt(a.name.replace(/\D/g, "")) || 0;
        const bNum = parseInt(b.name.replace(/\D/g, "")) || 0;
        return aNum - bNum || a.name.localeCompare(b.name);
      });
    }
    const newMappings = sortedClasses.map(cls => {
      const level = cls.level ?? "primary";
      const levelClasses = byLevel[level] ?? [];
      const idx = levelClasses.findIndex(c => c.id === cls.id);
      if (idx === -1) return { fromClassId: cls.id, toClassId: null };
      if (idx < levelClasses.length - 1) {
        return { fromClassId: cls.id, toClassId: levelClasses[idx + 1].id };
      }
      const currentLevelIdx = levelOrder.indexOf(level);
      for (let i = currentLevelIdx + 1; i < levelOrder.length; i++) {
        const nextLevel = byLevel[levelOrder[i]] ?? [];
        if (nextLevel.length > 0) return { fromClassId: cls.id, toClassId: nextLevel[0].id };
      }
      return { fromClassId: cls.id, toClassId: null };
    });
    setEoyMappings(newMappings);
    toast({ title: "Mappings auto-suggested", description: "Review and adjust as needed." });
  };

  const handleEoySinglePromote = async () => {
    if (!eoySingleTarget || eoySingleSelected.size === 0) return;
    setEoyPromoting(true);
    try {
      const promotions = Array.from(eoySingleSelected).map(studentId => ({ studentId, toClassId: parseInt(eoySingleTarget) }));
      const res = await fetch(`/api/schools/${schoolId}/students/promote`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promotions, academicYear: eoyYear }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: `${data.promoted} student(s) promoted successfully` });
        setEoyOpen(false);
        window.location.reload();
      } else {
        toast({ title: "Promotion failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setEoyPromoting(false);
    }
  };

  const handleEoyPromote = async () => {
    if (!eoyYear.trim()) { toast({ title: "Academic year required", variant: "destructive" }); return; }
    setEoyPromoting(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/students/promote-all`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings: eoyMappings.filter(m => m.fromClassId), academicYear: eoyYear }),
      });
      const result = await res.json();
      toast({ title: `End-of-Year Promotion Complete`, description: `${result.moved} students promoted` });
      setEoyOpen(false);
    } catch {
      toast({ title: "Promotion failed", description: "Please try again", variant: "destructive" });
    } finally {
      setEoyPromoting(false);
    }
  };

  const idCardStudents = useMemo(() => {
    const all = students ?? [];
    return idCardClass === "all" ? all.filter(s => s.status === "active") : all.filter(s => s.status === "active" && String(s.classId) === idCardClass);
  }, [students, idCardClass]);

  const getSchoolInfo = () => {
    return { name: "", logoUrl: "" };
  };

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Students</h1>
            <p className="text-muted-foreground">Manage all enrolled students. IDs are auto-generated per school.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              fetch(`/api/schools/${schoolId}/export/students`, { credentials: "include" })
                .then(r => r.blob())
                .then(blob => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "students.csv"; a.click(); });
            }}>
              <Download className="w-4 h-4" />Export
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { setCsvFile(null); setCsvResult(null); setCsvOpen(true); }}>
              <Upload className="w-4 h-4" />Import CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { setIdCardClass("all"); setIdCardOpen(true); }}>
              <CreditCard className="w-4 h-4" />ID Cards
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={openEoyWizard}>
              <GraduationCap className="w-4 h-4" />End of Year
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { setBulkSourceClass(""); setBulkTargetClass(""); setBulkSelected(new Set()); setBulkPromoteOpen(true); }}>
              <ArrowUpDown className="w-4 h-4" />Bulk Move
            </Button>
            <Button onClick={handleOpenAdd}>
              <Plus className="w-4 h-4 mr-2" />Add Student
            </Button>
          </div>
        </div>

        {/* ── Bulk Promotion Dialog ── */}
        <Dialog open={bulkPromoteOpen} onOpenChange={v => { if (!v) { setBulkPromoteOpen(false); setBulkSelected(new Set()); } }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5" />Bulk Student Promotion</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">From Class</Label>
                  <Select value={bulkSourceClass} onValueChange={v => { setBulkSourceClass(v); setBulkSelected(new Set()); }}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {sortedClasses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To Class</Label>
                  <Select value={bulkTargetClass} onValueChange={setBulkTargetClass}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {sortedClasses.filter(c => String(c.id) !== bulkSourceClass).map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Academic Year</Label>
                <Input value={bulkAcademicYear} onChange={e => setBulkAcademicYear(e.target.value)} placeholder="e.g. 2024/2025" />
              </div>
              {bulkSourceClass && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Students ({bulkStudents.length})</Label>
                    <button className="text-xs text-primary underline" onClick={() => {
                      if (allBulkSelected) setBulkSelected(new Set());
                      else setBulkSelected(new Set(bulkStudents.map(s => s.id)));
                    }}>{allBulkSelected ? "Deselect all" : "Select all"}</button>
                  </div>
                  <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
                    {bulkStudents.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No students in this class.</p>
                    ) : bulkStudents.map(s => (
                      <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer">
                        <Checkbox checked={bulkSelected.has(s.id)} onCheckedChange={checked => {
                          const next = new Set(bulkSelected);
                          if (checked) next.add(s.id); else next.delete(s.id);
                          setBulkSelected(next);
                        }} />
                        <span className="text-sm flex-1">{s.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{s.studentNumber}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm text-muted-foreground">{bulkSelected.size} student(s) selected</span>
                <Button onClick={handleBulkPromote} disabled={bulkPromoting || bulkSelected.size === 0 || !bulkTargetClass}>
                  {bulkPromoting ? "Promoting…" : `Promote ${bulkSelected.size > 0 ? bulkSelected.size : ""} Student(s)`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add / Edit dialog */}
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
            <DialogHeader><DialogTitle>{editing ? "Edit Student" : "Add New Student"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 gap-4">
              <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              {/* Passport Photo + Core fields row */}
              <div className="flex gap-4 items-start">
                <div className="shrink-0">
                  <Label className="text-xs text-muted-foreground block mb-1.5 text-center">Passport Photo</Label>
                  <PassportPhotoUpload
                    currentUrl={form.photoUrl || null}
                    onUploaded={(url) => setForm(f => ({ ...f, photoUrl: url }))}
                    onClear={() => setForm(f => ({ ...f, photoUrl: "" }))}
                  />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label>Full Name *</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Student ID</Label>
                    <div className="flex gap-2">
                      <Input
                        value={form.studentNumber}
                        onChange={e => setForm(f => ({ ...f, studentNumber: e.target.value }))}
                        placeholder="Auto-generated"
                        required
                      />
                      {!editing && (
                        <Button type="button" variant="outline" size="sm" onClick={fetchNextId} disabled={loadingNextId} title="Regenerate ID">
                          <RefreshCw className={`w-4 h-4 ${loadingNextId ? "animate-spin" : ""}`} />
                        </Button>
                      )}
                    </div>
                    {!editing && <p className="text-xs text-muted-foreground">Auto-generated. You can override it.</p>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={form.classId} onValueChange={v => setForm(f => ({ ...f, classId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select class (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No class yet</SelectItem>
                      {sortedClasses.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          <span className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">[{LEVEL_LABELS[c.level ?? "primary"] ?? c.level}]</span>
                            {c.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="scholarship">Scholarship</SelectItem>
                      <SelectItem value="staff_child">Staff Child</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Parent Name</Label>
                  <Input value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Parent Phone</Label>
                  <Input value={form.parentPhone} onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))} />
                </div>
                {editing && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {/* Fee Waivers */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />Fee Waivers
                </Label>
                <div className="border rounded-lg p-3 space-y-2.5 bg-muted/20">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={form.feeWaiver}
                      onCheckedChange={v => setForm(f => ({ ...f, feeWaiver: !!v }))}
                    />
                    <div>
                      <span className="text-sm font-medium">School Fee Waiver</span>
                      <p className="text-xs text-muted-foreground">Student's tuition fee is fully waived</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={form.feedingWaiver}
                      onCheckedChange={v => setForm(f => ({ ...f, feedingWaiver: !!v }))}
                    />
                    <div>
                      <span className="text-sm font-medium">Feeding Fee Waiver</span>
                      <p className="text-xs text-muted-foreground">Student's feeding/lunch fees are waived</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={form.busWaiver}
                      onCheckedChange={v => setForm(f => ({ ...f, busWaiver: !!v }))}
                    />
                    <div>
                      <span className="text-sm font-medium">Bus Fee Waiver</span>
                      <p className="text-xs text-muted-foreground">Student's transport/bus fees are waived</p>
                    </div>
                  </label>
                </div>
              </div>
              </div>
              <Button type="submit" className="w-full shrink-0" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Student"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Promote / Demote dialog */}
        <Dialog open={promoteOpen} onOpenChange={v => { setPromoteOpen(v); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4" />
                Move Student — {promotingStudent?.name}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePromote} className="space-y-4">
              <div className="space-y-2">
                <Label>Move Type</Label>
                <Select value={promoteForm.changeType} onValueChange={v => setPromoteForm(f => ({ ...f, changeType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promoted">Promoted (to higher class)</SelectItem>
                    <SelectItem value="demoted">Demoted (to lower class)</SelectItem>
                    <SelectItem value="transferred">Transferred (lateral move)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destination Class</Label>
                <Select value={promoteForm.toClassId} onValueChange={v => setPromoteForm(f => ({ ...f, toClassId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {sortedClasses.filter(c => c.id !== promotingStudent?.classId).map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        [{LEVEL_LABELS[c.level ?? "primary"] ?? c.level}] {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input
                  value={promoteForm.academicYear}
                  onChange={e => setPromoteForm(f => ({ ...f, academicYear: e.target.value }))}
                  placeholder="e.g. 2025-2026"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  value={promoteForm.notes}
                  onChange={e => setPromoteForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Reason or additional info"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setPromoteOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={promoting || !promoteForm.toClassId}>
                  {promoting ? "Moving..." : "Confirm Move"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* History dialog */}
        <Dialog open={historyOpen} onOpenChange={v => setHistoryOpen(v)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Class History — {historyStudent?.name}
              </DialogTitle>
            </DialogHeader>
            {loadingHistory ? (
              <p className="text-center py-6 text-muted-foreground text-sm">Loading...</p>
            ) : history.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">No class changes recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map(h => (
                    <TableRow key={h.id}>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${changeTypeBadge(h.changeType)}`}>
                          {h.changeType}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{h.fromClassName ?? <span className="italic text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-sm">{h.toClassName ?? <span className="italic text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{h.academicYear ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(h.changedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
        </Dialog>

        {/* ── CSV Import Dialog ── */}
        <Dialog open={csvOpen} onOpenChange={v => { if (!v) { setCsvOpen(false); setCsvPreviewRows([]); if (csvResult?.imported) window.location.reload(); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Upload className="w-5 h-5" />Import Students from CSV</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Supported columns:</p>
                <p className="font-mono text-xs">name, class, gender, dob, category, parent_name, parent_phone, student_id</p>
                <Button variant="link" size="sm" className="h-auto p-0 mt-2 text-xs" onClick={downloadTemplate}>
                  <Download className="w-3 h-3 mr-1" />Download template CSV
                </Button>
              </div>
              {!csvResult ? (
                <>
                  <div className="space-y-2">
                    <Label>Select CSV file</Label>
                    <Input type="file" accept=".csv,.txt" onChange={e => {
                      const file = e.target.files?.[0] ?? null;
                      setCsvFile(file);
                      setCsvPreviewRows([]);
                      if (file) {
                        file.text().then(text => {
                          const lines = text.split("\n").filter(l => l.trim());
                          if (lines.length < 2) return;
                          const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
                          const rows = lines.slice(1, 6).map(line => {
                            const cells = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
                            return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
                          });
                          setCsvPreviewRows(rows);
                        });
                      }
                    }} />
                    {csvFile && <p className="text-xs text-muted-foreground">{csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)</p>}
                    {csvPreviewRows.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Preview ({csvPreviewRows.length} row{csvPreviewRows.length !== 1 ? "s" : ""} shown):</p>
                        <div className="border rounded overflow-x-auto max-h-32">
                          <table className="text-xs w-full">
                            <thead className="bg-muted">
                              <tr>{Object.keys(csvPreviewRows[0] ?? {}).slice(0, 5).map(h => <th key={h} className="px-2 py-1 text-left font-medium capitalize whitespace-nowrap">{h.replace(/_/g, " ")}</th>)}</tr>
                            </thead>
                            <tbody>
                              {csvPreviewRows.map((row, i) => (
                                <tr key={i} className="border-t">
                                  {Object.keys(row).slice(0, 5).map(h => <td key={h} className="px-2 py-1 max-w-[90px] truncate">{row[h]}</td>)}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCsvOpen(false)}>Cancel</Button>
                    <Button onClick={handleCsvImport} disabled={!csvFile || csvImporting}>
                      {csvImporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing…</> : "Import"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${csvResult.imported > 0 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                    {csvResult.imported > 0 ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                    <p className="font-medium">{csvResult.imported} student(s) imported successfully</p>
                  </div>
                  {csvResult.errors.length > 0 && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto">
                      <p className="text-xs font-medium px-3 py-2 border-b text-destructive">{csvResult.errors.length} issue(s):</p>
                      {csvResult.errors.map((e, i) => <p key={i} className="text-xs px-3 py-1.5 border-b last:border-0">{e}</p>)}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setCsvResult(null); setCsvFile(null); }}>Import More</Button>
                    <Button onClick={() => { setCsvOpen(false); window.location.reload(); }}>Done</Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── ID Card Generator Dialog ── */}
        <Dialog open={idCardOpen} onOpenChange={v => { if (!v) { setIdCardOpen(false); setIdCardSelected(new Set()); } }}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Student ID Cards</DialogTitle>
            </DialogHeader>
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 pb-3 border-b shrink-0">
              <Select value={idCardClass} onValueChange={v => { setIdCardClass(v); setIdCardSelected(new Set()); }}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {sortedClasses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                className="w-36 h-8 text-sm"
                placeholder="School year e.g. 2025/26"
                value={idCardYear}
                onChange={e => setIdCardYear(e.target.value)}
              />
              <span className="text-sm text-muted-foreground flex-1">
                {idCardSelected.size > 0 ? `${idCardSelected.size} selected` : `${idCardStudents.length} card(s)`}
              </span>
              {idCardSelected.size > 0 && (
                <Button size="sm" variant="outline" onClick={() => setIdCardSelected(new Set())}>Clear selection</Button>
              )}
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                {idCardSelected.size > 0 ? `Print ${idCardSelected.size} Selected` : "Print All"}
              </Button>
            </div>
            {/* Cards grid */}
            <div className="overflow-y-auto flex-1 print:overflow-visible">
              <div className="grid grid-cols-3 gap-3 p-4 print:gap-2 print:p-0">
                {idCardStudents.map(student => {
                    const cls = (classes ?? []).find(c => c.id === student.classId);
                    const isChecked = idCardSelected.has(student.id);
                    const hiddenInPrint = idCardSelected.size > 0 && !isChecked;
                    return (
                      <div
                        key={student.id}
                        className={`relative border-2 rounded-xl p-3 bg-white flex flex-col gap-1.5 print:break-inside-avoid cursor-pointer transition-colors ${hiddenInPrint ? "print:hidden" : ""} ${isChecked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                        style={{ minHeight: 140 }}
                        onClick={() => {
                          const next = new Set(idCardSelected);
                          if (isChecked) next.delete(student.id); else next.add(student.id);
                          setIdCardSelected(next);
                        }}
                      >
                        {/* Selection indicator (hidden in print) */}
                        <div className="absolute top-1.5 right-1.5 print:hidden">
                          <Checkbox checked={isChecked} onCheckedChange={() => {
                            const next = new Set(idCardSelected);
                            if (isChecked) next.delete(student.id); else next.add(student.id);
                            setIdCardSelected(next);
                          }} onClick={e => e.stopPropagation()} />
                        </div>
                        {/* Card header: school branding */}
                        <div className="flex items-center gap-1.5 border-b pb-1.5">
                          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="logo" className="w-5 h-5 object-contain rounded shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-semibold leading-tight text-primary truncate">{schoolName}</p>
                            {idCardYear && <p className="text-[8px] text-muted-foreground leading-tight">{idCardYear}</p>}
                          </div>
                        </div>
                        {/* Body: photo + details */}
                        <div className="flex gap-2 items-start">
                          <div className="shrink-0">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt={student.name} className="w-12 h-14 object-cover rounded border" />
                            ) : (
                              <div className="w-12 h-14 rounded border bg-muted flex items-center justify-center text-muted-foreground">
                                <User className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold leading-snug pr-4">{student.name}</p>
                            <p className="text-[9px] text-muted-foreground font-mono">{student.studentNumber}</p>
                            <div className="mt-1 text-[9px] text-muted-foreground space-y-0.5">
                              <p>Class: <span className="text-foreground font-medium">{cls?.name ?? "—"}</span></p>
                              <p>Gender: <span className="text-foreground capitalize">{student.gender ?? "—"}</span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {idCardStudents.length === 0 && (
                  <div className="col-span-3 text-center py-10 text-muted-foreground text-sm">No active students in selected class.</div>
                )}
              </div>
              {/* Select-all helper below grid */}
              {idCardStudents.length > 0 && (
                <div className="px-4 pb-3 print:hidden flex items-center gap-3">
                  <button
                    className="text-xs text-primary underline"
                    onClick={() => {
                      if (idCardSelected.size === idCardStudents.length) setIdCardSelected(new Set());
                      else setIdCardSelected(new Set(idCardStudents.map(s => s.id)));
                    }}
                  >
                    {idCardSelected.size === idCardStudents.length ? "Deselect all" : "Select all"}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    Click cards or use checkboxes to select for printing
                  </span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Promotion Wizard (3-step) ── */}
        <Dialog open={eoyOpen} onOpenChange={v => { if (!v) setEoyOpen(false); }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />Promotion Wizard
                <span className="ml-auto text-sm font-normal text-muted-foreground">Step {eoyStep} of 3</span>
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1">

              {/* Step 1: Choose mode */}
              {eoyStep === 1 && (
                <div className="space-y-4 p-1">
                  <p className="text-sm text-muted-foreground">How would you like to promote students?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setEoyMode("single")}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${eoyMode === "single" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`}
                    >
                      <div className="font-semibold text-sm mb-1">Single Class</div>
                      <div className="text-xs text-muted-foreground">Select one class and move specific students to another class.</div>
                    </button>
                    <button
                      onClick={() => setEoyMode("all")}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${eoyMode === "all" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`}
                    >
                      <div className="font-semibold text-sm mb-1">End-of-Year (All Classes)</div>
                      <div className="text-xs text-muted-foreground">Promote all classes at once with automatic or custom mappings.</div>
                    </button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Academic Year being completed</Label>
                    <Input value={eoyYear} onChange={e => setEoyYear(e.target.value)} placeholder="e.g. 2024/2025" className="max-w-xs" />
                  </div>
                </div>
              )}

              {/* Step 2 — Single Class: pick source/target + students */}
              {eoyStep === 2 && eoyMode === "single" && (
                <div className="space-y-4 p-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">From Class</Label>
                      <Select value={eoySingleSource} onValueChange={v => { setEoySingleSource(v); setEoySingleSelected(new Set()); }}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>{sortedClasses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">To Class</Label>
                      <Select value={eoySingleTarget} onValueChange={setEoySingleTarget}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>{sortedClasses.filter(c => String(c.id) !== eoySingleSource).map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  {eoySingleSource && (() => {
                    const singleStudents = (students ?? []).filter(s => String(s.classId) === eoySingleSource && s.status === "active");
                    const allSel = singleStudents.length > 0 && singleStudents.every(s => eoySingleSelected.has(s.id));
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Students ({singleStudents.length})</Label>
                          <button className="text-xs text-primary underline" onClick={() => {
                            if (allSel) setEoySingleSelected(new Set());
                            else setEoySingleSelected(new Set(singleStudents.map(s => s.id)));
                          }}>{allSel ? "Deselect all" : "Select all"}</button>
                        </div>
                        <div className="max-h-52 overflow-y-auto border rounded-md divide-y">
                          {singleStudents.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No active students in this class.</p>
                          ) : singleStudents.map(s => (
                            <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer">
                              <Checkbox checked={eoySingleSelected.has(s.id)} onCheckedChange={checked => {
                                const next = new Set(eoySingleSelected);
                                if (checked) next.add(s.id); else next.delete(s.id);
                                setEoySingleSelected(next);
                              }} />
                              <span className="text-sm flex-1">{s.name}</span>
                              <span className="text-xs text-muted-foreground font-mono">{s.studentNumber}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{eoySingleSelected.size} selected</p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Step 2 — All Classes: mapping editor with auto-suggest */}
              {eoyStep === 2 && eoyMode === "all" && (
                <div className="space-y-4 p-1">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                    Map each class to its destination. Students in a final-year class (e.g. JHS 3) can be graduated.
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Class Promotion Mapping</Label>
                    <Button variant="outline" size="sm" onClick={autoSuggestMappings} className="text-xs gap-1.5">
                      <RotateCcw className="w-3 h-3" />Auto-Suggest
                    </Button>
                  </div>
                  <div className="border rounded-lg divide-y overflow-hidden">
                    {sortedClasses.map(cls => {
                      const mapping = eoyMappings.find(m => m.fromClassId === cls.id);
                      const studentCount = (students ?? []).filter(s => s.classId === cls.id && s.status === "active").length;
                      return (
                        <div key={cls.id} className="flex items-center gap-3 px-3 py-2 bg-white hover:bg-muted/30">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{cls.name}</p>
                            <p className="text-xs text-muted-foreground">{studentCount} active students</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          <Select
                            value={mapping?.toClassId !== undefined && mapping?.toClassId !== null ? String(mapping.toClassId) : "graduate"}
                            onValueChange={v => setEoyMappings(prev => prev.map(m => m.fromClassId === cls.id ? { ...m, toClassId: v === "graduate" ? null : parseInt(v) } : m))}
                          >
                            <SelectTrigger className="w-44 text-sm"><SelectValue placeholder="Select destination" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="graduate">🎓 Graduate (no class)</SelectItem>
                              {sortedClasses.filter(c => c.id !== cls.id).map(c => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Review + confirm */}
              {eoyStep === 3 && (
                <div className="space-y-4 p-1">
                  <p className="text-sm text-muted-foreground">Review the movements below, then confirm.</p>
                  {eoyMode === "single" ? (
                    <div className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{sortedClasses.find(c => String(c.id) === eoySingleSource)?.name ?? "—"}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{sortedClasses.find(c => String(c.id) === eoySingleTarget)?.name ?? "—"}</span>
                        <Badge variant="outline" className="ml-auto">{eoySingleSelected.size} student(s)</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Academic Year: {eoyYear}</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg divide-y overflow-hidden">
                      {eoyMappings.map(m => {
                        const fromCls = sortedClasses.find(c => c.id === m.fromClassId);
                        const toCls = sortedClasses.find(c => c.id === m.toClassId);
                        const count = (students ?? []).filter(s => s.classId === m.fromClassId && s.status === "active").length;
                        if (count === 0) return null;
                        return (
                          <div key={m.fromClassId} className="flex items-center gap-3 px-3 py-2.5">
                            <span className="text-sm flex-1">{fromCls?.name}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{toCls?.name ?? "🎓 Graduate"}</span>
                            <Badge variant="outline" className="text-xs ml-auto">{count} students</Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-sm font-medium">
                    Total: {eoyMode === "single"
                      ? eoySingleSelected.size
                      : eoyMappings.reduce((sum, m) => sum + (students ?? []).filter(s => s.classId === m.fromClassId && s.status === "active").length, 0)
                    } student(s) will be promoted
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-3 border-t shrink-0">
              <Button variant="outline" onClick={() => {
                if (eoyStep === 1) setEoyOpen(false);
                else setEoyStep(s => s - 1);
              }}>
                {eoyStep === 1 ? "Cancel" : <><ChevronLeft className="w-4 h-4 mr-1" />Back</>}
              </Button>
              {eoyStep < 3 ? (
                <Button
                  onClick={() => setEoyStep(s => s + 1)}
                  disabled={
                    sortedClasses.length === 0 ||
                    (eoyStep === 2 && eoyMode === "single" && (eoySingleSelected.size === 0 || !eoySingleTarget || !eoySingleSource))
                  }
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={eoyMode === "single" ? handleEoySinglePromote : handleEoyPromote}
                  disabled={eoyPromoting}
                  className="bg-primary"
                >
                  {eoyPromoting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Promoting…</> : "Confirm & Promote"}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Student table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Students ({filtered.length})
              </CardTitle>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {sortedClasses.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>[{LEVEL_LABELS[c.level ?? "primary"] ?? c.level}] {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterWaiver} onValueChange={setFilterWaiver}>
                  <SelectTrigger className="w-40">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder="All waivers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All students</SelectItem>
                    <SelectItem value="any">Has any waiver</SelectItem>
                    <SelectItem value="fee">School fee waiver</SelectItem>
                    <SelectItem value="feeding">Feeding waiver</SelectItem>
                    <SelectItem value="bus">Bus waiver</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search name or ID…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(student => {
                  const cls = (classes ?? []).find(c => c.id === student.classId);
                  return (
                    <TableRow key={student.id} className={student._localOnly ? "opacity-70 italic" : ""}>
                      <TableCell className="font-medium">
                        {student.name}{student._localOnly ? " (pending)" : ""}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{student.studentNumber}</TableCell>
                      <TableCell>
                        {cls ? (
                          <span className="text-sm">
                            <span className="text-xs text-muted-foreground mr-1">[{LEVEL_LABELS[cls.level ?? "primary"] ?? cls.level}]</span>
                            {cls.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{student.parentName}</div>
                        <div className="text-xs text-muted-foreground">{student.parentPhone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="capitalize text-xs w-fit">
                            {student.category?.replace("_", " ") || "regular"}
                          </Badge>
                          {(student.feeWaiver || student.feedingWaiver || student.busWaiver) && (
                            <div className="flex flex-wrap gap-1">
                              {student.feeWaiver && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] bg-violet-50 text-violet-700 border border-violet-200 rounded px-1.5 py-0.5 font-medium">
                                  <ShieldCheck className="w-2.5 h-2.5" />Fee
                                </span>
                              )}
                              {student.feedingWaiver && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 font-medium">
                                  <ShieldCheck className="w-2.5 h-2.5" />Feeding
                                </span>
                              )}
                              {student.busWaiver && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 font-medium">
                                  <ShieldCheck className="w-2.5 h-2.5" />Bus
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.status === "active" ? "default" : "secondary"} className="capitalize text-xs">
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost" size="sm" title="Edit"
                            onClick={() => {
                              setEditing(student);
                              setForm({
                                name: student.name,
                                studentNumber: student.studentNumber || "",
                                dateOfBirth: student.dateOfBirth || "",
                                gender: student.gender || "male",
                                classId: student.classId?.toString() || "",
                                parentName: student.parentName || "",
                                parentPhone: student.parentPhone || "",
                                category: student.category || "regular",
                                status: student.status || "active",
                                photoUrl: student.photoUrl || "",
                                feeWaiver: student.feeWaiver ?? false,
                                feedingWaiver: student.feedingWaiver ?? false,
                                busWaiver: student.busWaiver ?? false,
                              });
                              setOpen(true);
                            }}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" title="View Profile" onClick={() => navigate(`/school/${schoolSlug}/students/${student.id}`)} disabled={!!student._localOnly}>
                            <Users className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Report Card" onClick={() => navigate(`/school/${schoolSlug}/students/${student.id}/report`)} disabled={!!student._localOnly}>
                            <FileText className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Move class" onClick={() => openPromote(student)} disabled={!!student._localOnly}>
                            <ArrowUpDown className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Class history" onClick={() => openHistory(student)} disabled={!!student._localOnly}>
                            <History className="w-3 h-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Student</AlertDialogTitle>
                                <AlertDialogDescription>Remove {student.name} from the system?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(student.id)}>Remove</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filtered.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No students found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SchoolAdminLayout>
  );
}
