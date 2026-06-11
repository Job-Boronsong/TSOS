import { useSchoolId } from "@/lib/school-hooks";
import { useState, useEffect } from "react";
import { SchoolAdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, BookOpen, Trash2, Users, GraduationCap, School, Pencil, BookMarked } from "lucide-react";
import { useLocalClasses, useLocalStudents, useLocalTeachers, useCreateClassOffline, useDeleteClassOffline } from "@/lib/offline-hooks";
import { localDb } from "@/lib/local-db";

const LEVELS = [
  { value: "nursery", label: "Nursery", color: "bg-pink-100 text-pink-700" },
  { value: "kg", label: "KG", color: "bg-purple-100 text-purple-700" },
  { value: "primary", label: "Primary", color: "bg-blue-100 text-blue-700" },
  { value: "jhs", label: "JHS", color: "bg-orange-100 text-orange-700" },
];

const JHS_SUBJECTS = [
  "Mathematics", "English Language", "Science", "Social Studies",
  "ICT", "Religious & Moral Education", "French", "Ghanaian Language",
  "Creative Arts", "Physical Education", "Career Technology", "Elective"
];

const PRIMARY_SUBJECTS = [
  "Mathematics", "English Language", "Science",
  "Our World & Our People", "Religious & Moral Education",
  "Ghanaian Language", "Creative Arts", "Physical Education",
  "Computing / ICT", "French", "Elective"
];

interface ClassSubject {
  id: number;
  classId: number;
  subject: string;
  teacherId: number | null;
  teacherName: string | null;
}

interface Props {
  params: { schoolSlug: string };
}

