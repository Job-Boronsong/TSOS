import { useSchoolId } from "@/lib/school-hooks";
import { useEffect, useState, useCallback } from "react";
import { SchoolAdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, Plus, Pencil, Trash2, Search } from "lucide-react";

interface Props { params: { schoolSlug: string } }
interface Student { id: number; name: string }
interface Teacher { id: number; name: string }
interface DisciplineRecord {
  id: number; studentId: number; studentName: string | null;
  teacherName: string | null; reportedByTeacherId: number | null;
  date: string; type: string; description: string;
  actionTaken: string | null; parentNotified: boolean;
  status: string; adminNotes: string | null;
  overriddenByAdmin: boolean; createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  detention: "bg-orange-100 text-orange-800 border-orange-300",
  suspension: "bg-red-100 text-red-800 border-red-300",
  commendation: "bg-green-100 text-green-800 border-green-300",
};

const STATUS_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default", resolved: "secondary", overridden: "outline",
};

const today = () => new Date().toISOString().split("T")[0];

export default function DisciplinePage({ params }: Props) {
  const schoolId = useSchoolId();
  const { toast } = useToast();

  const [records, setRecords] = useState<DisciplineRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Log dialog
  const [logOpen, setLogOpen] = useState(false);
  const [logForm, setLogForm] = useState({ studentId: "", date: today(), type: "warning", description: "", actionTaken: "", parentNotified: false, reportedByTeacherId: "none" });
  const [saving, setSaving] = useState(false);

  // Override dialog
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideRecord, setOverrideRecord] = useState<DisciplineRecord | null>(null);
  const [overrideForm, setOverrideForm] = useState({ description: "", actionTaken: "", parentNotified: false, status: "active", adminNotes: "", type: "warning" });
  const [savingOverride, setSavingOverride] = useState(false);

  const load = useCallback(() => {
    if (!schoolId) return;
    setLoading(true);
    const params: Record<string, string> = {};
    if (filterType !== "all") params.type = filterType;
    if (filterStatus !== "all") params.status = filterStatus;
    const qs = new URLSearchParams(params).toString();
    fetch(`/api/schools/${schoolId}/discipline${qs ? "?" + qs : ""}`, { credentials: "include" })
      .then(r => r.json()).then(d => setRecords(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [schoolId, filterType, filterStatus]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!schoolId) return;
    fetch(`/api/schools/${schoolId}/students`, { credentials: "include" }).then(r => r.json()).then(d => setStudents(Array.isArray(d) ? d : []));
    fetch(`/api/schools/${schoolId}/teachers`, { credentials: "include" }).then(r => r.json()).then(d => setTeachers(Array.isArray(d) ? d : []));
  }, [schoolId]);

  const saveLog = async () => {
    if (!logForm.studentId || !logForm.description) { toast({ title: "Student and description are required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = { ...logForm, reportedByTeacherId: logForm.reportedByTeacherId === "none" ? null : logForm.reportedByTeacherId };
      const res = await fetch(`/api/schools/${schoolId}/discipline`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setLogOpen(false);
      setLogForm({ studentId: "", date: today(), type: "warning", description: "", actionTaken: "", parentNotified: false, reportedByTeacherId: "none" });
      load();
      toast({ title: "Incident logged" });
    } catch { toast({ title: "Error saving incident", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const openOverride = (r: DisciplineRecord) => {
    setOverrideRecord(r);
    setOverrideForm({ description: r.description, actionTaken: r.actionTaken ?? "", parentNotified: r.parentNotified, status: r.status, adminNotes: r.adminNotes ?? "", type: r.type });
    setOverrideOpen(true);
  };

  const saveOverride = async () => {
    if (!overrideRecord) return;
    setSavingOverride(true);
    try {
      await fetch(`/api/schools/${schoolId}/discipline/${overrideRecord.id}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrideForm),
      });
      setOverrideOpen(false);
      load();
      toast({ title: "Record updated" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSavingOverride(false); }
  };

  const deleteRecord = async (id: number) => {
    if (!confirm("Delete this discipline record?")) return;
    await fetch(`/api/schools/${schoolId}/discipline/${id}`, { method: "DELETE", credentials: "include" });
    load();
    toast({ title: "Record deleted" });
  };

  const filtered = records.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.studentName ?? "").toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
  });

  return (
    <SchoolAdminLayout params={params}>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert className="w-6 h-6" /> Discipline Log</h1>
            <p className="text-muted-foreground text-sm mt-1">Track student incidents, commendations and admin overrides</p>
          </div>
          <Button onClick={() => setLogOpen(true)}><Plus className="w-4 h-4 mr-1" />Log Incident</Button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3">
          {(["warning", "detention", "suspension", "commendation"] as const).map(t => {
            const count = records.filter(r => r.type === t).length;
            return (
              <Card key={t} className="cursor-pointer hover:bg-muted/30" onClick={() => setFilterType(filterType === t ? "all" : t)}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="capitalize text-sm text-muted-foreground">{t}</span>
                    <span className={`text-lg font-bold px-2 py-0.5 rounded border text-xs ${TYPE_COLORS[t]}`}>{count}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search student or description…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="detention">Detention</SelectItem>
                  <SelectItem value="suspension">Suspension</SelectItem>
                  <SelectItem value="commendation">Commendation</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="overridden">Overridden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No records found</p>
            <p className="text-sm">Log a new incident or adjust your filters</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(r => (
              <Card key={r.id} className={r.overriddenByAdmin ? "border-blue-200" : ""}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold">{r.studentName ?? `Student #${r.studentId}`}</span>
                        <Badge className={`text-xs border ${TYPE_COLORS[r.type]}`} variant="outline">{r.type}</Badge>
                        <Badge variant={STATUS_BADGE[r.status] ?? "outline"}>{r.status}</Badge>
                        {r.overriddenByAdmin && <Badge variant="outline" className="text-blue-700 border-blue-300 text-xs">Admin Overridden</Badge>}
                        {r.parentNotified && <Badge variant="outline" className="text-xs">Parent Notified</Badge>}
                        <span className="text-xs text-muted-foreground">{r.date}</span>
                      </div>
                      <p className="text-sm">{r.description}</p>
                      {r.actionTaken && <p className="text-xs text-muted-foreground mt-1"><strong>Action:</strong> {r.actionTaken}</p>}
                      {r.adminNotes && <p className="text-xs text-blue-700 mt-1 bg-blue-50 px-2 py-1 rounded"><strong>Admin notes:</strong> {r.adminNotes}</p>}
                      {r.teacherName && <p className="text-xs text-muted-foreground mt-1">Reported by: {r.teacherName}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => openOverride(r)}><Pencil className="w-3.5 h-3.5 mr-1" />Override</Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => deleteRecord(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Log Incident Dialog */}
        <Dialog open={logOpen} onOpenChange={setLogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Incident</DialogTitle></DialogHeader>
            <div className="space-y-3 py-1">
              <div className="space-y-1">
                <Label>Student *</Label>
                <Select value={logForm.studentId} onValueChange={v => setLogForm(p => ({ ...p, studentId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input type="date" value={logForm.date} onChange={e => setLogForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={logForm.type} onValueChange={v => setLogForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="detention">Detention</SelectItem>
                      <SelectItem value="suspension">Suspension</SelectItem>
                      <SelectItem value="commendation">Commendation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description *</Label>
                <Textarea value={logForm.description} onChange={e => setLogForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the incident" rows={3} />
              </div>
              <div className="space-y-1">
                <Label>Action Taken</Label>
                <Input value={logForm.actionTaken} onChange={e => setLogForm(p => ({ ...p, actionTaken: e.target.value }))} placeholder="e.g. Called parents, given detention" />
              </div>
              <div className="space-y-1">
                <Label>Reported By Teacher</Label>
                <Select value={logForm.reportedByTeacherId} onValueChange={v => setLogForm(p => ({ ...p, reportedByTeacherId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select teacher (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {teachers.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="parentNotified" checked={logForm.parentNotified} onCheckedChange={v => setLogForm(p => ({ ...p, parentNotified: !!v }))} />
                <Label htmlFor="parentNotified">Parent/Guardian notified</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLogOpen(false)}>Cancel</Button>
              <Button onClick={saveLog} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Override Dialog */}
        <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Override Record — {overrideRecord?.studentName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={overrideForm.type} onValueChange={v => setOverrideForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="detention">Detention</SelectItem>
                      <SelectItem value="suspension">Suspension</SelectItem>
                      <SelectItem value="commendation">Commendation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={overrideForm.status} onValueChange={v => setOverrideForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="overridden">Overridden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={overrideForm.description} onChange={e => setOverrideForm(p => ({ ...p, description: e.target.value }))} rows={2} />
              </div>
              <div className="space-y-1">
                <Label>Action Taken</Label>
                <Input value={overrideForm.actionTaken} onChange={e => setOverrideForm(p => ({ ...p, actionTaken: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Admin Notes (override reason)</Label>
                <Textarea value={overrideForm.adminNotes} onChange={e => setOverrideForm(p => ({ ...p, adminNotes: e.target.value }))} placeholder="Reason for override or correction…" rows={2} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="pn2" checked={overrideForm.parentNotified} onCheckedChange={v => setOverrideForm(p => ({ ...p, parentNotified: !!v }))} />
                <Label htmlFor="pn2">Parent/Guardian notified</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOverrideOpen(false)}>Cancel</Button>
              <Button onClick={saveOverride} disabled={savingOverride}>{savingOverride && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Override</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SchoolAdminLayout>
  );
}
