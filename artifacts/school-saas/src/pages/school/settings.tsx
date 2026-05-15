import { useState, useEffect } from "react";
import { useGetSchoolSettings, useUpdateSchoolSettings, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { SchoolAdminLayout } from "@/components/layout";
import { useSchoolId } from "@/lib/school-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Plus, Pencil, Trash2, CalendarDays, Star, UtensilsCrossed, Bus, MapPin, Loader2, Navigation } from "lucide-react";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { LogoUpload } from "@/components/logo-upload";

interface Props {
  params: { schoolSlug: string };
}

interface Term {
  id: number;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export default function SchoolSettings({ params }: Props) {
  const { schoolSlug } = params;
  const schoolId = useSchoolId();
  const { data: settings, refetch } = useGetSchoolSettings(schoolId);

  const [terms, setTerms] = useState<Term[]>([]);
  const [termOpen, setTermOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [termForm, setTermForm] = useState({ name: "Term 1", academicYear: "", startDate: "", endDate: "", isCurrent: false });
  const [savingTerm, setSavingTerm] = useState(false);

  const fetchTerms = () => {
    if (!schoolId) return;
    fetch(`/api/schools/${schoolId}/terms`, { credentials: "include" })
      .then(r => r.json()).then(setTerms).catch(() => {});
  };

  useEffect(() => { fetchTerms(); }, [schoolId]);

  const handleTermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termForm.name || !termForm.academicYear || !termForm.startDate || !termForm.endDate) {
      toast({ title: "All fields required", variant: "destructive" }); return;
    }
    setSavingTerm(true);
    try {
      const url = editingTerm ? `/api/schools/${schoolId}/terms/${editingTerm.id}` : `/api/schools/${schoolId}/terms`;
      const method = editingTerm ? "PUT" : "POST";
      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(termForm),
      });
      if (res.ok) {
        toast({ title: editingTerm ? "Term updated" : "Term added" });
        setTermOpen(false); setEditingTerm(null);
        setTermForm({ name: "Term 1", academicYear: "", startDate: "", endDate: "", isCurrent: false });
        fetchTerms();
      }
    } catch {
      toast({ title: "Error saving term", variant: "destructive" });
    } finally { setSavingTerm(false); }
  };

  const handleDeleteTerm = async (id: number) => {
    if (!confirm("Delete this term?")) return;
    await fetch(`/api/schools/${schoolId}/terms/${id}`, { method: "DELETE", credentials: "include" });
    fetchTerms();
  };

  const handleSetCurrent = async (id: number) => {
    await fetch(`/api/schools/${schoolId}/terms/${id}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCurrent: true }),
    });
    fetchTerms();
  };
  // Feeding fee settings
  const [feedingFeePerDay, setFeedingFeePerDay] = useState("");
  const [feedingEnabled, setFeedingEnabled] = useState(false);
  const [savingFeedingFee, setSavingFeedingFee] = useState(false);

  // Bus fee per day settings
  const [busFeePerDay, setBusFeePerDay] = useState("");
  const [savingBusFee, setSavingBusFee] = useState(false);

  // Scholarship / staff-child fee waivers
  const FEE_TYPES = [
    { key: "school_fee", label: "School Fee" },
    { key: "bus_fee", label: "Bus Fee" },
    { key: "feeding_fee", label: "Feeding Fee" },
  ];
  const [scholarshipWaivedFees, setScholarshipWaivedFees] = useState<string[]>([]);
  const [staffChildWaivedFees, setStaffChildWaivedFees] = useState<string[]>([]);
  const [savingWaivers, setSavingWaivers] = useState(false);

  // GPS check-in location
  const [gpsLat, setGpsLat] = useState<string>("");
  const [gpsLng, setGpsLng] = useState<string>("");
  const [gpsRadius, setGpsRadius] = useState<string>("50");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [savingGps, setSavingGps] = useState(false);

  useEffect(() => {
    if (settings) {
      if ((settings as any).checkinLatitude != null) setGpsLat(String((settings as any).checkinLatitude));
      if ((settings as any).checkinLongitude != null) setGpsLng(String((settings as any).checkinLongitude));
      if ((settings as any).checkinRadiusMeters != null) setGpsRadius(String((settings as any).checkinRadiusMeters));
    }
  }, [settings]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) { toast({ variant: "destructive", title: "Geolocation not supported" }); return; }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGpsLat(pos.coords.latitude.toFixed(7));
        setGpsLng(pos.coords.longitude.toFixed(7));
        setGettingLocation(false);
        toast({ title: "Location captured", description: `Accuracy: ~${Math.round(pos.coords.accuracy)}m` });
      },
      () => { setGettingLocation(false); toast({ variant: "destructive", title: "Could not get location", description: "Please allow location access and try again." }); },
      { timeout: 12000, maximumAge: 0, enableHighAccuracy: true }
    );
  };

  const handleSaveGps = async () => {
    if (!schoolId) return;
    setSavingGps(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/settings`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          schoolName: form.schoolName, contactEmail: form.contactEmail, contactPhone: form.contactPhone,
          address: form.address, academicYear: form.academicYear, themeColor: form.themeColor,
          checkinLatitude: gpsLat ? Number(gpsLat) : null,
          checkinLongitude: gpsLng ? Number(gpsLng) : null,
          checkinRadiusMeters: Number(gpsRadius) || 50,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast({ title: "GPS check-in location saved" });
      refetch();
    } catch {
      toast({ variant: "destructive", title: "Error saving GPS settings" });
    } finally { setSavingGps(false); }
  };

  const handleClearGps = async () => {
    if (!confirm("Clear the school's check-in location? Teachers will be able to check in from anywhere.")) return;
    if (!schoolId) return;
    setSavingGps(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/settings`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          schoolName: form.schoolName, contactEmail: form.contactEmail, contactPhone: form.contactPhone,
          address: form.address, academicYear: form.academicYear, themeColor: form.themeColor,
          checkinLatitude: null, checkinLongitude: null, checkinRadiusMeters: 50,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setGpsLat(""); setGpsLng(""); setGpsRadius("50");
      toast({ title: "GPS location cleared" });
      refetch();
    } catch {
      toast({ variant: "destructive", title: "Error clearing GPS settings" });
    } finally { setSavingGps(false); }
  };

  useEffect(() => {
    if (!schoolId) return;
    fetch(`/api/schools/${schoolId}/fee-settings`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setFeedingFeePerDay(d.feedingFeePerDay != null ? String(d.feedingFeePerDay) : "");
          setFeedingEnabled(!!d.feedingEnabled);
          setBusFeePerDay(d.busFeePerDay != null ? String(d.busFeePerDay) : "");
          setScholarshipWaivedFees(d.scholarshipWaivedFees ? d.scholarshipWaivedFees.split(",").filter(Boolean) : []);
          setStaffChildWaivedFees(d.staffChildWaivedFees ? d.staffChildWaivedFees.split(",").filter(Boolean) : []);
        }
      })
      .catch(() => {});
  }, [schoolId]);

  const toggleFee = (list: string[], setList: (v: string[]) => void, key: string) => {
    setList(list.includes(key) ? list.filter(k => k !== key) : [...list, key]);
  };

  const handleSaveWaivers = async () => {
    if (!schoolId) return;
    setSavingWaivers(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/fee-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scholarshipWaivedFees: scholarshipWaivedFees.join(","),
          staffChildWaivedFees: staffChildWaivedFees.join(","),
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Fee waivers saved" });
    } catch {
      toast({ variant: "destructive", title: "Error saving fee waivers" });
    } finally {
      setSavingWaivers(false);
    }
  };

  const handleSaveBusFee = async () => {
    if (!schoolId) return;
    setSavingBusFee(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/fee-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ busFeePerDay: parseFloat(busFeePerDay) || 0 }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Daily bus rate saved" });
    } catch {
      toast({ variant: "destructive", title: "Error saving bus rate" });
    } finally {
      setSavingBusFee(false);
    }
  };

  const handleSaveFeedingFee = async () => {
    if (!schoolId) return;
    setSavingFeedingFee(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/fee-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ feedingFeePerDay: parseFloat(feedingFeePerDay) || 0, feedingEnabled }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Feeding fee settings saved" });
    } catch {
      toast({ variant: "destructive", title: "Error saving feeding fee settings" });
    } finally {
      setSavingFeedingFee(false);
    }
  };

  const updateSettings = useUpdateSchoolSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    schoolName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    academicYear: "",
    logoUrl: "",
    themeColor: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        schoolName: settings.schoolName || "",
        contactEmail: settings.contactEmail || "",
        contactPhone: settings.contactPhone || "",
        address: settings.address || "",
        academicYear: settings.academicYear || "",
        logoUrl: settings.logoUrl || "",
        themeColor: settings.themeColor || "",
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      schoolId: schoolId,
      data: {
        schoolName: form.schoolName || undefined,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        address: form.address || undefined,
        academicYear: form.academicYear || undefined,
        themeColor: form.themeColor || undefined,
        logoUrl: form.logoUrl || undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Settings saved successfully" });
        refetch();
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: () => toast({ variant: "destructive", title: "Error saving settings" }),
    });
  };

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">School Settings</h1>
          <p className="text-muted-foreground">Configure your school's information and preferences.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                School Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>School Name</Label>
                  <Input value={form.schoolName} onChange={e => setForm(f => ({ ...f, schoolName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Academic & Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Input value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))} placeholder="e.g. 2025-2026" />
                </div>
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.themeColor || "#3B82F6"}
                      onChange={e => setForm(f => ({ ...f, themeColor: e.target.value }))}
                      className="h-9 w-14 rounded border cursor-pointer p-0.5"
                    />
                    <Input value={form.themeColor} onChange={e => setForm(f => ({ ...f, themeColor: e.target.value }))} placeholder="#3B82F6" className="flex-1" />
                  </div>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>School Logo</Label>
                  <LogoUpload
                    currentUrl={form.logoUrl}
                    onUploaded={(url) => setForm(f => ({ ...f, logoUrl: url }))}
                    onClear={() => setForm(f => ({ ...f, logoUrl: "" }))}
                  />
                  <p className="text-xs text-muted-foreground">This logo appears in your sidebar and on student report cards.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettings.isPending} className="gap-2">
              <Save className="w-4 h-4" />
              {updateSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Account Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Keep your account secure by using a strong, unique password.
            </p>
            <ChangePasswordDialog />
          </CardContent>
        </Card>

        {/* Feeding Fee Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-orange-500" />
              Daily Feeding Fee
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set the daily rate charged for student feeding. This amount is pre-filled when you record a feeding payment.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Daily Rate (GHS)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 5.00"
                  value={feedingFeePerDay}
                  onChange={e => setFeedingFeePerDay(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Feeding Enabled</Label>
                <div className="flex items-center gap-3 h-9">
                  <button
                    type="button"
                    onClick={() => setFeedingEnabled(v => !v)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${feedingEnabled ? "bg-orange-500" : "bg-muted"}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${feedingEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                  <span className="text-sm text-muted-foreground">{feedingEnabled ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={handleSaveFeedingFee} disabled={savingFeedingFee} size="sm" className="gap-2">
                <Save className="w-4 h-4" />
                {savingFeedingFee ? "Saving..." : "Save Feeding Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Daily Bus Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-blue-500" />
              Daily Bus Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set the daily rate charged for school bus transport. This amount is pre-filled when you record a bus fee payment.
            </p>
            <div className="max-w-xs space-y-2">
              <Label>Daily Rate (GHS)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 3.00"
                value={busFeePerDay}
                onChange={e => setBusFeePerDay(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={handleSaveBusFee} disabled={savingBusFee} size="sm" className="gap-2">
                <Save className="w-4 h-4" />
                {savingBusFee ? "Saving..." : "Save Bus Rate"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scholarship & Staff Child Fee Waivers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-500" />
              Fee Waivers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Select which fees are fully waived for scholarship and staff-child students. Checked fees will show as ₵0 for those students.
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-semibold">Scholarship Students</p>
                {FEE_TYPES.map(f => (
                  <div key={f.key} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`sch_${f.key}`}
                      checked={scholarshipWaivedFees.includes(f.key)}
                      onChange={() => toggleFee(scholarshipWaivedFees, setScholarshipWaivedFees, f.key)}
                      className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                    />
                    <label htmlFor={`sch_${f.key}`} className="text-sm cursor-pointer">{f.label}</label>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold">Staff Child Students</p>
                {FEE_TYPES.map(f => (
                  <div key={f.key} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`staff_${f.key}`}
                      checked={staffChildWaivedFees.includes(f.key)}
                      onChange={() => toggleFee(staffChildWaivedFees, setStaffChildWaivedFees, f.key)}
                      className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                    />
                    <label htmlFor={`staff_${f.key}`} className="text-sm cursor-pointer">{f.label}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={handleSaveWaivers} disabled={savingWaivers} size="sm" className="gap-2">
                <Save className="w-4 h-4" />
                {savingWaivers ? "Saving..." : "Save Fee Waivers"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* GPS Check-in Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Teacher GPS Check-in Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set the school's GPS location. Teachers must be within the allowed radius to check in using GPS. Leave empty to allow check-in from anywhere.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleUseMyLocation} disabled={gettingLocation} className="gap-2">
                {gettingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 text-emerald-600" />}
                {gettingLocation ? "Getting location…" : "Use My Current Location"}
              </Button>
              {gpsLat && gpsLng && (
                <a
                  href={`https://maps.google.com/?q=${gpsLat},${gpsLng}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline border rounded px-2 py-1.5"
                >
                  <MapPin className="w-3.5 h-3.5" />View on map
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Latitude</Label>
                <Input
                  value={gpsLat}
                  onChange={e => setGpsLat(e.target.value)}
                  placeholder="e.g. 5.6037"
                  className="text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Longitude</Label>
                <Input
                  value={gpsLng}
                  onChange={e => setGpsLng(e.target.value)}
                  placeholder="e.g. -0.1870"
                  className="text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Allowed Radius (metres)</Label>
                <Input
                  type="number"
                  min="10"
                  step="1"
                  value={gpsRadius}
                  onChange={e => setGpsRadius(e.target.value)}
                  placeholder="e.g. 50"
                  className="text-sm"
                />
              </div>
            </div>

            {gpsLat && gpsLng && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-sm text-emerald-800">
                  <p className="font-medium">Check-in zone active</p>
                  <p className="text-xs mt-0.5">Teachers must be within <span className="font-semibold">{gpsRadius}m</span> of ({parseFloat(gpsLat).toFixed(5)}, {parseFloat(gpsLng).toFixed(5)}) to check in.</p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              {gpsLat && gpsLng && (
                <Button type="button" variant="ghost" size="sm" onClick={handleClearGps} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  Clear location
                </Button>
              )}
              <div className="ml-auto">
                <Button type="button" onClick={handleSaveGps} disabled={savingGps} size="sm" className="gap-2">
                  <Save className="w-4 h-4" />
                  {savingGps ? "Saving…" : "Save GPS Settings"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Terms */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Academic Terms
            </CardTitle>
            <Button size="sm" onClick={() => { setEditingTerm(null); setTermForm({ name: "Term 1", academicYear: settings?.academicYear ?? "", startDate: "", endDate: "", isCurrent: false }); setTermOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />Add Term
            </Button>
          </CardHeader>
          <CardContent>
            {terms.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No terms added yet. Add your first academic term above.</p>
            ) : (
              <div className="space-y-2">
                {terms.map(term => (
                  <div key={term.id} className="flex items-center gap-3 border rounded-lg px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{term.name}</p>
                        <span className="text-xs text-muted-foreground">{term.academicYear}</span>
                        {term.isCurrent && <Badge variant="default" className="text-xs px-1.5 py-0">Current</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {term.startDate} — {term.endDate}
                      </p>
                    </div>
                    {!term.isCurrent && (
                      <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => handleSetCurrent(term.id)}>
                        <Star className="w-3 h-3" />Set Current
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingTerm(term); setTermForm({ name: term.name, academicYear: term.academicYear, startDate: term.startDate, endDate: term.endDate, isCurrent: term.isCurrent }); setTermOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteTerm(term.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Term Dialog */}
        <Dialog open={termOpen} onOpenChange={v => { if (!v) { setTermOpen(false); setEditingTerm(null); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{editingTerm ? "Edit Term" : "Add Academic Term"}</DialogTitle></DialogHeader>
            <form onSubmit={handleTermSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Term Name</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={termForm.name}
                  onChange={e => setTermForm(f => ({ ...f, name: e.target.value }))}
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={termForm.academicYear} onChange={e => setTermForm(f => ({ ...f, academicYear: e.target.value }))} placeholder="e.g. 2025/2026" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={termForm.startDate} onChange={e => setTermForm(f => ({ ...f, startDate: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={termForm.endDate} onChange={e => setTermForm(f => ({ ...f, endDate: e.target.value }))} required />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isCurrent" checked={termForm.isCurrent} onChange={e => setTermForm(f => ({ ...f, isCurrent: e.target.checked }))} className="rounded" />
                <Label htmlFor="isCurrent" className="cursor-pointer">Mark as current term</Label>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setTermOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={savingTerm}>{savingTerm ? "Saving..." : editingTerm ? "Save Changes" : "Add Term"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </SchoolAdminLayout>
  );
}
