import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTeacherAuth } from "@/lib/teacher-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, Eye, EyeOff, Building2, AlertCircle } from "lucide-react";

export default function TeacherLogin() {
  const { login } = useTeacherAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slugSchool, setSlugSchool] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("school");
    if (!slug) return;
    fetch(`/api/auth/school-by-slug/${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.name) setSlugSchool({ name: d.name }); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate("/teacher/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Teacher Portal</h1>
          {slugSchool
            ? <p className="text-muted-foreground text-sm mt-1">Signing in to <strong className="text-foreground">{slugSchool.name}</strong></p>
            : <p className="text-muted-foreground text-sm mt-1">Sign in to access your classes and student scores</p>
          }
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            {slugSchool ? (
              <div className="flex items-center gap-2 mt-1 rounded-md border bg-muted/50 px-3 py-2">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium">{slugSchool.name}</span>
              </div>
            ) : (
              <CardDescription>Use the credentials provided by your school admin</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                error.toLowerCase().includes("subscription") ? (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      School Subscription Expired
                    </div>
                    <p className="text-xs text-amber-700">
                      Your school's subscription has expired. Please contact your school administrator to renew access.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )
              )}
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="Your assigned username"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Your password"
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          School admin?{" "}
          <a href="/login" className="underline hover:text-foreground">Sign in here</a>
        </p>
      </div>
    </div>
  );
}
