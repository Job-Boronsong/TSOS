import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";

const forcedSchema = z.object({
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const normalSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ForcedValues = z.infer<typeof forcedSchema>;
type NormalValues = z.infer<typeof normalSchema>;

interface ChangePasswordPageProps {
  forced?: boolean;
}

export default function ChangePasswordPage({ forced = false }: ChangePasswordPageProps) {
  const [, setLocation] = useLocation();
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const forcedForm = useForm<ForcedValues>({
    resolver: zodResolver(forcedSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const normalForm = useForm<NormalValues>({
    resolver: zodResolver(normalSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const navigateAfterPasswordChange = (role: string | undefined, schoolSlug: string | null | undefined) => {
    // Hard redirect (window.location.href) instead of client-side setLocation:
    // After a password change the React Query cache is updated, which causes
    // ChangePasswordRoute to re-render with forced=false *before* setLocation
    // fires — switching the form, stealing focus, and making it look like a loop.
    // A full page reload resets all state cleanly and avoids the race entirely.
    if (role === "super_admin") {
      window.location.href = "/super-admin";
    } else if (schoolSlug) {
      const landingPage = role === "finance_officer" ? "finance" : "dashboard";
      window.location.href = `/school/${schoolSlug}/${landingPage}`;
    }
  };

  const handleForcedSubmit = async (values: ForcedValues) => {
    setIsPending(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: values.newPassword }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        forcedForm.setError("newPassword", { message: data.error ?? "Failed to set password" });
        return;
      }
      toast({ title: "Password set", description: "Your password has been saved. Welcome!" });
      // Read slug from current session (no need to refetch — the page reload will do it)
      const schoolSlug = (session as any)?.school?.slug ?? null;
      const role = (session?.user as any)?.role as string | undefined;
      navigateAfterPasswordChange(role, schoolSlug);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong. Please try again." });
    } finally {
      setIsPending(false);
    }
  };

  const handleNormalSubmit = async (values: NormalValues) => {
    setIsPending(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        normalForm.setError("currentPassword", { message: data.error ?? "Failed to change password" });
        return;
      }
      toast({ title: "Password changed", description: "Your password has been updated successfully." });
      const schoolSlug = (session as any)?.school?.slug ?? null;
      const role = (session?.user as any)?.role as string | undefined;
      navigateAfterPasswordChange(role, schoolSlug);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong. Please try again." });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-slate-900">
          {forced ? "Set your password" : "Change password"}
        </h2>
        {forced && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Please choose a secure password before continuing.
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{forced ? "Choose your password" : "Update your password"}</CardTitle>
            <CardDescription>
              {forced
                ? "Your account requires a new password. Enter and confirm your chosen password below."
                : "Enter your current password, then choose a new one."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {forced ? (
              <Form {...forcedForm}>
                <form onSubmit={forcedForm.handleSubmit(handleForcedSubmit)} className="space-y-5">
                  <FormField
                    control={forcedForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="At least 6 characters" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={forcedForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm new password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="Repeat new password" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Saving..." : "Set password & continue"}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...normalForm}>
                <form onSubmit={normalForm.handleSubmit(handleNormalSubmit)} className="space-y-5">
                  <FormField
                    control={normalForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current password</FormLabel>
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
                  <FormField
                    control={normalForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="At least 6 characters" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={normalForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm new password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="Repeat new password" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Saving..." : "Save new password"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
