import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useListSchools, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Lock, User as UserIcon, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  schoolId: z.string().optional(),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: schools } = useListSchools();
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lockMsg, setLockMsg] = useState<string | null>(null);
  const [usernameHint, setUsernameHint] = useState<string | null>(null);
  const [slugSchool, setSlugSchool] = useState<{ id: number; name: string; slug: string } | null>(null);
  const slugResolved = useRef(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", schoolId: "" },
  });

  // Resolve ?school=slug param on first load
  useEffect(() => {
    if (slugResolved.current) return;
    slugResolved.current = true;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("school");
    if (!slug) return;
    fetch(`/api/auth/school-by-slug/${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.id) {
          setSlugSchool(d);
          form.setValue("schoolId", String(d.id));
        }
      })
      .catch(() => {});
  }, []);

  const selectedSchoolId = form.watch("schoolId");
  const watchedUsername = form.watch("username");

  // Auto-switch to admin mode when "superadmin" is typed
  useEffect(() => {
    if (watchedUsername === "superadmin" && !isAdminLogin) {
      setIsAdminLogin(true);
    }
  }, [watchedUsername, isAdminLogin]);

  useEffect(() => {
    if (!selectedSchoolId || isAdminLogin) { setUsernameHint(null); return; }
    fetch(`/api/auth/school-username-hint/${selectedSchoolId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.username) {
          setUsernameHint(d.username);
          form.setValue("username", d.username);
        }
      })
      .catch(() => setUsernameHint(null));
  }, [selectedSchoolId, isAdminLogin]);

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsPending(true);
    setErrorMsg(null);
    setLockMsg(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          schoolId: isAdminLogin ? undefined : (values.schoolId ? parseInt(values.schoolId) : undefined),
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.status === 423) {
        setLockMsg(data.error ?? "Account is locked. Please try again later.");
        return;
      }

      if (!res.ok) {
        setErrorMsg(data.error ?? "Invalid credentials");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });

      if (data.user?.mustChangePassword) {
        setLocation("/change-password");
        return;
      }

      if (data.user?.role === "super_admin") {
        setLocation("/super-admin");
      } else if (data.user?.role === "school_admin") {
        // Use slug from login response; fall back to auth/me if it's missing
        let slug = data.schoolSlug as string | null | undefined;
        if (!slug) {
          try {
            const meRes = await fetch("/api/auth/me", { credentials: "include" });
            if (meRes.ok) {
              const me = await meRes.json();
              slug = me.school?.slug ?? null;
            }
          } catch { /* ignore */ }
        }
        if (slug) {
          setLocation(`/school/${slug}/dashboard`);
        }
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Torrential School Operations Suite" className="h-20 w-auto" />
        </div>
        <h2 className="mt-2 text-center text-lg font-semibold tracking-tight text-slate-600 dark:text-slate-300">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              {slugSchool
                ? <>Signing in to <strong>{slugSchool.name}</strong></>
                : "Enter your credentials to access your account."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lockMsg && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{lockMsg}</AlertDescription>
              </Alert>
            )}
            {errorMsg && !lockMsg && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {!isAdminLogin && (
                  slugSchool ? (
                    <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2.5">
                      <Building2 className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">{slugSchool.name}</span>
                    </div>
                  ) : (
                  <FormField
                    control={form.control}
                    name="schoolId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                <SelectValue placeholder="Select your school" />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {schools?.map((school) => (
                              <SelectItem key={school.id} value={school.id.toString()}>
                                {school.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  )
                )}

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Enter your username" className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      {usernameHint && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Username auto-filled from school records. Only your password is needed.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type="password" placeholder="••••••••" className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isPending || !!lockMsg}>
                  {isPending ? "Signing in..." : "Sign in"}
                </Button>

                <div className="text-center mt-4">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => { setIsAdminLogin(!isAdminLogin); setErrorMsg(null); setLockMsg(null); }}
                    className="text-xs text-muted-foreground"
                  >
                    {isAdminLogin ? "Sign in as School Admin" : "Sign in as Super Admin"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