export default function Classes({ params }: Props) {
  const { schoolSlug } = params;
  const schoolId = useSchoolId();
  const sid = schoolId;
  const classes = useLocalClasses(sid);
  const students = useLocalStudents(sid);
  const teachers = useLocalTeachers(sid);
  const createClass = useCreateClassOffline(sid);
  const deleteClass = useDeleteClassOffline(sid);
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Edit class ─────────────────────────────────────────────────────
  const [editClass, setEditClass] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: "", grade: "", level: "primary", teacherId: "", useSubjectTeachers: false });
  const [editSaving, setEditSaving] = useState(false);

  const openEditClass = (cls: any) => {
    setEditClass(cls);
    setEditForm({ name: cls.name, grade: cls.grade ?? "", level: cls.level ?? "primary", teacherId: cls.teacherId ? String(cls.teacherId) : "__none__", useSubjectTeachers: cls.useSubjectTeachers ?? false });
  };

  const handleEditClassSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClass || !schoolId) return;
    setEditSaving(true);
    try {
      const teacherId = editForm.level !== "jhs" && editForm.teacherId && editForm.teacherId !== "__none__" ? parseInt(editForm.teacherId) : null;
      const useSubjectTeachers = editForm.level !== "jhs" ? editForm.useSubjectTeachers : false;
      const res = await fetch(`/api/schools/${schoolId}/classes/${editClass.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editForm.name, grade: editForm.grade || null, level: editForm.level, teacherId, useSubjectTeachers }),
      });
      if (!res.ok) throw new Error("Failed to update class");
      await localDb.classes.update(editClass.id, { name: editForm.name, grade: editForm.grade || null, level: editForm.level, teacherId, useSubjectTeachers });
      toast({ title: "Class updated", description: `${editForm.name} saved.` });
      setEditClass(null);
    } catch {
      toast({ variant: "destructive", title: "Error updating class" });
    } finally {
      setEditSaving(false);
    }
  };

  const [subjectDialogClassId, setSubjectDialogClassId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<ClassSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [addSubjectForm, setAddSubjectForm] = useState({ subject: "", teacherId: "" });
  const [addingSubject, setAddingSubject] = useState(false);

  const emptyForm = { name: "", grade: "", level: "primary", teacherId: "", useSubjectTeachers: false };
  const [form, setForm] = useState(emptyForm);

  const getStudentCount = (classId: number) =>
    (students ?? []).filter(s => s.classId === classId && s.status === "active").length;

  const getTeacherName = (teacherId: number | null) =>
    teacherId ? (teachers ?? []).find(t => t.id === teacherId)?.name ?? null : null;

  const getLevelMeta = (level: string) =>
    LEVELS.find(l => l.value === level) ?? LEVELS[2];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const teacherId = form.level !== "jhs" && form.teacherId ? parseInt(form.teacherId) : undefined;
      const useSubjectTeachers = form.level !== "jhs" ? form.useSubjectTeachers : false;
      await createClass({ name: form.name, grade: form.grade || undefined, level: form.level, teacherId, useSubjectTeachers });
      toast({ title: "Class created", description: "Saved locally, will sync when online." });
      setOpen(false);
      setForm(emptyForm);
    } catch {
      toast({ variant: "destructive", title: "Error creating class" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    try {
      await deleteClass(id);
      toast({ title: "Class removed", description: `${name} removed.` });
    } catch {
      toast({ variant: "destructive", title: "Error removing class" });
    }
  };

  // ── JHS Subject management (online only — calls API directly) ──

  const openSubjectDialog = async (classId: number) => {
    setSubjectDialogClassId(classId);
    setLoadingSubjects(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/classes/${classId}/subjects`, { credentials: "include" });
      if (res.ok) setSubjects(await res.json());
    } catch {
      toast({ variant: "destructive", title: "Failed to load subjects" });
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectDialogClassId || !addSubjectForm.subject) return;
    setAddingSubject(true);
    try {
      const rawTeacherId = addSubjectForm.teacherId;
      const parsedTeacherId = rawTeacherId && rawTeacherId !== "none" ? parseInt(rawTeacherId) : null;
      const res = await fetch(`/api/schools/${schoolId}/classes/${subjectDialogClassId}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subject: addSubjectForm.subject,
          teacherId: parsedTeacherId,
        }),
      });
      if (res.ok) {
        const newSubject = await res.json();
        setSubjects(prev => [...prev, newSubject]);
        setAddSubjectForm({ subject: "", teacherId: "" });
        toast({ title: "Subject added" });
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to add subject" });
    } finally {
      setAddingSubject(false);
    }
  };

  const handleRemoveSubject = async (subjectId: number) => {
    if (!subjectDialogClassId) return;
    try {
      await fetch(`/api/schools/${schoolId}/classes/${subjectDialogClassId}/subjects/${subjectId}`, {
        method: "DELETE", credentials: "include",
      });
      setSubjects(prev => prev.filter(s => s.id !== subjectId));
      toast({ title: "Subject removed" });
    } catch {
      toast({ variant: "destructive", title: "Failed to remove subject" });
    }
  };

  const subjectDialogClass = (classes ?? []).find(c => c.id === subjectDialogClassId);

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
            <p className="text-muted-foreground">Manage class sections. JHS uses subject teachers; Nursery/KG/Primary use a homeroom teacher (with optional subject teachers for hybrid classes).</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setForm(emptyForm)}>
                <Plus className="w-4 h-4 mr-2" />Add Class
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Add New Class</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Class Name</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. JHS 1A or Primary 3B" required />
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v, teacherId: "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEVELS.map(l => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Grade / Year</Label>
                  <Input value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} placeholder="e.g. 1, 2, 3" />
                </div>
                {form.level !== "jhs" && (
                  <div className="space-y-2">
                    <Label>Homeroom Teacher</Label>
                    <Select value={form.teacherId} onValueChange={v => setForm(f => ({ ...f, teacherId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select teacher (optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No teacher assigned</SelectItem>
                        {(teachers ?? []).filter(t => t.status === "active").map(t => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">This teacher manages attendance and remaining subjects.</p>
                  </div>
                )}
                {form.level !== "jhs" && (
                  <div className="flex items-start gap-3 p-3 rounded-md border bg-muted/30">
                    <input
                      type="checkbox"
                      id="create-use-subject-teachers"
                      checked={form.useSubjectTeachers}
                      onChange={e => setForm(f => ({ ...f, useSubjectTeachers: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
                    />
                    <div>
                      <label htmlFor="create-use-subject-teachers" className="text-sm font-medium cursor-pointer">
                        Enable subject teachers (hybrid mode)
                      </label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Assign specialist teachers to individual subjects. Homeroom teacher covers the rest.
                      </p>
                    </div>
                  </div>
                )}
                {form.level === "jhs" && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-md text-sm text-orange-700">
                    <GraduationCap className="w-4 h-4 inline mr-1" />
                    JHS class — subject teachers will be assigned after creation.
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Creating..." : "Create Class"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Group by level */}
        {LEVELS.map(lvl => {
          const levelClasses = (classes ?? []).filter(c => (c.level ?? "primary") === lvl.value);
          if (!levelClasses.length) return null;
          return (
            <div key={lvl.value}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-sm font-medium ${lvl.color}`}>{lvl.label}</span>
                <span className="text-muted-foreground text-sm font-normal">{levelClasses.length} class{levelClasses.length !== 1 ? "es" : ""}</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {levelClasses.map(cls => (
                  <Card key={cls.id} className={cls._localOnly ? "opacity-70" : ""}>
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                      <div>
                        <CardTitle className="text-base">{cls.name}{cls._localOnly ? " (pending)" : ""}</CardTitle>
                        {cls.grade && <p className="text-xs text-muted-foreground mt-0.5">Grade {cls.grade}</p>}
                      </div>
                      <div className="flex items-center gap-0.5 -mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!!cls._localOnly}
                          onClick={() => openEditClass(cls)}
                          title="Edit class"
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
                              <AlertDialogTitle>Remove Class</AlertDialogTitle>
                              <AlertDialogDescription>Remove {cls.name}? This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(cls.id, cls.name)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span>{getStudentCount(cls.id)} students</span>
                      </div>
                      {cls.level !== "jhs" ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm">
                            {getTeacherName(cls.teacherId) ? (
                              <Badge variant="outline" className="text-xs font-normal">
                                <School className="w-3 h-3 mr-1" />
                                {getTeacherName(cls.teacherId)}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No homeroom teacher</span>
                            )}
                            {cls.useSubjectTeachers && (
                              <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200 font-normal">
                                <BookMarked className="w-3 h-3 mr-1" />hybrid
                              </Badge>
                            )}
                          </div>
                          {cls.useSubjectTeachers && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs gap-1"
                              onClick={() => openSubjectDialog(cls.id)}
                              disabled={!!cls._localOnly}
                            >
                              <GraduationCap className="w-3 h-3" />
                              Manage Subject Teachers
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs gap-1"
                          onClick={() => openSubjectDialog(cls.id)}
                          disabled={!!cls._localOnly}
                        >
                          <GraduationCap className="w-3 h-3" />
                          Manage Subject Teachers
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {!(classes ?? []).length && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No classes yet. Add your first class to get started.</p>
          </div>
        )}
      </div>

      {/* Edit Class Dialog */}
      <Dialog open={editClass !== null} onOpenChange={v => { if (!v) setEditClass(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Class — {editClass?.name}</DialogTitle></DialogHeader>
          <form onSubmit={handleEditClassSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Class Name</Label>
              <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={editForm.level} onValueChange={v => setEditForm(f => ({ ...f, level: v, teacherId: "__none__" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grade / Year</Label>
              <Input value={editForm.grade} onChange={e => setEditForm(f => ({ ...f, grade: e.target.value }))} placeholder="e.g. 1, 2, 3" />
            </div>
            {editForm.level !== "jhs" && (
              <div className="space-y-2">
                <Label>Homeroom Teacher</Label>
                <Select value={editForm.teacherId || "__none__"} onValueChange={v => setEditForm(f => ({ ...f, teacherId: v }))}>
                  <SelectTrigger><SelectValue placeholder="No teacher assigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No teacher assigned</SelectItem>
                    {(teachers ?? []).filter(t => t.status === "active").map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-amber-600">Requires an online connection to save.</p>
              </div>
            )}
            {editForm.level !== "jhs" && (
              <div className="flex items-start gap-3 p-3 rounded-md border bg-muted/30">
                <input
                  type="checkbox"
                  id="edit-use-subject-teachers"
                  checked={editForm.useSubjectTeachers}
                  onChange={e => setEditForm(f => ({ ...f, useSubjectTeachers: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
                />
                <div>
                  <label htmlFor="edit-use-subject-teachers" className="text-sm font-medium cursor-pointer">
                    Enable subject teachers (hybrid mode)
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Assign specialist teachers to individual subjects via "Manage Subject Teachers" on the card.
                  </p>
                </div>
              </div>
            )}
            {editForm.level === "jhs" && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-md text-sm text-orange-700">
                <GraduationCap className="w-4 h-4 inline mr-1" />
                JHS subject teachers are managed via "Manage Subject Teachers" on the class card.
              </div>
            )}
            <Button type="submit" className="w-full" disabled={editSaving}>
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* JHS Subject Assignments Dialog */}
      <Dialog open={subjectDialogClassId !== null} onOpenChange={v => { if (!v) setSubjectDialogClassId(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Subject Teachers — {subjectDialogClass?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <form onSubmit={handleAddSubject} className="flex gap-2">
              <div className="flex-1">
                <Select value={addSubjectForm.subject} onValueChange={v => setAddSubjectForm(f => ({ ...f, subject: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {(subjectDialogClass?.level === "jhs" ? JHS_SUBJECTS : PRIMARY_SUBJECTS).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={addSubjectForm.teacherId} onValueChange={v => setAddSubjectForm(f => ({ ...f, teacherId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Assign teacher" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No teacher yet</SelectItem>
                    {(teachers ?? []).filter(t => t.status === "active").map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={!addSubjectForm.subject || addingSubject} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </form>

            {loadingSubjects ? (
              <p className="text-center text-muted-foreground text-sm py-4">Loading subjects...</p>
            ) : subjects.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">No subjects assigned yet. Add subjects above.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.subject}</TableCell>
                      <TableCell className="text-muted-foreground">{s.teacherName ?? <span className="italic text-xs">Unassigned</span>}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRemoveSubject(s.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SchoolAdminLayout>
  );
}
