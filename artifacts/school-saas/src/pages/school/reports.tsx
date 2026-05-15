import { useSchoolId } from "@/lib/school-hooks";
import { useGetFinanceSummary, useListAttendance, useListStudents, useListTeachers } from "@workspace/api-client-react";
import { useLocalExpenditures } from "@/lib/offline-hooks";
import { SchoolAdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, CheckSquare, DollarSign, TrendingDown } from "lucide-react";
import { format } from "date-fns";

interface Props {
  params: { schoolSlug: string };
}

const EXPENSE_CATEGORIES = [
  { value: "salaries", label: "Salaries" },
  { value: "utilities", label: "Utilities" },
  { value: "supplies", label: "Supplies" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other / Miscellaneous" },
];

export default function Reports({ params }: Props) {
  const { schoolSlug } = params;
  const schoolId = useSchoolId();
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: summary } = useGetFinanceSummary(parseInt(schoolId));
  const { data: students } = useListStudents(parseInt(schoolId));
  const { data: teachers } = useListTeachers(parseInt(schoolId));
  const { data: todayAttendance } = useListAttendance(parseInt(schoolId), { date: today });
  const expenditures = useLocalExpenditures(schoolId);

  const activeStudents = students?.filter(s => s.status === "active").length ?? 0;
  const activeTeachers = teachers?.filter(t => t.status === "active").length ?? 0;
  const presentToday = todayAttendance?.filter((a: any) => a.status === "present").length ?? 0;
  const totalMarked = todayAttendance?.length ?? 0;
  const attendanceRate = totalMarked > 0 ? Math.round((presentToday / totalMarked) * 100) : 0;

  const categoryBreakdown = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: (expenditures ?? []).filter(e => e.category === cat.value).reduce((sum, e) => sum + Number(e.amount), 0),
    count: (expenditures ?? []).filter(e => e.category === cat.value).length,
  })).filter(c => c.count > 0);

  const totalExpenditure = (expenditures ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">School performance overview and summary reports.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students?.length ?? 0}</div>
              <p className="text-xs text-muted-foreground">{activeStudents} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachers?.length ?? 0}</div>
              <p className="text-xs text-muted-foreground">{activeTeachers} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <CheckSquare className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">{presentToday} of {totalMarked} marked</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Cash</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(summary?.netCash ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${(summary?.netCash ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Fees vs expenses</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Fees Collected</span>
                  <span className="text-sm font-semibold text-green-600">${(summary?.feesCollected ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Fees Expected</span>
                  <span className="text-sm font-semibold">${(summary?.feesExpected ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Expenditure</span>
                  <span className="text-sm font-semibold text-red-600">${(summary?.expenditureTotal ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Sales Total</span>
                  <span className="text-sm font-semibold text-blue-600">${(summary?.salesTotal ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium">Outstanding Arrears</span>
                  <span className="text-sm font-bold text-destructive">${(summary?.totalArrears ?? 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Today's Attendance Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Present", status: "present", color: "text-green-600" },
                  { label: "Absent", status: "absent", color: "text-red-600" },
                  { label: "Late", status: "late", color: "text-amber-600" },
                ].map(({ label, status, color }) => {
                  const count = todayAttendance?.filter((a: any) => a.status === status).length ?? 0;
                  return (
                    <div key={status} className="flex justify-between items-center py-2 border-b last:border-0">
                      <Badge variant="outline" className="capitalize">{label}</Badge>
                      <span className={`text-sm font-semibold ${color}`}>{count} students</span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm font-medium">Not Marked</span>
                  <span className="text-sm font-semibold text-muted-foreground">{Math.max(0, activeStudents - totalMarked)} students</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expenditure Breakdown by Category */}
        {categoryBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Expenditure Breakdown by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryBreakdown.map(cat => {
                  const pct = totalExpenditure > 0 ? Math.round((cat.total / totalExpenditure) * 100) : 0;
                  return (
                    <div key={cat.value}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{cat.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{cat.count} transaction{cat.count !== 1 ? "s" : ""}</span>
                          <span className="text-sm font-semibold text-red-600">${cat.total.toLocaleString()}</span>
                          <Badge variant="outline" className="text-xs w-12 text-center">{pct}%</Badge>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-sm font-bold text-red-600">${totalExpenditure.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              School Summary Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">Generated on {format(new Date(), "MMMM d, yyyy")}</div>
            <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50 text-sm">
              <div>
                <p className="text-muted-foreground">Enrollment</p>
                <p className="font-semibold">{activeStudents} active students</p>
              </div>
              <div>
                <p className="text-muted-foreground">Staff</p>
                <p className="font-semibold">{activeTeachers} active teachers</p>
              </div>
              <div>
                <p className="text-muted-foreground">Attendance Rate Today</p>
                <p className="font-semibold">{attendanceRate}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Collection Rate</p>
                <p className="font-semibold">{Math.round(summary?.collectionRate ?? 0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SchoolAdminLayout>
  );
}
