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
import { Loader2, Banknote, Plus, Pencil, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface Props { params: { schoolSlug: string } }
interface SalaryProfile {
  id: number | null; teacherId: number; teacherName: string; teacherSubject: string | null; teacherStatus: string;
  basicSalary: number; housingAllowance: number; transportAllowance: number; otherAllowances: number; staffCategory: string;
}
interface PayrollRun {
  id: number; month: number; year: number; status: string;
  totalGross: number; totalNet: number; totalSsnit: number; totalPaye: number;
  notes: string | null; confirmedAt: string | null;
}
interface PayrollEntry {
  id: number; teacherId: number; teacherName: string; teacherSubject: string | null;
  basicSalary: number; housingAllowance: number; transportAllowance: number; otherAllowances: number;
  grossSalary: number; ssnitEmployee: number; ssnitEmployer: number;
  taxableIncome: number; payeIncomeTax: number; otherDeductions: number;
  netSalary: number; overridden: boolean; notes: string | null;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const gh = (v: number) => `GHS ${v.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

export default function PayrollPage({ params }: Props) {
  const schoolId = useSchoolId();
  const { toast } = useToast();

  // Salary profiles tab
  const [profiles, setProfiles] = useState<SalaryProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [profileDialog, setProfileDialog] = useState(false);
  const [editProfile, setEditProfile] = useState<SalaryProfile | null>(null);
  const [profileForm, setProfileForm] = useState({ basicSalary: "", housingAllowance: "", transportAllowance: "", otherAllowances: "", staffCategory: "teaching" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Payroll runs tab
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [creatingRun, setCreatingRun] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [overrideDialog, setOverrideDialog] = useState(false);
  const [overrideEntry, setOverrideEntry] = useState<PayrollEntry | null>(null);
  const [overrideForm, setOverrideForm] = useState<Record<string, string>>({});
  const [savingOverride, setSavingOverride] = useState(false);
  const [confirmingRun, setConfirmingRun] = useState(false);

  const loadProfiles = useCallback(() => {
    if (!schoolId) return;
    setLoadingProfiles(true);
    fetch(`/api/schools/${schoolId}/salary-profiles`, { credentials: "include" })
      .then(r => r.json()).then(d => setProfiles(Array.isArray(d) ? d : []))
      .finally(() => setLoadingProfiles(false));
  }, [schoolId]);

  // Returns fresh runs array so callers can use the up-to-date list immediately
  const loadRuns = useCallback((): Promise<PayrollRun[]> => {
    if (!schoolId) return Promise.resolve([]);
    setLoadingRuns(true);
    return fetch(`/api/schools/${schoolId}/payroll-runs`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { const list = Array.isArray(d) ? d : []; setRuns(list); return list; })
      .finally(() => setLoadingRuns(false));
  }, [schoolId]);

  useEffect(() => { loadProfiles(); loadRuns(); }, [loadProfiles, loadRuns]);

  const loadEntries = useCallback((runId: number) => {
    if (!schoolId) return;
    setLoadingEntries(true);
    fetch(`/api/schools/${schoolId}/payroll-runs/${runId}/entries`, { credentials: "include" })
      .then(r => r.json()).then(d => setEntries(Array.isArray(d) ? d : []))
      .finally(() => setLoadingEntries(false));
  }, [schoolId]);

  useEffect(() => { if (selectedRun) loadEntries(selectedRun.id); }, [selectedRun, loadEntries]);

  const openProfileEdit = (p: SalaryProfile) => {
    setEditProfile(p);
    setProfileForm({ basicSalary: String(p.basicSalary), housingAllowance: String(p.housingAllowance), transportAllowance: String(p.transportAllowance), otherAllowances: String(p.otherAllowances), staffCategory: p.staffCategory });
    setProfileDialog(true);
  };

  const saveProfile = async () => {
    if (!editProfile) return;
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/salary-profiles`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: editProfile.teacherId, ...profileForm }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      setProfileDialog(false);
      loadProfiles();
      toast({ title: "Salary profile saved" });
    } catch { toast({ title: "Failed to save salary profile", variant: "destructive" }); }
    finally { setSavingProfile(false); }
  };

  const createRun = async () => {
    setCreatingRun(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/payroll-runs`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: parseInt(selectedMonth), year: parseInt(selectedYear) }),
      });
      const data = await res.json();
      // Always refresh the runs list first so we have up-to-date data
      const freshRuns = await loadRuns();
      if (!res.ok) {
        if (data.runId) {
          // Run already exists — find it in the freshly loaded list
          const existing = freshRuns.find(r => r.id === data.runId);
          if (existing) setSelectedRun(existing);
          toast({ title: "Run already exists", description: "Showing existing run" });
        } else {
          toast({ title: data.error ?? "Error creating run", variant: "destructive" });
        }
        return;
      }
      // Select from fresh list so we have the fully-updated run with totals
      const created = freshRuns.find(r => r.id === data.run.id) ?? data.run;
      setSelectedRun(created);
      toast({ title: "Payroll run created", description: `${MONTHS[parseInt(selectedMonth)-1]} ${selectedYear}` });
    } catch { toast({ title: "Error creating run", variant: "destructive" }); }
    finally { setCreatingRun(false); }
  };

  const openOverride = (e: PayrollEntry) => {
    setOverrideEntry(e);
    setOverrideForm({
      basicSalary: String(e.basicSalary), housingAllowance: String(e.housingAllowance),
      transportAllowance: String(e.transportAllowance), otherAllowances: String(e.otherAllowances),
      ssnitEmployee: String(e.ssnitEmployee), ssnitEmployer: String(e.ssnitEmployer),
      payeIncomeTax: String(e.payeIncomeTax), otherDeductions: String(e.otherDeductions),
      notes: e.notes ?? "",
    });
    setOverrideDialog(true);
  };

  const saveOverride = async () => {
    if (!overrideEntry || !selectedRun) return;
    setSavingOverride(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/payroll-runs/${selectedRun.id}/entries/${overrideEntry.id}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrideForm),
      });
      if (!res.ok) throw new Error("Failed to save override");
      setOverrideDialog(false);
      // Reload entries first, then refresh runs and keep selectedRun in sync
      loadEntries(selectedRun.id);
      const freshRuns = await loadRuns();
      const updated = freshRuns.find(r => r.id === selectedRun.id);
      if (updated) setSelectedRun(updated);
      toast({ title: "Entry overridden" });
    } catch { toast({ title: "Failed to save override", variant: "destructive" }); }
    finally { setSavingOverride(false); }
  };

  const confirmRun = async () => {
    if (!selectedRun) return;
    if (!confirm(`Confirm payroll for ${MONTHS[selectedRun.month-1]} ${selectedRun.year}? This cannot be undone.`)) return;
    setConfirmingRun(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/payroll-runs/${selectedRun.id}/confirm`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error();
      const freshRuns = await loadRuns();
      const updated = freshRuns.find(r => r.id === selectedRun.id);
      setSelectedRun(updated ?? { ...selectedRun, status: "confirmed" });
      toast({ title: "Payroll confirmed" });
    } catch { toast({ title: "Error confirming run", variant: "destructive" }); }
    finally { setConfirmingRun(false); }
  };

  const deleteRun = async (id: number) => {
    if (!confirm("Delete this payroll run?")) return;
    await fetch(`/api/schools/${schoolId}/payroll-runs/${id}`, { method: "DELETE", credentials: "include" });
    if (selectedRun?.id === id) setSelectedRun(null);
    loadRuns();
  };

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  const gross = (p: typeof profileForm) => (Number(p.basicSalary)||0) + (Number(p.housingAllowance)||0) + (Number(p.transportAllowance)||0) + (Number(p.otherAllowances)||0);

  return (
    <SchoolAdminLayout params={params}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Banknote className="w-6 h-6" /> Staff Payroll</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage salary profiles and process monthly payroll with Ghana PAYE &amp; SSNIT</p>
        </div>

        <Tabs defaultValue="setup">
          <TabsList>
            <TabsTrigger value="setup">Salary Setup</TabsTrigger>
            <TabsTrigger value="runs">Process Payroll</TabsTrigger>
          </TabsList>

          {/* ── Salary Setup Tab ── */}
          <TabsContent value="setup" className="mt-4 space-y-4">
            {loadingProfiles && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}
            {!loadingProfiles && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Staff Salary Profiles ({profiles.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 font-medium">Teacher</th>
                        <th className="text-right py-2 font-medium">Basic (GHS)</th>
                        <th className="text-right py-2 font-medium">Housing</th>
                        <th className="text-right py-2 font-medium">Transport</th>
                        <th className="text-right py-2 font-medium">Other</th>
                        <th className="text-right py-2 font-medium">Gross</th>
                        <th className="text-center py-2 font-medium">Category</th>
                        <th className="py-2"></th>
                      </tr></thead>
                      <tbody>
                        {profiles.map(p => {
                          const totalGross = p.basicSalary + p.housingAllowance + p.transportAllowance + p.otherAllowances;
                          return (
                            <tr key={p.teacherId} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="py-2">
                                <div className="font-medium">{p.teacherName}</div>
                                {p.teacherSubject && <div className="text-xs text-muted-foreground">{p.teacherSubject}</div>}
                              </td>
                              <td className="text-right py-2">{p.basicSalary.toFixed(2)}</td>
                              <td className="text-right py-2">{p.housingAllowance.toFixed(2)}</td>
                              <td className="text-right py-2">{p.transportAllowance.toFixed(2)}</td>
                              <td className="text-right py-2">{p.otherAllowances.toFixed(2)}</td>
                              <td className="text-right py-2 font-semibold">{totalGross.toFixed(2)}</td>
                              <td className="text-center py-2"><Badge variant="outline" className="text-xs">{p.staffCategory}</Badge></td>
                              <td className="py-2 text-right">
                                <Button size="sm" variant="ghost" onClick={() => openProfileEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {profiles.length === 0 && <p className="text-center py-6 text-muted-foreground">No staff yet. Add teachers first.</p>}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Process Payroll Tab ── */}
          <TabsContent value="runs" className="mt-4 space-y-4">
            {profiles.every(p => p.id === null) && profiles.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>No salary profiles set up yet. Go to the <strong>Salary Setup</strong> tab and save salaries for each staff member before generating a payroll run.</span>
              </div>
            )}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="space-y-1">
                    <Label>Month</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Year</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createRun} disabled={creatingRun}>
                    {creatingRun ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                    Generate Run
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Run list */}
              <Card className="md:col-span-1">
                <CardHeader className="pb-2"><CardTitle className="text-base">Payroll Runs</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {loadingRuns && <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" /></div>}
                  {!loadingRuns && runs.length === 0 && <p className="text-center py-6 text-muted-foreground text-sm">No runs yet</p>}
                  {runs.map(r => (
                    <div key={r.id} className={`flex items-center justify-between p-3 border-b last:border-0 cursor-pointer hover:bg-muted/30 ${selectedRun?.id === r.id ? "bg-muted" : ""}`}
                      onClick={() => setSelectedRun(r)}>
                      <div>
                        <div className="font-medium text-sm">{MONTHS[r.month-1]} {r.year}</div>
                        <div className="text-xs text-muted-foreground">{gh(r.totalNet)} net</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={r.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                          {r.status}
                        </Badge>
                        {r.status === "draft" && (
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={e => { e.stopPropagation(); deleteRun(r.id); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Run detail */}
              <Card className="md:col-span-2">
                {!selectedRun ? (
                  <CardContent className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                    Select a payroll run to view details
                  </CardContent>
                ) : (
                  <>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{MONTHS[selectedRun.month-1]} {selectedRun.year}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={selectedRun.status === "confirmed" ? "default" : "secondary"}>{selectedRun.status}</Badge>
                          {selectedRun.status === "draft" && (
                            <Button size="sm" onClick={confirmRun} disabled={confirmingRun}>
                              {confirmingRun ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                              Confirm
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {[["Gross", selectedRun.totalGross], ["Net", selectedRun.totalNet], ["SSNIT", selectedRun.totalSsnit], ["PAYE", selectedRun.totalPaye]].map(([label, val]) => (
                          <div key={label} className="bg-muted rounded p-2 text-center">
                            <div className="text-xs text-muted-foreground">{label}</div>
                            <div className="text-sm font-semibold">GHS {Number(val).toFixed(0)}</div>
                          </div>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {loadingEntries && <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" /></div>}
                      {!loadingEntries && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead><tr className="border-b text-muted-foreground bg-muted/30">
                              <th className="text-left px-3 py-2">Teacher</th>
                              <th className="text-right px-3 py-2">Gross</th>
                              <th className="text-right px-3 py-2">SSNIT (emp)</th>
                              <th className="text-right px-3 py-2">PAYE</th>
                              <th className="text-right px-3 py-2">Net</th>
                              <th className="px-3 py-2"></th>
                            </tr></thead>
                            <tbody>
                              {entries.map(e => (
                                <tr key={e.id} className={`border-b last:border-0 ${e.overridden ? "bg-amber-50" : ""}`}>
                                  <td className="px-3 py-2">
                                    <div className="font-medium">{e.teacherName}</div>
                                    {e.overridden && <span className="text-amber-600 text-xs">overridden</span>}
                                  </td>
                                  <td className="text-right px-3 py-2">{e.grossSalary.toFixed(2)}</td>
                                  <td className="text-right px-3 py-2">{e.ssnitEmployee.toFixed(2)}</td>
                                  <td className="text-right px-3 py-2">{e.payeIncomeTax.toFixed(2)}</td>
                                  <td className="text-right px-3 py-2 font-semibold text-green-700">{e.netSalary.toFixed(2)}</td>
                                  <td className="px-3 py-2">
                                    {selectedRun.status === "draft" && (
                                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openOverride(e)}>
                                        <Pencil className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {entries.length === 0 && (
                            <div className="text-center py-6 text-muted-foreground text-sm space-y-2">
                              <p>No entries in this run.</p>
                              <p className="text-xs">Set up salary profiles in the <strong>Salary Setup</strong> tab first, then delete this run and generate a new one.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Salary Profile Edit Dialog */}
        <Dialog open={profileDialog} onOpenChange={setProfileDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Salary — {editProfile?.teacherName}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-1">
              <div className="space-y-1">
                <Label>Staff Category</Label>
                <Select value={profileForm.staffCategory} onValueChange={v => setProfileForm(p => ({ ...p, staffCategory: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teaching">Teaching Staff</SelectItem>
                    <SelectItem value="non_teaching">Non-Teaching Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {[["basicSalary", "Basic Salary (GHS)"], ["housingAllowance", "Housing Allowance"], ["transportAllowance", "Transport Allowance"], ["otherAllowances", "Other Allowances"]].map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label>{label}</Label>
                  <Input type="number" min="0" step="0.01" value={(profileForm as any)[key]} onChange={e => setProfileForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="bg-muted rounded p-3 text-sm">
                <div className="flex justify-between"><span>Gross Salary:</span><strong>GHS {gross(profileForm).toFixed(2)}</strong></div>
                <div className="flex justify-between text-muted-foreground text-xs mt-1"><span>SSNIT (employee 5.5%):</span><span>GHS {((Number(profileForm.basicSalary)||0)*0.055).toFixed(2)}</span></div>
                <div className="flex justify-between text-muted-foreground text-xs"><span>SSNIT (employer 13%):</span><span>GHS {((Number(profileForm.basicSalary)||0)*0.13).toFixed(2)}</span></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProfileDialog(false)}>Cancel</Button>
              <Button onClick={saveProfile} disabled={savingProfile}>{savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Override Entry Dialog */}
        <Dialog open={overrideDialog} onOpenChange={setOverrideDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Override Entry — {overrideEntry?.teacherName}</DialogTitle>
              <p className="text-xs text-muted-foreground">Admin manual override. SSNIT and PAYE will auto-recalculate unless you override them.</p>
            </DialogHeader>
            <div className="space-y-2 py-1 max-h-[60vh] overflow-y-auto">
              {[
                ["basicSalary","Basic Salary"],["housingAllowance","Housing Allowance"],
                ["transportAllowance","Transport Allowance"],["otherAllowances","Other Allowances"],
                ["ssnitEmployee","SSNIT Employee (5.5% auto)"],["ssnitEmployer","SSNIT Employer (13% auto)"],
                ["payeIncomeTax","PAYE Income Tax (auto)"],["otherDeductions","Other Deductions"],
              ].map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Input type="number" min="0" step="0.01" value={overrideForm[key] ?? ""} onChange={e => setOverrideForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Input value={overrideForm.notes ?? ""} onChange={e => setOverrideForm(p => ({ ...p, notes: e.target.value }))} placeholder="Reason for override…" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOverrideDialog(false)}>Cancel</Button>
              <Button onClick={saveOverride} disabled={savingOverride}>{savingOverride && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Override</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SchoolAdminLayout>
  );
}
