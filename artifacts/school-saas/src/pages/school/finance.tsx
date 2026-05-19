import { useSchoolId } from "@/lib/school-hooks";
import { useState, useMemo, useEffect } from "react";
import { SchoolAdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Plus, UtensilsCrossed, ChevronLeft, ChevronRight, CalendarDays, ArrowUpRight, ArrowDownRight, PieChart } from "lucide-react";
import { format, addDays, subDays, parseISO, startOfWeek, startOfMonth } from "date-fns";
import {
  useLocalPayments,
  useLocalExpenditures,
  useLocalStudents,
  useCreatePaymentOffline,
  useCreateExpenditureOffline,
} from "@/lib/offline-hooks";

interface Props {
  params: { schoolSlug: string };
}

export default function Finance({ params }: Props) {
  const { schoolSlug } = params;
  const schoolId = useSchoolId();
  const sid = schoolId;
  const payments = useLocalPayments(sid);
  const expenditures = useLocalExpenditures(sid);
  const students = useLocalStudents(sid);
  const createPayment = useCreatePaymentOffline(sid);
  const createExpenditure = useCreateExpenditureOffline(sid);
  const { toast } = useToast();

  const [payOpen, setPayOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payForm, setPayForm] = useState({ studentId: "", amount: "", description: "", paymentType: "school_fee", paymentDate: format(new Date(), "yyyy-MM-dd"), term: "", academicYear: "" });
  const [feedForm, setFeedForm] = useState({ studentId: "", amount: "", notes: "", paymentDate: format(new Date(), "yyyy-MM-dd") });
  const [expForm, setExpForm] = useState({ amount: "", description: "", category: "salaries", expenditureDate: format(new Date(), "yyyy-MM-dd") });
  const [studentSearch, setStudentSearch] = useState("");
  const [feedStudentSearch, setFeedStudentSearch] = useState("");
  const [expCategoryFilter, setExpCategoryFilter] = useState("all");
  const [feedingRegisterDate, setFeedingRegisterDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("all");

  // Feeding fee settings (daily rate from server)
  const [feedingRate, setFeedingRate] = useState(0);
  useEffect(() => {
    if (!sid) return;
    fetch(`/api/schools/${sid}/fee-settings`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.feedingFeePerDay) setFeedingRate(Number(d.feedingFeePerDay)); })
      .catch(() => {});
  }, [sid]);

  const EXPENSE_CATEGORIES = [
    { value: "salaries", label: "Salaries" },
    { value: "utilities", label: "Utilities" },
    { value: "supplies", label: "Supplies" },
    { value: "maintenance", label: "Maintenance" },
    { value: "other", label: "Other / Miscellaneous" },
  ];

  const allPayments = payments ?? [];

  // Period date range
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const weekStartStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStartStr = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const periodStart = period === "today" ? todayStr : period === "week" ? weekStartStr : period === "month" ? monthStartStr : null;
  const periodLabel = period === "today" ? "Today" : period === "week" ? "This Week" : period === "month" ? "This Month" : "All Time";

  const inPeriod = (dateStr: string | null | undefined) => {
    if (!periodStart) return true;
    return !!dateStr && dateStr >= periodStart;
  };

  const regularPayments = allPayments.filter(p => p.paymentType !== "feeding_fee");
  const feedingPayments = allPayments.filter(p => p.paymentType === "feeding_fee");

  const feesCollected = regularPayments.filter(p => inPeriod(p.paymentDate)).reduce((sum, p) => sum + p.amount, 0);
  const feedingCollected = feedingPayments.filter(p => inPeriod(p.paymentDate)).reduce((sum, p) => sum + p.amount, 0);
  const expenditureTotal = (expenditures ?? []).filter(e => inPeriod(e.expenditureDate)).reduce((sum, e) => sum + e.amount, 0);
  const netCash = feesCollected + feedingCollected - expenditureTotal;

  // Today's feeding register
  const today = format(new Date(), "yyyy-MM-dd");
  const feedingToday = feedingPayments.filter(p => p.paymentDate === feedingRegisterDate);
  const feedingTodayTotal = feedingToday.reduce((sum, p) => sum + p.amount, 0);

  const filteredExpenditures = useMemo(() => {
    const all = expenditures ?? [];
    return expCategoryFilter === "all" ? all : all.filter(e => e.category === expCategoryFilter);
  }, [expenditures, expCategoryFilter]);

  const categoryBreakdown = useMemo(() => {
    const all = expenditures ?? [];
    return EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      total: all.filter(e => e.category === cat.value).reduce((sum, e) => sum + Number(e.amount), 0),
      count: all.filter(e => e.category === cat.value).length,
    })).filter(c => c.count > 0);
  }, [expenditures]);

  const filteredStudents = (students ?? []).filter(s =>
    s.status === "active" && (
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentNumber.toLowerCase().includes(studentSearch.toLowerCase())
    )
  ).slice(0, 8);

  const filteredFeedStudents = (students ?? []).filter(s =>
    s.status === "active" && (
      s.name.toLowerCase().includes(feedStudentSearch.toLowerCase()) ||
      s.studentNumber.toLowerCase().includes(feedStudentSearch.toLowerCase())
    )
  ).slice(0, 8);

  const getStudentName = (studentId: number) => {
    const s = (students ?? []).find(s => s.id === studentId);
    return s ? s.name : `Student #${studentId}`;
  };

  const getStudentClass = (studentId: number) => {
    return (students ?? []).find(s => s.id === studentId)?.classId ?? null;
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createPayment({
        studentId: parseInt(payForm.studentId),
        amount: parseFloat(payForm.amount),
        notes: payForm.description || undefined,
        paymentType: payForm.paymentType,
        paymentDate: payForm.paymentDate,
        term: payForm.term || null,
        academicYear: payForm.academicYear || null,
      });
      toast({ title: "Payment recorded", description: "Saved locally, will sync when online." });
      setPayOpen(false);
      setPayForm({ studentId: "", amount: "", description: "", paymentType: "school_fee", paymentDate: format(new Date(), "yyyy-MM-dd"), term: "", academicYear: "" });
      setStudentSearch("");
    } catch {
      toast({ variant: "destructive", title: "Error recording payment" });
    } finally {
      setSaving(false);
    }
  };

  const handleFeedingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createPayment({
        studentId: parseInt(feedForm.studentId),
        amount: parseFloat(feedForm.amount),
        notes: feedForm.notes || "Daily feeding",
        paymentType: "feeding_fee",
        paymentDate: feedForm.paymentDate,
      });
      toast({ title: "Feeding payment recorded", description: `${getStudentName(parseInt(feedForm.studentId))} — GHS ${feedForm.amount}` });
      setFeedOpen(false);
      setFeedForm({ studentId: "", amount: feedingRate > 0 ? String(feedingRate) : "", notes: "", paymentDate: format(new Date(), "yyyy-MM-dd") });
      setFeedStudentSearch("");
    } catch {
      toast({ variant: "destructive", title: "Error recording feeding payment" });
    } finally {
      setSaving(false);
    }
  };

  const handleExpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createExpenditure({
        description: expForm.description,
        amount: parseFloat(expForm.amount),
        expenditureDate: expForm.expenditureDate,
        category: expForm.category || undefined,
      });
      toast({ title: "Expenditure recorded", description: "Saved locally, will sync when online." });
      setExpOpen(false);
      setExpForm({ amount: "", description: "", category: "salaries", expenditureDate: format(new Date(), "yyyy-MM-dd") });
    } catch {
      toast({ variant: "destructive", title: "Error recording expenditure" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
          <p className="text-muted-foreground">Manage school fees, feeding payments, and expenditures.</p>
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-1">Period:</span>
          {(["today", "week", "month", "all"] as const).map(p => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p)}
              className="h-8 text-xs"
            >
              {p === "today" ? "Today" : p === "week" ? "This Week" : p === "month" ? "This Month" : "All Time"}
            </Button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fees Collected</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₵{feesCollected.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{periodLabel} · {regularPayments.filter(p => inPeriod(p.paymentDate)).length} payment(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feeding Collected</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">₵{feedingCollected.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{periodLabel} · {feedingPayments.filter(p => inPeriod(p.paymentDate)).length} feeding payment(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenditure</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₵{expenditureTotal.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{periodLabel}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Cash</CardTitle>
              <span className="text-lg font-bold text-primary leading-none">₵</span>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netCash >= 0 ? "text-green-600" : "text-red-600"}`}>
                ₵{netCash.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{periodLabel} · Fees + Feeding − Expenses</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payments">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <TabsList>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="feeding">
                <UtensilsCrossed className="w-3.5 h-3.5 mr-1.5" />
                Feeding
                {feedingPayments.filter(p => p.paymentDate === today).length > 0 && (
                  <Badge className="ml-1.5 h-4 px-1.5 text-[10px] bg-orange-500">
                    {feedingPayments.filter(p => p.paymentDate === today).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="expenditures">Expenditures</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              {/* Record Feeding — Quick Access */}
              <Dialog open={feedOpen} onOpenChange={(v) => {
                setFeedOpen(v);
                if (v && feedingRate > 0) setFeedForm(f => ({ ...f, amount: String(feedingRate) }));
                if (!v) { setFeedStudentSearch(""); }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                    <UtensilsCrossed className="w-4 h-4 mr-1" />Record Feeding
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle className="flex items-center gap-2"><UtensilsCrossed className="w-4 h-4 text-orange-500" />Record Feeding Payment</DialogTitle></DialogHeader>
                  <form onSubmit={handleFeedingSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Student</Label>
                      <Input
                        placeholder="Search by name or ID..."
                        value={feedStudentSearch}
                        onChange={e => setFeedStudentSearch(e.target.value)}
                      />
                      {feedStudentSearch && filteredFeedStudents.length > 0 && (
                        <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                          {filteredFeedStudents.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                              onClick={() => { setFeedForm(f => ({ ...f, studentId: s.id.toString() })); setFeedStudentSearch(s.name); }}
                            >
                              <span className="font-medium">{s.name}</span>
                              <span className="text-muted-foreground ml-2">#{s.studentNumber}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {feedForm.studentId && (
                        <p className="text-xs text-green-600">Selected: {getStudentName(parseInt(feedForm.studentId))}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Amount (GHS) {feedingRate > 0 && <span className="text-xs text-muted-foreground">— daily rate: GHS {feedingRate}</span>}</Label>
                        <Input type="number" step="0.01" min="0.01" value={feedForm.amount} onChange={e => setFeedForm(f => ({ ...f, amount: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={feedForm.paymentDate} onChange={e => setFeedForm(f => ({ ...f, paymentDate: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Input placeholder="e.g. 3 days" value={feedForm.notes} onChange={e => setFeedForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={saving || !feedForm.studentId || !feedForm.amount}>
                      {saving ? "Saving…" : "Record Feeding Payment"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={payOpen} onOpenChange={setPayOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" /><ArrowUpRight className="w-4 h-4 mr-1" />Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Student</Label>
                      <Input
                        placeholder="Search by name or ID..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                      />
                      {studentSearch && filteredStudents.length > 0 && (
                        <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                          {filteredStudents.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                              onClick={() => { setPayForm(f => ({ ...f, studentId: s.id.toString() })); setStudentSearch(s.name); }}
                            >
                              <span className="font-medium">{s.name}</span>
                              <span className="text-muted-foreground ml-2">#{s.studentNumber}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {payForm.studentId && (
                        <p className="text-xs text-green-600">Selected: {getStudentName(parseInt(payForm.studentId))}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Amount (GHS)</Label>
                      <Input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input value={payForm.description} onChange={e => setPayForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={payForm.paymentType} onValueChange={v => setPayForm(f => ({ ...f, paymentType: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="school_fee">School Fee</SelectItem>
                            <SelectItem value="bus_fee">Bus Fee</SelectItem>
                            <SelectItem value="feeding_fee">Feeding Fee</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={payForm.paymentDate} onChange={e => setPayForm(f => ({ ...f, paymentDate: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">Term <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                        <Select value={payForm.term || "none"} onValueChange={v => setPayForm(f => ({ ...f, term: v === "none" ? "" : v }))}>
                          <SelectTrigger><SelectValue placeholder="— Any —" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">— Any term —</SelectItem>
                            <SelectItem value="1">Term 1</SelectItem>
                            <SelectItem value="2">Term 2</SelectItem>
                            <SelectItem value="3">Term 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">Academic Year <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                        <Input placeholder="e.g. 2025/2026" value={payForm.academicYear} onChange={e => setPayForm(f => ({ ...f, academicYear: e.target.value }))} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={saving || !payForm.studentId}>Record Payment</Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={expOpen} onOpenChange={setExpOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" /><ArrowDownRight className="w-4 h-4 mr-1" />Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>Record Expenditure</DialogTitle></DialogHeader>
                  <form onSubmit={handleExpSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Amount (GHS)</Label>
                      <Input type="number" step="0.01" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={expForm.category} onValueChange={v => setExpForm(f => ({ ...f, category: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="salaries">Salaries</SelectItem>
                            <SelectItem value="utilities">Utilities</SelectItem>
                            <SelectItem value="supplies">Supplies</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={expForm.expenditureDate} onChange={e => setExpForm(f => ({ ...f, expenditureDate: e.target.value }))} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={saving}>Record Expenditure</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPayments.map((p: any) => (
                      <TableRow key={p.id} className={p._localOnly ? "opacity-70" : ""}>
                        <TableCell>{getStudentName(p.studentId)}{p._localOnly ? " (pending)" : ""}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`capitalize ${p.paymentType === "feeding_fee" ? "border-orange-300 text-orange-700 bg-orange-50" : ""}`}
                          >
                            {p.paymentType === "feeding_fee" ? "Feeding" : p.paymentType?.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">+GHS {Number(p.amount).toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.paymentDate ? format(new Date(p.paymentDate), "MMM d, yyyy") : "—"}</TableCell>
                      </TableRow>
                    ))}
                    {!allPayments.length && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No payments recorded.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feeding Register Tab */}
          <TabsContent value="feeding" className="space-y-4">
            {/* Daily stats bar */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-orange-200 bg-orange-50/40">
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">Students Fed Today</p>
                  <p className="text-2xl font-bold text-orange-600">{feedingPayments.filter(p => p.paymentDate === today).length}</p>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-orange-50/40">
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">Feeding Collected Today</p>
                  <p className="text-2xl font-bold text-orange-600">GHS {feedingPayments.filter(p => p.paymentDate === today).reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-orange-50/40">
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">Total Feeding (All Time)</p>
                  <p className="text-2xl font-bold text-orange-600">GHS {feedingCollected.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Daily register with date navigation */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                    Daily Feeding Register
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFeedingRegisterDate(d => format(subDays(parseISO(d), 1), "yyyy-MM-dd"))}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Input
                      type="date"
                      value={feedingRegisterDate}
                      onChange={e => setFeedingRegisterDate(e.target.value)}
                      className="w-40 h-7 text-sm"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFeedingRegisterDate(d => format(addDays(parseISO(d), 1), "yyyy-MM-dd"))} disabled={feedingRegisterDate >= today}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                      onClick={() => {
                        setFeedForm(f => ({ ...f, paymentDate: feedingRegisterDate, amount: feedingRate > 0 ? String(feedingRate) : "" }));
                        setFeedOpen(true);
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />Add
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {feedingRegisterDate === today ? "Today" : format(parseISO(feedingRegisterDate), "EEEE, MMMM d, yyyy")} — {feedingToday.length} student(s) — GHS {feedingTodayTotal.toLocaleString()}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedingToday.map((p: any, idx) => (
                      <TableRow key={p.id} className={p._localOnly ? "opacity-70" : ""}>
                        <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="font-medium">{getStudentName(p.studentId)}{p._localOnly ? " (pending)" : ""}</div>
                        </TableCell>
                        <TableCell className="font-semibold text-orange-600">GHS {Number(p.amount).toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                    {!feedingToday.length && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                          <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          No feeding payments recorded for this date.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Monthly summary */}
            {feedingPayments.length > 0 && (() => {
              const byDate = feedingPayments.reduce((acc: Record<string, { count: number; total: number }>, p) => {
                const d = p.paymentDate ?? "";
                if (!acc[d]) acc[d] = { count: 0, total: 0 };
                acc[d].count++;
                acc[d].total += p.amount;
                return acc;
              }, {});
              const recent = Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
              return (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Recent Days Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y">
                      {recent.map(([date, { count, total }]) => (
                        <div key={date} className="flex items-center justify-between py-2 text-sm cursor-pointer hover:bg-muted/40 px-1 rounded" onClick={() => setFeedingRegisterDate(date)}>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{date === today ? "Today" : format(parseISO(date), "EEE, MMM d")}</span>
                            <Badge variant="secondary" className="text-xs">{count} student(s)</Badge>
                          </div>
                          <span className="font-semibold text-orange-600">GHS {total.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </TabsContent>

          {/* Expenditures Tab */}
          <TabsContent value="expenditures" className="space-y-4">
            <div className="flex items-center gap-3">
              <Label className="shrink-0 text-sm">Filter by category:</Label>
              <Select value={expCategoryFilter} onValueChange={setExpCategoryFilter}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {expCategoryFilter !== "all" && (
                <Button variant="ghost" size="sm" onClick={() => setExpCategoryFilter("all")} className="text-xs">Clear</Button>
              )}
              <span className="text-sm text-muted-foreground ml-auto">{filteredExpenditures.length} record(s)</span>
            </div>
            <Card>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenditures.map((e: any) => (
                      <TableRow key={e.id} className={e._localOnly ? "opacity-70" : ""}>
                        <TableCell>{e.description}{e._localOnly ? " (pending)" : ""}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {EXPENSE_CATEGORIES.find(c => c.value === e.category)?.label ?? e.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-red-600">-GHS {Number(e.amount).toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.expenditureDate ? format(new Date(e.expenditureDate), "MMM d, yyyy") : "—"}</TableCell>
                      </TableRow>
                    ))}
                    {!filteredExpenditures.length && (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {expCategoryFilter === "all" ? "No expenditures recorded." : "No expenditures in this category."}
                      </TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {categoryBreakdown.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PieChart className="w-4 h-4" />
                    Expenditure Breakdown by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryBreakdown.map(cat => {
                      const pct = expenditureTotal > 0 ? (cat.total / expenditureTotal) * 100 : 0;
                      return (
                        <div key={cat.value} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{cat.label}</span>
                              <span className="text-muted-foreground text-xs">{cat.count} record(s)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                              <span className="font-semibold text-red-600 tabular-nums">GHS {cat.total.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center pt-2 border-t font-semibold text-sm">
                      <span>Total</span>
                      <span className="text-red-600">GHS {expenditureTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SchoolAdminLayout>
  );
}
