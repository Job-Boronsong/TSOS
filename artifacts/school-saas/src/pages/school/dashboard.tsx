import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { SchoolAdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, CheckSquare, DollarSign, TrendingUp, TrendingDown, AlertCircle, Clock, AlertTriangle, RefreshCw, CalendarDays, XCircle } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { useLocalStudents, useLocalAttendance, useLocalPayments, useLocalExpenditures, useLocalFeeSettings, useLocalClasses } from "@/lib/offline-hooks";
import { useSyncContext } from "@/lib/sync-context";
import { useToast } from "@/hooks/use-toast";
import { useSchoolId } from "@/lib/school-hooks";
import { loadPaystackScript } from "@/lib/load-paystack";

interface Props {
  params: { schoolSlug: string };
}

function SubscriptionBanner({ schoolId }: { schoolId: number }) {
  const [sub, setSub] = useState<any>(null);
  const [renewOpen, setRenewOpen] = useState(false);
  const [renewMonths, setRenewMonths] = useState("1");
  const [preview, setPreview] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const { toast } = useToast();

  const fetchSub = useCallback(() => {
    fetch(`/api/schools/${schoolId}/subscription`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(setSub)
      .catch(() => {});
  }, [schoolId]);

  useEffect(() => { fetchSub(); }, [fetchSub]);

  useEffect(() => {
    if (!renewOpen || !renewMonths) return;
    const m = parseInt(renewMonths);
    if (!m || m < 1) { setPreview(null); return; }
    fetch(`/api/schools/${schoolId}/subscription/topup-preview?months=${m}`, { credentials: "include" })
      .then(r => r.json()).then(setPreview).catch(() => setPreview(null));
  }, [renewOpen, renewMonths, schoolId]);

  const handleRenewWithPaystack = async () => {
    const months = parseInt(renewMonths) || 1;
    setPaying(true);
    setPaymentResult(null);
    try {
      const initRes = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ schoolId, months }),
      });
      if (!initRes.ok) throw new Error(await initRes.text());
      const initData = await initRes.json();

      await loadPaystackScript();
      const PaystackPop = (window as any).PaystackPop;
      if (!PaystackPop) { toast({ variant: "destructive", title: "Paystack not loaded. Please refresh." }); return; }

      const handler = PaystackPop.setup({
        key: initData.publicKey,
        email: initData.email,
        amount: initData.amount,
        ref: initData.reference,
        currency: "GHS",
        callback: function(response: any) {
          fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ reference: response.reference }),
          }).then(r => {
            if (!r.ok) throw new Error();
            return r.json();
          }).then(data => {
            setPaymentResult(data);
            fetchSub();
          }).catch(() => {
            toast({ variant: "destructive", title: "Payment received but verification failed. Contact support." });
          });
        },
        onClose: function() { setPaying(false); },
      });
      handler.openIframe();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Could not initialize payment", description: err.message });
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/subscription/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Subscription cancelled", description: "Your access continues until the current expiry date." });
      fetchSub();
      setCancelOpen(false);
      setCancelReason("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Could not cancel subscription", description: err.message });
    } finally {
      setCancelling(false);
    }
  };

  const cancelDialog = (
    <Dialog open={cancelOpen} onOpenChange={(o) => { setCancelOpen(o); if (!o) setCancelReason(""); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogDescription>
            Your school will remain active until the current expiry date. After that, your account enters a 3-day grace period before being deactivated.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            Data is retained for 90 days after deactivation. You can reactivate at any time by renewing.
          </div>
          <div className="space-y-1.5">
            <Label>Reason for cancellation <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              placeholder="Let us know why you're cancelling…"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep Subscription</Button>
          <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? "Cancelling…" : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renewDialog = (
    <Dialog open={renewOpen} onOpenChange={(o) => { setRenewOpen(o); if (!o) { setPaymentResult(null); setRenewMonths("1"); setPreview(null); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Renew Subscription</DialogTitle></DialogHeader>
        {paymentResult ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center space-y-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="font-semibold text-green-800">Payment confirmed!</p>
              <p className="text-sm text-green-700">Your subscription is now active until <strong>{paymentResult.newExpiryDate}</strong>.</p>
            </div>
            <Button className="w-full" variant="outline" onClick={() => { setRenewOpen(false); setPaymentResult(null); }}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Number of Months</Label>
              <Input type="number" min="1" value={renewMonths} onChange={e => setRenewMonths(e.target.value)} autoFocus />
            </div>
            {preview && (
              <div className="rounded-lg bg-slate-50 border p-3 text-sm space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Rate</span><span>GHS {preview.monthlyPrice?.toLocaleString()} × {preview.months} mo</span>
                </div>
                {preview.discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount ({preview.discount}%)</span>
                    <span>−GHS {(preview.monthlyPrice * preview.months * preview.discount / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Subscription</span><span>GHS {preview.amount?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Paystack fee (1.5% + GHS 0.50)</span>
                  <span>GHS {preview.paystackFee?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                  <span>Total charged</span><span>GHS {preview.chargeAmount?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-primary text-xs mt-1">
                  <span>New expiry after payment</span><strong>{preview.newExpiry}</strong>
                </div>
              </div>
            )}
            <Button
              className="w-full bg-[#0BA4DB] hover:bg-[#0994C8] text-white"
              disabled={paying || !renewMonths || parseInt(renewMonths) < 1}
              onClick={handleRenewWithPaystack}>
              {paying ? "Opening payment…" : `Pay GHS ${preview ? preview.chargeAmount?.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "…"} with Paystack`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  if (!sub) return null;

  const status: string = sub.subscriptionStatus ?? "active";
  const daysLeft = differenceInDays(parseISO(sub.expiryDate), new Date());
  const isCancelled = !!sub.cancelledAt;

  if (status === "expired") {
    return (
      <>
        {renewDialog}
        <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-800 text-sm">Subscription expired — account deactivated</p>
            <p className="text-xs text-red-700 mt-0.5">Renew immediately to restore access.</p>
          </div>
          <Button size="sm" className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-xs" onClick={() => setRenewOpen(true)}>Renew Now</Button>
        </div>
      </>
    );
  }

  if (status === "grace") {
    const graceEnd = new Date(sub.expiryDate);
    graceEnd.setDate(graceEnd.getDate() + 3);
    const graceDaysLeft = differenceInDays(graceEnd, new Date());
    return (
      <>
        {renewDialog}
        <div className="flex items-start gap-3 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-orange-800 text-sm">
              Subscription expired — {graceDaysLeft} day{graceDaysLeft !== 1 ? "s" : ""} of grace period remaining
            </p>
            <p className="text-xs text-orange-700 mt-0.5">
              Account deactivates on {format(graceEnd, "MMM d, yyyy")}. Renew to avoid data loss.
            </p>
          </div>
          <Button size="sm" className="shrink-0 bg-orange-600 hover:bg-orange-700 text-white text-xs" onClick={() => setRenewOpen(true)}>Renew Now</Button>
        </div>
      </>
    );
  }

  if (isCancelled) {
    return (
      <>
        {renewDialog}
        <div className="flex items-start gap-3 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3">
          <XCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-slate-700 text-sm">Subscription cancelled</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Access continues until <strong>{format(parseISO(sub.expiryDate), "MMM d, yyyy")}</strong>. Renew anytime to restore your subscription.
            </p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={() => setRenewOpen(true)}>Renew</Button>
        </div>
      </>
    );
  }

  if (daysLeft <= 7) {
    return (
      <>
        {renewDialog}
        {cancelDialog}
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">
              Subscription expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""} — {format(parseISO(sub.expiryDate), "MMM d, yyyy")}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">Renew early to avoid disruption.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" className="border-amber-400 text-amber-800 hover:bg-amber-100 text-xs" onClick={() => setRenewOpen(true)}>Renew</Button>
            <Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => setCancelOpen(true)}>Cancel</Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {cancelDialog}
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
        <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-green-800">
            Subscription active — expires <strong>{format(parseISO(sub.expiryDate), "MMM d, yyyy")}</strong>
            <span className="text-green-600 ml-1">({daysLeft} days remaining)</span>
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs text-muted-foreground hover:text-destructive shrink-0"
          onClick={() => setCancelOpen(true)}
        >
          Cancel subscription
        </Button>
      </div>
    </>
  );
}

function useSmoothProgress(target: number): number {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);

  useEffect(() => {
    if (target > displayRef.current) {
      displayRef.current = target;
      setDisplay(target);
    }
  }, [target]);

  useEffect(() => {
    const interval = setInterval(() => {
      const cur = displayRef.current;
      if (cur >= 18 && cur < 52 && target <= 22) {
        const next = Math.min(cur + 0.7, 52);
        displayRef.current = next;
        setDisplay(next);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [target]);

  return display;
}

export default function SchoolDashboard({ params }: Props) {
  const { schoolSlug } = params;
  const schoolId = useSchoolId();
  const sid = schoolId;
  const today = format(new Date(), "yyyy-MM-dd");

  const students = useLocalStudents(sid);
  const classes = useLocalClasses(sid);
  const attendance = useLocalAttendance(sid, today);
  const payments = useLocalPayments(sid);
  const expenditures = useLocalExpenditures(sid);
  const feeSettings = useLocalFeeSettings(sid);
  const { isOffline, initialSyncDone, syncProgress } = useSyncContext();
  const smoothPct = useSmoothProgress(syncProgress.pct);

  const activeStudents = (students ?? []).filter(s => s.status === "active");
  const todayAttendance = attendance ?? [];
  const presentToday = todayAttendance.filter(a => a.status === "present").length;
  const attendanceRate = activeStudents.length > 0 ? Math.round((presentToday / activeStudents.length) * 100) : 0;

  const attendanceByClass = useMemo(() => {
    const cls = classes ?? [];
    const stu = students ?? [];
    const att = todayAttendance;
    return cls
      .map(c => {
        const classStudents = stu.filter(s => s.classId === c.id && s.status === "active");
        const classAttended = att.filter(a => classStudents.some(s => s.id === a.studentId));
        const present = classAttended.filter(a => a.status === "present").length;
        const marked = classAttended.length;
        return { id: c.id, name: c.name, level: c.level, total: classStudents.length, marked, present };
      })
      .filter(c => c.total > 0)
      .sort((a, b) => {
        const lvl = ["nursery", "kg", "primary", "jhs"];
        return lvl.indexOf(a.level ?? "primary") - lvl.indexOf(b.level ?? "primary");
      });
  }, [classes, students, todayAttendance]);

  const todayPayments = (payments ?? []).filter(p => p.paymentDate === today);
  const feesCollectedToday = todayPayments.reduce((sum, p) => sum + p.amount, 0);

  const todayExp = (expenditures ?? []).filter(e => e.expenditureDate === today);
  const expenditureToday = todayExp.reduce((sum, e) => sum + e.amount, 0);
  const netCashToday = feesCollectedToday - expenditureToday;

  const schoolFee = feeSettings ? parseFloat(feeSettings.schoolFee) : 0;
  const arrearsByStudent = activeStudents.map(s => {
    const paid = (payments ?? []).filter(p => p.studentId === s.id && p.paymentType === "school_fee").reduce((sum, p) => sum + p.amount, 0);
    const arrears = Math.max(0, schoolFee - paid);
    return { studentId: s.id, studentName: s.name, paidFee: paid, arrears };
  }).filter(a => a.arrears > 0).sort((a, b) => b.arrears - a.arrears).slice(0, 5);

  const recentPayments = [...(payments ?? [])].slice(0, 5);

  const stats = [
    { label: "Total Students", value: activeStudents.length, icon: Users, color: "text-blue-500" },
    { label: "Today's Attendance", value: `${attendanceRate}%`, icon: CheckSquare, color: "text-amber-500" },
    { label: "Fees Collected Today", value: `GHS ${feesCollectedToday.toLocaleString()}`, icon: DollarSign, color: "text-green-500" },
    { label: "Net Cash Today", value: `GHS ${netCashToday.toLocaleString()}`, icon: TrendingUp, color: "text-purple-500" },
  ];

  if (!initialSyncDone && !isOffline) {
    const displayPct = Math.round(Math.min(smoothPct, 100));
    return (
      <SchoolAdminLayout schoolSlug={schoolSlug}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Preparing your school data</h2>
              <p className="text-sm text-muted-foreground">
                Downloading for offline access — future loads will be instant.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  {syncProgress.label || "Connecting…"}
                </span>
                <span className="font-semibold tabular-nums text-slate-700">{displayPct}%</span>
              </div>

              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary relative overflow-hidden progress-shimmer"
                  style={{ width: `${displayPct}%`, transition: "width 0.5s ease-out" }}
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground/60">
                <span>Classes &amp; students</span>
                <span>Teachers</span>
                <span>Settings</span>
              </div>
            </div>
          </div>
        </div>
      </SchoolAdminLayout>
    );
  }

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      <div className="space-y-6">
        <SubscriptionBanner schoolId={schoolId} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening today
            {isOffline ? " · " : ""}{isOffline && <span className="text-amber-600 font-medium">Offline mode — viewing local data</span>}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Recent Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPayments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {(students ?? []).find(s => s.id === p.studentId)?.name || `Student #${p.studentId}`}
                        </TableCell>
                        <TableCell className="text-green-600 font-semibold">GHS {Number(p.amount).toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.paymentDate ? format(new Date(p.paymentDate), "MMM d") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No payments recorded.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                Top Fee Arrears
              </CardTitle>
            </CardHeader>
            <CardContent>
              {arrearsByStudent.length > 0 ? (
                <div className="space-y-2">
                  {arrearsByStudent.map((a) => (
                    <div key={a.studentId} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{a.studentName}</p>
                        <p className="text-xs text-muted-foreground">Paid: GHS {a.paidFee.toLocaleString()}</p>
                      </div>
                      <Badge variant="destructive">GHS {a.arrears.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No outstanding arrears.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fees Collected Today</p>
                  <p className="text-xl font-bold">GHS {feesCollectedToday.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expenses Today</p>
                  <p className="text-xl font-bold">GHS {expenditureToday.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Present Today</p>
                  <p className="text-xl font-bold">{presentToday} students</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance by Class — accountability for teacher-marked registers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="w-4 h-4 text-amber-500" />
              Today's Attendance by Class
              <span className="text-xs font-normal text-muted-foreground ml-1">— {format(new Date(), "MMM d, yyyy")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceByClass.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No classes with students yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-center">Total Students</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Absent / Late</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceByClass.map(cls => {
                    const absentLate = cls.marked - cls.present;
                    const unmarked = cls.total - cls.marked;
                    const isMarked = cls.marked > 0;
                    const pct = cls.total > 0 ? Math.round((cls.present / cls.total) * 100) : 0;
                    return (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell className="text-center">{cls.total}</TableCell>
                        <TableCell className="text-center">
                          {isMarked ? (
                            <span className="text-green-600 font-semibold">{cls.present} <span className="text-xs font-normal text-muted-foreground">({pct}%)</span></span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {isMarked ? (
                            <span className={absentLate > 0 ? "text-red-600 font-medium" : "text-muted-foreground"}>{absentLate}</span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {isMarked ? (
                            <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                              Marked {unmarked > 0 ? `(${unmarked} pending)` : "✓"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Not marked yet</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </SchoolAdminLayout>
  );
}
