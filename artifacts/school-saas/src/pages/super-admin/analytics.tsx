import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, Building2, CheckCircle, XCircle, DollarSign, Clock } from "lucide-react";

interface Analytics {
  totalSchools: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  revenueByMonth: { month: string; total: number; count: number }[];
  recentPayments: { id: number; schoolName: string; amount: string; months: number; createdAt: string }[];
  expiringSoon: { schoolId: number; schoolName: string; expiryDate: string }[];
}

export default function Analytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalRevenue = data?.revenueByMonth.reduce((s, r) => s + Number(r.total), 0) ?? 0;

  function daysLeft(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Platform Analytics</h1>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Building2 className="w-4 h-4" />Total Schools</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{loading ? "—" : data?.totalSchools}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" />Active</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-green-600">{loading ? "—" : data?.activeSubscriptions}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" />Expired</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-red-500">{loading ? "—" : data?.expiredSubscriptions}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><DollarSign className="w-4 h-4 text-blue-600" />Total Revenue</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-blue-600">GHS {totalRevenue.toFixed(0)}</p></CardContent>
          </Card>
        </div>

        {/* Revenue chart */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-4 h-4" />Monthly Revenue (GHS)</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">Loading…</div>
            ) : (data?.revenueByMonth.length ?? 0) === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">No revenue data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data?.revenueByMonth}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [`GHS ${Number(v).toFixed(2)}`, "Revenue"]} />
                  <Area type="monotone" dataKey="total" stroke="#2563eb" fill="url(#rev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Expiring soon */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-amber-600"><Clock className="w-4 h-4" />Expiring Within 7 Days</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground text-sm">Loading…</p> :
                (data?.expiringSoon.length ?? 0) === 0
                  ? <p className="text-muted-foreground text-sm">No schools expiring soon</p>
                  : <div className="space-y-2">
                    {data?.expiringSoon.map(s => (
                      <div key={s.schoolId} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{s.schoolName}</span>
                        <Badge variant="outline" className={`${daysLeft(s.expiryDate) <= 1 ? "border-red-500 text-red-600" : "border-amber-500 text-amber-600"}`}>
                          {daysLeft(s.expiryDate) <= 0 ? "Today" : `${daysLeft(s.expiryDate)}d`}
                        </Badge>
                      </div>
                    ))}
                  </div>
              }
            </CardContent>
          </Card>

          {/* Recent payments */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-4 h-4" />Recent Payments</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground text-sm">Loading…</p> :
                (data?.recentPayments.length ?? 0) === 0
                  ? <p className="text-muted-foreground text-sm">No payments yet</p>
                  : <div className="space-y-2">
                    {data?.recentPayments.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{p.schoolName}</span>
                          <span className="text-muted-foreground ml-2">{p.months} month{p.months !== 1 ? "s" : ""}</span>
                        </div>
                        <span className="text-green-600 font-medium">GHS {Number(p.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
              }
            </CardContent>
          </Card>
        </div>

        {/* Payments bar chart */}
        <Card>
          <CardHeader><CardTitle>Transactions Per Month</CardTitle></CardHeader>
          <CardContent>
            {loading || (data?.revenueByMonth.length ?? 0) === 0 ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data?.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v: any) => [v, "Payments"]} />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
