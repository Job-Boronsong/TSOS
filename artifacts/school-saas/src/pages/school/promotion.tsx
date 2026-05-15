import { useSchoolId } from "@/lib/school-hooks";
import { useEffect, useState, useCallback } from "react";
import { SchoolAdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, ChevronRight, CheckCircle2, RotateCcw, ArrowRight } from "lucide-react";

interface Props { params: { schoolSlug: string } }
interface ClassItem { id: number; name: string; level: string }
interface StudentPreview {
  id: number; name: string; classId: number | null; className: string | null;
  yearAvg: number | null; nextClassId: number | null; nextClassName: string | null;
  isLastClass: boolean; suggestedAction: "promote" | "retain" | "graduate";
}
interface PromotionRun { id: number; academicYear: string; status: string; totalPromoted: number; totalRetained: number; totalGraduated: number; createdAt: string }

type Action = "promote" | "retain" | "graduate";

const ACTION_COLORS: Record<Action, string> = {
  promote: "bg-green-100 text-green-800 border-green-300",
  retain: "bg-yellow-100 text-yellow-800 border-yellow-300",
  graduate: "bg-blue-100 text-blue-800 border-blue-300",
};

export default function PromotionPage({ params }: Props) {
  const { schoolSlug } = params;
  const schoolId = useSchoolId();
  const { toast } = useToast();

  const [academicYear, setAcademicYear] = useState(() => {
    const y = new Date().getFullYear();
    return `${y}/${y + 1}`;
  });
  const [preview, setPreview] = useState<{ students: StudentPreview[]; classes: ClassItem[]; academicYear: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<Record<number, Action>>({});
  const [targetClasses, setTargetClasses] = useState<Record<number, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [runs, setRuns] = useState<PromotionRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [tab, setTab] = useState<"promote" | "history">("promote");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");

  const loadRuns = useCallback(() => {
    if (!schoolId) return;
    setLoadingRuns(true);
    fetch(`/api/schools/${schoolId}/promotion-runs`, { credentials: "include" })
      .then(r => r.json()).then(d => setRuns(Array.isArray(d) ? d : []))
      .finally(() => setLoadingRuns(false));
  }, [schoolId]);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  const loadPreview = async () => {
    if (!academicYear) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/promotion/preview?academicYear=${encodeURIComponent(academicYear)}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load preview");
      setPreview(data);
      // Initialise actions from suggestions
      const initActions: Record<number, Action> = {};
      const initTargets: Record<number, string> = {};
      for (const s of data.students as StudentPreview[]) {
        initActions[s.id] = s.suggestedAction;
        if (s.suggestedAction === "promote" && s.nextClassId) initTargets[s.id] = String(s.nextClassId);
      }
      setActions(initActions);
      setTargetClasses(initTargets);
    } catch (e: any) { toast({ title: e?.message ?? "Error loading preview", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const setStudentAction = (id: number, action: Action) => {
    setActions(prev => ({ ...prev, [id]: action }));
    if (action === "promote") {
      const s = preview?.students.find(s => s.id === id);
      if (s?.nextClassId) setTargetClasses(prev => ({ ...prev, [id]: String(s.nextClassId) }));
    }
  };

  const confirmPromotion = async () => {
    if (!preview) return;
    const total = preview.students.length;
    if (!confirm(`Confirm promotion for ${total} students? This will update class assignments and cannot be undone.`)) return;
    setConfirming(true);
    try {
      const promotions = preview.students.map(s => ({
        studentId: s.id,
        action: actions[s.id] ?? s.suggestedAction,
        targetClassId: actions[s.id] === "promote" ? parseInt(targetClasses[s.id] ?? "0") || s.nextClassId : undefined,
      }));
      const res = await fetch(`/api/schools/${schoolId}/promotion/confirm`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academicYear: preview.academicYear, promotions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Promotion confirmed!", description: `${data.totalPromoted} promoted, ${data.totalRetained} retained, ${data.totalGraduated} graduated` });
      setPreview(null);
      loadRuns();
      setTab("history");
    } catch (e: any) { toast({ title: e?.message ?? "Error", variant: "destructive" }); }
    finally { setConfirming(false); }
  };

  const filtered = (preview?.students ?? []).filter(s => {
    const matchSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAction = filterAction === "all" || (actions[s.id] ?? s.suggestedAction) === filterAction;
    return matchSearch && matchAction;
  });

  const counts = preview ? {
    promote: Object.values(actions).filter(a => a === "promote").length,
    retain: Object.values(actions).filter(a => a === "retain").length,
    graduate: Object.values(actions).filter(a => a === "graduate").length,
  } : null;

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="w-6 h-6" /> End-of-Year Promotion</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and confirm student promotions, retentions and graduations</p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2">
          <Button variant={tab === "promote" ? "default" : "outline"} onClick={() => setTab("promote")}>Promotion Wizard</Button>
          <Button variant={tab === "history" ? "default" : "outline"} onClick={() => setTab("history")}>History</Button>
        </div>

        {/* ── History Tab ── */}
        {tab === "history" && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Past Promotion Runs</CardTitle></CardHeader>
            <CardContent>
              {loadingRuns && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>}
              {!loadingRuns && runs.length === 0 && <p className="text-center py-6 text-muted-foreground">No promotion runs yet</p>}
              {runs.map(r => (
                <div key={r.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <span className="font-medium">{r.academicYear}</span>
                    <Badge className="ml-2 text-xs" variant={r.status === "confirmed" ? "default" : "secondary"}>{r.status}</Badge>
                    <span className="text-xs text-muted-foreground ml-2">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <span className="text-green-700">{r.totalPromoted} promoted</span>
                    <span className="text-yellow-700">{r.totalRetained} retained</span>
                    <span className="text-blue-700">{r.totalGraduated} graduated</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── Promotion Wizard Tab ── */}
        {tab === "promote" && (
          <>
            {/* Step 1: Select year + load */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex gap-3 items-end">
                  <div className="space-y-1">
                    <Label>Academic Year being ended</Label>
                    <Input value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="e.g. 2024/2025" className="w-40" />
                  </div>
                  <Button onClick={loadPreview} disabled={loading || !academicYear}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Load Students
                  </Button>
                </div>
              </CardContent>
            </Card>

            {preview && (
              <>
                {/* Summary bar */}
                {counts && (
                  <div className="grid grid-cols-3 gap-3">
                    {(["promote","retain","graduate"] as const).map(a => (
                      <Card key={a} className={`border-2 cursor-pointer ${filterAction === a ? "border-primary" : "border-transparent"}`}
                        onClick={() => setFilterAction(filterAction === a ? "all" : a)}>
                        <CardContent className="pt-3 pb-3 flex items-center justify-between">
                          <span className="capitalize text-sm text-muted-foreground">{a}</span>
                          <span className={`text-xl font-bold px-2 py-0.5 rounded border text-sm ${ACTION_COLORS[a]}`}>{counts[a]}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Filter bar */}
                <div className="flex gap-2">
                  <Input placeholder="Search student…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
                  <Button variant="outline" onClick={() => setFilterAction("all")} disabled={filterAction === "all"}>Show All</Button>
                </div>

                {/* Student list */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{filtered.length} of {preview.students.length} students</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          const newA: Record<number, Action> = {};
                          const newT: Record<number, string> = {};
                          preview.students.forEach(s => {
                            newA[s.id] = s.suggestedAction;
                            if (s.suggestedAction === "promote" && s.nextClassId) newT[s.id] = String(s.nextClassId);
                          });
                          setActions(newA); setTargetClasses(newT);
                        }}>
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />Reset Suggestions
                        </Button>
                        <Button onClick={confirmPromotion} disabled={confirming}>
                          {confirming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                          Confirm All
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b bg-muted/30 text-muted-foreground">
                          <th className="text-left px-4 py-2 font-medium">Student</th>
                          <th className="text-left px-4 py-2 font-medium">Current Class</th>
                          <th className="text-right px-4 py-2 font-medium">Avg Score</th>
                          <th className="text-left px-4 py-2 font-medium">Action</th>
                          <th className="text-left px-4 py-2 font-medium">Target Class</th>
                        </tr></thead>
                        <tbody>
                          {filtered.map(s => {
                            const action = actions[s.id] ?? s.suggestedAction;
                            return (
                              <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20">
                                <td className="px-4 py-2 font-medium">{s.name}</td>
                                <td className="px-4 py-2 text-muted-foreground">{s.className ?? "—"}</td>
                                <td className="px-4 py-2 text-right">
                                  {s.yearAvg !== null ? (
                                    <span className={s.yearAvg < 40 ? "text-red-600 font-semibold" : "text-green-700"}>{s.yearAvg.toFixed(1)}%</span>
                                  ) : <span className="text-muted-foreground">—</span>}
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex gap-1">
                                    {(["promote","retain","graduate"] as Action[]).map(a => (
                                      <button key={a} onClick={() => setStudentAction(s.id, a)}
                                        className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${action === a ? ACTION_COLORS[a] : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}>
                                        {a}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  {action === "promote" ? (
                                    <Select value={targetClasses[s.id] ?? String(s.nextClassId ?? "")} onValueChange={v => setTargetClasses(p => ({ ...p, [s.id]: v }))}>
                                      <SelectTrigger className="h-7 text-xs w-36"><SelectValue placeholder="Select class" /></SelectTrigger>
                                      <SelectContent>
                                        {preview.classes.filter(c => c.id !== s.classId).map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  ) : action === "graduate" ? (
                                    <span className="text-xs text-blue-600 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />Graduate</span>
                                  ) : (
                                    <span className="text-xs text-yellow-600 flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" />Same class</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {filtered.length === 0 && <p className="text-center py-6 text-muted-foreground">No students match filter</p>}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </SchoolAdminLayout>
  );
}
