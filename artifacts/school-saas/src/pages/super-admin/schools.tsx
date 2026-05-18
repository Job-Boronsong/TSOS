import { useState, useEffect } from "react";
import { loadPaystackScript } from "@/lib/load-paystack";
import { useMutation } from "@tanstack/react-query";
import { useListSchools, useCreateSchool, useUpdateSchool, useUpdateSchoolStatus } from "@workspace/api-client-react";
import { SuperAdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Edit, ToggleLeft, ToggleRight, KeyRound, Settings2, CalendarClock, Percent, RefreshCw, LockOpen, Trash2, AlertTriangle, FlaskConical, Tag, X, Mail, CheckCircle2, Link2, Copy, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format, differenceInDays, parseISO } from "date-fns";
import { LogoUpload } from "@/components/logo-upload";

// ─── Helpers ────────────────────────────────────────────────────────

function discountFor(months: number): number {
  if (months >= 12) return 5;
  return 0;
}

function daysUntil(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), new Date());
}

function subStatusBadge(sub: any) {
  if (!sub) return <Badge variant="outline" className="text-xs text-muted-foreground">No subscription</Badge>;
  const status = sub.subscriptionStatus ?? "active";
  const days = daysUntil(sub.expiryDate);
  if (status === "expired") return <Badge variant="destructive" className="text-xs">Expired</Badge>;
  if (status === "grace") return <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">Grace period</Badge>;
  if (sub.cancelledAt) return <Badge className="text-xs bg-slate-100 text-slate-600 border-slate-300">Cancelled</Badge>;
  if (sub.plan === "trial") return <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-300">🧪 Trial · {days}d left</Badge>;
  if (days <= 7) return <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">Expires in {days}d</Badge>;
  return <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Active</Badge>;
}

// ─── Main Component ──────────────────────────────────────────────────

