import { useSchoolId } from "@/lib/school-hooks";
import { useEffect, useState } from "react";
import { SchoolAdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, Search, X } from "lucide-react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, parseISO,
} from "date-fns";

interface Props { params: { schoolSlug: string } }

interface CalEvent {
  id: number;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  category: string;
  targetType: string;
  targetIds: string;
}

interface ClassItem { id: number; name: string; level: string | null; }
interface TeacherItem { id: number; name: string; }

const CATEGORIES = [
  { value: "academic", label: "Academic", light: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  { value: "event", label: "Event", light: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
  { value: "exams", label: "Exams", light: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
  { value: "meeting", label: "Meeting", light: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-400" },
  { value: "holiday", label: "Holiday", light: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
];

function getCat(cat: string) {
  return CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[0];
}

const EMPTY_FORM = {
  title: "", description: "", startDate: "", endDate: "",
  startTime: "", endTime: "", category: "academic",
  targetType: "all_staff", targetIds: [] as number[],
};

export default function AcademicCalendar({ params }: Props) {
  const { schoolSlug } = params;
  const schoolId = useSchoolId();
  const { toast } = useToast();

  const [viewDate, setViewDate] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editEvent, setEditEvent] = useState<CalEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [classSearch, setClassSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");

  const monthStr = format(viewDate, "yyyy-MM");

  function fetchEvents() {
    if (!schoolId) return;
    setLoading(true);
    fetch(`/api/schools/${schoolId}/events?month=${monthStr}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setEvents(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchEvents(); }, [schoolId, monthStr]);

  function fetchClassesTeachers() {
    if (!schoolId || classes.length > 0) return;
    Promise.all([
      fetch(`/api/schools/${schoolId}/classes`, { credentials: "include" }).then(r => r.json()),
      fetch(`/api/schools/${schoolId}/teachers`, { credentials: "include" }).then(r => r.json()),
    ]).then(([cls, tch]) => {
      setClasses(Array.isArray(cls) ? cls : []);
      setTeachers(Array.isArray(tch) ? tch : []);
    }).catch(() => {});
  }

  function openNew(defaultDate?: string) {
    const today = defaultDate ?? format(new Date(), "yyyy-MM-dd");
    setEditEvent(null);
    setForm({ ...EMPTY_FORM, startDate: today, endDate: today });
    fetchClassesTeachers();
    setShowDialog(true);
  }

  function openEdit(ev: CalEvent) {
    setSelectedEvent(null);
    setEditEvent(ev);
    setForm({
      title: ev.title,
      description: ev.description ?? "",
      startDate: ev.startDate,
      endDate: ev.endDate,
      startTime: ev.startTime ?? "",
      endTime: ev.endTime ?? "",
      category: ev.category,
      targetType: ev.targetType,
      targetIds: JSON.parse(ev.targetIds || "[]"),
    });
    fetchClassesTeachers();
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.startDate || !form.endDate) {
      toast({ title: "Title, start date and end date are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const url = editEvent
        ? `/api/schools/${schoolId}/events/${editEvent.id}`
        : `/api/schools/${schoolId}/events`;
      const res = await fetch(url, {
        method: editEvent ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: editEvent ? "Event updated" : "Event created" });
      setShowDialog(false);
      fetchEvents();
    } catch (e: any) {
      toast({ title: "Failed to save", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this event?")) return;
    await fetch(`/api/schools/${schoolId}/events/${id}`, { method: "DELETE", credentials: "include" });
    toast({ title: "Event deleted" });
    setSelectedEvent(null);
    fetchEvents();
  }

  // ── Calendar grid ────────────────────────────────────────────────────────────
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  function eventsForDay(day: Date): CalEvent[] {
    const d = format(day, "yyyy-MM-dd");
    return events.filter(ev => d >= ev.startDate && d <= ev.endDate);
  }

  const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-6 h-6" />School Calendar
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setViewDate(d => subMonths(d, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[130px] text-center">
              {format(viewDate, "MMMM yyyy")}
            </span>
            <Button variant="outline" size="icon" onClick={() => setViewDate(d => addMonths(d, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setViewDate(new Date())}>Today</Button>
            <Button onClick={() => openNew()} className="gap-2">
              <Plus className="w-4 h-4" />New Event
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {CATEGORIES.map(c => (
            <div key={c.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
              {c.label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b bg-slate-50">
            {DAY_HEADERS.map(d => (
              <div key={d} className="py-2 text-xs font-semibold text-muted-foreground text-center border-r last:border-r-0">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calDays.map((day, i) => {
              const dayEvents = eventsForDay(day);
              const inMonth = isSameMonth(day, viewDate);
              const todayCell = isToday(day);
              const dayStr = format(day, "yyyy-MM-dd");
              const visible = dayEvents.slice(0, 3);
              const overflow = dayEvents.length - 3;
              return (
                <div
                  key={i}
                  onClick={() => openNew(dayStr)}
                  className={`min-h-[100px] border-b border-r last:border-r-0 p-1 cursor-pointer transition-colors
                    ${inMonth ? "bg-white hover:bg-slate-50" : "bg-slate-50/60 hover:bg-slate-100/60"}
                  `}
                >
                  <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 mx-0.5
                    ${todayCell ? "bg-primary text-white" : inMonth ? "text-foreground" : "text-muted-foreground/40"}
                  `}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {visible.map(ev => {
                      const cat = getCat(ev.category);
                      const isStart = dayStr === ev.startDate;
                      return (
                        <div
                          key={ev.id}
                          onClick={e => { e.stopPropagation(); setSelectedEvent(ev); }}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate cursor-pointer border ${cat.light}
                            ${isStart ? "rounded-l" : "rounded-none"}
                            ${dayStr === ev.endDate ? "rounded-r" : ""}
                          `}
                        >
                          {isStart && ev.startTime ? `${ev.startTime.slice(0, 5)} · ` : ""}
                          {ev.title}
                        </div>
                      );
                    })}
                    {overflow > 0 && (
                      <div className="text-[10px] text-muted-foreground px-1.5 font-medium">+{overflow} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Event Detail Modal ── */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${getCat(selectedEvent.category).dot}`} />
                {selectedEvent.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getCat(selectedEvent.category).light}`}>
                {getCat(selectedEvent.category).label}
              </span>
              <div>
                <span className="font-medium">Date: </span>
                <span className="text-muted-foreground">
                  {selectedEvent.startDate === selectedEvent.endDate
                    ? format(parseISO(selectedEvent.startDate + "T12:00:00"), "MMMM d, yyyy")
                    : `${format(parseISO(selectedEvent.startDate + "T12:00:00"), "MMM d")} – ${format(parseISO(selectedEvent.endDate + "T12:00:00"), "MMM d, yyyy")}`
                  }
                  {selectedEvent.startTime && ` · ${selectedEvent.startTime}${selectedEvent.endTime ? " – " + selectedEvent.endTime : ""}`}
                </span>
              </div>
              <div>
                <span className="font-medium">Audience: </span>
                <span className="text-muted-foreground">
                  {selectedEvent.targetType === "all_staff" ? "All Staff" : selectedEvent.targetType === "specific_classes" ? "Specific Classes" : "Specific Teachers"}
                </span>
              </div>
              {selectedEvent.description && (
                <p className="text-muted-foreground bg-slate-50 rounded-lg p-3">{selectedEvent.description}</p>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleDelete(selectedEvent.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 mr-auto">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />Delete
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEdit(selectedEvent)}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" />Edit
              </Button>
              <Button size="sm" onClick={() => setSelectedEvent(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg flex flex-col overflow-hidden max-h-[88vh]">
          <DialogHeader>
            <DialogTitle>{editEvent ? "Edit Event" : "New Calendar Event"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {/* Title */}
            <div>
              <label className="text-sm font-medium mb-1 block">Title *</label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Mid-Term Exams"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Start Date *</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(f => ({
                    ...f,
                    startDate: e.target.value,
                    endDate: f.endDate && f.endDate < e.target.value ? e.target.value : f.endDate,
                  }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Date *</label>
                <Input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Times */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Start Time <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Time <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>

            {/* Audience */}
            <div>
              <label className="text-sm font-medium mb-1 block">Audience</label>
              <Select value={form.targetType} onValueChange={v => { setForm(f => ({ ...f, targetType: v, targetIds: [] })); setClassSearch(""); setTeacherSearch(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_staff">All Staff</SelectItem>
                  <SelectItem value="specific_classes">Specific Classes</SelectItem>
                  <SelectItem value="specific_teachers">Specific Teachers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.targetType === "specific_classes" && classes.length > 0 && (() => {
              const filtered = classes.filter(c => c.name.toLowerCase().includes(classSearch.toLowerCase()));
              const selected = classes.filter(c => form.targetIds.includes(c.id));
              return (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Select Classes</label>
                    {selected.length > 0 && (
                      <span className="text-xs text-muted-foreground">{selected.length} selected</span>
                    )}
                  </div>
                  {/* Selected chips */}
                  {selected.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {selected.map(c => (
                        <span key={c.id} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {c.name}
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, targetIds: f.targetIds.filter(id => id !== c.id) }))}
                            className="hover:text-destructive transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Search input */}
                  <div className="relative mb-1.5">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      value={classSearch}
                      onChange={e => setClassSearch(e.target.value)}
                      placeholder="Search classes…"
                      className="pl-8 h-8 text-sm"
                    />
                    {classSearch && (
                      <button type="button" onClick={() => setClassSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {/* Checkbox list */}
                  <div className="border rounded-lg p-1.5 max-h-40 overflow-y-auto bg-slate-50 space-y-0.5">
                    {filtered.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">No classes match "{classSearch}"</p>
                    ) : filtered.map(c => (
                      <label key={c.id} className="flex items-center gap-2.5 text-sm cursor-pointer hover:bg-white px-2 py-1.5 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={form.targetIds.includes(c.id)}
                          onChange={e => setForm(f => ({
                            ...f,
                            targetIds: e.target.checked ? [...f.targetIds, c.id] : f.targetIds.filter(id => id !== c.id),
                          }))}
                          className="rounded"
                        />
                        <span className="flex-1">{c.name}</span>
                        {c.level && (
                          <span className="text-[10px] text-muted-foreground capitalize bg-slate-200 px-1.5 py-0.5 rounded">{c.level}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })()}

            {form.targetType === "specific_teachers" && teachers.length > 0 && (() => {
              const filtered = teachers.filter(t => t.name.toLowerCase().includes(teacherSearch.toLowerCase()));
              const selected = teachers.filter(t => form.targetIds.includes(t.id));
              return (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Select Teachers</label>
                    {selected.length > 0 && (
                      <span className="text-xs text-muted-foreground">{selected.length} selected</span>
                    )}
                  </div>
                  {/* Selected chips */}
                  {selected.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {selected.map(t => (
                        <span key={t.id} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {t.name}
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, targetIds: f.targetIds.filter(id => id !== t.id) }))}
                            className="hover:text-destructive transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Search input */}
                  <div className="relative mb-1.5">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      value={teacherSearch}
                      onChange={e => setTeacherSearch(e.target.value)}
                      placeholder="Search teachers…"
                      className="pl-8 h-8 text-sm"
                    />
                    {teacherSearch && (
                      <button type="button" onClick={() => setTeacherSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {/* Checkbox list */}
                  <div className="border rounded-lg p-1.5 max-h-40 overflow-y-auto bg-slate-50 space-y-0.5">
                    {filtered.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">No teachers match "{teacherSearch}"</p>
                    ) : filtered.map(t => (
                      <label key={t.id} className="flex items-center gap-2.5 text-sm cursor-pointer hover:bg-white px-2 py-1.5 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={form.targetIds.includes(t.id)}
                          onChange={e => setForm(f => ({
                            ...f,
                            targetIds: e.target.checked ? [...f.targetIds, t.id] : f.targetIds.filter(id => id !== t.id),
                          }))}
                          className="rounded"
                        />
                        {t.name}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-1 block">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea
                className="w-full border rounded-md p-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[72px]"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Additional details or instructions…"
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 pt-3 border-t mt-1">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editEvent ? "Update Event" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SchoolAdminLayout>
  );
}
