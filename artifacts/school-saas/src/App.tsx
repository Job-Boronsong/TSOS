import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { TeacherAuthProvider, useTeacherAuth } from "@/lib/teacher-auth";
import { SyncProvider } from "@/lib/sync-context";

import Login from "@/pages/login";
import Landing from "@/pages/landing";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";
import ChangePasswordPage from "@/pages/change-password";

import SuperAdminDashboard from "@/pages/super-admin/dashboard";
import SuperAdminSchools from "@/pages/super-admin/schools";
import SuperAdminAnalytics from "@/pages/super-admin/analytics";

import SchoolDashboard from "@/pages/school/dashboard";
import Students from "@/pages/school/students";
import Classes from "@/pages/school/classes";
import Attendance from "@/pages/school/attendance";
import Finance from "@/pages/school/finance";
import Teachers from "@/pages/school/teachers";
import Reports from "@/pages/school/reports";
import InsightsPage from "@/pages/school/insights";
import SchoolSettings from "@/pages/school/settings";
import Timetable from "@/pages/school/timetable";
import AcademicCalendar from "@/pages/school/calendar";
import TeacherAttendance from "@/pages/school/teacher-attendance";
import SchoolAdminStudentReport from "@/pages/school/student-report";
import StudentProfile from "@/pages/school/student-profile";

import TeacherLogin from "@/pages/teacher/login";
import TeacherChangePassword from "@/pages/teacher/change-password";
import TeacherDashboard from "@/pages/teacher/dashboard";
import TeacherClass from "@/pages/teacher/class";
import TeacherReport from "@/pages/teacher/report";
import StudentReport from "@/pages/teacher/student-report";
import MassPrint from "@/pages/teacher/mass-print";
import CumulativeRecord from "@/pages/teacher/cumulative";
import TeacherAttendancePage from "@/pages/teacher/attendance";
import Announcements from "@/pages/school/announcements";
import FeedingPage from "@/pages/school/feeding";
import DisciplinePage from "@/pages/school/discipline";
import PayrollPage from "@/pages/school/payroll";
import PromotionPage from "@/pages/school/promotion";
import TeacherAnnouncements from "@/pages/teacher/announcements";
import TeacherCalendar from "@/pages/teacher/calendar";
import StaffAccessPage from "@/pages/school/staff-access";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 30_000,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">E</div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  if (!session) return <Redirect to="/login" />;
  if ((session.user as any)?.mustChangePassword) return <Redirect to="/change-password" />;
  return <>{children}</>;
}

// Wraps all school-admin routes: handles auth + provides SyncProvider above the page tree.
// SyncProvider MUST be above page components so useSyncContext() reads real values (not defaults).
function SchoolAdminGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const [location] = useLocation();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">E</div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  if (!session) return <Redirect to="/login" />;
  if ((session.user as any)?.mustChangePassword) return <Redirect to="/change-password" />;

  const role: string = (session?.user as any)?.role ?? "school_admin";
  const slug: string = (session as any)?.school?.slug ?? "";

  // Head teacher: cannot access settings or staff-access
  if (role === "head_teacher") {
    const restricted = ["/settings", "/staff-access"];
    if (slug && restricted.some(p => location.includes(p))) {
      return <Redirect to={`/school/${slug}/dashboard`} />;
    }
  }

  // Finance officer: restricted to finance-related pages only
  if (role === "finance_officer") {
    const allowed = ["/dashboard", "/finance", "/payroll", "/feeding", "/announcements"];
    if (slug && !allowed.some(p => location.includes(p))) {
      return <Redirect to={`/school/${slug}/finance`} />;
    }
  }

  const schoolId: number | null = (session?.user as any)?.schoolId ?? null;
  return <SyncProvider schoolId={schoolId}>{children}</SyncProvider>;
}

function TeacherGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useTeacherAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }
  if (!session) return <Redirect to="/teacher-login" />;
  if (session.teacher.mustChangePassword) return <Redirect to="/teacher/change-password" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* ── School admin auth ── */}
      <Route path="/login" component={Login} />

      <Route path="/change-password">
        {() => {
          const { session, isLoading } = useAuth();
          if (isLoading) return null;
          if (!session) return <Redirect to="/login" />;
          return <ChangePasswordPage forced={(session.user as any)?.mustChangePassword ?? false} />;
        }}
      </Route>

      {/* ── Teacher portal ── */}
      <Route path="/teacher-login" component={TeacherLogin} />

      <Route path="/teacher/change-password">
        {() => {
          const { session, isLoading } = useTeacherAuth();
          if (isLoading) return null;
          if (!session) return <Redirect to="/teacher-login" />;
          return <TeacherChangePassword />;
        }}
      </Route>

      <Route path="/teacher/dashboard">
        {() => (
          <TeacherGuard>
            <TeacherDashboard />
          </TeacherGuard>
        )}
      </Route>

      <Route path="/teacher/class/:classId">
        {(params) => (
          <TeacherGuard>
            <TeacherClass params={params} />
          </TeacherGuard>
        )}
      </Route>

      <Route path="/teacher/report/:classId/:studentId">
        {(params) => (
          <TeacherGuard>
            <TeacherReport params={params} />
          </TeacherGuard>
        )}
      </Route>

      <Route path="/teacher/student/:classId/:studentId">
        {(params) => (
          <TeacherGuard>
            <StudentReport params={params} />
          </TeacherGuard>
        )}
      </Route>

      <Route path="/teacher/class/:classId/mass-print">
        {(params) => (
          <TeacherGuard>
            <MassPrint params={params} />
          </TeacherGuard>
        )}
      </Route>

      <Route path="/teacher/class/:classId/cumulative">
        {(params) => (
          <TeacherGuard>
            <CumulativeRecord params={params} />
          </TeacherGuard>
        )}
      </Route>

      <Route path="/teacher/class/:classId/attendance">
        {(params) => (
          <TeacherGuard>
            <TeacherAttendancePage params={params} />
          </TeacherGuard>
        )}
      </Route>

      {/* ── Super admin ── */}
      <Route path="/super-admin">
        {() => (
          <AuthGuard>
            <SuperAdminDashboard />
          </AuthGuard>
        )}
      </Route>

      <Route path="/super-admin/schools">
        {() => (
          <AuthGuard>
            <SuperAdminSchools />
          </AuthGuard>
        )}
      </Route>

      {/* ── School admin ── */}
      <Route path="/school/:schoolSlug/dashboard">
        {(params) => (
          <SchoolAdminGuard>
            <SchoolDashboard params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/students/:studentId">
        {(params) => (
          <SchoolAdminGuard>
            <StudentProfile params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/students">
        {(params) => (
          <SchoolAdminGuard>
            <Students params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/classes">
        {(params) => (
          <SchoolAdminGuard>
            <Classes params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/attendance">
        {(params) => (
          <SchoolAdminGuard>
            <Attendance params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/finance">
        {(params) => (
          <SchoolAdminGuard>
            <Finance params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/teachers">
        {(params) => (
          <SchoolAdminGuard>
            <Teachers params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/reports">
        {(params) => (
          <SchoolAdminGuard>
            <Reports params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/insights">
        {(params) => (
          <SchoolAdminGuard>
            <InsightsPage params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/settings">
        {(params) => (
          <SchoolAdminGuard>
            <SchoolSettings params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/timetable">
        {(params) => (
          <SchoolAdminGuard>
            <Timetable params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/calendar">
        {(params) => (
          <SchoolAdminGuard>
            <AcademicCalendar params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/teacher-attendance">
        {(params) => (
          <SchoolAdminGuard>
            <TeacherAttendance params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/announcements">
        {(params) => (
          <SchoolAdminGuard>
            <Announcements params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/feeding">
        {(params) => (
          <SchoolAdminGuard>
            <FeedingPage params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/discipline">
        {(params) => (
          <SchoolAdminGuard>
            <DisciplinePage params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/payroll">
        {(params) => (
          <SchoolAdminGuard>
            <PayrollPage params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/promotion">
        {(params) => (
          <SchoolAdminGuard>
            <PromotionPage params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/teacher/announcements">
        {() => (
          <TeacherGuard>
            <TeacherAnnouncements />
          </TeacherGuard>
        )}
      </Route>

      <Route path="/teacher/calendar">
        {() => (
          <TeacherGuard>
            <TeacherCalendar />
          </TeacherGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/students/:studentId/report">
        {(params) => (
          <SchoolAdminGuard>
            <SchoolAdminStudentReport params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/school/:schoolSlug/staff-access">
        {(params) => (
          <SchoolAdminGuard>
            <StaffAccessPage params={params} />
          </SchoolAdminGuard>
        )}
      </Route>

      <Route path="/super-admin/analytics">
        {() => (
          <AuthGuard>
            <SuperAdminAnalytics />
          </AuthGuard>
        )}
      </Route>

      <Route path="/register" component={Register} />

      <Route path="/" component={Landing} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <TeacherAuthProvider>
              <Router />
            </TeacherAuthProvider>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
