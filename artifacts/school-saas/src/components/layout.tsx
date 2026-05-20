import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useIdleTimeout } from "@/lib/useIdleTimeout";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LogOut, LayoutDashboard, Building2, Users, BookOpen, CheckSquare, DollarSign, FileText, Settings, BarChart2, Clock, CalendarDays, UserCheck, Megaphone, TrendingUp, UtensilsCrossed, Banknote, ShieldAlert, GraduationCap, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SyncStatus } from "./sync-status";
import { ChangePasswordDialog } from "./change-password-dialog";
import { MouDialog } from "./mou-dialog";
import { SubscriptionExpiredGate } from "./subscription-expired-gate";

interface AdminLayoutProps {
  children: ReactNode;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function applyThemeColor(hex: string | null | undefined) {
  const root = document.documentElement;
  if (!hex) {
    root.style.removeProperty("--primary");
    root.style.removeProperty("--primary-foreground");
    return;
  }
  const hsl = hexToHsl(hex);
  if (!hsl) return;
  root.style.setProperty("--primary", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  root.style.setProperty(
    "--primary-foreground",
    hsl.l >= 55 ? "222.2 47.4% 11.2%" : "210 40% 98%"
  );
}

export function SuperAdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();

  useIdleTimeout(() => {
    toast({ title: "Session expired", description: "You were signed out due to inactivity." });
    logout();
  });

  useEffect(() => {
    function onWarn() {
      toast({ title: "Session expiring soon", description: "You will be signed out in 1 minute due to inactivity." });
    }
    window.addEventListener("idle-warning", onWarn);
    return () => window.removeEventListener("idle-warning", onWarn);
  }, []);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-3 py-3 border-b border-sidebar-border">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Torrential School Operations Suite" className="h-10 w-auto object-contain" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/super-admin"}>
                    <Link href="/super-admin">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Overview</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.startsWith("/super-admin/schools")}>
                    <Link href="/super-admin/schools">
                      <Building2 className="w-4 h-4" />
                      <span>Schools</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.startsWith("/super-admin/analytics")}>
                    <Link href="/super-admin/analytics">
                      <BarChart2 className="w-4 h-4" />
                      <span>Analytics</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-3 space-y-2">
          <ChangePasswordDialog
            trigger={
              <Button variant="outline" className="w-full justify-start gap-2 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground bg-transparent">
                <Settings className="w-4 h-4" />
                Change Password
              </Button>
            }
          />
          <Button variant="outline" className="w-full justify-start gap-2 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground bg-transparent" onClick={() => logout()}>
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <img src={`${import.meta.env.BASE_URL}torrential-tech-logo-light.png`} alt="Torrential Technologies" className="h-4 w-auto object-contain opacity-60" />
            <p className="text-[10px] text-muted-foreground/75">Product of Torrential Technologies</p>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4 bg-background">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">Super Admin</span>
        </header>
        <div className="flex-1 p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function SchoolAdminLayout({ children, schoolSlug }: { children: ReactNode; schoolSlug: string }) {
  const [location] = useLocation();
  const { logout, session } = useAuth();
  const { toast } = useToast();
  const numericSchoolId = (session?.user as any)?.schoolId ?? null;
  const slug = schoolSlug || (session as any)?.school?.slug || "";

  useIdleTimeout(() => {
    toast({ title: "Session expired", description: "You were signed out due to inactivity." });
    logout();
  });

  useEffect(() => {
    function onWarn() {
      toast({ title: "Session expiring soon", description: "You will be signed out in 1 minute due to inactivity." });
    }
    window.addEventListener("idle-warning", onWarn);
    return () => window.removeEventListener("idle-warning", onWarn);
  }, []);

  const themeColor = (session as any)?.school?.themeColor as string | null | undefined;
  useEffect(() => {
    applyThemeColor(themeColor);
    return () => applyThemeColor(null);
  }, [themeColor]);

  const role: string = (session?.user as any)?.role ?? "school_admin";

  const allNavItems = [
    { name: "Dashboard", href: `/school/${slug}/dashboard`, icon: LayoutDashboard, roles: ["school_admin", "head_teacher", "finance_officer"] },
    { name: "Announcements", href: `/school/${slug}/announcements`, icon: Megaphone, roles: ["school_admin", "head_teacher", "finance_officer"] },
    { name: "Students", href: `/school/${slug}/students`, icon: Users, roles: ["school_admin", "head_teacher"] },
    { name: "Classes", href: `/school/${slug}/classes`, icon: BookOpen, roles: ["school_admin", "head_teacher"] },
    { name: "Attendance", href: `/school/${slug}/attendance`, icon: CheckSquare, roles: ["school_admin", "head_teacher"] },
    { name: "Teacher Attendance", href: `/school/${slug}/teacher-attendance`, icon: UserCheck, roles: ["school_admin", "head_teacher"] },
    { name: "Finance", href: `/school/${slug}/finance`, icon: DollarSign, roles: ["school_admin", "head_teacher", "finance_officer"] },
    { name: "Timetable", href: `/school/${slug}/timetable`, icon: Clock, roles: ["school_admin", "head_teacher"] },
    { name: "Calendar", href: `/school/${slug}/calendar`, icon: CalendarDays, roles: ["school_admin", "head_teacher"] },
    { name: "Teachers", href: `/school/${slug}/teachers`, icon: Users, roles: ["school_admin", "head_teacher"] },
    { name: "Reports", href: `/school/${slug}/reports`, icon: FileText, roles: ["school_admin", "head_teacher"] },
    { name: "Insights", href: `/school/${slug}/insights`, icon: TrendingUp, roles: ["school_admin", "head_teacher"] },
    { name: "Feeding", href: `/school/${slug}/feeding`, icon: UtensilsCrossed, roles: ["school_admin", "head_teacher", "finance_officer"] },
    { name: "Discipline", href: `/school/${slug}/discipline`, icon: ShieldAlert, roles: ["school_admin", "head_teacher"] },
    { name: "Payroll", href: `/school/${slug}/payroll`, icon: Banknote, roles: ["school_admin", "head_teacher", "finance_officer"] },
    { name: "Promotion", href: `/school/${slug}/promotion`, icon: GraduationCap, roles: ["school_admin", "head_teacher"] },
    { name: "Settings", href: `/school/${slug}/settings`, icon: Settings, roles: ["school_admin"] },
    { name: "Staff Access", href: `/school/${slug}/staff-access`, icon: UserCog, roles: ["school_admin"] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(role));

  const schoolName = (session as any)?.school?.name ?? "School";
  const schoolLogoUrl = (session as any)?.school?.logoUrl as string | null | undefined;
  const mouAcceptedAt = (session?.user as any)?.mouAcceptedAt;
  const showMouDialog = session && !mouAcceptedAt;

  return (
    <>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="px-3 py-3 border-b border-sidebar-border">
            {schoolLogoUrl ? (
              <div className="flex flex-col gap-1">
                <img src={schoolLogoUrl} alt={schoolName} className="h-12 w-auto object-contain max-w-full" />
                <p className="text-[10px] text-muted-foreground truncate">{schoolName}</p>
              </div>
            ) : (
              <div className="space-y-1">
                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Torrential School Operations Suite" className="h-9 w-auto object-contain" />
                <p className="text-xs text-muted-foreground truncate px-0.5">{schoolName}</p>
              </div>
            )}
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={location.startsWith(item.href)}>
                        <Link href={item.href}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border p-3 space-y-2">
            <SyncStatus schoolId={numericSchoolId} />
            <Button variant="outline" className="w-full justify-start gap-2 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground bg-transparent" onClick={() => logout()}>
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <img src={`${import.meta.env.BASE_URL}torrential-tech-logo-light.png`} alt="Torrential Technologies" className="h-4 w-auto object-contain opacity-60" />
              <p className="text-[10px] text-muted-foreground/75">Product of Torrential Technologies</p>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 items-center gap-2 border-b px-4 bg-background">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm text-muted-foreground capitalize">
              {navItems.find(n => location.startsWith(n.href))?.name ?? "Dashboard"}
            </span>
          </header>
          <div className="flex-1 p-6 lg:p-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
      <MouDialog open={!!showMouDialog} />
      <SubscriptionExpiredGate schoolId={numericSchoolId} />
    </>
  );
}
