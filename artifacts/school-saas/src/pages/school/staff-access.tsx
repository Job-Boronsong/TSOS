import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useSchoolId } from "@/lib/school-hooks";
import { SchoolAdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { UserCog, Plus, Trash2, KeyRound, Copy, CheckCircle2, RefreshCw, Loader2, Eye, EyeOff, Pencil } from "lucide-react";

interface StaffUser {
  id: number;
  username: string;
  name: string;
  role: "head_teacher" | "finance_officer";
  mustChangePassword: boolean;
  createdAt: string;
}

interface Props {
  params: { schoolSlug: string };
}

const ROLE_LABELS: Record<string, string> = {
  head_teacher: "Head Teacher",
  finance_officer: "Finance Officer",
};

const ROLE_COLORS: Record<string, string> = {
  head_teacher: "bg-blue-100 text-blue-800 border-blue-200",
  finance_officer: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function StaffAccessPage({ params }: Props) {
  const { schoolSlug } = params;
  const schoolId = useSchoolId();
  const { toast } = useToast();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createRole, setCreateRole] = useState<"head_teacher" | "finance_officer">("head_teacher");
  const [creating, setCreating] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ username: string; tempPassword: string; name: string } | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"head_teacher" | "finance_officer">("head_teacher");
  const [editing, setEditing] = useState(false);

  const [resetTarget, setResetTarget] = useState<StaffUser | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetCredentials, setResetCredentials] = useState<{ username: string; tempPassword: string } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    setLoading(true);
    fetch(`/api/schools/${schoolId}/staff-users`, { credentials: "include" })
      .then(r => r.json())
      .then(setUsers)
      .catch(() => toast({ title: "Failed to load staff accounts", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [schoolId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim() || !schoolId) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/staff-users`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim(), role: createRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: err.error ?? "Failed to create account", variant: "destructive" }); return;
      }
      const user = await res.json();
      setUsers(prev => [...prev, { id: user.id, username: user.username, name: user.name, role: user.role, mustChangePassword: user.mustChangePassword, createdAt: user.createdAt }]);
      setNewCredentials({ username: user.username, tempPassword: user.tempPassword, name: user.name });
      setCreateOpen(false);
      setCreateName("");
      setCreateRole("head_teacher");
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser || !schoolId) return;
    setEditing(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/staff-users/${editUser.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), role: editRole }),
      });
      if (!res.ok) { toast({ title: "Failed to update", variant: "destructive" }); return; }
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setEditOpen(false);
      toast({ title: "Account updated" });
    } finally {
      setEditing(false);
    }
  }

  async function handleResetPassword() {
    if (!resetTarget || !schoolId) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/staff-users/${resetTarget.id}/reset-password`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) { toast({ title: "Failed to reset password", variant: "destructive" }); return; }
      const data = await res.json();
      setResetCredentials({ username: resetTarget.username, tempPassword: data.tempPassword });
      setResetTarget(null);
    } finally {
      setResetting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !schoolId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/staff-users/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) { toast({ title: "Failed to delete account", variant: "destructive" }); return; }
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast({ title: "Account removed" });
    } finally {
      setDeleting(false);
    }
  }

  function copyCredentials(username: string, password: string) {
    navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const headTeachers = users.filter(u => u.role === "head_teacher");
  const financeOfficers = users.filter(u => u.role === "finance_officer");

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Staff Access</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage additional staff accounts for your school. These accounts have limited access based on their role.
            </p>
          </div>
          <Button onClick={() => { setCreateOpen(true); setCreateName(""); setCreateRole("head_teacher"); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Staff Account
          </Button>
        </div>

        {/* Role explanations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <UserCog className="w-4 h-4 text-blue-700" />
              <span className="font-semibold text-blue-900 text-sm">Head Teacher</span>
            </div>
            <p className="text-xs text-blue-700">
              Full access to all school data — students, classes, attendance, teachers, reports, finance, and more. Cannot modify school settings or billing.
            </p>
          </div>
          <div className="rounded-xl border p-4 bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <UserCog className="w-4 h-4 text-emerald-700" />
              <span className="font-semibold text-emerald-900 text-sm">Finance Officer</span>
            </div>
            <p className="text-xs text-emerald-700">
              Restricted to financial modules only — Finance, Payroll, and Feeding. Cannot access student records, class management, or school settings.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading accounts…
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <UserCog className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">No staff accounts yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Add a head teacher or finance officer to get started.</p>
            <Button variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Staff Account
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {[
              { label: "Head Teachers", list: headTeachers },
              { label: "Finance Officers", list: financeOfficers },
            ].map(({ label, list }) => (
              list.length > 0 && (
                <div key={label}>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{label}</h2>
                  <div className="rounded-xl border overflow-hidden">
                    <div className="divide-y">
                      {list.map(user => (
                        <div key={user.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                            {user.name[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{user.name}</span>
                              <Badge variant="outline" className={`text-xs ${ROLE_COLORS[user.role]}`}>
                                {ROLE_LABELS[user.role]}
                              </Badge>
                              {user.mustChangePassword && (
                                <Badge variant="outline" className="text-xs text-amber-700 bg-amber-50 border-amber-200">
                                  Must change password
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{user.username}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setEditUser(user); setEditName(user.name); setEditRole(user.role); setEditOpen(true); }}
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setResetTarget(user)}
                              title="Reset password"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteTarget(user)}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add Staff Account
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                placeholder="e.g. Kwame Asante"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role <span className="text-destructive">*</span></Label>
              <Select value={createRole} onValueChange={v => setCreateRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="head_teacher">Head Teacher — Full access (no settings)</SelectItem>
                  <SelectItem value="finance_officer">Finance Officer — Finance, Payroll, Feeding only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              A username and temporary password will be generated automatically. The user must change their password on first login.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating || !createName.trim()}>
                {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : "Create Account"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" /> Edit Staff Account
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={v => setEditRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="head_teacher">Head Teacher</SelectItem>
                  <SelectItem value="finance_officer">Finance Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={editing}>
                {editing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* New credentials dialog */}
      <Dialog open={!!newCredentials} onOpenChange={v => { if (!v) setNewCredentials(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" /> Account Created
            </DialogTitle>
          </DialogHeader>
          {newCredentials && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share these credentials with <strong>{newCredentials.name}</strong>. The password is shown only once.
              </p>
              <div className="rounded-lg border bg-slate-50 p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Username</p>
                  <p className="font-mono text-sm font-bold">{newCredentials.username}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Temporary Password</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-bold flex-1">
                      {showPassword ? newCredentials.tempPassword : "••••••••••"}
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => copyCredentials(newCredentials.username, newCredentials.tempPassword)}
              >
                {copied ? <><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />Copied!</> : <><Copy className="w-4 h-4 mr-2" />Copy Credentials</>}
              </Button>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                The user will be prompted to change their password on first login.
              </p>
              <div className="flex justify-end">
                <Button onClick={() => { setNewCredentials(null); setShowPassword(false); }}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset password confirm */}
      <AlertDialog open={!!resetTarget} onOpenChange={v => { if (!v) setResetTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Generate a new temporary password for <strong>{resetTarget?.name}</strong>? They will need to change it on next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword} disabled={resetting}>
              {resetting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Resetting…</> : "Reset Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset credentials result */}
      <Dialog open={!!resetCredentials} onOpenChange={v => { if (!v) setResetCredentials(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" /> Password Reset
            </DialogTitle>
          </DialogHeader>
          {resetCredentials && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">New temporary password (shown once):</p>
              <div className="rounded-lg border bg-slate-50 p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Username</p>
                  <p className="font-mono text-sm font-bold">{resetCredentials.username}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">New Password</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-bold flex-1">
                      {showPassword ? resetCredentials.tempPassword : "••••••••••"}
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => copyCredentials(resetCredentials.username, resetCredentials.tempPassword)}
              >
                {copied ? <><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />Copied!</> : <><Copy className="w-4 h-4 mr-2" />Copy Credentials</>}
              </Button>
              <div className="flex justify-end">
                <Button onClick={() => { setResetCredentials(null); setShowPassword(false); }}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Account</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently remove the account for <strong>{deleteTarget?.name}</strong>? They will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Removing…</> : "Remove Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SchoolAdminLayout>
  );
}
