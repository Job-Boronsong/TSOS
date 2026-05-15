import { useSchoolId } from "@/lib/school-hooks";
import { useEffect, useState } from "react";
import { SchoolAdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2, Clock } from "lucide-react";
import { useLocalClasses, useLocalTeachers } from "@/lib/offline-hooks";

interface Props { params: { schoolSlug: string } }
interface Slot { id?: number; dayOfWeek: number; periodNumber: number; startTime: string; endTime: string; subject: string; teacherId: number | null }

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Timetable({ params }: Props) {
  const { schoolSlug } = params;
  const schoolId = useSchoolId();
  const sid = schoolId;
  const { toast } = useToast();
  const classes = useLocalClasses(sid);
  const teachers = useLocalTeachers(sid);

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editSlot, setEditSlot] = useState<Partial<Slot> & { day: number; period: number } | null>(null);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    fetch(`/api/schools/${sid}/timetable?classId=${selectedClass}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setSlots(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sid, selectedClass]);

  function getSlot(day: number, period: number): Slot | undefined {
    return slots.find(s => s.dayOfWeek === day && s.periodNumber === period);
  }

  function handleCellClick(day: number, period: number) {
    const existing = getSlot(day, period);
    setEditSlot({
      ...(existing ?? {}),
      day,
      period,
      dayOfWeek: day,
      periodNumber: period,
      startTime: existing?.startTime ?? "",
      endTime: existing?.endTime ?? "",
      subject: existing?.subject ?? "",
      teacherId: existing?.teacherId ?? null,
    });
  }

  function handleSaveSlot() {
    if (!editSlot) return;
    const { day, period, ...rest } = editSlot;
    setSlots(prev => {
      const filtered = prev.filter(s => !(s.dayOfWeek === day && s.periodNumber === period));
      if (!editSlot.subject) return filtered;
      return [...filtered, { ...rest, dayOfWeek: day, periodNumber: period } as Slot];
    });
    setEditSlot(null);
  }

  function handleDeleteSlot() {
    if (!editSlot) return;
    setSlots(prev => prev.filter(s => !(s.dayOfWeek === editSlot.day && s.periodNumber === editSlot.period)));
    setEditSlot(null);
  }

  async function saveTimetable() {
    if (!selectedClass) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/schools/${sid}/timetable/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ classId: parseInt(selectedClass), slots }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Timetable saved" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const teacherMap = Object.fromEntries(teachers.map(t => [t.id, t.name]));

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Clock className="w-6 h-6" />Timetable</h1>
          {selectedClass && (
            <Button onClick={saveTimetable} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />{saving ? "Saving…" : "Save Timetable"}
            </Button>
          )}
        </div>

        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {!selectedClass ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Select a class to view its timetable</CardContent></Card>
        ) : loading ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Loading…</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border p-2 text-left text-xs font-medium w-16">Period</th>
                    {DAYS.map(d => <th key={d} className="border p-2 text-center text-xs font-medium">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map(period => (
                    <tr key={period}>
                      <td className="border p-2 text-center text-xs text-muted-foreground font-medium bg-muted/30">{period}</td>
                      {DAYS.map((_, dayIdx) => {
                        const slot = getSlot(dayIdx + 1, period);
                        return (
                          <td key={dayIdx} className="border p-1 min-w-[120px]">
                            <button
                              onClick={() => handleCellClick(dayIdx + 1, period)}
                              className={`w-full h-full min-h-[56px] rounded text-left px-2 py-1 text-xs transition-colors ${slot ? "bg-primary/10 hover:bg-primary/20" : "hover:bg-muted/50 text-muted-foreground"}`}
                            >
                              {slot ? (
                                <div>
                                  <div className="font-semibold text-foreground">{slot.subject}</div>
                                  {slot.teacherId && <div className="text-muted-foreground mt-0.5">{teacherMap[slot.teacherId] ?? ""}</div>}
                                  {slot.startTime && <div className="text-muted-foreground">{slot.startTime}–{slot.endTime}</div>}
                                </div>
                              ) : (
                                <span className="flex items-center gap-1"><Plus className="w-3 h-3" />Add</span>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit slot dialog */}
      <Dialog open={!!editSlot} onOpenChange={() => setEditSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editSlot?.subject ? `Edit: ${DAYS[(editSlot.day ?? 1) - 1]} · Period ${editSlot.period}` : `Add: ${DAYS[(editSlot?.day ?? 1) - 1]} · Period ${editSlot?.period}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Subject</label>
              <Input
                value={editSlot?.subject ?? ""}
                onChange={e => setEditSlot(s => s ? { ...s, subject: e.target.value } : s)}
                placeholder="e.g. Mathematics"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Start Time</label>
                <Input type="time" value={editSlot?.startTime ?? ""} onChange={e => setEditSlot(s => s ? { ...s, startTime: e.target.value } : s)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Time</label>
                <Input type="time" value={editSlot?.endTime ?? ""} onChange={e => setEditSlot(s => s ? { ...s, endTime: e.target.value } : s)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Teacher (optional)</label>
              <Select
                value={editSlot?.teacherId ? String(editSlot.teacherId) : "none"}
                onValueChange={v => setEditSlot(s => s ? { ...s, teacherId: v === "none" ? null : parseInt(v) } : s)}
              >
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {teachers.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editSlot?.subject && (
              <Button variant="destructive" size="sm" onClick={handleDeleteSlot}><Trash2 className="w-4 h-4 mr-1" />Remove</Button>
            )}
            <Button onClick={handleSaveSlot}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SchoolAdminLayout>
  );
}
