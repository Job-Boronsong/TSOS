import { useSchoolId } from "@/lib/school-hooks";
import { useEffect, useState } from "react";
import { SchoolAdminLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, BarChart2, Download, MapPin, Clock, Smartphone, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useLocalTeachers } from "@/lib/offline-hooks";

interface Props { params: { schoolSlug: string } }
type Status = "present" | "absent" | "late" | "excused";

const STATUS_OPTS: { value: Status; label: string; color: string }[] = [
  { value: "present", label: "Present", color: "bg-green-100 text-green-700" },
  { value: "absent", label: "Absent", color: "bg-red-100 text-red-700" },
  { value: "late", label: "Late", color: "bg-amber-100 text-amber-700" },
  { value: "excused", label: "Excused", color: "bg-blue-100 text-blue-700" },
];

interface CheckInRow {
  attendance: {
    id: number; teacherId: number; status: string; notes: string | null;
    checkInTime: string | null; checkOutTime: string | null;
    checkinLatitude: number | null; checkinLongitude: number | null;
    checkInMethod: string | null; deviceInfo: string | null;
  };
  teacher: { name: string; subject: string | null };
}

interface ReportRow { teacherId: number; teacherName: string; status: string; count: number }

function fmtTime(ts: string | null) {
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Africa/Accra" });
}

function methodBadge(method: string | null) {
  if (method === "gps") return <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium"><MapPin className="w-2.5 h-2.5" />GPS</span>;
  if (method === "manual") return <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium"><Smartphone className="w-2.5 h-2.5" />Manual</span>;
  if (method === "admin") return <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">Admin</span>;
  return null;
}

