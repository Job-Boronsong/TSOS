import { useSchoolId } from "@/lib/school-hooks";
import { useEffect, useState, useCallback } from "react";
import { SchoolAdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UtensilsCrossed, PiggyBank, Plus, Trash2, Users } from "lucide-react";

interface Props { params: { schoolSlug: string } }
interface ClassItem { id: number; name: string }
interface Student { id: number; name: string; classId: number }
interface FeedingRecord { id: number; studentId: number; status: string }
interface FundEntry { id: number; type: string; amount: string; description: string | null; date: string; academicYear: string; term: string }
interface DailySummary { fed: number; absent: number; opted_out: number }

const today = () => new Date().toISOString().split("T")[0];

export default function FeedingPage({ params }: Props) {
  const schoolId = useSchoolId();
  const { toast } = useToast();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(today());
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<number, string>>({});
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fund state
  const [fundData, setFundData] = useState<{ balance: number; entries: FundEntry[] } | null>(null);
  const [academicYear, setAcademicYear] = useState("");
  const [term, setTerm] = useState("");
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ type: "credit", amount: "", description: "", date: today() });
  const [savingFund, setSavingFund] = useState(false);
  const [loadingFund, setLoadingFund] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    fetch(`/api/schools/${schoolId}/classes`, { credentials: "include" })
      .then(r => r.json()).then(d => setClasses(Array.isArray(d) ? d : []));
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId || !selectedClass) return;
    setLoadingStudents(true);
    Promise.all([
      fetch(`/api/schools/${schoolId}/feeding/students?classId=${selectedClass}`, { credentials: "include" }).then(r => r.json()),
      fetch(`/api/schools/${schoolId}/feeding/records?date=${selectedDate}&classId=${selectedClass}`, { credentials: "include" }).then(r => r.json()),
      fetch(`/api/schools/${schoolId}/feeding/summary?date=${selectedDate}`, { credentials: "include" }).then(r => r.json()),
    ]).then(([studs, recs, summ]) => {
      setStudents(Array.isArray(studs) ? studs : []);
      const recMap: Record<number, string> = {};
      if (Array.isArray(recs)) recs.forEach((r: any) => { recMap[r.studentId] = r.status; });
      setRecords(recMap);
      setSummary(summ);
    }).finally(() => setLoadingStudents(false));
  }, [schoolId, selectedClass, selectedDate]);

  const setStatus = (studentId: number, status: string) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const saveRegister = async () => {
    if (!students.length) return;
    setSaving(true);
    try {
      const payload = students.map(s => ({ studentId: s.id, status: records[s.id] ?? "absent" }));
      await fetch(`/api/schools/${schoolId}/feeding/records`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, records: payload }),
      });
      const summ = await fetch(`/api/schools/${schoolId}/feeding/summary?date=${selectedDate}`, { credentials: "include" }).then(r => r.json());
      setSummary(summ);
      toast({ title: "Register saved", description: `${payload.filter(p => p.status === "fed").length} students marked as fed` });
    } catch {
      toast({ title: "Error saving register", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const loadFund = useCallback(() => {
    if (!schoolId || !academicYear || !term) return;
    setLoadingFund(true);
    fetch(`/api/schools/${schoolId}/feeding/fund?academicYear=${academicYear}&term=${term}`, { credentials: "include" })
      .then(r => r.json()).then(setFundData).finally(() => setLoadingFund(false));
  }, [schoolId, academicYear, term]);

  useEffect(() => { loadFund(); }, [loadFund]);

  const saveFundEntry = async () => {
    if (!newEntry.amount || !academicYear || !term) { toast({ title: "Fill all required fields", variant: "destructive" }); return; }
    setSavingFund(true);
    try {
      await fetch(`/api/schools/${schoolId}/feeding/fund`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academicYear, term, ...newEntry }),
      });
      setFundDialogOpen(false);
      setNewEntry({ type: "credit", amount: "", description: "", date: today() });
      loadFund();
      toast({ title: "Entry added" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSavingFund(false); }
  };

  const deleteFundEntry = async (id: number) => {
    await fetch(`/api/schools/${schoolId}/feeding/fund/${id}`, { method: "DELETE", credentials: "include" });
    loadFund();
  };

  const fedCount = students.filter(s => records[s.id] === "fed").length;
  const unmarked = students.filter(s => !records[s.id]).length;

  return (
    <SchoolAdminLayout params={params}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><UtensilsCrossed className="w-6 h-6" /> Feeding &amp; Canteen</h1>
          <p className="text-muted-foreground text-sm mt-1">Track daily feeding register and manage canteen fund</p>
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold text-green-600">{summary.fed}</div><div className="text-sm text-muted-foreground">Fed Today</div></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold text-yellow-600">{summary.absent}</div><div className="text-sm text-muted-foreground">Absent</div></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold text-muted-foreground">{summary.opted_out}</div><div className="text-sm text-muted-foreground">Opted Out</div></CardContent></Card>
          </div>
        )}

        <Tabs defaultValue="register">
          <TabsList>
            <TabsTrigger value="register">Daily Register</TabsTrigger>
            <TabsTrigger value="fund">Fund Tracker</TabsTrigger>
          </TabsList>

          <TabsContent value="register" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="space-y-1">
                    <Label>Date</Label>
                    <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-40" />
                  </div>
                  <div className="space-y-1">
                    <Label>Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-44"><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>{classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {students.length > 0 && (
                    <div className="flex gap-2 ml-auto">
                      <Button variant="outline" size="sm" onClick={() => students.forEach(s => setStatus(s.id, "fed"))}>Mark All Fed</Button>
                      <Button variant="outline" size="sm" onClick={() => students.forEach(s => setStatus(s.id, "absent"))}>Mark All Absent</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {!selectedClass && (
              <div className="text-center py-12 text-muted-foreground"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>Select a class to start the register</p></div>
            )}

            {selectedClass && loadingStudents && (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            )}

            {selectedClass && !loadingStudents && students.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{classes.find(c => String(c.id) === selectedClass)?.name} — {students.length} students</span>
                    {unmarked > 0 && <Badge variant="outline" className="text-yellow-600 border-yellow-300">{unmarked} unmarked</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {students.map(s => (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm font-medium">{s.name}</span>
                        <div className="flex gap-1">
                          {(["fed", "absent", "opted_out"] as const).map(st => (
                            <button key={st} onClick={() => setStatus(s.id, st)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${records[s.id] === st
                                ? st === "fed" ? "bg-green-100 border-green-400 text-green-800"
                                  : st === "absent" ? "bg-red-100 border-red-400 text-red-800"
                                    : "bg-gray-100 border-gray-400 text-gray-700"
                                : "border-gray-200 hover:bg-gray-50 text-gray-500"}`}>
                              {st === "opted_out" ? "Opt Out" : st.charAt(0).toUpperCase() + st.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{fedCount}/{students.length} fed</span>
                    <Button onClick={saveRegister} disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Register
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedClass && !loadingStudents && students.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">No active students in this class</div>
            )}
          </TabsContent>

          <TabsContent value="fund" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="space-y-1">
                    <Label>Academic Year</Label>
                    <Input placeholder="e.g. 2024/2025" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-36" />
                  </div>
                  <div className="space-y-1">
                    <Label>Term</Label>
                    <Select value={term} onValueChange={setTerm}>
                      <SelectTrigger className="w-32"><SelectValue placeholder="Term" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Term 1">Term 1</SelectItem>
                        <SelectItem value="Term 2">Term 2</SelectItem>
                        <SelectItem value="Term 3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {academicYear && term && (
                    <Button onClick={() => setFundDialogOpen(true)} className="ml-auto">
                      <Plus className="w-4 h-4 mr-1" />Add Entry
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {loadingFund && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}

            {fundData && !loadingFund && (
              <>
                <Card className={`border-2 ${fundData.balance >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2"><PiggyBank className="w-5 h-5" /><span className="font-medium">Fund Balance</span></div>
                    <span className={`text-2xl font-bold ${fundData.balance >= 0 ? "text-green-700" : "text-red-700"}`}>
                      GHS {fundData.balance.toFixed(2)}
                    </span>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Transactions ({fundData.entries.length})</CardTitle></CardHeader>
                  <CardContent>
                    {fundData.entries.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">No transactions yet</p>
                    ) : (
                      <div className="space-y-2">
                        {fundData.entries.map(e => (
                          <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div>
                              <Badge variant={e.type === "credit" ? "default" : "destructive"} className="mr-2 text-xs">
                                {e.type === "credit" ? "Credit" : "Debit"}
                              </Badge>
                              <span className="text-sm">{e.description ?? "—"}</span>
                              <span className="text-xs text-muted-foreground ml-2">{e.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${e.type === "credit" ? "text-green-700" : "text-red-700"}`}>
                                {e.type === "credit" ? "+" : "-"}GHS {Number(e.amount).toFixed(2)}
                              </span>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={() => deleteFundEntry(e.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {!academicYear || !term ? (
              <p className="text-center text-muted-foreground text-sm py-4">Select academic year and term to view fund</p>
            ) : null}
          </TabsContent>
        </Tabs>

        <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Fund Entry</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={newEntry.type} onValueChange={v => setNewEntry(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit (money received)</SelectItem>
                    <SelectItem value="debit">Debit (money spent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Amount (GHS)</Label>
                <Input type="number" min="0" step="0.01" value={newEntry.amount} onChange={e => setNewEntry(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input value={newEntry.description} onChange={e => setNewEntry(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Food purchase for week" />
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={newEntry.date} onChange={e => setNewEntry(p => ({ ...p, date: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFundDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveFundEntry} disabled={savingFund}>
                {savingFund && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add Entry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SchoolAdminLayout>
  );
}
