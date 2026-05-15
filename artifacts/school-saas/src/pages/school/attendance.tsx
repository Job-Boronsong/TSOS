import { useState, useMemo } from "react";
import { useSchoolId } from "@/lib/school-hooks";
import { SchoolAdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, X, Check, Clock, Save, AlertCircle, UtensilsCrossed, Bus } from "lucide-react";
import { format } from "date-fns";
import {
  useLocalStudents,
  useLocalClasses,
  useLocalAttendance,
  useLocalPayments,
  useLocalFeeSettings,
  useMarkAttendanceOffline,
} from "@/lib/offline-hooks";

interface Props {
  params: { schoolSlug: string };
}

type AttendanceStatus = "present" | "absent" | "late";

export default function Attendance({ params }: Props) {
  const { schoolSlug } = params;
  const schoolId = useSchoolId();
  const sid = schoolId;
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [pendingChanges, setPendingChanges] = useState<Record<number, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);

  const [unpaidOpen, setUnpaidOpen] = useState(false);

  const classes = useLocalClasses(sid);
  const students = useLocalStudents(sid);
  const attendance = useLocalAttendance(sid, selectedDate);
  const payments = useLocalPayments(sid);
  const feeSettings = useLocalFeeSettings(sid);
  const markAttendance = useMarkAttendanceOffline(sid);
  const { toast } = useToast();

  const classStudents = (students ?? []).filter(s =>
    s.status === "active" && (!selectedClass || s.classId?.toString() === selectedClass)
  );

  // Students marked present on the selected date (across ALL classes)
  const allPresentIds = useMemo(() => {
    const att = attendance ?? [];
    return new Set(att.filter(a => a.status === "present").map(a => a.studentId));
  }, [attendance]);

  // Payments made on the selected date
  const dayPayments = useMemo(() => (payments ?? []).filter(p => p.paymentDate === selectedDate), [payments, selectedDate]);

  const feedingUnpaid = useMemo(() => {
    if (!feeSettings || parseFloat(String(feeSettings.feedingFeePerDay ?? "0")) <= 0) return [];
    const paidIds = new Set(dayPayments.filter(p => p.paymentType === "feeding_fee").map(p => p.studentId));
    return (students ?? []).filter(s => s.status === "active" && allPresentIds.has(s.id) && !paidIds.has(s.id));
  }, [students, allPresentIds, dayPayments, feeSettings]);

  const busUnpaid = useMemo(() => {
    if (!feeSettings || parseFloat(String(feeSettings.busFeePerDay ?? "0")) <= 0) return [];
    const paidIds = new Set(dayPayments.filter(p => p.paymentType === "bus_fee").map(p => p.studentId));
    return (students ?? []).filter(s => s.status === "active" && allPresentIds.has(s.id) && !paidIds.has(s.id));
  }, [students, allPresentIds, dayPayments, feeSettings]);

  const getStatus = (studentId: number): AttendanceStatus | undefined => {
    if (pendingChanges[studentId]) return pendingChanges[studentId];
    return (attendance ?? []).find(a => a.studentId === studentId)?.status as AttendanceStatus | undefined;
  };

  const handleMark = (studentId: number, status: AttendanceStatus) => {
    setPendingChanges(p => ({ ...p, [studentId]: status }));
  };

  const handleSave = async () => {
    const records = Object.entries(pendingChanges).map(([studentId, status]) => ({
      studentId: parseInt(studentId),
      status,
    }));
    if (records.length === 0) {
      toast({ description: "No changes to save." });
      return;
    }
    setSaving(true);
    try {
      await markAttendance(selectedDate, records);
      toast({ title: "Attendance saved", description: "Saved locally, will sync when online." });
      setPendingChanges({});
    } catch {
      toast({ variant: "destructive", title: "Error saving attendance" });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newChanges: Record<number, AttendanceStatus> = {};
    classStudents.forEach(s => { newChanges[s.id] = status; });
    setPendingChanges(newChanges);
  };

  const att = attendance ?? [];
  const savedCounts = {
    present: att.filter(a => a.status === "present").length,
    absent: att.filter(a => a.status === "absent").length,
    late: att.filter(a => a.status === "late").length,
  };

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Track daily student attendance records.</p>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => { setSelectedDate(e.target.value); setPendingChanges({}); }}
              className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1 w-52">
            <label className="text-sm font-medium">Class (optional)</label>
            <Select value={selectedClass || "all"} onValueChange={v => { setSelectedClass(v === "all" ? "" : v); setPendingChanges({}); }}>
              <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {(classes ?? []).map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}{c.grade && ` (Grade ${c.grade})`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleMarkAll("present")}>Mark All Present</Button>
            <Button variant="outline" size="sm" onClick={() => handleMarkAll("absent")}>Mark All Absent</Button>
          </div>
          <div className="ml-auto flex gap-2">
            {(feedingUnpaid.length > 0 || busUnpaid.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-amber-400 text-amber-700 hover:bg-amber-50"
                onClick={() => setUnpaidOpen(true)}
              >
                <AlertCircle className="w-4 h-4" />
                Unpaid Today
                <span className="ml-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {feedingUnpaid.length + busUnpaid.length}
                </span>
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : `Save (${Object.keys(pendingChanges).length} changes)`}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{savedCounts.present}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{savedCounts.absent}</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{savedCounts.late}</p>
                <p className="text-sm text-muted-foreground">Late</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Students ({classStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mark Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classStudents.map(student => {
                  const status = getStatus(student.id);
                  const isPending = !!pendingChanges[student.id];
                  return (
                    <TableRow key={student.id} className={isPending ? "bg-amber-50/50" : ""}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        {status ? (
                          <Badge
                            variant={status === "present" ? "default" : status === "absent" ? "destructive" : "secondary"}
                            className={`capitalize ${isPending ? "opacity-70" : ""}`}
                          >
                            {isPending ? "* " : ""}{status}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not marked</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant={status === "present" ? "default" : "outline"} className="h-7 px-2 text-xs" onClick={() => handleMark(student.id, "present")}>
                            <Check className="w-3 h-3 mr-1" />Present
                          </Button>
                          <Button size="sm" variant={status === "absent" ? "destructive" : "outline"} className="h-7 px-2 text-xs" onClick={() => handleMark(student.id, "absent")}>
                            <X className="w-3 h-3 mr-1" />Absent
                          </Button>
                          <Button size="sm" variant={status === "late" ? "secondary" : "outline"} className="h-7 px-2 text-xs" onClick={() => handleMark(student.id, "late")}>
                            <Clock className="w-3 h-3 mr-1" />Late
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!classStudents.length && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No students found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ── Unpaid Daily Fees Dialog ── */}
      <Dialog open={unpaidOpen} onOpenChange={setUnpaidOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Unpaid Daily Fees — {selectedDate}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-5">

            {/* Feeding Fee Unpaid */}
            {feeSettings && parseFloat(String(feeSettings.feedingFeePerDay ?? "0")) > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                  <p className="font-semibold text-sm">
                    Feeding Fee (GHS {parseFloat(String(feeSettings.feedingFeePerDay)).toFixed(2)}/day)
                  </p>
                  <Badge variant={feedingUnpaid.length > 0 ? "destructive" : "default"} className="ml-auto text-xs">
                    {feedingUnpaid.length} unpaid
                  </Badge>
                </div>
                {feedingUnpaid.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-6">All present students have paid ✓</p>
                ) : (
                  <div className="border rounded-lg divide-y">
                    {feedingUnpaid.map(s => {
                      const cls = (classes ?? []).find(c => c.id === s.classId);
                      return (
                        <div key={s.id} className="flex items-center gap-3 px-3 py-2">
                          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold shrink-0">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{cls?.name ?? "No class"}</p>
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">{s.studentNumber}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Feeding fee not configured in settings.</p>
            )}

            {/* Bus Fee Unpaid */}
            {feeSettings && parseFloat(String(feeSettings.busFeePerDay ?? "0")) > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Bus className="w-4 h-4 text-blue-500" />
                  <p className="font-semibold text-sm">
                    Bus Fee (GHS {parseFloat(String(feeSettings.busFeePerDay)).toFixed(2)}/day)
                  </p>
                  <Badge variant={busUnpaid.length > 0 ? "destructive" : "default"} className="ml-auto text-xs">
                    {busUnpaid.length} unpaid
                  </Badge>
                </div>
                {busUnpaid.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-6">All present students have paid ✓</p>
                ) : (
                  <div className="border rounded-lg divide-y">
                    {busUnpaid.map(s => {
                      const cls = (classes ?? []).find(c => c.id === s.classId);
                      return (
                        <div key={s.id} className="flex items-center gap-3 px-3 py-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{cls?.name ?? "No class"}</p>
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">{s.studentNumber}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Bus fee not configured in settings.</p>
            )}

            {feedingUnpaid.length === 0 && busUnpaid.length === 0 && (
              <p className="text-center text-sm text-green-700 font-medium py-4">All present students have paid their daily fees!</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SchoolAdminLayout>
  );
}