export default function SuperAdminSchools() {
  const { data: schools, refetch } = useListSchools();
  const createSchool = useCreateSchool();
  const updateSchool = useUpdateSchool();
  const updateStatus = useUpdateSchoolStatus();
  const { toast } = useToast();

  // Dialogs
  const [open, setOpen] = useState(false);
  const [editSchool, setEditSchool] = useState<any>(null);
  const [resetSchool, setResetSchool] = useState<any>(null);
  const [topUpSchool, setTopUpSchool] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

  // Pricing
  const [monthlyPrice, setMonthlyPrice] = useState<number>(500);
  const [priceInput, setPriceInput] = useState("500");
  const [editingPrice, setEditingPrice] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);

  // Create form
  const [form, setForm] = useState({
    name: "", contactEmail: "", contactPhone: "", address: "",
    adminUsername: "", adminPassword: "", adminName: "", months: "1",
    logoUrl: "", themeColor: "",
  });
  const [isTrial, setIsTrial] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({ name: "", contactEmail: "", contactPhone: "", address: "" });

  // Top-up form
  const [topUpMonths, setTopUpMonths] = useState("1");
  const [topUpPreview, setTopUpPreview] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Delete single school
  const [deleteSchool, setDeleteSchool] = useState<any>(null);
  const [deleteTyped, setDeleteTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Special discount
  const [discountSchool, setDiscountSchool] = useState<any>(null);
  const [discountInput, setDiscountInput] = useState("");
  const [savingDiscount, setSavingDiscount] = useState(false);

  // Copy link
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Wipe all data
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeTyped, setWipeTyped] = useState("");
  const [wiping, setWiping] = useState(false);

  // Email broadcast
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailTarget, setEmailTarget] = useState<"all" | number[]>("all");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{ sent: number; failed: number } | null>(null);
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/super-admin/email/config-status", { credentials: "include" })
      .then(r => r.json())
      .then(d => setEmailConfigured(d.configured))
      .catch(() => setEmailConfigured(false));
  }, []);

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) return;
    setSendingEmail(true);
    setEmailResult(null);
    try {
      const res = await fetch("/api/super-admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject: emailSubject, body: emailBody, schoolIds: emailTarget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmailResult({ sent: data.sent, failed: data.failed });
      toast({ title: `Email sent`, description: `${data.sent} delivered${data.failed > 0 ? `, ${data.failed} failed` : ""}.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to send", description: err.message });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDeleteSchool = async () => {
    if (!deleteSchool || deleteTyped !== deleteSchool.name) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/schools/${deleteSchool.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "School permanently deleted", description: `"${deleteSchool.name}" and all its data have been removed.` });
      setDeleteSchool(null);
      setDeleteTyped("");
      refetch();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete failed", description: err.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleWipeAllData = async () => {
    if (wipeTyped !== "DELETE ALL") return;
    setWiping(true);
    try {
      const res = await fetch("/api/admin/wipe-all-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirmToken: "WIPE_ALL_CONFIRMED" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "All school data wiped", description: "You can now add fresh schools." });
      setWipeOpen(false);
      setWipeTyped("");
      refetch();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Wipe failed", description: err.message });
    } finally {
      setWiping(false);
    }
  };

  const handleSetDiscount = async (clear = false) => {
    if (!discountSchool) return;
    const pct = clear ? null : parseFloat(discountInput);
    if (!clear && (isNaN(pct!) || pct! < 0 || pct! > 100)) {
      toast({ variant: "destructive", title: "Enter a valid discount (0–100)" });
      return;
    }
    setSavingDiscount(true);
    try {
      const res = await fetch(`/api/schools/${discountSchool.id}/custom-discount`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ discountPct: clear ? null : pct }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({
        title: clear ? "Special discount cleared" : "Special discount saved",
        description: clear ? `${discountSchool.name} will now use standard pricing.` : `${discountSchool.name} always gets ${pct}% off.`,
      });
      setDiscountSchool(null);
      setDiscountInput("");
      refetch();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to save discount", description: err.message });
    } finally {
      setSavingDiscount(false);
    }
  };

  useEffect(() => {
    fetch("/api/platform/settings", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setMonthlyPrice(Number(d.monthlyPrice)); setPriceInput(String(Number(d.monthlyPrice))); })
      .catch(() => {});
  }, []);

  // Auto-fetch top-up preview
  useEffect(() => {
    if (!topUpSchool || !topUpMonths) return;
    const months = parseInt(topUpMonths);
    if (!months || months < 1) { setTopUpPreview(null); return; }
    fetch(`/api/schools/${topUpSchool.id}/subscription/topup-preview?months=${months}`, { credentials: "include" })
      .then(r => r.json()).then(setTopUpPreview).catch(() => setTopUpPreview(null));
  }, [topUpSchool, topUpMonths]);

  const handleSavePrice = async () => {
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) { toast({ variant: "destructive", title: "Enter a valid price" }); return; }
    setSavingPrice(true);
    try {
      const res = await fetch("/api/platform/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ monthlyPrice: price }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setMonthlyPrice(Number(d.monthlyPrice));
      setEditingPrice(false);
      toast({ title: "Monthly price updated", description: `GHS ${Number(d.monthlyPrice).toLocaleString()} per month` });
    } catch { toast({ variant: "destructive", title: "Failed to update price" }); }
    finally { setSavingPrice(false); }
  };

  const resetPassword = useMutation({
    mutationFn: async ({ schoolId, password }: { schoolId: number; password: string }) => {
      const res = await fetch(`/api/schools/${schoolId}/admin-password`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ newPassword: password }) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => { toast({ title: "Password reset", description: `Username: ${data.username}. Account unlocked and ready to use.`, duration: 8000 }); setResetSchool(null); setNewPassword(""); },
    onError: () => toast({ variant: "destructive", title: "Error resetting password" }),
  });

  const unlockAdmin = useMutation({
    mutationFn: async (schoolId: number) => {
      const res = await fetch(`/api/schools/${schoolId}/admin-unlock`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => { toast({ title: "Account unlocked", description: `${data.username} can log in again.`, duration: 6000 }); },
    onError: () => toast({ variant: "destructive", title: "Error unlocking account" }),
  });

  const handlePayWithPaystack = async () => {
    if (!topUpSchool) return;
    const months = parseInt(topUpMonths) || 1;
    setPaying(true);
    setPaymentResult(null);
    try {
      const initRes = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ schoolId: topUpSchool.id, months }),
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
        metadata: { schoolId: topUpSchool.id, months, schoolName: topUpSchool.name },
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
            refetch();
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const { adminUsername, adminPassword } = form;
    createSchool.mutate({ data: { ...form, months: isTrial ? 0 : parseInt(form.months), isTrial } as any }, {
      onSuccess: (school: any) => {
        const disc = school.subscription?.discountPct;
        toast({
          title: "School created",
          description: isTrial
            ? `Admin: ${adminUsername} / ${adminPassword} · 14-day free trial · Expires: ${school.subscription?.expiryDate}`
            : `Admin: ${adminUsername} / ${adminPassword} · Expires: ${school.subscription?.expiryDate}${disc > 0 ? ` · ${disc}% discount applied` : ""}`,
          duration: 12000,
        });
        setOpen(false);
        setIsTrial(false);
        setForm({ name: "", contactEmail: "", contactPhone: "", address: "", adminUsername: "", adminPassword: "", adminName: "", months: "1", logoUrl: "", themeColor: "" });
        refetch();
      },
      onError: () => toast({ variant: "destructive", title: "Error creating school" }),
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSchool) return;
    updateSchool.mutate({ schoolId: editSchool.id, data: editForm }, {
      onSuccess: () => { toast({ title: "School updated" }); setEditSchool(null); refetch(); },
      onError: () => toast({ variant: "destructive", title: "Error updating school" }),
    });
  };

  const toggleStatus = (school: any) => {
    const newStatus = school.status === "active" ? "inactive" : "active";
    updateStatus.mutate({ schoolId: school.id, data: { status: newStatus } }, {
      onSuccess: () => { toast({ title: `School ${newStatus === "active" ? "activated" : "deactivated"}` }); refetch(); },
      onError: () => toast({ variant: "destructive", title: "Error updating status" }),
    });
  };

  const topUpMonthsNum = parseInt(topUpMonths) || 1;
  const previewDiscount = topUpPreview ? topUpPreview.discount : discountFor(topUpMonthsNum);
  const previewIsCustom = topUpPreview?.customDiscount != null;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Schools</h1>
            <p className="text-muted-foreground">Manage all registered schools and billing.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEmailResult(null); setEmailSubject(""); setEmailBody(""); setEmailTarget("all"); setEmailOpen(true); }}>
              <Mail className="w-4 h-4 mr-2" />Email Subscribers
            </Button>
            <Button variant="destructive" size="sm" onClick={() => { setWipeTyped(""); setWipeOpen(true); }}>
              <Trash2 className="w-4 h-4 mr-2" />Reset All Data
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Add School</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
              <DialogHeader><DialogTitle>Add New School</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col flex-1 min-h-0 gap-4">
                <div className="overflow-y-auto flex-1 pr-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>School Name</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Address</Label>
                    <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                  <div className="col-span-2 border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-3 font-medium">Admin login credentials (note these down — shown once)</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Admin Username</Label>
                    <Input value={form.adminUsername} onChange={e => setForm(f => ({ ...f, adminUsername: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Admin Password</Label>
                    <Input type="text" value={form.adminPassword} onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))} required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label>Admin Full Name</Label>
                    <Input value={form.adminName} onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))} required />
                  </div>
                  <div className="col-span-2 border-t pt-3 space-y-2">
                    <Label>School Logo</Label>
                    <LogoUpload
                      currentUrl={form.logoUrl}
                      onUploaded={(url) => setForm(f => ({ ...f, logoUrl: url }))}
                      onClear={() => setForm(f => ({ ...f, logoUrl: "" }))}
                      label="Upload Logo"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Brand Color (optional)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.themeColor || "#3B82F6"}
                        onChange={e => setForm(f => ({ ...f, themeColor: e.target.value }))}
                        className="h-9 w-14 rounded border cursor-pointer p-0.5"
                      />
                      <Input
                        value={form.themeColor}
                        onChange={e => setForm(f => ({ ...f, themeColor: e.target.value }))}
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 border-t pt-3 space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-3 bg-amber-50 border-amber-200">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-amber-600" />
                        <div>
                          <Label className="text-amber-800 font-semibold cursor-pointer" htmlFor="trial-toggle">14-Day Free Trial</Label>
                          <p className="text-xs text-amber-600">No payment required. School expires after 14 days.</p>
                        </div>
                      </div>
                      <Switch id="trial-toggle" checked={isTrial} onCheckedChange={setIsTrial} />
                    </div>
                    {!isTrial && (
                      <div className="space-y-2">
                        <Label>Months to Register</Label>
                        <Input type="number" min="1" value={form.months} onChange={e => setForm(f => ({ ...f, months: e.target.value }))} />
                        {(() => {
                          const m = parseInt(form.months) || 1;
                          const disc = discountFor(m);
                          const total = monthlyPrice * m * (1 - disc / 100);
                          return (
                            <p className="text-xs text-muted-foreground">
                              GHS {monthlyPrice.toLocaleString()} × {m} month{m !== 1 ? "s" : ""}
                              {disc > 0 ? ` − ${disc}% discount` : ""} = <strong>GHS {total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                            </p>
                          );
                        })()}
                      </div>
                    )}
                    {isTrial && (
                      <p className="text-xs text-amber-700 bg-amber-50 rounded px-3 py-2 border border-amber-200">
                        Trial expires <strong>{new Date(Date.now() + 14 * 864e5).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong>. After that the school enters a 3-day grace period, then gets locked until they subscribe.
                      </p>
                    )}
                  </div>
                </div>
                </div>
                <Button type="submit" className="w-full shrink-0" disabled={createSchool.isPending}>
                  {createSchool.isPending ? "Creating…" : "Create School"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Platform Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="w-4 h-4" />
              Platform Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Monthly Fee per School</p>
                {editingPrice ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">GHS</span>
                    <Input className="w-28 h-8 text-sm" type="number" min="1" value={priceInput} onChange={e => setPriceInput(e.target.value)} autoFocus />
                    <Button size="sm" onClick={handleSavePrice} disabled={savingPrice}>{savingPrice ? "Saving…" : "Save"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingPrice(false); setPriceInput(String(monthlyPrice)); }}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">GHS {monthlyPrice.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                    <Button size="sm" variant="outline" onClick={() => setEditingPrice(true)} className="h-7 text-xs">Edit</Button>
                  </div>
                )}
              </div>
              <div className="border-l pl-4 ml-2 space-y-0.5 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Prepayment Discounts</p>
                <p>1–11 months: full price</p>
                <p className="text-green-700 font-medium">12+ months: 5% off</p>
              </div>
              <div className="border-l pl-4 ml-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Grace Policy</p>
                <p>7-day countdown warning shown to school admin</p>
                <p>3-day grace period after expiry</p>
                <p className="text-destructive font-medium">Auto-deactivated after grace</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit School Dialog */}
        {editSchool && (
          <Dialog open={!!editSchool} onOpenChange={() => setEditSchool(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Edit School</DialogTitle></DialogHeader>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2"><Label>School Name</Label><Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Contact Email</Label><Input type="email" value={editForm.contactEmail} onChange={e => setEditForm(f => ({ ...f, contactEmail: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Contact Phone</Label><Input value={editForm.contactPhone} onChange={e => setEditForm(f => ({ ...f, contactPhone: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Address</Label><Input value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} /></div>
                <Button type="submit" className="w-full" disabled={updateSchool.isPending}>Save Changes</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Reset Password Dialog */}
        {resetSchool && (
          <Dialog open={!!resetSchool} onOpenChange={() => { setResetSchool(null); setNewPassword(""); }}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><KeyRound className="w-4 h-4" />Reset Admin Password</DialogTitle></DialogHeader>
              <div className="text-sm text-muted-foreground mb-2">Resetting password for <strong>{resetSchool.name}</strong></div>
              <form onSubmit={e => { e.preventDefault(); resetPassword.mutate({ schoolId: resetSchool.id, password: newPassword }); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6} autoComplete="off" />
                </div>
                <Button type="submit" className="w-full" disabled={resetPassword.isPending}>{resetPassword.isPending ? "Resetting..." : "Reset Password"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Top-Up Dialog */}
        {topUpSchool && (
          <Dialog open={!!topUpSchool} onOpenChange={() => { setTopUpSchool(null); setTopUpMonths("1"); setTopUpPreview(null); setPaymentResult(null); }}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarClock className="w-4 h-4" />Extend Subscription</DialogTitle></DialogHeader>

              {paymentResult ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center space-y-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="font-semibold text-green-800">Payment confirmed!</p>
                    <p className="text-sm text-green-700">
                      Subscription active until <strong>{paymentResult.newExpiryDate}</strong>
                    </p>
                  </div>
                  <Button className="w-full" variant="outline" onClick={() => { setTopUpSchool(null); setTopUpMonths("1"); setTopUpPreview(null); setPaymentResult(null); }}>Close</Button>
                </div>
              ) : (
                <>
                  <div className="text-sm mb-3">
                    <p className="font-medium">{topUpSchool.name}</p>
                    {topUpSchool.subscription?.expiryDate && (
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Current expiry: <strong>{topUpSchool.subscription.expiryDate}</strong>
                        {" "}({daysUntil(topUpSchool.subscription.expiryDate)} days)
                      </p>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Number of Months</Label>
                      <Input type="number" min="1" value={topUpMonths} onChange={e => setTopUpMonths(e.target.value)} autoFocus />
                      {previewDiscount > 0 && (
                        <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                          <Percent className="w-3 h-3" />{previewDiscount}% discount applies
                          {previewIsCustom ? " (special rate)" : " (12+ months)"}
                        </p>
                      )}
                    </div>
                    {topUpPreview && (
                      <div className="rounded-lg bg-slate-50 border p-3 text-sm space-y-1">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Rate</span><span>GHS {topUpPreview.monthlyPrice?.toLocaleString()} × {topUpPreview.months} mo</span>
                        </div>
                        {topUpPreview.discount > 0 && (
                          <div className="flex justify-between text-green-700">
                            <span>Discount ({topUpPreview.discount}%)</span>
                            <span>−GHS {(topUpPreview.monthlyPrice * topUpPreview.months * topUpPreview.discount / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subscription</span><span>GHS {topUpPreview.amount?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Paystack fee (1.5% + GHS 0.50)</span>
                          <span>GHS {topUpPreview.paystackFee?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                          <span>Total charged</span><span>GHS {topUpPreview.chargeAmount?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-primary text-xs mt-1">
                          <span>New expiry after payment</span><strong>{topUpPreview.newExpiry}</strong>
                        </div>
                      </div>
                    )}
                    <Button
                      className="w-full bg-[#0BA4DB] hover:bg-[#0994C8] text-white"
                      disabled={paying || !topUpMonths || parseInt(topUpMonths) < 1}
                      onClick={handlePayWithPaystack}>
                      {paying ? "Opening payment…" : `Pay GHS ${topUpPreview ? topUpPreview.chargeAmount?.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "…"} with Paystack`}
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Special Discount Dialog */}
        {discountSchool && (
          <Dialog open={!!discountSchool} onOpenChange={() => { setDiscountSchool(null); setDiscountInput(""); }}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-600" />Special Discount
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Set a fixed discount for <strong className="text-foreground">{discountSchool.name}</strong> that overrides the standard bulk-month pricing.
                </div>
                {discountSchool.customDiscountPct != null && (
                  <div className="rounded-md bg-purple-50 border border-purple-200 p-3 flex items-center justify-between">
                    <span className="text-sm text-purple-800 font-medium">
                      Current: {discountSchool.customDiscountPct}% special rate
                    </span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-purple-700 gap-1" onClick={() => handleSetDiscount(true)} disabled={savingDiscount}>
                      <X className="w-3 h-3" />Clear
                    </Button>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Discount Percentage (0–100%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={discountInput}
                      onChange={e => setDiscountInput(e.target.value)}
                      placeholder="e.g. 15"
                      autoFocus
                    />
                    <span className="text-sm font-medium text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">When set, this replaces the standard 5% annual discount for this school on every renewal.</p>
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={() => handleSetDiscount(false)} disabled={savingDiscount || !discountInput}>
                  {savingDiscount ? "Saving…" : "Save Special Discount"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* All Schools Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              All Schools ({schools?.length ?? 0})
              <Button size="sm" variant="ghost" onClick={() => refetch()} className="ml-auto h-7 text-xs gap-1">
                <RefreshCw className="w-3 h-3" />Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools?.map((school: any) => (
                  <TableRow key={school.id}>
                    <TableCell>
                      <div className="font-medium">{school.name}</div>
                      {school.slug && (
                        <div className="text-xs text-blue-500 font-mono">/login?school={school.slug}</div>
                      )}
                      {school.address && (
                        <div className="text-xs text-muted-foreground">{school.address}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{school.contactEmail}</div>
                      <div className="text-xs text-muted-foreground">{school.contactPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {subStatusBadge(school.subscription)}
                        {school.subscription?.expiryDate && (
                          <span className="text-xs text-muted-foreground">
                            Expires {school.subscription.expiryDate}
                          </span>
                        )}
                        {school.customDiscountPct != null && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5 w-fit">
                            <Tag className="w-3 h-3" />{school.customDiscountPct}% special
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={school.status === "active" ? "default" : "secondary"} className="capitalize">{school.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {school.createdAt ? format(new Date(school.createdAt), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" title="Copy school login link"
                          onClick={() => {
                            if (!school.slug) return;
                            const url = `${window.location.origin}/login?school=${school.slug}`;
                            navigator.clipboard.writeText(url).then(() => {
                              setCopiedId(school.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            });
                          }}>
                          {copiedId === school.id
                            ? <Check className="w-4 h-4 text-green-600" />
                            : <Link2 className="w-4 h-4 text-blue-500" />}
                        </Button>
                        <Button variant="ghost" size="sm" title="Extend subscription"
                          onClick={() => { setTopUpSchool(school); setTopUpMonths("1"); }}>
                          <CalendarClock className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Set special discount"
                          onClick={() => { setDiscountSchool(school); setDiscountInput(school.customDiscountPct != null ? String(school.customDiscountPct) : ""); }}
                          className={school.customDiscountPct != null ? "text-purple-600" : ""}>
                          <Tag className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Edit school"
                          onClick={() => { setEditSchool(school); setEditForm({ name: school.name, contactEmail: school.contactEmail, contactPhone: school.contactPhone || "", address: school.address || "" }); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Reset admin password" onClick={() => { setResetSchool(school); setNewPassword(""); }}>
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Unlock admin account (clear login lockout)" onClick={() => unlockAdmin.mutate(school.id)} disabled={unlockAdmin.isPending}>
                          <LockOpen className="w-4 h-4 text-amber-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleStatus(school)} title={school.status === "active" ? "Deactivate" : "Activate"}>
                          {school.status === "active" ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="sm" title="Permanently delete school" onClick={() => { setDeleteSchool(school); setDeleteTyped(""); }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!schools?.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No schools found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Delete Single School Dialog */}
      <Dialog open={!!deleteSchool} onOpenChange={(v) => { if (!v) { setDeleteSchool(null); setDeleteTyped(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Permanently Delete School
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive space-y-1">
              <p className="font-semibold">This action cannot be undone.</p>
              <p>All students, teachers, classes, payments, attendance, report cards, and every other record for <strong>{deleteSchool?.name}</strong> will be permanently deleted.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type <span className="font-mono font-bold">{deleteSchool?.name}</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteTyped}
                onChange={e => setDeleteTyped(e.target.value)}
                placeholder={deleteSchool?.name}
              />
            </div>
            <Button
              variant="destructive"
              className="w-full"
              disabled={deleteTyped !== deleteSchool?.name || deleting}
              onClick={handleDeleteSchool}
            >
              {deleting ? "Deleting…" : "Permanently Delete School"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wipe All Data Confirmation Dialog */}
      <Dialog open={wipeOpen} onOpenChange={(v) => { setWipeOpen(v); if (!v) setWipeTyped(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Reset All School Data
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive space-y-1">
              <p className="font-semibold">This action is irreversible.</p>
              <p>All schools, students, teachers, payments, classes, and linked data will be permanently deleted. Your super admin account will be preserved.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wipe-confirm">
                Type <span className="font-mono font-bold">DELETE ALL</span> to confirm
              </Label>
              <Input
                id="wipe-confirm"
                value={wipeTyped}
                onChange={(e) => setWipeTyped(e.target.value)}
                placeholder="DELETE ALL"
                className="font-mono"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setWipeOpen(false); setWipeTyped(""); }}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={wipeTyped !== "DELETE ALL" || wiping}
                onClick={handleWipeAllData}
              >
                {wiping ? "Wiping…" : "Wipe All Data"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Broadcast Dialog */}
      <Dialog open={emailOpen} onOpenChange={v => { setEmailOpen(v); if (!v) setEmailResult(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Email Subscribers
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1 space-y-4">
            {emailConfigured === false && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                <p className="font-semibold mb-1">Email not configured</p>
                <p>Set the following environment variables to enable email sending:</p>
                <code className="text-xs block mt-1 font-mono">SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM</code>
              </div>
            )}
            {emailResult && (
              <div className={`rounded-md p-3 text-sm flex items-start gap-2 ${emailResult.failed === 0 ? "bg-green-50 border border-green-200 text-green-800" : "bg-amber-50 border border-amber-200 text-amber-800"}`}>
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Email sent</p>
                  <p>{emailResult.sent} delivered{emailResult.failed > 0 ? `, ${emailResult.failed} failed` : ""}.</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    checked={emailTarget === "all"}
                    onChange={() => setEmailTarget("all")}
                    className="accent-primary"
                  />
                  All schools ({(schools ?? []).length})
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    checked={Array.isArray(emailTarget)}
                    onChange={() => setEmailTarget([])}
                    className="accent-primary"
                  />
                  Select specific schools
                </label>
              </div>
              {Array.isArray(emailTarget) && (
                <div className="border rounded-md max-h-36 overflow-y-auto divide-y">
                  {(schools ?? []).map((s: any) => (
                    <label key={s.id} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(emailTarget as number[]).includes(s.id)}
                        onChange={e => {
                          setEmailTarget(prev =>
                            Array.isArray(prev)
                              ? e.target.checked ? [...prev, s.id] : prev.filter((id: number) => id !== s.id)
                              : [s.id]
                          );
                        }}
                        className="accent-primary"
                      />
                      <span className="flex-1 truncate">{s.name}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[160px]">{s.contactEmail}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="e.g. Important platform update"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-body">Message</Label>
              <Textarea
                id="email-body"
                placeholder="Write your message here…"
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">Plain text supported. Line breaks are preserved.</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end shrink-0 pt-2 border-t">
              <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim() || emailConfigured === false || (Array.isArray(emailTarget) && emailTarget.length === 0)}
              >
                {sendingEmail ? "Sending…" : (
                  <><Mail className="w-4 h-4 mr-2" />Send Email</>
                )}
              </Button>
            </div>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}
