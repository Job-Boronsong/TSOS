import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSchoolId } from "@/lib/school-hooks";
import { SchoolAdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User, DollarSign, BookOpen, CalendarDays, Phone, Users, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Props {
  params: { schoolSlug: string; studentId: string };
}

const GRADE_COLORS: Record<string, string> = {
  A1: "text-green-700 bg-green-50 border-green-200",
  B2: "text-blue-700 bg-blue-50 border-blue-200",
  B3: "text-blue-600 bg-blue-50 border-blue-200",
  C4: "text-cyan-700 bg-cyan-50 border-cyan-200",
  C5: "text-cyan-700 bg-cyan-50 border-cyan-200",
  C6: "text-cyan-700 bg-cyan-50 border-cyan-200",
  D7: "text-yellow-700 bg-yellow-50 border-yellow-200",
  E8: "text-orange-700 bg-orange-50 border-orange-200",
  F9: "text-red-700 bg-red-50 border-red-200",
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  school_fee: "School Fee",
  bus_fee: "Bus Fee",
  feeding_fee: "Feeding",
  other: "Other",
};

export default function StudentProfile({ params }: Props) {
  const { schoolSlug, studentId } = params;
  const schoolId = useSchoolId();
  const [, navigate] = useLocation();

  const [student, setStudent] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [feeSettings, setFeeSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId || !studentId) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/schools/${schoolId}/students/${studentId}`, { credentials: "include" }).then(r => r.ok ? r.json() : Promise.reject("Not found")),
      fetch(`/api/schools/${schoolId}/payments?studentId=${studentId}`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
      fetch(`/api/schools/${schoolId}/scores?studentId=${studentId}`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
      fetch(`/api/schools/${schoolId}/attendance?studentId=${studentId}`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
      fetch(`/api/schools/${schoolId}/fee-settings`, { credentials: "include" }).then(r => r.ok ? r.json() : null),
    ]).then(([s, p, sc, a, fs]) => {
      setStudent(s);
      setPayments(Array.isArray(p) ? p : []);
      setScores(Array.isArray(sc) ? sc : []);
      setAttendance(Array.isArray(a) ? a : []);
      setFeeSettings(fs);
    }).catch(e => setError(String(e))).finally(() => setLoading(false));
  }, [schoolId, studentId]);

  if (loading) {
    return (
      <SchoolAdminLayout schoolSlug={schoolSlug}>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </SchoolAdminLayout>
    );
  }

  if (error || !student) {
    return (
      <SchoolAdminLayout schoolSlug={schoolSlug}>
        <div className="text-center py-24">
          <p className="text-muted-foreground">Student not found.</p>
          <Button variant="link" onClick={() => navigate(`/school/${schoolSlug}/students`)}>Back to Students</Button>
        </div>
      </SchoolAdminLayout>
    );
  }

  const totalFeesPaid = payments.filter(p => p.paymentType !== "feeding_fee").reduce((s, p) => s + Number(p.amount), 0);
  const totalFeedingPaid = payments.filter(p => p.paymentType === "feeding_fee").reduce((s, p) => s + Number(p.amount), 0);

  // Per-term fee breakdown with carry-forward arrears
  const t1Fee = feeSettings?.term1SchoolFee != null ? Number(feeSettings.term1SchoolFee) : null;
  const t2Fee = feeSettings?.term2SchoolFee != null ? Number(feeSettings.term2SchoolFee) : null;
  const t3Fee = feeSettings?.term3SchoolFee != null ? Number(feeSettings.term3SchoolFee) : null;
  const hasTermFees = t1Fee !== null || t2Fee !== null || t3Fee !== null;

  const applyCategory = (base: number) => {
    if (student?.feeWaiver) return 0;
    const busFeeAddon = student?.category === "bus" ? Number(feeSettings?.busFee ?? 0) : 0;
    const discountPct = student?.category === "scholarship" ? Number(feeSettings?.scholarshipDiscount ?? 0)
      : student?.category === "staff_child" ? Number(feeSettings?.staffChildDiscount ?? 0) : 0;
    let fee = base + busFeeAddon;
    if (discountPct > 0) fee = base * (1 - discountPct / 100);
    return fee;
  };

  const nonFeedingPayments = payments.filter(p => p.paymentType !== "feeding_fee");
  interface TermRow { label: string; termNum: string; expected: number; baseFee: number; paid: number; carriedForward: number; arrears: number; }
  let termBreakdown: TermRow[] = [];
  if (hasTermFees) {
    const termDefs = [
      { label: "Term 1", termNum: "1", baseFee: t1Fee ?? 0 },
      { label: "Term 2", termNum: "2", baseFee: t2Fee ?? 0 },
      { label: "Term 3", termNum: "3", baseFee: t3Fee ?? 0 },
    ];
    let carryForward = 0;
    for (const td of termDefs) {
      const thisFee = applyCategory(td.baseFee);
      const expected = thisFee + carryForward;
      const paid = nonFeedingPayments.filter(p => p.term === td.termNum).reduce((s, p) => s + Number(p.amount), 0);
      const arrears = Math.max(0, expected - paid);
      termBreakdown.push({ label: td.label, termNum: td.termNum, baseFee: td.baseFee, expected, paid, carriedForward: carryForward, arrears });
      carryForward = arrears;
    }
  }

  const arrears = hasTermFees
    ? (termBreakdown.length > 0 ? termBreakdown[termBreakdown.length - 1].arrears : 0)
    : Math.max(0, Number(student.totalFeeExpected ?? 0) - totalFeesPaid);
  const feeStatusOk = arrears === 0;

  // Group scores by term/year
  const scoresByTerm = scores.reduce((acc: Record<string, any[]>, s: any) => {
    const key = `${s.academicYear ?? "?"} · Term ${s.term ?? "?"}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  // Attendance summary
  const totalAttendance = attendance.length;
  const presentDays = attendance.filter(a => a.status === "present").length;
  const absentDays = attendance.filter(a => a.status === "absent").length;
  const attendancePct = totalAttendance > 0 ? Math.round((presentDays / totalAttendance) * 100) : null;

  const categoryLabel = (cat: string) => {
    const map: Record<string, string> = { regular: "Regular", bus: "Bus", scholarship: "Scholarship", staff_child: "Staff Child" };
    return map[cat] ?? cat;
  };

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/school/${schoolSlug}/students`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          {student.photoUrl && (
            <img
              src={student.photoUrl}
              alt={student.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <p className="text-muted-foreground text-sm">{student.className ?? "No class"} · ID: {student.studentNumber}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={student.status === "active" ? "default" : "secondary"} className="capitalize">{student.status}</Badge>
            <Badge variant="outline" className="capitalize">{categoryLabel(student.category)}</Badge>
            {student.feeWaiver && (
              <span className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 font-medium">
                <ShieldCheck className="w-3 h-3" />Fee Waiver
              </span>
            )}
            {student.feedingWaiver && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-medium">
                <ShieldCheck className="w-3 h-3" />Feeding Waiver
              </span>
            )}
            {student.busWaiver && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-medium">
                <ShieldCheck className="w-3 h-3" />Bus Waiver
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: Details */}
          <div className="lg:col-span-1 space-y-4">
            {/* Student details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />Student Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name</span>
                  <span className="font-medium text-right">{student.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student ID</span>
                  <span className="font-mono font-medium">{student.studentNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Class</span>
                  <span className="font-medium">{student.className ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="capitalize">{student.gender ?? "—"}</span>
                </div>
                {student.dateOfBirth && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Birth</span>
                    <span>{format(parseISO(student.dateOfBirth), "dd MMM yyyy")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="capitalize">{categoryLabel(student.category)}</span>
                </div>
                {student.parentName && (
                  <div className="border-t pt-3">
                    <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">Parent / Guardian</p>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{student.parentName}</span>
                    </div>
                    {student.parentPhone && (
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{student.parentPhone}</span>
                      </div>
                    )}
                  </div>
                )}
                {(student.feeWaiver || student.feedingWaiver || student.busWaiver) && (
                  <div className="border-t pt-3">
                    <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />Fee Waivers
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {student.feeWaiver && (
                        <span className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded px-2 py-1 font-medium">
                          <ShieldCheck className="w-3 h-3" />School Fee — Waived
                        </span>
                      )}
                      {student.feedingWaiver && (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded px-2 py-1 font-medium">
                          <ShieldCheck className="w-3 h-3" />Feeding — Waived
                        </span>
                      )}
                      {student.busWaiver && (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1 font-medium">
                          <ShieldCheck className="w-3 h-3" />Bus — Waived
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance summary */}
            {totalAttendance > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {attendancePct !== null && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Attendance Rate</span>
                        <span className={`font-bold ${attendancePct >= 75 ? "text-green-600" : attendancePct >= 50 ? "text-yellow-600" : "text-red-600"}`}>{attendancePct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${attendancePct >= 75 ? "bg-green-500" : attendancePct >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${attendancePct}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-lg bg-muted/50 py-2">
                      <p className="font-bold">{totalAttendance}</p>
                      <p className="text-xs text-muted-foreground">Total Days</p>
                    </div>
                    <div className="rounded-lg bg-green-50 py-2">
                      <p className="font-bold text-green-700">{presentDays}</p>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div className="rounded-lg bg-red-50 py-2">
                      <p className="font-bold text-red-700">{absentDays}</p>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column: Finance + Scores */}
          <div className="lg:col-span-2 space-y-4">
            {/* Financial status */}
            <Card className={`border-2 ${feeStatusOk ? "border-green-200" : "border-red-200"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />Financial Status
                  {feeStatusOk ? (
                    <Badge className="ml-auto bg-green-100 text-green-700 border-green-300">Fees Clear</Badge>
                  ) : (
                    <Badge className="ml-auto bg-red-100 text-red-700 border-red-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />Has Arrears
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasTermFees ? (
                  <div className="mb-4">
                    <div className="rounded-lg border overflow-hidden mb-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 text-xs text-muted-foreground">
                            <th className="text-left px-3 py-2 font-medium">Term</th>
                            <th className="text-right px-3 py-2 font-medium">Expected</th>
                            <th className="text-right px-3 py-2 font-medium">Paid</th>
                            <th className="text-right px-3 py-2 font-medium">Arrears</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {termBreakdown.map(row => (
                            <tr key={row.termNum} className="hover:bg-muted/30">
                              <td className="px-3 py-2 font-medium">
                                {row.label}
                                {row.carriedForward > 0 && (
                                  <span className="ml-1.5 text-xs text-amber-600 font-normal">+₵{row.carriedForward.toLocaleString()} c/f</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">₵{row.expected.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right text-green-700">₵{row.paid.toLocaleString()}</td>
                              <td className={`px-3 py-2 text-right font-semibold ${row.arrears > 0 ? "text-red-600" : "text-green-600"}`}>
                                ₵{row.arrears.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-muted/50 font-semibold text-sm border-t-2">
                            <td className="px-3 py-2">Total</td>
                            <td className="px-3 py-2 text-right">₵{termBreakdown.reduce((s, r) => s + r.baseFee, 0).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right text-green-700">₵{totalFeesPaid.toLocaleString()}</td>
                            <td className={`px-3 py-2 text-right ${arrears > 0 ? "text-red-600" : "text-green-600"}`}>₵{arrears.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center py-3 rounded-lg bg-slate-50 border">
                      <p className="text-xs text-muted-foreground mb-1">Expected Fees</p>
                      <p className="text-lg font-bold">₵{Number(student.totalFeeExpected ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center py-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
                      <p className="text-lg font-bold text-green-700">₵{totalFeesPaid.toLocaleString()}</p>
                    </div>
                    <div className={`text-center py-3 rounded-lg border ${arrears > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                      <p className="text-xs text-muted-foreground mb-1">Arrears</p>
                      <p className={`text-lg font-bold ${arrears > 0 ? "text-red-700" : "text-green-700"}`}>₵{arrears.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {totalFeedingPaid > 0 && (
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-orange-50 border border-orange-200 text-sm mb-4">
                    <span className="text-orange-800">Feeding Total Paid</span>
                    <span className="font-bold text-orange-700">₵{totalFeedingPaid.toLocaleString()}</span>
                  </div>
                )}

                {/* Payment history */}
                {payments.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Payment History</p>
                    <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                      {[...payments].sort((a, b) => (b.paymentDate ?? "").localeCompare(a.paymentDate ?? "")).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/40">
                          <div>
                            <span className="font-medium">{PAYMENT_TYPE_LABELS[p.paymentType] ?? p.paymentType}</span>
                            {p.term && (
                              <span className="ml-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5">
                                Term {p.term}{p.academicYear ? ` · ${p.academicYear}` : ""}
                              </span>
                            )}
                            {p.notes && <span className="text-muted-foreground ml-1.5 text-xs">— {p.notes}</span>}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-700">₵{Number(p.amount).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">{p.paymentDate ? format(parseISO(p.paymentDate), "dd MMM yyyy") : "—"}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No payments recorded yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Academic records */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />Academic Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(scoresByTerm).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No scores recorded yet.</p>
                ) : (
                  <div className="space-y-5">
                    {Object.entries(scoresByTerm).sort((a, b) => b[0].localeCompare(a[0])).map(([termKey, termScores]) => {
                      const avg = termScores.length > 0
                        ? termScores.reduce((s, sc) => s + Number(sc.totalScore ?? sc.score ?? 0), 0) / termScores.length
                        : 0;
                      return (
                        <div key={termKey}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{termKey}</p>
                            <span className="text-xs text-muted-foreground">Avg: <span className="font-semibold text-foreground">{avg.toFixed(1)}</span></span>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Subject</TableHead>
                                <TableHead className="text-xs text-right">Score</TableHead>
                                <TableHead className="text-xs text-right">Grade</TableHead>
                                <TableHead className="text-xs">Remarks</TableHead>
                                <TableHead className="text-xs text-right">Pos.</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(termScores as any[]).sort((a, b) => (a.subject ?? "").localeCompare(b.subject ?? "")).map((sc: any) => (
                                <TableRow key={sc.id}>
                                  <TableCell className="text-sm font-medium">{sc.subject}</TableCell>
                                  <TableCell className="text-right text-sm">{sc.totalScore ?? sc.score ?? "—"}</TableCell>
                                  <TableCell className="text-right">
                                    {sc.grade ? (
                                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${GRADE_COLORS[sc.grade] ?? "bg-gray-50 text-gray-700 border-gray-200"}`}>
                                        {sc.grade}
                                      </span>
                                    ) : "—"}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">{sc.remarks ?? "—"}</TableCell>
                                  <TableCell className="text-right text-xs text-muted-foreground">{sc.position ?? "—"}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SchoolAdminLayout>
  );
}