export default function TeacherAttendance({ params }: Props) {
  const { schoolSlug } = params;
  const schoolId = useSchoolId();
  const sid = schoolId;
  const { toast } = useToast();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const teachers = useLocalTeachers(sid);
  const activeTeachers = teachers.filter(t => t.status === "active");

  const [tab, setTab] = useState<"checkins" | "report">("checkins");

  // ── Today's check-ins ──────────────────────────────
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [rows, setRows] = useState<CheckInRow[]>([]);
  const [loadingCheckins, setLoadingCheckins] = useState(false);
  const [overrides, setOverrides] = useState<Record<number, Status>>({});
  const [overrideNotes, setOverrideNotes] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  const loadCheckins = () => {
    if (!sid) return;
    setLoadingCheckins(true);
    fetch(`/api/schools/${sid}/teacher-attendance?date=${selectedDate}`, { credentials: "include" })
      .then(r => r.json())
      .then((data: CheckInRow[]) => {
        setRows(Array.isArray(data) ? data : []);
        const ov: Record<number, Status> = {};
        const on: Record<number, string> = {};
        for (const row of (Array.isArray(data) ? data : [])) {
          if (row.attendance.status) ov[row.attendance.teacherId] = row.attendance.status as Status;
          if (row.attendance.notes) on[row.attendance.teacherId] = row.attendance.notes;
        }
        setOverrides(ov);
        setOverrideNotes(on);
      })
      .catch(() => setRows([]))
      .finally(() => setLoadingCheckins(false));
  };

  useEffect(() => { loadCheckins(); }, [sid, selectedDate]);

  // Build a map of teacherId → row for quick lookup
  const rowByTeacher: Record<number, CheckInRow> = {};
  for (const r of rows) rowByTeacher[r.attendance.teacherId] = r;

  const checkedInCount = activeTeachers.filter(t => rowByTeacher[t.id]?.attendance.checkInTime).length;
  const notCheckedIn = activeTeachers.filter(t => !rowByTeacher[t.id]?.attendance.checkInTime);

  const handleSaveOverrides = async () => {
    if (!sid) return;
    setSaving(true);
    try {
      const records = activeTeachers.map(t => ({
        teacherId: t.id,
        status: overrides[t.id] ?? (rowByTeacher[t.id]?.attendance.checkInTime ? "present" : "absent"),
        notes: overrideNotes[t.id] ?? null,
      }));
      const res = await fetch(`/api/schools/${sid}/teacher-attendance/bulk`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ date: selectedDate, records }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast({ title: "Attendance saved" });
      loadCheckins();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally { setSaving(false); }
  };

  // ── Report ─────────────────────────────────────────
  const [reportFrom, setReportFrom] = useState(format(new Date(Date.now() - 30 * 86400000), "yyyy-MM-dd"));
  const [reportTo, setReportTo] = useState(todayStr);
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  const loadReport = async () => {
    if (!sid) return;
    setReportLoading(true);
    try {
      const res = await fetch(`/api/schools/${sid}/teacher-attendance/report?from=${reportFrom}&to=${reportTo}`, { credentials: "include" });
      setReportData(await res.json());
    } catch {}
    setReportLoading(false);
  };

  const downloadReport = () => {
    const pivot: Record<number, { name: string; present: number; absent: number; late: number; excused: number }> = {};
    for (const row of reportData) {
      if (!pivot[row.teacherId]) pivot[row.teacherId] = { name: row.teacherName, present: 0, absent: 0, late: 0, excused: 0 };
      (pivot[row.teacherId] as any)[row.status] = Number(row.count);
    }
    const rows = Object.values(pivot);
    const csv = ["Name,Present,Absent,Late,Excused", ...rows.map(r => `${r.name},${r.present},${r.absent},${r.late},${r.excused}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `teacher-attendance-${reportFrom}-${reportTo}.csv`; a.click();
  };

  const pivotReport: Record<string, { name: string; present: number; absent: number; late: number; excused: number }> = {};
  for (const row of reportData) {
    const k = String(row.teacherId);
    if (!pivotReport[k]) pivotReport[k] = { name: row.teacherName, present: 0, absent: 0, late: 0, excused: 0 };
    (pivotReport[k] as any)[row.status] = Number(row.count);
  }

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold flex items-center gap-2"><UserCheck className="w-6 h-6" />Teacher Attendance</h1>
          <button className="flex items-center gap-1 text-sm border rounded-md px-3 py-1.5 hover:bg-muted transition-colors" onClick={() => {
            fetch(`/api/schools/${schoolId}/export/attendance`, { credentials: "include" })
              .then(r => r.blob())
              .then(blob => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "attendance.csv"; a.click(); });
          }}>
            <Download className="w-4 h-4" />Export
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button variant={tab === "checkins" ? "default" : "outline"} size="sm" onClick={() => setTab("checkins")}>
            <CheckCircle2 className="w-4 h-4 mr-1" />Today's Check-ins
          </Button>
          <Button variant={tab === "report" ? "default" : "outline"} size="sm" onClick={() => { setTab("report"); loadReport(); }}>
            <BarChart2 className="w-4 h-4 mr-1" />Report
          </Button>
        </div>

        {/* ── Check-ins tab ── */}
        {tab === "checkins" && (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-44" />
              <Button variant="ghost" size="sm" onClick={loadCheckins} disabled={loadingCheckins} className="gap-1">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingCheckins ? "animate-spin" : ""}`} />Refresh
              </Button>
            </div>

            {/* Summary bar */}
            {activeTeachers.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">{checkedInCount}</span>
                  <span className="text-xs text-emerald-600">Checked in</span>
                </div>
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-600">{notCheckedIn.length}</span>
                  <span className="text-xs text-red-500">Not yet in</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border rounded-lg px-4 py-2">
                  <AlertCircle className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-600">{activeTeachers.length}</span>
                  <span className="text-xs text-slate-500">Total teachers</span>
                </div>
              </div>
            )}

            {/* Checked-in teachers */}
            {checkedInCount > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Checked In ({checkedInCount})</p>
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left p-3 font-medium">Teacher</th>
                          <th className="text-left p-3 font-medium">Check In</th>
                          <th className="text-left p-3 font-medium">Check Out</th>
                          <th className="text-left p-3 font-medium">Method</th>
                          <th className="text-left p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeTeachers
                          .filter(t => rowByTeacher[t.id]?.attendance.checkInTime)
                          .map(t => {
                            const att = rowByTeacher[t.id].attendance;
                            const statusOpt = STATUS_OPTS.find(s => s.value === att.status) ?? STATUS_OPTS[0];
                            return (
                              <tr key={t.id} className="border-b hover:bg-muted/20">
                                <td className="p-3">
                                  <p className="font-medium">{t.name}</p>
                                  {t.subject && <p className="text-xs text-muted-foreground">{t.subject}</p>}
                                </td>
                                <td className="p-3">
                                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                    <Clock className="w-3 h-3" />{fmtTime(att.checkInTime)}
                                  </span>
                                  {att.checkinLatitude != null && (
                                    <a
                                      href={`https://maps.google.com/?q=${att.checkinLatitude},${att.checkinLongitude}`}
                                      target="_blank" rel="noreferrer"
                                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5"
                                    >
                                      <MapPin className="w-2.5 h-2.5" />View location
                                    </a>
                                  )}
                                </td>
                                <td className="p-3 text-muted-foreground">
                                  {att.checkOutTime
                                    ? <span className="flex items-center gap-1 text-slate-600 font-medium"><Clock className="w-3 h-3" />{fmtTime(att.checkOutTime)}</span>
                                    : <span className="text-xs text-muted-foreground">—</span>}
                                </td>
                                <td className="p-3">{methodBadge(att.checkInMethod)}</td>
                                <td className="p-3">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusOpt.color}`}>{statusOpt.label}</span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Not checked in */}
            {notCheckedIn.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Not Checked In ({notCheckedIn.length})</p>
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left p-3 font-medium">Teacher</th>
                          <th className="p-3 font-medium text-center">Mark Status</th>
                          <th className="text-left p-3 font-medium">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notCheckedIn.map(t => {
                          const status = overrides[t.id] ?? "absent";
                          return (
                            <tr key={t.id} className="border-b hover:bg-muted/20">
                              <td className="p-3">
                                <p className="font-medium">{t.name}</p>
                                {t.subject && <p className="text-xs text-muted-foreground">{t.subject}</p>}
                              </td>
                              <td className="p-3 text-center">
                                <Select value={status} onValueChange={v => setOverrides(o => ({ ...o, [t.id]: v as Status }))}>
                                  <SelectTrigger className="h-7 w-28 text-xs mx-auto">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-3">
                                <Input
                                  value={overrideNotes[t.id] ?? ""}
                                  onChange={e => setOverrideNotes(n => ({ ...n, [t.id]: e.target.value }))}
                                  placeholder="Optional note"
                                  className="h-7 text-xs"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
                <div className="mt-3">
                  <Button onClick={handleSaveOverrides} disabled={saving} size="sm" className="gap-2">
                    {saving ? "Saving…" : `Save ${notCheckedIn.length} Record${notCheckedIn.length !== 1 ? "s" : ""}`}
                  </Button>
                </div>
              </div>
            )}

            {activeTeachers.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">No active teachers found.</div>
            )}
          </>
        )}

        {/* ── Report tab ── */}
        {tab === "report" && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">From</span>
                <Input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)} className="w-40" />
                <span className="text-sm text-muted-foreground">To</span>
                <Input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)} className="w-40" />
              </div>
              <Button onClick={loadReport} size="sm">Load</Button>
              {reportData.length > 0 && (
                <Button size="sm" variant="outline" onClick={downloadReport} className="gap-2"><Download className="w-4 h-4" />CSV</Button>
              )}
            </div>

            <Card>
              <CardContent className="p-0">
                {reportLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading…</div>
                ) : Object.keys(pivotReport).length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No data for this period</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium">Teacher</th>
                        {STATUS_OPTS.map(s => <th key={s.value} className="p-3 font-medium text-center">{s.label}</th>)}
                        <th className="p-3 font-medium text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(pivotReport).map((row, i) => {
                        const total = row.present + row.absent + row.late + row.excused;
                        return (
                          <tr key={i} className="border-b hover:bg-muted/20">
                            <td className="p-3 font-medium">{row.name}</td>
                            <td className="p-3 text-center text-green-600 font-medium">{row.present}</td>
                            <td className="p-3 text-center text-red-600 font-medium">{row.absent}</td>
                            <td className="p-3 text-center text-amber-600 font-medium">{row.late}</td>
                            <td className="p-3 text-center text-blue-600 font-medium">{row.excused}</td>
                            <td className="p-3 text-center text-muted-foreground">{total}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </SchoolAdminLayout>
  );
}
