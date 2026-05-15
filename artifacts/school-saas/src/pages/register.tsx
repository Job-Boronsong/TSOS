import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, Building2, Mail, Phone, MapPin, User, Lock, Eye, EyeOff, CheckCircle2, Copy, Check, ArrowLeft } from "lucide-react";

type Success = { slug: string; adminUsername: string; loginUrl: string; trialExpiry: string };

export default function Register() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    schoolName: "", address: "", contactEmail: "", contactPhone: "",
    adminName: "", password: "", confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Success | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Registration failed. Please try again."); return; }
      // Always build loginUrl from the browser's own origin so it's accurate
      setSuccess({ ...data, loginUrl: `${window.location.origin}/login?school=${data.slug}` });
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (!success) return;
    const text = `School login URL: ${success.loginUrl}\nAdmin username: ${success.adminUsername}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">You're all set!</h1>
            <p className="text-slate-500 mt-2">Your school has been registered. Your 14-day free trial starts today.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your login details</CardTitle>
              <CardDescription>Save these now — you'll need them to sign in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 border rounded-lg p-4 font-mono text-sm space-y-3">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Login URL</p>
                  <p className="text-blue-600 break-all text-xs">{success.loginUrl}</p>
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Admin username</p>
                    <p className="font-semibold text-slate-800">{success.adminUsername}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-0.5">Trial expires</p>
                    <p className="font-semibold text-green-700">
                      {new Date(success.trialExpiry + "T12:00:00Z").toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center">We've also sent these details to your email.</p>

              <Button variant="outline" className="w-full" onClick={copyAll}>
                {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy Login Details"}
              </Button>

              <Button className="w-full" onClick={() => navigate(success.loginUrl.replace(window.location.origin, ""))}>
                Go to Your School Portal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="TSOS" className="h-14 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">Register your school</h1>
          <p className="text-slate-500 mt-1">Start your free 14-day trial — no credit card required</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* School details */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">School Details</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>School Name <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="e.g. Greenfield Academy" value={form.schoolName} onChange={set("schoolName")} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact Email <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" type="email" placeholder="school@example.com" value={form.contactEmail} onChange={set("contactEmail")} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Phone <span className="text-slate-400 font-normal">(optional)</span></Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="0XX XXX XXXX" value={form.contactPhone} onChange={set("contactPhone")} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Address <span className="text-slate-400 font-normal">(optional)</span></Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Town / City" value={form.address} onChange={set("address")} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t" />

              {/* Admin account */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Admin Account</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Your Full Name <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="e.g. Kwame Asante" value={form.adminName} onChange={set("adminName")} required />
                    </div>
                    <p className="text-xs text-slate-400">Your admin username will be generated from your first name.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Password <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9 pr-10" type={showPw ? "text" : "password"} placeholder="Min. 8 characters" value={form.password} onChange={set("password")} required minLength={8} />
                      <button type="button" className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(!showPw)}>
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirm Password <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9 pr-10" type={showConfirm ? "text" : "password"} placeholder="Re-enter password" value={form.confirmPassword} onChange={set("confirmPassword")} required />
                      <button type="button" className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirm(!showConfirm)}>
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Registering..." : "Create My School Account"}
              </Button>

              <p className="text-center text-xs text-slate-500">
                Already registered?{" "}
                <button type="button" onClick={() => navigate("/login")} className="underline hover:text-slate-800">Sign in here</button>
              </p>
            </form>
          </CardContent>
        </Card>

        <button onClick={() => navigate("/")} className="mt-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mx-auto">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </button>
      </div>
    </div>
  );
}
