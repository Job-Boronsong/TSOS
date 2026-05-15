import { useState } from "react";
import { useLocation } from "wouter";
import { useTeacherAuth } from "@/lib/teacher-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function TeacherChangePassword() {
  const { changePassword, session } = useTeacherAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState({ current: false, next: false });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.next !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.next.length < 6) { setError("New password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await changePassword(form.current, form.next);
      navigate("/teacher/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Change Password</h1>
          {session?.teacher.mustChangePassword && (
            <p className="text-muted-foreground text-sm mt-1">You must change your password before continuing.</p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Set a New Password</CardTitle>
            <CardDescription>Choose a strong password at least 6 characters long.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">{error}</div>
              )}
              <div className="space-y-2">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input type={show.current ? "text" : "password"} value={form.current}
                    onChange={e => setForm(f => ({ ...f, current: e.target.value }))} required className="pr-10" />
                  <button type="button" onClick={() => setShow(s => ({ ...s, current: !s.current }))}
                    className="absolute right-3 top-2.5 text-muted-foreground">
                    {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input type={show.next ? "text" : "password"} value={form.next}
                    onChange={e => setForm(f => ({ ...f, next: e.target.value }))} required className="pr-10" />
                  <button type="button" onClick={() => setShow(s => ({ ...s, next: !s.next }))}
                    className="absolute right-3 top-2.5 text-muted-foreground">
                    {show.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Set New Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
