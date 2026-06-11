import { useSchoolId } from "@/lib/school-hooks";
import { useState } from "react";
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
import { Plus, Search, Trash2, Users, Key, Copy, Check, RefreshCw, ShieldCheck, Download, BookOpen, Pencil } from "lucide-react";
import { useLocalTeachers, useCreateTeacherOffline, useDeleteTeacherOffline } from "@/lib/offline-hooks";
import { localDb } from "@/lib/local-db";
import { useEffect } from "react";

interface Credentials {
  username: string;
  password: string;
}

interface Props {
  params: { schoolSlug: string };
}

export default function Teachers({ params }: Props) {
  const { schoolSlug } = params;
  const schoolId = useSchoolId();
  const sid = schoolId;
  const teachers = useLocalTeachers(sid);
  const createTeacher = useCreateTeacherOffline(sid);
  const deleteTeacher = useDeleteTeacherOffline(sid);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const emptyForm = { name: "", email: "", phone: "", subject: "", status: "active" };
  const [form, setForm] = useState(emptyForm);

  // Class assignment (add dialog)
  const [classes, setClasses] = useState<any[]>([]);
  const [assignClassId, setAssignClassId] = useState("");
  const [assignJhsSubject, setAssignJhsSubject] = useState("");

  useEffect(() => {
    if (!open || !schoolId) return;
    fetch(`/api/schools/${schoolId}/classes`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(setClasses)
      .catch(() => {});
  }, [open, schoolId]);

  // ── Edit teacher ───────────────────────────────────────────────────
  const [editTeacher, setEditTeacher] = useState<any | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editClasses, setEditClasses] = useState<any[]>([]);
  const [editCurrentClassId, setEditCurrentClassId] = useState<string>("");
  const [editNewClassId, setEditNewClassId] = useState<string>("__same__");
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = async (teacher: any) => {
    setEditTeacher(teacher);
    setEditForm({ name: teacher.name, email: teacher.email ?? "", phone: teacher.phone ?? "", subject: teacher.subject ?? "", status: teacher.status ?? "active" });
    setEditNewClassId("__same__");
    if (!schoolId) return;
    try {
      const res = await fetch(`/api/schools/${schoolId}/classes`, { credentials: "include" });
      if (res.ok) {
        const cls: any[] = await res.json();
        setEditClasses(cls);
        // find which non-JHS class currently has this teacher as homeroom
        const currentCls = cls.find(c => c.teacherId === teacher.id && c.level !== "jhs");
        setEditCurrentClassId(currentCls ? String(currentCls.id) : "");
      }
    } catch {
      setEditClasses([]);
      setEditCurrentClassId("");
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeacher || !schoolId) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/teachers/${editTeacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editForm.name, email: editForm.email || null, phone: editForm.phone || null, subject: editForm.subject || null, status: editForm.status }),
      });
      if (!res.ok) throw new Error("Failed to update teacher");
      const updated = await res.json();

      // Reflect changes locally in Dexie
      await localDb.teachers.update(editTeacher.id, { name: updated.name, email: updated.email ?? null, phone: updated.phone ?? null, subject: updated.subject ?? null, status: updated.status });

      // Handle class reassignment if changed
      const newClassVal = editNewClassId === "__same__" ? editCurrentClassId : (editNewClassId === "__none__" ? "" : editNewClassId);
      if (newClassVal !== editCurrentClassId) {
        // Unassign from old class
        if (editCurrentClassId) {
          const oldCls = editClasses.find(c => String(c.id) === editCurrentClassId);
          if (oldCls) {
            await fetch(`/api/schools/${schoolId}/classes/${editCurrentClassId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ name: oldCls.name, grade: oldCls.grade, level: oldCls.level, teacherId: null }),
            });
            await localDb.classes.update(parseInt(editCurrentClassId), { teacherId: null });
          }
        }
        // Assign to new class
        if (newClassVal) {
          const newCls = editClasses.find(c => String(c.id) === newClassVal);
          if (newCls) {
            await fetch(`/api/schools/${schoolId}/classes/${newClassVal}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ name: newCls.name, grade: newCls.grade, level: newCls.level, teacherId: editTeacher.id }),
            });
            await localDb.classes.update(parseInt(newClassVal), { teacherId: editTeacher.id });
          }
        }
      }

      toast({ title: "Teacher updated", description: `${updated.name} saved.` });
      setEditTeacher(null);
    } catch {
      toast({ variant: "destructive", title: "Error updating teacher" });
    } finally {
      setEditSaving(false);
    }
  };

  // ── Credentials ────────────────────────────────────────────────────
  const [credDialogTeacherId, setCredDialogTeacherId] = useState<number | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [generatingCred, setGeneratingCred] = useState(false);
  const [copied, setCopied] = useState(false);

  const filtered = (teachers ?? []).filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.subject || "").toLowerCase().includes(search.toLowerCase())
  );

  const PRIMARY_SUBJECTS = ["English Language", "Mathematics", "Integrated Science", "Social Studies", "Religious & Moral Education", "Creative Arts", "Ghanaian Language", "French", "ICT", "Physical Education", "History"];

  const selectedClass = classes.find(c => String(c.id) === assignClassId);
  const isJhsClass = selectedClass?.level === "jhs";
  // Hybrid: non-JHS class with subject-teacher mode enabled — assign as subject teacher, not homeroom
  const isHybridClass = !isJhsClass && !!selectedClass?.useSubjectTeachers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (assignClassId) {
        // Online path: create via API so we get back the real server-assigned ID,
        // then immediately mirror the result into Dexie so the UI updates instantly.
        const res = await fetch(`/api/schools/${schoolId}/teachers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: form.name, email: form.email || undefined, phone: form.phone || undefined, subject: form.subject || undefined, status: form.status }),
        });
        if (!res.ok) throw new Error("Failed to create teacher");
        const teacher = await res.json();
        const teacherId: number = teacher.id;

        // Write teacher to local DB so it appears in the list immediately.
        await localDb.teachers.put({
          id: teacherId,
          schoolId: schoolId!,
          name: teacher.name,
          email: teacher.email ?? null,
          phone: teacher.phone ?? null,
          subject: teacher.subject ?? null,
          status: teacher.status ?? "active",
          createdAt: teacher.createdAt ?? new Date().toISOString(),
        });

        if ((isJhsClass || isHybridClass) && assignJhsSubject.trim()) {
          await fetch(`/api/schools/${schoolId}/classes/${assignClassId}/subjects`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ subject: assignJhsSubject.trim(), teacherId }),
          });
          // Subject assignments live in class_subjects table — dialog re-fetches each open.
        } else if (!isJhsClass && !isHybridClass) {
          await fetch(`/api/schools/${schoolId}/classes/${assignClassId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ teacherId, name: selectedClass.name, grade: selectedClass.grade, level: selectedClass.level }),
          });
          // Mirror the homeroom assignment into local DB so the class card updates.
          await localDb.classes.update(parseInt(assignClassId), { teacherId });
        }
        toast({ title: "Teacher added & assigned", description: `${form.name} assigned to ${selectedClass?.name}` });
      } else {
        await createTeacher({ name: form.name, email: form.email || undefined, phone: form.phone || undefined, subject: form.subject || undefined });
        toast({ title: "Teacher added", description: "Saved locally, will sync when online." });
      }

      setOpen(false);
      setForm(emptyForm);
      setAssignClassId("");
      setAssignJhsSubject("");
    } catch {
      toast({ variant: "destructive", title: "Error adding teacher" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    try {
      await deleteTeacher(id);
      toast({ title: "Teacher removed", description: `${name} removed. Will sync when online.` });
    } catch {
      toast({ variant: "destructive", title: "Error removing teacher" });
    }
  };

  const handleGenerateCredentials = async (teacherId: number) => {
    setGeneratingCred(true);
    setCredentials(null);
    try {
      const res = await fetch(`/api/schools/${schoolId}/teachers/${teacherId}/generate-credentials`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) { toast({ variant: "destructive", title: "Failed to generate credentials" }); return; }
      const data = await res.json();
      setCredentials(data);
    } catch {
      toast({ variant: "destructive", title: "Network error" });
    } finally {
      setGeneratingCred(false);
    }
  };

  const handleCopy = async () => {
    if (!credentials) return;
    const loginUrl = `${window.location.origin}/teacher-login?school=${schoolSlug}`;
    const text = `Username: ${credentials.username}\nPassword: ${credentials.password}\nLogin URL: ${loginUrl}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const credTeacher = (teachers ?? []).find(t => t.id === credDialogTeacherId);
  const editNonJhsClasses = editClasses.filter(c => c.level !== "jhs");

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
            <p className="text-muted-foreground">Manage teaching staff and assign portal login credentials.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              fetch(`/api/schools/${schoolId}/export/teachers`, { credentials: "include" })
                .then(r => r.blob())
                .then(blob => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "teachers.csv"; a.click(); });
            }}>
              <Download className="w-4 h-4" />Export
            </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setForm(emptyForm)}>
                <Plus className="w-4 h-4 mr-2" />Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
              <DialogHeader><DialogTitle>Add New Teacher</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 gap-4">
                <div className="overflow-y-auto flex-1 pr-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Full Name</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject (optional)</Label>
                    <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" />
                  </div>
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
                </div>

                {/* Class Assignment */}
                <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />Class Assignment <span className="text-muted-foreground font-normal">(optional)</span>
                  </p>
                  <div className="space-y-2">
                    <Label className="text-xs">Assign to Class</Label>
                    <Select value={assignClassId || "__none__"} onValueChange={v => { setAssignClassId(v === "__none__" ? "" : v); setAssignJhsSubject(""); }}>
                      <SelectTrigger><SelectValue placeholder="None — assign later" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None — assign later</SelectItem>
                        {classes.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}{c.level === "jhs" ? " (JHS)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {assignClassId && !isJhsClass && !isHybridClass && (
                    <p className="text-xs text-muted-foreground">Will be set as homeroom teacher for {selectedClass?.name}.</p>
                  )}
                  {assignClassId && (isJhsClass || isHybridClass) && (
                    <div className="space-y-2">
                      <Label className="text-xs">Subject to Teach <span className="text-destructive">*</span></Label>
                      {isHybridClass ? (
                        <Select value={assignJhsSubject} onValueChange={setAssignJhsSubject}>
                          <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                          <SelectContent>
                            {PRIMARY_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={assignJhsSubject}
                          onChange={e => setAssignJhsSubject(e.target.value)}
                          placeholder="e.g. Mathematics, English, Science"
                        />
                      )}
                      <p className="text-xs text-muted-foreground">
                        {isHybridClass
                          ? `Will be assigned as subject teacher for ${selectedClass?.name} — the homeroom teacher remains unchanged.`
                          : "JHS: specify which subject this teacher covers in that class."}
                      </p>
                    </div>
                  )}
                  {assignClassId && <p className="text-xs text-amber-600">Note: class assignment requires an online connection.</p>}
                </div>
                </div>

                <Button type="submit" className="w-full shrink-0" disabled={saving || (!!assignClassId && (isJhsClass || isHybridClass) && !assignJhsSubject.trim())}>
                  {saving ? "Adding..." : "Add Teacher"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* ── Edit Teacher Dialog ── */}
        <Dialog open={editTeacher !== null} onOpenChange={v => { if (!v) setEditTeacher(null); }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader><DialogTitle>Edit Teacher</DialogTitle></DialogHeader>
            <form onSubmit={handleEditSave} className="flex flex-col flex-1 min-h-0 gap-4">
              <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Full Name</Label>
                  <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={editForm.subject} onChange={e => setEditForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Class reassignment (non-JHS homeroom only) */}
              <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />Homeroom Class
                </p>
                {editCurrentClassId && (
                  <p className="text-xs text-muted-foreground">
                    Currently assigned to: <span className="font-medium text-foreground">{editClasses.find(c => String(c.id) === editCurrentClassId)?.name ?? "—"}</span>
                  </p>
                )}
                <Select value={editNewClassId} onValueChange={setEditNewClassId}>
                  <SelectTrigger><SelectValue placeholder="Keep current assignment" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__same__">Keep current assignment</SelectItem>
                    <SelectItem value="__none__">Remove from class</SelectItem>
                    {editNonJhsClasses.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Only Nursery/KG/Primary homeroom. JHS subject assignment is managed from the Classes page.</p>
                <p className="text-xs text-amber-600">Requires an online connection to save class changes.</p>
              </div>
              </div>

              <Button type="submit" className="w-full shrink-0" disabled={editSaving}>
                {editSaving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Credentials Dialog */}
        <Dialog open={credDialogTeacherId !== null} onOpenChange={v => { if (!v) { setCredDialogTeacherId(null); setCredentials(null); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Portal Login — {credTeacher?.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                <ShieldCheck className="w-4 h-4 inline mr-1" />
                The teacher will be required to change their password on first login.
              </div>

              {!credentials ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Click below to auto-generate a username and temporary password for this teacher.
                    If they already have credentials, this will reset their password.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => credDialogTeacherId && handleGenerateCredentials(credDialogTeacherId)}
                    disabled={generatingCred}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${generatingCred ? "animate-spin" : ""}`} />
                    {generatingCred ? "Generating..." : "Generate / Reset Credentials"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-50 border rounded-md p-4 font-mono text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Username:</span>
                      <span className="font-semibold">{credentials.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Password:</span>
                      <span className="font-semibold">{credentials.password}</span>
                    </div>
                    <div className="flex flex-col gap-1 pt-1 border-t">
                      <span className="text-muted-foreground">Login URL:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-600 break-all flex-1">
                          {window.location.origin}/teacher-login?school={schoolSlug}
                        </span>
                        <button
                          type="button"
                          title="Copy URL"
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/teacher-login?school=${schoolSlug}`);
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied!" : "Copy Credentials"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Note this password now — it cannot be retrieved again.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => credDialogTeacherId && handleGenerateCredentials(credDialogTeacherId)}
                    disabled={generatingCred}
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${generatingCred ? "animate-spin" : ""}`} />
                    Regenerate
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Teachers ({filtered.length})
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search teachers..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => (
                  <TableRow key={t.id} className={t._localOnly ? "opacity-70 italic" : ""}>
                    <TableCell className="font-medium">{t.name}{t._localOnly ? " (pending)" : ""}</TableCell>
                    <TableCell>
                      <div className="text-sm">{t.email}</div>
                      <div className="text-xs text-muted-foreground">{t.phone}</div>
                    </TableCell>
                    <TableCell>{t.subject || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === "active" ? "default" : "secondary"} className="capitalize">{t.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs"
                        disabled={!!t._localOnly}
                        onClick={() => { setCredDialogTeacherId(t.id); setCredentials(null); }}
                        title="Generate or reset portal login"
                      >
                        <Key className="w-3 h-3" />
                        Login
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!!t._localOnly}
                          onClick={() => openEdit(t)}
                          title="Edit teacher"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Teacher</AlertDialogTitle>
                              <AlertDialogDescription>Remove {t.name}?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(t.id, t.name)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No teachers found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Teacher portal info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <p className="font-medium mb-1">Teacher Portal</p>
          <p>Teachers log in at{" "}
            <code className="bg-blue-100 px-1 rounded break-all">/teacher-login?school={schoolSlug}</code>{" "}
            using their generated credentials.
            They can view their assigned students, enter scores, and generate terminal report cards.
            All new accounts require a password change on first login.</p>
        </div>
      </div>
    </SchoolAdminLayout>
  );
}
